from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
import time
import pandas as pd

# ------------------ Setup ------------------
params = BrainFlowInputParams()
params.serial_port = ""       # leave empty for BLE scan
params.mac_address = ""       # leave empty, BrainFlow will scan for the Muse S
params.other_info = "MuseS-3390"  # exact device name

# Initialize board
board = BoardShim(BoardIds.MUSE_S_BOARD.value, params)

try:
    print("Preparing session... Make sure Muse S is awake and worn.")
    board.prepare_session()
    
    print("Starting EEG stream...")
    board.start_stream()
    
    # ------------------ Collect data ------------------
    record_seconds = 30  # how long to record EEG
    time.sleep(record_seconds)  # wait for data to accumulate
    
    print("Fetching data...")
    data = board.get_board_data()
    
    # ------------------ Stop session ------------------
    board.stop_stream()
    board.release_session()
    
    print(f"EEG data shape: {data.shape}")
    
    # ------------------ Optional: save to CSV ------------------
    df = pd.DataFrame(data.T, columns=[f"Channel_{i}" for i in range(data.shape[0])])
    df.to_csv("muse_s_data.csv", index=False)
    print("Data saved to 'muse_s_data.csv'")

except Exception as e:
    print("Error:", e)
    board.release_session()
