// src/lib/api.ts

const API_URL = "http://127.0.0.1:8000";

export async function getQuestions() {
  const res = await fetch(`${API_URL}/questions`);
  return res.json();
}

export async function ttsSpeak(text: string) {
  const res = await fetch(`${API_URL}/tts?text=${encodeURIComponent(text)}`, {
    method: "POST",
  });
  const data = await res.json();
  return API_URL + data.url; // MP3 file URL
}

export async function transcribeAudio(blob: Blob) {
  const form = new FormData();
  form.append("file", blob, "audio.wav");

  const res = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: form,
  });

  return res.json(); // { text: "..." }
}

export async function analyzeAnswers(answers: string[]) {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  return res.json(); // { med, food, sleep, avg }
}
