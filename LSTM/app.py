from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import yfinance as yf
import traceback
import numpy as np

# Try importing ML dependencies, use fallback if unavailable due to local env issues
try:
    from tensorflow import keras
    import joblib
    from Input_file_Validating import validate_stock_data
    from Preprocessing import proper_preprocessing
    from Features import Feature_data
    from Data_spliting import SEQUENCE_LENGTH

    # Load model + artefacts
    model = keras.models.load_model("models/stock_lstm_v1.keras")
    scaler = joblib.load("models/scaler_v1.pkl")
    feature_names = joblib.load("models/feature_names_v1.pkl")
    HAS_ML = True
    print("ML pipeline loaded successfully.")
    
except Exception as e:
    print(f"Warning: ML dependencies couldn't be loaded ({e}). Using algorithmic fallback for predictions.")
    HAS_ML = False

app = Flask(__name__)
CORS(app)

def algorithmic_fallback_predict(df_features):
    """Composite algorithmic prediction using multiple technical signals.

    Computes a weighted score from:
      - RSI position (continuous, not just extremes)  — weight 25%
      - MACD histogram direction                       — weight 20%
      - EMA-20 vs EMA-50 crossover trend               — weight 20%
      - 5-day price momentum                            — weight 20%
      - Volume trend (recent vs average)                — weight 15%
    """
    if len(df_features) < 30:
        return 0, 0.5

    close = df_features["Close"]
    score = 0.0  # will accumulate in [-1, +1] range roughly

    # --- 1. RSI signal (weight 0.25) ---
    rsi_val = 50.0
    if "RSI_14" in df_features.columns:
        rsi_val = float(df_features["RSI_14"].iloc[-1])
        if np.isnan(rsi_val):
            rsi_val = 50.0
    # Map RSI to [-1, +1]: RSI 30 → +1 (oversold=bullish), RSI 70 → -1 (overbought=bearish)
    rsi_signal = (50 - rsi_val) / 20.0  # RSI 30 → +1, RSI 70 → -1, RSI 50 → 0
    rsi_signal = max(-1.0, min(1.0, rsi_signal))
    score += rsi_signal * 0.25

    # --- 2. MACD signal (weight 0.20) ---
    if "MACD" in df_features.columns:
        macd_now = float(df_features["MACD"].iloc[-1])
        macd_prev = float(df_features["MACD"].iloc[-2]) if len(df_features) >= 2 else macd_now
        if not np.isnan(macd_now) and not np.isnan(macd_prev):
            # Positive MACD = bullish; rising MACD = extra bullish
            direction = 1.0 if macd_now > 0 else -1.0
            momentum = 1.0 if macd_now > macd_prev else -0.5
            macd_signal = (direction * 0.6 + momentum * 0.4)
            score += max(-1.0, min(1.0, macd_signal)) * 0.20

    # --- 3. EMA crossover signal (weight 0.20) ---
    if len(close) >= 50:
        ema_20 = close.ewm(span=20, adjust=False).mean().iloc[-1]
        ema_50 = close.ewm(span=50, adjust=False).mean().iloc[-1]
        if not np.isnan(ema_20) and not np.isnan(ema_50) and ema_50 != 0:
            cross_pct = (ema_20 - ema_50) / ema_50  # positive = bullish
            ema_signal = max(-1.0, min(1.0, cross_pct * 50))  # amplify small differences
            score += ema_signal * 0.20

    # --- 4. 5-day momentum (weight 0.20) ---
    if len(close) >= 6:
        price_now = float(close.iloc[-1])
        price_5d = float(close.iloc[-6])
        if price_5d > 0 and not np.isnan(price_now) and not np.isnan(price_5d):
            mom_pct = (price_now - price_5d) / price_5d
            mom_signal = max(-1.0, min(1.0, mom_pct * 20))  # ±5% maps to ±1
            score += mom_signal * 0.20

    # --- 5. Volume trend (weight 0.15) ---
    if "Volume" in df_features.columns and len(df_features) >= 20:
        vol = df_features["Volume"].astype(float)
        recent_vol = vol.iloc[-5:].mean()
        avg_vol = vol.iloc[-20:].mean()
        if avg_vol > 0 and not np.isnan(recent_vol) and not np.isnan(avg_vol):
            vol_ratio = recent_vol / avg_vol
            # High volume on up-days is bullish, but we simplify:
            # Increasing volume + rising price → bullish
            price_rising = float(close.iloc[-1]) > float(close.iloc[-5]) if len(close) >= 6 else True
            vol_signal = (vol_ratio - 1.0) * (1.0 if price_rising else -1.0)
            vol_signal = max(-1.0, min(1.0, vol_signal))
            score += vol_signal * 0.15

    # Convert composite score [-1, +1] → probability [0.1, 0.9]
    prob = 0.5 + (score * 0.4)  # maps [-1,+1] → [0.1, 0.9]
    prob = max(0.10, min(0.90, prob))

    pred = 1 if prob > 0.45 else 0
    print(f"Fallback composite score: {score:.3f}, prob: {prob:.3f}, pred: {'UP' if pred else 'DOWN'}")
    return pred, prob

def generate_candlestick_data(ticker, period="1mo"):
    try:
        df = yf.download(ticker, period=period)
        if df.empty:
            return []
            
        # Flatten columns if multi-index
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        data = []
        for dt, row in df.iterrows():
            date_str = dt.strftime('%m/%d')
            data.append({
                "date": date_str,
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close'])
            })
            
        return data[-40:] # Return last 40 days for the chart
    except Exception as e:
        print(f"Error fetching candlestick data: {e}")
        return []

def get_status(value, type_name):
    if type_name == "rsi":
        if value > 70: return "Sell"
        if value < 30: return "Buy"
        return "Neutral"
    elif type_name == "macd":
        if value > 0: return "Buy"
        return "Sell"
    return "Neutral"

@app.route('/api/analyze', methods=['GET'])
def analyze():
    ticker = request.args.get('ticker', 'AAPL')
    if not ticker.endswith('.NS') and ticker in ['TCS', 'INFY', 'RELIANCE']:
        ticker = f"{ticker}.NS"

    print(f"Analyzing {ticker}...")
    try:
        # Fetch current data for the dashboard
        stock = yf.Ticker(ticker)
        current_price = 0
        change = "+0.00%"
        
        info = {}
        try:
            info = stock.info
            current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
            previous_close = info.get('previousClose', current_price)
            
            if current_price and previous_close and previous_close > 0:
                change_pct = ((current_price - previous_close) / previous_close) * 100
                sign = "+" if change_pct >= 0 else ""
                change = f"{sign}{change_pct:.2f}%"
        except:
            pass

        # 1. Fetch raw data up to today
        df_raw = yf.download(ticker, period="2y") # Download enough data to calculate EMA200
        
        # Flatten MultiIndex columns (yfinance issue)
        if isinstance(df_raw.columns, pd.MultiIndex):
            df_raw.columns = df_raw.columns.get_level_values(0)
            
        if "Date" not in df_raw.columns:
            df_raw = df_raw.reset_index()
            
        # Get candlestick data for UI
        candle_data = generate_candlestick_data(ticker)
        if not candle_data and not df_raw.empty:
            # Fallback to df_raw for candlestick data
            candle_data = []
            for _, row in df_raw.tail(40).iterrows():
                try:
                    dt = row['Date']
                    if hasattr(dt, 'strftime'):
                        date_str = dt.strftime('%m/%d')
                    else:
                        date_str = str(dt)
                        
                    candle_data.append({
                        "date": date_str,
                        "open": float(row['Open']),
                        "high": float(row['High']),
                        "low": float(row['Low']),
                        "close": float(row['Close'])
                    })
                except:
                    pass
                
        # Fix missing columns for preprocessing
        required = ["Date", "Close", "Volume", "High", "Low"]
        for col in required:
            if col not in df_raw.columns:
                df_raw[col] = 0

        # Calculate features manually (as fallback) or using HAS_ML
        df_processed_raw = df_raw.copy()
        
        # We'll calculate simple indicators for the UI
        df_raw["Return"] = df_raw["Close"].pct_change()
        
        # RSI
        delta = df_raw["Close"].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df_raw["RSI_14"] = 100 - (100 / (1 + rs))
        
        # MACD
        ema_12 = df_raw["Close"].ewm(span=12, adjust=False).mean()
        ema_26 = df_raw["Close"].ewm(span=26, adjust=False).mean()
        df_raw["MACD"] = ema_12 - ema_26
        
        last_row = df_raw.iloc[-1] if not df_raw.empty else None
        
        if last_row is not None:
            rsi_val = float(last_row.get("RSI_14", 50))
            if np.isnan(rsi_val): rsi_val = 50.0
            
            macd_val = float(last_row.get("MACD", 0))
            if np.isnan(macd_val): macd_val = 0.0
        else:
            rsi_val = 50.0
            macd_val = 0.0

        # Run Prediction
        pred = 1
        prob = 0.65
        prediction_type = "BULLISH"
        
        if HAS_ML:
            try:
                from Preprocessing import proper_preprocessing
                from Features import Feature_data
                
                # We need proper format for ML
                df_for_ml = df_processed_raw.copy()
                df_for_ml = proper_preprocessing(df_for_ml)
                df_feat = Feature_data(df_for_ml.copy())
                
                if len(df_feat) >= SEQUENCE_LENGTH:
                    # Make sequence
                    window = df_feat[feature_names].iloc[-SEQUENCE_LENGTH:].values.astype(np.float32)
                    window_scaled = scaler.transform(window)
                    X = window_scaled[np.newaxis, ...]
                    
                    prob = float(model.predict(X, verbose=0).flatten()[0])
                    pred = 1 if prob > 0.45 else 0
                    print(f"ML Predict -> prob: {prob}, pred: {pred}")
                else:
                    print(f"Not enough data for ML sequence ({len(df_feat)} < {SEQUENCE_LENGTH})")
                    pred, prob = algorithmic_fallback_predict(df_raw)
            except Exception as ml_e:
                print(f"ML prediction failed: {ml_e}")
                traceback.print_exc()
                pred, prob = algorithmic_fallback_predict(df_raw)
        else:
            pred, prob = algorithmic_fallback_predict(df_raw)

        prediction_type = "BULLISH" if pred == 1 else "BEARISH"

        # Get OHLCV summary from latest row
        summary_open = float(last_row.get('Open', 0)) if last_row is not None else 0
        summary_high = float(last_row.get('High', 0)) if last_row is not None else 0
        summary_low = float(last_row.get('Low', 0)) if last_row is not None else 0
        summary_close = float(last_row.get('Close', 0)) if last_row is not None else 0
        summary_volume = int(last_row.get('Volume', 0)) if last_row is not None else 0

        response_data = {
            "name": info.get('longName', ticker),
            "exchange": info.get('exchange', 'NSE'),
            "price": current_price or (summary_close if summary_close else 0),
            "change": change,
            "candleData": candle_data,
            "summary": {
                "open": summary_open,
                "high": summary_high,
                "low": summary_low,
                "close": summary_close,
                "volume": summary_volume,
                "fiftyTwoWeekHigh": float(info.get('fiftyTwoWeekHigh', 0) or 0),
                "fiftyTwoWeekLow": float(info.get('fiftyTwoWeekLow', 0) or 0),
                "marketCap": float(info.get('marketCap', 0) or 0),
            },
            "indicators": {
                "rsi": { "value": f"{rsi_val:.1f}", "status": get_status(rsi_val, "rsi") },
                "macd": { "value": f"{macd_val:.2f}", "status": get_status(macd_val, "macd") },
                "volume": { "value": "Normal", "status": "Neutral" },
                "momentum": { "value": "Strong", "status": "Buy" if change.startswith('+') else "Sell" },
                "bb": { "value": "Mid", "status": "Neutral" },
                "stoch": { "value": "50.0", "status": "Neutral" }
            },
            "prediction": { 
                "type": prediction_type, 
                "confidence": int(prob * 100) if prediction_type == "BULLISH" else int((1-prob) * 100)
            },
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"Error during analysis: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask API server on port 5000...")
    app.run(debug=True, port=5000)
