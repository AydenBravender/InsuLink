from gtts import gTTS
from playsound import playsound
import os
import random
import sounddevice as sd
import numpy as np
import soundfile as sf
import time

# --- Configuration ---
CHUNK_SIZE = 1024       # Number of frames in a chunk
CHANNELS = 1            # Mono recording
SAMPLE_RATE = 44100     # Standard sample rate (Hz)
SILENCE_THRESHOLD = 0.01  # Volume level below which we consider silence (Adjust this!)
SILENCE_DURATION = 1.4  # Time in seconds of silence needed to stop recording

# Calculate the number of chunks that constitute the silence duration
SILENCE_CHUNKS = int(SILENCE_DURATION * SAMPLE_RATE / CHUNK_SIZE)

# Code needs wifi for speech to text

## List of questions to ask:
questions = ["How are you?", "How often do you work out?", "How long do you work out for?", "How much sleep did you get"]

num_of_questions = 2
end = len(questions)
pool_of_numbers = range(0, end)
unique_random_numbers = random.sample(pool_of_numbers, num_of_questions)
print(unique_random_numbers, pool_of_numbers)

for i in range(len(unique_random_numbers)):

    tts = gTTS(text=questions[unique_random_numbers[i]], lang='en') # Create the TTS object
    # Save the audio file (gTTS creates a file, it doesn't stream audio directly)
    filename = "temp_speech.mp3"
    tts.save(filename) 
    playsound(filename) # Play the audio
    os.remove(filename) # Clean up the file

    record_until_silence(i)











def record_until_silence(num):
    print("🎙️ Starting recording... Speak now.")
    audio_data = []
    silent_chunks_count = 0
    has_spoken = False 
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype='float32') as stream:
        while True:
            # Read a chunk of audio data
            chunk, overflowed = stream.read(CHUNK_SIZE)
            audio_data.append(chunk)
            rms_volume = np.sqrt(np.mean(chunk**2))
            # 1. Check for activity
            if rms_volume > SILENCE_THRESHOLD:
                # Sound detected: reset silent counter and set spoken flag
                silent_chunks_count = 0
                has_spoken = True
            else:
                # Silence detected: increment counter if we've already started recording
                if has_spoken:
                    silent_chunks_count += 1

            if has_spoken and silent_chunks_count >= SILENCE_CHUNKS:
                print(f"🛑 Detected {SILENCE_DURATION} seconds of silence. Stopping recording.")
                break
    recording = np.concatenate(audio_data, axis=0)
    filename = f"recording_{num}.wav"

    sf.write(filename, recording, SAMPLE_RATE)
    print(f"💾 Recording saved as: {filename}")
    



