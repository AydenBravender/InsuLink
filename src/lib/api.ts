// src/lib/api.ts

const BASE = "http://127.0.0.1:8000";

export type Category = "med" | "food" | "sleep";
export type Question = { id: string; category: Category; text: string };
export type QAAnswer = { category: Category; text: string };

export async function getQuestions() {
  const res = await fetch(`${BASE}/questions`);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json() as Promise<{ questions: Question[] }>;
}

export async function ttsSpeak(text: string) {
  const res = await fetch(`${BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("TTS failed");
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  return url; // caller can new Audio(url).play()
}

export async function transcribeAudio(blob: Blob) {
  const form = new FormData();
  const filename = blob.type.includes("webm") ? "audio.webm" : "audio.wav";
  form.append("file", blob, filename);

  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    body: form,
  });

  return res.json() as Promise<{ text: string }>;
}

export async function analyzeAnswers(answers: QAAnswer[]) {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  return res.json() as Promise<{
    med: number;
    food: number;
    sleep: number;
    avg: number;
    suggestions?: { med: string; food: string; sleep: string };
  }>;
}
