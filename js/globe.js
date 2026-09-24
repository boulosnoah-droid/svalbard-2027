/* ==========================================================================
   Le trajet : globe 3D (dessiné sur <canvas>, fluide) qui suit le voyage
   Bulle → Zurich (train) → Oslo → Tromsø → Longyearbyen (avion),
   puis une loupe sur l'Isfjorden pour le bateau jusqu'au glacier Esmarkbreen.
   Trajet indicatif. Piloté par le défilement (voir main.js : setProgress).
   ========================================================================== */
window.SvalbardGlobe = (() => {
  const canvas = document.querySelector(".globe");
  if (!canvas || typeof d3 === "undefined" || !d3.geoOrthographic || typeof topojson === "undefined") return null;
  const ctx = canvas.getContext("2d");
  const S = 800; // repère interne 800 × 800

  const P = {
    bulle: [7.06, 46.62], zrh: [8.56, 47.46], osl: [11.1, 60.19], tos: [18.92, 69.68],
    lyr: [15.47, 78.25], port: [15.62, 78.228], esm: [14.33, 78.305],
  };
  const SEGS = [
    { mode: "train", pts: [P.bulle, [7.16, 46.8], [7.44, 46.95], [7.9, 47.15], [8.3, 47.35], [8.54, 47.38], P.zrh], t0: 0.03, t1: 0.13 },
    { mode: "plane", pts: [P.zrh, P.osl], t0: 0.22, t1: 0.38 },
    { mode: "plane", pts: [P.osl, P.tos], t0: 0.42, t1: 0.54 },
    { mode: "plane", pts: [P.tos, P.lyr], t0: 0.57, t1: 0.7 },
    { mode: "boat", pts: [P.port, [15.45, 78.255], [15.1, 78.275], [14.75, 78.285], [14.45, 78.295], P.esm], t0: 0.84, t1: 0.97 },
  ];
  const STOPS = [[P.bulle, "Bulle", 0], [P.zrh, "Zurich", 0.13], [P.osl, "Oslo", 0.38], [P.tos, "Tromsø", 0.54], [P.lyr, "Longyearbyen", 0.7]];
  // caméra : [progression, longitude, latitude, zoom] — 380 = globe entier
  const CAM = [
    [0, 7.6, 46.9, 2100], [0.13, 8.1, 47.2, 1900], [0.22, 10, 54, 380], [0.38, 11, 57, 380], [0.42, 12, 60, 380],
    [0.54, 14, 64, 380], [0.57, 15, 66, 380], [0.7, 16, 71, 400], [0.8, 17, 78.3, 1500], [1, 17, 78.3, 1500],
  ];
  const ICON = {
    train: new Path2D("M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"),
    plane: new Path2D("M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"),
    boat: "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z",
  };
  const C = { sphere: "#0f2229", grat: "rgba(236,243,242,.07)", land: "#2b5563", focus: "#3b7383", border: "rgba(236,243,242,.2)", coast: "rgba(158,234,255,.35)",
    accent: "#9eeaff", warm: "#ffb27a", ice: "#ecf3f2", ink: "#062029", mist: "#7f9696" };

  const proj = d3.geoOrthographic().translate([S / 2, S / 2]).clipAngle(90).precision(0.5);
  const path = d3.geoPath(proj, ctx);
  const smooth = (x) => x * x * (3 - 2 * x);
  const km = (a, b) => d3.geoDistance(a, b) * 6371;
  SEGS.forEach((s) => {
    s.interp = []; s.len = 0;
    for (let i = 1; i < s.pts.length; i++) { s.len += km(s.pts[i - 1], s.pts[i]); s.interp.push([s.len, d3.geoInterpolate(s.pts[i - 1], s.pts[i])]); }
    s.km = s.mode === "train" ? s.len * 1.15 : s.len;
  });
  const along = (s, t) => {
    const target = t * s.len; let prev = 0;
    for (const [cum, f] of s.interp) { if (target <= cum) return f((target - prev) / (cum - prev || 1)); prev = cum; }
    return s.pts[s.pts.length - 1];
  };
  function camera(p) {
    let i = 0;
    while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
    const [p0, lo0, la0, s0] = CAM[i], [p1, lo1, la1, s1] = CAM[i + 1];
    const t = smooth(Math.max(0, Math.min(1, (p - p0) / (p1 - p0))));
    return [lo0 + (lo1 - lo0) * t, la0 + (la1 - la0) * t, Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * t)];
  }

  /* ---------- données ---------- */
  const geo = { low: null, high: null, sv: null };
  const prep = (topo) => {
    const countries = topojson.feature(topo, topo.objects.countries);
    return {
      land: countries,
      focus: { type: "FeatureCollection", features: countries.features.filter((f) => f.id === "756" || f.id === "578") },
      borders: topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b),
    };
  };
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((r) => r.json()).then((t) => { geo.low = prep(t); draw(true); }).catch(() => {});
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then((r) => r.json()).then((t) => { geo.high = prep(t); draw(true); }).catch(() => {});
  fetch("assets/geo/svalbard-10m.json").then((r) => r.json()).then((d) => { geo.sv = d; loupeInit(); draw(true); }).catch(() => {});

  /* ---------- taille du canvas ---------- */
  let k = 1;
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.width * dpr);
    k = canvas.width / S;
    draw(true);
  }
  addEventListener("resize", resize);

  /* ---------- dessin ---------- */
  let target = 0, shown = 0, lastDrawn = -1, result = { km: 0, lat: 46.62, active: 0 };
  const arcPoints = (s, t, n = 40) => { // points à l'écran d'un vol, soulevés pour faire un arc
    const a = proj(s.pts[0]), b = proj(s.pts[1]);
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let nx = dy / len, ny = -dx / len; if (nx < 0) { nx = -nx; ny = -ny; } // l'arc part vers la droite (vers l'est)
    const lift = Math.min(90, len * 0.18), out = [];
    const steps = Math.max(1, Math.ceil(n * t));
    for (let i = 0; i <= steps; i++) {
      const f = (i / steps) * t, [x, y] = proj(along(s, f)), h = Math.sin(Math.PI * f) * lift;
      out.push([x + nx * h, y + ny * h]);
    }
    return out;
  };
  function badge(x, y, icon, angle) {
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = "rgba(158,234,255,.8)"; ctx.shadowBlur = 16;
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(0, 0, 17, 0, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = C.ice; ctx.stroke();
    ctx.rotate(angle || 0); ctx.scale(0.95, 0.95); ctx.translate(-12, -12);
    ctx.fillStyle = C.ink; ctx.fill(icon);
    ctx.restore();
  }
  function draw(force) {
    if (!force && Math.abs(shown - lastDrawn) < 0.0002) return;
    lastDrawn = shown;
    const p = shown, [lon, lat, scale] = camera(p);
    proj.rotate([-lon, -lat]).scale(scale);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, S, S);

    // globe + halo
    const g = ctx.createRadialGradient(S / 2 - scale * 0.3, S / 2 - scale * 0.35, scale * 0.1, S / 2, S / 2, scale);
    g.addColorStop(0, "#18343d"); g.addColorStop(1, C.sphere);
    ctx.save();
    if (scale < 520) { ctx.shadowColor = "rgba(158,234,255,.35)"; ctx.shadowBlur = 50; }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S / 2, S / 2, scale, 0, 7); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1; ctx.strokeStyle = C.grat; ctx.beginPath(); path(d3.geoGraticule10()); ctx.stroke();

    const data = (scale > 700 && geo.high) || geo.low || geo.high;
    if (data) {
      ctx.fillStyle = C.land; ctx.beginPath(); path(data.land); ctx.fill();
      ctx.fillStyle = C.focus; ctx.beginPath(); path(data.focus); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 0.7; ctx.beginPath(); path(data.borders); ctx.stroke();
      if (scale > 900 && geo.sv && lat > 70) { ctx.fillStyle = C.land; ctx.strokeStyle = C.coast; ctx.lineWidth = 0.8; ctx.beginPath(); path(geo.sv); ctx.fill(); ctx.stroke(); }
    }
    // cercle polaire
    ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = "rgba(255,178,122,.6)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); path({ type: "LineString", coordinates: d3.range(-180, 181, 3).map((x) => [x, 66.56]) }); ctx.stroke(); ctx.restore();

    // itinéraire
    let kmDone = 0, pos = P.bulle, active = 0, vehicle = null;
    SEGS.forEach((s, i) => {
      const t = Math.max(0, Math.min(1, (p - s.t0) / (s.t1 - s.t0)));
      if (p >= s.t0) active = i;
      kmDone += s.km * t;
      if (t <= 0 || s.mode === "boat") { if (t > 0) pos = along(s, t); return; }
      ctx.save(); ctx.lineCap = "round";
      if (s.mode === "train") {
        ctx.setLineDash([2, 7]); ctx.strokeStyle = C.warm; ctx.lineWidth = 3.5;
        const pts = d3.range(0, t + 1e-9, t / 30 || 1).map((f) => along(s, f));
        ctx.beginPath(); path({ type: "LineString", coordinates: pts }); ctx.stroke();
        if (t < 1) { const q = proj(along(s, t)); vehicle = [q[0], q[1], ICON.train, 0]; }
      } else {
        const pts = arcPoints(s, t);
        ctx.setLineDash([9, 8]); ctx.strokeStyle = C.accent; ctx.lineWidth = 2.6; ctx.shadowColor = "rgba(158,234,255,.6)"; ctx.shadowBlur = 8;
        ctx.beginPath(); pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        if (t < 1) {
          const q = pts[pts.length - 1], q0 = pts[Math.max(0, pts.length - 3)];
          vehicle = [q[0], q[1], ICON.plane, Math.atan2(q[1] - q0[1], q[0] - q0[0]) + Math.PI / 2];
        }
      }
      ctx.restore();
      pos = along(s, t);
    });

    // escales
    const center = [lon, lat];
    ctx.font = "500 15px 'JetBrains Mono', monospace"; ctx.textBaseline = "middle";
    STOPS.forEach(([ll, name, at]) => {
      if (d3.geoDistance(ll, center) > Math.PI / 2 - 0.05) return;
      const on = p >= at; if (!on && p < at - 0.14) return;
      const [x, y] = proj(ll);
      ctx.globalAlpha = on ? 1 : 0.5;
      if (on) { ctx.fillStyle = "rgba(158,234,255,.22)"; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); }
      ctx.fillStyle = on ? C.accent : C.mist; ctx.beginPath(); ctx.arc(x, y, on ? 5 : 3.5, 0, 7); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(8,16,20,.85)"; ctx.fillStyle = C.ice;
      const label = name.toUpperCase(), right = name !== "Zurich";
      ctx.textAlign = right ? "left" : "right";
      ctx.strokeText(label, x + (right ? 16 : -16), y); ctx.fillText(label, x + (right ? 16 : -16), y);
      ctx.globalAlpha = 1;
    });
    if (vehicle) badge(...vehicle);

    result = { km: kmDone, lat: pos[1], active, p };
    loupeDraw(p);
  }

  /* ---------- loupe sur l'Isfjorden (bateau) ---------- */
  const loupe = document.querySelector(".loupe");
  let loupeProj, loupePath, boatEl, trailEl;
  function loupeInit() {
    if (!loupe || !geo.sv) return;
    const svg = loupe.querySelector("svg");
    loupeProj = d3.geoMercator().fitExtent([[20, 30], [280, 270]], { type: "MultiPoint", coordinates: [[13.75, 78.15], [16.1, 78.42]] });
    loupePath = d3.geoPath(loupeProj);
    const route = SEGS[4].pts;
    svg.querySelector(".loupe__land").setAttribute("d", loupePath(geo.sv));
    svg.querySelector(".loupe__route").setAttribute("d", loupePath({ type: "LineString", coordinates: route }));
    trailEl = svg.querySelector(".loupe__trail");
    boatEl = svg.querySelector(".loupe__boat");
    boatEl.querySelector("path").setAttribute("d", ICON.boat);
    const put = (sel, ll) => { const [x, y] = loupeProj(ll); svg.querySelector(sel).setAttribute("transform", `translate(${x} ${y})`); };
    put(".loupe__lyr", P.port); put(".loupe__esm", P.esm);
  }
  function loupeDraw(p) {
    if (!loupe) return;
    const vis = Math.max(0, Math.min(1, (p - 0.79) / 0.05));
    loupe.style.opacity = vis;
    loupe.style.transform = `scale(${0.85 + 0.15 * vis})`;
    if (!loupeProj) return;
    const s = SEGS[4], t = Math.max(0, Math.min(1, (p - s.t0) / (s.t1 - s.t0)));
    const pts = d3.range(0, t + 1e-9, 0.02).map((f) => along(s, f)).concat([along(s, t)]);
    trailEl.setAttribute("d", loupePath({ type: "LineString", coordinates: pts }) || "");
    const [x, y] = loupeProj(along(s, t));
    boatEl.setAttribute("transform", `translate(${x} ${y})`);
    loupe.classList.toggle("is-done", t >= 1);
  }

  /* ---------- boucle : on suit le défilement en douceur ---------- */
  (function loop() {
    shown += (target - shown) * 0.18;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    draw(false);
    requestAnimationFrame(loop);
  })();
  resize();

  return {
    setProgress(p) { target = p; return result; },
    get state() { return result; },
  };
})();
