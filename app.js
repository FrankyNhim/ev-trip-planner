const { useState, useEffect, useRef, useCallback } = React;

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

function distToSegment(p, a, b) {
  const dx = b.lng - a.lng, dy = b.lat - a.lat;
  if (dx === 0 && dy === 0) return Math.hypot(p.lat - a.lat, p.lng - a.lng);
  let t = ((p.lat - a.lat) * dy + (p.lng - a.lng) * dx) / (dy * dy + dx * dx);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.lat - (a.lat + t * dy), p.lng - (a.lng + t * dx));
}

function isAlongRoute(charger, routeCoords) {
  if (!routeCoords || routeCoords.length < 2) return false;
  const threshold = 0.14;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const a = { lat: routeCoords[i][0], lng: routeCoords[i][1] };
    const b = { lat: routeCoords[i+1][0], lng: routeCoords[i+1][1] };
    if (distToSegment(charger, a, b) < threshold) return true;
  }
  return false;
}

const srcBadge = {
  google: { bg: "#E6F1FB", color: "#0C447C", label: "OSM" },
  plugshare: { bg: "#EEEDFE", color: "#3C3489", label: "PlugShare" },
  telegram: { bg: "#E1F5EE", color: "#085041", label: "Telegram" }
};

function Badge({ src }) {
  const b = srcBadge[src];
  return React.createElement("span", {
    style: { fontSize: 10, background: b.bg, color: b.color, borderRadius: 6, padding: "2px 7px", fontWeight: 600 }
  }, b.label);
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "trip", icon: "⊕", label: "Trip" },
    { id: "stops", icon: "⚡", label: "Stops" },
    { id: "cost", icon: "◎", label: "Cost" },
    { id: "summary", icon: "☰", label: "Summary" },
    { id: "settings", icon: "◈", label: "Profile" },
  ];
  return React.createElement("div", {
    style: { position:"fixed", bottom:0, left:0, right:0, background:"rgba(10,10,20,0.92)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderTop:"1px solid rgba(255,255,255,0.1)", display:"flex", zIndex:1000, paddingBottom:"env(safe-area-inset-bottom,8px)" }
  }, tabs.map(t =>
    React.createElement("button", {
      key: t.id, onClick: () => setTab(t.id),
      style: { flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 0 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color: tab===t.id?"#29D99B":"rgba(255,255,255,0.4)" }
    },
      React.createElement("span", { style:{ fontSize:18 } }, t.icon),
      React.createElement("span", { style:{ fontSize:10, fontWeight: tab===t.id?600:400 } }, t.label)
    )
  ));
}

function Car3DView({ modelName, dark }) {
  const elRef = useRef(null);
  useEffect(() => {
    const el = elRef.current; if (!el) return;
    let animId, rot = 0;
    const W = el.clientWidth || 320, H = 190;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    el.innerHTML = ""; el.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const CC = "#29D99B", CD = "#1a7a5a";
    const GC = "rgba(160,210,255,0.6)";
    function drawCar(angle) {
      ctx.clearRect(0, 0, W, H);
      const cx=W/2, cy=H/2+16, cos=Math.cos(angle), sin=Math.sin(angle), pers=0.18;
      const proj=(x,y,z)=>{const rx=x*cos-z*sin,rz=x*sin+z*cos,sc=1/(1+rz*pers);return{x:cx+rx*sc*78,y:cy+y*sc*60,s:sc};};
      ctx.save();ctx.translate(cx,cy+32);ctx.scale(1,.2);
      const sg=ctx.createRadialGradient(0,0,4,0,0,80);sg.addColorStop(0,"rgba(0,0,0,0.15)");sg.addColorStop(1,"transparent");
      ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,80,0,Math.PI*2);ctx.fill();ctx.restore();
      const poly=pts=>{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();};
      poly([proj(-1.1,.28,-.42),proj(1.1,.28,-.42),proj(1.1,.28,.42),proj(-1.1,.28,.42)]);ctx.fillStyle=CD;ctx.fill();
      const body=[{x:-1.1,y:.28,z:-.42},{x:1.1,y:.28,z:-.42},{x:1.15,y:-.05,z:-.40},{x:.85,y:-.32,z:-.28},{x:-.85,y:-.32,z:-.28},{x:-1.15,y:-.05,z:-.40}].map(p=>proj(p.x,p.y,p.z));
      poly(body);const g=ctx.createLinearGradient(body[0].x,body[0].y,body[2].x,body[2].y);g.addColorStop(0,CD);g.addColorStop(.5,CC);g.addColorStop(1,CD);ctx.fillStyle=g;ctx.fill();
      poly([proj(-1.1,.28,.42),proj(-1.1,.28,-.42),proj(-1.15,-.05,-.40),proj(-.85,-.32,-.28),proj(-.85,-.32,.28),proj(-1.15,-.05,.40)]);ctx.fillStyle=Math.sin(angle)>0?"#0f5c42":CD;ctx.fill();
      poly([proj(1.1,.28,-.42),proj(1.1,.28,.42),proj(1.15,-.05,.40),proj(.85,-.32,.28),proj(.85,-.32,-.28),proj(1.15,-.05,-.40)]);ctx.fillStyle=Math.sin(angle)<0?"#0f5c42":CD;ctx.fill();
      poly([proj(-.85,-.32,-.28),proj(.85,-.32,-.28),proj(.85,-.32,.28),proj(-.85,-.32,.28)]);const rg=ctx.createLinearGradient(-80,0,80,0);rg.addColorStop(0,"#0d6e50");rg.addColorStop(.5,CC);rg.addColorStop(1,"#0d6e50");ctx.fillStyle=rg;ctx.fill();
      [[.85,-.32,-.28,.85,-.32,.28,1.15,-.05,.40,1.15,-.05,-.40],[-.85,-.32,-.28,-.85,-.32,.28,-1.15,-.05,.40,-1.15,-.05,-.40]].forEach(w=>{poly([proj(w[0],w[1],w[2]),proj(w[3],w[4],w[5]),proj(w[6],w[7],w[8]),proj(w[9],w[10],w[11])]);ctx.fillStyle=GC;ctx.fill();ctx.strokeStyle="rgba(255,255,255,0.25)";ctx.lineWidth=.5;ctx.stroke();});
      [{x:.72,z:-.44},{x:-.72,z:-.44},{x:.72,z:.44},{x:-.72,z:.44}].forEach(w=>{const p=proj(w.x,.28,w.z),r=11*p.s;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle="#111";ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,r*.5,0,Math.PI*2);ctx.fillStyle="#2a2a2a";ctx.fill();for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2+rot*2;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*r*.5,p.y+Math.sin(a)*r*.5);ctx.lineTo(p.x+Math.cos(a)*r*.9,p.y+Math.sin(a)*r*.9);ctx.strokeStyle="#555";ctx.lineWidth=1.2;ctx.stroke();}});
      [proj(1.12,0,-.3),proj(1.12,0,.3)].forEach(h=>{ctx.beginPath();ctx.ellipse(h.x,h.y,6*h.s,3.5*h.s,0,0,Math.PI*2);ctx.fillStyle="rgba(255,255,180,0.9)";ctx.fill();});
      [proj(-1.12,0,-.3),proj(-1.12,0,.3)].forEach(t=>{ctx.beginPath();ctx.ellipse(t.x,t.y,5*t.s,3*t.s,0,0,Math.PI*2);ctx.fillStyle="rgba(255,60,60,0.85)";ctx.fill();});
    }
    const animate=()=>{rot+=.008;drawCar(rot);animId=requestAnimationFrame(animate);};
    animate();
    return ()=>cancelAnimationFrame(animId);
  }, []);
  const parts = modelName.replace("Custom","").trim().split(" ");
  return React.createElement("div", { style:{ marginBottom:12, textAlign:"center" } },
    React.createElement("div", { ref:elRef, style:{ width:"100%", height:190, borderRadius:14, background:"rgba(200,230,215,0.3)", overflow:"hidden", border:"1px solid rgba(41,217,155,0.15)" } }),
    React.createElement("p", { style:{ margin:"6px 0 0", fontSize:13, color:"rgba(41,217,155,0.8)", fontWeight:500 } },
      parts[0], React.createElement("span", { style:{ color:"rgba(41,217,155,0.45)" } }, " " + parts.slice(1).join(" "))
    )
  );
}

function MapPicker({ label, initialPos, onConfirm, onClose }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerRef = useRef(null);
  const [pos, setPos] = useState(initialPos || { lat:12.5, lng:104.9 });
  const [placeName, setPlaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const reverseGeocode = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=en`);
      const d = await r.json();
      setPlaceName(d.display_name ? d.display_name.split(",").slice(0,3).join(", ").trim() : `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch { setPlaceName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
    setLoading(false);
  }, []);

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapInst.current) return;
    navigator.geolocation.getCurrentPosition(p => {
      const { latitude:lat, longitude:lng } = p.coords;
      mapInst.current.setView([lat,lng], 16);
      markerRef.current?.setLatLng([lat,lng]);
      setPos({ lat, lng });
      reverseGeocode(lat, lng);
    });
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current || !window.L) return;
    const L = window.L;
    const startPos = initialPos || { lat:12.5, lng:104.9 };
    const m = L.map(mapRef.current, { zoomControl:true, attributionControl:false, preferCanvas:true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom:19, subdomains:"abcd" }).addTo(m);
    m.setView([startPos.lat, startPos.lng], initialPos ? 15 : 7);
    setTimeout(() => m.invalidateSize(), 100);
    const icon = L.divIcon({ className:"", html:`<div style="width:36px;height:36px;border-radius:50%;background:#29D99B;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>`, iconSize:[36,36], iconAnchor:[18,18] });
    const mk = L.marker([startPos.lat, startPos.lng], { icon, draggable:true }).addTo(m);
    markerRef.current = mk;
    mk.on("dragend", e => { const {lat,lng}=e.target.getLatLng(); setPos({lat,lng}); reverseGeocode(lat,lng); });
    m.on("click", e => { const {lat,lng}=e.latlng; mk.setLatLng([lat,lng]); setPos({lat,lng}); reverseGeocode(lat,lng); });
    mapInst.current = m;
    reverseGeocode(startPos.lat, startPos.lng);
    return () => { if(mapInst.current){mapInst.current.remove();mapInst.current=null;} };
  }, [mapReady]);

  return React.createElement("div", { style:{ position:"fixed", inset:0, zIndex:3000, display:"flex", flexDirection:"column", background:"#f5f5f5", fontFamily:"-apple-system,sans-serif" } },
    React.createElement("div", { style:{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.97)", borderBottom:"1px solid #e0e0e0", flexShrink:0 } },
      React.createElement("button", { onClick:onClose, style:{ background:"#f0f0f0", border:"1px solid #ddd", borderRadius:10, padding:"8px 14px", color:"#333", cursor:"pointer", fontSize:13, fontWeight:600 } }, "← Back"),
      React.createElement("div", null,
        React.createElement("p", { style:{ margin:0, fontSize:14, fontWeight:600, color:"#111" } }, `Set ${label}`),
        React.createElement("p", { style:{ margin:0, fontSize:11, color:"#888" } }, "Tap map or drag pin to exact spot")
      ),
      React.createElement("button", { onClick:goToMyLocation, style:{ marginLeft:"auto", background:"#29D99B", border:"none", borderRadius:10, padding:"8px 14px", color:"#0a1530", cursor:"pointer", fontSize:13, fontWeight:700, flexShrink:0 } }, "◎ Me")
    ),
    React.createElement("div", {
      style:{ flex:1, position:"relative", minHeight:0 },
      ref: el => { if(el && !mapReady){ const d=document.createElement("div"); d.style.cssText="width:100%;height:100%;"; el.appendChild(d); mapRef.current=d; setMapReady(true); } }
    }),
    React.createElement("div", { style:{ padding:"14px 16px 24px", background:"rgba(255,255,255,0.97)", borderTop:"1px solid #e0e0e0", flexShrink:0 } },
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10, background:"#f5f5f5", borderRadius:12, padding:"10px 14px", marginBottom:12, minHeight:46, border:"1px solid #e0e0e0" } },
        React.createElement("span", { style:{ fontSize:20 } }, "📍"),
        React.createElement("p", { style:{ margin:0, fontSize:13, color: loading?"#29D99B":"#111", flex:1, lineHeight:1.4 } }, loading ? "Finding location..." : placeName || "Tap anywhere on the map")
      ),
      React.createElement("button", {
        onClick: () => placeName && !loading && onConfirm({ lat:pos.lat, lng:pos.lng, label:placeName }),
        style:{ width:"100%", padding:"14px", background:placeName&&!loading?"#29D99B":"rgba(41,217,155,0.3)", border:"none", borderRadius:14, color:placeName&&!loading?"#0a1530":"rgba(0,0,0,0.35)", fontWeight:700, fontSize:15, cursor:placeName&&!loading?"pointer":"default" }
      }, loading ? "Locating..." : placeName ? `Confirm ${label}` : "Tap the map first")
    )
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
    const close = e => { if(wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const doSearch = q => {
    setQuery(q); clearTimeout(timer.current);
    if(q.length < 2){ setResults([]); setOpen(false); return; }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&bbox=102.3,9.5,107.7,14.7`);
        const data = await res.json();
        setResults(data.features || []);
        setOpen((data.features||[]).length > 0);
      } catch { setResults([]); setOpen(false); }
      setBusy(false);
    }, 400);
  };

  const pick = f => {
    const p = f.properties;
    const name = [p.name, p.street, p.city||p.town||p.village, p.state].filter(Boolean).join(", ");
    setQuery(name); setOpen(false);
    onChange({ label:name, lat:f.geometry.coordinates[1], lng:f.geometry.coordinates[0] });
  };

  return React.createElement("div", { ref:wrapRef, style:{ position:"relative", marginBottom:10 } },
    React.createElement("p", { style:{ margin:"0 0 5px", fontSize:12, color:txt2, fontWeight:500 } }, label),
    React.createElement("div", { style:{ display:"flex", gap:8 } },
      React.createElement("div", { style:{ position:"relative", flex:1 } },
        React.createElement("input", {
          value: query, onChange: e=>doSearch(e.target.value), onFocus: ()=>results.length>0&&setOpen(true),
          placeholder,
          style:{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.09)", border:`1px solid ${cardBorder}`, borderRadius:12, padding:"11px 36px 11px 14px", color:txt, fontSize:14, outline:"none" }
        }),
        busy
          ? React.createElement("div", { style:{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, border:"2px solid #29D99B", borderTopColor:"transparent", borderRadius:"50%", animation:"ev-spin 0.6s linear infinite" } })
          : query ? React.createElement("span", { onClick:()=>{setQuery("");onChange(null);setResults([]);setOpen(false);}, style:{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:txt2, cursor:"pointer", fontSize:18, lineHeight:1 } }, "×") : null
      ),
      React.createElement("button", { onClick:onMapPick, title:"Pick on map", style:{ width:46, background:"rgba(41,217,155,0.12)", border:"1px solid rgba(41,217,155,0.35)", borderRadius:12, color:"#29D99B", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 } }, "📍")
    ),
    open && results.length > 0 && React.createElement("div", {
      style:{ position:"absolute", top:"calc(100% + 4px)", left:0, right:56, zIndex:999, background: dark?"#111c30":"#fff", border:`1px solid ${cardBorder}`, borderRadius:14, maxHeight:220, overflowY:"auto", overflowX:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.3)", WebkitOverflowScrolling:"touch" }
    }, results.map((f,i) => {
      const p = f.properties, name = p.name||"", sub=[p.street,p.city||p.town||p.village,p.state,p.country].filter(Boolean).join(", ");
      return React.createElement("div", {
        key:i, onClick:()=>pick(f),
        style:{ padding:"11px 14px", cursor:"pointer", borderBottom:i<results.length-1?`1px solid ${cardBorder}`:"none", display:"flex", gap:10, alignItems:"flex-start" },
        onMouseEnter:e=>e.currentTarget.style.background="rgba(41,217,155,0.1)",
        onMouseLeave:e=>e.currentTarget.style.background="transparent"
      },
        React.createElement("span", { style:{ fontSize:15, flexShrink:0, marginTop:1 } }, "📍"),
        React.createElement("div", { style:{ overflow:"hidden" } },
          React.createElement("div", { style:{ fontWeight:500, fontSize:13, color:txt } }, name),
          sub && React.createElement("div", { style:{ fontSize:11, color:txt2, marginTop:2, lineHeight:1.4 } }, sub)
        )
      );
    }))
  );
}

function RouteMap({ departure, destination, route, chargerStops }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layersRef = useRef([]);
  const locMarkerRef = useRef(null);

  useEffect(() => {
    if(mapInst.current || !mapRef.current || !window.L) return;
    const L = window.L;
    const m = L.map(mapRef.current, { zoomControl:false, attributionControl:false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom:19, subdomains:"abcd" }).addTo(m);
    L.control.zoom({ position:"topright" }).addTo(m);
    m.setView([12.5,104.9], 6);
    mapInst.current = m;
  }, []);

  useEffect(() => {
    const m = mapInst.current; if(!m || !window.L) return;
    const L = window.L;
    layersRef.current.forEach(l=>{try{m.removeLayer(l);}catch{}});
    layersRef.current = [];
    const bounds = [];
    const mkIcon = (bg,lbl) => L.divIcon({ className:"", html:`<div style="background:${bg};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);color:#0a1530">${lbl}</div>`, iconSize:[32,32], iconAnchor:[16,16] });
    if(departure){ const mk=L.marker([departure.lat,departure.lng],{icon:mkIcon("#29D99B","A")}).addTo(m); mk.bindPopup(`<b>Departure</b><br>${departure.label}`); layersRef.current.push(mk); bounds.push([departure.lat,departure.lng]); }
    if(destination){ const mk=L.marker([destination.lat,destination.lng],{icon:mkIcon("#E24B4A","B")}).addTo(m); mk.bindPopup(`<b>Destination</b><br>${destination.label}`); layersRef.current.push(mk); bounds.push([destination.lat,destination.lng]); }
    if(route.length>0){ const pl=L.polyline(route,{color:"#29D99B",weight:5,opacity:.85}).addTo(m); layersRef.current.push(pl); }
    chargerStops.forEach(c=>{ const mk=L.marker([c.lat,c.lng],{icon:mkIcon("#EF9F27","⚡")}).addTo(m); mk.bindPopup(`<b>${c.name}</b><br>${c.type} · ${c.kw}kW`); layersRef.current.push(mk); bounds.push([c.lat,c.lng]); });
    if(bounds.length>=2) m.fitBounds(bounds,{padding:[44,44]});
    else if(bounds.length===1) m.setView(bounds[0],13);
  }, [departure,destination,route,chargerStops]);

  const goToMyLocation = () => {
    if(!navigator.geolocation || !mapInst.current) return;
    navigator.geolocation.getCurrentPosition(p => {
      const { latitude:lat, longitude:lng } = p.coords;
      mapInst.current.setView([lat,lng], 14);
      if(locMarkerRef.current) locMarkerRef.current.setLatLng([lat,lng]);
      else {
        const L = window.L;
        const icon = L.divIcon({ className:"", html:`<div style="width:16px;height:16px;background:#2979ff;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(41,121,255,0.25)"></div>`, iconSize:[16,16], iconAnchor:[8,8] });
        locMarkerRef.current = L.marker([lat,lng],{icon}).addTo(mapInst.current);
      }
    });
  };

  return React.createElement("div", { style:{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(0,0,0,0.1)", marginBottom:12, position:"relative" } },
    React.createElement("div", { ref:mapRef, style:{ height:240, width:"100%" } }),
    React.createElement("button", { onClick:goToMyLocation, style:{ position:"absolute", bottom:12, right:12, zIndex:500, background:"white", border:"1px solid #ddd", borderRadius:10, padding:"7px 10px", fontSize:18, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.15)", lineHeight:1 } }, "◎"),
    React.createElement("div", { style:{ position:"absolute", bottom:12, left:12, fontSize:10, color:"rgba(0,0,0,0.4)", background:"rgba(255,255,255,0.8)", padding:"3px 8px", borderRadius:6 } }, "© OpenStreetMap")
  );
}

function CustomCarLookup({ txt, txt2, cardBorder, onResult, customCap, customRange, setCustomCap, setCustomRange }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const inp = { width:"100%", background:"rgba(255,255,255,0.08)", border:`1px solid ${cardBorder}`, borderRadius:10, padding:"9px 12px", color:txt, fontSize:14, boxSizing:"border-box", outline:"none" };

  const search = async () => {
    if(!query.trim()) return;
    setLoading(true); setError(""); setResult(null); setApplied(false);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:300, messages:[{ role:"user", content:`EV database. User searches: "${query}". Return ONLY JSON: {"found":true,"modelName":"full name with year","batteryKwh":number,"rangeKm":number,"note":"one sentence"}. If not EV: {"found":false}. Range=WLTP km.` }] }) });
      const data = await res.json();
      const parsed = JSON.parse(data.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim());
      if(parsed.found) setResult(parsed); else setError("No EV found. Try another model.");
    } catch { setError("Lookup failed. Enter specs manually."); }
    setLoading(false);
  };

  return React.createElement("div", { style:{ marginTop:14 } },
    React.createElement("p", { style:{ color:txt2, fontSize:12, margin:"0 0 6px" } }, "Search your car model"),
    React.createElement("div", { style:{ display:"flex", gap:8, marginBottom:10 } },
      React.createElement("input", { value:query, onChange:e=>setQuery(e.target.value), onKeyDown:e=>e.key==="Enter"&&search(), placeholder:"e.g. BYD Han 2023...", style:{ ...inp, flex:1 } }),
      React.createElement("button", { onClick:search, disabled:loading, style:{ padding:"9px 14px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:700, fontSize:13, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1, flexShrink:0 } }, loading?"...":"Search")
    ),
    loading && React.createElement("p", { style:{ fontSize:13, color:"#29D99B", margin:"0 0 8px" } }, "Looking up EV specs..."),
    error && React.createElement("p", { style:{ fontSize:12, color:"#E24B4A", margin:"0 0 8px" } }, error),
    result && React.createElement("div", { style:{ background:"rgba(41,217,155,0.08)", border:`1px solid ${applied?"#29D99B":"rgba(41,217,155,0.3)"}`, borderRadius:14, padding:"12px 14px", marginBottom:10 } },
      React.createElement("p", { style:{ margin:"0 0 2px", fontWeight:700, fontSize:14, color:txt } }, result.modelName),
      React.createElement("p", { style:{ margin:"0 0 10px", fontSize:12, color:txt2 } }, result.note),
      React.createElement("div", { style:{ display:"flex", gap:10, marginBottom:10 } },
        [{v:result.batteryKwh,u:"kWh"},{v:result.rangeKm,u:"km range"}].map(x=>
          React.createElement("div", { key:x.u, style:{ flex:1, background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"8px", textAlign:"center" } },
            React.createElement("p", { style:{ margin:0, fontSize:18, fontWeight:700, color:"#29D99B" } }, x.v),
            React.createElement("p", { style:{ margin:0, fontSize:11, color:txt2 } }, x.u)
          )
        )
      ),
      React.createElement("button", { onClick:()=>{onResult(result.batteryKwh,result.rangeKm,result.modelName);setApplied(true);}, style:{ width:"100%", padding:"9px", background:applied?"rgba(41,217,155,0.15)":"#29D99B", border:applied?"1px solid #29D99B":"none", borderRadius:10, color:applied?"#29D99B":"#0a1530", fontWeight:700, fontSize:13, cursor:"pointer" } }, applied?"Specs applied ✓":"Use these specs")
    ),
    React.createElement("p", { style:{ color:txt2, fontSize:11, margin:"8px 0 5px" } }, "Or enter manually"),
    React.createElement("label", { style:{ color:txt2, fontSize:12 } }, "Battery capacity (kWh)"),
    React.createElement("input", { type:"number", value:customCap, onChange:e=>setCustomCap(+e.target.value), style:{ ...inp, marginBottom:8, marginTop:4 } }),
    React.createElement("label", { style:{ color:txt2, fontSize:12 } }, "Full range (km)"),
    React.createElement("input", { type:"number", value:customRange, onChange:e=>setCustomRange(+e.target.value), style:{ ...inp, marginTop:4 } })
  );
}

function App() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("trip");
  const [profile, setProfile] = useState(() => { try{ const s=localStorage.getItem("ev_profile"); return s?JSON.parse(s):null; }catch{ return null; } });
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
  const [liveChargers, setLiveChargers] = useState([]);
  const [chargersLoading, setChargersLoading] = useState(false);

  const saveProfile = p => { setProfile(p); try{ localStorage.setItem("ev_profile",JSON.stringify(p)); }catch{} };

  useEffect(() => {
    if(!departure || !destination){ setRouteCoords([]); setTripDist(0); setLiveChargers([]); return; }
    setRouteLoading(true);
    fetch(`https://router.project-osrm.org/route/v1/driving/${departure.lng},${departure.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`)
      .then(r=>r.json()).then(d=>{ if(d.routes?.[0]){ setRouteCoords(d.routes[0].geometry.coordinates.map(c=>[c[1],c[0]])); setTripDist(Math.round(d.routes[0].distance/1000)); } })
      .catch(()=>{}).finally(()=>setRouteLoading(false));
  },[departure,destination]);

  useEffect(() => {
    if(!departure || !destination) return;
    const minLat=Math.min(departure.lat,destination.lat)-0.3, maxLat=Math.max(departure.lat,destination.lat)+0.3;
    const minLng=Math.min(departure.lng,destination.lng)-0.3, maxLng=Math.max(departure.lng,destination.lng)+0.3;
    setChargersLoading(true);
    const q=`[out:json][timeout:25];node["amenity"="charging_station"](${minLat},${minLng},${maxLat},${maxLng});out body;`;
    fetch("https://overpass-api.de/api/interpreter",{ method:"POST", body:"data="+encodeURIComponent(q) })
      .then(r=>r.json()).then(data=>{ setLiveChargers((data.elements||[]).map((el,i)=>({ id:el.id, name:el.tags?.name||el.tags?.operator||`EV Charger #${i+1}`, lat:el.lat, lng:el.lon, type:el.tags?.["socket:type2"]?"AC Type 2":el.tags?.["socket:chademo"]?"DC CHAdeMO":el.tags?.["socket:type2_combo"]?"DC CCS":"AC/DC", kw:parseInt(el.tags?.["capacity:kw"]||el.tags?.maxpower||"22")||22, price:0.15, source:"google", network:el.tags?.network||el.tags?.operator||"" }))); })
      .catch(()=>setLiveChargers([])).finally(()=>setChargersLoading(false));
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
  const stopsNeeded = liveChargers.filter(c=>isAlongRoute({lat:c.lat,lng:c.lng},routeCoords));
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
  const totalCost = stopsNeeded.length>0?stopsNeeded.reduce((s,c)=>s+(totalKwh/stopsNeeded.length*c.price),0):0;

  if(mapPicker) return React.createElement(MapPicker,{ label:mapPicker==="departure"?"Departure":"Destination", initialPos:mapPicker==="departure"?(departure||{lat:11.562,lng:104.916}):(destination||{lat:12.5,lng:104.9}), onConfirm:loc=>{mapPicker==="departure"?setDeparture(loc):setDestination(loc);setMapPicker(null);}, onClose:()=>setMapPicker(null) });

  if(!profile) return React.createElement("div", { style:{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem 1rem", fontFamily:"-apple-system,sans-serif" } },
    React.createElement("div", { style:{ width:"min(400px,100%)" } },
      React.createElement("div", { style:{ textAlign:"center", marginBottom:"1.5rem" } },
        React.createElement("div", { style:{ fontSize:38, marginBottom:8 } }, "⚡"),
        React.createElement("h1", { style:{ color:txt, fontSize:24, fontWeight:600, margin:"0 0 6px" } }, "EV Trip Planner"),
        React.createElement("p", { style:{ color:txt2, fontSize:14, margin:0 } }, "Cambodia • One-time setup")
      ),
      React.createElement("div", { style:glass },
        setupStep===0 && React.createElement(React.Fragment, null,
          React.createElement("p", { style:{ color:txt, fontWeight:500, marginBottom:12 } }, "Select your EV"),
          React.createElement("div", { style:{ maxHeight:340, overflowY:"auto" } },
            MODELS.map(m => React.createElement("div", { key:m.name, onClick:()=>setSetupModel(m), style:{ padding:"10px 14px", borderRadius:12, marginBottom:7, cursor:"pointer", background:setupModel.name===m.name?"rgba(41,217,155,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${setupModel.name===m.name?"#29D99B":cardBorder}`, color:txt, fontSize:14, display:"flex", justifyContent:"space-between" } },
              React.createElement("span", null, m.name),
              React.createElement("span", { style:{ color:txt2, fontSize:12 } }, `${m.capacity} kWh · ${m.range} km`)
            ))
          ),
          setupModel.name==="Custom" && React.createElement(CustomCarLookup,{ txt, txt2, cardBorder, onResult:(cap,range,name)=>{setCustomCap(cap);setCustomRange(range);setCustomCarName(name);}, customCap, customRange, setCustomCap, setCustomRange }),
          React.createElement("button", { onClick:()=>setSetupStep(1), style:{ width:"100%", marginTop:16, padding:"13px", background:"#29D99B", border:"none", borderRadius:13, color:"#0a1530", fontWeight:700, fontSize:15, cursor:"pointer" } }, "Continue →")
        ),
        setupStep===1 && React.createElement(React.Fragment, null,
          React.createElement("p", { style:{ color:txt, fontWeight:500, marginBottom:12 } }, "Confirm your EV"),
          React.createElement(Car3DView,{ modelName:setupModel.name==="Custom"?(customCarName||"Your EV"):setupModel.name, dark }),
          React.createElement("div", { style:{ background:"rgba(41,217,155,0.1)", border:"1px solid rgba(41,217,155,0.3)", borderRadius:12, padding:"12px 14px", marginBottom:14 } },
            React.createElement("p", { style:{ color:"#29D99B", fontWeight:700, margin:"0 0 3px", fontSize:15 } }, setupModel.name==="Custom"?(customCarName||"Custom EV"):setupModel.name),
            React.createElement("p", { style:{ color:txt2, fontSize:13, margin:0 } }, `${capacity} kWh · ${maxRange} km full range`)
          ),
          React.createElement("button", { onClick:()=>saveProfile(setupModel), style:{ width:"100%", padding:"13px", background:"#29D99B", border:"none", borderRadius:13, color:"#0a1530", fontWeight:700, fontSize:15, cursor:"pointer" } }, "Save & Start Planning"),
          React.createElement("button", { onClick:()=>setSetupStep(0), style:{ width:"100%", marginTop:9, padding:"11px", background:"none", border:`1px solid ${cardBorder}`, borderRadius:13, color:txt2, fontSize:14, cursor:"pointer" } }, "← Back")
        )
      )
    )
  );

  const tripSection = React.createElement("div", { style:{ padding:"0.5rem 1.1rem" } },
    React.createElement("div", { style:{ ...glass, padding:"9px 14px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" } },
      React.createElement("div", null, React.createElement("p", { style:{ margin:0, fontSize:11, color:txt2 } }, "Your EV"), React.createElement("p", { style:{ margin:0, fontSize:14, fontWeight:500 } }, profile.name)),
      React.createElement("span", { style:{ fontSize:12, color:"#29D99B", cursor:"pointer" }, onClick:()=>setTab("settings") }, "Edit ›")
    ),
    React.createElement("div", { style:{ ...glass, marginBottom:10 } },
      React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", marginBottom:7 } },
        React.createElement("p", { style:{ margin:0, fontSize:13, fontWeight:500 } }, "Current charge ", React.createElement("span", { style:{ color:"#E24B4A", fontSize:11 } }, "*required")),
        React.createElement("span", { style:{ fontSize:18, fontWeight:700, color:chargePct>50?"#29D99B":chargePct>20?"#EF9F27":"#E24B4A" } }, `${chargePct}%`)
      ),
      React.createElement("input", { type:"range", min:5, max:100, value:chargePct, step:1, onChange:e=>setChargePct(+e.target.value), style:{ width:"100%", accentColor:"#29D99B" } }),
      React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", marginTop:4 } },
        React.createElement("span", { style:{ fontSize:11, color:txt2 } }, "5%"),
        React.createElement("span", { style:{ fontSize:12, color:txt2 } }, "Range: ", React.createElement("b", { style:{ color:txt } }, `${currentRange} km`)),
        React.createElement("span", { style:{ fontSize:11, color:txt2 } }, "100%")
      )
    ),
    React.createElement("div", { style:{ ...glass, marginBottom:10 } },
      React.createElement("p", { style:{ margin:"0 0 12px", fontSize:13, fontWeight:600 } }, "Plan your route"),
      React.createElement(PlaceSearch,{ label:"Departure", value:departure, onChange:setDeparture, onMapPick:()=>setMapPicker("departure"), dark, txt, txt2, cardBorder, placeholder:"Type street, landmark or tap 📍" }),
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:8, margin:"0 0 2px", paddingLeft:4 } },
        React.createElement("div", { style:{ width:2, height:14, background:"rgba(41,217,155,0.25)", borderRadius:2, marginLeft:5 } }),
        React.createElement("button", { onClick:()=>{const t=departure;setDeparture(destination);setDestination(t);}, style:{ marginLeft:"auto", background:"rgba(255,255,255,0.07)", border:`1px solid ${cardBorder}`, borderRadius:8, padding:"3px 10px", color:txt2, fontSize:12, cursor:"pointer" } }, "⇅ swap")
      ),
      React.createElement(PlaceSearch,{ label:"Destination", value:destination, onChange:setDestination, onMapPick:()=>setMapPicker("destination"), dark, txt, txt2, cardBorder, placeholder:"Type street, landmark or tap 📍" }),
      (!departure||!destination) && React.createElement("div", { style:{ marginTop:10 } },
        React.createElement("p", { style:{ margin:"0 0 6px", fontSize:11, color:txt2 } }, "Popular destinations"),
        React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:6 } },
          POPULAR.map(p=>React.createElement("button",{ key:p.label, onClick:()=>{if(!departure)setDeparture(p);else if(!destination)setDestination(p);}, style:{ padding:"5px 12px", background:"rgba(255,255,255,0.06)", border:`1px solid ${cardBorder}`, borderRadius:20, color:txt, fontSize:12, cursor:"pointer" } }, p.label))
        )
      ),
      routeLoading && React.createElement("p", { style:{ margin:"10px 0 0", fontSize:12, color:"#29D99B" } }, "⏳ Calculating route..."),
      chargersLoading && React.createElement("p", { style:{ margin:"4px 0 0", fontSize:12, color:"#EF9F27" } }, "🔍 Finding charging stations..."),
      tripDist>0 && !routeLoading && React.createElement("div", { style:{ marginTop:10, display:"flex", gap:8 } },
        React.createElement("div", { style:{ flex:1, background:"rgba(41,217,155,0.08)", borderRadius:10, padding:"8px 12px", textAlign:"center" } }, React.createElement("p", { style:{ margin:0, fontSize:16, fontWeight:700, color:"#29D99B" } }, `${tripDist} km`), React.createElement("p", { style:{ margin:0, fontSize:11, color:txt2 } }, "driving distance")),
        React.createElement("div", { style:{ flex:1, background:"rgba(239,159,39,0.08)", borderRadius:10, padding:"8px 12px", textAlign:"center" } }, React.createElement("p", { style:{ margin:0, fontSize:16, fontWeight:700, color:"#EF9F27" } }, stopsNeeded.length), React.createElement("p", { style:{ margin:0, fontSize:11, color:txt2 } }, "charging stops"))
      ),
      departure && destination && !routeLoading && React.createElement("button", { onClick:()=>setTab("stops"), style:{ width:"100%", marginTop:12, padding:"13px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:15, cursor:"pointer" } }, "View Stops & Plan →"),
      departure && !destination && React.createElement("p", { style:{ margin:"10px 0 0", fontSize:12, color:txt2, textAlign:"center" } }, "Now set your destination ↑"),
      !departure && destination && React.createElement("p", { style:{ margin:"10px 0 0", fontSize:12, color:txt2, textAlign:"center" } }, "Now set your departure ↑")
    ),
    (departure||destination) && React.createElement(RouteMap,{ departure, destination, route:routeCoords, chargerStops:stopsNeeded }),
    tripDist>0 && React.createElement("div", { style:{ ...glass, background:aBg[advisorState], border:`1px solid ${aClr[advisorState]}55`, marginBottom:10 } },
      React.createElement("div", { style:{ display:"flex", alignItems:"flex-start", gap:10 } },
        React.createElement("div", { style:{ width:10, height:10, borderRadius:"50%", background:aClr[advisorState], flexShrink:0, marginTop:4 } }),
        React.createElement("div", null,
          React.createElement("p", { style:{ margin:0, fontWeight:700, fontSize:15, color:aClr[advisorState] } }, advisorMsg),
          React.createElement("p", { style:{ margin:"4px 0 0", fontSize:12, color:txt2, lineHeight:1.6 } }, advisorSub)
        )
      )
    )
  );

  const stopsSection = React.createElement("div", { style:{ padding:"0.75rem 1.1rem" } },
    !departure||!destination
      ? React.createElement("div", { style:{ ...glass, textAlign:"center", padding:"2rem" } }, React.createElement("p", { style:{ color:txt2 } }, "Set a route first."), React.createElement("button", { onClick:()=>setTab("trip"), style:{ marginTop:8, padding:"8px 20px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" } }, "Plan Route ↗"))
      : React.createElement(React.Fragment, null,
          React.createElement("p", { style:{ fontSize:12, color:txt2, marginBottom:12 } }, `${departure.label} → ${destination.label} · ${tripDist} km`),
          chargersLoading && React.createElement("div", { style:{ ...glass, textAlign:"center", padding:"1.5rem" } }, React.createElement("p", { style:{ color:"#EF9F27" } }, "🔍 Searching real charging stations...")),
          !chargersLoading && stopsNeeded.length===0 && React.createElement("div", { style:{ ...glass, textAlign:"center", padding:"1.5rem" } },
            React.createElement("p", { style:{ color:"#29D99B", fontWeight:600, fontSize:15 } }, "No public chargers found along this route"),
            React.createElement("p", { style:{ color:txt2, fontSize:13, marginTop:4 } }, "Check ", React.createElement("span", { style:{ color:"#29D99B", cursor:"pointer", textDecoration:"underline" }, onClick:()=>window.open("https://t.me/evstationcambodia","_blank") }, "@evstationcambodia"), " on Telegram for community stops.")
          ),
          stopsNeeded.map(c=>React.createElement("div", { key:c.id, style:{ ...glass, marginBottom:10 } },
            React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" } },
              React.createElement("div", { style:{ flex:1 } },
                React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:8, marginBottom:4 } }, React.createElement("p", { style:{ margin:0, fontWeight:600, fontSize:14 } }, c.name), React.createElement(Badge,{ src:c.source })),
                React.createElement("p", { style:{ margin:0, fontSize:12, color:txt2 } }, `${c.type} · ${c.kw} kW${c.network?" · "+c.network:""}`)
              ),
              React.createElement("p", { style:{ margin:0, fontWeight:700, color:"#29D99B", fontSize:14 } }, `$${c.price}/kWh`)
            )
          )),
          React.createElement("div", { style:{ ...glass, marginTop:4, background:"rgba(41,217,155,0.05)", border:"1px solid rgba(41,217,155,0.2)" } },
            React.createElement("p", { style:{ margin:0, fontSize:12, color:txt2 } }, "Also check community reports on"),
            React.createElement("p", { style:{ margin:"4px 0 0", fontSize:13, color:"#29D99B", cursor:"pointer", fontWeight:600 }, onClick:()=>window.open("https://t.me/evstationcambodia","_blank") }, "⚡ @evstationcambodia on Telegram ↗")
          ),
          React.createElement("button", { onClick:()=>setTab("cost"), style:{ width:"100%", padding:"13px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:15, cursor:"pointer", marginTop:10 } }, "See Cost Estimate →")
        )
  );

  const costSection = React.createElement("div", { style:{ padding:"0.75rem 1.1rem" } },
    tripDist===0
      ? React.createElement("div", { style:{ ...glass, textAlign:"center", padding:"2rem" } }, React.createElement("p", { style:{ color:txt2 } }, "Set a route first."), React.createElement("button", { onClick:()=>setTab("trip"), style:{ marginTop:8, padding:"8px 20px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" } }, "Plan Route ↗"))
      : React.createElement(React.Fragment, null,
          React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 } },
            [{label:"Distance",value:`${tripDist} km`},{label:"Stops",value:stopsNeeded.length},{label:"Energy needed",value:`${totalKwh.toFixed(1)} kWh`},{label:"Total cost",value:`$${totalCost.toFixed(2)}`}].map(m=>
              React.createElement("div", { key:m.label, style:{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"1rem", border:`1px solid ${cardBorder}` } },
                React.createElement("p", { style:{ margin:"0 0 4px", fontSize:11, color:txt2 } }, m.label),
                React.createElement("p", { style:{ margin:0, fontSize:22, fontWeight:600 } }, m.value)
              )
            )
          ),
          stopsNeeded.map(c=>{ const kwh=totalKwh/Math.max(stopsNeeded.length,1),cost=kwh*c.price; return React.createElement("div",{ key:c.id, style:{ ...glass, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" } }, React.createElement("div",null,React.createElement("p",{style:{margin:0,fontSize:13,fontWeight:500}},c.name),React.createElement("p",{style:{margin:0,fontSize:11,color:txt2}},`${kwh.toFixed(1)} kWh @ $${c.price}/kWh`)),React.createElement("p",{style:{margin:0,fontWeight:700,color:"#29D99B"}},`$${cost.toFixed(2)}`)); }),
          React.createElement("button", { onClick:()=>setTab("summary"), style:{ width:"100%", padding:"13px", background:"#29D99B", border:"none", borderRadius:14, color:"#0a1530", fontWeight:700, fontSize:15, cursor:"pointer", marginTop:4 } }, "See Trip Summary →")
        )
  );

  const summarySection = React.createElement("div", { style:{ padding:"0.75rem 1.1rem" } },
    tripDist===0
      ? React.createElement("div", { style:{ ...glass, textAlign:"center", padding:"2rem" } }, React.createElement("p", { style:{ color:txt2 } }, "Plan a route first."), React.createElement("button", { onClick:()=>setTab("trip"), style:{ marginTop:8, padding:"8px 20px", background:"#29D99B", border:"none", borderRadius:10, color:"#0a1530", fontWeight:600, cursor:"pointer" } }, "Plan Route ↗"))
      : React.createElement(React.Fragment, null,
          React.createElement("div", { style:{ ...glass, marginBottom:12, border:"1px solid rgba(41,217,155,0.3)", background:"rgba(41,217,155,0.05)" } },
            React.createElement("p", { style:{ margin:"0 0 3px", fontSize:11, color:txt2 } }, "Trip summary"),
            React.createElement("p", { style:{ margin:"0 0 2px", fontSize:14, fontWeight:600 } }, departure?.label),
            React.createElement("p", { style:{ margin:"0 0 12px", fontSize:15, fontWeight:700, color:"#29D99B" } }, `→ ${destination?.label}`),
            React.createElement("div", { style:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 } },
              [{label:"Distance",val:`${tripDist} km`},{label:"Stops",val:stopsNeeded.length},{label:"Est. cost",val:`$${totalCost.toFixed(2)}`}].map(i=>
                React.createElement("div", { key:i.label, style:{ textAlign:"center" } },
                  React.createElement("p", { style:{ margin:0, fontSize:18, fontWeight:700, color:"#29D99B" } }, i.val),
                  React.createElement("p", { style:{ margin:0, fontSize:11, color:txt2 } }, i.label)
                )
              )
            )
          ),
          React.createElement("div", { style:{ ...glass, marginBottom:10 } },
            React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:8 } },
              React.createElement("div", { style:{ width:10, height:10, borderRadius:"50%", background:aClr[advisorState] } }),
              React.createElement("p", { style:{ margin:0, color:aClr[advisorState], fontWeight:600, fontSize:14 } }, advisorMsg)
            ),
            React.createElement("p", { style:{ margin:"4px 0 0", fontSize:12, color:txt2 } }, advisorSub)
          ),
          React.createElement("button", { onClick:()=>{ const trip={departure:departure?.label,destination:destination?.label,dist:tripDist,stops:stopsNeeded.length,cost:totalCost.toFixed(2),date:new Date().toLocaleDateString()}; try{const saved=JSON.parse(localStorage.getItem("ev_trips")||"[]");saved.unshift(trip);localStorage.setItem("ev_trips",JSON.stringify(saved.slice(0,10)));}catch{} alert("Trip saved!"); }, style:{ width:"100%", padding:"13px", background:"rgba(41,217,155,0.15)", border:"1px solid #29D99B", borderRadius:14, color:"#29D99B", fontWeight:700, fontSize:14, cursor:"pointer" } }, "💾 Save Trip")
        )
  );

  const settingsSection = React.createElement("div", { style:{ padding:"0.75rem 1.1rem" } },
    React.createElement("p", { style:{ fontWeight:600, marginBottom:12 } }, "EV Profile"),
    React.createElement("div", { style:{ ...glass, marginBottom:12 } },
      MODELS.map(m=>React.createElement("div", { key:m.name, onClick:()=>saveProfile(m), style:{ padding:"9px 12px", borderRadius:11, marginBottom:6, cursor:"pointer", fontSize:13, background:profile.name===m.name?"rgba(41,217,155,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${profile.name===m.name?"#29D99B":cardBorder}`, display:"flex", justifyContent:"space-between", color:txt } },
        React.createElement("span", null, m.name), React.createElement("span", { style:{ color:txt2 } }, `${m.capacity} kWh · ${m.range} km`)
      ))
    ),
    React.createElement("p", { style:{ fontSize:12, color:txt2 } }, "Profile is saved on your device.")
  );

  return React.createElement("div", { style:{ minHeight:"100vh", background:bg, fontFamily:"-apple-system,sans-serif", color:txt } },
    React.createElement("style", null, "@keyframes ev-spin{to{transform:translateY(-50%) rotate(360deg)}}"),
    React.createElement("div", { style:{ maxWidth:430, margin:"0 auto", paddingBottom:96 } },
      React.createElement("div", { style:{ padding:"1.25rem 1.1rem 0.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" } },
        React.createElement("div", null, React.createElement("h1", { style:{ margin:0, fontSize:20, fontWeight:600 } }, "⚡ EV Trip Planner"), React.createElement("p", { style:{ margin:0, fontSize:12, color:txt2 } }, "Cambodia")),
        React.createElement("button", { onClick:()=>setDark(!dark), style:{ background:"rgba(255,255,255,0.08)", border:`1px solid ${cardBorder}`, borderRadius:20, padding:"6px 14px", color:txt, fontSize:12, cursor:"pointer" } }, dark?"☀ Light":"☾ Dark")
      ),
      tab==="trip" && tripSection,
      tab==="stops" && stopsSection,
      tab==="cost" && costSection,
      tab==="summary" && summarySection,
      tab==="settings" && settingsSection
    ),
    React.createElement(BottomNav, { tab, setTab })
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
