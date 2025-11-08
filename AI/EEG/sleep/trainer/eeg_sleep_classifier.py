"""
Lightweight EEG sleep deprivation classifier.

This script scans the BIDS dataset in data_eeg_sleep/ds004902, loads EEGLAB .set recordings
(prefers task-eyesopen, falls back to eyesclosed), extracts relative bandpower features
using Welch's PSD, and trains a small Keras MLP to classify sessions as NS (normal sleep)
or SD (sleep deprived).

Usage (from repo root):
    python AI/EEG/sleep/trainer/eeg_sleep_classifier.py --data-dir "AI/EEG/sleep/data_eeg_sleep/ds004902" --epochs 30

Notes and assumptions:
- Requires `mne` to read EEGLAB .set files and `scipy` for signal processing.
- participants.tsv 'SessionOrder' is used to map ses-1/ses-2 to NS/SD. Values are expected
  to be like 'NS->SD' or 'SD->NS'.
- The script computes bandpower features (delta, theta, alpha, beta, gamma) averaged across channels.
  This keeps feature vectors small and training fast.
"""

import os
import glob
import argparse
import warnings

import numpy as np
import pandas as pd

from scipy.signal import welch

import mne

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks


def get_session_label_for_sub(part_row, ses_name):
    """
    Map subject participants.tsv row to label for a given session name like 'ses-1' or 'ses-2'.
    Returns 0 for NS (normal sleep) and 1 for SD (sleep deprivation).
    """
    order = str(part_row.get("SessionOrder", "NS->SD"))
    # Expected format like 'NS->SD' or 'SD->NS'
    if '->' in order:
        first, second = order.split('->')
    else:
        # fallback: assume ses-1=NS, ses-2=SD
        first, second = 'NS', 'SD'

    if ses_name.endswith('ses-1'):
        lab = first.strip()
    else:
        lab = second.strip()

    if lab == 'NS':
        return 0
    elif lab == 'SD':
        return 1
    else:
        # unknown label
        return None


def compute_bandpower_features(data, sfreq, nperseg=1024):
    """
    data: ndarray (n_channels, n_samples)
    returns: vector of length n_bands (averaged across channels) plus per-channel optional.
    Bands: delta 1-4, theta 4-8, alpha 8-13, beta 13-30, gamma 30-50
    """
    bands = {
        'delta': (1, 4),
        'theta': (4, 8),
        'alpha': (8, 13),
        'beta': (13, 30),
        'gamma': (30, 50),
    }

    # For each channel compute PSD and band powers
    ch_bandpowers = []
    for ch in range(data.shape[0]):
        f, Pxx = welch(data[ch, :], fs=sfreq, nperseg=min(nperseg, data.shape[1]))
        total_power = np.trapz(Pxx, f)
        band_vals = []
        for (lo, hi) in bands.values():
            idx = np.logical_and(f >= lo, f <= hi)
            band_power = np.trapz(Pxx[idx], f[idx]) if np.any(idx) else 0.0
            # relative power
            band_vals.append(band_power / (total_power + 1e-12))
        ch_bandpowers.append(band_vals)

    ch_bandpowers = np.array(ch_bandpowers)  # n_ch x n_bands
    # average across channels -> feature vector length n_bands
    feat = ch_bandpowers.mean(axis=0)
    return feat


def find_eeg_file(sub_dir):
    """Find a suitable EEG file for the session directory. Prefer eyesopen then eyesclosed."""
    eeg_dir = os.path.join(sub_dir, 'eeg')
    if not os.path.isdir(eeg_dir):
        return None

    patterns = [
        '*task-eyesopen*_eeg.set',
        '*task-eyesopen*_eeg.fdt',  # rarely .fdt pairs without .set
        '*task-eyesclosed*_eeg.set',
        '*task-eyesclosed*_eeg.fdt',
    ]
    for pat in patterns:
        files = glob.glob(os.path.join(eeg_dir, pat))
        if files:
            # prefer .set
            for f in files:
                if f.endswith('.set'):
                    return f
            return files[0]

    return None


def load_dataset(data_root):
    """Scan data_root for subjects and sessions, return X, y arrays and subject/session ids."""
    bids_root = data_root
    participants_tsv = os.path.join(bids_root, 'participants.tsv')
    if not os.path.exists(participants_tsv):
        raise FileNotFoundError(f"participants.tsv not found in {bids_root}")

    parts = pd.read_csv(participants_tsv, sep='\t', dtype=str)
    parts = parts.set_index('participant_id')

    X = []
    y = []
    meta = []

    # Loop subjects
    for sub_folder in sorted(glob.glob(os.path.join(bids_root, 'sub-*'))):
        sub_id = os.path.basename(sub_folder)
        if sub_id not in parts.index:
            continue
        part_row = parts.loc[sub_id]

        # sessions (ses-1, ses-2)
        for ses in ['ses-1', 'ses-2']:
            ses_dir = os.path.join(sub_folder, ses)
            if not os.path.isdir(ses_dir):
                continue

            eeg_file = find_eeg_file(ses_dir)
            if eeg_file is None:
                warnings.warn(f'No EEG file for {sub_id} {ses}, skipping')
                continue

            # Determine label (0 NS, 1 SD)
            lbl = get_session_label_for_sub(part_row, ses)
            if lbl is None:
                warnings.warn(f'Unknown label for {sub_id} {ses}, skipping')
                continue

            try:
                raw = mne.io.read_raw_eeglab(eeg_file, preload=True, verbose=False)
            except Exception as e:
                warnings.warn(f'Failed to read {eeg_file}: {e}')
                continue

            # pick EEG channels only
            picks = mne.pick_types(raw.info, eeg=True, meg=False)
            data = raw.get_data(picks=picks)
            sfreq = raw.info['sfreq'] if raw.info.get('sfreq') else 500.0

            feat = compute_bandpower_features(data, sfreq)
            X.append(feat)
            y.append(lbl)
            meta.append({'sub': sub_id, 'ses': ses, 'file': eeg_file})

    X = np.array(X)
    y = np.array(y)
    return X, y, meta


def build_model(input_dim):
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model


def main(args):
    X, y, meta = load_dataset(args.data_dir)
    print(f'Loaded {len(y)} examples')
    if len(y) == 0:
        print('No data found. Exiting.')
        return

    # split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    model = build_model(X_train.shape[1])

    es = callbacks.EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True)

    history = model.fit(
        X_train, y_train,
        validation_split=0.1,
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=[es],
        verbose=2
    )

    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f'Test accuracy: {acc:.4f}, loss: {loss:.4f}')

    # Save model and scaler
    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)
    model.save(os.path.join(out_dir, 'eeg_sleep_classifier.keras'))
    # save scaler
    import joblib
    joblib.dump(scaler, os.path.join(out_dir, 'scaler.joblib'))
    # save meta
    pd.DataFrame(meta).to_csv(os.path.join(out_dir, 'meta.csv'), index=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=str, default='AI/EEG/sleep/data_eeg_sleep/ds004902', help='BIDS dataset root')
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--batch-size', type=int, default=16)
    parser.add_argument('--output-dir', type=str, default='AI/EEG/sleep/models', help='Where to save model and artifacts')
    args = parser.parse_args()
    main(args)
