import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam
import joblib
import kagglehub

# === Download dataset using kagglehub ===
dataset_path = kagglehub.dataset_download("shayanfazeli/heartbeat")
print("Dataset downloaded to:", dataset_path)

# === Load MIT-BIH CSVs ===
mitbih_train_path = os.path.join(dataset_path, "mitbih_train.csv")
mitbih_test_path = os.path.join(dataset_path, "mitbih_test.csv")

mitbih_train = pd.read_csv(mitbih_train_path, header=None)
mitbih_test = pd.read_csv(mitbih_test_path, header=None)

# Combine train + test
data = pd.concat([mitbih_train, mitbih_test])

# Split features and labels
X = data.iloc[:, :-1].values
y = data.iloc[:, -1].values

# === Preprocess ===
scaler = StandardScaler()
X = scaler.fit_transform(X)
X = np.expand_dims(X, axis=2)  # add channel dimension for Conv1D

# One-hot encode labels (5 classes)
y = to_categorical(y, num_classes=5)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# === Build 1D CNN ===
model = Sequential([
    Conv1D(64, kernel_size=5, activation='relu', input_shape=(X.shape[1], 1)),
    MaxPooling1D(pool_size=2),
    Dropout(0.2),
    Conv1D(128, kernel_size=3, activation='relu'),
    MaxPooling1D(pool_size=2),
    Dropout(0.2),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(5, activation='softmax')
])

# Compile model
model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train model
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=128,
    validation_split=0.2,
    callbacks=[early_stop],
    verbose=1
)

# Evaluate
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Accuracy: {acc:.4f}")

# Save model + scaler
model.save('ecg_model.h5')
joblib.dump(scaler, 'ecg_scaler.pkl')

print("✅ Model trained and saved as 'ecg_model.h5' and scaler as 'ecg_scaler.pkl'.")
