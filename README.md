# Promptathon

Promptathon is a small full-stack demo for running prompt-engineering challenges against an LLM router.

The project includes:
- a Flask backend (under `backend/`) that runs challenge test-cases, calls an LLM endpoint, grades outputs, and records results as CSVs
- a React + Vite frontend (under `frontend/`) that provides a simple UI to submit prompts and view leaderboards

This README explains how to set up and run the app locally (Windows/cmd), the environment variables used by the backend, and the available API endpoints.

## Repository structure

- `backend/` - Flask app and challenge data
	- `app.py` - main Flask application and grading pipeline
	- `challenges.json` - challenge definitions and test cases
	- `promptathon_submissions.csv`, `promptathon_cases.csv` - generated output CSVs (created at runtime)
	- `requirements.txt` - Python dependencies
- `frontend/` - React + Vite app
	- `package.json` - frontend dependencies and scripts
	- `src/` - React source files

## Prerequisites

- Python 3.8+ (3.11 recommended)
- pip
- Node.js 18+ and npm

## Backend (Flask) — setup and run (Windows / cmd.exe)

1. Open a command prompt and change to the backend folder:

```cmd
cd backend
```

2. Create and activate a virtual environment:

```cmd
python -m venv venv
venv\Scripts\activate
```

3. Install Python dependencies:

```cmd
pip install -r requirements.txt
```

4. Configure environment variables.

Create a `.env` file in `backend/` (or set variables in the shell). The backend supports the following variables (defaults shown where applicable):

- `LLM_BASE_URL` (required at runtime unless you stub calls) — the router/LLM endpoint URL (no trailing slash)
- `LLM_API_KEY` (optional) — API key if the router requires Authorization: Bearer <key>
- `LLM_MODEL` (optional, default: `gpt-oss`) — model name sent to the router
- `CHALLENGES_JSON` (optional, default: `challenges.json`) — path to challenge definitions
- `RESULTS_SUBMISSIONS_CSV` (optional, default: `promptathon_submissions.csv`) — submissions CSV
- `RESULTS_CASES_CSV` (optional, default: `promptathon_cases.csv`) — per-case CSV

Example `.env` (put in `backend\.env`):

```text
LLM_BASE_URL=https://your-llm-router.example.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=gpt-oss
```

5. Start the backend (development):

```cmd
python app.py
```

By default Flask runs on port 5000. You should see the health endpoint at `http://127.0.0.1:5000/api/health`.

Notes:
- The backend writes/creates the two CSV files listed above in the `backend/` directory when the first submissions are saved.
- If you don't have a real LLM router, you can point `LLM_BASE_URL` at a local stub that returns the same shape of JSON the app expects.

## Frontend (React + Vite) — setup and run

1. Open a second terminal and change to the frontend folder:

```cmd
cd frontend
```

2. Install dependencies and run the dev server:

```cmd
npm install
npm run dev
```

The dev server runs by default on `http://localhost:5173` (Vite). The frontend uses the backend API — update the frontend code or a proxy if your backend is on a different host/port.

## API endpoints

- `GET /api/health` — returns { ok: true }
- `GET /api/categories` — returns a list of challenge category keys from `challenges.json`
- `GET /api/challenges` — returns public metadata for each challenge
- `POST /api/grade` — grade a prompt against a category
	- expected JSON body: { "name": "YourName", "category": "<category-key>", "prompt": "...", "elapsed_seconds": <int, optional> }
	- returns JSON with overall score and details per test case
- `GET /api/leaderboard` — returns submissions sorted by score (reads `promptathon_submissions.csv`)
