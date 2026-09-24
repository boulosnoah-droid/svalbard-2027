/**
 * Des Alpes à l'Arctique — le « cerveau » des formulaires du site.
 *
 * Ce script vit DANS une feuille Google Sheets du compte svalbardcsud@gmail.com
 * (menu Extensions → Apps Script). Mode d'emploi : README.md, « Brancher les formulaires ».
 *
 * Ce qu'il fait tout seul :
 *   • chaque don terminé sur le site (après le choix TWINT / virement) → une ligne dans l'onglet « Dons »
 *                                      + un e-mail à l'équipe
 *                                      + un e-mail au donateur avec les infos du moyen de paiement choisi
 *   • chaque message (contact, partenariat, livre) → une ligne dans « Messages » + un e-mail à l'équipe
 *                                      (répondre à cet e-mail répond directement à la personne)
 *   • quand vous mettez « Payé ? » sur « oui » → un e-mail « paiement bien reçu, merci » au donateur
 *   • l'onglet « Tableau de bord » calcule le total ; le site lit ce total pour remplir la jauge,
 *     et affiche le prénom des donateurs qui ont choisi « Avec mon nom » (les autres restent anonymes).
 */

// ---------- Réglages ----------
// Identifiant de la feuille Google Sheets (le long code entre /d/ et /edit dans son adresse).
// Nécessaire si le script a été créé depuis script.google.com (et non via Extensions → Apps Script).
const ID_FEUILLE = "1UD5Vt2jzG6nsdXw2XRJv63WZCDw-a3e3Y3qUJHskf7k";
const EQUIPE_EMAIL = "svalbardcsud@gmail.com";
const IBAN = "";               // ex. "CH12 3456 7890 1234 5678 9"
const TITULAIRE = "Association Des Alpes à l'Arctique";
const LIEN_TWINT = "";         // lien de paiement TWINT de l'association
const OBJECTIF = 40000;        // CHF
const SIGNATURE = "Les neuf élèves du Collège du Sud\nDes Alpes à l'Arctique — Svalbard 2027";

const COLONNES = {
  Dons: ["Date", "Montant (CHF)", "Type", "Prénom", "Nom", "Organisation", "E-mail", "Message",
         "Nom affiché ?", "Communication", "Payé ?", "Date du paiement", "Merci envoyé ?", "Moyen de paiement"],
  Messages: ["Date", "Type", "Nom", "E-mail", "Organisation", "Téléphone", "Détails", "Message", "Traité ?"],
};
const COL = { montant: 2, prenom: 4, email: 7, affiche: 9, ref: 10, paye: 11, datePaye: 12, merci: 13 };

/* =====================================================================
   1) À lancer UNE FOIS après avoir collé le script : prépare tout.
   ===================================================================== */
function installer() {
  const ss = classeur_();
  ["Dons", "Messages"].forEach((n) => { // (ré)écrit les titres des colonnes, y compris les nouvelles
    feuille_(n).getRange(1, 1, 1, COLONNES[n].length).setValues([COLONNES[n]]).setFontWeight("bold");
  });
  const oui = SpreadsheetApp.newDataValidation().requireValueInList(["non", "oui"], true).build();
  feuille_("Dons").getRange("K2:K").setDataValidation(oui);
  feuille_("Dons").getRange("M2:M").setDataValidation(oui);
  feuille_("Messages").getRange("I2:I").setDataValidation(oui);

  let tb = ss.getSheetByName("Tableau de bord");
  if (!tb) tb = ss.insertSheet("Tableau de bord", 0);
  tb.clear();
  tb.getRange("A1:A9").setValues([
    ["Tableau de bord — Des Alpes à l'Arctique"], [""], ["Objectif (CHF)"], ["Dons reçus sur le site (payés)"],
    ["Dons annoncés, pas encore reçus"], ["Autres recettes (ventes, dons en main propre…) → à écrire ici"],
    ["TOTAL RÉUNI (affiché sur le site)"], ["Nombre de dons reçus"], ["Progression"],
  ]);
  tb.getRange("B3").setValue(OBJECTIF);
  tb.getRange("B6").setValue(0);
  tb.getRange("A11").setValue("Les chiffres se mettent à jour tout seuls (calculés par le script, pas de formule).");
  tb.getRange("A11").setFontStyle("italic").setFontColor("#888888");
  majTableau_();
  tb.getRange("A1").setFontWeight("bold").setFontSize(14);
  tb.getRange("A7:B7").setFontWeight("bold");
  tb.getRange("B3:B7").setNumberFormat("#,##0 \"CHF\"");
  tb.getRange("B8").setNumberFormat("0");
  tb.getRange("B9").setNumberFormat("0%");
  tb.getRange("B6").setBackground("#fff5d6");
  tb.setColumnWidth(1, 420);

  // e-mail « paiement reçu » automatique quand on coche « Payé ? »
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("surModification").forSpreadsheet(ss).onEdit().create();
  Logger.log("Installation terminée ✓ — onglets créés dans : " + ss.getUrl());
}

/* =====================================================================
   2) Réception des formulaires du site (POST)
   ===================================================================== */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return json_({ ok: true }); // champ piège anti-robots
    if (!propre_(d.email) || trop_(d.email)) return json_({ ok: false });
    const date = new Date();

    if (d.kind === "don") {
      const montant = Math.max(0, Math.min(100000, Number(d.montant) || 0));
      const nomAffiche = d.nomPublic === "oui" ? "oui" : "non";
      feuille_("Dons").appendRow([date, montant, t_(d.type), t_(d.prenom), t_(d.nom), t_(d.organisation), t_(d.email),
        t_(d.message), nomAffiche, t_(d.reference), "non", "", "non", t_(d.methode)]);
      majTableau_();

      MailApp.sendEmail({
        to: EQUIPE_EMAIL,
        replyTo: d.email,
        subject: `Nouveau don : CHF ${montant} — ${d.prenom} ${d.nom} (${d.methode || "?"})`,
        body: `${d.prenom} ${d.nom}${d.organisation ? " (" + d.organisation + ")" : ""} annonce un don de CHF ${montant}.\n\n` +
              `E-mail : ${d.email}\nType : ${d.type}\nMoyen de paiement choisi : ${d.methode || "—"}\nCommunication de paiement : ${d.reference}\n` +
              `Nom affiché sur le site : ${nomAffiche}\nMessage : ${d.message || "—"}\n\n` +
              `Quand l'argent arrive (TWINT ou banque), mets « Payé ? » sur « oui » dans la feuille :\n` +
              `le donateur reçoit alors automatiquement un e-mail de remerciement.\n${classeur_().getUrl()}`,
      });

      MailApp.sendEmail({
        to: d.email,
        replyTo: EQUIPE_EMAIL,
        name: "Des Alpes à l'Arctique",
        subject: "Votre don pour le Svalbard : les informations pour finaliser ✳ Des Alpes à l'Arctique",
        body: `Bonjour ${d.prenom},\n\nUn immense merci pour votre don de CHF ${montant} à notre voyage d'étude au Svalbard !\n\n` +
              paiement_(d.reference, montant, d.methode) +
              `\n\nDès que votre paiement nous parvient, nous vous envoyons une confirmation.\n\n${SIGNATURE}`,
      });
    } else {
      const type = { contact: "Contact", partenariat: "Partenariat", livre: "Livre" }[d.kind] || "Autre";
      const details = d.kind === "livre" ? `${d.quantite || 1} exemplaire(s) · ${d.remise || ""}${d.adresse ? " · " + d.adresse : ""}`
        : d.kind === "partenariat" ? (d.soutien || "") : (d.sujet || "");
      feuille_("Messages").appendRow([date, type, t_(d.nom), t_(d.email), t_(d.organisation), t_(d.telephone), t_(details), t_(d.message), "non"]);
      MailApp.sendEmail({
        to: EQUIPE_EMAIL,
        replyTo: d.email,
        subject: `[Site] ${type} — ${d.organisation ? d.organisation + " / " : ""}${d.nom}`,
        body: `${type} via le site\n\nNom : ${d.nom}\nE-mail : ${d.email}\n` +
              (d.organisation ? `Organisation : ${d.organisation}\n` : "") + (d.telephone ? `Téléphone : ${d.telephone}\n` : "") +
              (details ? `Détails : ${details}\n` : "") + `\n${d.message || ""}\n\n(Répondre à cet e-mail répond directement à ${d.nom}.)`,
      });
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/* =====================================================================
   3) Chiffres lus par le site (GET) : total réuni + prénoms publics
   ===================================================================== */
function doGet() {
  const t = majTableau_(false); // lecture seule : les visites du site n'écrivent rien
  return json_({ raised: t.total, goal: OBJECTIF, donors: t.nbPayes, names: t.noms.slice(-60) });
}

/* =====================================================================
   4) Automatique : « Payé ? » passe à « oui » → e-mail de remerciement
   ===================================================================== */
function surModification(e) {
  const r = e.range, sh = r.getSheet();
  if (sh.getName() === "Tableau de bord" || sh.getName() === "Dons") majTableau_();
  if (sh.getName() !== "Dons" || r.getColumn() !== COL.paye || r.getRow() < 2) return;
  const row = sh.getRange(r.getRow(), 1, 1, COLONNES.Dons.length).getValues()[0];
  if (row[COL.paye - 1] !== "oui") return;
  if (!row[COL.datePaye - 1]) sh.getRange(r.getRow(), COL.datePaye).setValue(new Date());
  if (row[COL.merci - 1] === "oui" || !row[COL.email - 1]) return;
  MailApp.sendEmail({
    to: row[COL.email - 1],
    replyTo: EQUIPE_EMAIL,
    name: "Des Alpes à l'Arctique",
    subject: "Paiement bien reçu — merci ! ✳ Des Alpes à l'Arctique",
    body: `Bonjour ${row[COL.prenom - 1]},\n\nNous avons bien reçu votre don de CHF ${row[COL.montant - 1]}. ` +
          `Merci du fond du cœur : grâce à vous, le Svalbard se rapproche !\n\n${SIGNATURE}`,
  });
  sh.getRange(r.getRow(), COL.merci).setValue("oui");
}

/* ---------- Calcul du tableau de bord (sans formule : marche dans toutes les langues) ---------- */
function majTableau_(ecrire = true) {
  const ss = classeur_();
  const rows = feuille_("Dons").getDataRange().getValues().slice(1);
  let recu = 0, annonce = 0, nbPayes = 0; const noms = [];
  rows.forEach((r) => {
    const m = Number(r[COL.montant - 1]) || 0;
    if (r[COL.paye - 1] === "oui") {
      recu += m; nbPayes++;
      if (r[COL.affiche - 1] === "oui" && String(r[COL.prenom - 1]).trim()) noms.push(String(r[COL.prenom - 1]).trim());
    } else if (m) annonce += m;
  });
  const tb = ss.getSheetByName("Tableau de bord");
  const autres = tb ? Number(tb.getRange("B6").getValue()) || 0 : 0;
  const total = recu + autres;
  if (tb && ecrire) {
    tb.getRange("B4").setValue(recu);
    tb.getRange("B5").setValue(annonce);
    tb.getRange("B7").setValue(total);
    tb.getRange("B8").setValue(nbPayes);
    tb.getRange("B9").setValue(OBJECTIF > 0 ? total / OBJECTIF : 0);
  }
  return { total, recu, annonce, nbPayes, noms };
}

/* ---------- Tests depuis l'éditeur (bouton « Exécuter ») ---------- */
function testerUnDon() {
  doPost({ postData: { contents: JSON.stringify({
    kind: "don", montant: 1, type: "Particulier", prenom: "Test", nom: "Essai", email: EQUIPE_EMAIL,
    reference: "Don Svalbard 2027 – Test Essai", nomPublic: "non", methode: "TWINT",
  }) } });
}
function testerUnMessage() {
  doPost({ postData: { contents: JSON.stringify({ kind: "contact", nom: "Test", email: EQUIPE_EMAIL, sujet: "Test", message: "Ceci est un test." }) } });
}

/* ---------- outils ---------- */
function classeur_() {
  const ss = ID_FEUILLE ? SpreadsheetApp.openById(ID_FEUILLE) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Remplissez ID_FEUILLE en haut du script (identifiant de la feuille Google Sheets).");
  return ss;
}
function paiement_(ref, montant, methode) {
  const twint = LIEN_TWINT && `Par TWINT : ${LIEN_TWINT}\n(montant : CHF ${montant})`;
  const virement = IBAN && `Par virement bancaire :\nIBAN : ${IBAN}\nTitulaire : ${TITULAIRE}\nMontant : CHF ${montant}\nCommunication : ${ref}`;
  const choisi = /twint/i.test(methode || "") ? twint : /virement/i.test(methode || "") ? virement : null;
  if (choisi) return "Pour finaliser votre don :\n\n" + choisi +
    ((/twint/i.test(methode) ? virement : twint) ? "\n\nVous préférez l'autre moyen ?\n\n" + (/twint/i.test(methode) ? virement : twint) : "");
  const l = [twint, virement].filter(Boolean);
  return l.length ? "Pour finaliser votre don :\n\n" + l.join("\n\n")
    : "Notre compte est en cours d'ouverture : nous vous envoyons les coordonnées de paiement très bientôt.";
}
function feuille_(nom) {
  const ss = classeur_();
  let sh = ss.getSheetByName(nom);
  if (!sh) {
    sh = ss.insertSheet(nom);
    sh.appendRow(COLONNES[nom]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLONNES[nom].length).setFontWeight("bold");
  }
  return sh;
}
function t_(v) { return String(v == null ? "" : v).slice(0, 2000).replace(/^[=+\-@]/, "'$&"); } // pas de formules injectées
function propre_(m) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(m || "")); }
function trop_(email) { // limite : 5 envois par adresse et par heure
  const c = CacheService.getScriptCache(), k = "n_" + String(email).toLowerCase();
  const n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 3600);
  return n > 5;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
