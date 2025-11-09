import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical

# ---------- 1. Load CSV ----------
data = pd.read_csv('AI/ECG/data_ecg/mitbih_train.csv', header=None)  # replace with your CSV path
X = data.iloc[:, :-1].values  # all columns except last
y = data.iloc[:, -1].values   # last column is the class

# Convert labels to one-hot encoding
num_classes = len(np.unique(y))
y_cat = to_categorical(y, num_classes=num_classes)

# ---------- 2. Build a simple neural network ----------
model = Sequential([
    Dense(64, activation='relu', input_shape=(X.shape[1],)),
    Dense(32, activation='relu'),
    Dense(num_classes, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# ---------- 3. Train the model ----------
model.fit(X, y_cat, epochs=20, batch_size=32, verbose=1)

# ---------- 4. Simulate predictions on training data ----------
preds = model.predict(X)
pred_labels = np.argmax(preds, axis=1)

# Print sample results
for i in range(10):
    print(f"Sample {i}: True={y[i]}, Predicted={pred_labels[i]}")
