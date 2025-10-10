const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function getCategories() {
  const r = await fetch(`${BASE}/api/categories`);
  return r.json();
}

export async function getChallenges() {
  const r = await fetch(`${BASE}/api/challenges`);
  return r.json();
}
