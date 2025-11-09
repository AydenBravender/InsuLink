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
DATA_PATH = "AI/EEG/sleep/data_eeg_sleep/filtered_dataset.csv"  # filtered dataset
MODEL_PATH = "AI/EEG/sleep/models/eeg_model.h5"
SCALER_PATH = "AI/EEG/sleep/models/eeg_scaler.pkl"

TRAIN_TEST_SPLIT = 0.4  # 40% test, 60% train
VALIDATION_SPLIT = 0.2  # 20% of training used for validation
EPOCHS = 30
BATCH_SIZE = 32
DROPOUT_RATE = 0.4
LEARNING_RATE = 1e-4

# -------------------------------
# GPU CONFIGURATION
# -------------------------------
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"✅ Using GPU: {gpus[0].name}")
    except RuntimeError as e:
        print(e)
else:
    print("⚠️ No GPU detected, training on CPU.")

# -------------------------------
# HELPER FUNCTIONS
# -------------------------------
def load_filtered_csv(path):
    df = pd.read_csv(path)
    if 'diagnosis' not in df.columns:
        raise ValueError("❌ Missing 'diagnosis' column in dataset!")
    X = df.drop(columns=['diagnosis']).values
    y = df['diagnosis'].values
    return X, y

def build_model(input_dim):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(input_dim,)),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(DROPOUT_RATE),

        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(DROPOUT_RATE),

        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(DROPOUT_RATE / 2),

        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

    optimizer = tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE)
    model.compile(optimizer=optimizer,
                  loss='binary_crossentropy',
                  metrics=['accuracy'])
    return model

def train_model(X, y):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=TRAIN_TEST_SPLIT, random_state=42, stratify=y
    )

    model = build_model(X.shape[1])

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', patience=10, restore_best_weights=True
    )

    lr_plateau = tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6, verbose=1
    )

    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_split=VALIDATION_SPLIT,
        callbacks=[early_stop, lr_plateau],
        verbose=2
    )

    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"✅ Final Test Accuracy: {test_acc*100:.2f}%")

    os.makedirs(os.path.dirname(SCALER_PATH), exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)
    print(f"📊 Scaler saved to {SCALER_PATH}")

    return model, scaler

def save_model(model, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    model.save(path)
    print(f"💾 Model saved at {path}")

def load_model_and_scaler(model_path, scaler_path):
    model = tf.keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)
    return model, scaler

def predict_live(eeg_vector, model, scaler):
    eeg_vector = np.array(eeg_vector).reshape(1, -1)
    eeg_scaled = scaler.transform(eeg_vector)
    pred_prob = model.predict(eeg_scaled, verbose=0)[0][0]
    return int(pred_prob > 0.5)

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    print("⏳ Loading filtered EEG dataset...")
    X, y = load_filtered_csv(DATA_PATH)

    print("🚀 Training TensorFlow model...")
    model, scaler = train_model(X, y)

    save_model(model, MODEL_PATH)

    # Example: Predict on random EEG input (for testing)
    example_live_eeg = np.random.rand(X.shape[1])
    prediction = predict_live(example_live_eeg, model, scaler)
    print(f"🔮 Live EEG Prediction: {'Sleep Deprived' if prediction == 1 else 'Normal Sleep'}")
