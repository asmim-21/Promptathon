import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Challenge from "./pages/Challenge";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="header__logo">
          <img src="/ubs-logo.svg" alt="UBS" />
        </Link>

        <Link to="/" style={{ textDecoration: "none", color: "black" }}>
          <h1 className="header__title">Promptathon</h1>
        </Link>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/challenge" element={<Challenge />} />
      </Routes>
    </div>
  );
}
