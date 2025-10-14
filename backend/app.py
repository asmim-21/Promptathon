from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import math
import requests
import json
from pathlib import Path
import csv
from datetime import datetime

app = Flask(__name__)
CORS(app)  # allow requests from the React dev server

@app.get("/api/health")
def health():
    return jsonify({"ok": True})

@app.get("/api/categories")
def categories():
    return jsonify({"categories": ["Wealth Management", "Asset Management", "GOTO", "Global Markets", "Global Banking", "Global Research", "Finance", "Compliance", "Operations"]})

@app.get("/api/challenges")
def challenges():
    # Load challenges from JSON file placed next to this app.py
    try:
        base = Path(__file__).resolve().parent
        with open(base / "challenges.json", "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return jsonify({"challenges": data})
    except Exception as e:
        print("Failed to load challenges.json:", e)
        return jsonify({"challenges": {}})

def score_text(text: str) -> int:
    if not text:
        return 0
    length = len([w for w in text.split() if w.strip()])
    has_bullets = bool(__import__('re').search(r"\n(\-|\*|•)\s", text))
    has_numbers = bool(__import__('re').search(r"\b1\.\s|\b2\.\s|\b3\.\s", text))
    has_constraints = bool(__import__('re').search(r"(constraints|limit|cap at|no more than|exactly|format)", text, __import__('re').IGNORECASE))
    has_roles = bool(__import__('re').search(r"(you are|act as|role:|system:)", text, __import__('re').IGNORECASE))
    base = min(60, max(10, length))
    bonus = (10 if has_bullets else 0) + (10 if has_numbers else 0) + (10 if has_constraints else 0) + (10 if has_roles else 0)
    return min(100, base + bonus)


@app.post("/api/evaluate")
def evaluate():
    payload = request.json or {}
    prompt = payload.get("prompt", "")
    # If an LLM integration is provided via env, forward a simple request and attempt to parse text
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_url = os.getenv("OPENAI_API_URL")

    if openai_key and openai_url:
        try:
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            body = {"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "max_tokens": 256}
            r = requests.post(openai_url, json=body, headers=headers, timeout=10)
            r.raise_for_status()
            jr = r.json()
            # attempt to extract text from known shapes (OpenAI chat/completions)
            text = ""
            if isinstance(jr, dict):
                # OpenAI chat completion
                if jr.get("choices"):
                    ch = jr["choices"][0]
                    text = ch.get("message", {}).get("content") or ch.get("text") or ""
                elif jr.get("data"):
                    # some embeddings/other responses
                    text = jr.get("data")[0].get("text", "")
            score = score_text(text) if text else score_text(prompt)
            return jsonify({"ok": True, "score": score, "response": text})
        except Exception as e:
            # fall through to local scoring on error
            print("LLM request failed:", e)

    # Fallback: local scoring and a canned response
    s = score_text(prompt)
    resp = "(mock response) Received prompt and scored locally."
    return jsonify({"ok": True, "score": s, "response": resp})


@app.post("/api/echo")
def echo():
    data = request.json or {}
    return jsonify({"you_sent": data})


@app.get("/api/leaderboard")
def leaderboard():
    # Read submissions from CSV (created by /api/submit) and return sorted leaderboard
    base = Path(__file__).resolve().parent
    csv_path = base / "submissions.csv"
    rows = []
    if csv_path.exists():
        try:
            with open(csv_path, "r", encoding="utf-8", newline="") as fh:
                reader = csv.DictReader(fh)
                for r in reader:
                    # parse numeric fields
                    try:
                        score = int(r.get("score") or 0)
                    except Exception:
                        score = 0
                    try:
                        elapsed = int(r.get("elapsed_seconds")) if r.get("elapsed_seconds") not in (None, "") else None
                    except Exception:
                        elapsed = None
                    rows.append({
                        "name": r.get("name") or "",
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


@app.post("/api/submit")
def submit():
    payload = request.json or {}
    # expected fields: name, category, prompt, score, elapsed_seconds, response
    name = payload.get("name", "")
    category = payload.get("category", "")
    prompt = payload.get("prompt", "")
    response_text = payload.get("response", "")
    score = payload.get("score")
    elapsed = payload.get("elapsed_seconds")

    # Normalize
    try:
        score = int(score) if score is not None else ''
    except Exception:
        score = ''
    try:
        elapsed = int(elapsed) if elapsed is not None else ''
    except Exception:
        elapsed = ''

    base = Path(__file__).resolve().parent
    csv_path = base / "submissions.csv"
    # ensure file exists and has header
    header = ["timestamp", "name", "category", "prompt", "score", "elapsed_seconds", "response"]
    try:
        is_new = not csv_path.exists()
        with open(csv_path, "a", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=header)
            if is_new:
                writer.writeheader()
            writer.writerow({
                "timestamp": datetime.utcnow().isoformat(),
                "name": name,
                "category": category,
                "prompt": prompt,
                "score": score,
                "elapsed_seconds": elapsed,
                "response": response_text,
            })
    except Exception as e:
        print("Failed to write submission:", e)
        return jsonify({"ok": False, "error": "failed to save submission"}), 500

    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
