import pandas as pd
import numpy as np
from Input_file_Validating import validate_stock_data


def proper_preprocessing(df):
    """Cleans and standardises a raw yfinance DataFrame."""

    if df is None or df.empty:
        print("Preprocessing skipped: Empty DataFrame")
        return pd.DataFrame()

    # Flatten MultiIndex columns (yfinance issue)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # Ensure Date column exists
    if "Date" not in df.columns:
        if df.index.name == "Date" or isinstance(df.index, pd.DatetimeIndex):
            df = df.reset_index()
        else:
            print("Preprocessing skipped: No Date column")
            return pd.DataFrame()

    required_cols = ["Date", "Close", "Volume", "High", "Low"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"Preprocessing skipped: Missing columns {missing}")
        return pd.DataFrame()

    df["Date"]   = pd.to_datetime(df["Date"],  errors="coerce")
    df["Close"]  = pd.to_numeric(df["Close"],  errors="coerce")
    df["Volume"] = pd.to_numeric(df["Volume"], errors="coerce")

    df.dropna(subset=["Date", "Close", "Volume"], inplace=True)
    df = df.sort_values("Date")
    df = df.drop(columns=["Index"], errors="ignore")
    df = df.reset_index(drop=True)
    df = df[["Date", "High", "Low", "Close", "Volume"]]

    print("Preprocessing Done")
    return df
