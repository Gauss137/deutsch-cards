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
  { german:"Guten Morgen",        spanish:"Buenos días",                   pronunciation:"guten morgan",    notes:"Saludo matutino",        category:"Saludos" },
  { german:"Guten Tag",           spanish:"Buenas tardes",                  pronunciation:"guten tag",       notes:"",                       category:"Saludos" },
  { german:"Auf Wiedersehen",     spanish:"Hasta luego",                   pronunciation:"auf víderzen",    notes:"Formal",                 category:"Saludos" },
  { german:"Tschüss",             spanish:"Chau",                          pronunciation:"chus",            notes:"Informal",               category:"Saludos" },
  { german:"Bitte",               spanish:"Por favor / De nada",           pronunciation:"bite",            notes:"Muy frecuente",          category:"Básico"  },
  { german:"Danke schön",         spanish:"Muchas gracias",                pronunciation:"danke shön",      notes:"",                       category:"Básico"  },
  { german:"Entschuldigung",      spanish:"Disculpe / Perdón",             pronunciation:"entshuldigung",   notes:"Para llamar la atención",category:"Básico"  },
  { german:"Ich verstehe nicht",  spanish:"No entiendo",                   pronunciation:"ij ferstee nijt", notes:"Muy útil",               category:"Básico"  },
  { german:"Wo ist das Hotel?",   spanish:"¿Dónde está el hotel?",         pronunciation:"vo ist das hotel",notes:"",                       category:"Viaje"   },
  { german:"Die Rechnung, bitte", spanish:"La cuenta, por favor",          pronunciation:"di rejnung bite", notes:"Restaurantes",           category:"Restaurante"},
  { german:"Wie viel kostet das?",spanish:"¿Cuánto cuesta esto?",          pronunciation:"vi fil kóstet das",notes:"",                      category:"Compras" },
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
function save(cards,hardIds) {
  try { localStorage.setItem("dc_v4", JSON.stringify({cards,hardIds:[...hardIds]})); } catch {}
}

function parseCSV(raw) {
  const text = raw.replace(/^\uFEFF/,"");
  const firstLine = text.split(/\r?\n/)[0];
  const delim = (firstLine.match(/;/g)||[]).length >= (firstLine.match(/,/g)||[]).length ? ";" : ",";
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length < 2) return [];
  function parseLine(line) {
    const cols=[]; let cur="", inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){ inQ=!inQ; }
      else if(ch===delim&&!inQ){ cols.push(cur.trim()); cur=""; }
      else cur+=ch;
    }
    cols.push(cur.trim());
    return cols;
  }
  const rawHeaders = parseLine(lines[0]);
  const normalize = h => h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"")
    .replace("aleman","german").replace("espanol","spanish")
    .replace("pronunciacion","pronunciation")
    .replace("notas","notes")
    .replace("categoria","category");
  const headers = rawHeaders.map(normalize);
  const results=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseLine(lines[i]);
    const obj={};
    headers.forEach((h,idx)=>{ obj[h]=(cols[idx]||"").replace(/^"|"$/g,"").trim(); });
    if(obj.german) results.push(obj);
  }
  return results;
}

function buildQueue(cards,hardIds,shuffled,cat){
  const pool = cat==="all" ? cards : cards.filter(c=>c.category===cat);
  const hard=pool.filter(c=>hardIds.has(c.id));
  const norm=pool.filter(c=>!hardIds.has(c.id));
  let q=[...hard,...hard,...norm];
  if(shuffled) q=q.sort(()=>Math.random()-0.5);
  return q;
}

function Btn({children,onClick,variant="primary",disabled,style={}}){
  const base={padding:"10px 18px",borderRadius:6,fontWeight:600,fontSize:14,cursor:disabled?"not-allowed":"pointer",border:"none",transition:"opacity 0.15s",opacity:disabled?0.5:1,...style};
  const variants={
    primary:{background:C.primary,color:"#fff"},
    outline:{background:C.surface,color:C.text,border:`1.5px solid ${C.border}`},
    ghost:{background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`},
    danger:{background:C.dangerLight,color:C.danger},
    success:{background:C.successLight,color:"#16a34a"},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant]}}>{children}</button>;
}

function Badge({children,color="orange"}){
  const colors={orange:{bg:C.primaryLight,text:C.primaryDark},red:{bg:C.dangerLight,text:C.danger},gray:{bg:"#f3f4f6",text:C.textMuted}};
  const {bg,text}=colors[color]||colors.orange;
  return <span style={{fontSize:11,background:bg,color:text,borderRadius:4,padding:"2px 7px",fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>;
}

function StatCard({value,label,color=C.primary}){
  return(
    <div style={{flex:1,minWidth:100,background:C.surface,borderRadius:8,padding:"14px 10px",border:`1px solid ${C.border}`,textAlign:"center"}}>
      <div style={{fontSize:24,fontWeight:700,color}}>{value}</div>
      <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{label}</div>
    </div>
  );
}

export default function App(){
  const [screen,setScreen]=useState("deck");
  const [cards,setCards]=useState([]);
  const [hardIds,setHardIds]=useState(new Set());
  const [toast,setToast]=useState("");
  const [queue,setQueue]=useState([]);
  const [idx,setIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [shuffled,setShuffled]=useState(false);
  const [filterCat,setFilterCat]=useState("all");
  const [editCard,setEditCard]=useState(null);
  const [importDate,setImportDate]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef();

  useEffect(()=>{
    const saved=load();
    if(saved&&saved.cards.length>0){ setCards(saved.cards); setHardIds(saved.hardIds); }
    else setCards(stamp(SAMPLE_CARDS));
  },[]);
  useEffect(()=>{ save(cards,hardIds); },[cards,hardIds]);

  const showToast=msg=>{ setToast(msg); setTimeout(()=>setToast(""),3000); };
  const cats=["all",...[...new Set(cards.map(c=>c.category).filter(Boolean))]];

  const goStudy=useCallback((fc=cards,hi=hardIds,sh=shuffled,cat=filterCat)=>{
    const q=buildQueue(fc,hi,sh,cat);
    setQueue(q); setIdx(0); setFlipped(false); setScreen("study");
  },[cards,hardIds,shuffled,filterCat]);

  const handleFile=file=>{
    if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const parsed=parseCSV(e.target.result);
      if(!parsed.length){ showToast("No se encontraron tarjetas en el CSV"); return; }
      const existing=new Set(cards.map(c=>c.german+"||"+c.spanish));
      const fresh=parsed.filter(c=>!existing.has(c.german+"||"+c.spanish));
      if(!fresh.length){ showToast("Todas las tarjetas ya existen en el deck"); return; }
      const stamped=stamp(fresh);
      setCards(f=>[...f,...stamped]);
      setImportDate(new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}));
      showToast(`✓ ${stamped.length} tarjetas importadas · ${parsed.length-fresh.length} duplicadas omitidas`);
    };
    reader.readAsText(file,"utf-8");
  };

  const addBlank=()=>{ setEditCard({id:makeId(),german:"",spanish:"",pronunciation:"",notes:"",category:"",createdAt:Date.now(),lastReviewed:null}); };

  const saveEdit=card=>{
    if(!card.german.trim()){ showToast("El campo Alemán es obligatorio"); return; }
    setCards(f=>{ const ex=f.find(c=>c.id===card.id); return ex?f.map(c=>c.id===card.id?card:c):[...f,card]; });
    setEditCard(null); showToast("Tarjeta guardada");
  };

  const delCard=id=>{ setCards(f=>f.filter(c=>c.id!==id)); setHardIds(h=>{ const n=new Set(h); n.delete(id); return n; }); };

  const nav=useCallback(dir=>{
    setIdx(i=>{ const n=i+dir; if(n<0) return queue.length-1; if(n>=queue.length) return 0; return n; });
    setFlipped(false);
  },[queue.length]);

  useEffect(()=>{
    if(screen!=="study") return;
    const h=e=>{
      if(["ArrowUp","ArrowDown"].includes(e.key)){ e.preventDefault(); setFlipped(f=>!f); }
      if(e.key==="ArrowRight"){ e.preventDefault(); nav(1); }
      if(e.key==="ArrowLeft"){ e.preventDefault(); nav(-1); }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[screen,nav]);

  const markEasy=()=>{ const c=queue[idx]; setHardIds(p=>{ const n=new Set(p); n.delete(c.id); return n; }); showToast("Easy ✓"); nav(1); };
  const markHard=()=>{ const c=queue[idx]; setHardIds(p=>new Set([...p,c.id])); showToast("Hard – aparecerá más seguido"); nav(1); };

  const changeCat=cat=>{ setFilterCat(cat); const q=buildQueue(cards,hardIds,shuffled,cat); setQueue(q); setIdx(0); setFlipped(false); };
  const toggleShuffle=()=>{ const ns=!shuffled; setShuffled(ns); const q=buildQueue(cards,hardIds,ns,filterCat); setQueue(q); setIdx(0); setFlipped(false); };

  const card=queue[idx];

  if(editCard) return(
    <div style={{minHeight:"100vh",background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.surface,borderRadius:10,padding:28,width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,0.15)"}}>
        <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:C.text}}>Editar tarjeta</h3>
        {[["german","Alemán *"],["spanish","Español"],["pronunciation","Pronunciación"],["notes","Notas"],["category","Categoría"]].map(([k,label])=>(
          <div key={k} style={{marginBottom:13}}>
            <label style={{fontSize:12,color:C.textMuted,display:"block",marginBottom:4,fontWeight:600}}>{label}</label>
            <input value={editCard[k]||""} onChange={e=>setEditCard(c=>({...c,[k]:e.target.value}))}
              style={{width:"100%",padding:"9px 12px",borderRadius:6,border:`1.5px solid ${C.border}`,fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit",color:C.text}}
              onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <Btn variant="outline" onClick={()=>setEditCard(null)} style={{flex:1}}>Cancelar</Btn>
          <Btn onClick={()=>saveEdit(editCard)} style={{flex:1}}>Guardar</Btn>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.text}}>
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#1f2937",color:"#fff",padding:"10px 22px",borderRadius:30,fontSize:13,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",whiteSpace:"nowrap"}}>{toast}</div>}

      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:C.primary,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🇩🇪</div>
          <div>
            <span style={{fontWeight:700,fontSize:15,color:C.text}}>DeutschCards</span>
            <span style={{fontSize:11,color:C.textMuted,marginLeft:8}}>CSW</span>
          </div>
          {importDate&&<span style={{fontSize:11,color:C.textLight,marginLeft:4}}>· actualizado {importDate}</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          {[["deck","📦 Deck"],["study","▶ Estudiar"]].map(([s,label])=>(
            <button key={s} onClick={()=>s==="study"?goStudy():setScreen(s)}
              style={{padding:"7px 16px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
                background:screen===s?C.primary:"transparent",
                color:screen===s?"#fff":C.textMuted,
                transition:"all 0.15s"}}>
              {label}{s==="study"&&cards.length>0?` (${cards.length})`:""}
            </button>
          ))}
        </div>
      </div>

      {screen==="deck"&&(
        <div style={{maxWidth:680,margin:"32px auto",padding:"0 18px"}}>
          <div
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
            style={{background:dragOver?C.primaryLight:C.surface,border:`2px dashed ${dragOver?C.primary:C.border}`,borderRadius:10,padding:"24px 20px",textAlign:"center",cursor:"pointer",marginBottom:20,transition:"all 0.2s"}}>
            <div style={{fontSize:26,marginBottom:6}}>📂</div>
            <p style={{fontWeight:700,color:C.primary,fontSize:15,margin:0}}>Importar CSV</p>
            <p style={{color:C.textMuted,fontSize:12,margin:"4px 0 0"}}>Columnas: Alemán · Español · Pronunciación · Notas · Categoría</p>
            <p style={{color:C.textLight,fontSize:11,marginTop:2}}>Arrastrá el archivo o hacé click · separador , o ;</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>

          <div style={{display:"flex",gap:10,marginBottom:18}}>
            <StatCard value={cards.length} label="tarjetas totales"/>
            <StatCard value={hardIds.size} label="marcadas hard" color={C.danger}/>
            <StatCard value={cats.length-1} label="categorías" color={C.primaryDark}/>
          </div>

          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <Btn variant="outline" onClick={addBlank} style={{flex:1}}>+ Manual</Btn>
            <Btn onClick={()=>goStudy()} disabled={!cards.length} style={{flex:2}}>▶ Estudiar deck</Btn>
          </div>

          {cats.length>2&&(
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>setFilterCat(cat)}
                  style={{padding:"4px 12px",borderRadius:16,border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,
                    background:filterCat===cat?C.primaryLight:"transparent",
                    color:filterCat===cat?C.primaryDark:C.textMuted,
                    fontSize:12,cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          <div style={{maxHeight:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {cards.filter(c=>filterCat==="all"||c.category===filterCat).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",padding:"10px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <span style={{fontWeight:600,fontSize:13,color:C.text}}>{c.german}</span>
                  {c.category&&<span style={{marginLeft:8,fontSize:10,background:C.primaryLight,color:C.primaryDark,borderRadius:4,padding:"1px 6px",fontWeight:600}}>{c.category}</span>}
                </div>
                <span style={{color:C.textMuted,fontSize:12,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.spanish}</span>
                <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
                  {hardIds.has(c.id)&&<Badge color="red">hard</Badge>}
                  <button onClick={()=>setEditCard({...c})} style={{background:"none",border:"none",cursor:"pointer",color:C.primary,fontSize:14,padding:"2px 4px"}}>✏️</button>
                  <button onClick={()=>delCard(c.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontSize:13,padding:"2px 4px"}}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {cards.length>0&&(
            <button onClick={()=>{setCards([]);setHardIds(new Set());}} style={{marginTop:14,fontSize:12,color:C.danger,background:"none",border:"none",cursor:"pointer"}}>
              Vaciar deck
            </button>
          )}
        </div>
      )}

      {screen==="study"&&(
        <div style={{maxWidth:500,margin:"28px auto",padding:"0 18px"}}>
          {cats.length>2&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>changeCat(cat)}
                  style={{padding:"4px 11px",borderRadius:14,border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,
                    background:filterCat===cat?C.primaryLight:"transparent",
                    color:filterCat===cat?C.primaryDark:C.textMuted,
                    fontSize:11,cursor:"pointer",fontWeight:600}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          {queue.length===0?(
            <div style={{textAlign:"center",marginTop:60}}>
              <p style={{color:C.textMuted,fontSize:15}}>No hay tarjetas en esta categoría.</p>
              <Btn onClick={()=>setScreen("deck")} style={{marginTop:14}}>← Volver al deck</Btn>
            </div>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontWeight:700,color:C.primary,fontSize:15}}>{idx+1} / {queue.length}</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={toggleShuffle}
                    style={{padding:"5px 12px",borderRadius:14,border:`1.5px solid ${shuffled?C.primary:C.border}`,
                      background:shuffled?C.primaryLight:"transparent",
                      color:shuffled?C.primaryDark:C.textMuted,fontSize:12,cursor:"pointer",fontWeight:600}}>
                    🔀 {shuffled?"On":"Off"}
                  </button>
                  <button onClick={()=>{setHardIds(new Set());showToast("Progreso reseteado");}}
                    style={{padding:"5px 12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.textMuted,fontSize:12,cursor:"pointer"}}>
                    Reset
                  </button>
                </div>
              </div>

              <div style={{height:4,background:C.border,borderRadius:4,marginBottom:22}}>
                <div style={{height:"100%",background:C.primary,borderRadius:4,width:`${((idx+1)/queue.length)*100}%`,transition:"width 0.3s"}}/>
              </div>

              <div onClick={()=>setFlipped(f=>!f)} style={{cursor:"pointer",perspective:1000,height:260}}>
                <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",
                  transform:flipped?"rotateY(180deg)":"rotateY(0deg)",
                  transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)"}}>
                  <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",
                    background:C.surface,borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    padding:32,boxSizing:"border-box",border:`1.5px solid ${C.border}`}}>
                    {card?.category&&<span style={{position:"absolute",top:14,left:16,fontSize:11,background:C.primaryLight,color:C.primaryDark,borderRadius:4,padding:"2px 8px",fontWeight:600}}>{card.category}</span>}
                    {hardIds.has(card?.id)&&<span style={{position:"absolute",top:14,right:14,fontSize:11,background:C.dangerLight,color:C.danger,borderRadius:4,padding:"2px 8px",fontWeight:600}}>hard</span>}
                    <p style={{fontSize:28,fontWeight:700,textAlign:"center",color:C.text,lineHeight:1.3,margin:0}}>{card?.german}</p>
                  </div>
                  <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",
                    background:C.primaryLight,borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    padding:28,boxSizing:"border-box",transform:"rotateY(180deg)",
                    border:`1.5px solid ${C.primary}`,gap:10}}>
                    <p style={{fontSize:22,fontWeight:700,color:C.primaryDark,textAlign:"center",margin:0}}>{card?.spanish||<span style={{color:C.textLight,fontStyle:"italic"}}>sin traducción</span>}</p>
                    {card?.pronunciation&&<p style={{fontSize:14,color:C.textMuted,fontStyle:"italic",margin:0}}>/{card.pronunciation}/</p>}
                    {card?.notes&&<p style={{fontSize:12,color:C.textMuted,textAlign:"center",margin:0}}>{card.notes}</p>}
                  </div>
                </div>
              </div>

              <p style={{textAlign:"center",color:C.textLight,fontSize:11,margin:"10px 0 0"}}>↑↓ voltear · ←→ navegar</p>

              {flipped&&(
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <Btn variant="danger" onClick={markHard} style={{flex:1,fontSize:14}}>😅 Hard</Btn>
                  <Btn variant="success" onClick={markEasy} style={{flex:1,fontSize:14}}>✓ Easy</Btn>
                </div>
              )}

              <div style={{display:"flex",gap:10,marginTop:12}}>
                <Btn variant="outline" onClick={()=>nav(-1)} style={{flex:1}}>← Anterior</Btn>
                <Btn onClick={()=>nav(1)} style={{flex:1}}>Siguiente →</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
