import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api";

export default function Home() {
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");

  // Validation flags
  const [needName, setNeedName] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);
  const [needCategory, setNeedCategory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then((d) => setCategories((d?.categories || []).slice(0, 9)))
      .catch(() => setError("Could not load categories from the server."));
  }, []);

  // Email must be first.last@ubs.com (allowing letters, hyphens, and apostrophes)
  const ubsEmailRe = /^[a-z][a-z'\-]+\.[a-z][a-z'\-]+@ubs\.com$/i;

  function titleCase(word) {
    return word
      .toLowerCase()
      .replace(/^[a-z]|[-'\s][a-z]/g, (m) => m.toUpperCase());
  }

  function deriveNameFromEmail(addr) {
    const m = addr.toLowerCase().match(/^([^@]+)@ubs\.com$/);
    if (!m) return "";
    const [first, last] = m[1].split(".");
    if (!first || !last) return "";
    return `${titleCase(first)} ${titleCase(last)}`;
  }

  function go() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const okName = !!trimmedName;
    const okEmail = ubsEmailRe.test(trimmedEmail);
    const okCat = !!category;

    setNeedName(!okName);
    setNeedEmail(!okEmail);
    setNeedCategory(!okCat);

    if (!okName || !okEmail || !okCat) return;

    // Store both, but only display the NAME in the app/leaderboard
    sessionStorage.setItem("player:name", trimmedName);
    sessionStorage.setItem("player:email", trimmedEmail);
    sessionStorage.setItem("player:category", category);

    nav("/challenge");
  }

  function onEmailChange(val) {
    setEmail(val);
    setNeedEmail(false);

    // If they haven't typed a name yet, infer it from a valid email
    if (!name.trim() && ubsEmailRe.test(val)) {
      const derived = deriveNameFromEmail(val);
      if (derived) setName(derived);
    }
  }

  return (
    <div className="container">
      <h2 className="title">Your Division</h2>
      <p className="subtitle">
        Pick a card below, enter your <b>UBS email</b> and <b>name</b>, then click <b>Continue</b>
      </p>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="pyramid-grid" role="list" aria-label="Division choices">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
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
        <h2 className="title">Your Details</h2>

        <form
          className="stack gap-sm details-form"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <div className="inline">
            <label htmlFor="player-email" className="sr-only"></label>
            <input
              className="input"
              id="player-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="first.last@ubs.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              aria-invalid={needEmail}
              aria-describedby={needEmail ? "email-error" : undefined}
            />

            <label htmlFor="player-name" className="sr-only"></label>
            <input
              className="input"
              id="player-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNeedName(false);
              }}
              placeholder="Your name as shown on the leaderboard"
              aria-invalid={needName}
              aria-describedby={needName ? "name-error" : undefined}
            />
          
          </div>
          <button type="submit" className="btn btn--primary continue-btn">
            Continue
          </button>
        </form>

        <div className="help">
          Selected: {category ? <b>{category}</b> : <i>none</i>}
        </div>

        {(needName || needEmail || needCategory) && (
          <div className="error" role="alert">
            {!name.trim() ? <span id="name-error">Please enter your name. </span> : null}
            {!email.trim() || !ubsEmailRe.test(email) ? (
              <span id="email-error">Please use your UBS email (first.last@ubs.com). </span>
            ) : null}
            {!category ? "Please select a division." : ""}
          </div>
        )}
      </div>
    </div>
  );
}
