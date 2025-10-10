import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChallenges } from "../api";

const FALLBACK = {
  GWM: {
    title: "Summarize a client’s portfolio review",
    task:
      "Write a prompt that asks an LLM to summarize a client's last quarter portfolio performance, highlight risk exposures, and propose 2 actionable rebalancing suggestions.",
    examples: [
      { input: "Holdings: 40% equities (US large-cap), 40% bonds (IG), 20% cash. Q3 perf: +2.1%" },
      { input: "Client risk: Moderate; Constraints: no energy sector >10%" },
    ],
  },
  IB: {
    title: "Deal teaser extraction",
    task:
      "Craft a prompt to extract the 5 most compelling selling points from a deal teaser PDF, with bullet points capped at 20 words each.",
    examples: [
      { input: "Sector: FinTech; Geography: APAC; Revenue: $120M; Growth: 35% YoY" },
      { input: "Differentiators: proprietary fraud engine; 200+ enterprise clients" },
    ],
  },
  AM: {
    title: "ESG highlights generator",
    task: "Create a prompt that turns raw KPI data into a concise ESG summary paragraph for a fund factsheet.",
    examples: [
      { input: "Carbon intensity: -18% vs benchmark; Board diversity: 42%" },
      { input: "Engagements: 23; Exclusions: thermal coal >25% revenue" },
    ],
  },
  "Group Functions": {
    title: "Policy Q&A author",
    task:
      "Write a prompt to convert a long internal policy into a Q&A with clear, compliance-friendly answers and citations to sections.",
    examples: [
      { input: "Policy: Travel & Expenses v3.2; Sections 4, 7 most asked" },
      { input: "Audience: new hires; Tone: plain language" },
    ],
  },
  Tech: {
    title: "Bug report triage",
    task:
      "Design a prompt that classifies bug reports by severity, extracts reproduction steps, and suggests an owner team.",
    examples: [{ input: "Report: 'App crashes when uploading CSV > 5MB'" }, { input: "Modules: Upload service, Parser, UI" }],
  },
};

export default function Challenge() {
  const nav = useNavigate();
  const name = sessionStorage.getItem("player:name");
  const category = sessionStorage.getItem("player:category");

  const [challenges, setChallenges] = useState({});
  const [prompt, setPrompt] = useState("");
  const [score, setScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!name || !category) nav("/");
  }, [name, category, nav]);

  useEffect(() => {
    let mounted = true;
    getChallenges()
      .then((d) => {
        if (!mounted) return;
        const data = d?.challenges;
        setChallenges(data && Object.keys(data).length ? data : FALLBACK);
      })
      .catch(() => setChallenges(FALLBACK));
    return () => (mounted = false);
  }, []);

  const challenge = useMemo(() => challenges[category] || null, [challenges, category]);

  function localScore(text) {
    if (!text) return 0;
    const length = text.split(/\s+/).filter(Boolean).length;
    const hasBullets = /\n(\-|\*|•)\s/.test(text);
    const hasNumbers = /\b1\.\s|\b2\.\s|\b3\.\s/.test(text);
    const hasConstraints = /(constraints|limit|cap at|no more than|exactly|format)/i.test(text);
    const hasRoles = /(you are|act as|role:|system:)/i.test(text);
    const base = Math.min(60, Math.max(10, length));
    const bonus = (hasBullets ? 10 : 0) + (hasNumbers ? 10 : 0) + (hasConstraints ? 10 : 0) + (hasRoles ? 10 : 0);
    return Math.min(100, base + bonus);
  }

  async function onSubmit() {
    if (!prompt.trim()) {
      alert("Please write a prompt first.");
      return;
    }
    setSubmitting(true);
    const s = localScore(prompt.trim());
    await new Promise((r) => setTimeout(r, 300));
    setScore(s);
    setSubmitting(false);
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 className="title" style={{ textAlign: "left", marginBottom: 0 }}>
          {category} — {challenge?.title || "Challenge"}
        </h2>
        <div className="subtitle" style={{ textAlign: "right" }}>
          Player: <b style={{ color: "var(--text)" }}>{name}</b>
        </div>
      </div>

      <p className="subtitle" style={{ marginTop: 8 }}>{challenge?.task}</p>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="panel">
          <h4 style={{ marginTop: 0 }}>Example Inputs</h4>
          <ul style={{ marginTop: 8 }}>
            {(challenge?.examples || []).map((e, i) => (
              <li key={i}><code>{e.input}</code></li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h4 style={{ marginTop: 0 }}>Your Prompt</h4>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write an effective, structured prompt…"
            rows={10}
            className="input"
            style={{ width: "100%", textAlign: "left", resize: "vertical" }}
          />
          <button className="btn btn--primary" onClick={onSubmit} disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? "Scoring…" : "Submit"}
          </button>
          {score != null && (
            <div className="help" style={{ textAlign: "left" }}>
              Your score: <b style={{ color: "var(--text)" }}>{score}</b> / 100
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
