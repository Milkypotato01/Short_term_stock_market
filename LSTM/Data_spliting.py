import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler

from Input_file_Validating import validate_stock_data
from Preprocessing import proper_preprocessing
from Features import Feature_data

# ── Hyper-parameter ──────────────────────────────────────────────────────────
SEQUENCE_LENGTH = 60   # how many past timesteps the LSTM sees at once
TRAIN_RATIO     = 0.80


def build_sequences(X: np.ndarray, y: np.ndarray, seq_len: int):
    """
    Converts a 2-D feature matrix into overlapping sequences for LSTM.

    Returns
    -------
    X_seq : np.ndarray  shape (n_samples, seq_len, n_features)
    y_seq : np.ndarray  shape (n_samples,)
    """
    Xs, ys = [], []
    for i in range(seq_len, len(X)):
        Xs.append(X[i - seq_len : i])   # window of past rows
        ys.append(y[i])                  # label for the last row in window
    return np.array(Xs), np.array(ys)


def test_train_divide(
    tickers=["TCS.NS", "INFY.NS"],
    seq_len: int = SEQUENCE_LENGTH,
):
    """
    Downloads data for each ticker, engineers features, scales them,
    and builds LSTM-ready sequences.

    Returns
    -------
    dict with keys:
        X_train, X_test  : np.ndarray  (samples, seq_len, features)
        y_train, y_test  : np.ndarray  (samples,)
        scaler           : fitted MinMaxScaler  (save this alongside the model)
        feature_names    : list[str]
    """
    all_train_dfs = []
    all_test_dfs  = []

    for ticker in tickers:
        try:
            df = yf.download(ticker, start="1970-01-01", end="2024-12-23")
            validate_stock_data(df)
            df = proper_preprocessing(df)
            print(f"Preprocessing for {ticker} done")

            df = Feature_data(df)
            df = df.sort_values("Date").reset_index(drop=True)

            split_idx = int(len(df) * TRAIN_RATIO)
            all_train_dfs.append(df.iloc[:split_idx].copy())
            all_test_dfs.append(df.iloc[split_idx:].copy())

        except Exception as e:
            print(f"Error processing {ticker}: {e}")
            continue

    if not all_train_dfs:
        raise RuntimeError("No data was successfully downloaded/processed.")

    final_train = pd.concat(all_train_dfs, ignore_index=True)
    final_test  = pd.concat(all_test_dfs,  ignore_index=True)

    feature_names = [c for c in final_train.columns if c not in ("Date", "Target")]

    X_train_raw = final_train[feature_names].values.astype(np.float32)
    y_train_raw = final_train["Target"].values.astype(np.float32)

    X_test_raw  = final_test[feature_names].values.astype(np.float32)
    y_test_raw  = final_test["Target"].values.astype(np.float32)

    # ── Scale features (fit only on train to avoid data leakage) ────────────
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled  = scaler.transform(X_test_raw)

    # ── Build overlapping sequences ──────────────────────────────────────────
    X_train, y_train = build_sequences(X_train_scaled, y_train_raw, seq_len)
    X_test,  y_test  = build_sequences(X_test_scaled,  y_test_raw,  seq_len)

    print(f"Data splitting done")
    print(f"  X_train shape : {X_train.shape}   y_train shape : {y_train.shape}")
    print(f"  X_test  shape : {X_test.shape}    y_test  shape : {y_test.shape}")
    print(f"  Features ({len(feature_names)}) : {feature_names}")

    return {
        "X_train":       X_train,
        "X_test":        X_test,
        "y_train":       y_train,
        "y_test":        y_test,
        "scaler":        scaler,
        "feature_names": feature_names,
    }
