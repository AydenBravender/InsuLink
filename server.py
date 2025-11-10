"""FastAPI server for InsuLink.

Uses Groq Whisper for transcription and Groq Llama3 for analysis.
"""

import base64
import json
import os
import re
from typing import Dict, List, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel


print("[server] Server.py loaded ✅")
# ---------------------------
# Env & client
# ---------------------------
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("[server] WARNING: GROQ_API_KEY is missing. /analyze and /transcribe will fail.")
else:
    print("[server] GROQ_API_KEY loaded ✅")

client = Groq(api_key=GROQ_API_KEY)

# ---------------------------
# FastAPI app & CORS
# ---------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True}

# ---------------------------
# Question bank (9 total)
# ---------------------------
QUESTIONS: Dict[str, List[str]] = {
    "med": [
        "Did you take all prescribed diabetes meds or insulin today?",
        "At what times did you take them?",
        "Have you felt symptoms of high or low blood sugar today?",
    ],
    "food": [
        "What did you eat for breakfast?",
        "What did you eat for lunch and dinner?",
        "How many sugary drinks or desserts did you have?",
    ],
    "sleep": [
        "What time did you go to bed and wake up?",
        "Roughly how many hours did you sleep?",
        "How rested do you feel on a 1–10 scale?",
    ],
}

class AnalyzeRequest(BaseModel):
    answers: Dict[str, List[str]]  # { "med": [...3], "food": [...3], "sleep": [...3] }

class AnalyzeResponse(BaseModel):
    scores: Dict[str, int]         # { "med": 1..10, "food": 1..10, "sleep": 1..10 }
    average: float                 # mean of 3
    levels: Dict[str, str]         # "red" | "yellow" | "green"
    suggestions: Dict[str, str]    # text suggestions per category

# ---------------------------
# Utility: bucket + suggestions
# ---------------------------
def bucket_and_suggest(score: int, category: str) -> Tuple[str, str]:
    if 1 <= score <= 3:
        level = "red"
    elif 4 <= score <= 6:
        level = "yellow"
    else:
        level = "green"

    BANK = {
        "med": {
            "red":   "You’re missing doses or timing. Set reminders and talk with your provider about barriers.",
            "yellow":"Good consistency—tighten timing windows and log doses to spot patterns.",
            "green": "Great adherence—keep logging and follow your plan.",
        },
        "food": {
            "red":   "Reduce sugary drinks and refined carbs; add fiber and lean protein to each meal.",
            "yellow":"Portions are okay—tweak snacks and reduce late-night eating.",
            "green": "Balanced intake—keep hydration and regular meals.",
        },
        "sleep": {
            "red":   "Aim for a stable schedule and a dark, cool room; cut screens before bed.",
            "yellow":"You’re close—try consistent bed/wake times and brief daytime light exposure.",
            "green": "Solid routine—maintain consistency and wind-down habits.",
        },
    }
    return level, BANK[category][level]

# ---------------------------
# Routes
# ---------------------------
@app.get("/questions")
def get_questions():
    return {"questions": QUESTIONS}

@app.post("/tts")
async def tts(text: str = Form(...)):
    """
    Real TTS using Groq's gpt-4o-mini-tts engine.
    Returns a base64-encoded MP3.
    """

    try:
        tts_response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="alloy",        # available voices: alloy, verse, shimmer
            input=text
        )

        audio_bytes = tts_response.audio  # raw bytes
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")

        return {"audioUrl": f"data:audio/mp3;base64,{b64_audio}"}

    except Exception as e:
        print("[TTS ERROR]", e)
        # Return silence fallback
        return {"audioUrl": ""}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    data = await file.read()
    filename = file.filename or "audio.webm"
    content_type = file.content_type or "audio/webm"

    try:
        tr = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=(filename, data, content_type),
        )
        return {"text": tr.text}
    except Exception as e:
        print("[/transcribe] ERROR:", repr(e))
        return {"text": ""}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    system = (
        "You are a clinician assistant for a diabetes check-in. "
        "Given 3 categories (medication, food, sleep) and 3 short answers per category, "
        "rate each category from 1-10 strictly as an integer; DO NOT average them yourself. "
        "Return ONLY strict JSON of the form: "
        '{"scores":{"med":<int>,"food":<int>,"sleep":<int>}} with no commentary.'
    )

    user = {
        "med": req.answers.get("med", []),
        "food": req.answers.get("food", []),
        "sleep": req.answers.get("sleep", []),
    }

    try:
        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user)},
            ],
        )
        raw = chat.choices[0].message.content.strip()
    except Exception as e:
        print("[/analyze] ERROR calling Groq:", repr(e))
        raw = ""

    print("----- RAW MODEL OUTPUT -----")
    print(raw)
    print("----- USER ANSWERS SENT INTO MODEL -----")
    print(user)
    print("-----------------------------")

    # Parse robustly
    try:
        m = re.search(r"\{.*\}", raw, re.S)
        payload = json.loads(m.group(0)) if m else {}
    except Exception:
        payload = {"scores": {"med": 5, "food": 5, "sleep": 5}}

    scores = payload.get("scores", {"med": 5, "food": 5, "sleep": 5})
    med_s, food_s, sleep_s = int(scores.get("med", 5)), int(scores.get("food", 5)), int(scores.get("sleep", 5))
    avg = round((med_s + food_s + sleep_s) / 3, 1)

    med_level, med_sugg = bucket_and_suggest(med_s, "med")
    food_level, food_sugg = bucket_and_suggest(food_s, "food")
    sleep_level, sleep_sugg = bucket_and_suggest(sleep_s, "sleep")

    return AnalyzeResponse(
        scores={"med": med_s, "food": food_s, "sleep": sleep_s},
        average=avg,
        levels={"med": med_level, "food": food_level, "sleep": sleep_level},
        suggestions={"med": med_sugg, "food": food_sugg, "sleep": sleep_sugg},
    )
