import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv1D, MaxPooling1D
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

# === Load datasets ===
mitbih_train = pd.read_csv('mitbih_train.csv', header=None)
mitbih_test = pd.read_csv('mitbih_test.csv', header=None)
ptbdb_abnormal = pd.read_csv('ptbdb_abnormal.csv', header=None)
ptbdb_normal = pd.read_csv('ptbdb_normal.csv', header=None)

# === Combine data ===
data_mitbih = pd.concat([mitbih_train, mitbih_test])
data_ptbdb = pd.concat([ptbdb_abnormal, ptbdb_normal])

# MIT-BIH has 5 classes, PTBDB has 2 — keep them separate for now but merge format
X_mitbih = data_mitbih.iloc[:, :-1].values
y_mitbih = data_mitbih.iloc[:, -1].values

X_ptbdb = data_ptbdb.iloc[:, :-1].values
y_ptbdb = data_ptbdb.iloc[:, -1].values + 5  # shift labels so they don't overlap (for future use)

# Use only MIT-BIH (5 categories) for now
X = X_mitbih
y = y_mitbih

# === Preprocess ===
scaler = StandardScaler()
X = scaler.fit_transform(X)
X = np.expand_dims(X, axis=2)  # add channel dimension for Conv1D

# One-hot encode labels
y = to_categorical(y, num_classes=5)

# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# === Define model ===
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

# === Compile ===
model.compile(
    loss='categorical_crossentropy',
    optimizer=Adam(learning_rate=0.001),
    metrics=['accuracy']
)

# === Train ===
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=128,
    validation_split=0.2,
    callbacks=[early_stop],
    verbose=1
)

# === Evaluate ===
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Accuracy: {acc:.4f}")

# === Save model and scaler ===
model.save('ecg_model.h5')
import joblib
joblib.dump(scaler, 'ecg_scaler.pkl')

print("✅ Model trained and saved as 'ecg_model.h5' and scaler as 'ecg_scaler.pkl'.")
