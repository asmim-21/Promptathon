import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api";

export default function Home() {
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [needName, setNeedName] = useState(false);
  const [needCategory, setNeedCategory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then((d) => setCategories((d?.categories || []).slice(0, 9)))
      .catch(() => setError("Could not load categories from the server."));
  }, []);

  function go() {
    const okName = !!name.trim();
    const okCat = !!category;
    setNeedName(!okName);
    setNeedCategory(!okCat);
    if (!okName || !okCat) return;
    sessionStorage.setItem("player:name", name.trim());
    sessionStorage.setItem("player:category", category);
    nav("/challenge");
  }

  return (
    <div className="container">
      <h2 className="title">Your Division</h2>
      <p className="subtitle">
        Pick a card below, enter your name, then press <b>Enter</b> (or click <b>Continue</b>)
      </p>

      {error && <div className="error">{error}</div>}

      <div className="pyramid-grid" role="list" aria-label="Division choices">
        {categories.map((c) => (
          <button
            key={c}
            role="listitem"
            aria-pressed={category === c}
            aria-label={`Select ${c}`}
            className={`card ${category === c ? "card--selected" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="row-center">
        <h2 className="title">Your Name</h2>

        <div className="inline">
          <input
            className="input"
            id="player-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNeedName(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Type your name and press Enter"
          />

          <button className="btn btn--primary" onClick={go}>
            Continue
          </button>
        </div>

        <div className="help">
          Selected: {category ? <b>{category}</b> : <i>none</i>}
        </div>

        {(needName || needCategory) && (
          <div className="error">
            {!name.trim() ? "Please enter your name. " : ""}
            {!category ? "Please select a division." : ""}
          </div>
        )}
      </div>
    </div>
  );
}
