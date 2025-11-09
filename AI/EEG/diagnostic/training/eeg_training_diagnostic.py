import os
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

# -------------------------------
# CONFIG
# -------------------------------
DATA_PATH = "AI/EEG/diagnostic/data_eeg_diagnostic/AD_all_patients_filtered.csv"  # your CSV path
MODEL_PATH = "AI/EEG/diagnostic/models/ad_eeg_model.h5"
SCALER_PATH = "AI/EEG/diagnostic/models/ad_eeg_scaler.pkl"

TRAIN_TEST_SPLIT = 0.4  # 60% train, 40% test
VALIDATION_SPLIT = 0.2  # 20% of train used for validation
EPOCHS = 50
BATCH_SIZE = 32
DROPOUT_RATE = 0.3

# -------------------------------
# HELPER FUNCTIONS
# -------------------------------
def load_eeg_csv(path):
    """Load filtered Alzheimer's EEG dataset"""
    df = pd.read_csv(path)
    X = df.drop(columns=['status']).values
    y = df['status'].values
    return X, y

def build_model(input_dim):
    """Simple feedforward neural network"""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_dim,)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(DROPOUT_RATE),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dropout(DROPOUT_RATE),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model

def train_model(X, y):
    """Train TensorFlow model with early stopping"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=TRAIN_TEST_SPLIT, random_state=42, stratify=y
    )

    model = build_model(X.shape[1])

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', patience=5, restore_best_weights=True
    )

    model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=VALIDATION_SPLIT,
        callbacks=[early_stop],
        verbose=2
    )

    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"✅ Test accuracy: {test_acc*100:.2f}%")

    # Save scaler
    joblib.dump(scaler, SCALER_PATH)

    return model, scaler

def save_model(model, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    model.save(path)
    print(f"Model saved at {path}")

def load_model_and_scaler(model_path, scaler_path):
    model = tf.keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler

def predict_live(eeg_vector, model, scaler):
    """Predict status for a live EEG vector"""
    eeg_vector = np.array(eeg_vector).reshape(1, -1)
    eeg_scaled = scaler.transform(eeg_vector)
    pred_prob = model.predict(eeg_scaled, verbose=0)[0][0]
    return int(pred_prob > 0.5)

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    print("⏳ Loading filtered Alzheimer's EEG dataset...")
    X, y = load_eeg_csv(DATA_PATH)

    print("🚀 Training TensorFlow model...")
    model, scaler = train_model(X, y)

    save_model(model, MODEL_PATH)

    # Example: predict live EEG
    example_live_eeg = np.random.rand(5)  # replace with actual EEG
    prediction = predict_live(example_live_eeg, model, scaler)
    print(f"🔮 Live EEG prediction: {'AD' if prediction == 1 else 'Healthy'}")
