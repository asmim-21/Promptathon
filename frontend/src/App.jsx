import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Challenge from "./pages/Challenge";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <div className="app">
      <header
        className="header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/" className="header__logo">
            <img src="/ubs-logo.svg" alt="UBS" />
          </Link>
        </div>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <Link to="/" style={{ textDecoration: "none", color: "black" }}>
            <h1 className="header__title" style={{ margin: 0 }}>Promptathon</h1>
          </Link>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/leaderboard" style={{ textDecoration: "none" }}>Leaderboard</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  );
}
