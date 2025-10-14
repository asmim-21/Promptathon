const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function getCategories() {
  const r = await fetch(`${BASE}/api/categories`);
  return r.json();
}

export async function getChallenges() {
  const r = await fetch(`${BASE}/api/challenges`);
  return r.json();
}

export async function evaluatePrompt(prompt) {
  const r = await fetch(`${BASE}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return r.json();
}

export async function getLeaderboard() {
  const r = await fetch(`${BASE}/api/leaderboard`);
  return r.json();
}

export async function submitResult(payload) {
  const r = await fetch(`${BASE}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}
