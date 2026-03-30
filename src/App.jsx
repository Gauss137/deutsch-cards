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
  success:     "#22c55e",
  successLight:"#dcfce7",
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

function makeId() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function stamp(arr) { return arr.map(c=>({...c,id:makeId(),createdAt:Date.now(),lastReviewed:null})); }

function load() {
  try {
    const r = localStorage.getItem("dc_v4");
    if(!r) return null;
    const p = JSON.parse(r);
    return { cards: p.cards||[], hardIds: new Set(p.hardIds||[]) };
  } catch { return null; }
}
function save(cards, hardIds) {
  try { localStorage.setItem("dc_v4", JSON.stringify({cards, hardIds:[...hardIds]})); } catch {}
}

function parseCSV(raw) {
  const text = raw.replace(/^\uFEFF/,"");
  const firstLine = text.split(/\r?\n/)[0];
  const delim = (firstLine.match(/;/g)||[]).length >= (firstLine.match(/,/g)||[]).length ? ";" : ",";
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length < 2) return [];
  function parseLine(line) {
    const cols=[]; let cur="", inQ=false;
    for(const ch of line){
      if(ch==='"'){ inQ=!inQ; }
      else if(ch===delim&&!inQ){ cols.push(cur.trim()); cur=""; }
      else cur+=ch;
    }
    cols.push(cur.trim());
    return cols;
  }
  const normalize = h => h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"")
    .replace("aleman","german").replace("espanol","spanish")
    .replace("pronunciacion","pronunciation")
    .replace("notas","notes").replace("categoria","category");
  const headers = parseLine(lines[0]).map(normalize);
  const results=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseLine(lines[i]);
    const obj={};
    headers.forEach((h,idx)=>{ obj[h]=(cols[idx]||"").replace(/^"|"$/g,"").trim(); });
    if(obj.german) results.push(obj);
  }
  return results;
}

function buildQueue(cards, hardIds, shuffled, cat){
  const pool = cat==="all" ? cards : cards.filter(c=>c.category===cat);
  const hard = pool.filter(c=>hardIds.has(c.id));
  const norm = pool.filter(c=>!hardIds.has(c.id));
  let q = [...hard,...hard,...norm];
  if(shuffled) q = q.sort(()=>Math.random()-0.5);
  return q;
}

// ── Shared styles ─────────────────────────────────────────────
const btnBase = {
  borderRadius:8, fontWeight:600, fontSize:15,
  cursor:"pointer", border:"none",
  transition:"opacity 0.15s", minHeight:44,
  display:"flex", alignItems:"center", justifyContent:"center",
};

function Btn({children, onClick, variant="primary", disabled, style={}}){
  const variants={
    primary:  {background:C.primary,  color:"#fff"},
    outline:  {background:C.surface,  color:C.text,   border:`1.5px solid ${C.border}`},
    danger:   {background:C.dangerLight,  color:C.danger},
    success:  {background:C.successLight, color:"#16a34a"},
  };
  return (
    <button
      onClick={disabled?undefined:onClick}
      style={{...btnBase, padding:"0 18px", opacity:disabled?0.45:1,
        cursor:disabled?"not-allowed":"pointer",
        ...variants[variant], ...style}}>
      {children}
    </button>
  );
}

function StatCard({value, label, color=C.primary}){
  return(
    <div style={{flex:1, minWidth:80, background:C.surface, borderRadius:8,
      padding:"12px 8px", border:`1px solid ${C.border}`, textAlign:"center"}}>
      <div style={{fontSize:22, fontWeight:700, color}}>{value}</div>
      <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>{label}</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App(){
  const [screen,   setScreen]   = useState("deck");
  const [cards,    setCards]    = useState([]);
  const [hardIds,  setHardIds]  = useState(new Set());
  const [toast,    setToast]    = useState("");
  const [queue,    setQueue]    = useState([]);
  const [idx,      setIdx]      = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [filterCat,setFilterCat]= useState("all");
  const [editCard, setEditCard] = useState(null);
  const [importDate,setImportDate]=useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(()=>{
    const saved = load();
    if(saved && saved.cards.length>0){ setCards(saved.cards); setHardIds(saved.hardIds); }
    else setCards(stamp(SAMPLE_CARDS));
  },[]);
  useEffect(()=>{ save(cards,hardIds); },[cards,hardIds]);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  // All unique categories — used only for filter tabs (needs >1 to show tabs)
  const cats = ["all",...[...new Set(cards.map(c=>c.category).filter(Boolean))]];

  const goStudy = useCallback((fc=cards, hi=hardIds, sh=shuffled, cat=filterCat)=>{
    const q = buildQueue(fc,hi,sh,cat);
    setQueue(q); setIdx(0); setFlipped(false); setScreen("study");
  },[cards,hardIds,shuffled,filterCat]);

  const handleFile = file => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target.result);
      if(!parsed.length){ showToast("No se encontraron tarjetas en el CSV"); return; }
      const existing = new Set(cards.map(c=>c.german+"||"+c.spanish));
      const fresh = parsed.filter(c=>!existing.has(c.german+"||"+c.spanish));
      if(!fresh.length){ showToast("Todas las tarjetas ya existen en el deck"); return; }
      const stamped = stamp(fresh);
      setCards(f=>[...f,...stamped]);
      setImportDate(new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}));
      showToast(`✓ ${stamped.length} tarjetas importadas · ${parsed.length-fresh.length} duplicadas omitidas`);
    };
    reader.readAsText(file,"utf-8");
  };

  const addBlank = () => {
    setEditCard({id:makeId(),german:"",spanish:"",pronunciation:"",notes:"",category:"",createdAt:Date.now(),lastReviewed:null});
  };

  const saveEdit = card => {
    if(!card.german.trim()){ showToast("El campo Alemán es obligatorio"); return; }
    setCards(f=>{ const ex=f.find(c=>c.id===card.id); return ex?f.map(c=>c.id===card.id?card:c):[...f,card]; });
    setEditCard(null); showToast("Tarjeta guardada");
  };

  const delCard = id => {
    setCards(f=>f.filter(c=>c.id!==id));
    setHardIds(h=>{ const n=new Set(h); n.delete(id); return n; });
  };

  const nav = useCallback(dir => {
    setIdx(i=>{ const n=i+dir; if(n<0) return queue.length-1; if(n>=queue.length) return 0; return n; });
    setFlipped(false);
  },[queue.length]);

  // Keyboard nav (desktop)
  useEffect(()=>{
    if(screen!=="study") return;
    const h = e => {
      if(["ArrowUp","ArrowDown"].includes(e.key)){ e.preventDefault(); setFlipped(f=>!f); }
      if(e.key==="ArrowRight"){ e.preventDefault(); nav(1); }
      if(e.key==="ArrowLeft"){  e.preventDefault(); nav(-1); }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[screen,nav]);

  const markEasy = () => {
    const c=queue[idx]; setHardIds(p=>{ const n=new Set(p); n.delete(c.id); return n; });
    showToast("Easy ✓"); nav(1);
  };
  const markHard = () => {
    const c=queue[idx]; setHardIds(p=>new Set([...p,c.id]));
    showToast("Hard – aparecerá más seguido"); nav(1);
  };

  const changeCat = cat => {
    setFilterCat(cat);
    const q = buildQueue(cards,hardIds,shuffled,cat);
    setQueue(q); setIdx(0); setFlipped(false);
  };
  const toggleShuffle = () => {
    const ns=!shuffled; setShuffled(ns);
    const q=buildQueue(cards,hardIds,ns,filterCat);
    setQueue(q); setIdx(0); setFlipped(false);
  };

  const card = queue[idx];

  // ── EDIT MODAL ──────────────────────────────────────────────
  if(editCard) return(
    <div style={{minHeight:"100vh",background:"rgba(0,0,0,0.55)",display:"flex",
      alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,borderRadius:12,padding:24,width:"100%",
        maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>
        <h3 style={{margin:"0 0 18px",fontSize:16,fontWeight:700,color:C.text}}>Editar tarjeta</h3>
        {[["german","Alemán *"],["spanish","Español"],["pronunciation","Pronunciación"],["notes","Notas"],["category","Categoría"]].map(([k,label])=>(
          <div key={k} style={{marginBottom:12}}>
            <label style={{fontSize:12,color:C.textMuted,display:"block",marginBottom:4,fontWeight:600}}>{label}</label>
            <input value={editCard[k]||""} onChange={e=>setEditCard(c=>({...c,[k]:e.target.value}))}
              style={{width:"100%",padding:"11px 12px",borderRadius:8,
                border:`1.5px solid ${C.border}`,fontSize:15,
                boxSizing:"border-box",outline:"none",fontFamily:"inherit",color:C.text}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:10}}>
          <Btn variant="outline" onClick={()=>setEditCard(null)} style={{flex:1}}>Cancelar</Btn>
          <Btn onClick={()=>saveEdit(editCard)} style={{flex:1}}>Guardar</Btn>
        </div>
      </div>
    </div>
  );

  // ── MAIN LAYOUT ─────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:C.bg,
      fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",
          background:"#1f2937",color:"#fff",padding:"10px 20px",borderRadius:30,
          fontSize:13,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace:"nowrap",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis"}}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,
        padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,background:C.primary,borderRadius:7,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🇩🇪</div>
          <span style={{fontWeight:700,fontSize:15,color:C.text}}>DeutschCards</span>
          {importDate&&<span style={{fontSize:11,color:C.textLight,marginLeft:2}}>· {importDate}</span>}
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["deck","Deck"],["study","Estudiar"]].map(([s,label])=>(
            <button key={s}
              onClick={()=>s==="study"?goStudy():setScreen(s)}
              style={{padding:"8px 14px",borderRadius:7,border:"none",cursor:"pointer",
                fontWeight:600,fontSize:13,minHeight:36,
                background:screen===s?C.primary:"transparent",
                color:screen===s?"#fff":C.textMuted,
                transition:"all 0.15s"}}>
              {label}{s==="study"&&cards.length>0?` (${cards.length})`:""}
            </button>
          ))}
        </div>
      </div>

      {/* ── DECK SCREEN ── */}
      {screen==="deck"&&(
        <div style={{maxWidth:640,margin:"0 auto",padding:"20px 16px"}}>

          {/* Import zone */}
          <div
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
            style={{background:dragOver?C.primaryLight:C.surface,
              border:`2px dashed ${dragOver?C.primary:C.border}`,
              borderRadius:10,padding:"20px 16px",textAlign:"center",
              cursor:"pointer",marginBottom:18,transition:"all 0.2s"}}>
            <div style={{fontSize:24,marginBottom:4}}>📂</div>
            <p style={{fontWeight:700,color:C.primary,fontSize:14,margin:0}}>Importar CSV</p>
            <p style={{color:C.textMuted,fontSize:12,margin:"4px 0 0"}}>
              Alemán · Español · Pronunciación · Notas · Categoría
            </p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}}
            onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>

          {/* Stats */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <StatCard value={cards.length}   label="tarjetas"/>
            <StatCard value={hardIds.size}   label="hard"       color={C.danger}/>
            <StatCard value={cats.length-1}  label="categorías" color={C.primaryDark}/>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            <Btn variant="outline" onClick={addBlank} style={{flex:1}}>+ Manual</Btn>
            <Btn onClick={()=>goStudy()} disabled={!cards.length} style={{flex:2}}>
              ▶ Estudiar deck
            </Btn>
          </div>

          {/* Category filter — only show when >1 real categories */}
          {cats.length>2&&(
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>setFilterCat(cat)}
                  style={{padding:"6px 13px",borderRadius:16,minHeight:34,
                    border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,
                    background:filterCat===cat?C.primaryLight:"transparent",
                    color:filterCat===cat?C.primaryDark:C.textMuted,
                    fontSize:13,cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          {/* Card list */}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {cards.filter(c=>filterCat==="all"||c.category===filterCat).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",
                padding:"11px 13px",background:C.surface,
                borderRadius:8,border:`1px solid ${C.border}`,gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <span style={{fontWeight:600,fontSize:14,color:C.text}}>{c.german}</span>
                  {c.category&&(
                    <span style={{marginLeft:7,fontSize:10,background:C.primaryLight,
                      color:C.primaryDark,borderRadius:4,padding:"1px 6px",fontWeight:600}}>
                      {c.category}
                    </span>
                  )}
                </div>
                <span style={{color:C.textMuted,fontSize:12,flex:1,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {c.spanish}
                </span>
                <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                  {hardIds.has(c.id)&&(
                    <span style={{fontSize:10,background:C.dangerLight,color:C.danger,
                      borderRadius:4,padding:"2px 6px",fontWeight:600}}>hard</span>
                  )}
                  <button onClick={()=>setEditCard({...c})}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:C.primary,fontSize:15,padding:"4px 6px",minHeight:36}}>✏️</button>
                  <button onClick={()=>delCard(c.id)}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:C.danger,fontSize:14,padding:"4px 6px",minHeight:36}}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {cards.length>0&&(
            <button
              onClick={()=>{setCards([]);setHardIds(new Set());setFilterCat("all");}}
              style={{marginTop:16,fontSize:12,color:C.danger,
                background:"none",border:"none",cursor:"pointer",display:"block"}}>
              Vaciar deck
            </button>
          )}
        </div>
      )}

      {/* ── STUDY SCREEN ── */}
      {screen==="study"&&(
        <div style={{maxWidth:500,margin:"0 auto",padding:"20px 16px"}}>

          {/* Category tabs — only when >1 real categories */}
          {cats.length>2&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>changeCat(cat)}
                  style={{padding:"6px 12px",borderRadius:14,minHeight:34,
                    border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,
                    background:filterCat===cat?C.primaryLight:"transparent",
                    color:filterCat===cat?C.primaryDark:C.textMuted,
                    fontSize:12,cursor:"pointer",fontWeight:600}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          {queue.length===0?(
            <div style={{textAlign:"center",marginTop:60}}>
              <p style={{color:C.textMuted,fontSize:15}}>No hay tarjetas en esta categoría.</p>
              <Btn onClick={()=>setScreen("deck")} style={{marginTop:14,margin:"14px auto 0"}}>
                ← Volver al deck
              </Btn>
            </div>
          ):(
            <>
              {/* Progress bar */}
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:700,color:C.primary,fontSize:15}}>
                  {idx+1} / {queue.length}
                </span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={toggleShuffle}
                    style={{padding:"6px 12px",borderRadius:12,minHeight:34,
                      border:`1.5px solid ${shuffled?C.primary:C.border}`,
                      background:shuffled?C.primaryLight:"transparent",
                      color:shuffled?C.primaryDark:C.textMuted,
                      fontSize:12,cursor:"pointer",fontWeight:600}}>
                    🔀 {shuffled?"On":"Off"}
                  </button>
                  <button onClick={()=>{setHardIds(new Set());showToast("Progreso reseteado");}}
                    style={{padding:"6px 12px",borderRadius:12,minHeight:34,
                      border:`1.5px solid ${C.border}`,background:"transparent",
                      color:C.textMuted,fontSize:12,cursor:"pointer"}}>
                    Reset
                  </button>
                </div>
              </div>

              <div style={{height:4,background:C.border,borderRadius:4,marginBottom:20}}>
                <div style={{height:"100%",background:C.primary,borderRadius:4,
                  width:`${((idx+1)/queue.length)*100}%`,transition:"width 0.3s"}}/>
              </div>

              {/* FLASHCARD — tap to flip on mobile */}
              <div onClick={()=>setFlipped(f=>!f)}
                style={{cursor:"pointer",perspective:1000,
                  height:"min(280px, 52vw)",minHeight:200}}>
                <div style={{position:"relative",width:"100%",height:"100%",
                  transformStyle:"preserve-3d",
                  transform:flipped?"rotateY(180deg)":"rotateY(0deg)",
                  transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)"}}>

                  {/* Front */}
                  <div style={{position:"absolute",width:"100%",height:"100%",
                    backfaceVisibility:"hidden",background:C.surface,
                    borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
                    display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",
                    padding:28,boxSizing:"border-box",border:`1.5px solid ${C.border}`}}>
                    {card?.category&&(
                      <span style={{position:"absolute",top:12,left:14,fontSize:11,
                        background:C.primaryLight,color:C.primaryDark,
                        borderRadius:4,padding:"2px 8px",fontWeight:600}}>
                        {card.category}
                      </span>
                    )}
                    {hardIds.has(card?.id)&&(
                      <span style={{position:"absolute",top:12,right:12,fontSize:11,
                        background:C.dangerLight,color:C.danger,
                        borderRadius:4,padding:"2px 8px",fontWeight:600}}>hard</span>
                    )}
                    <p style={{fontSize:"clamp(20px,5vw,28px)",fontWeight:700,
                      textAlign:"center",color:C.text,lineHeight:1.3,margin:0}}>
                      {card?.german}
                    </p>
                    <p style={{fontSize:12,color:C.textLight,marginTop:14,marginBottom:0}}>
                      Tocá para ver la respuesta
                    </p>
                  </div>

                  {/* Back */}
                  <div style={{position:"absolute",width:"100%",height:"100%",
                    backfaceVisibility:"hidden",background:C.primaryLight,
                    borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
                    display:"flex",flexDirection:"column",
                    alignItems:"center",justifyContent:"center",
                    padding:24,boxSizing:"border-box",
                    transform:"rotateY(180deg)",border:`1.5px solid ${C.primary}`,gap:8}}>
                    <p style={{fontSize:"clamp(18px,4.5vw,22px)",fontWeight:700,
                      color:C.primaryDark,textAlign:"center",margin:0}}>
                      {card?.spanish||<span style={{color:C.textLight,fontStyle:"italic"}}>sin traducción</span>}
                    </p>
                    {card?.pronunciation&&(
                      <p style={{fontSize:14,color:C.textMuted,fontStyle:"italic",margin:0}}>
                        /{card.pronunciation}/
                      </p>
                    )}
                    {card?.notes&&(
                      <p style={{fontSize:12,color:C.textMuted,textAlign:"center",margin:0}}>
                        {card.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <p style={{textAlign:"center",color:C.textLight,fontSize:11,margin:"8px 0 0"}}>
                Tocá la tarjeta · ←→ navegar
              </p>

              {/* Easy / Hard — only after flip */}
              {flipped&&(
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <Btn variant="danger"  onClick={markHard} style={{flex:1,fontSize:15,minHeight:50}}>
                    😅 Hard
                  </Btn>
                  <Btn variant="success" onClick={markEasy} style={{flex:1,fontSize:15,minHeight:50}}>
                    ✓ Easy
                  </Btn>
                </div>
              )}

              {/* Navigation */}
              <div style={{display:"flex",gap:10,marginTop:12}}>
                <Btn variant="outline" onClick={()=>nav(-1)} style={{flex:1,minHeight:50}}>← Ant.</Btn>
                <Btn onClick={()=>nav(1)} style={{flex:2,minHeight:50}}>Siguiente →</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom padding for mobile scroll */}
      <div style={{height:32}}/>
    </div>
  );
}
