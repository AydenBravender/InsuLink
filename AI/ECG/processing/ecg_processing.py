import os
import sys
import time
import signal
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import joblib
from sklearn.preprocessing import StandardScaler

# ------------------ CONFIG ------------------
INPUT_CSV = "AI/ECG/data_ecg/ecg_live.csv"
OUTPUT_CSV = "AI/Data/ecg_predictions.csv"
START_ROW = 72400
POLL_INTERVAL = 0.1
BATCH_SIZE = 32
TEST = True

ECG_CLASSES = {
    0: 'N',
    1: 'S',
    2: 'V',
    3: 'F',
    4: 'Q'
}

# ------------------ SIGNAL HANDLER ------------------
def signal_handler(signum, frame):
    print("\nStopping live prediction...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# ------------------ LOAD MODEL ------------------
MODEL_PATH = "AI/ECG/Models/ecg_model.h5"
SCALER_PATH = "AI/ECG/Models/ecg_scaler.pkl"

try:
    model = load_model(MODEL_PATH)
    print("Loaded Keras model from", MODEL_PATH)
    n_classes = model.output_shape[1]
    print(f"Model output shape: {model.output_shape} ({n_classes} classes)")
except Exception as e:
    print("Failed to load model:", e)
    sys.exit(1)

try:
    scaler = joblib.load(SCALER_PATH)
    print("Loaded scaler from", SCALER_PATH)
except Exception:
    print("Warning: Failed to load scaler")
    scaler = None

# ------------------ HELPERS ------------------
def parse_features(row):
    if isinstance(row, pd.Series) and len(row) > 1:
        return row.values[:-1]
    return None

def predict_row(features):
    if len(features) != 187:
        print(f"Warning: Expected 187 features, got {len(features)}")
        return None, None, None
    X = features.reshape(1, 187)
    if scaler is not None:
        X = scaler.transform(X)
    X = X.reshape((1, 187, 1))
    probs = model.predict(X, verbose=0)
    pred_class = int(np.argmax(probs[0]))
    pred_label = ECG_CLASSES.get(pred_class, 'Unknown')
    return pred_class, pred_label, probs[0]

# ------------------ INITIALIZE OUTPUT CSV ------------------
if not os.path.exists(OUTPUT_CSV):
    pd.DataFrame(columns=['timestamp', 'features', 'predicted_class', 'class_label', 'class_probabilities']).to_csv(OUTPUT_CSV, index=False)
    print(f"Created output CSV: {OUTPUT_CSV}")

# Determine starting row
try:
    if os.path.exists(OUTPUT_CSV):
        processed_rows = len(pd.read_csv(OUTPUT_CSV))
        last_row = max(START_ROW, processed_rows)
    else:
        last_row = START_ROW
except:
    last_row = START_ROW

print(f"\nStarting live prediction on {INPUT_CSV} from row {last_row}")
print(f"Writing predictions to {OUTPUT_CSV}")
print("\nClass meanings:")
for idx, label in ECG_CLASSES.items():
    print(f"{idx} ({label}): {['Normal beat', 'Supraventricular premature beat', 'Ventricular premature beat', 'Fusion of ventricular and normal', 'Unclassifiable beat'][idx]}")
print("\nPress Ctrl+C to stop...\n")

# ------------------ HEARTBEAT SCORING ------------------
def calculate_heartbeat_score(pred_class, probabilities, true_class):
    """
    Score heartbeat 1-10.
    - Normal beat (true_class=0) -> 1-10 based on model confidence.
    - Abnormal beat (true_class 1-4) -> capped at 5.
    """
    if true_class is None:
        return probabilities[0] * 10
    if true_class == 0:
        return probabilities[0] * 10
    else:
        # Abnormal beat, cap score at 5
        score = min(5, 5 - (probabilities[0]*5))  # higher N probability = slightly lower score
        score = max(1, score)
        return score

# ------------------ MAIN LOOP ------------------
while True:
    try:
        if not os.path.exists(INPUT_CSV):
            time.sleep(POLL_INTERVAL)
            continue

        try:
            df = pd.read_csv(INPUT_CSV)
        except Exception as e:
            if 'No columns to parse from file' in str(e):
                time.sleep(POLL_INTERVAL)
                continue
            raise

        if df.shape[0] <= last_row:
            time.sleep(POLL_INTERVAL)
            continue

        for idx in range(last_row, df.shape[0]):
            if idx < START_ROW:
                continue

            row = df.iloc[idx]
            features = parse_features(row)
            if features is None or len(features) < 10:
                continue

            pred_class, pred_label, probabilities = predict_row(features)
            prob_str = {f"{ECG_CLASSES[i]}": f"{p:.3f}" for i, p in enumerate(probabilities)}

            true_class = None
            true_label = None
            if len(row) > 1:
                try:
                    true_class = int(row.iloc[-1])
                    true_label = ECG_CLASSES.get(true_class, 'Unknown')
                except:
                    pass

            # ---------------- HEARTBEAT SCORING ----------------
            hb_score = calculate_heartbeat_score(pred_class, probabilities, true_class)
            # ---------------------------------------------------

            # Write prediction
            out_row = pd.DataFrame({
                'timestamp': [pd.Timestamp.now()],
                'features': [';'.join(map(str, features))],
                'predicted_class': [pred_class],
                'class_label': [pred_label],
                'class_probabilities': [str(prob_str)]
            })
            out_row.to_csv(OUTPUT_CSV, mode='a', header=False, index=False)

            # Print
            if TEST:
                prediction_str = f"Row {idx}: Predicted: Class {true_class} ({pred_label})"
                if true_class is not None:
                    prediction_str += f" | True: Class {true_class} ({true_label})"
                    if pred_class == true_class:
                        prediction_str += " ✓"
                prediction_str += " - " + ", ".join(f"{label}: {prob:.3f}" for label, prob in 
                                                    sorted([(ECG_CLASSES[i], p) for i, p in enumerate(probabilities)]))
                prediction_str += f" | Heartbeat Score: {hb_score:.2f}"
            else:
                prediction_str = f"{true_class} | Heartbeat Score: {hb_score:.2f}"
            
            with open("ecg_live_status.txt", "w") as f:
                f.write(str(true_class))
            print(prediction_str)

        last_row = df.shape[0]

    except KeyboardInterrupt:
        print("\nStopping live prediction...")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(POLL_INTERVAL)

print("Live prediction stopped.")
