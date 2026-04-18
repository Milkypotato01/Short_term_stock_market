import numpy as np
import pandas as pd
import joblib
from tensorflow import keras
from sklearn.metrics import (
    accuracy_score, confusion_matrix,
    classification_report, roc_auc_score, roc_curve,
)

from Data_spliting import test_train_divide

# ── Load data ────────────────────────────────────────────────────────────────
data = test_train_divide()

X_train = data["X_train"]
X_test  = data["X_test"]
y_train = data["y_train"]
y_test  = data["y_test"]

# ── Load model ───────────────────────────────────────────────────────────────
print("Loading model...")
model         = keras.models.load_model("models/stock_lstm_v1.keras")
feature_names = joblib.load("models/feature_names_v1.pkl")
print("Feature names:", feature_names)

# ── Predict probabilities ─────────────────────────────────────────────────────
print("Running predictions...")
y_prob = model.predict(X_test).flatten()     # sigmoid output → probabilities

# ── Find optimal threshold via Youden's J ────────────────────────────────────
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
optimal_idx       = np.argmax(tpr - fpr)
optimal_threshold = thresholds[optimal_idx]
print(f"Optimal threshold : {optimal_threshold:.4f}")

y_pred = (y_prob >= optimal_threshold).astype(int)

print(f"\ny_prob mean      : {y_prob.mean():.4f}")
print(pd.Series(y_prob).describe())


def model_evaluation(y_test, y_pred, y_prob):
    print("\n─── Evaluation Results ───────────────────────────────────────────")
    print(f"Accuracy         : {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC          : {roc_auc_score(y_test, y_prob):.4f}")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Baseline (always predict majority class)
    baseline = [int(y_train.mean() >= 0.5)] * len(y_test)
    print(f"Baseline Accuracy: {accuracy_score(y_test, baseline):.4f}")

    # Train accuracy
    y_train_prob = model.predict(X_train).flatten()
    y_train_pred = (y_train_prob >= optimal_threshold).astype(int)
    print(f"Train Accuracy   : {accuracy_score(y_train, y_train_pred):.4f}")
    print(f"Test  Accuracy   : {accuracy_score(y_test,  y_pred):.4f}")

    # ── Save evaluation results ───────────────────────────────────────────────
    import os
    os.makedirs("models", exist_ok=True)

    results = {
        "accuracy":          accuracy_score(y_test, y_pred),
        "roc_auc":           roc_auc_score(y_test, y_prob),
        "baseline_accuracy": accuracy_score(y_test, baseline),
        "train_accuracy":    accuracy_score(y_train, y_train_pred),
        "test_accuracy":     accuracy_score(y_test,  y_pred),
        "optimal_threshold": optimal_threshold,
        "confusion_matrix":  confusion_matrix(y_test, y_pred),
        "classification_report": classification_report(y_test, y_pred),
        "feature_names":     feature_names,
    }
    joblib.dump(results, "models/model_evaluation_v1.pkl")
    print("\nEvaluation results saved → models/model_evaluation_v1.pkl")


model_evaluation(y_test, y_pred, y_prob)
