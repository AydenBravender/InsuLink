import gtts
import pygame   
import os
import random
import sounddevice as sd
import numpy as np
import soundfile as sf
import time
import whisper
import glob
import sys
from llama_cpp import Llama
import re

total = 0
# Initialize pygame mixer
pygame.mixer.init()

# --- Configuration for Recording ---
CHUNK_SIZE = 1024
CHANNELS = 1
SAMPLE_RATE = 44100
SILENCE_THRESHOLD = 0.01
SILENCE_DURATION = 1.4
SILENCE_CHUNKS = int(SILENCE_DURATION * SAMPLE_RATE / CHUNK_SIZE)

def record_until_silence(num):
    print(f"\n🎙️ Starting recording for Answer {num+1}... Speak now.")
    audio_data = []
    silent_chunks_count = 0
    has_spoken = False 
    
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, dtype='float32') as stream:
        while True:
            chunk, overflowed = stream.read(CHUNK_SIZE)
            audio_data.append(chunk)
            rms_volume = np.sqrt(np.mean(chunk**2))
            
            if rms_volume > SILENCE_THRESHOLD:
                silent_chunks_count = 0
                has_spoken = True
            else:
                if has_spoken:
                    silent_chunks_count += 1

            if has_spoken and silent_chunks_count >= SILENCE_CHUNKS:
                print(f"🛑 Detected {SILENCE_DURATION} seconds of silence. Stopping recording.")
                break
                
    recording = np.concatenate(audio_data, axis=0)
    filename = f"recording_{num}.wav"
    sf.write(filename, recording, SAMPLE_RATE)
    print(f"💾 Recording saved as: {filename}")

def load_whisper_model():
    try:
        print("\n" + "="*50)
        print("Loading Whisper model 'base'... (First load may take time)")
        model = whisper.load_model("base")
        print("Whisper model loaded successfully.")
        print("="*50)
        return model
    except AttributeError:
        print("\n" + "!"*60)
        print(" CRITICAL ERROR: Could not find 'whisper.load_model'.")
        print(" Please ensure you have the correct OpenAI Whisper package installed:")
        print("      pip install -U openai-whisper")
        print("!"*60)
        sys.exit(1)
    except Exception as e:
        print(f"Error loading Whisper model: {e}")
        sys.exit(1)

def transcribe_audio(model, audio_path):
    print(f"  --> Transcribing file: {audio_path}")
    try:
        result = model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        return f"ERROR: Could not process file: {e}"

# --- Random Question Setup ---
question_med = [
    "Hello, welcome to InsuLink, your digital companion to all your diabetic needs"
    # "Did you check your blood sugar today?",
    # "What was your last blood sugar reading?",
    # "How many times did you check your glucose today?",
    # "Did you take your medication or insulin today?",
    # "What time did you take your first dose this morning?",
    # "Have you had any dizziness, sweating, or shaking today?",
    # "Did you feel very thirsty or urinate more than usual today?"
]

question_food = [
    "What did you eat for breakfast?",
    "What did you eat for lunch?",
    "What did you eat for dinner?",
    "Did you have any snacks or desserts today?",
    "Did you drink any sugary drinks today",
    "How many glasses of water did you drink today?",
    "Did you eat late at night, past 10pm?"
]

question_sleep = [
    "What time did you go to bed last night?",
    "What time did you wake up?",
    "How many times did you wake up during the night?",
    "How well did you sleep (1–10)?",
    "Did you nap today?",
    "How many hours did you sleep for?",
    "On a scale of 1-10, how rested do you feel?"
]

question_med_choice = random.choice(question_med)
question_food_choice = random.choice(question_food)
question_sleep_choice = random.choice(question_sleep)

questions = [question_med_choice, question_food_choice, question_sleep_choice]

# --- Ask Questions ---
for i in range(3):
    question_text = questions[i]

    tts = gtts.gTTS(text=question_text, lang='en')
    filename = "temp_speech.mp3"
    tts.save(filename)

    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)
    os.remove(filename)

    record_until_silence(i)

# --- Transcribe Answers ---
whisper_model = load_whisper_model()
recording_files = sorted(glob.glob("recording_*.wav"))

if not recording_files:
    print("❌ No matching recording files found.")
    sys.exit(0)

answers = {}

for i, filepath in enumerate(recording_files):
    # Transcribe audio
    transcription = transcribe_audio(whisper_model, filepath)
    question_text = questions[i] if i < len(questions) else "Unknown question"

    # Create variable names dynamically: answer_1, answer_2, etc.
    var_name = f"answer_{i}"
    answers[var_name] = transcription

    # Combine question and answer into a single string
    data = f"Question: {question_text} Answer: {transcription}"




# --- Initialize LLaMA ---
llm = Llama(
    model_path="models/mistral-7b-instruct-v0.1.Q2_K.gguf",
    n_ctx=2048,
    n_threads=4
)

# --- System prompt / context ---
SYSTEM_PROMPT = """
You are a helpful AI assistant and a doctor. 

- For each prompt, there is a question and a patient's answer. The patient will have diabetes, evalute their habits.
- Rate their answer strictly as an integer from 1 to 10, where 1 is incredibly unhealthy and 10 is very healthy.
- Only output the integer, nothing else. No text, no punctuation, no explanations.
- Do not make up information; only evaluate what is provided.
"""

def get_llama_response(user_input: str) -> int:
    """Send user input to LLaMA and get a numeric rating."""
    prompt = f"[INST] <<SYS>>\n{SYSTEM_PROMPT}\n<</SYS>>\n\n{user_input} [/INST]"

    response = llm(
        prompt,
        max_tokens=8,
        temperature=0,
        stop=["</s>"]
    )

    text = response["choices"][0]["text"].strip()
    
    # Extract first number between 1 and 10
    match = re.search(r"\b([1-9]|10)\b", text)
    if match:
        return int(match.group(0))
    else:
        # fallback in case model does something unexpected
        return 0
    

for i in range(3):
    user_input = answers[f"answer_{i}"]
    
    if user_input.lower() in ["exit", "quit"]:
        print("Goodbye!")
        break

    rating = get_llama_response(user_input)
    print(f"answer_{i}", rating)
    total += rating
    

print(total)


