// src/lib/api.ts
const BASE = "http://127.0.0.1:8000";

export async function getQuestions() {
  const r = await fetch(`${BASE}/questions`);
  if (!r.ok) throw new Error("Failed to load questions");
  const json = (await r.json()) as { questions: { med: string[]; food: string[]; sleep: string[] } };
  console.log("[api] questions", json);
  return json;
}

export async function ttsSpeak(text: string) {
  const form = new FormData();
  form.append("text", text);
  const r = await fetch(`${BASE}/tts`, { method: "POST", body: form });
  const json = await r.json();
  return json.audioUrl as string; // data: URL
}

export async function transcribeAudio(blob: Blob) {
  const form = new FormData();
  form.append("file", blob, "audio.webm");
  const r = await fetch(`${BASE}/transcribe`, { method: "POST", body: form });
  const json = (await r.json()) as { text: string };
  console.log("[api] transcript", json);
  return json;
}

export async function analyzeAnswers(payload: {
  med: string[];
  food: string[];
  sleep: string[];
}) {
  const r = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: payload }),
  });
  if (!r.ok) throw new Error("Analyze failed");
  const json = (await r.json()) as {
    scores: { med: number; food: number; sleep: number };
    average: number;
    levels: { med: string; food: string; sleep: string };
    suggestions: { med: string; food: string; sleep: string };
  };
  console.log("[api] analyze response", json);
  return json;
}
