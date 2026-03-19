const { useState, useEffect, useRef, useCallback } = React;

const CHARGERS = [
  { id: 1, name: "AEON Mall Sen Sok", lat: 11.578, lng: 104.889, type: "DC Fast", kw: 60, price: 0.18, source: "google" },
  { id: 2, name: "Chip Mong 271 Mall", lat: 11.545, lng: 104.921, type: "AC Level 2", kw: 22, price: 0.12, source: "plugshare" },
  { id: 3, name: "NagaWorld Hotel", lat: 11.563, lng: 104.931, type: "DC Fast", kw: 50, price: 0.20, source: "google" },
  { id: 4, name: "Siem Reap Community Stop", lat: 13.362, lng: 103.859, type: "AC Level 2", kw: 11, price: 0.10, source: "telegram" },
  { id: 5, name: "Kampong Cham Station", lat: 12.001, lng: 105.465, type: "DC Fast", kw: 40, price: 0.16, source: "telegram" },
  { id: 6, name: "Battambang EV Hub", lat: 13.095, lng: 103.201, type: "DC Fast", kw: 60, price: 0.18, source: "plugshare" },
];

const MODELS = [
  { name: "BYD Atto 3", capacity: 60, range: 420 },
  { name: "BYD Seal", capacity: 82, range: 570 },
  { name: "BYD Dolphin", capacity: 44, range: 340 },
  { name: "Tesla Model 3", capacity: 75, range: 560 },
  { name: "Wuling Air EV", capacity: 17, range: 200 },
  { name: "MG ZS EV", capacity: 51, range: 320 },
  { name: "Hyundai IONIQ 6", capacity: 77, range: 614 },
  { name: "Custom", capacity: 60, range: 400 },
];

const POPULAR = [
  { label: "Phnom Penh", lat: 11.562, lng: 104.916 },
  { label: "Siem Reap", lat: 13.363, lng: 103.856 },
  { label: "Battambang", lat: 13.095, lng: 103.202 },
  { label: "Kampot", lat: 10.610, lng: 104.181 },
  { label: "Sihanoukville", lat: 10.629, lng: 103.523 },
  { label: "Kampong Cham", lat: 12.001, lng: 105.465 },
];

const srcBadge = {
  google: { bg: "#E6F1FB", color: "#0C447C", label: "Google" },
  plugshare: { bg: "#EEEDFE", color: "#3C3489", label: "PlugShare" },
  telegram: { bg: "#E1F5EE", color: "#085041", label: "Telegram" }
};

function Badge({ src }) {
  const b = srcBadge[src];
  return React.createElement("span", { style: { fontSize: 10, background: b.bg, color: b.color, borderRadius: 6, padding: "2px 7px", fontWeight: 600 } }, b.label);
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "trip", icon: "⊕", label: "Trip" },
    { id: "stops", icon: "⚡", label: "Stops" },
    { id: "cost", icon: "◎", label: "Cost" },
    { id: "summary", icon: "☰", label: "Summary" },
    { id: "settings", icon: "◈", label: "Profile" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,20,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", zIndex: 1000, paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 0 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === t.id ? "#29D99B" : "rgba(255,255,255,0.4)" }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 10, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function Car3DView({ modelName, dark }) {
  const elRef = useRef(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let animId, rot = 0;
    const W = el.clientWidth || 320, H = 190;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    el.innerHTML = ""; el.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const CC = "#29D99B", CD = "#1a7a5a";
    const GC = dark ? "rgba(100,180,255,0.45)" : "rgba(160,210,255,0.6)";
    function drawCar(angle) {
      ctx.clearRect(0, 0, W, H);
      const cx = W/2, cy = H/2+16, cos = Math.cos(angle), sin = Math.sin(angle), pers = 0.18;
      const proj = (x,y,z) => { const rx=x*cos-z*sin,rz=x*sin+z*cos,sc=1/(1+rz*pers); return {x:cx+rx*sc*78,y:cy+y*sc*60,s:sc}; };
      ctx.save(); ctx.translate(cx,cy+32); ctx.scale(1,.2);
      const sg=ctx.createRadialGradient(0,0,4,0,0,80); sg.addColorStop(0,dark?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.15)"); sg.addColorStop(1,"transparent");
      ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2); ctx.fill(); ctx.restore();
      const poly = pts => { ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath(); };
      poly([proj(-1.1,.28,-.42),proj(1.1,.28,-.42),proj(1.1,.28,.42),proj(-1.1,.28,.42)]); ctx.fillStyle=CD; ctx.fill();
      const body=[{x:-1.1,y:.28,z:-.42},{x:1.1,y:.28,z:-.42},{x:1.15,y:-.05,z:-.40},{x:.85,y:-.32,z:-.28},{x:-.85,y:-.32,z:-.28},{x:-1.15,y:-.05,z:-.40}].map(p=>proj(p.x,p.y,p.z));
      poly(body); const g=ctx.createLinearGradient(body[0].x,body[0].y,body[2].x,body[2].y); g.addColorStop(0,CD); g.addColorStop(.5,CC); g.addColorStop(1,CD); ctx.fillStyle=g; ctx.fill();
      poly([proj(-1.1,.28,.42),proj(-1.1,.28,-.42),proj(-1.15,-.05,-.40),proj(-.85,-.32,-.28),proj(-.85,-.32,.28),proj(-1.15,-.05,.40)]); ctx.fillStyle=Math.sin(angle)>0?"#0f5c42":CD; ctx.fill();
      poly([proj(1.1,.28,-.42),proj(1.1,.28,.42),proj(1.15,-.05,.40),proj(.85,-.32,.28),proj(.85,-.32,-.28),proj(1.15,-.05,-.40)]); ctx.fillStyle=Math.sin(angle)<0?"#0f5c42":CD; ctx.fill();
      poly([proj(-.85,-.32,-.28),proj(.85,-.32,-.28),proj(.85,-.32,.28),proj(-.85,-.32,.28)]); const rg=ctx.createLinearGradient(-80,0,80,0); rg.addColorStop(0,"#0d6e50"); rg.addColorStop(.5,CC); rg.addColorStop(1,"#0d6e50"); ctx.fillStyle=rg; ctx.fill();
      [[.85,-.32,-.28,.85,-.32,.28,1.15,-.05,.40,1.15,-.05,-.40],[-.85,-.32,-.28,-.85,-.32,.28,-1.15,-.05,.40,-1.15,-.05,-.40]].forEach(w=>{poly([proj(w[0],w[1],w[2]),proj(w[3],w[4],w[5]),proj(w[6],w[7],w[8]),proj(w[9],w[10],w[11])]); ctx.fillStyle=GC; ctx.fill(); ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.lineWidth=.5; ctx.stroke();});
      [{x:.72,z:-.44},{x:-.72,z:-.44},{x:.72,z:.44},{x:-.72,z:.44}].forEach(w=>{const p=proj(w.x,.28,w.z),r=11*p.s; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fillStyle="#111"; ctx.fill(); ctx.beginPath(); ctx.arc(p.x,p.y,r*.5,0,Math.PI*2); ctx.fillStyle="#2a2a2a"; ctx.fill(); for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2+rot*2; ctx.beginPath(); ctx.moveTo(p.x+Math.cos(a)*r*.5,p.y+Math.sin(a)*r*.5); ctx.lineTo(p.x+Math.cos(a)*r*.9,p.y+Math.sin(a)*r*.9); ctx.strokeStyle="#555"; ctx.lineWidth=1.2; ctx.stroke();}});
      [proj(1.12,0,-.3),proj(1.12,0,.3)].forEach(h=>{ctx.beginPath();ctx.ellipse(h.x,h.y,6*h.s,3.5*h.s,0,0,Math.PI*2);ctx.fillStyle="rgba(255,255,180,0.9)";ctx.fill();});
      [proj(-1.12,0,-.3),proj(-1.12,0,.3)].forEach(t=>{ctx.beginPath();ctx.ellipse(t.x,t.y,5*t.s,3*t.s,0,0,Math.PI*2);ctx.fillStyle="rgba(255,60,60,0.85)";ctx.fill();});
    }
    const animate = () => { rot+=.008; drawCar(rot); animId=requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [dark]);
  const parts = modelName.replace("Custom","").trim().split(" ");
  return (
    <div style={{ marginBottom: 12, textAlign: "center" }}>
      <div ref={elRef} style={{ width:"100%", height:190, borderRadius:14, background: dark?"rgba(0,0,0,0.3)":"rgba(200,230,215,0.3)", overflow:"hidden", border:"1px solid rgba(41,217,155,0.15)" }} />
      <p style={{ margin:"6px 0 0", fontSize:13, color:"rgba(41,217,155,0.8)", fontWeight:500 }}>{parts[0]} <span style={{ color:"rgba(41,217,155,0.45)" }}>{parts.slice(1).join(" ")}</span></p>
    </div>
  );
}

function MapPicker({ dark, label, initialPos, onConfirm, onClose }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRef = useRef(null);
  const [pos, setPos] = useState(initialPos || { lat: 12.5, lng: 104.9 });
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const txt = dark ? "#f0f4ff" : "#0a1530";
  const txt2 = dark ? "rgba(240,244,255,0.5)" : "rgba(10,21,48,0.5)";

  const reverseGeocode = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`);
      const d = await r.json();
      setPlaceName(d.display_name ? d.display_name.split(",").slice(0,2).join(", ").trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch { setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current || !window.L) return;
    const L = window.L;
    const startPos = initialPos || { lat: 12.5, lng: 104.9 };
    const m = L.map(mapRef.current, { zoomControl: true, attributionControl: false, preferCanvas: true });
    L.tileLayer(dark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(m);
    m.setView([startPos.lat, startPos.lng], initialPos ? 13 : 7);
    setTimeout(() => m.invalidateSize(), 100);
    const icon = L.divIcon({ className: "", html: `<div style="width:36px;height:36px;border-radius:50%;background:#29D99B;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>`, iconSize:[36,36], iconAnchor:[18,18] });
    const mk = L.marker([startPos.lat, startPos.lng], { icon, draggable: true }).addTo(m);
    markerRef.current = mk;
    mk.on("dragend", e => { const {lat,lng}=e.target.getLatLng(); setPos({lat,lng}); reverseGeocode(lat,lng); });
    m.on("click", e => { const {lat,lng}=e.latlng; mk.setLatLng([lat,lng]); setPos({lat,lng}); reverseGeocode(lat,lng); });
    mapInst.current = m;
    reverseGeocode(startPos.lat, startPos.lng);
    return () => { if(mapInst.current){mapInst.current.remove();mapInst.current=null;} };
  }, [mapReady]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000, display:"flex", flexDirection:"column", background: dark?"#0a0f1e":"#dde8f5", fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ padding:"env(safe-area-inset-top,12px) 16px 12px", display:"flex", alignItems:"center", gap:12, background: dark?"rgba(10,15,30,0.95)":"rgba(220,235,248,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"8px 14px", color:txt, cursor:"pointer", fontSize:13, fontWeight:600 }}>← Back</button>
        <div><p style={{ margin:0, fontSize:14, fontWeight:600, color:txt }}>Set {label}</p><p style={{ margin:0, fontSize:11, color:txt2 }}>Tap map or drag the pin</p></div>
      </div>
      <div style={{ flex:1, position:"relative", minHeight:0 }} ref={el => { if(el&&!mapReady){ const d=document.createElement("div"); d.style.cssText="width:100%;height:100%;"; el.appendChild(d); mapRef.current=d; setMapReady(true); } }} />
      <div style={{ padding:"14px 16px calc(env(safe-area-inset-bottom,0px)+16px)", background: dark?"rgba(8,13,26,0.97)":"rgba(215,230,245,0.97)", backdropFilter:"blur(16px)", borderTop:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, background: dark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.75)", borderRadius:12, padding:"10px 14px", marginBottom:12, minHeight:46 }}>
          <span style={{ fontSize:20 }}>📍</span>
          <p style={{ margin:0, fontSize:13, color: loading?"#29D99B":txt, flex:1 }}>{loading?"Finding location...":placeName||"Tap anywhere on the map"}</p>
        </div>
        <button onClick={()=>placeName&&!loading&&onConfirm({lat:pos.lat,lng:pos.lng,label:placeName})} style={{ width:"100%", padding:"14px", background:placeName&&!loading?"#29D99B":"rgba(41,217,155,0.2)", border:"none", borderRadius:14, color:placeName&&!loading?"#0a1530":"rgba(41,217,155,0.5)", fontWeight:700, fontSize:15, cursor:placeName&&!loading?"pointer":"default" }}>
          {loading?"Locating...":placeName?`Confirm ${label}`:"Tap the map first"}
        </button>
      </div>
    </div>
  );
}

function PlaceSearch({ label, value, onChange, onMapPick, dark, txt, txt2, cardBorder, placeholder }) {
  const [query, setQuery] = useState(value?.label || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(value?.label || ""); }, [value]);
  useEffect(() => {
    const close = e => { if(wrapRef.current&&!wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("touchstart", close);
    return () => document.removeEventListener("touchstart", close);
  }, []);

  const doSearch = q => {
    setQuery(q); clearTimeout(timer.current);
    if(q.length<2){setResults([]);setOpen(false);return;}
    setBusy(true);
    timer.current = setTimeout(async()=>{
      try{
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=102.3,10.4,107.7,14.7`);
        const data = await res.json();
        setResults(data.features||[]);
        setOpen((data.features||[]).length>0);
      }catch{setResults([]);setOpen(false);}
      setBusy(false);
    },400);
  };

  const pick = f => {
    const p=f.properties;
    const name=[p.name,p.city||p.town||p.village,p.state].filter(Boolean).join(", ");
    setQuery(name); setOpen(false);
    onChange({label:name,lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]});
  };

  return (
    <div ref={wrapRef} style={{ position:"relative", marginBottom:10 }}>
      <p style={{ margin:"0 0 5px", fontSize:12, color:txt2, fontWeight:500 }}>{label}</p>
      <div style={{ display:"flex", gap:8 }}>
        <div style={{ position:"relative", flex:1 }}>
          <input value={query} onChange={e=>doSearch(e.target.value)} onFocus={()=>results.length>0&&setOpen(true)} placeholder={placeholder}
            style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.09)", border:`1px solid ${cardBorder}`, borderRadius:12, padding:"11px 36px 11px 14px", color:txt, fontSize:16, outline:"none", WebkitAppearance:"none" }} />
          {busy
            ? <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, border:"2px solid #29D99B", borderTopColor:"transparent", borderRadius:"50%", animation:"ev-spin 0.6s linear infinite" }} />
            : query ? <span onClick={()=>{setQuery("");onChange(null);setResults([]);setOpen(false);}} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:txt2, cursor:"pointer", fontSize:18 }}>×</span> : null
          }
        </div>
        <button onClick={onMapPick} style={{ width:46, background:"rgba(41,217,155,0.12)", border:"1px solid rgba(41,217,155,0.35)", borderRadius:12, color:"#29D99B", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📍</button>
      </div>
      {open&&results.length>0&&(
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:56, zIndex:500, background: dark?"#111c30":"#fff", border:`1px solid ${cardBorder}`, borderRadius:14, overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
          {results.map((f,i)=>{
            const p=f.properties, name=p.name||"", sub=[p.city||p.town||p.village,p.state,p.country].filter(Boolean).join(", ");
            return <div key={i} onClick={()=>pick(f)} style={{ padding:"11px 14px", cursor:"pointer", borderBottom:i<results.length-1?`1px solid ${cardBorder}`:"none", display:"flex", gap:10, alignItems:"center", background:"transparent" }} onTouchStart={e=>e.currentTarget.style.background="rgba(41,217,155,0.1)"} onTouchEnd={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontSize:16, flexShrink:0 }}>📍</span>
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontWeight:500, fontSize:14, color:txt, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
                {sub&&<div style={{ fontSize:12, color:txt2, marginTop:2 }}>{sub}</div>}
              </div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

function RouteMap({ departure, destination, route, chargerStops, dark }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layersRef = useRef([]);

  useEffect(()=>{
    if(mapInst.current||!mapRef.current||!window.L)return;
    const L=window.L;
    const m=L.map(mapRef.current,{zoomControl:false,attributionControl:false});
    L.tileLayer(dark?"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png":"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{maxZoom:19}).addTo(m);
    L.control.zoom({position:"topright"}).addTo(m);
    m.setView([12.5,104.9],6);
    mapInst.current=m;
  },[]);

  useEffect(()=>{
    const m=mapInst.current; if(!m||!window.L)return;
    const L=window.L;
    layersRef.current.forEach(l=>{try{m.removeLayer(l);}catch{}});
    layersRef.current=[];
    const bounds=[];
    const mkIcon=(bg,label)=>L.divIcon({className:"",html:`<div style="background:${bg};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);color:#0a1530">${label}</div>`,iconSize:[32,32],iconAnchor:[16,16]});
    if(departure){const mk=L.marker([departure.lat,departure.lng],{icon:mkIcon("#29D99B","A")}).addTo(m);mk.bindPopup(`<b>Departure</b><br>${departure.label}`);layersRef.current.push(mk);bounds.push([departure.lat,departure.lng]);}
    if(destination){const mk=L.marker([destination.lat,destination.lng],{icon:mkIcon("#E24B4A","B")}).addTo(m);mk.bindPopup(`<b>Destination</b><br>${destination.label}`);layersRef.current.push(mk);bounds.push([destination.lat,destination.lng]);}
    if(route.length>0){const pl=L.polyline(route,{color:"#29D99B",weight:5,opacity:.85}).addTo(m);layersRef.current.push(pl);}
    chargerStops.forEach(c=>{const mk=L.marker([c.lat,c.lng],{icon:mkIcon("#EF9F27","⚡")}).addTo(m);mk.bindPopup(`<b>${c.name}</b><br>${c.type} · ${c.kw}kW · ${c.price}/kWh`);layersRef.current.push(mk);bounds.push([c.lat,c.lng]);});
    if(bounds.length>=2)m.fitBounds(bounds,{padding:[44,44]});
    else if(bounds.length===1)m.setView(bounds[0],13);
  },[departure,destination,route,chargerStops]);

  return (
    <div style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(255,255,255,0.12)", marginBottom:12, position:"relative" }}>
      <div ref={mapRef} style={{ height:240, width:"100%" }} />
      <div style={{ position:"absolute", bottom:8, left:8, fontSize:10, color:"rgba(255,255,255,0.4)", background:"rgba(0,0,0,0.45)", padding:"3px 8px", borderRadius:6 }}>© OpenStreetMap</div>
    </div>
  );
}

function CustomCarLookup({ dark, txt, txt2, cardBorder, onResult, customCap, customRange, setCustomCap, setCustomRange }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const inp = { width:"100%", background:"rgba(255,255,255,0.08)", border:`1px solid ${cardBorder}`, borderRadius:10, padding:"9px 12px", color:txt, fontSize:16, boxSizing:"border-box", outline:"none", WebkitAppearance:"none" };

  const search = async () => {
    if(!query.trim())return;
    setLoading(true);setError("");setResult(null);setApplied(false);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:`EV database. User searches: "${query}". Return ONLY JSON: {"found":true,"modelName":"full name with year","batteryKwh":number,"rangeKm":number,"note":"one sentence"}. If not EV: {"found":false}. Range=WLTP km.`}]})});
      const data=await res.json();
      const parsed=JSON.parse(data.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim());
      if(parsed.found)setResult(parsed);else setError("No EV found. Try another model.");
    }catch{setError("Lookup failed. Enter specs manually.");}
    setLoading(false);
  };

  return (
    <div style={{ marginTop:14 }}>
      <p style={{ color:txt2, fontSize:12, margin:"0 0 6px" }}>Search your car model</p>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. BYD Han 2023..." style={{ ...inp, flex:1 }} />
        <button onClick={search} disabled={loading} style={{ padding:"9px 14px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1, flexShrink:0 }}>{loading?"...":"Search"}</button>
      </div>
      {loading&&<p style={{ fontSize:13, color:"#29D99B", margin:"0 0 8px" }}>Looking up EV specs...</p>}
      {error&&<p style={{ fontSize:12, color:"#E24B4A", margin:"0 0 8px" }}>{error}</p>}
      {result&&(
        <div style={{ background:"rgba(41,217,155,0.08)", border:`1px solid ${applied?"#29D99B":"rgba(41,217,155,0.3)"}`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
          <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:14, color:txt }}>{result.modelName}</p>
          <p style={{ margin:"0 0 10px", fontSize:12, color:txt2 }}>{result.note}</p>
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            {[{v:result.batteryKwh,u:"kWh"},{v:result.rangeKm,u:"km range"}].map(x=>(
              <div key={x.u} style={{ flex:1, background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"8px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:18, fontWeight:700, color:"#29D99B" }}>{x.v}</p>
                <p style={{ margin:0, fontSize:11, color:txt2 }}>{x.u}</p>
              </div>
            ))}
          </div>
          <button onClick={()=>{onResult(result.batteryKwh,result.rangeKm,result.modelName);setApplied(true);}} style={{ width:"100%", padding:"9px", background:applied?"rgba(41,217,155,0.15)":"#29D99B", border:applied?"1px solid #29D99B":"none", borderRadius:10, color:applied?"#29D99B":"#0a1530", fontWeight:700, fontSize:13, cursor:"pointer" }}>{applied?"Specs applied ✓":"Use these specs"}</button>
        </div>
      )}
      <p style={{ color:txt2, fontSize:11, margin:"8px 0 5px" }}>Or enter manually</p>
      <label style={{ color:txt2, fontSize:12 }}>Battery capacity (kWh)</label>
      <input type="number" value={customCap} onChange={e=>setCustomCap(+e.target.value)} style={{ ...inp, marginBottom:8, marginTop:4 }} />
      <label style={{ color:txt2, fontSize:12 }}>Full range (km)</label>
      <input type="number" value={customRange} onChange={e=>setCustomRange(+e.target.value)} style={{ ...inp, marginTop:4 }} />
    </div>
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("trip");
  const [profile, setProfile] = useState(() => { try { const s=localStorage.getItem("ev_profile"); return s?JSON.parse(s):null; } catch{ return null; } });
  const [setupStep, setSetupStep] = useState(0);
  const [setupModel, setSetupModel] = useState(MODELS[0]);
  const [customCap, setCustomCap] = useState(60);
  const [customRange, setCustomRange] = useState(400);
  const [customCarName, setCustomCarName] = useState("");

  const [departure, setDeparture] = useState(null);
  const [destination, setDestination] = useState(null);
  const [chargePct, setChargePct] = useState(80);
  const [routeCoords, setRouteCoords] = useState([]);
  const [tripDist, setTripDist] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapPicker, setMapPicker] = useState(null);

  const saveProfile = (p) => { setProfile(p); try{ localStorage.setItem("ev_profile", JSON.stringify(p)); }catch{} };

  useEffect(()=>{
    if(!departure||!destination){setRouteCoords([]);setTripDist(0);return;}
    setRouteLoading(true);
    fetch(`https://router.project-osrm.org/route/v1/driving/${departure.lng},${departure.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`)
      .then(r=>r.json()).then(d=>{ if(d.routes?.[0]){setRouteCoords(d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]));setTripDist(Math.round(d.routes[0].distance/1000));} })
      .catch(()=>{}).finally(()=>setRouteLoading(false));
  },[departure,destination]);

  const bg = dark?"linear-gradient(145deg,#0a0f1e,#0d1a2e 50%,#0a1520)":"linear-gradient(145deg,#c9d8f0,#dde8f5 50%,#e8f0f8)";
  const txt = dark?"#f0f4ff":"#0a1530";
  const txt2 = dark?"rgba(240,244,255,0.55)":"rgba(10,21,48,0.55)";
  const cardBorder = dark?"rgba(255,255,255,0.12)":"rgba(0,0,80,0.1)";
  const glass = { background:dark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.6)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", border:`1px solid ${cardBorder}`, borderRadius:20, padding:"1rem 1.1rem" };

  const model = profile || setupModel;
  const capacity = model.name==="Custom"?customCap:model.capacity;
  const maxRange = model.name==="Custom"?customRange:model.range;
  const currentRange = Math.round((chargePct/100)*maxRange);

  const stopsNeeded = CHARGERS.filter(c=>{
    if(!departure||!destination)return false;
    const minLat=Math.min(departure.lat,destination.lat)-0.5, maxLat=Math.max(departure.lat,destination.lat)+0.5;
    const minLng=Math.min(departure.lng,destination.lng)-0.5, maxLng=Math.max(departure.lng,destination.lng)+0.5;
    return c.lat>=minLat&&c.lat<=maxLat&&c.lng>=minLng&&c.lng<=maxLng;
  });

  const segDist = tripDist/(stopsNeeded.length+1);
  let advisorState="idle",advisorMsg="",advisorSub="";
  if(tripDist>0){
    if(currentRange>=tripDist*1.1){advisorState="go";advisorMsg="You're good to go";advisorSub=`Arrive with ~${Math.round(currentRange-tripDist)} km to spare`;}
    else if(currentRange>=segDist*1.1){advisorState="recommend";advisorMsg="Charge recommended";advisorSub=`Charge to at least ${Math.min(100,Math.round((tripDist/maxRange)*100+15))}% for comfortable arrival.`;}
    else{advisorState="required";advisorMsg="Charge required";advisorSub=`Range (${currentRange} km) too low. Charge to ${Math.min(100,Math.round((segDist/maxRange)*100+20))}% before leaving.`;}
  }
  const aClr={go:"#29D99B",recommend:"#EF9F27",required:"#E24B4A",idle:txt2};
  const aBg={go:"rgba(41,217,155,0.1)",recommend:"rgba(239,159,39,0.1)",required:"rgba(226,75,74,0.1)",idle:"rgba(255,255,255,0.04)"};
  const totalKwh = tripDist>0?(tripDist/maxRange)*capacity*0.9:0;
  const totalCost = stopsNeeded.reduce((s,c)=>s+(totalKwh/Math.max(stopsNeeded.length,1)*c.price),0);

  if(mapPicker){
    return React.createElement(MapPicker,{dark,label:mapPicker==="departure"?"Departure":"Destination",initialPos:mapPicker==="departure"?(departure||{lat:11.562,lng:104.916}):(destination||{lat:12.5,lng:104.9}),onConfirm:loc=>{mapPicker==="departure"?setDeparture(loc):setDestination(loc);setMapPicker(null);},onClose:()=>setMapPicker(null)});
  }

  if(!profile){
    return (
      <div style={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"env(safe-area-inset-top,2rem) 1rem 2rem", fontFamily:"-apple-system,sans-serif" }}>
        <div style={{ width:"min(400px,100%)" }}>
          <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
            <div style={{ fontSize:42, marginBottom:8 }}>⚡</div>
            <h1 style={{ color:txt, fontSize:26, fontWeight:700, margin:"0 0 6px" }}>EV Trip Planner</h1>
            <p style={{ color:txt2, fontSize:14, margin:0 }}>Cambodia • One-time setup</p>
          </div>
          <div style={glass}>
            {setupStep===0&&(
              <>
                <p style={{ color:txt, fontWeight:600, marginBottom:12 }}>Select your EV</p>
                <div style={{ maxHeight:320, overflowY:"auto" }}>
                  {MODELS.map(m=>(
                    <div key={m.name} onClick={()=>setSetupModel(m)} style={{ padding:"11px 14px", borderRadius:12, marginBottom:7, cursor:"pointer", background:setupModel.name===m.name?"rgba(41,217,155,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${setupModel.name===m.name?"#29D99B":cardBorder}`, color:txt, fontSize:15, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span>{m.name}</span>
                      <span style={{ color:txt2, fontSize:12 }}>{m.capacity} kWh</span>
                    </div>
                  ))}
                </div>
                {setupModel.name==="Custom"&&<CustomCarLookup dark={dark} txt={txt} txt2={txt2} cardBorder={cardBorder} onResult={(cap,range,name)=>{setCustomCap(cap);setCustomRange(range);setCustomCarName(name);}} customCap={customCap} customRange={customRange} setCustomCap={setCustomCap} setCustomRange={setCustomRange} />}
                <button onClick={()=>setSetupStep(1)} style={{ width:"100%", marginTop:16, padding:"14px", background:"#29D99B", border:"none", borderRadius:13, color:"#0a1530", fontWeight:700, fontSize:16, cursor:"pointer" }}>Continue →</button>
              </>
            )}
            {setupStep===1&&(
              <>
                <p style={{ color:txt, fontWeight:600, marginBottom:12 }}>Confirm your EV</p>
                <Car3DView modelName={setupModel.name==="Custom"?(customCarName||"Your EV"):setupModel.name} dark={dark} />
                <div style={{ background:"rgba(41,217,155,0.1)", border:"1px solid rgba(41,217,155,0.3)", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                  <p style={{ color:"#29D99B", fontWeight:700, margin:"0 0 3px", fontSize:16 }}>{setupModel.name==="Custom"?(customCarName||"Custom EV"):setupModel.name}</p>
                  <p style={{ color:txt2, fontSize:13, margin:0 }}>{capacity} kWh · {maxRange} km full range</p>
                </div>
                <button onClick={()=>{saveProfile(setupModel);setTab("trip");}} style={{ width:"100%", padding:"14px", background:"#29D99B", border:"none", borderRadius:13, color:"#0a1530", fontWeight:700, fontSize:16, cursor:"pointer" }}>Save & Start Planning</button>
                <button onClick={()=>setSetupStep(0)} style={{ width:"100%", marginTop:9, padding:"12px", background:"none", border:`1px solid ${cardBorder}`, borderRadius:13, color:txt2, fontSize:14, cursor:"pointer" }}>← Back</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:bg, fontFamily:"-apple-system,sans-serif", color:txt }}>
      <style>{`@keyframes ev-spin{to{transform:translateY(-50%) rotate(360deg)}} input{-webkit-appearance:none;} * {box-sizing:border-box;}`}</style>
      <div style={{ maxWidth:430, margin:"0 auto", paddingBottom:90, paddingTop:"env(safe-area-inset-top,0px)" }}>

        <div style={{ padding:"1.25rem 1.1rem 0.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>⚡ EV Trip Planner</h1><p style={{ margin:0, fontSize:12, color:txt2 }}>Cambodia</p></div>
          <button onClick={()=>setDark(!dark)} style={{ background:"rgba(255,255,255,0.08)", border:`1px solid ${cardBorder}`, borderRadius:20, padding:"6px 14px", color:txt, fontSize:12, cursor:"pointer" }}>{dark?"☀ Light":"☾ Dark"}</button>
        </div>

        {tab==="trip"&&(
          <div style={{ padding:"0.5rem 1.1rem" }}>
            <div style={{ ...glass, padding:"9px 14px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ margin:0, fontSize:11, color:txt2 }}>Your EV</p><p style={{ margin:0, fontSize:14, fontWeight:600 }}>{profile.name}</p></div>
              <span style={{ fontSize:13, color:"#29D99B", cursor:"pointer" }} onClick={()=>setTab("settings")}>Edit ›</span>
            </div>
            <div style={{ ...glass, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600 }}>Current charge <span style={{ color:"#E24B4A", fontSize:11 }}>*required</span></p>
                <span style={{ fontSize:18, fontWeight:700, color:chargePct>50?"#29D99B":chargePct>20?"#EF9F27":"#E24B4A" }}>{chargePct}%</span>
              </div>
              <input type="range" min={5} max={100} value={chargePct} step={1} onChange={e=>setChargePct(+e.target.value)} style={{ width:"100%", accentColor:"#29D99B" }} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ fontSize:11, color:txt2 }}>5%</span>
                <span style={{ fontSize:12, color:txt2 }}>Range: <b style={{ color:txt }}>{currentRange} km</b></span>
                <span style={{ fontSize:11, color:txt2 }}>100%</span>
              </div>
            </div>
            <div style={{ ...glass, marginBottom:10 }}>
              <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:600 }}>Plan your route</p>
              <PlaceSearch label="Departure" value={departure} onChange={setDeparture} onMapPick={()=>setMapPicker("departure")} dark={dark} txt={txt} txt2={txt2} cardBorder={cardBorder} placeholder="Type city or tap 📍" />
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"0 0 2px", paddingLeft:4 }}>
                <div style={{ width:2, height:14, background:"rgba(41,217,155,0.25)", borderRadius:2, marginLeft:5 }}></div>
                <button onClick={()=>{const t=departure;setDeparture(destination);setDestination(t);}} style={{ marginLeft:"auto", background:"rgba(255,255,255,0.07)", border:`1px solid ${cardBorder}`, borderRadius:8, padding:"4px 12px", color:txt2, fontSize:12, cursor:"pointer" }}>⇅ swap</button>
              </div>
              <PlaceSearch label="Destination" value={destination} onChange={setDestination} onMapPick={()=>setMapPicker("destination")} dark={dark} txt={txt} txt2={txt2} cardBorder={cardBorder} placeholder="Type city or tap 📍" />
              {(!departure||!destination)&&(
                <div style={{ marginTop:10 }}>
                  <p style={{ margin:"0 0 7px", fontSize:11, color:txt2 }}>Popular destinations</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {POPULAR.map(p=><button key={p.label} onClick={()=>{if(!departure)setDeparture(p);else if(!destination)setDestination(p);}} style={{ padding:"6px 13px", background:"rgba(255,255,255,0.06)", border:`1px solid ${cardBorder}`, borderRadius:20, color:txt, fontSize:13, cursor:"pointer" }}>{p.label}</button>)}
                  </div>
                </div>
              )}
              {routeLoading&&<p style={{ margin:"10px 0 0", fontSize:12, color:"#29D99B" }}>⏳ Calculating route...</p>}
              {tripDist>0&&!routeLoading&&(
                <div style={{ marginTop:10, display:"flex", gap:8 }}>
                  <div style={{ flex:1, background:"rgba(41,217,155,0.08)", borderRadius:10, padding:"8px 12px", textAlign:"center" }}><p style={{ margin:0, fontSize:16, fontWeight:700, color:"#29D99B" }}>{tripDist} km</p><p style={{ margin:0, fontSize:11, color:txt2 }}>driving distance</p></div>
                  <div style={{ flex:1, background:"rgba(239,159,39,0.08)", borderRadius:10, padding:"8px 12px", textAlign:"center" }}><p style={{ margin:0, fontSize:16, fontWeight:700, color:"#EF9F27" }}>{stopsNeeded.length}</p><p style={{ margin:0, fontSize:11, color:txt2 }}>charging stops</p></div>
                </div>
              )}
              {departure&&destination&&!routeLoading&&(
                <button onClick={()=>setTab("stops")} style={{ width:"100%", marginTop:12, padding:"14px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:16, cursor:"pointer" }}>View Stops & Plan →</button>
              )}
              {departure&&!destination&&<p style={{ margin:"10px 0 0", fontSize:13, color:txt2, textAlign:"center" }}>Now set your destination ↑</p>}
              {!departure&&destination&&<p style={{ margin:"10px 0 0", fontSize:13, color:txt2, textAlign:"center" }}>Now set your departure ↑</p>}
            </div>
            {(departure||destination)&&<RouteMap departure={departure} destination={destination} route={routeCoords} chargerStops={stopsNeeded} dark={dark} />}
            {tripDist>0&&(
              <div style={{ ...glass, background:aBg[advisorState], border:`1px solid ${aClr[advisorState]}55`, marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:aClr[advisorState], flexShrink:0, marginTop:4 }}></div>
                  <div><p style={{ margin:0, fontWeight:700, fontSize:15, color:aClr[advisorState] }}>{advisorMsg}</p><p style={{ margin:"4px 0 0", fontSize:13, color:txt2, lineHeight:1.6 }}>{advisorSub}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="stops"&&(
          <div style={{ padding:"0.75rem 1.1rem" }}>
            {!departure||!destination
              ?<div style={{ ...glass, textAlign:"center", padding:"2rem" }}><p style={{ color:txt2 }}>Set a route in the Trip tab first.</p><button onClick={()=>setTab("trip")} style={{ marginTop:8, padding:"10px 22px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" }}>Plan Route ↗</button></div>
              :<>
                <p style={{ fontSize:13, color:txt2, marginBottom:12 }}>{departure.label} → {destination.label} · {tripDist} km</p>
                {stopsNeeded.length===0
                  ?<div style={{ ...glass, textAlign:"center", padding:"1.5rem" }}><p style={{ color:"#29D99B", fontWeight:700, fontSize:15 }}>No charging stops needed!</p><p style={{ color:txt2, fontSize:13 }}>Your current charge covers this trip.</p></div>
                  :stopsNeeded.map(c=>(
                    <div key={c.id} style={{ ...glass, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}><p style={{ margin:0, fontWeight:600, fontSize:14 }}>{c.name}</p><Badge src={c.source}/></div><p style={{ margin:0, fontSize:12, color:txt2 }}>{c.type} · {c.kw} kW</p></div>
                        <p style={{ margin:0, fontWeight:700, color:"#29D99B", fontSize:14 }}>${c.price}/kWh</p>
                      </div>
                      {c.source==="telegram"&&<div style={{ marginTop:8, background:"rgba(41,217,155,0.07)", borderRadius:8, padding:"6px 10px", fontSize:12, color:"#29D99B" }}>@evstationcambodia · <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={()=>window.open("https://t.me/evstationcambodia","_blank")}>Open Telegram ↗</span></div>}
                    </div>
                  ))
                }
                <button onClick={()=>setTab("cost")} style={{ width:"100%", padding:"14px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:16, cursor:"pointer", marginTop:4 }}>See Cost Estimate →</button>
              </>
            }
          </div>
        )}

        {tab==="cost"&&(
          <div style={{ padding:"0.75rem 1.1rem" }}>
            {tripDist===0
              ?<div style={{ ...glass, textAlign:"center", padding:"2rem" }}><p style={{ color:txt2 }}>Set a route first.</p><button onClick={()=>setTab("trip")} style={{ marginTop:8, padding:"10px 22px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" }}>Plan Route ↗</button></div>
              :<>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {[{label:"Distance",value:`${tripDist} km`},{label:"Stops",value:stopsNeeded.length},{label:"Energy needed",value:`${totalKwh.toFixed(1)} kWh`},{label:"Total cost",value:`${totalCost.toFixed(2)}`}].map(m=>(
                    <div key={m.label} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"1rem", border:`1px solid ${cardBorder}` }}>
                      <p style={{ margin:"0 0 4px", fontSize:11, color:txt2 }}>{m.label}</p>
                      <p style={{ margin:0, fontSize:22, fontWeight:700 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
                {stopsNeeded.map(c=>{const kwh=totalKwh/Math.max(stopsNeeded.length,1),cost=kwh*c.price;return<div key={c.id} style={{ ...glass, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><p style={{ margin:0, fontSize:13, fontWeight:600 }}>{c.name}</p><p style={{ margin:0, fontSize:11, color:txt2 }}>{kwh.toFixed(1)} kWh @ ${c.price}/kWh</p></div><p style={{ margin:0, fontWeight:700, color:"#29D99B" }}>${cost.toFixed(2)}</p></div>;})}
                <button onClick={()=>setTab("summary")} style={{ width:"100%", padding:"14px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:16, cursor:"pointer", marginTop:4 }}>See Trip Summary →</button>
              </>
            }
          </div>
        )}

        {tab==="summary"&&(
          <div style={{ padding:"0.75rem 1.1rem" }}>
            {tripDist===0
              ?<div style={{ ...glass, textAlign:"center", padding:"2rem" }}><p style={{ color:txt2 }}>Plan a route first.</p><button onClick={()=>setTab("trip")} style={{ marginTop:8, padding:"10px 22px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" }}>Plan Route ↗</button></div>
              :<>
                <div style={{ ...glass, marginBottom:12, border:"1px solid rgba(41,217,155,0.3)", background:"rgba(41,217,155,0.05)" }}>
                  <p style={{ margin:"0 0 3px", fontSize:11, color:txt2 }}>Trip summary</p>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:600 }}>{departure?.label}</p>
                  <p style={{ margin:"0 0 12px", fontSize:15, fontWeight:700, color:"#29D99B" }}>→ {destination?.label}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[{label:"Distance",val:`${tripDist} km`},{label:"Stops",val:stopsNeeded.length},{label:"Est. cost",val:`${totalCost.toFixed(2)}`}].map(i=>(
                      <div key={i.label} style={{ textAlign:"center" }}><p style={{ margin:0, fontSize:18, fontWeight:700, color:"#29D99B" }}>{i.val}</p><p style={{ margin:0, fontSize:11, color:txt2 }}>{i.label}</p></div>
                    ))}
                  </div>
                </div>
                <div style={{ ...glass, marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:10, height:10, borderRadius:"50%", background:aClr[advisorState] }}></div><p style={{ margin:0, color:aClr[advisorState], fontWeight:600, fontSize:14 }}>{advisorMsg}</p></div>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:txt2 }}>{advisorSub}</p>
                </div>
                <button onClick={()=>{const trip={departure:departure?.label,destination:destination?.label,dist:tripDist,stops:stopsNeeded.length,cost:totalCost.toFixed(2),date:new Date().toLocaleDateString()};try{const saved=JSON.parse(localStorage.getItem("ev_trips")||"[]");saved.unshift(trip);localStorage.setItem("ev_trips",JSON.stringify(saved.slice(0,10)));}catch{}alert("Trip saved!");}} style={{ width:"100%", padding:"14px", background:"rgba(41,217,155,0.15)", border:"1px solid #29D99B", borderRadius:14, color:"#29D99B", fontWeight:700, fontSize:15, cursor:"pointer" }}>💾 Save Trip</button>
              </>
            }
          </div>
        )}

        {tab==="settings"&&(
          <div style={{ padding:"0.75rem 1.1rem" }}>
            <p style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>EV Profile</p>
            <div style={{ ...glass, marginBottom:12 }}>
              {MODELS.map(m=>(
                <div key={m.name} onClick={()=>saveProfile(m)} style={{ padding:"11px 14px", borderRadius:11, marginBottom:6, cursor:"pointer", fontSize:14, background:profile.name===m.name?"rgba(41,217,155,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${profile.name===m.name?"#29D99B":cardBorder}`, display:"flex", justifyContent:"space-between", color:txt }}>
                  <span>{m.name}</span><span style={{ color:txt2 }}>{m.capacity} kWh · {m.range} km</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize:12, color:txt2 }}>Profile is saved on your device.</p>
          </div>
        )}

      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
