import pandas as pd
import os

# -------------------------------
# CONFIG
# -------------------------------
DATA_PATH = "AI/EEG/diagnostic/data_eeg_diagnostic/AD_all_patients.csv"  # path to original dataset
OUTPUT_PATH = "AI/EEG/diagnostic/data_eeg_diagnostic/AD_all_patients_filtered.csv"  # path to save filtered dataset

# -------------------------------
# FILTERING
# -------------------------------
# Columns to keep based on Muse mapping
COLUMNS_TO_KEEP = ['F7', 'F8', 'T5', 'T4', 'Fz', 'status']

def filter_alz_eeg(data_path, output_path):
    # Load dataset
    df = pd.read_csv(data_path)
    print(f"Original shape: {df.shape}")
    
    # Check which columns exist
    missing_cols = [col for col in COLUMNS_TO_KEEP if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing columns in dataset: {missing_cols}")
    
    # Keep only desired columns
    df_filtered = df[COLUMNS_TO_KEEP]
    print(f"Filtered shape: {df_filtered.shape}")
    
    # Save to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df_filtered.to_csv(output_path, index=False)
    print(f"Filtered dataset saved to {output_path}")

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    filter_alz_eeg(DATA_PATH, OUTPUT_PATH)
