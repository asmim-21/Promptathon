import React, { useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI controls
  const [q, setQ] = useState("");                 // name search
  const [cat, setCat] = useState("All");          // category filter

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

  // Build category options dynamically from data
  const categories = useMemo(() => {
    const set = new Set(rows.map(r => (r.category || "").trim()).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  // Filter rows by name + category
  const filtered = useMemo(() => {
    const nameQ = q.trim().toLowerCase();
    return rows.filter(r => {
      const matchesName =
        !nameQ || (r.name || "").toLowerCase().includes(nameQ);
      const matchesCat = cat === "All" || (r.category || "") === cat;
      return matchesName && matchesCat;
    });
    // If you want client-side sorting (e.g., Score desc, Elapsed asc), use:
    // .sort((a,b) => (b.score ?? -1) - (a.score ?? -1) || (a.elapsed_seconds ?? 1e9) - (b.elapsed_seconds ?? 1e9));
  }, [rows, q, cat]);

  if (loading) return <div>Loading leaderboard…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      {/* Header: title left, filters right */}
      <div className="leaderboard-header" style={{ marginBottom: 12 }}>
        <h2 className="leaderboard-title">Leaderboard</h2>

        {/* Controls */}
        <div className="filters">
          <input
            className="input input--compact"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search by name"
          />
          <select
            className="input input--compact"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <div className="subtitle" style={{ marginBottom: 6 }}>
        Showing <b>{filtered.length}</b> of {rows.length}
      </div>

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
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 12 }}>No entries match your filters.</td>
            </tr>
          )}
          {filtered.map((r, i) => (
            <tr key={`${r.name || "anon"}-${r.category || "cat"}-${i}`}>
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