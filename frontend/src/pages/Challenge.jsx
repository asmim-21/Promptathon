import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChallenges, gradePrompt } from "../api";

export default function Challenge() {
  const nav = useNavigate();
  const name = sessionStorage.getItem("player:name");
  const category = sessionStorage.getItem("player:category");
  const email = sessionStorage.getItem("player:email");

  const [challenges, setChallenges] = useState({});
  const [prompt, setPrompt] = useState("");
  const [score, setScore] = useState(null);
  const [responseText, setResponseText] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  // Track when user landed on page / began composing (for elapsed_seconds)
  const [startedAt] = useState(() => Date.now());

  async function onSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      alert("Please write a prompt first.");
      return;
    }
    setSubmitting(true);
    setError("");
    setScore(null);
    setResponseText(null);

    const elapsed_seconds = Math.round((Date.now() - startedAt) / 1000);

    try {
      const res = await gradePrompt({ name, email, category, prompt: trimmed, elapsed_seconds });

      if (!res?.ok) {
        setError(res?.error || "Grading failed");
        return;
      }

      const finalScore = res.score ?? res.details?.overall_score ?? null;
      setScore(finalScore);

      // Optional: show model output from first test case
      const sampleOut = res.details?.cases?.[0]?.model_output || null;
      setResponseText(sampleOut);
    } catch (e) {
      console.warn(e);
      setError("Network error while grading.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 className="title" style={{ textAlign: "left", marginBottom: 10 }}>
          {category} — {challenge?.title || "Challenge"}
        </h2>
        <div className="subtitle" style={{ textAlign: "right" }}>
          Player: <b style={{ color: "var(--text)" }}>{name}</b>
        </div>
      </div>

      <p className="subtitle" style={{ marginTop: 20 }}> Using the given example inputs, craft a prompt to generate the output </p>

      <div className="grid-2" style={{ marginTop: 20 }}>
        {/* Examples panel: now shows Input + Output (if present) */}
        <div className="panel">
          <h4 style={{ marginTop: 0 }}>Example Inputs & Outputs</h4>
          <div style={{ display: "grid", gap: 12 }}>
            {(challenge?.examples || []).map((ex, i) => (
              <div key={i} className="panel" style={{ padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 4 }}>Example {i + 1} — Input</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {ex.input}
                </pre>

                {"output" in ex && ex.output && (
                  <>
                    <div style={{ height: 8 }} />
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, marginBottom: 4 }}>Example {i + 1} — Output</div>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {ex.output}
                    </pre>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prompt authoring panel */}
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
          {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
          {score != null && (
            <div className="help" style={{ textAlign: "left" }}>
              Your score: <b style={{ color: "var(--text)" }}>{score}</b> / 100
              {responseText && (
                <div style={{ marginTop: 8 }}>
                  <h5 style={{ margin: "6px 0" }}>LLM response (sample from test case 1)</h5>
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