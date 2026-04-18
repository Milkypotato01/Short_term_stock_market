"""
One-time script to generate feature_names_v1.pkl.
The feature names must match exactly what was used during training.
Derived from Features.py → Feature_data() column order after dropping
Close, Volume, High, Low, Date, and Target.
"""

import joblib
import os

feature_names = [
    "OBV",
    "VWAP",
    "VWAP_Distance",
    "Momentum_5",
    "Momentum_10",
    "Momentum_20",
    "Return",
    "Volatility_10",
    "Volatility_20",
    "RSI_14",
    "MACD",
    "MACD_Signal",
    "ATR",
    "ATR_pct",
    "Trend_Strength",
    "Price_vs_EMA50",
    "Price_vs_EMA200",
]

os.makedirs("models", exist_ok=True)
joblib.dump(feature_names, "models/feature_names_v1.pkl")
print(
    "Saved {} feature names -> models/feature_names_v1.pkl".format(len(feature_names))
)
print(feature_names)
