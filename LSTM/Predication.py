import numpy as np
import pandas as pd
import joblib
import yfinance as yf
from tensorflow import keras

from Input_file_Validating import validate_stock_data
from Preprocessing import proper_preprocessing
from Features import Feature_data
from Data_spliting import SEQUENCE_LENGTH

# ── Load model + artefacts ───────────────────────────────────────────────────
model         = keras.models.load_model("models/stock_lstm_v1.keras")
scaler        = joblib.load("models/scaler_v1.pkl")
feature_names = joblib.load("models/feature_names_v1.pkl")

# ── Fetch & prepare data ─────────────────────────────────────────────────────
TICKER = "TCS.NS"
df_raw = yf.download(TICKER, start="2024-01-01", end="2024-12-23")
validate_stock_data(df_raw)
df_raw = proper_preprocessing(df_raw)

df_features = Feature_data(df_raw.copy())
print("Columns after feature engineering:", df_features.columns.tolist())


# ─────────────────────────────────────────────────────────────────────────────
# Helper: build one LSTM-ready sequence from the last `seq_len` rows
# ─────────────────────────────────────────────────────────────────────────────
def _make_sequence(df_feat: pd.DataFrame, seq_len: int = SEQUENCE_LENGTH) -> np.ndarray:
    """
    Takes the last seq_len rows from df_feat, scales them, and returns a
    numpy array of shape (1, seq_len, n_features) ready for model.predict().
    """
    window = df_feat[feature_names].iloc[-seq_len:].values.astype(np.float32)
    if len(window) < seq_len:
        raise ValueError(
            f"Not enough rows to build a sequence: need {seq_len}, got {len(window)}"
        )
    window_scaled = scaler.transform(window)         # (seq_len, n_features)
    return window_scaled[np.newaxis, ...]            # (1, seq_len, n_features)


# ─────────────────────────────────────────────────────────────────────────────
# Next-day prediction (single step)
# ─────────────────────────────────────────────────────────────────────────────
def next_day(df_feat: pd.DataFrame, threshold: float = 0.45):
    """Predict direction for the next trading day."""
    X = _make_sequence(df_feat)
    prob = float(model.predict(X, verbose=0).flatten()[0])
    pred = 1 if prob > threshold else 0
    direction = "UP" if pred == 1 else "DOWN"
    print(f"Next Day Direction : {direction}")
    print(f"Confidence         : {prob:.4f}")
    return pred, prob


# ─────────────────────────────────────────────────────────────────────────────
# Multi-step future prediction
# ─────────────────────────────────────────────────────────────────────────────
def predict_future(
    df_raw_price: pd.DataFrame,
    days: int = 10,
    threshold: float = 0.47,
    seq_len: int = SEQUENCE_LENGTH,
):
    """
    Iteratively predicts `days` future trading days.

    Strategy
    --------
    For each step:
      1. Build a feature-engineered DataFrame from the current price history.
      2. Extract the last `seq_len` rows, scale, and feed to the LSTM.
      3. Simulate next-day Close using a probability-weighted mean return.
      4. Append the simulated row to the price history and repeat.

    Returns
    -------
    pd.DataFrame with columns [Day, Prediction, Probability]
    """
    df_price = df_raw_price.copy()
    predictions = []

    # Keep a rolling window of raw price rows large enough to recompute indicators
    WARM_UP = max(seq_len + 210, 300)   # 210 covers EMA-200

    for i in range(days):
        # Recompute features on a sliding window (avoid full-history recompute)
        df_window   = df_price.tail(WARM_UP).copy().reset_index(drop=True)
        df_processed = proper_preprocessing(df_window)
        df_feat      = Feature_data(df_processed)

        if len(df_feat) < seq_len:
            print(f"Day {i+1}: insufficient rows after feature engineering, stopping.")
            break

        # ── Predict ──────────────────────────────────────────────────────────
        X    = _make_sequence(df_feat, seq_len)
        prob = float(model.predict(X, verbose=0).flatten()[0])
        pred = int(prob > threshold)

        predictions.append({
            "Day":         i + 1,
            "Prediction":  pred,
            "Probability": round(prob, 4),
        })

        # ── Simulate next Close ───────────────────────────────────────────────
        returns      = df_feat["Return"].dropna()
        mean_up      = returns[returns > 0].mean()
        mean_down    = returns[returns < 0].mean()
        sim_return   = prob * mean_up + (1 - prob) * mean_down
        last_close   = df_price["Close"].iloc[-1]
        new_close    = last_close * (1 + sim_return)

        new_row          = df_price.iloc[-1:].copy()
        new_row["Close"] = float(new_close)
        df_price = pd.concat([df_price, new_row], ignore_index=True)

    result = pd.DataFrame(predictions)
    print(result.to_string(index=False))
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n── Single next-day prediction ──────────────────────────────────")
    next_day(df_features)

    print("\n── 50-day future simulation ────────────────────────────────────")
    predict_future(df_raw, days=50)
