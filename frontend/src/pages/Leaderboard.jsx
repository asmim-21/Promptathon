import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const j = await getLeaderboard();
        if (mounted) setRows(j.leaderboard || []);
      } catch (e) {
        setError(e.message || "Failed to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  if (loading) return <div>Loading leaderboard…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Leaderboard</h2>
      <p>Top players by score. Elapsed time is optional.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>#</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Category</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Score</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 8 }}>Elapsed (s)</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 12 }}>No entries yet.</td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: 8 }}>{i + 1}</td>
              <td style={{ padding: 8 }}>{r.name || "—"}</td>
              <td style={{ padding: 8 }}>{r.category || "—"}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{r.score ?? "—"}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{r.elapsed_seconds != null ? r.elapsed_seconds : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
