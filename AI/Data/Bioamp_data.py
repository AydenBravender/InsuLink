import requests
import csv
from datetime import datetime
import time

# ---------------- CONFIG ----------------
ESP32_IP = "172.20.10.5"  # replace with your ESP32 IP
BIOAMP_URL = f"http://{ESP32_IP}:8081/bioamp"
CSV_FILENAME = f"bioamp_live_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
POLL_INTERVAL = 0.05  # seconds, adjust for desired data rate

# ---------------- CSV SETUP ----------------
csv_file = open(CSV_FILENAME, "w", newline="")
csv_writer = csv.writer(csv_file)
csv_writer.writerow(["host_ts_ms", "bioamp1", "bioamp2"])
csv_file.flush()

print("Recording data. Press Ctrl+C to stop...")

# ---------------- MAIN LOOP ----------------
try:
    while True:
        try:
            # GET latest data from ESP32 server
            response = requests.get(BIOAMP_URL, timeout=1)
            if response.status_code != 200:
                continue
            
            data = response.text.strip()
            # Example: "bioamp1:123,bioamp2:456"
            bioamp1 = ""
            bioamp2 = ""
            if "bioamp1" in data:
                bioamp1 = data.split("bioamp1:")[1].split(",")[0]
            if "bioamp2" in data:
                bioamp2 = data.split("bioamp2:")[1].split(",")[0]

            host_ts_ms = int(time.time() * 1000)
            
            # Write live CSV
            csv_writer.writerow([host_ts_ms, bioamp1, bioamp2])
            csv_file.flush()
        
        except requests.exceptions.RequestException as e:
            print("Connection error:", e)
        except Exception as e:
            print("Error parsing data:", e)

        time.sleep(POLL_INTERVAL)

except KeyboardInterrupt:
    print("\nStopped by user.")

finally:
    csv_file.close()
    print("CSV saved:", CSV_FILENAME)
