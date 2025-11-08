import serial
import matplotlib.pyplot as plt
from matplotlib.widgets import Button
from collections import deque
import csv
from datetime import datetime
import time

PORT = "COM5"
BAUD = 115200
MAX_POINTS = 500
CSV_FILENAME = f"ecg_emg_live_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

# Open serial (Bluetooth SPP COM)
ser = serial.Serial(PORT, BAUD, timeout=1)
print(f"Connected to {PORT} at {BAUD}")

# Send SYNC to ESP to align clocks (host epoch ms)
host_ms = int(time.time() * 1000)
sync_msg = f"SYNC,{host_ms}\n"
ser.write(sync_msg.encode())
print("Sent:", sync_msg.strip())

# Optionally wait for ACKSYNC back from ESP (read line)
# If you want to verify, you can implement read/wait here

# Prepare CSV file and header
csv_file = open(CSV_FILENAME, "w", newline="")
csv_writer = csv.writer(csv_file)
csv_writer.writerow(["host_ts_ms", "seq", "ecg", "emg"])
csv_file.flush()

# Plot setup
plt.ion()
fig, ax = plt.subplots(2,1, figsize=(10,6))
plt.subplots_adjust(bottom=0.2)
ax[0].set_title("ECG")
ax[1].set_title("EMG")

timestamps = deque(maxlen=MAX_POINTS)
ecg_buf = deque(maxlen=MAX_POINTS)
emg_buf = deque(maxlen=MAX_POINTS)

# Stop button
stop_flag = False
def stop(event):
    global stop_flag
    stop_flag = True
ax_button = plt.axes([0.4, 0.03, 0.2, 0.06])
btn = Button(ax_button, 'STOP')
btn.on_clicked(stop)

try:
    while not stop_flag:
        try:
            line = ser.readline().decode('utf-8').strip()
        except Exception as e:
            print("Read error:", e)
            continue

        if not line:
            continue

        # Expected format from ESP:
        # timestamp,seq,ecg,emg
        parts = line.split(',')
        if len(parts) < 4:
            # you may receive ACKSYNC or other messages; print them
            print("MSG:", line)
            continue

        # parse values; timestamp is host epoch ms when sync used
        host_ts_ms = int(parts[0])
        seq = int(parts[1])
        ecg = int(parts[2])
        emg = int(parts[3])

        # Append for plot using host timestamp (converted to seconds relative)
        timestamps.append((host_ts_ms - host_ts_ms) / 1000.0)  # zero-based x axis
        ecg_buf.append(ecg)
        emg_buf.append(emg)

        # Write live to CSV (flush immediately)
        csv_writer.writerow([host_ts_ms, seq, ecg, emg])
        csv_file.flush()

        # Plot
        ax[0].cla()
        ax[0].plot(list(range(len(ecg_buf))), list(ecg_buf), color='blue')
        ax[0].set_ylabel("ECG")
        ax[1].cla()
        ax[1].plot(list(range(len(emg_buf))), list(emg_buf), color='red')
        ax[1].set_ylabel("EMG")
        ax[1].set_xlabel("Samples")
        plt.pause(0.01)

finally:
    csv_file.close()
    ser.close()
    print("Closed. CSV saved:", CSV_FILENAME)
