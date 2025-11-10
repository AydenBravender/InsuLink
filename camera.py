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
    ["boiled-egg", 155],
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
    # print(pred)
    class_name = pred['class'].lower()
    conf = pred['confidence']
    x, y = pred.get('x'), pred.get('y')
    w, h = pred.get('width'), pred.get('height')

    calories = calorie_dict.get(class_name, 0)
    total_calories += calories

    print(f"Class: {class_name} | Confidence: {conf:.4f} | Calories: {calories} | Box: ({x}, {y}, {w}, {h})")

print(f"\nTotal estimated calories in image: {total_calories}")

