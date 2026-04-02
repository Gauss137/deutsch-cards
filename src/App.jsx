import { useState, useEffect, useCallback, useRef } from "react";

const C = {
  primary:     "#f8b133",
  primaryDark: "#d4921a",
  primaryLight:"#fff4e0",
  bg:          "#f9fafb",
  surface:     "#ffffff",
  border:      "#e5e7eb",
  text:        "#374151",
  textMuted:   "#6b7280",
  textLight:   "#9ca3af",
  danger:      "#ef4444",
  dangerLight: "#fee2e2",
};

const SAMPLE_CARDS = [
  { german:"Guten Morgen",        spanish:"Buenos días",                    pronunciation:"guten morgan",     notes:"Saludo matutino",         category:"Saludos" },
  { german:"Guten Tag",           spanish:"Buenas tardes",                  pronunciation:"guten tag",        notes:"",                        category:"Saludos" },
  { german:"Auf Wiedersehen",     spanish:"Hasta luego",                    pronunciation:"auf víderzen",     notes:"Formal",                  category:"Saludos" },
  { german:"Tschüss",             spanish:"Chau",                           pronunciation:"chus",             notes:"Informal",                category:"Saludos" },
  { german:"Bitte",               spanish:"Por favor / De nada",            pronunciation:"bite",             notes:"Muy frecuente",           category:"Básico"  },
  { german:"Danke schön",         spanish:"Muchas gracias",                 pronunciation:"danke shön",       notes:"",                        category:"Básico"  },
  { german:"Entschuldigung",      spanish:"Disculpe / Perdón",              pronunciation:"entshuldigung",    notes:"Para llamar la atención", category:"Básico"  },
  { german:"Ich verstehe nicht",  spanish:"No entiendo",                    pronunciation:"ij ferstee nijt",  notes:"Muy útil",                category:"Básico"  },
  { german:"Wo ist das Hotel?",   spanish:"¿Dónde está el hotel?",          pronunciation:"vo ist das hotel", notes:"",                        category:"Viaje"   },
  { german:"Die Rechnung, bitte", spanish:"La cuenta, por favor",           pronunciation:"di rejnung bite",  notes:"Restaurantes",            category:"Restaurante"},
  { german:"Wie viel kostet das?",spanish:"¿Cuánto cuesta esto?",           pronunciation:"vi fil kóstet das",notes:"",                        category:"Compras" },
];

const BATCH_OPTIONS = [10, 20, 50, 100, 0]; // 0 = todas

function makeId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function stamp(arr) { return arr.map(c => ({ ...c, id: makeId(), createdAt: Date.now(), lastReviewed: null })); }

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "2026-04-02"
}

function load() {
  try {
    const r = localStorage.getItem("dc_v5");
    if (!r) return null;
    const p = JSON.parse(r);
    return { cards: p.cards || [] };
  } catch { return null; }
}
function save(cards) {
  try { localStorage.setItem("dc_v5", JSON.stringify({ cards })); } catch {}
}

function parseCSV(raw) {
  const text = raw.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/)[0];
  const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  function parseLine(line) {
    const cols = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  }
  const normalize = h => h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace("aleman", "german").replace("espanol", "spanish")
    .replace("pronunciacion", "pronunciation")
    .replace("notas", "notes").replace("categoria", "category");
  const headers = parseLine(lines[0]).map(normalize);
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim(); });
    if (obj.german) results.push(obj);
  }
  return results;
}

// Sorts: unseen first, then oldest lastReviewed
function buildQueue(cards, batchSize, cat, shuffled) {
  let pool = cat === "all" ? [...cards] : cards.filter(c => c.category === cat);
  const today = todayStr();
  const unseen  = pool.filter(c => !c.lastReviewed);
  const seen    = pool.filter(c =>  c.lastReviewed).sort((a, b) => a.lastReviewed - b.lastReviewed);
  let ordered   = [...unseen, ...seen];
  if (shuffled) ordered = ordered.sort(() => Math.random() - 0.5);
  return batchSize > 0 ? ordered.slice(0, batchSize) : ordered;
}

function seenToday(cards) {
  const today = todayStr();
  return cards.filter(c => c.lastReviewed && new Date(c.lastReviewed).toISOString().slice(0,10) === today).length;
}

// ── SVG Icons (flat, theme-colored) ──────────────────────────
function IconEdit({ color = C.primaryDark, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 1.5a1.414 1.414 0 0 1 2 2L5 12H3v-2L11.5 1.5z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M2 14h12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconShuffle({ color = C.primaryDark, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4h3l2 3-2 3H1" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 4h-3l-2 3 2 3h3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 4h4a4 4 0 0 1 4 4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4 12h4a4 4 0 0 0 4-4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconTrash({ color = C.danger, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M6 4V2h4v2M5 4l1 9h4l1-9" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── UI Components ─────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const base = {
    borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", transition: "opacity 0.15s", minHeight: 44,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 18px", opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    outline: { background: C.surface, color: C.text, border: `1.5px solid ${C.border}` },
    ghost:   { background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function StatCard({ value, label, color = C.primary }) {
  return (
    <div style={{ flex: 1, minWidth: 80, background: C.surface, borderRadius: 8, padding: "12px 8px", border: `1px solid ${C.border}`, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [screen,    setScreen]    = useState("deck");
  const [cards,     setCards]     = useState([]);
  const [toast,     setToast]     = useState("");
  const [queue,     setQueue]     = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const [shuffled,  setShuffled]  = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [editCard,  setEditCard]  = useState(null);
  const [importDate,setImportDate]= useState("");
  const [dragOver,  setDragOver]  = useState(false);
  const [batchSize, setBatchSize] = useState(20);
  const [showBatch, setShowBatch] = useState(false); // batch picker modal
  const fileRef = useRef();

  useEffect(() => {
    const saved = load();
    if (saved && saved.cards.length > 0) setCards(saved.cards);
    else setCards(stamp(SAMPLE_CARDS));
  }, []);
  useEffect(() => { save(cards); }, [cards]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const cats = ["all", ...[...new Set(cards.map(c => c.category).filter(Boolean))]];

  const today         = todayStr();
  const viewedToday   = seenToday(cards);
  const pendingToday  = cards.length - viewedToday;

  const startStudy = useCallback((bs = batchSize, cat = filterCat, sh = shuffled) => {
    const q = buildQueue(cards, bs, cat, sh);
    if (!q.length) { showToast("No hay tarjetas para esta selección"); return; }
    setQueue(q); setIdx(0); setFlipped(false); setScreen("study"); setShowBatch(false);
  }, [cards, batchSize, filterCat, shuffled]);

  // Mark card as reviewed when it becomes the current card
  useEffect(() => {
    if (screen !== "study" || !queue.length) return;
    const c = queue[idx];
    if (!c) return;
    setCards(prev => prev.map(card =>
      card.id === c.id ? { ...card, lastReviewed: Date.now() } : card
    ));
  }, [screen, idx, queue]);

  const handleFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target.result);
      if (!parsed.length) { showToast("No se encontraron tarjetas en el CSV"); return; }
      const existing = new Set(cards.map(c => c.german + "||" + c.spanish));
      const fresh = parsed.filter(c => !existing.has(c.german + "||" + c.spanish));
      if (!fresh.length) { showToast("Todas las tarjetas ya existen en el deck"); return; }
      const stamped = stamp(fresh);
      setCards(f => [...f, ...stamped]);
      setImportDate(new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }));
      showToast(`✓ ${stamped.length} tarjetas importadas · ${parsed.length - fresh.length} duplicadas omitidas`);
    };
    reader.readAsText(file, "utf-8");
  };

  const addBlank = () => setEditCard({ id: makeId(), german: "", spanish: "", pronunciation: "", notes: "", category: "", createdAt: Date.now(), lastReviewed: null });

  const saveEdit = card => {
    if (!card.german.trim()) { showToast("El campo Alemán es obligatorio"); return; }
    setCards(f => { const ex = f.find(c => c.id === card.id); return ex ? f.map(c => c.id === card.id ? card : c) : [...f, card]; });
    setEditCard(null); showToast("Tarjeta guardada");
  };

  const delCard = id => setCards(f => f.filter(c => c.id !== id));

  const nav = useCallback(dir => {
    setIdx(i => { const n = i + dir; if (n < 0) return queue.length - 1; if (n >= queue.length) return 0; return n; });
    setFlipped(false);
  }, [queue.length]);

  useEffect(() => {
    if (screen !== "study") return;
    const h = e => {
      if (["ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === "ArrowRight") { e.preventDefault(); nav(1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); nav(-1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [screen, nav]);

  const changeCat = cat => { setFilterCat(cat); };
  const toggleShuffle = () => {
    const ns = !shuffled; setShuffled(ns);
    const q = buildQueue(cards, batchSize, filterCat, ns);
    setQueue(q); setIdx(0); setFlipped(false);
  };

  const card = queue[idx];

  // ── BATCH PICKER MODAL ──────────────────────────────────────
  if (showBatch) return (
    <div style={{ minHeight: "100vh", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, borderRadius: 14, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: C.text }}>¿Cuántas tarjetas hoy?</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: C.textMuted }}>
          Pendientes sin ver: <b style={{ color: C.primaryDark }}>{pendingToday}</b> · Vistas hoy: <b style={{ color: C.primaryDark }}>{viewedToday}</b>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BATCH_OPTIONS.map(n => {
            const label = n === 0 ? `Todas (${cards.length})` : `${n} tarjetas`;
            const isSelected = batchSize === n;
            return (
              <button key={n} onClick={() => { setBatchSize(n); startStudy(n, filterCat, shuffled); }}
                style={{ padding: "13px 16px", borderRadius: 9, border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                  background: isSelected ? C.primaryLight : C.surface, color: isSelected ? C.primaryDark : C.text,
                  fontWeight: 600, fontSize: 15, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                {label}
                {n === 20 && <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>recomendado</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowBatch(false)}
          style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );

  // ── EDIT MODAL ──────────────────────────────────────────────
  if (editCard) return (
    <div style={{ minHeight: "100vh", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, borderRadius: 12, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: C.text }}>Editar tarjeta</h3>
        {[["german", "Alemán *"], ["spanish", "Español"], ["pronunciation", "Pronunciación"], ["notes", "Notas"], ["category", "Categoría"]].map(([k, label]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
            <input value={editCard[k] || ""} onChange={e => setEditCard(c => ({ ...c, [k]: e.target.value }))}
              style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 15, boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: C.text }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Btn variant="outline" onClick={() => setEditCard(null)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn onClick={() => saveEdit(editCard)} style={{ flex: 1 }}>Guardar</Btn>
        </div>
      </div>
    </div>
  );

  // ── MAIN ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI',system-ui,sans-serif", color: C.text }}>

      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#1f2937", color: "#fff", padding: "10px 20px", borderRadius: 30, fontSize: 13, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap", maxWidth: "90vw", overflow: "hidden", textOverflow: "ellipsis" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🇩🇪</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>DeutschCards</span>
          {importDate && <span style={{ fontSize: 11, color: C.textLight, marginLeft: 2 }}>· {importDate}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["deck", "Deck"], ["study", "Estudiar"]].map(([s, label]) => (
            <button key={s}
              onClick={() => s === "study" ? setShowBatch(true) : setScreen(s)}
              style={{ padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, minHeight: 36, background: screen === s ? C.primary : "transparent", color: screen === s ? "#fff" : C.textMuted, transition: "all 0.15s" }}>
              {label}{s === "study" && cards.length > 0 ? ` (${cards.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── DECK SCREEN ── */}
      {screen === "deck" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

          {/* Daily progress banner */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: C.text }}>Progreso de hoy</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
                {viewedToday > 0
                  ? `${viewedToday} tarjetas vistas · ${pendingToday} pendientes`
                  : `${cards.length} tarjetas pendientes`}
              </p>
            </div>
            <div style={{ height: 8, flex: 1, maxWidth: 140, background: C.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.primary, borderRadius: 4, width: cards.length ? `${(viewedToday / cards.length) * 100}%` : "0%", transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark, whiteSpace: "nowrap" }}>
              {cards.length ? Math.round((viewedToday / cards.length) * 100) : 0}%
            </span>
          </div>

          {/* Import */}
          <div onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            style={{ background: dragOver ? C.primaryLight : C.surface, border: `2px dashed ${dragOver ? C.primary : C.border}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", marginBottom: 18, transition: "all 0.2s" }}>
            <p style={{ fontWeight: 700, color: C.primary, fontSize: 14, margin: 0 }}>Importar CSV</p>
            <p style={{ color: C.textMuted, fontSize: 12, margin: "4px 0 0" }}>Alemán · Español · Pronunciación · Notas · Categoría</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }} />

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <StatCard value={cards.length} label="tarjetas" />
            <StatCard value={viewedToday} label="vistas hoy" color={C.primaryDark} />
            <StatCard value={pendingToday} label="pendientes" color={C.textMuted} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <Btn variant="outline" onClick={addBlank} style={{ flex: 1 }}>+ Manual</Btn>
            <Btn onClick={() => setShowBatch(true)} disabled={!cards.length} style={{ flex: 2 }}>Estudiar hoy</Btn>
          </div>

          {/* Category filter */}
          {cats.length > 2 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {cats.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  style={{ padding: "6px 13px", borderRadius: 16, minHeight: 34, border: `1.5px solid ${filterCat === cat ? C.primary : C.border}`, background: filterCat === cat ? C.primaryLight : "transparent", color: filterCat === cat ? C.primaryDark : C.textMuted, fontSize: 13, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}>
                  {cat === "all" ? "Todas" : cat}
                </button>
              ))}
            </div>
          )}

          {/* Card list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cards.filter(c => filterCat === "all" || c.category === filterCat).map(c => {
              const seenDate = c.lastReviewed ? new Date(c.lastReviewed).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : null;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "11px 13px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{c.german}</span>
                    {c.category && <span style={{ marginLeft: 7, fontSize: 10, background: C.primaryLight, color: C.primaryDark, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{c.category}</span>}
                  </div>
                  <span style={{ color: C.textMuted, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.spanish}</span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    {seenDate && <span style={{ fontSize: 10, color: C.textLight, whiteSpace: "nowrap" }}>{seenDate}</span>}
                    <button onClick={() => setEditCard({ ...c })} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", minHeight: 36, display: "flex", alignItems: "center" }}>
                      <IconEdit />
                    </button>
                    <button onClick={() => delCard(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", minHeight: 36, display: "flex", alignItems: "center" }}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {cards.length > 0 && (
            <button onClick={() => { setCards([]); }} style={{ marginTop: 16, fontSize: 12, color: C.danger, background: "none", border: "none", cursor: "pointer", display: "block" }}>
              Vaciar deck
            </button>
          )}
        </div>
      )}

      {/* ── STUDY SCREEN ── */}
      {screen === "study" && (
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px" }}>

          {cats.length > 2 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {cats.map(cat => (
                <button key={cat} onClick={() => changeCat(cat)}
                  style={{ padding: "6px 12px", borderRadius: 14, minHeight: 34, border: `1.5px solid ${filterCat === cat ? C.primary : C.border}`, background: filterCat === cat ? C.primaryLight : "transparent", color: filterCat === cat ? C.primaryDark : C.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  {cat === "all" ? "Todas" : cat}
                </button>
              ))}
            </div>
          )}

          {queue.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              <p style={{ color: C.textMuted, fontSize: 15 }}>No hay tarjetas para esta selección.</p>
              <Btn onClick={() => setScreen("deck")} style={{ marginTop: 14, margin: "14px auto 0" }}>← Volver al deck</Btn>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: C.primary, fontSize: 15 }}>{idx + 1} / {queue.length}</span>
                <button onClick={toggleShuffle}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 12, minHeight: 34, border: `1.5px solid ${shuffled ? C.primary : C.border}`, background: shuffled ? C.primaryLight : "transparent", color: shuffled ? C.primaryDark : C.textMuted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  <IconShuffle color={shuffled ? C.primaryDark : C.textMuted} />
                  {shuffled ? "Aleatorio" : "En orden"}
                </button>
              </div>

              <div style={{ height: 4, background: C.border, borderRadius: 4, marginBottom: 20 }}>
                <div style={{ height: "100%", background: C.primary, borderRadius: 4, width: `${((idx + 1) / queue.length) * 100}%`, transition: "width 0.3s" }} />
              </div>

              {/* CARD */}
              <div onClick={() => setFlipped(f => !f)} style={{ cursor: "pointer", perspective: 1000, height: "min(280px, 52vw)", minHeight: 200 }}>
                <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
                  <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", background: C.surface, borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, boxSizing: "border-box", border: `1.5px solid ${C.border}` }}>
                    {card?.category && <span style={{ position: "absolute", top: 12, left: 14, fontSize: 11, background: C.primaryLight, color: C.primaryDark, borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>{card.category}</span>}
                    <p style={{ fontSize: "clamp(20px,5vw,28px)", fontWeight: 700, textAlign: "center", color: C.text, lineHeight: 1.3, margin: 0 }}>{card?.german}</p>
                    <p style={{ fontSize: 12, color: C.textLight, marginTop: 14, marginBottom: 0 }}>Tocá para ver la respuesta</p>
                  </div>
                  <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", background: C.primaryLight, borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box", transform: "rotateY(180deg)", border: `1.5px solid ${C.primary}`, gap: 8 }}>
                    <p style={{ fontSize: "clamp(18px,4.5vw,22px)", fontWeight: 700, color: C.primaryDark, textAlign: "center", margin: 0 }}>
                      {card?.spanish || <span style={{ color: C.textLight, fontStyle: "italic" }}>sin traducción</span>}
                    </p>
                    {card?.pronunciation && <p style={{ fontSize: 14, color: C.textMuted, fontStyle: "italic", margin: 0 }}>/{card.pronunciation}/</p>}
                    {card?.notes && <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", margin: 0 }}>{card.notes}</p>}
                  </div>
                </div>
              </div>

              <p style={{ textAlign: "center", color: C.textLight, fontSize: 11, margin: "8px 0 0" }}>Tocá la tarjeta · ←→ navegar</p>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <Btn variant="outline" onClick={() => nav(-1)} style={{ flex: 1, minHeight: 50 }}>← Ant.</Btn>
                <Btn onClick={() => nav(1)} style={{ flex: 2, minHeight: 50 }}>Siguiente →</Btn>
              </div>
            </>
          )}
        </div>
      )}
      <div style={{ height: 32 }} />
    </div>
  );
}
