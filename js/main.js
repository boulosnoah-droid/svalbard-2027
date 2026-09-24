/* ==========================================================================
   Des Alpes à l'Arctique — interactions communes à toutes les pages
   ========================================================================== */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const fmt = (n) => Math.round(n).toLocaleString("fr-CH").replace(/ |\s/g, "'");
  let lenis = null;

  /* ---------- jauge de la collecte (lue automatiquement dans Google Sheets) ---------- */
  function goal() {
    const bar = $(".goal__bar");
    const wall = $("[data-donors]");
    if (!bar && !wall) return;
    const total = CFG.goal || 40000;
    $$("[data-goal-total]").forEach((e) => (e.textContent = fmt(total)));
    const show = (raised, donors, names) => {
      if (bar && typeof raised === "number" && raised > 0) {
        $("[data-goal-raised]").innerHTML = "CHF <b>" + fmt(raised) + "</b> déjà réunis" + (donors ? ` · ${donors} don${donors > 1 ? "s" : ""}` : "");
        bar.classList.remove("is-pending");
        const pct = Math.min(100, (raised / total) * 100);
        hasGsap ? gsap.to($("span", bar), { width: pct + "%", duration: 2, ease: "power3.out", scrollTrigger: { trigger: bar, start: "top 90%" } }) : ($("span", bar).style.width = pct + "%");
      }
      if (wall && names && names.length) {
        wall.hidden = false;
        $("[data-donors-list]", wall).innerHTML = names.map((n) => `<li>${n.replace(/[<>&]/g, "")}</li>`).join("");
      }
    };
    if (bar) bar.classList.add("is-pending");
    if (typeof CFG.raised === "number") show(CFG.raised);
    else if (CFG.formEndpoint) fetch(CFG.formEndpoint).then((r) => r.json()).then((d) => show(d.raised, d.donors, d.names)).catch(() => {});
  }

  /* ---------- fenêtres (dialog) ---------- */
  function modals() {
    const open = (name) => {
      const d = $("#modal-" + name);
      if (!d) return;
      $$(".modal__done", d).forEach((x) => (x.hidden = true));
      $$(".modal__form", d).forEach((x) => (x.hidden = false));
      d.showModal();
      document.documentElement.classList.add("has-modal");
      lenis && lenis.stop();
    };
    document.addEventListener("click", (e) => {
      const o = e.target.closest("[data-open]");
      if (o) { e.preventDefault(); setMenu(false); open(o.dataset.open); return; }
      const c = e.target.closest("[data-close]");
      if (c) { c.closest("dialog").close(); return; }
      if (e.target.tagName === "DIALOG") e.target.close(); // clic sur le fond
    });
    $$("dialog.modal").forEach((d) => d.addEventListener("close", () => { document.documentElement.classList.remove("has-modal"); lenis && lenis.start(); }));
  }

  /* ---------- envoi des formulaires ---------- */
  async function send(kind, data) {
    if (!CFG.formEndpoint) throw new Error("no-endpoint");
    const body = JSON.stringify({ kind, ...data, date: new Date().toISOString(), page: location.pathname });
    let res;
    try {
      // "text/plain" évite la requête préalable CORS ; Google Apps Script renvoie une réponse lisible
      res = await fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body });
    } catch (e) {
      return true; // réponse illisible (réseau/CORS) : la requête est partie, on ne renvoie pas pour éviter un doublon
    }
    const r = await res.json().catch(() => ({ ok: true }));
    if (r && r.ok === false) throw new Error(r.erreur || "refus");
    return true;
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
  function forms() {
    ["contact", "partenariat", "livre"].forEach((kind) => {
      const form = $(`[data-form="${kind}"]`);
      if (!form) return;
      const status = $(".form__status", form);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        status.textContent = "";
        if (form.website.value) return;
        if (!validate(form)) { status.textContent = "Merci de remplir les champs marqués d'une *."; return; }
        const data = {};
        new FormData(form).forEach((v, k) => { if (k !== "website") data[k] = data[k] ? data[k] + ", " + v : String(v).trim(); });
        const btn = $('button[type="submit"]', form); btn.disabled = true;
        try {
          await send(kind, data);
          form.reset(); form.hidden = true;
          $(".modal__done", form.closest("dialog")).hidden = false;
        } catch (x) {
          status.innerHTML = x.message === "limite" ? `Trop d'envois depuis cette adresse. Réessayez dans une heure, ou écrivez-nous à <b>${CFG.email}</b>.`
            : x.message === "email" ? "Cette adresse e-mail ne semble pas valide."
            : `L'envoi n'a pas fonctionné. Écrivez-nous à <b>${CFG.email}</b> <button type="button" class="copy" data-copy-email>Copier</button>`;
        }
        btn.disabled = false;
      });
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-copy-email]");
      if (!b) return;
      navigator.clipboard && navigator.clipboard.writeText(CFG.email);
      b.textContent = "Copié ✓"; b.classList.add("is-done");
    });
    if (window.SvalbardPay) window.SvalbardPay.init((k, d) => send(k, d), validate);
  }

  /* ---------- navigation, menu, transitions ---------- */
  function setMenu(open) {
    const burger = $(".nav__burger"), menu = $(".menu");
    if (!burger) return;
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open); menu.setAttribute("aria-hidden", !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  function nav() {
    const navEl = $(".nav");
    $(".nav__burger").addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    let lastY = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      navEl.classList.toggle("is-solid", y > 40);
      navEl.classList.toggle("is-hidden", y > lastY && y > 500 && !document.body.classList.contains("menu-open"));
      lastY = y;
    }, { passive: true });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-top]")) { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: "smooth" }); return; }
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
      const href = a.getAttribute("href");
      if (href.startsWith("#")) {
        const t = $(href); if (!t) return;
        e.preventDefault(); setMenu(false);
        lenis ? lenis.scrollTo(t, { duration: 1.4 }) : t.scrollIntoView({ behavior: "smooth" });
        return;
      }
      // lien vers une section de la page actuelle (ex. menu déroulant) : défilement doux
      const [file, hash] = href.split("#");
      const here = location.pathname.split("/").pop() || "index.html";
      if (hash && file === here) {
        const t = document.getElementById(hash); if (!t) return;
        e.preventDefault(); setMenu(false);
        lenis ? lenis.scrollTo(t, { duration: 1.4 }) : t.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  /* ---------- fond topographique animé ---------- */
  function topo() {
    const canvas = $(".topo");
    if (!canvas || typeof d3 === "undefined" || !d3.contours) return;
    const ctx = canvas.getContext("2d");
    const cell = 16;
    let w, h, cols, rows, values, gen, t = Math.random() * 100;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
    const grad = (hs, x, y, z) => { const k = hs & 15, u = k < 8 ? x : y, v = k < 4 ? y : k === 12 || k === 14 ? x : z; return ((k & 1) ? -u : u) + ((k & 2) ? -v : v); };
    const fade = (x) => x * x * x * (x * (x * 6 - 15) + 10), lerp = (a, b, x) => a + x * (b - a);
    function noise(x, y, z) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), q = fade(z);
      const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return lerp(lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), q);
    }
    const thresholds = d3.range(-0.9, 0.9, 0.09);
    function resize() {
      w = canvas.width = innerWidth; h = canvas.height = innerHeight;
      cols = Math.ceil(w / cell) + 1; rows = Math.ceil(h / cell) + 1;
      values = new Float64Array(cols * rows);
      gen = d3.contours().size([cols, rows]).thresholds(thresholds);
    }
    function draw() {
      mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08;
      const sy = (scrollY || 0) * 0.0006;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const dx = i * cell - mouse.x, dy = j * cell - mouse.y;
        values[j * cols + i] = noise(i * 0.045, j * 0.045 + sy, t) * 0.9 + Math.exp(-(dx * dx + dy * dy) / 26000) * 0.55;
      }
      ctx.clearRect(0, 0, w, h);
      gen(values).forEach((c, k) => {
        ctx.strokeStyle = k % 4 === 0 ? "rgba(158,234,255,.15)" : "rgba(236,243,242,.05)";
        ctx.beginPath();
        c.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(([x, y], n) => (n ? ctx.lineTo(x * cell - cell, y * cell - cell) : ctx.moveTo(x * cell - cell, y * cell - cell)))));
        ctx.stroke();
      });
    }
    resize();
    addEventListener("resize", () => { resize(); if (reduce) draw(); });
    if (fine) addEventListener("pointermove", (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; });
    if (reduce) { draw(); return; }
    let last = 0;
    (function loop(now) { requestAnimationFrame(loop); if (now - last < 50 || document.hidden) return; last = now; t += 0.004; draw(); })(0);
  }

  /* ---------- neige (accueil) ---------- */
  function snow() {
    const canvas = $(".snow");
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d"), host = canvas.parentElement;
    let w, h, flakes = [], visible = true;
    const resize = () => {
      w = canvas.width = host.offsetWidth; h = canvas.height = host.offsetHeight;
      flakes = Array.from({ length: Math.min(150, Math.round(w * h / 15000)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .3, s: Math.random() * .5 + .15, d: Math.random() * 6.3 }));
    };
    resize(); addEventListener("resize", resize);
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "rgba(236,243,242,.8)";
      for (const f of flakes) { f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .3; if (f.y > h) { f.y = -4; f.x = Math.random() * w; } ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    })();
  }

  /* ---------- survol : lumière qui suit la souris dans les cartes + boutons magnétiques ---------- */
  function hover() {
    if (!fine) return;
    $$(".spot").forEach((el) => el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    }));
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)"; el.style.transform = ""; setTimeout(() => (el.style.transition = ""), 600); });
    });
  }

  /* ---------- citations ---------- */
  function quotes() {
    const qs = $$(".quote"), idx = $("[data-quote-index]");
    if (!qs.length) return;
    let i = 0, timer;
    const show = (n) => { qs[i].classList.remove("is-active"); i = (n + qs.length) % qs.length; qs[i].classList.add("is-active"); idx.textContent = String(i + 1).padStart(2, "0"); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 8000); };
    $$("[data-quote]").forEach((b) => b.addEventListener("click", () => { show(i + +b.dataset.quote); auto(); }));
    auto();
  }

  /* ---------- galerie : agrandissement ---------- */
  function lightbox() {
    const lb = $(".lightbox");
    if (!lb) return;
    const img = $("img", lb), cap = $("p", lb);
    const close = () => { lb.classList.remove("is-open"); lenis && lenis.start(); };
    $$("[data-zoom]").forEach((f) => f.addEventListener("click", () => {
      const i = $("img", f); img.src = i.src; img.alt = i.alt; cap.textContent = ($("figcaption", f) || {}).textContent || "";
      lb.classList.add("is-open"); lenis && lenis.stop();
    }));
    lb.addEventListener("click", (e) => { if (e.target !== img) close(); });
    addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  /* ---------- une seule question ouverte à la fois ---------- */
  function accordions() {
    $$("[data-accordion]").forEach((list) => $$("details", list).forEach((d) => d.addEventListener("toggle", () => {
      if (d.open) $$("details", list).forEach((o) => o !== d && (o.open = false));
    })));
  }

  /* ---------- animations au défilement ---------- */
  function scrollFx() {
    const journey = $(".journey");
    const G = window.SvalbardGlobe;
    const ends = [0.13, 0.38, 0.54, 0.7, 0.97];
    const steps = $$(".journey__steps li"), latEl = $("[data-lat]"), kmEl = $("[data-km]");
    const updateJourney = (p) => { if (G) G.setProgress(p); };
    if (journey && G) (function panel() {
      const r = G.state;
      if (r.p !== undefined) {
        latEl.textContent = r.lat.toFixed(1);
        kmEl.textContent = fmt(r.km);
        steps.forEach((li, i) => { li.classList.toggle("is-on", i === r.active && r.p > 0.02 && r.p < ends[i]); li.classList.toggle("is-done", r.p >= ends[i]); });
      }
      requestAnimationFrame(panel);
    })();
    if (!hasGsap || reduce) {
      $$("[data-split] .w, [data-split]").forEach((w) => (w.style.opacity = 1));
      $$("[data-count]").forEach((el) => (el.textContent = (el.dataset.prefix || "") + (el.hasAttribute("data-sep") ? fmt(+el.dataset.count) : el.dataset.count)));
      if (journey) updateJourney(1);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const mm = gsap.matchMedia();

    // en-têtes de page : photo qui glisse, texte qui s'efface
    $$(".phero, .hero").forEach((h) => {
      const img = $(".phero__media img, .hero__media img", h);
      if (img) gsap.to(img, { yPercent: 12, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
      const txt = $(".phero__inner, .hero__inner", h);
      if (txt) gsap.to(txt, { yPercent: -16, opacity: 0, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
    });

    // bandeau défilant sensible à la vitesse
    const track = $(".marquee__track");
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 26, repeat: -1 });
      ScrollTrigger.create({ onUpdate: (self) => {
        const v = Math.abs(self.getVelocity() / 300);
        gsap.to(loop, { timeScale: self.direction * Math.max(1, Math.min(6, v)), duration: .4, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: .4 });
      } });
    }

    // trajet sur le globe
    if (journey) {
      updateJourney(0);
      ScrollTrigger.create({ trigger: journey, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (s) => updateJourney(s.progress) });
    }

    // texte qui s'allume mot à mot
    $$("[data-split]").forEach((st) => {
      const words = [];
      [...st.childNodes].forEach((node) => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part.trim()) return frag.append(part);
            const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.append(s); words.push(s);
          });
          node.replaceWith(frag);
        } else { node.classList.add("w"); words.push(node); }
      });
      gsap.to(words, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 50%", scrub: true } });
    });

    // titres, apparitions
    $$("main h2:not(.no-anim)").forEach((h) => gsap.from(h, { yPercent: 30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } }));
    $$("[data-stagger]").forEach((g) => gsap.from(g.children, { y: 60, opacity: 0, stagger: .08, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: g, start: "top 85%" } }));
    $$(".reveal-img").forEach((f) => {
      gsap.fromTo(f, { clipPath: "inset(16% 8% 16% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: f, start: "top 95%", end: "top 40%", scrub: true } });
      const i = $("img", f);
      if (i) gsap.fromTo(i, { yPercent: -8 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".band").forEach((b) => {
      gsap.fromTo($(".band__media img", b), { yPercent: -16 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from($(".band__text", b), { scale: .85, opacity: 0, ease: "none", scrollTrigger: { trigger: b, start: "top 75%", end: "center center", scrub: true } });
    });

    // compteurs
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => (el.textContent = (el.dataset.prefix || "") + (el.hasAttribute("data-sep") ? fmt(o.v) : Math.round(o.v))) });
    });

    // défilement horizontal des thèmes
    mm.add("(min-width: 761px)", () => {
      const pin = $(".themes__pin");
      if (!pin) return;
      const trackEl = $(".themes__track");
      const dist = () => trackEl.offsetLeft + trackEl.offsetWidth - innerWidth;
      gsap.to([$(".themes__intro"), trackEl], { x: () => -dist(), ease: "none", scrollTrigger: { trigger: ".themes", start: "top top", end: () => "+=" + dist(), pin, scrub: 0.8, invalidateOnRefresh: true } });
    });

    // galerie flottante
    mm.add("(min-width: 761px)", () => {
      $$(".float").forEach((f) => gsap.to(f, { yPercent: parseFloat(f.dataset.speed || 0) * -120, ease: "none", scrollTrigger: { trigger: ".gallery__field", start: "top bottom", end: "bottom top", scrub: true } }));
    });


    const big = $(".footer__big");
    if (big) gsap.from(big, { yPercent: 25, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 80%" } });
  }

  /* ---------- arrivée sur la page ---------- */
  function intro() {
    const heroIn = () => {
      document.body.classList.remove("is-loading");
      if (hasGsap) ScrollTrigger.refresh();
      if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) lenis ? lenis.scrollTo(t, { immediate: true }) : t.scrollIntoView(); }
      if (!hasGsap || reduce) return;
      gsap.from(".hero__title .word, .phero__title .word", { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: .08 });
      gsap.from(".hero__media img, .phero__media img", { scale: 1.12, duration: 1.6, ease: "expo.out" });
      gsap.from(".hero__inner > :not(h1), .phero__inner > :not(h1)", { opacity: 0, y: 14, duration: .8, stagger: .05, ease: "power3.out", delay: .2 });
    };
    // page préchargée en arrière-plan : on attend qu'elle soit vraiment affichée
    if (document.prerendering) document.addEventListener("prerenderingchange", heroIn, { once: true });
    else heroIn();
  }

  modals();
  forms();
  nav();
  quotes();
  lightbox();
  accordions();
  hover();
  topo();
  snow();
  scrollFx();
  goal();
  intro();
})();
