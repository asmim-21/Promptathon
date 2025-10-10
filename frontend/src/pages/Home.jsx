// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getCategories } from "../api";

// const UBS_RED = "#DC0C0C";
// const CARD_BG = "#F9F9F7";         // base card color
// const CARD_BG_HOVER = "#F2F2EF";   // a bit darker on hover
// const CARD_BG_ACTIVE = "#ECEBE8";  // darker when selected

// export default function Home() {
//   const nav = useNavigate();
//   const [categories, setCategories] = useState([]);
//   const [name, setName] = useState("");
//   const [category, setCategory] = useState("");
//   const [needName, setNeedName] = useState(false);
//   const [needCategory, setNeedCategory] = useState(false);
//   const [error, setError] = useState("");

//   // for fancy hover/focus styles (purely cosmetic)
//   const [hoverIndex, setHoverIndex] = useState(null);
//   const [focusIndex, setFocusIndex] = useState(null);

//   useEffect(() => {
//     getCategories()
//       .then((d) => setCategories((d?.categories || []).slice(0, 5)))
//       .catch(() => setError("Could not load categories from the server."));
//   }, []);

//   function go() {
//     const okName = !!name.trim();
//     const okCat = !!category;
//     setNeedName(!okName);
//     setNeedCategory(!okCat);
//     if (!okName || !okCat) return;
//     sessionStorage.setItem("player:name", name.trim());
//     sessionStorage.setItem("player:category", category);
//     nav("/challenge");
//   }

//   function handlePick(c) {
//     setCategory(c);
//     setNeedCategory(false);
//   }

//   function onNameKey(e) {
//     if (e.key === "Enter") go();
//   }

//   // Pyramid placement by index (0..2 top, 3..4 bottom centered)
//   const placement = (i) => {
//     if (i === 0) return { gridColumn: "1 / span 2", gridRow: 1 };
//     if (i === 1) return { gridColumn: "3 / span 2", gridRow: 1 };
//     if (i === 2) return { gridColumn: "5 / span 2", gridRow: 1 };
//     if (i === 3) return { gridColumn: "2 / span 2", gridRow: 2 };
//     if (i === 4) return { gridColumn: "4 / span 2", gridRow: 2 };
//     return {};
//   };

//   const titleStyle = {
//     margin: "4px 0 8px",
//     textAlign: "center",
//     fontSize: 28,
//   };

//   return (
//     <div style={{ padding: 24, maxWidth: 980, margin: "0 auto", fontFamily: "Inter, system-ui, Arial" }}>
//       <h2 style={titleStyle}>Choose your division</h2>
//       <p style={{ margin: 0, opacity: 0.7, textAlign: "center" }}>
//         Pick a card below, enter your name, then press <b>Enter</b> (or click <b>Continue</b>).
//       </p>

//       {error && (
//         <div style={{ marginTop: 10, color: UBS_RED, textAlign: "center" }}>
//           {error}
//         </div>
//       )}

//       {/* Pyramid grid */}
//       <div
//         role="list"
//         aria-label="Division choices"
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(6, 1fr)",
//           gap: 16,
//           marginTop: 20,
//           minHeight: 340,
//         }}
//       >
//         {categories.map((c, i) => {
//           const isSelected = category === c;
//           const isHover = hoverIndex === i;
//           const isFocus = focusIndex === i;

//           const bg = isSelected ? CARD_BG_ACTIVE : isHover ? CARD_BG_HOVER : CARD_BG;
//           const shadow = isSelected
//             ? "0 10px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)"
//             : isHover
//             ? "0 8px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.05)"
//             : "0 3px 10px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)";

//           return (
//             <button
//               key={c}
//               role="listitem"
//               aria-pressed={isSelected}
//               aria-label={`Select ${c}`}
//               onClick={() => handlePick(c)}
//               onMouseEnter={() => setHoverIndex(i)}
//               onMouseLeave={() => setHoverIndex(null)}
//               onFocus={() => setFocusIndex(i)}
//               onBlur={() => setFocusIndex(null)}
//               style={{
//                 ...placement(i),
//                 height: 200,
//                 borderRadius: 20,
//                 border: "none",               // no border; it's all about the fill + shadow
//                 background: bg,
//                 cursor: "pointer",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 22,
//                 fontWeight: 700,
//                 outline: "none",
//                 boxShadow: isFocus ? `66 0px 0px 0px 2px inset, ${shadow}` : shadow,
//                 transform: isSelected || isHover ? "translateY(-2px)" : "translateY(0)",
//                 transition: "background .18s ease, box-shadow .18s ease, transform .08s ease",
//               }}
//             >
//               {c}
//             </button>
//           );
//         })}
//       </div>

//       {/* Name + Continue (inline, with spacing) */}
//       <div style={{ marginTop: 28, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
//         <h2 style={titleStyle}>Your name</h2>

//         <div
//           style={{
//             display: "flex",
//             gap: 14,
//             alignItems: "center",
//             justifyContent: "center",
//             flexWrap: "wrap",
//           }}
//         >
//           <input
//             id="player-name"
//             value={name}
//             onChange={(e) => {
//               setName(e.target.value);
//               setNeedName(false);
//             }}
//             onKeyDown={onNameKey}
//             placeholder="Type your name and press Enter"
//             style={{
//               width: 420,
//               maxWidth: "90vw",
//               padding: 14,
//               borderRadius: 12,
//               border: "1px solid #ddd",
//               fontSize: 16,
//               textAlign: "center",
//               background: "#fff",
//               boxShadow: "0 2px 6px rgba(0,0,0,0.06) inset",
//             }}
//           />

//           <button
//             onClick={go}
//             style={{
//               padding: "12px 18px",
//               borderRadius: 12,
//               border: `1px solid ${UBS_RED}`,
//               background: UBS_RED,
//               color: "#fff",
//               fontWeight: 600,
//               height: 46,
//               minWidth: 130,
//               boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
//             }}
//           >
//             Continue
//           </button>
//         </div>

//         <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8, textAlign: "center" }}>
//           Selected: {category ? <b>{category}</b> : <i>none</i>}
//         </div>

//         {(needName || needCategory) && (
//           <div style={{ marginTop: 8, color: UBS_RED, fontSize: 13, textAlign: "center" }}>
//             {!name.trim() ? "Please enter your name. " : ""}
//             {!category ? "Please select a division." : ""}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

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
      .then((d) => setCategories((d?.categories || []).slice(0, 5)))
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
      <h2 className="title">Choose your division</h2>
      <p className="subtitle">
        Pick a card below, enter your name, then press <b>Enter</b> (or click <b>Continue</b>).
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
        <h2 className="title">Your name</h2>

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
