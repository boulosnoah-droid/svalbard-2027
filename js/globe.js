/* ==========================================================================
   Le trajet : globe qui suit le voyage Bulle → Zurich (train) → Oslo →
   Tromsø → Longyearbyen (avion) → glacier Esmarkbreen (bateau).
   Trajet indicatif. Piloté par le défilement (voir main.js).
   ========================================================================== */
window.SvalbardGlobe = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const svg = $(".globe");
  if (!svg || typeof d3 === "undefined" || !d3.geoOrthographic || typeof topojson === "undefined") return null;

  const P = {
    bulle: [7.06, 46.62], zrh: [8.56, 47.46], osl: [11.1, 60.19], tos: [18.92, 69.68],
    lyr: [15.47, 78.25], port: [15.6, 78.232], esm: [14.33, 78.305],
  };
  const SEGS = [
    { mode: "train", pts: [P.bulle, [7.16, 46.8], [7.44, 46.95], [7.9, 47.15], [8.3, 47.35], [8.54, 47.38], P.zrh], t0: 0.04, t1: 0.15 },
    { mode: "plane", pts: [P.zrh, P.osl], t0: 0.2, t1: 0.37 },
    { mode: "plane", pts: [P.osl, P.tos], t0: 0.43, t1: 0.55 },
    { mode: "plane", pts: [P.tos, P.lyr], t0: 0.6, t1: 0.71 },
    { mode: "boat", pts: [P.port, [15.45, 78.255], [15.1, 78.275], [14.75, 78.285], [14.45, 78.295], P.esm], t0: 0.87, t1: 0.98 },
  ];
  const STOPS = [
    [P.bulle, "Bulle", 0], [P.zrh, "Zurich", 0.15], [P.osl, "Oslo", 0.37], [P.tos, "Tromsø", 0.55],
    [P.lyr, "Longyearbyen", 0.71], [P.esm, "Glacier Esmarkbreen", 0.98],
  ];
  // caméra : [progression, longitude, latitude, zoom]
  const CAM = [
    [0, 7.7, 46.95, 5600], [0.15, 8.1, 47.2, 4200], [0.22, 9.5, 52, 760], [0.37, 11, 58.5, 760],
    [0.43, 13, 62, 760], [0.55, 16, 67.5, 760], [0.6, 16, 70.5, 760], [0.71, 16, 75, 820],
    [0.79, 17.5, 78.5, 5000], [0.87, 14.97, 78.268, 62000], [1, 14.95, 78.272, 66000],
  ];

  const proj = d3.geoOrthographic().translate([400, 400]).clipAngle(90).precision(0.3);
  const path = d3.geoPath(proj);
  const el = (c) => $(c, svg);
  const smooth = (x) => x * x * (3 - 2 * x);
  const hav = (a, b) => d3.geoDistance(a, b) * 6371;

  // longueur (km) de chaque segment, pour le compteur
  SEGS.forEach((s) => {
    s.interp = [];
    s.km = 0;
    for (let i = 1; i < s.pts.length; i++) { const k = hav(s.pts[i - 1], s.pts[i]); s.km += k; s.interp.push([s.km, d3.geoInterpolate(s.pts[i - 1], s.pts[i])]); }
    if (s.mode === "train") s.km *= 1.15; // les rails ne sont pas en ligne droite
  });
  const along = (s, t) => { // point du segment à la fraction t (0..1)
    const target = t * s.interp[s.interp.length - 1][0];
    let prev = 0;
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

  // données géographiques
  let countries = null, borders = null, focus = null, svalbard = null;
  const inSvalbard = (poly) => poly[0].every(([x, y]) => x >= 8 && x <= 36 && y >= 74 && y <= 81.5);
  Promise.all([
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then((r) => r.json()),
    fetch("assets/geo/svalbard-10m.json").then((r) => r.json()),
  ]).then(([topo, sv]) => {
    const all = topojson.feature(topo, topo.objects.countries);
    all.features.forEach((f) => { // le Svalbard détaillé remplace la version simplifiée
      if (f.geometry && f.geometry.type === "MultiPolygon") f.geometry.coordinates = f.geometry.coordinates.filter((p) => !inSvalbard(p));
    });
    countries = all;
    focus = { type: "FeatureCollection", features: all.features.filter((f) => f.id === "756" || f.id === "578") };
    borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
    svalbard = sv;
    render(last, true);
  }).catch(() => {});

  const ICONS = {
    train: '<path d="M-5 -7h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3zM-5 -4v4h10v-4zM-4 3.2a1.2 1.2 0 1 0 .01 0zM4 3.2a1.2 1.2 0 1 0 .01 0zM-6 8l2-2M6 8l-2-2" fill="#062029" stroke="#062029" stroke-width=".6"/>',
    plane: '<path d="M0 -9l1.6 6 7.4 3.6v2l-7.4-2-.6 5.6 2.6 2v1.6L0 18l-3.6-.2v-1.6l2.6-2-.6-5.6-7.4 2v-2l7.4-3.6z" fill="#062029" transform="scale(.9) translate(0 -4)"/>',
    boat: '<path d="M-9 2h18l-3.2 5.5h-11.6zM-1 -9v10h8zM-2.2 -7.5v8.5h-6z" fill="#062029"/>',
  };

  let last = 0, lastKey = "", lastResult = { km: 0, lat: 46.62, active: 0 };
  function render(p, force) {
    last = p;
    const [lon, lat, scale] = camera(p);
    const key = [lon.toFixed(3), lat.toFixed(3), scale.toFixed(0), p.toFixed(4)].join();
    if (!force && key === lastKey) return lastResult;
    lastKey = key;
    proj.rotate([-lon, -lat]).scale(scale);
    el(".globe__sphere").setAttribute("r", scale);
    const step = scale > 12000 ? [0.5, 0.25] : scale > 3000 ? [2, 1] : [10, 10];
    el(".globe__grat").setAttribute("d", path(d3.geoGraticule().step(step)()) || "");
    if (countries) {
      el(".globe__land").setAttribute("d", path(countries) || "");
      el(".globe__focus").setAttribute("d", path(focus) || "");
      el(".globe__borders").setAttribute("d", path(borders) || "");
      el(".globe__sv").setAttribute("d", scale > 600 ? path(svalbard) || "" : "");
    }
    // cercle polaire
    el(".globe__polar").setAttribute("d", path({ type: "LineString", coordinates: d3.range(-180, 181, 2).map((x) => [x, 66.56]) }) || "");

    const center = [lon, lat];
    const visible = (ll) => d3.geoDistance(ll, center) < Math.PI / 2 - 0.02;
    let routes = "", vehicle = "", km = 0, pos = P.bulle, active = 0;
    SEGS.forEach((s, i) => {
      const t = Math.max(0, Math.min(1, (p - s.t0) / (s.t1 - s.t0)));
      if (p >= s.t0) active = i;
      km += s.km * t;
      if (t <= 0) return;
      const n = 48, pts = [];
      for (let k = 0; k <= n * t; k++) pts.push(along(s, k / n));
      pts.push(along(s, t));
      if (s.mode === "plane") {
        // arc « en vol » : on soulève la ligne perpendiculairement à la corde
        const a = proj(s.pts[0]), b = proj(s.pts[1]);
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        let nx = dy / len, ny = -dx / len;
        if (ny > 0) { nx = -nx; ny = -ny; }
        const lift = len * 0.16;
        const scr = pts.map((ll, k) => {
          const f = k / n, [x, y] = proj(ll), h = Math.sin(Math.PI * Math.min(1, f)) * lift;
          return [x + nx * h, y + ny * h];
        });
        routes += `<path class="r r--plane" d="M${scr.map((q) => q.map((v) => v.toFixed(1)).join(" ")).join("L")}"/>`;
        if (t < 1) {
          const q = scr[scr.length - 1], q0 = scr[Math.max(0, scr.length - 3)];
          const ang = Math.atan2(q[1] - q0[1], q[0] - q0[0]) * 180 / Math.PI + 90;
          vehicle = `<g transform="translate(${q[0]} ${q[1]})"><circle r="17"/><g transform="rotate(${ang})">${ICONS.plane}</g></g>`;
        }
      } else {
        const d = path({ type: "LineString", coordinates: pts });
        routes += `<path class="r r--${s.mode}" d="${d || ""}"/>`;
        if (t < 1 && t > 0) {
          const q = proj(pts[pts.length - 1]);
          vehicle = `<g transform="translate(${q[0]} ${q[1]})"><circle r="17"/>${ICONS[s.mode]}</g>`;
        }
      }
      pos = along(s, t);
    });
    el(".globe__routes").innerHTML = routes;
    el(".globe__vehicle").innerHTML = vehicle;
    el(".globe__pts").innerHTML = STOPS.map(([ll, name, at]) => {
      if (!visible(ll)) return "";
      const [x, y] = proj(ll), on = p >= at;
      if (!on && p < at - 0.16) return ""; // on n'affiche que l'étape suivante
      const right = name !== "Glacier Esmarkbreen";
      return `<g class="${on ? "is-on" : ""}"><circle class="halo" cx="${x}" cy="${y}" r="${on ? 13 : 0}"/><circle cx="${x}" cy="${y}" r="${on ? 5 : 3.5}"/><text x="${right ? x + 16 : x - 16}" y="${y + 5}" text-anchor="${right ? "start" : "end"}">${name}</text></g>`;
    }).join("");
    lastResult = { km, lat: pos[1], active };
    return lastResult;
  }

  return { render };
})();
