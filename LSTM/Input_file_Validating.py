import pandas as pd


def validate_stock_data(df):
    """Validates a raw yfinance DataFrame. Returns True if valid, False otherwise."""

    if df is None or df.empty:
        print("DataFrame is empty.")
        return False

    df.reset_index(inplace=True)

    # Flatten MultiIndex columns produced by yfinance
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.columns.name = None

    required_columns = ["Date", "Close", "Volume"]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        print(f"Missing required columns: {missing_columns}")
        return False

    if not pd.api.types.is_datetime64_any_dtype(df["Date"]):
        print("Column 'Date' is not in datetime format.")
        return False

    if not pd.api.types.is_numeric_dtype(df["Close"]):
        print("Column 'Close' is not numeric.")
        return False

    if not pd.api.types.is_numeric_dtype(df["Volume"]):
        print("Column 'Volume' is not numeric.")
        return False

    print("Validation successful.")
    return True
