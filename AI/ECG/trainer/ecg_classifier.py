import time
import numpy as np
import pandas as pd
from scipy.signal import find_peaks
import joblib
from tensorflow.keras.models import load_model

# === Constants ===
CSV_FILE = "live_bioamp.csv"   # CSV being updated with BioAmp data
SCALER_PATH = "ecg_scaler.pkl" # Saved scaler from training
MODEL_PATH = "ecg_model.h5"    # Trained model
BEAT_LENGTH = 188              # Number of samples per beat
FS = 125                       # BioAmp sampling frequency

# === Load model + scaler ===
scaler = joblib.load(SCALER_PATH)
model = load_model(MODEL_PATH)

# Map numeric predictions to heartbeat classes
CLASS_MAP = {
    0: 'N',  # Normal
    1: 'S',  # Supraventricular
    2: 'V',  # Ventricular
    3: 'F',  # Fusion
    4: 'Q'   # Unknown
}

# === Functions ===
def preprocess_beat(beat):
    """Normalize and reshape a single beat to feed into the model"""
    beat_scaled = scaler.transform(beat.reshape(1, -1))
    return beat_scaled[..., np.newaxis]  # add channel dimension for Conv1D

def segment_beats(ecg_signal, fs=FS):
    """Detect R-peaks and segment each beat"""
    distance = int(0.6 * fs)  # minimum distance between peaks (~0.6s)
    peaks, _ = find_peaks(ecg_signal, distance=distance, height=np.mean(ecg_signal))

    beats = []
    half_len = BEAT_LENGTH // 2
    for peak in peaks:
        start = peak - half_len
        end = peak + half_len
        if start < 0:
            beat = np.pad(ecg_signal[0:end], (abs(start), 0), 'constant')
        elif end > len(ecg_signal):
            beat = np.pad(ecg_signal[start:], (0, end - len(ecg_signal)), 'constant')
        else:
            beat = ecg_signal[start:end]
        beats.append(beat)
    return np.array(beats)

def get_live_beats(csv_file):
    """Continuously read CSV and return preprocessed beats"""
    last_rows = 0
    while True:
        try:
            df = pd.read_csv(csv_file, header=None)
            if len(df) > last_rows:
                new_data = df.iloc[last_rows:].values.flatten()
                last_rows = len(df)

                beats = segment_beats(new_data)
                processed_beats = np.array([preprocess_beat(b) for b in beats])
                if len(processed_beats) > 0:
                    yield processed_beats
            time.sleep(0.5)
        except FileNotFoundError:
            print(f"{csv_file} not found, waiting...")
            time.sleep(1)

def predict_beats(beats):
    """Predict heartbeat classes for a batch of beats"""
    predictions = model.predict(beats, verbose=0)
    predicted_classes = np.argmax(predictions, axis=1)
    return [CLASS_MAP[c] for c in predicted_classes]

# === Main real-time loop ===
if __name__ == "__main__":
    print("🚀 Starting live ECG monitoring...")
    for beats in get_live_beats(CSV_FILE):
        classes = predict_beats(beats)
        for i, cls in enumerate(classes):
            print(f"Beat {i+1}: {cls}")
