import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { saveAs } from "file-saver";

// 10 flashcards iniciales
const PRELOADED = [
  { front: "नमस्ते", back: "Hello" },
  { front: "पानी", back: "Water" },
  { front: "पुस्तक", back: "Book" },
  { front: "खिड़की", back: "Window" },
  { front: "कितना", back: "How much?" },
  { front: "क्या", back: "What?" },
  { front: "सूरज", back: "Sun" },
  { front: "बिल्ली", back: "Cat" },
  { front: "आदमी", back: "Man" },
  { front: "खुश", back: "Happy" }
];

function load() {
  try {
    return JSON.parse(localStorage.getItem("cards-v1")) || PRELOADED;
  } catch {
    return PRELOADED;
  }
}

function save(cards) {
  localStorage.setItem("cards-v1", JSON.stringify(cards));
}

export default function App() {
  const [view, setView] = useState("review");
  const [cards, setCards] = useState(load);
  const [idx, setIdx]   = useState(0);
  const [flip, setFlip] = useState(false);
  const [front, setFront] = useState("");
  const [back,  setBack]  = useState("");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, correct: 0, log: [] });

  // persistencia
  useEffect(() => save(cards), [cards]);

  // atajos teclado en revisión
  useEffect(() => {
    if (view !== "review") return;
    const h = (e) => {
      if (e.code === "Space") { e.preventDefault(); setFlip(f => !f); }
      if (e.key === "ArrowRight") { next(); }
      if (e.key === "ArrowLeft") { prev(); }
      if (e.key === "1") answer(true);
      if (e.key === "0") answer(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  function next() { setIdx(i => (i + 1) % cards.length); setFlip(false); }
  function prev() { setIdx(i => (i - 1 + cards.length) % cards.length); setFlip(false); }

  function answer(ok) {
    setStats(s => ({
      total: s.total + 1,
      correct: ok ? s.correct + 1 : s.correct,
      log: [...s.log, { ts: Date.now(), ok }]
    }));
    next();
  }

  function addCard(e) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setCards([{ front: front.trim(), back: back.trim() }, ...cards]);
    setFront(""); setBack("");
    setView("review");
  }

  function exportDeck() {
    const blob = new Blob([JSON.stringify(cards)], { type: "application/json" });
    saveAs(blob, "my-deck.flashcards");
  }

  async function importDeck(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const imp  = JSON.parse(text);
    setCards(c => [...imp, ...c]);
    e.target.value = "";
  }

  // filtro de búsqueda
  const results = cards.filter(c =>
    c.front.toLowerCase().includes(query.toLowerCase()) ||
    c.back.toLowerCase().includes(query.toLowerCase())
  );

  // datos para gráfico
  const chart = Object.values(stats.log.reduce((acc, { ts }) => {
    const d = new Date(ts).toLocaleDateString();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {})).map((n, i) => ({ name: i + 1, reviewed: n }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* sidebar */}
      <nav style={{ width: 160, background: "#272a60", color: "#fff" }}>
        {["review","search","create","stats"].map(t => (
          <button key={t} onClick={()=>setView(t)}
            style={{
              display:"block", width:"100%", padding:"14px 0",
              background:view===t?"#4146a3":"none",
              color:"#fff", border:"none", cursor:"pointer"
            }}>
            {t.toUpperCase()}
          </button>
        ))}
        <div style={{padding:12}}>
          <input type="file" accept=".flashcards,.json" onChange={importDeck}/>
          <button onClick={exportDeck} style={{marginTop:8}}>Exportar</button>
        </div>
      </nav>

      {/* main */}
      <main style={{flex:1, padding:24}}>
        {view==="review" && (
          <>
            <h2>Revisión</h2>
            <div onClick={()=>setFlip(f=>!f)}
                 style={{
                   width:300,height:180,margin:"40px auto",
                   perspective:1000,cursor:"pointer"
                 }}>
              <div style={{
                width:"100%",height:"100%",borderRadius:12,background:"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:32,fontWeight:600,boxShadow:"0 4px 20px #0002",
                transition:"transform .6s",transformStyle:"preserve-3d",
                transform:flip?"rotateY(180deg)":"none"
              }}>
                <div style={{
                  position:"absolute",width:"100%",height:"100%",
                  backfaceVisibility:"hidden",display:"flex",
                  alignItems:"center",justifyContent:"center"
                }}>{cards[idx]?.front}</div>
                <div style={{
                  position:"absolute",width:"100%",height:"100%",
                  backfaceVisibility:"hidden",transform:"rotateY(180deg)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:"#ffebb0"
                }}>{cards[idx]?.back}</div>
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <button onClick={prev}>⬅️</button>
              <button onClick={()=>setFlip(f=>!f)} style={{margin:"0 12px"}}>
                Voltear (Espacio)
              </button>
              <button onClick={next}>➡️</button>
            </div>
            <div style={{textAlign:"center",marginTop:12}}>
              ¿Adivinaste?
              <button onClick={()=>answer(true)} style={{margin:"0 6px"}}>Sí (1)</button>
              <button onClick={()=>answer(false)}>No (0)</button>
            </div>
          </>
        )}

        {view==="search" && (
          <>
            <h2>Búsqueda</h2>
            <input placeholder="Buscar..."
              value={query} onChange={e=>setQuery(e.target.value)}
              style={{padding:8,width:"100%",maxWidth:380}}/>
            <ul style={{marginTop:16}}>
              {results.map((c,i)=>(
                <li key={i}>{c.front} — {c.back}</li>
              ))}
            </ul>
          </>
        )}

        {view==="create" && (
          <>
            <h2>Crear tarjeta</h2>
            <form onSubmit={addCard} style={{maxWidth:380}}>
              <input placeholder="Frente" value={front}
                     onChange={e=>setFront(e.target.value)}
                     style={{display:"block",width:"100%",padding:8,marginBottom:8}}/>
              <input placeholder="Reverso" value={back}
                     onChange={e=>setBack(e.target.value)}
                     style={{display:"block",width:"100%",padding:8,marginBottom:8}}/>
              <button type="submit">Agregar</button>
            </form>
          </>
        )}

        {view==="stats" && (
          <>
            <h2>Estadísticas</h2>
            <p>Total revisadas: {stats.total}</p>
            <p>Correctas: {stats.correct}</p>
            <p>Aciertos: {stats.total? Math.round(stats.correct/stats.total*100):0}%</p>
            <div style={{width:"100%",height:300}}>
              <ResponsiveContainer>
                <BarChart data={chart}>
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="reviewed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
