/* ==========================================================================
   Éléments communs à toutes les pages : en-tête, menu, pied de page,
   fenêtres (contact, partenariat, livre, don) et rideau de transition.
   Modifier ici = modifier partout.
   ========================================================================== */
(() => {
  const page = document.body.dataset.page || "";
  const email = (window.SITE_CONFIG || {}).email || "svalbardcsud@gmail.com";
  const links = [
    ["voyage.html", "voyage", "Le voyage"],
    ["svalbard.html", "svalbard", "Le Svalbard"],
    ["equipe.html", "equipe", "L'équipe"],
    ["soutenir.html", "soutenir", "Nous soutenir"],
  ];
  const nav = links.map(([href, id, label]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const menu = links.map(([href, id, label], i) => `<a href="${href}"${id === page ? ' aria-current="page"' : ""}><small>0${i + 1}</small>${label}</a>`).join("");

  const header = `
  <header class="nav">
    <a href="index.html" class="nav__brand" aria-label="Accueil — Des Alpes à l'Arctique">
      <img src="assets/img/logo-blanc.png" alt="">
      <span>Des Alpes<br><em>à l'Arctique</em></span>
    </a>
    <nav class="nav__links" aria-label="Navigation principale">${nav}</nav>
    <div class="nav__actions">
      <button class="btn btn--ghost btn--sm nav__contact" data-open="contact"><span>Contact</span></button>
      <button class="btn btn--accent btn--sm magnetic" data-open="don"><span>Faire un don</span></button>
      <button class="nav__burger" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span></button>
    </div>
  </header>
  <div class="menu" aria-hidden="true">
    <nav class="menu__links"><a href="index.html"${page === "accueil" ? ' aria-current="page"' : ""}><small>00</small>Accueil</a>${menu}</nav>
    <div class="menu__foot">
      <button class="btn btn--line" data-open="contact"><span>Nous écrire</span></button>
      <span class="mono">78°13′N · 15°38′E</span>
    </div>
  </div>`;

  const footer = `
  <footer class="footer">
    <a href="soutenir.html" class="footer__big">Rejoignez<br><em>l'aventure</em> <span class="arrow">↗</span></a>
    <div class="footer__grid">
      <img class="footer__logo" src="assets/img/logo-encre.png" alt="Logo Des Alpes à l'Arctique">
      <div><p class="mono">Association</p><p>Des Alpes à l'Arctique<br>Collège du Sud, Bulle</p></div>
      <div><p class="mono">Contact</p><p><button class="link" data-open="contact">${email}</button></p></div>
      <div><p class="mono">Pages</p><p>${links.map(([h, , l]) => `<a href="${h}">${l}</a>`).join("<br>")}</p></div>
    </div>
    <div class="footer__bottom mono"><span>© 2026 Des Alpes à l'Arctique</span><a href="credits.html">Crédits photos</a><button class="link" data-top>Haut de page ↑</button></div>
  </footer>`;

  const field = (name, label, attrs = "", wide = false) =>
    `<label class="field${wide ? " field--wide" : ""}"><span>${label}</span><input name="${name}" ${attrs}></label>`;
  const area = (name, label, req = false) =>
    `<label class="field field--wide"><span>${label}</span><textarea name="${name}" rows="4"${req ? " required" : ""}></textarea></label>`;
  const hp = `<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const privacy = `<p class="privacy">Vos données servent uniquement à vous répondre. Elles ne sont jamais partagées.</p>`;
  const done = (title, text) => `<div class="modal__done" hidden><span class="modal__check">✓</span><h3>${title}</h3><p>${text}</p><button type="button" class="btn btn--line" data-close><span>Fermer</span></button></div>`;

  const modals = `
  <dialog class="modal" id="modal-contact" aria-labelledby="t-contact">
    <button class="modal__x" data-close aria-label="Fermer">✕</button>
    <p class="mono modal__eyebrow">Contact</p>
    <h2 class="modal__title" id="t-contact">Écrivez-<em>nous</em></h2>
    <form class="modal__form" data-form="contact" novalidate>
      <div class="fields">
        ${field("nom", "Nom *", 'required autocomplete="name"')}
        ${field("email", "E-mail *", 'type="email" required autocomplete="email"')}
        <label class="field field--wide"><span>Sujet</span><select name="sujet">
          <option>Une question</option><option>Presse / médias</option><option>Une idée pour le voyage</option><option>Autre</option>
        </select></label>
        ${area("message", "Message *", true)}
      </div>${hp}${privacy}
      <button class="btn btn--accent btn--wide" type="submit"><span>Envoyer le message</span></button>
      <p class="form__status" role="status"></p>
    </form>
    ${done("Message envoyé", "Merci ! Nous vous répondons au plus vite.")}
  </dialog>

  <dialog class="modal" id="modal-partenaire" aria-labelledby="t-partenaire">
    <button class="modal__x" data-close aria-label="Fermer">✕</button>
    <p class="mono modal__eyebrow">Entreprises &amp; associations</p>
    <h2 class="modal__title" id="t-partenaire">Devenons <em>partenaires</em></h2>
    <p class="modal__lead">Dites-nous comment vous aimeriez nous accompagner : nous venons volontiers vous présenter le projet en personne.</p>
    <form class="modal__form" data-form="partenariat" novalidate>
      <div class="fields">
        ${field("organisation", "Entreprise / association *", 'required autocomplete="organization"', true)}
        ${field("nom", "Personne de contact *", 'required autocomplete="name"')}
        ${field("telephone", "Téléphone", 'type="tel" autocomplete="tel"')}
        ${field("email", "E-mail *", 'type="email" required autocomplete="email"', true)}
      </div>
      <fieldset class="checks"><legend>Nous aimerions…</legend>
        <label class="pill"><input type="checkbox" name="soutien" value="Don financier"><span>Faire un don financier</span></label>
        <label class="pill"><input type="checkbox" name="soutien" value="Prêt de matériel"><span>Prêter du matériel</span></label>
        <label class="pill"><input type="checkbox" name="soutien" value="Produits à revendre"><span>Offrir des produits à revendre</span></label>
        <label class="pill"><input type="checkbox" name="soutien" value="Rencontre"><span>Vous rencontrer</span></label>
      </fieldset>
      <div class="fields">${area("message", "Message")}</div>${hp}${privacy}
      <button class="btn btn--accent btn--wide" type="submit"><span>Envoyer</span></button>
      <p class="form__status" role="status"></p>
    </form>
    ${done("Merci pour votre intérêt !", "Nous revenons vers vous très vite pour en discuter.")}
  </dialog>

  <dialog class="modal" id="modal-livre" aria-labelledby="t-livre">
    <button class="modal__x" data-close aria-label="Fermer">✕</button>
    <p class="mono modal__eyebrow">Le livre</p>
    <h2 class="modal__title" id="t-livre">« Dans la trace <em>des ours blancs</em> »</h2>
    <p class="modal__lead">Le livre de Daniel Rohrbasser, vendu au profit de notre voyage d'étude. Laissez-nous vos coordonnées : nous vous recontactons pour la remise et le paiement.</p>
    <form class="modal__form" data-form="livre" novalidate>
      <div class="fields">
        ${field("nom", "Nom *", 'required autocomplete="name"')}
        ${field("email", "E-mail *", 'type="email" required autocomplete="email"')}
        <label class="field"><span>Nombre d'exemplaires</span><input name="quantite" type="number" min="1" max="20" value="1" inputmode="numeric"></label>
        <label class="field"><span>Remise</span><select name="remise"><option>En main propre (Bulle et environs)</option><option>Par la poste</option></select></label>
        ${field("adresse", "Adresse (si envoi par la poste)", 'autocomplete="street-address"', true)}
      </div>${hp}${privacy}
      <button class="btn btn--accent btn--wide" type="submit"><span>Réserver mon exemplaire</span></button>
      <p class="form__status" role="status"></p>
    </form>
    ${done("C'est noté !", "Merci ! Nous vous recontactons pour la remise du livre.")}
  </dialog>

  <dialog class="modal modal--don" id="modal-don" aria-labelledby="t-don">
    <button class="modal__x" data-close aria-label="Fermer">✕</button>
    <p class="mono modal__eyebrow">Soutenir le voyage</p>
    <h2 class="modal__title" id="t-don">Faire un <em>don</em></h2>
    <ol class="steps mono" aria-hidden="true"><li class="is-on">Montant</li><li>Vos infos</li><li>Paiement</li></ol>
    <form class="modal__form" data-form="don" novalidate>
      <fieldset class="step is-on" data-step="1">
        <legend class="sr">Montant</legend>
        <div class="chips">
          ${[50, 100, 250, 500].map((v) => `<label><input type="radio" name="montant" value="${v}"${v === 100 ? " checked" : ""}><span>CHF ${v}</span></label>`).join("")}
          <label><input type="radio" name="montant" value="autre"><span>Autre</span></label>
        </div>
        <label class="field field--amount" hidden><span>Montant libre (CHF)</span><input type="number" name="montantLibre" min="5" step="1" inputmode="numeric" placeholder="ex. 75"></label>
        <p class="mono chips__label">Je donne en tant que</p>
        <div class="chips chips--small">
          <label><input type="radio" name="type" value="Particulier" checked><span>Particulier</span></label>
          <label><input type="radio" name="type" value="Entreprise"><span>Entreprise</span></label>
          <label><input type="radio" name="type" value="Association"><span>Association</span></label>
        </div>
        <button type="button" class="btn btn--accent btn--wide" data-next><span>Continuer</span></button>
      </fieldset>

      <fieldset class="step" data-step="2">
        <legend class="sr">Vos coordonnées</legend>
        <div class="fields">
          ${field("prenom", "Prénom *", 'required autocomplete="given-name"')}
          ${field("nom", "Nom *", 'required autocomplete="family-name"')}
          <label class="field field--wide" data-org hidden><span>Entreprise / association</span><input name="organisation" autocomplete="organization"></label>
          ${field("email", "E-mail * (pour votre confirmation)", 'type="email" required autocomplete="email"', true)}
          ${area("message", "Un mot pour l'équipe ? (facultatif)")}
        </div>
        <label class="check"><input type="checkbox" name="public" value="oui"><span>J'accepte que mon nom apparaisse parmi nos soutiens.</span></label>
        ${hp}
        <p class="privacy">Vos données servent uniquement à vous remercier et à suivre les dons. Elles ne sont jamais partagées.</p>
        <div class="step__actions">
          <button type="button" class="btn btn--ghost" data-prev><span>Retour</span></button>
          <button type="submit" class="btn btn--accent"><span>Passer au paiement</span></button>
        </div>
        <p class="form__status" role="status"></p>
      </fieldset>

      <fieldset class="step" data-step="3">
        <legend class="sr">Paiement</legend>
        <p class="pay__lead">Merci <b data-thanks-name></b> ! Choisissez comment verser votre don de <b data-thanks-amount></b>&nbsp;:</p>
        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tab is-on" data-tab="twint">TWINT</button>
          <button type="button" role="tab" class="tab" data-tab="qr">App bancaire</button>
          <button type="button" role="tab" class="tab" data-tab="virement">Virement</button>
          <button type="button" role="tab" class="tab" data-tab="carte" hidden>Carte</button>
        </div>
        <div class="panel is-on" data-panel="twint"></div>
        <div class="panel" data-panel="qr"></div>
        <div class="panel" data-panel="virement"></div>
        <div class="panel" data-panel="carte"></div>
        <div class="step__actions">
          <button type="button" class="btn btn--ghost" data-prev><span>Modifier</span></button>
          <button type="button" class="btn btn--accent" data-close><span>Terminé</span></button>
        </div>
      </fieldset>
    </form>
  </dialog>`;

  const top = document.getElementById("site-header");
  const bottom = document.getElementById("site-footer");
  if (top) top.outerHTML = header;
  if (bottom) bottom.outerHTML = footer + modals;
})();
