from flask import Flask, request, jsonify
from flask_cors import CORS
import os, json, time, csv
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---- Config ----
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-oss")

CHALLENGES_JSON = os.getenv("CHALLENGES_JSON", "challenges.json")
RESULTS_SUBMISSIONS_CSV = os.getenv("RESULTS_SUBMISSIONS_CSV", "promptathon_submissions.csv")
RESULTS_CASES_CSV = os.getenv("RESULTS_CASES_CSV", "promptathon_cases.csv")

def load_challenges():
    with open(CHALLENGES_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

def ensure_csv_headers():
    if not os.path.exists(RESULTS_SUBMISSIONS_CSV):
        with open(RESULTS_SUBMISSIONS_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["ts","name","email","category","challenge_id","title","score","elapsed_seconds","prompt"])
    if not os.path.exists(RESULTS_CASES_CSV):
        with open(RESULTS_CASES_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["ts","name","email","category","challenge_id","case_index","input","expected","model_output","judge_score","judge_reason"])

def call_router(messages, temperature=0.2, max_tokens=800):
    if not LLM_BASE_URL:
        raise RuntimeError("LLM_BASE_URL not configured")
    headers = {"Content-Type": "application/json"}
    if LLM_API_KEY:
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False
    }
    r = requests.post(LLM_BASE_URL, json=payload, headers=headers)
    r.raise_for_status()
    data = r.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(data)

# ----- Simple 2-pass pipeline -----
def generate_with_user_prompt(user_prompt: str, case_input: str) -> str:
    """Ask the model to apply the user's prompt to a given INPUT."""
    messages = [
        {"role": "system", "content": "Follow the user's prompt exactly. Produce only the requested output."},
        {"role": "user", "content": f"{user_prompt}\n\n---\nINPUT:\n{case_input}"}
    ]
    return call_router(messages, temperature=0.2, max_tokens=800).strip()

def judge_output(task: str, expected: str, model_output: str) -> dict:
    """
    Ask the model to score the output 0-100 with a short reason.
    We ask for strict JSON to make parsing robust.
    """

    judge_instructions = f"""
You are a strict evaluator. Score how well the candidate OUTPUT satisfies the TASK compared to the EXPECTED_OUTPUT (conceptual target), on a 0-100 scale.

Guidelines:
- 100 = matches all key requirements and closely aligns with the expected structure/content.
- 70-90 = mostly correct with minor issues.
- 40-60 = partially addresses.
- 0-30 = poor or irrelevant.
Return STRICT JSON: {{"score": <integer 0-100>, "reason": "<brief reason>"}}
"""

    user_block = f"""TASK:
{task}

EXPECTED_OUTPUT (conceptual target):
{expected}

CANDIDATE OUTPUT:
{model_output}
"""
    messages = [
        {"role": "system", "content": judge_instructions},
        {"role": "user", "content": user_block}
    ]
    raw = call_router(messages, temperature=0.0, max_tokens=300)
    # Try to parse JSON; if it fails, attempt a loose fallback.
    score, reason = 0, "Could not parse judge response."
    try:
        # common case: the model returns a JSON object
        parsed = json.loads(raw)
        score = int(parsed.get("score", 0))
        reason = str(parsed.get("reason", "")).strip() or reason
    except Exception:
        # try to find a JSON object substring
        try:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1:
                parsed = json.loads(raw[start:end+1])
                score = int(parsed.get("score", 0))
                reason = str(parsed.get("reason", "")).strip() or reason
        except Exception:
            reason = f"Judge raw: {raw[:200]}"
    # clamp score
    score = max(0, min(100, score))
    return {"score": score, "reason": reason}

def grade_prompt(category: str, user_prompt: str):
    challenges = load_challenges()
    meta = challenges.get(category)
    if not meta:
        raise ValueError(f"Unknown category: {category}")

    results = []
    case_scores = []
    for idx, case in enumerate(meta.get("test_cases", []), start=1):
        model_out = generate_with_user_prompt(user_prompt, case["input"])
        verdict = judge_output(meta["task"], case["expected"], model_out)
        case_scores.append(verdict["score"])
        results.append({
            "case_index": idx,
            "input": case["input"],
            "expected": case["expected"],
            "model_output": model_out,
            "judge_score": verdict["score"],
            "judge_reason": verdict["reason"]
        })

    overall = round(sum(case_scores) / len(case_scores), 2) if case_scores else 0.0
    return {
        "challenge_id": meta.get("id"),
        "title": meta.get("title"),
        "task": meta.get("task"),
        "overall_score": overall,
        "cases": results
    }

def append_to_csv(result: dict, name: str, email: str, category: str, user_prompt: str, elapsed_seconds: int):
    ensure_csv_headers()
    ts = int(time.time())
    # submissions.csv
    with open(RESULTS_SUBMISSIONS_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([ts, name, email, category, result["challenge_id"], result["title"], result["overall_score"], elapsed_seconds, user_prompt])
    # cases.csv
    with open(RESULTS_CASES_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for c in result["cases"]:
            w.writerow([
                ts, name, email, category, result["challenge_id"], c["case_index"],
                c["input"], c["expected"], c["model_output"], c["judge_score"], c["judge_reason"]
            ])

# ----- API -----
@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.get("/api/categories")
def categories():
    data = load_challenges()
    return jsonify({"categories": list(data.keys())})

@app.get("/api/challenges")
def challenges():
    data = load_challenges()
    public = {}
    for k, v in data.items():
        public[k] = {
            "id": v.get("id"),
            "title": v.get("title"),
            "task": v.get("task"),
            "examples": v.get("examples", [])
        }
    return jsonify({"challenges": public})

@app.post("/api/grade")
def api_grade():
    """
    JSON: { "name": "...", "category": "GWM", "prompt": "..." }
    """
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    category = body.get("category")
    prompt = (body.get("prompt") or "").strip()
    elapsed_seconds = int(body.get("elapsed_seconds") or 0) 
    if not name or not email or not category or not prompt:
        return jsonify({"ok": False, "error": "Missing name, email, category, or prompt"}), 400
    try:
        result = grade_prompt(category, prompt)
        append_to_csv(result, name, email, category, prompt, elapsed_seconds)
        return jsonify({"ok": True, "score": result["overall_score"], "details": result})
    except requests.Timeout:
        return jsonify({"ok": False, "error": "LLM request timed out"}), 504
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.get("/api/leaderboard")
def leaderboard():
    # Read submissions from CSV (created by /api/submit) and return sorted leaderboard
    rows = []
    if os.path.exists(RESULTS_SUBMISSIONS_CSV):
        try:
            with open(RESULTS_SUBMISSIONS_CSV, "r", encoding="utf-8", newline="") as fh:
                reader = csv.DictReader(fh)
                for r in reader:
                    # parse numeric fields
                    try:
                        score = float(r.get("score") or 0)
                    except Exception:
                        score = 0
                    try:
                        elapsed = int(r.get("elapsed_seconds")) if r.get("elapsed_seconds") not in (None, "") else None
                    except Exception:
                        elapsed = None
                    rows.append({
                        "name": r.get("name") or "",
                            "email": r.get("email") or "",
                        "category": r.get("category") or "",
                        "prompt": r.get("prompt") or "",
                        "score": score,
                        "elapsed_seconds": elapsed,
                        "response": r.get("response") or "",
                        "timestamp": r.get("timestamp") or "",
                    })
        except Exception as e:
            print("Failed to read submissions.csv:", e)

    # sort by score desc, then elapsed ascending (None treated as large)
    def sort_key(r):
        return (-r.get("score", 0), r.get("elapsed_seconds") if r.get("elapsed_seconds") is not None else 10 ** 9)

    rows_sorted = sorted(rows, key=sort_key)
    return jsonify({"leaderboard": rows_sorted})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
