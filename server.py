from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
import uvicorn
import random
import os
import numpy as np
import soundfile as sf
import whisper
from llama_cpp import Llama
import gtts
import re

app = FastAPI()

# ---------------------
# Load Whisper + LLaMA
# ---------------------
whisper_model = whisper.load_model("base")
llm = Llama(
    model_path="models/mistral-7b-instruct-v0.1.Q2_K.gguf",
    n_ctx=2048,
    n_threads=4
)

# ---------------------
# Question bank
# ---------------------
QUESTION_SET = {
    "med": [
        "Did you take your medication today?",
        "How consistent were you with your medication timing?",
        "Did you miss any doses today?"
    ],
    "food": [
        "What did you eat for your main meals today?",
        "Did you have any sugary drinks or desserts today?",
        "Did you snack late at night?"
    ],
    "sleep": [
        "How many hours did you sleep last night?",
        "Did you wake up during the night?",
        "How rested do you feel this morning?"
    ]
}

@app.get("/questions")
def get_questions():
    return {
        "med": random.choice(QUESTION_SET["med"]),
        "food": random.choice(QUESTION_SET["food"]),
        "sleep": random.choice(QUESTION_SET["sleep"])
    }

# ---------------------
# TTS Endpoint
# ---------------------
@app.post("/tts")
def speak(text: str):
    filename = "tts_output.mp3"
    tts = gtts.gTTS(text=text, lang='en')
    tts.save(filename)
    return {"url": "/audio/tts_output.mp3"}

@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(filename)

# ---------------------
# Transcription
# ---------------------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio = await file.read()
    temp_path = "temp.wav"
    with open(temp_path, "wb") as f:
        f.write(audio)

    result = whisper_model.transcribe(temp_path)
    text = result["text"].strip()
    return {"text": text}

# ---------------------
# LLaMA Rating
# ---------------------
SYSTEM_PROMPT = """
You are a doctor evaluating a diabetic patient’s habits.
Rate the answer strictly from 1 to 10.
Only output the number.
"""

def score_answer(text: str):
    prompt = f"[INST] <<SYS>>{SYSTEM_PROMPT}<</SYS>>\n{text} [/INST]"
    resp = llm(prompt, max_tokens=5, temperature=0)
    out = resp["choices"][0]["text"].strip()
    match = re.search(r"\b([1-9]|10)\b", out)
    return int(match.group(0)) if match else 5

@app.post("/analyze")
async def analyze(answers: dict):
    a = answers["answers"]
    med = score_answer(a[0])
    food = score_answer(a[1])
    sleep = score_answer(a[2])

    avg = (med + food + sleep) / 3
    return {
        "med": med,
        "food": food,
        "sleep": sleep,
        "avg": avg
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
