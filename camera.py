import requests
import os
from datetime import datetime

# ===============================
# Configuration
# ===============================
ESP32_IP = "172.20.10.5"          # Replace with your ESP32 IP
CAPTURE_URL = f"http://{ESP32_IP}/capture"  # Usually /capture
SAVE_FOLDER = "esp32_photos"        # Folder to save images

# Create folder if it doesn't exist
if not os.path.exists(SAVE_FOLDER):
    os.makedirs(SAVE_FOLDER)

# ===============================
# Capture a single photo
# ===============================
try:
    response = requests.get(CAPTURE_URL, timeout=5)
    if response.status_code == 200:
        # Save with timestamp to avoid overwriting
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(SAVE_FOLDER, f"capture_{timestamp}.jpg")
        with open(filepath, "wb") as f:
            f.write(response.content)
        print(f"Photo saved as {filepath}")
    else:
        print(f"Failed to capture image. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print("Error connecting to ESP32:", e)


import json
from inference_sdk import InferenceHTTPClient

# -------------------------------
# LOAD CONFIG
# -------------------------------
with open("secret.json", "r") as f:
    config = json.load(f)

API_KEY = config["roboflow_api_key"]
MODEL_ID = config["model_id"]
IMAGE_PATH = 'esp32_photos/capture.jpg'

# -------------------------------
# CREATE CLIENT
# -------------------------------
client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=API_KEY
)

# -------------------------------
# CALORIE DATA
# -------------------------------
calorie_list = [
    ["Dhokla", 130],
    ["Aloo Gobhi", 200],
    ["Aloo Tikki", 87],
    ["Apple", 52],
    ["Banana", 90],
    ["Beetroot", 43],
    ["Boiled Egg", 155],
    ["Bread", 80],
    ["Brown Rice", 111],
    ["Chapati", 120],
    ["Chicken", 240],
    ["Cucumber", 16],
    ["Daal", 271],
    ["Dosa", 168],
    ["Rice", 130],
    ["Smoothie", 300],
    ["White Rice", 130]
]

# Convert list to dictionary for faster lookup
calorie_dict = {name.lower(): cal for name, cal in calorie_list}

# -------------------------------
# RUN INFERENCE
# -------------------------------
result = client.infer(IMAGE_PATH, model_id=MODEL_ID)

total_calories = 0

print("Predictions:")
for pred in result['predictions']:
    class_name = pred['class'].lower()
    conf = pred['confidence']
    x, y = pred.get('x'), pred.get('y')
    w, h = pred.get('width'), pred.get('height')

    calories = calorie_dict.get(class_name, 0)
    total_calories += calories

    print(f"Class: {class_name} | Confidence: {conf:.2f} | Calories: {calories} | Box: ({x}, {y}, {w}, {h})")

print(f"\nTotal estimated calories in image: {total_calories}")

