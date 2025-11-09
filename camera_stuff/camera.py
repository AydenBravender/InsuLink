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




