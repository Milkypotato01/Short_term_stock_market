import numpy as np
import joblib
from tensorflow import keras
from tensorflow.keras import layers, callbacks

from Data_spliting import test_train_divide

# ── Load data ────────────────────────────────────────────────────────────────
data = test_train_divide()

X_train = data["X_train"]   # (samples, seq_len, features)
X_test  = data["X_test"]
y_train = data["y_train"]
y_test  = data["y_test"]
scaler  = data["scaler"]
feature_names = data["feature_names"]

n_timesteps = X_train.shape[1]
n_features  = X_train.shape[2]
print(f"Input shape → timesteps: {n_timesteps}, features: {n_features}")

# ── Build LSTM model ─────────────────────────────────────────────────────────
def build_model(n_timesteps, n_features):
    model = keras.Sequential([
        # First LSTM layer – return sequences so next LSTM can read them
        layers.LSTM(128, return_sequences=True,
                    input_shape=(n_timesteps, n_features)),
        layers.Dropout(0.3),

        # Second LSTM layer
        layers.LSTM(64, return_sequences=False),
        layers.Dropout(0.3),

        # Dense head
        layers.Dense(32, activation="relu"),
        layers.Dropout(0.2),

        # Output: sigmoid for binary classification
        layers.Dense(1, activation="sigmoid"),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model


model = build_model(n_timesteps, n_features)
model.summary()

# ── Callbacks ────────────────────────────────────────────────────────────────
cb_early_stop = callbacks.EarlyStopping(
    monitor="val_loss", patience=10, restore_best_weights=True
)
cb_reduce_lr = callbacks.ReduceLROnPlateau(
    monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6, verbose=1
)
cb_checkpoint = callbacks.ModelCheckpoint(
    "models/stock_lstm_best.keras",
    monitor="val_loss",
    save_best_only=True,
    verbose=1,
)

import os
os.makedirs("models", exist_ok=True)

# ── Train ─────────────────────────────────────────────────────────────────────
print("Training the LSTM model...")
history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=64,
    validation_data=(X_test, y_test),
    callbacks=[cb_early_stop, cb_reduce_lr, cb_checkpoint],
    verbose=1,
)

# ── Save final model + scaler + metadata ─────────────────────────────────────
model.save("models/stock_lstm_v1.keras")
joblib.dump(scaler,        "models/scaler_v1.pkl")
joblib.dump(feature_names, "models/feature_names_v1.pkl")

print("Model saved  → models/stock_lstm_v1.keras")
print("Scaler saved → models/scaler_v1.pkl")
