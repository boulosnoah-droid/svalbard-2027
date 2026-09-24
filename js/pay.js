/* ==========================================================================
   Dons : fenêtre en 3 étapes + moyens de paiement
   (TWINT, virement, carte en option).
   ========================================================================== */
window.SvalbardPay = (() => {
  const CFG = window.SITE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Math.round(n).toLocaleString("fr-CH").replace(/ |\s/g, "'");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- QR code (bibliothèque qrcode-generator) ---------- */
  function qrSvg(text) {
    if (typeof qrcode === "undefined") return "";
    qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s)); // UTF-8
    const qr = qrcode(0, "M");
    qr.addData(text, "Byte");
    qr.make();
    const n = qr.getModuleCount(), q = 2, size = n + q * 2;
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  const soon = (what) => `<div class="pay__soon"><span>Bientôt disponible</span><p>${what} sera activé dès l'ouverture du compte de l'association. En attendant, votre promesse de don est bien enregistrée : nous vous recontactons par e-mail.</p></div>`;
  const copyRow = (label, value) => `<div class="copyrow"><span class="mono">${label}</span><b>${esc(value)}</b><button type="button" class="copy" data-copy="${esc(value)}">Copier</button></div>`;
  const isPhone = () => matchMedia("(max-width: 760px), (pointer: coarse)").matches;

  function fillPanels(form, d) {
    const msg = `Don Svalbard 2027 – ${d.prenom} ${d.nom}`;
    // TWINT
    $('[data-panel="twint"]', form).innerHTML = CFG.twintLink
      ? `<div class="pay__twint">
          ${isPhone() ? "" : `<div class="pay__qr">${qrSvg(CFG.twintLink)}</div>`}
          <div><p>${isPhone() ? "Ouvrez TWINT en un geste :" : "Scannez ce code avec l'app TWINT, ou ouvrez la page de paiement :"}</p>
          <a class="btn btn--accent" href="${esc(CFG.twintLink)}" target="_blank" rel="noopener"><span>Payer CHF ${fmt(d.montant)} avec TWINT ↗</span></a>
          <p class="pay__hint">Indiquez le montant de <b>CHF ${fmt(d.montant)}</b> si l'app vous le demande.</p></div></div>`
      : soon("Le paiement TWINT");
    // Virement
    $('[data-panel="virement"]', form).innerHTML = CFG.iban
      ? `<div class="copyrows">${copyRow("IBAN", CFG.iban)}${copyRow("Bénéficiaire", CFG.accountHolder || "Association Des Alpes à l'Arctique")}${copyRow("Montant", "CHF " + Number(d.montant).toFixed(2))}${copyRow("Communication", msg)}</div>${CFG.bank ? `<p class="pay__hint">${esc(CFG.bank)}</p>` : ""}`
      : soon("Le virement");
    // Carte (facultatif)
    const cardTab = $('[data-tab="carte"]', form);
    cardTab.hidden = !CFG.cardLink;
    $('[data-panel="carte"]', form).innerHTML = CFG.cardLink
      ? `<p>Carte de crédit, Apple Pay ou Google Pay, sur une page de paiement sécurisée :</p><a class="btn btn--accent" href="${esc(CFG.cardLink)}" target="_blank" rel="noopener"><span>Payer par carte ↗</span></a>`
      : "";
    $$(".copy", form).forEach((b) => b.addEventListener("click", () => {
      const t = b.textContent;
      const ok = () => { b.textContent = "Copié ✓"; b.classList.add("is-done"); setTimeout(() => { b.textContent = t; b.classList.remove("is-done"); }, 1600); };
      navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy.replace(/^CH\d{2}[\d\s]+$/, (s) => s.replace(/\s/g, ""))).then(ok, ok) : ok();
    }));
  }

  function init(send, validate) {
    const form = $('[data-form="don"]');
    if (!form) return;
    const dialog = form.closest("dialog");
    const steps = $$(".step", form), dots = $$(".steps li", dialog);
    const go = (n) => {
      steps.forEach((s) => s.classList.toggle("is-on", +s.dataset.step === n));
      dots.forEach((d, i) => d.classList.toggle("is-on", i < n));
      dialog.scrollTop = 0;
    };
    const amountField = $(".field--amount", form), org = $("[data-org]", form);
    form.addEventListener("change", (e) => {
      if (e.target.name === "montant") { amountField.hidden = e.target.value !== "autre"; if (!amountField.hidden) form.montantLibre.focus(); }
      if (e.target.name === "type") org.hidden = e.target.value === "Particulier";
    });
    const amount = () => (form.montant.value === "autre" ? Math.max(0, parseInt(form.montantLibre.value, 10) || 0) : +form.montant.value);
    $("[data-next]", form).addEventListener("click", () => {
      if (amount() < 1) { form.montantLibre.classList.add("is-invalid"); form.montantLibre.focus(); return; }
      form.montantLibre.classList.remove("is-invalid");
      go(2);
    });
    $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => go(+b.closest(".step").dataset.step - 1)));
    $$(".tab", form).forEach((t) => t.addEventListener("click", () => {
      $$(".tab", form).forEach((x) => x.classList.toggle("is-on", x === t));
      $$(".panel", form).forEach((p) => p.classList.toggle("is-on", p.dataset.panel === t.dataset.tab));
    }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = $('[data-step="2"] .form__status', form);
      status.textContent = "";
      if (form.website.value) return;
      if (!validate($('[data-step="2"]', form))) { status.textContent = "Merci de remplir les champs marqués d'une *."; return; }
      const d = {
        montant: amount(), type: form.type.value, prenom: form.prenom.value.trim(), nom: form.nom.value.trim(),
        organisation: form.organisation.value.trim(), email: form.email.value.trim(), message: form.message.value.trim(),
        nomPublic: form.affichage.value === "nom" ? "oui" : "non",
      };
      d.reference = `Don Svalbard 2027 – ${d.prenom} ${d.nom}`;
      d.affichage = form.affichage.value; // "anonyme" ou "nom"
      const btn = $('button[type="submit"]', form); btn.disabled = true;
      const saved = await send("don", d).then(() => true, () => false);
      $("[data-pay-mail]", form).textContent = saved
        ? `Un e-mail de confirmation avec ces informations vient de vous être envoyé à ${d.email}.`
        : "Mode test : l'enregistrement des dons n'est pas encore activé sur ce site.";
      btn.disabled = false;
      $("[data-thanks-name]", form).textContent = d.prenom;
      $("[data-thanks-amount]", form).textContent = "CHF " + fmt(d.montant);
      fillPanels(form, d);
      go(3);
    });
    dialog.addEventListener("close", () => { if ($('[data-step="3"]', form).classList.contains("is-on")) { form.reset(); amountField.hidden = true; org.hidden = true; go(1); } });
  }

  return { init, qrSvg };
})();
