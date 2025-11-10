"""FastAPI server for InsuLink.

Uses Groq Whisper for transcription and Groq Llama3 for analysis.
"""

import base64
import json
import os
import re
from typing import Dict, List, Tuple
from pathlib import Path

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
        "At what times did you take your medications?",
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
    scores: dict[str, int]
    average: float
    levels: dict[str, str]
    overview: dict[str, str]   # ✅ 3-category AI overviews

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
                """
        You are a clinical AI assistant. You will receive 3 categories of answers:

        - medication: 3 short answers
        - food: 3 short answers 
        - sleep: 3 short answers

        Your job:

        1. Assign an integer score 1–10 for EACH category.
        2. Generate a personalized OVERVIEW paragraph (2–4 sentences) that:
        - references EXACTLY what the user said  
        - explains risks + positives  
        - gives actionable improvements  
        - stays supportive and medically safe  
        - is written for a patient, not a clinician

        Return STRICT JSON ONLY in this exact shape:
        {
        "scores": { "med": <int>, "food": <int>, "sleep": <int> },
        "overview": "<paragraph>"
        }

        No extra text or commentary.
        """
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
    med_s, food_s, sleep_s = (
        int(scores.get("med", 5)),
        int(scores.get("food", 5)),
        int(scores.get("sleep", 5)),
    )
    avg = round((med_s + food_s + sleep_s) / 3, 1)

    # Raw overview string from the model
    overview_text = payload.get("overview", "")

    # ✅ Split overview into per-category fields (simple duplicate for now)
    overview = {
        "med": overview_text,
        "food": overview_text,
        "sleep": overview_text,
    }

    return {
        "scores": {"med": med_s, "food": food_s, "sleep": sleep_s},
        "average": avg,
        "levels": {"med": "yellow" if 4 <= med_s <= 6 else ("red" if med_s <= 3 else "green"),
                "food": "yellow" if 4 <= food_s <= 6 else ("red" if food_s <= 3 else "green"),
                "sleep": "yellow" if 4 <= sleep_s <= 6 else ("red" if sleep_s <= 3 else "green")},
        "overview": overview,
    }

# ============================================================
# ECG LIVE STATUS POLLING & ALERTING
# ============================================================

_BASE_DIR = Path(__file__).resolve().parent
ECG_STATUS_FILE = _BASE_DIR / "ecg_live_status.txt"

# persistent memory for state change detection
last_ecg_value = None
# Allow row counter start to be configured via env (default 0)
ECG_ROW_START = int(os.getenv("ECG_ROW_START", "0") or 0)
ecg_row_counter = ECG_ROW_START
_ecg_missing_warned = False
forced_ecg_hold_value = None
forced_ecg_hold_rows_remaining = 0


# Map numeric ECG classes to alert objects
ECG_MESSAGES = {
    1: {
        "title": "Irregular Heartbeat Detected",
        "message": "Your ECG shows signs of supraventricular ectopic beats. Monitor symptoms.",
        "severity": "caution"
    },
    2: {
        "title": "Abnormal Ventricular Activity",
        "message": "Signs of Ventricular ectopic beats detected. Recommended to follow up clinically.",
        "severity": "critical"
    },
    3: {
        "title": "Fusion Beat Detected",
        "message": "Signs of mixed ventricular activity observed. Monitoring advised.",
        "severity": "caution"
    },
    4: {
        "title": "ECG Signal Unclear",
        "message": "Poor ECG signal quality. Re-adjust sensor placement.",
        "severity": "caution"
    }
}


def generate_ecg_alert(value: int):
    """Return a standardized alert object or None."""
    return ECG_MESSAGES.get(value, None)


@app.get("/ecg/status")
def get_ecg_status():
    global last_ecg_value, ecg_row_counter, _ecg_missing_warned
    global forced_ecg_hold_value, forced_ecg_hold_rows_remaining

    # New robust reader: resolve path, treat empty as 0, and log rows
    value = 0

    # Resolve which file to read (env override, processing dir, default)
    env_path = os.getenv("ECG_STATUS_PATH")
    candidates = []
    if env_path:
        p = Path(env_path).expanduser()
        candidates.append(p if p.is_absolute() else (_BASE_DIR / p))
    candidates.extend([
        ECG_STATUS_FILE,
        _BASE_DIR / "AI" / "ECG" / "processing" / "ecg_live_status.txt",
        _BASE_DIR / "AI" / "ECG" / "ecg_live_status.txt",
    ])

    chosen_path = None
    for p in candidates:
        if p.exists():
            chosen_path = p
            break

    if chosen_path and chosen_path.exists():
        # Reset missing warning latch once the file appears
        if _ecg_missing_warned:
            _ecg_missing_warned = False
        try:
            raw = chosen_path.read_text(encoding="utf-8").strip()
            value = int(raw) if raw != "" else 0
        except Exception:
            value = 0
    else:
        # Only warn once per missing state to avoid spam
        if not _ecg_missing_warned:
            missing_at = candidates[0] if candidates else ECG_STATUS_FILE
            print(f"[ECG] FILE_MISSING at {missing_at}")
            _ecg_missing_warned = True
        value = 0

    # Apply demo hold override if active (persist for N rows)
    if (forced_ecg_hold_rows_remaining > 0) and (forced_ecg_hold_value is not None):
        value = forced_ecg_hold_value
        forced_ecg_hold_rows_remaining -= 1
        if forced_ecg_hold_rows_remaining <= 0:
            forced_ecg_hold_value = None

    # Log row with current value
    print(f"[ECG] Row {ecg_row_counter}: value={value}")
    ecg_row_counter += 1

    # Detect state change and produce alert only for non-zero values
    new_alert = None
    if value != last_ecg_value:
        alert_data = generate_ecg_alert(value)
        if alert_data is not None:
            new_alert = alert_data

    last_ecg_value = value

    return {"value": value, "new_alert": new_alert}


@app.post("/ecg/demo/force")
def ecg_demo_force(value: int = 1, rows: int = 100):
    """Demo helper: force /ecg/status to return `value` for `rows` polls (rows default=100)."""
    global forced_ecg_hold_value, forced_ecg_hold_rows_remaining
    forced_ecg_hold_value = int(value)
    forced_ecg_hold_rows_remaining = max(1, int(rows))
    return {"ok": True, "forced": forced_ecg_hold_value, "rows": forced_ecg_hold_rows_remaining}

    # Debug to confirm it's running
    print("[ECG] get_ecg_status called")

    # Initialize counter
    if "ecg_row_counter" not in globals():
        ecg_row_counter = 0

    # If file missing, assume normal
    if not os.path.exists(ECG_STATUS_FILE):
        print(f"[ECG] Row {ecg_row_counter}: FILE_MISSING → value=0")
        ecg_row_counter += 1
        return {"value": 0, "new_alert": None}

    # Try to read the file
    try:
        with open(ECG_STATUS_FILE, "r") as f:
            raw = f.read().strip()
            value = int(raw) if raw != "" else 0
    except:
        print(f"[ECG] Row {ecg_row_counter}: READ_ERROR → value=0")
        ecg_row_counter += 1
        return {"value": 0, "new_alert": None}

    # ✅ Print row + current ECG value
    print(f"[ECG] Row {ecg_row_counter}: value={value}")
    ecg_row_counter += 1

    # Detect state change
    new_alert = None
    if value != last_ecg_value:
        alert_data = generate_ecg_alert(value)
        if alert_data:
            print(f"[ECG] State change detected: old={last_ecg_value}, new={value}")
            new_alert = alert_data

    last_ecg_value = value

    return {
        "value": value,
        "new_alert": new_alert
    }

