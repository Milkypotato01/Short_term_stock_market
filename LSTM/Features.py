import numpy as np
import pandas as pd


def Feature_data(df):
    """
    Computes all technical indicators and appends them to df.
    Returns a clean DataFrame with a 'Target' column (1 = price higher in 10 days).
    The raw OHLCV columns (Close, Volume, High, Low) are dropped at the end
    so only engineered features + Date + Target remain.
    """

    # ── Volume indicators ────────────────────────────────────────────────────
    df["OBV"] = (np.sign(df["Close"].diff()) * df["Volume"]).fillna(0).cumsum()
    df["VWAP"] = (df["Close"] * df["Volume"]).cumsum() / df["Volume"].cumsum()
    df["VWAP_Distance"] = df["Close"] - df["VWAP"]

    # ── Momentum ─────────────────────────────────────────────────────────────
    df["Momentum_5"]  = df["Close"] / df["Close"].shift(5)  - 1
    df["Momentum_10"] = df["Close"] / df["Close"].shift(10) - 1
    df["Momentum_20"] = df["Close"] / df["Close"].shift(20) - 1

    # ── Returns & Volatility ─────────────────────────────────────────────────
    df["Return"]       = df["Close"].pct_change()
    df["Volatility_10"] = df["Return"].rolling(window=10).std()
    df["Volatility_20"] = df["Return"].rolling(window=20).std()

    # ── Target (1 if Close is higher 10 days from now) ───────────────────────
    df["Target"] = np.where(df["Close"].shift(-10) > df["Close"], 1, 0)

    # ── RSI (14) ─────────────────────────────────────────────────────────────
    delta    = df["Close"].diff()
    gain     = delta.clip(lower=0)
    loss     = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    df["RSI_14"] = 100 - (100 / (1 + rs))

    # ── MACD ──────────────────────────────────────────────────────────────────
    ema_12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema_26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema_12 - ema_26
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    # ── ATR ───────────────────────────────────────────────────────────────────
    df["ATR"]     = (df["High"] - df["Low"]).rolling(14).mean()
    df["ATR_pct"] = df["ATR"] / df["Close"]

    # ── Trend indicators ──────────────────────────────────────────────────────
    ema50  = df["Close"].ewm(span=50).mean()
    ema200 = df["Close"].ewm(span=200).mean()
    df["Trend_Strength"]  = (ema50 / ema200) - 1
    df["Price_vs_EMA50"]  = (df["Close"] / ema50)  - 1
    df["Price_vs_EMA200"] = (df["Close"] / ema200) - 1

    # ── Drop raw OHLCV ────────────────────────────────────────────────────────
    df = df.drop(columns=["Close", "Volume", "High", "Low"], errors="ignore")

    df = df.dropna()
    df = df.reset_index(drop=True)

    print("Preprocessing [Feature part (2/2)] Done")
    return df
