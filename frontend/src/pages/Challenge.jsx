import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChallenges, evaluatePrompt, submitResult } from "../api";

export default function Challenge() {
  const nav = useNavigate();
  const name = sessionStorage.getItem("player:name");
  const category = sessionStorage.getItem("player:category");

  const [challenges, setChallenges] = useState({});
  const [prompt, setPrompt] = useState("");
  const [score, setScore] = useState(null);
  const [responseText, setResponseText] = useState(null);
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
        setChallenges(data || {});
      })
      .catch(() => setChallenges({}));
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

  // track when the user started editing / viewing the prompt area to measure elapsed
  const [startedAt, setStartedAt] = useState(null);

  useEffect(() => {
    // set start timestamp when component mounts or when prompt editing begins
    setStartedAt(Date.now());
  }, []);

  async function onSubmit() {
    if (!prompt.trim()) {
      alert("Please write a prompt first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await evaluatePrompt(prompt.trim());
      if (res && res.ok) {
        setScore(res.score ?? localScore(prompt.trim()));
        setResponseText(res.response ?? null);
      } else {
        // fallback to local scoring
        setScore(localScore(prompt.trim()));
        setResponseText(null);
      }
    } catch (err) {
      // network or server error -> fallback
      setScore(localScore(prompt.trim()));
      setResponseText(null);
    } finally {
      setSubmitting(false);
      // compute elapsed time in seconds and submit the result to backend
      try {
        const elapsedMs = startedAt ? Date.now() - startedAt : 0;
        const elapsedSeconds = Math.round(elapsedMs / 1000);
        const payload = {
          name: name || "",
          category: category || "",
          prompt: prompt,
          score: score != null ? score : localScore(prompt),
          elapsed_seconds: elapsedSeconds,
          response: responseText || "",
        };
        // fire-and-forget, but await to ensure it was saved when possible
        await submitResult(payload);
      } catch (e) {
        // ignore submit errors for now
        console.warn("failed to submit result", e);
      }
    }
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
              {responseText && (
                <div style={{ marginTop: 8 }}>
                  <h5 style={{ margin: "6px 0" }}>LLM response</h5>
                  <div className="panel" style={{ whiteSpace: "pre-wrap" }}>{responseText}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
