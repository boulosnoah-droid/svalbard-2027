/* ==========================================================================
   Des Alpes à l'Arctique — interactions
   ========================================================================== */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const fmt = (n) => Math.round(n).toLocaleString("fr-CH").replace(/ |\s/g, "'");

  /* ---------- réglages ---------- */
  function applyConfig() {
    const email = CFG.email || "svalbardcsud@gmail.com";
    $$("[data-email-link]").forEach((a) => { a.href = "mailto:" + email; a.textContent = email; });
    const goal = CFG.goal || 40000;
    $("[data-goal-total]").textContent = fmt(goal);
    const bar = $(".goal__bar");
    if (typeof CFG.raised === "number") {
      $("[data-goal-raised]").innerHTML = "CHF <b>" + fmt(CFG.raised) + "</b> déjà réunis";
      bar.dataset.target = Math.min(100, (CFG.raised / goal) * 100);
    } else {
      bar.classList.add("is-pending");
    }
    if (CFG.iban) {
      $("[data-iban]").textContent = CFG.iban;
      $("[data-iban-holder]").textContent = [CFG.ibanHolder, CFG.bank].filter(Boolean).join(" · ");
      $("[data-iban-soon]").hidden = true;
    } else {
      $("[data-iban-block]").hidden = true;
    }
    if (CFG.twintQr) {
      const img = $("[data-twint]");
      img.src = CFG.twintQr; img.hidden = false;
      $("[data-twint-soon]").hidden = true;
    }
  }

  /* ---------- copier dans le presse-papiers ---------- */
  function copy(btn, text) {
    const done = () => { const t = btn.textContent; btn.textContent = "Copié ✓"; btn.classList.add("is-done"); setTimeout(() => { btn.textContent = t; btn.classList.remove("is-done"); }, 1800); };
    try { navigator.clipboard.writeText(text).then(done, done); } catch (e) { done(); }
  }
  $("[data-copy-email]").addEventListener("click", (e) => copy(e.currentTarget, CFG.email));
  $("[data-copy-iban]").addEventListener("click", (e) => copy(e.currentTarget, (CFG.iban || "").replace(/\s/g, "")));

  /* ---------- fond topographique (lignes de niveau animées) ---------- */
  function topo() {
    const canvas = $(".topo");
    if (!canvas || typeof d3 === "undefined" || !d3.contours) return;
    const ctx = canvas.getContext("2d");
    const cell = 16;
    let w, h, cols, rows, values, t = Math.random() * 100;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    // bruit de valeur lissé (léger, sans dépendance)
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
    const grad = (hsh, x, y, z) => { const hh = hsh & 15, u = hh < 8 ? x : y, v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z; return ((hh & 1) ? -u : u) + ((hh & 2) ? -v : v); };
    const fade = (x) => x * x * x * (x * (x * 6 - 15) + 10);
    const lerp = (a, b, x) => a + x * (b - a);
    function noise(x, y, z) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), q = fade(z);
      const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return lerp(lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), q);
    }

    function resize() {
      w = canvas.width = innerWidth; h = canvas.height = innerHeight;
      cols = Math.ceil(w / cell) + 1; rows = Math.ceil(h / cell) + 1;
      values = new Float64Array(cols * rows);
    }
    const thresholds = d3.range(-0.9, 0.9, 0.09);
    const contours = () => d3.contours().size([cols, rows]).thresholds(thresholds);
    let gen;
    function draw() {
      mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08;
      const sy = (window.scrollY || 0) * 0.0006;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const px = i * cell, py = j * cell;
        const dx = px - mouse.x, dy = py - mouse.y;
        const bump = Math.exp(-(dx * dx + dy * dy) / 26000) * 0.55;
        values[j * cols + i] = noise(i * 0.045, j * 0.045 + sy, t) * 0.9 + bump;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      const set = gen(values);
      set.forEach((c, k) => {
        ctx.strokeStyle = k % 4 === 0 ? "rgba(158,234,255,.16)" : "rgba(236,243,242,.055)";
        ctx.beginPath();
        c.coordinates.forEach((poly) => poly.forEach((ring) => {
          ring.forEach(([x, y], n) => (n ? ctx.lineTo(x * cell - cell, y * cell - cell) : ctx.moveTo(x * cell - cell, y * cell - cell)));
        }));
        ctx.stroke();
      });
    }
    resize(); gen = contours();
    addEventListener("resize", () => { resize(); gen = contours(); if (reduce) draw(); });
    if (fine) addEventListener("pointermove", (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; });
    if (reduce) { draw(); return; }
    let last = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (now - last < 50 || document.hidden) return; // ~20 images/s suffit
      last = now; t += 0.004; draw();
    })(0);
  }

  /* ---------- neige dans le héros ---------- */
  function snow() {
    const canvas = $(".snow");
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    let w, h, flakes = [];
    const hero = $(".hero");
    function resize() {
      w = canvas.width = hero.offsetWidth; h = canvas.height = hero.offsetHeight;
      const n = Math.min(160, Math.round(w * h / 14000));
      flakes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .3, s: Math.random() * .5 + .15, d: Math.random() * Math.PI * 2 }));
    }
    resize(); addEventListener("resize", resize);
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(236,243,242,.75)";
      for (const f of flakes) {
        f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .3;
        if (f.y > h) { f.y = -4; f.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      }
    })();
  }

  /* ---------- curseur & boutons magnétiques ---------- */
  function cursor() {
    if (!fine) return;
    const c = $(".cursor"), label = $(".cursor__label");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
    (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();
    document.addEventListener("pointerover", (e) => {
      const big = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, label, select");
      c.classList.toggle("is-big", !!big);
      c.classList.toggle("is-link", !big && !!link);
      label.textContent = big ? big.dataset.cursor : "";
    });
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * .25}px, ${my * .35}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1), color .4s"; el.style.transform = ""; setTimeout(() => (el.style.transition = ""), 600); });
    });
  }

  /* ---------- navigation ---------- */
  let lenis = null;
  function goTo(target) {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }
  function nav() {
    const navEl = $(".nav"), burger = $(".nav__burger"), menu = $(".menu");
    const setMenu = (open) => {
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open); menu.setAttribute("aria-hidden", !open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      setMenu(false);
      if (a.dataset.subject) { const s = $('[data-form="contact"] select'); s.value = a.dataset.subject; }
      goTo(id);
    });
    let lastY = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      navEl.classList.toggle("is-solid", y > 40);
      navEl.classList.toggle("is-hidden", y > lastY && y > 400 && !document.body.classList.contains("menu-open"));
      lastY = y;
    }, { passive: true });
  }

  /* ---------- citations ---------- */
  function quotes() {
    const qs = $$(".quote"), idx = $("[data-quote-index]");
    let i = 0, timer;
    const show = (n) => { qs[i].classList.remove("is-active"); i = (n + qs.length) % qs.length; qs[i].classList.add("is-active"); idx.textContent = String(i + 1).padStart(2, "0"); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 8000); };
    $$("[data-quote]").forEach((b) => b.addEventListener("click", () => { show(i + +b.dataset.quote); auto(); }));
    auto();
  }

  /* ---------- aperçu photo qui suit la souris ---------- */
  function peek() {
    if (!fine) return;
    const box = $(".peek"), img = $("img", box);
    let x = 0, y = 0, cx = 0, cy = 0, on = false;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * .12; cy += (y - cy) * .12;
      if (on) box.style.transform = `translate3d(${cx + 28}px, ${cy - 110}px, 0) rotate(${(x - cx) * .04}deg)`;
      requestAnimationFrame(loop);
    })();
    $$("[data-peek]").forEach((el) => {
      el.addEventListener("pointerenter", () => { img.src = el.dataset.peek; if (!on) { cx = x; cy = y; } on = true; box.classList.add("is-on"); });
      el.addEventListener("pointerleave", () => { on = false; box.classList.remove("is-on"); });
    });
  }

  /* ---------- globe : de Bulle au Svalbard ---------- */
  const globe = { render: () => {} };
  function initGlobe() {
    const svg = $(".globe");
    if (!svg || typeof d3 === "undefined" || !d3.geoOrthographic || typeof topojson === "undefined") return;
    const BULLE = [7.06, 46.62], LYR = [15.65, 78.22];
    const proj = d3.geoOrthographic().scale(380).translate([400, 400]).clipAngle(90).precision(.4);
    const path = d3.geoPath(proj);
    const grat = d3.geoGraticule10();
    const route = { type: "LineString", coordinates: d3.range(0, 1.0001, 0.02).map(d3.geoInterpolate(BULLE, LYR)) };
    const el = (s) => $(s, svg);
    let land = null, last = 0;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json").then((r) => r.json()).then((t) => { land = topojson.feature(t, t.objects.land); globe.render(last); }).catch(() => {});
    const interp = d3.geoInterpolate([BULLE[0] - 4, BULLE[1] - 8], [LYR[0] - 6, LYR[1] - 14]);
    globe.render = (p) => {
      last = p;
      const c = interp(Math.min(1, p * 1.1));
      proj.rotate([-c[0], -c[1]]);
      el(".globe__grat").setAttribute("d", path(grat));
      if (land) el(".globe__land").setAttribute("d", path(land));
      const k = Math.max(2, Math.round(p * (route.coordinates.length - 1)) + 1);
      el(".globe__route").setAttribute("d", path({ type: "LineString", coordinates: route.coordinates.slice(0, k) }) || "");
      const stops = [[BULLE, "Bulle", 0], [[10.75, 59.91], "Oslo", .42], [[18.96, 69.65], "Tromsø", .73], [LYR, "Longyearbyen", .97]];
      const pts = stops.map(([ll, name, at]) => {
        const [px, py] = proj(ll);
        const reached = p >= at;
        return `<g style="opacity:${reached ? 1 : .35}"><circle class="halo" cx="${px}" cy="${py}" r="${reached ? 12 : 0}"/><circle cx="${px}" cy="${py}" r="${reached ? 5 : 3}"/><text x="${px + 18}" y="${py + 5}">${name}</text></g>`;
      });
      // cercle polaire arctique
      const polar = { type: "LineString", coordinates: d3.range(-180, 181, 3).map((lon) => [lon, 66.56]) };
      pts.unshift(`<path d="${path(polar) || ""}" fill="none" stroke="rgba(255,178,122,.55)" stroke-dasharray="4 6" stroke-width="1.2"/>`);
      el(".globe__pts").innerHTML = pts.join("");
    };
    globe.render(0);
  }

  /* ---------- galerie : lightbox ---------- */
  function lightbox() {
    const lb = $(".lightbox"), img = $("img", lb), cap = $("p", lb);
    const close = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); lenis && lenis.start(); };
    $$(".float").forEach((f) => f.addEventListener("click", () => {
      const i = $("img", f); img.src = i.src; img.alt = i.alt; cap.textContent = $("figcaption", f).textContent;
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); lenis && lenis.stop();
    }));
    lb.addEventListener("click", (e) => { if (e.target !== img) close(); });
    addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  /* ---------- envoi des formulaires ---------- */
  async function send(kind, data) {
    if (CFG.formEndpoint) {
      // Google Apps Script : "text/plain" évite la requête préalable CORS
      await fetch(CFG.formEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ kind, ...data, date: new Date().toISOString(), page: location.href }) });
      return "sent";
    }
    // Pas encore de serveur : on ouvre un e-mail pré-rempli
    const lines = Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`);
    const subject = kind === "don" ? `Promesse de don — ${data.prenom} ${data.nom} (CHF ${data.montant})` : `[Site] ${data.sujet} — ${data.nom}`;
    location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    return "mailto";
  }
  function validate(scope) {
    let ok = true;
    $$("[required]", scope).forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  function donateForm() {
    const form = $('[data-form="don"]');
    const steps = $$(".step", form), dots = $$(".donate__steps li");
    const go = (n) => {
      steps.forEach((s) => s.classList.toggle("is-on", +s.dataset.step === n));
      dots.forEach((d, i) => d.classList.toggle("is-on", i < n));
      if (n > 1) goTo("#don");
    };
    const amountField = $(".field--amount", form), org = $("[data-org]", form);
    form.addEventListener("change", (e) => {
      if (e.target.name === "montant") amountField.hidden = e.target.value !== "autre";
      if (e.target.name === "type") org.hidden = e.target.value === "Particulier";
    });
    const amount = () => {
      const v = form.montant.value;
      return v === "autre" ? Math.max(0, parseInt(form.montantLibre.value, 10) || 0) : +v;
    };
    $("[data-next]", form).addEventListener("click", () => {
      if (!amount()) { form.montantLibre.classList.add("is-invalid"); form.montantLibre.focus(); return; }
      form.montantLibre.classList.remove("is-invalid");
      go(2);
    });
    $("[data-prev]", form).addEventListener("click", () => go(1));
    $("[data-restart]", form).addEventListener("click", () => { form.reset(); amountField.hidden = true; org.hidden = true; go(1); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $(".form__error", form); err.textContent = "";
      if (form.website.value) return; // robot
      if (!validate($('[data-step="2"]', form))) { err.textContent = "Merci de remplir les champs marqués d'une *."; return; }
      const d = new Date();
      const ref = `SVALBARD ${(form.prenom.value[0] || "") + (form.nom.value[0] || "")}`.toUpperCase() + ` ${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}`;
      const data = {
        montant: amount(), type: form.type.value, prenom: form.prenom.value.trim(), nom: form.nom.value.trim(),
        organisation: form.organisation.value.trim(), email: form.email.value.trim(), adresse: form.adresse.value.trim(),
        message: form.message.value.trim(), nomPublic: form.public.checked ? "oui" : "non", nouvelles: form.nouvelles.checked ? "oui" : "non", reference: ref,
      };
      const btn = $('button[type="submit"]', form); btn.disabled = true;
      try { await send("don", data); } catch (x) { /* on continue quand même vers le paiement */ }
      btn.disabled = false;
      $("[data-thanks-name]", form).textContent = data.prenom;
      $("[data-thanks-amount]", form).textContent = "CHF " + fmt(data.montant);
      $("[data-ref]", form).textContent = ref;
      go(3);
    });
  }

  function contactForm() {
    const form = $('[data-form="contact"]'), status = $(".form__status", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form__status mono"; status.textContent = "";
      if (form.website.value) return;
      if (!validate(form)) { status.textContent = "Merci de remplir les champs marqués d'une *."; return; }
      const data = { nom: form.nom.value.trim(), email: form.email.value.trim(), sujet: form.sujet.options[form.sujet.selectedIndex].text, message: form.message.value.trim() };
      try {
        const how = await send("contact", data);
        status.classList.add("is-ok");
        status.textContent = how === "sent" ? "Merci ! Votre message est bien parti, nous vous répondons vite." : "Votre messagerie s'ouvre avec le message prêt à envoyer.";
        if (how === "sent") form.reset();
      } catch (x) { status.textContent = "Oups, l'envoi n'a pas marché. Écrivez-nous directement à " + CFG.email; }
    });
  }

  /* ---------- animations au défilement ---------- */
  function scrollFx() {
    if (!hasGsap || reduce) {
      $$(".statement .w").forEach((w) => (w.style.opacity = 1));
      $$("[data-count]").forEach((el) => (el.textContent = (el.dataset.prefix || "") + (el.hasAttribute("data-sep") ? fmt(+el.dataset.count) : el.dataset.count)));
      const bar = $(".goal__bar span"); if ($(".goal__bar").dataset.target) bar.style.width = $(".goal__bar").dataset.target + "%";
      const lat = $("[data-lat]"); lat.textContent = "78.2"; $("[data-km]").textContent = fmt(3533); $$(".journey__ruler li").forEach((li) => li.classList.add("is-on"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    if (typeof Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }

    const mm = gsap.matchMedia();

    // héros : l'image s'agrandit, le titre s'écarte
    mm.add("(min-width: 761px)", () => {
      const media = $(".hero__media");
      const scale = () => Math.max(innerWidth / media.offsetWidth, innerHeight / media.offsetHeight) * 1.02;
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "+=110%", scrub: 0.8, pin: true, invalidateOnRefresh: true } })
        .to(media, { scale, borderRadius: 0, ease: "none" }, 0)
        .to(".hero__media img", { scale: 1, ease: "none" }, 0)
        .to(".hero__title .line:first-child", { xPercent: -40, opacity: 0, ease: "none" }, 0)
        .to(".hero__title .line--serif", { xPercent: 40, opacity: 0, ease: "none" }, 0)
        .to(".hero__lede, .hero__coords, .hero__meta, .hero__scroll", { opacity: 0, y: -20, ease: "none", duration: .3 }, 0);
    });
    mm.add("(max-width: 760px)", () => {
      gsap.to(".hero__media img", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    });

    // bandeau défilant qui réagit à la vitesse
    const track = $(".marquee__track");
    const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 26, repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity() / 300;
        gsap.to(loop, { timeScale: self.direction * Math.max(1, Math.min(6, Math.abs(v))), duration: .4, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: .4 });
      },
    });

    // voyage : latitude 46.6 → 78.2
    const lat = $("[data-lat]"), km = $("[data-km]"), pin = $(".journey__pin"), marks = $$(".journey__ruler li"), stopEl = $("[data-stop]");
    ScrollTrigger.create({
      trigger: ".journey", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: ({ progress: p }) => {
        lat.textContent = (46.6 + p * 31.6).toFixed(1);
        km.textContent = fmt(p * 3533);
        pin.style.setProperty("--jp", p.toFixed(3));
        globe.render(p);
        marks.forEach((m) => m.classList.toggle("is-on", p >= parseFloat(m.style.getPropertyValue("--p")) - 0.02));
        const cur = marks.filter((m) => m.classList.contains("is-on")).pop();
        if (cur && stopEl.dataset.k !== cur.textContent) { stopEl.dataset.k = cur.textContent; stopEl.innerHTML = `<b>${$("span", cur).textContent}</b> — ${$("em", cur).textContent}`; }
      },
    });
    marks[0].classList.add("is-on");

    // texte manifeste qui s'allume mot à mot
    const st = $("[data-split]");
    const words = [];
    [...st.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.append(part); return; }
          const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.append(s); words.push(s);
        });
        node.replaceWith(frag);
      } else { node.classList.add("w"); words.push(node); }
    });
    gsap.to(words, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 45%", scrub: true } });

    // titres qui montent
    $$("h2").forEach((h) => gsap.from(h, { yPercent: 30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } }));

    // images qui se dévoilent + parallaxe intérieure
    $$(".reveal-img").forEach((f) => {
      gsap.fromTo(f, { clipPath: "inset(18% 8% 18% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: f, start: "top 95%", end: "top 35%", scrub: true } });
      gsap.fromTo($("img", f), { yPercent: -8 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // bandeau : parallaxe + zoom du texte
    gsap.fromTo(".band__media img", { yPercent: -18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".band__text", { scale: .82, opacity: 0, ease: "none", scrollTrigger: { trigger: ".band", start: "top 75%", end: "center center", scrub: true } });

    // fonds photo en parallaxe
    [[".team__bg img", ".team"], [".quotes__bg img", ".quotes"], [".support__media img", ".support__media"], [".contact__img img", ".contact__img"]].forEach(([img, trig]) =>
      gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: trig, start: "top bottom", end: "bottom top", scrub: true } }));
    gsap.from(".tile", { y: 80, opacity: 0, stagger: .08, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".bento", start: "top 85%" } });
    gsap.from(".team__list li", { x: 40, opacity: 0, stagger: .05, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".team__list", start: "top 80%" } });

    // compteurs
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => (el.textContent = (el.dataset.prefix || "") + (el.hasAttribute("data-sep") ? fmt(o.v) : Math.round(o.v))) });
    });

    // thèmes : défilement horizontal épinglé
    mm.add("(min-width: 761px)", () => {
      const pinEl = $(".themes__pin");
      const items = [$(".themes__intro"), $(".themes__track")];
      const trackEl = $(".themes__track");
      const dist = () => trackEl.offsetLeft + trackEl.offsetWidth - innerWidth; // mesure hors transformations
      gsap.to(items, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".themes", start: "top top", end: () => "+=" + dist(), pin: pinEl, scrub: 0.8, invalidateOnRefresh: true } });
    });

    // galerie : photos flottantes
    mm.add("(min-width: 761px)", () => {
      $$(".float").forEach((f) => gsap.to(f, { yPercent: parseFloat(f.dataset.speed) * -120, ease: "none", scrollTrigger: { trigger: ".gallery__field", start: "top bottom", end: "bottom top", scrub: true } }));
      gsap.from(".gallery__quote", { opacity: 0, y: 60, scrollTrigger: { trigger: ".gallery__quote", start: "top 85%", end: "top 45%", scrub: true } });
    });

    // cartes « nous soutenir »
    gsap.from(".way", { y: 60, opacity: 0, stagger: .12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".ways", start: "top 85%" } });
    const goalBar = $(".goal__bar");
    if (goalBar.dataset.target) gsap.to(".goal__bar span", { width: goalBar.dataset.target + "%", duration: 2, ease: "power3.out", scrollTrigger: { trigger: goalBar, start: "top 85%" } });

    // pied de page
    gsap.from(".footer__big", { yPercent: 25, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 80%" } });
  }

  /* ---------- chargement ---------- */
  function intro() {
    const loader = $(".loader"), latEl = $("[data-loader-lat]");
    const finish = () => {
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
      if (hasGsap) ScrollTrigger.refresh();
    };
    if (!hasGsap || reduce) { loader.remove(); finish(); return; }
    const o = { v: 46.6 };
    const tl = gsap.timeline();
    tl.to(o, { v: 78.2, duration: 1.8, ease: "power2.inOut", onUpdate: () => (latEl.textContent = o.v.toFixed(1)) })
      .to(".loader__bar span", { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, 0)
      .to(loader, { yPercent: -100, duration: 1.1, ease: "expo.inOut", onComplete: () => { loader.remove(); finish(); } }, "+=.15")
      .from(".hero__title .word", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: .12 }, "-=.45")
      .from(".hero__media", { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.inOut" }, "<-.2")
      .from(".hero__media img", { scale: 1.5, duration: 1.8, ease: "expo.out" }, "<")
      .from(".hero__meta span, .hero__lede, .hero__coords, .hero__scroll, .nav", { opacity: 0, y: 16, duration: .9, stagger: .06, ease: "power3.out" }, "-=1");
  }

  applyConfig();
  nav();
  quotes();
  peek();
  initGlobe();
  lightbox();
  donateForm();
  contactForm();
  cursor();
  topo();
  snow();
  scrollFx();
  if (document.readyState === "complete") intro(); else addEventListener("load", intro);
})();
