from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import io
import os
import json
from groq import Groq
from dotenv import load_dotenv
from starlette.responses import Response

# ------------------------------------------------------------
# InsuLink FastAPI server (Python 3.10 compatible)
#
# Create Python 3.10 venv:
#   py -3.10 -m venv venv
#   venv\Scripts\activate
#   pip install -r requirements.txt
# ------------------------------------------------------------

load_dotenv()  # Load variables from .env if present

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # front-end dev server on 5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize Groq client using env var. Set GROQ_API_KEY in your environment.
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
print(f"[server] GROQ_API_KEY set: {bool(GROQ_API_KEY)}")


class QAItem(BaseModel):
    category: str  # "med" | "food" | "sleep"
    text: str


class AnalyzeRequest(BaseModel):
    answers: list[QAItem]


@app.get("/questions")
def get_questions():
    """
    Return 9 total questions with id, category, and text.
    Frontend will shuffle and present them.
    """
    questions = [
        {"id": "med1", "category": "med", "text": "Did you take all prescribed medication today?"},
        {"id": "med2", "category": "med", "text": "Have you missed any insulin doses in the last 3 days?"},
        {"id": "med3", "category": "med", "text": "Are you following your insulin timing as prescribed?"},
        {"id": "food1", "category": "food", "text": "What did you eat most recently, and about how many carbs was it?"},
        {"id": "food2", "category": "food", "text": "Did you snack between meals today?"},
        {"id": "food3", "category": "food", "text": "Were your meals balanced with protein, carbs, and fiber today?"},
        {"id": "sleep1", "category": "sleep", "text": "How many hours did you sleep last night?"},
        {"id": "sleep2", "category": "sleep", "text": "Did you wake up during the night or have trouble falling asleep?"},
        {"id": "sleep3", "category": "sleep", "text": "Do you feel rested right now?"},
    ]
    return {"questions": questions}


@app.post("/tts")
async def tts(text: dict = Body(...)):
    """
    Text-to-speech using Groq if available, else fall back to gTTS.
    Returns MP3 bytes with content-type audio/mpeg.
    """
    input_text = (text or {}).get("text", "").strip()
    if not input_text:
        return Response(content=b"", media_type="audio/mpeg")

    # Try Groq TTS if supported by the current client version (OpenAI-compatible API)
    if groq_client is not None:
        try:
            # Some Groq client versions support an OpenAI-compatible TTS API.
            # If not supported, the call will raise and we'll fall back to gTTS.
            create = getattr(getattr(getattr(groq_client, "audio", None), "speech", None), "with_streaming_response", None)
            if create is not None:
                with groq_client.audio.speech.with_streaming_response.create(
                    model="gpt-4o-mini-tts",
                    voice="verse",
                    input=input_text,
                    format="mp3",
                ) as resp:
                    mp3_bytes = resp.read()
                    return Response(content=mp3_bytes, media_type="audio/mpeg")
        except Exception:
            # Fall back to gTTS below
            pass

    # Fallback: gTTS
    try:
        from gtts import gTTS
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=True) as tmp:
            gTTS(text=input_text, lang="en").save(tmp.name)
            tmp.seek(0)
            data = tmp.read()
            return Response(content=data, media_type="audio/mpeg")
    except Exception:
        # As a very last resort return silence
        return Response(content=b"", media_type="audio/mpeg")


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe uploaded audio using Groq Whisper.
    Accepts any typical audio/wav or audio/mpeg file.
    Returns {"text": "..."}
    """
    content = await file.read()

    text_result = ""
    if groq_client is not None:
        try:
            # OpenAI-compatible transcription call
            name = getattr(file, "filename", "audio.wav") or "audio.wav"
            resp = groq_client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=(name, content),
            )
            # Some SDKs return an object with .text, some have a dict
            text_result = getattr(resp, "text", None) or (resp.get("text") if isinstance(resp, dict) else "")
        except Exception:
            text_result = ""

    return {"text": (text_result or "").strip()}


def _suggestion_for(score: int) -> str:
    if score <= 3:
        return "This area needs urgent improvement. Aim for more consistency and support."
    if score <= 6:
        return "You're doing okay, but a few changes could help a lot."
    return "Great job! Keep up your healthy habits."


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Score med/food/sleep 1–10 using Groq LLM, then add suggestions and overall average.
    """
    # Build a compact, structured prompt
    answers_by_cat = {"med": [], "food": [], "sleep": []}
    for a in req.answers:
        cat = a.category if a.category in ("med", "food", "sleep") else "other"
        if cat in answers_by_cat:
            answers_by_cat[cat].append(a.text)

    prompt = (
        "You are a diabetes wellness evaluator. Read the user's answers and "
        "score each category from 1 to 10, integers only. Return valid JSON only with keys med, food, sleep.\n\n"
        f"Medication answers: {answers_by_cat['med']}\n"
        f"Food answers: {answers_by_cat['food']}\n"
        f"Sleep answers: {answers_by_cat['sleep']}\n\n"
        "Return JSON ONLY like {\"med\": 7, \"food\": 5, \"sleep\": 8}. No extra text."
    )

    med = food = sleep = 5
    source = "fallback"
    if groq_client is not None:
        try:
            chat = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            content = chat.choices[0].message.content  # type: ignore[attr-defined]
            parsed = json.loads(content)
            med = int(parsed.get("med", med))
            food = int(parsed.get("food", food))
            sleep = int(parsed.get("sleep", sleep))
            source = "groq"
        except Exception:
            # Use defaults if parsing fails
            med = food = sleep = 5
            source = "fallback"

    # Clamp values 1–10
    med = max(1, min(10, med))
    food = max(1, min(10, food))
    sleep = max(1, min(10, sleep))

    avg = (med + food + sleep) / 3.0
    return {
        "med": med,
        "food": food,
        "sleep": sleep,
        "avg": avg,
        "source": source,
        "suggestions": {
            "med": _suggestion_for(med),
            "food": _suggestion_for(food),
            "sleep": _suggestion_for(sleep),
        },
    }


if __name__ == "__main__":
    # Uvicorn compatible with Python 3.10
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
