# yolo_test_debug_single.py
from ultralytics import YOLO
import os

# -------------------------------
# CONFIGURATION
# -------------------------------
MODEL_PATH = 'models/bestcode.pt'       # Path to your trained model
TEST_IMAGE = 'image.png'            # Your single test image
OUTPUT_FOLDER = 'output_results'    # Where to save annotated image
CONF_THRESHOLD = 0.1                # Low threshold to catch all detections

# -------------------------------
# CREATE OUTPUT FOLDER IF NOT EXISTS
# -------------------------------
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# -------------------------------
# LOAD MODEL
# -------------------------------
print(f"Loading YOLOv8 model from {MODEL_PATH}...")
model = YOLO(MODEL_PATH)

# Print class names
print("Model classes:", model.names)

# -------------------------------
# RUN PREDICTION
# -------------------------------
print(f"Processing {TEST_IMAGE}...")
results_list = model(TEST_IMAGE, conf=CONF_THRESHOLD)

for i, result in enumerate(results_list):
    # Print all detected boxes, classes, and confidence scores
    if len(result.boxes) == 0:
        print("No detections found")
    else:
        print("Detected boxes (xyxy):", result.boxes.xyxy)
        print("Class IDs:", result.boxes.cls)
        print("Confidence scores:", result.boxes.conf)
    
    # Save annotated image
    save_path = os.path.join(OUTPUT_FOLDER, f"annotated_{os.path.basename(TEST_IMAGE)}")
    result.save(save_path)
    print(f"Annotated image saved to '{save_path}'")

print("\nPrediction completed!")
