"""
sam40_stress_nn_unsupervised.py

Simplified TensorFlow autoencoder for SAM-40 EEG data.
No labels, no command-line arguments; only input CSV is required.
The model learns to reconstruct the input, useful for anomaly detection or unsupervised feature learning.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.callbacks import EarlyStopping

# -----------------------------
# Hardcoded file paths
# -----------------------------
data_path = 'AI/EEG/stress/training/'  # replace with your CSV file path
output_model_path = 'sam40_autoencoder.h5'

# -----------------------------
# Load data
# -----------------------------
data = pd.read_csv(data_path, header=None)
if data.shape[1] == 33:
    data = data.drop(columns=0)
X = data.values.astype(np.float32)

# -----------------------------
# Preprocessing
# -----------------------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# -----------------------------
# Build autoencoder
# -----------------------------
input_dim = X_scaled.shape[1]
input_layer = Input(shape=(input_dim,))
encoded = Dense(64, activation='relu')(input_layer)
encoded = Dense(32, activation='relu')(encoded)
encoded = Dense(16, activation='relu')(encoded)

decoded = Dense(32, activation='relu')(encoded)
decoded = Dense(64, activation='relu')(decoded)
decoded = Dense(input_dim, activation='linear')(decoded)

autoencoder = Model(input_layer, decoded)
autoencoder.compile(optimizer='adam', loss='mse')

# -----------------------------
# Train autoencoder
# -----------------------------
es = EarlyStopping(monitor='loss', patience=10, restore_best_weights=True)
autoencoder.fit(X_scaled, X_scaled, epochs=100, batch_size=16, callbacks=[es], verbose=1)

# -----------------------------
# Save model and scaler
# -----------------------------
autoencoder.save(output_model_path)
import joblib
joblib.dump(scaler, output_model_path + '.scaler')
print(f"Autoencoder saved to {output_model_path}, scaler saved to {output_model_path}.scaler")
