import serial
import csv
from datetime import datetime
import time

# ---------------- CONFIG ----------------
PORT = "COM7"
BAUD = 115200
CSV_FILENAME = f"ecg_emg_live_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

# ---------------- SERIAL SETUP ----------------
ser = serial.Serial(PORT, BAUD, timeout=1)
print(f"Connected to {PORT} at {BAUD}")

# Send SYNC to ESP to align clocks (optional)
host_start_ms = int(time.time() * 1000)
sync_msg = f"SYNC,{host_start_ms}\n"
ser.write(sync_msg.encode())
print("Sent:", sync_msg.strip())

# ---------------- CSV SETUP ----------------
csv_file = open(CSV_FILENAME, "w", newline="")
csv_writer = csv.writer(csv_file)
csv_writer.writerow(["host_ts_ms", "seq", "ecg", "emg"])
csv_file.flush()

print("Recording data. Press Ctrl+C to stop...")

# ---------------- MAIN LOOP ----------------
try:
    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
        except Exception as e:
            print("Read error:", e)
            continue

        if not line:
            continue

        parts = line.split(',')
        if len(parts) < 4:
            # Ignore any non-data messages from ESP
            continue

        # Parse numeric values safely
        try:
            host_ts_ms = int(parts[0])
            seq = int(parts[1])
            ecg = int(parts[2])
            emg = int(parts[3])
        except ValueError:
            continue

        # Write live CSV
        csv_writer.writerow([host_ts_ms, seq, ecg, emg])
        csv_file.flush()

except KeyboardInterrupt:
    print("\nStopped by user.")

finally:
    csv_file.close()
    ser.close()
    print("Closed. CSV saved:", CSV_FILENAME)
