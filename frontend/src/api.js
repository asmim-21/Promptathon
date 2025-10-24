const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function getCategories() {
  const r = await fetch(`${BASE}/api/categories`);
  return r.json();
}

export async function getChallenges() {
  const r = await fetch(`${BASE}/api/challenges`);
  return r.json();
}

export async function gradePrompt({ name, email, category, prompt, elapsed_seconds }) {
  const r = await fetch(`${BASE}/api/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, category, prompt, elapsed_seconds }),
  });
  return r.json();
}

export async function getLeaderboard() {
  const r = await fetch(`${BASE}/api/leaderboard`);
  return r.json();
}
