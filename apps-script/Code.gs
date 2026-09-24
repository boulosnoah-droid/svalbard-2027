/**
 * Des Alpes à l'Arctique — réception des formulaires du site.
 *
 * Ce script vit DANS une feuille Google Sheets (menu Extensions → Apps Script).
 * Chaque formulaire envoyé sur le site :
 *   1. ajoute une ligne dans l'onglet « Dons » ou « Messages » (= l'historique) ;
 *   2. envoie un e-mail de notification à l'équipe ;
 *   3. (dons seulement) envoie un e-mail de remerciement au donateur, si activé.
 *
 * Mode d'emploi complet : README.md, section « Brancher les formulaires ».
 */

// ---------- Réglages ----------
const EQUIPE_EMAIL = "svalbardcsud@gmail.com";
const MERCI_AUTOMATIQUE = true;     // e-mail de remerciement automatique au donateur
const IBAN = "";                    // à remplir quand le compte existe (repris dans l'e-mail de remerciement)
const TITULAIRE = "Association Des Alpes à l'Arctique";

const COLONNES = {
  Dons: ["Date", "Montant (CHF)", "Type", "Prénom", "Nom", "Organisation", "E-mail", "Adresse",
         "Message", "Nom public ?", "Nouvelles ?", "Référence", "Payé ?", "Remercié ?"],
  Messages: ["Date", "Nom", "E-mail", "Sujet", "Message", "Traité ?"],
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return ok_(); // champ piège anti-robots rempli : on ignore
    const date = new Date();

    if (d.kind === "don") {
      feuille_("Dons").appendRow([date, Number(d.montant) || "", d.type, d.prenom, d.nom, d.organisation,
        d.email, d.adresse, d.message, d.nomPublic, d.nouvelles, d.reference, "non", "non"]);

      MailApp.sendEmail({
        to: EQUIPE_EMAIL,
        subject: `Nouveau don annoncé : CHF ${d.montant} — ${d.prenom} ${d.nom}`,
        body: `${d.prenom} ${d.nom}${d.organisation ? " (" + d.organisation + ")" : ""} annonce un don de CHF ${d.montant}.\n\n` +
              `E-mail : ${d.email}\nType : ${d.type}\nRéférence de paiement : ${d.reference}\n` +
              `Message : ${d.message || "—"}\nNom affiché publiquement : ${d.nomPublic}\n\n` +
              `Pense à cocher « Payé ? » dans la feuille quand l'argent arrive sur le compte.`,
      });

      if (MERCI_AUTOMATIQUE && d.email) {
        const paiement = IBAN
          ? `Virement : ${IBAN}\nTitulaire : ${TITULAIRE}\nCommunication : ${d.reference}\n\nOu par TWINT depuis notre site.`
          : `Notre compte bancaire est en cours d'ouverture : nous vous envoyons les coordonnées de paiement très bientôt.`;
        MailApp.sendEmail({
          to: d.email,
          replyTo: EQUIPE_EMAIL,
          name: "Des Alpes à l'Arctique",
          subject: "Merci pour votre soutien ✳ Des Alpes à l'Arctique",
          body: `Bonjour ${d.prenom},\n\nUn immense merci pour votre soutien de CHF ${d.montant} à notre voyage d'étude au Svalbard !\n\n` +
                `${paiement}\n\nNous vous tiendrons au courant de nos préparatifs et de notre voyage.\n\n` +
                `Les neuf élèves du Collège du Sud\nDes Alpes à l'Arctique — Svalbard 2027`,
        });
      }
    } else {
      feuille_("Messages").appendRow([date, d.nom, d.email, d.sujet, d.message, "non"]);
      MailApp.sendEmail({
        to: EQUIPE_EMAIL,
        replyTo: d.email,
        subject: `[Site] ${d.sujet} — ${d.nom}`,
        body: `${d.nom} (${d.email}) a écrit via le site :\n\n${d.message}\n\n(Répondre à cet e-mail répond directement à ${d.nom}.)`,
      });
    }
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

// Petit test depuis l'éditeur Apps Script (bouton « Exécuter » sur testerUnDon)
function testerUnDon() {
  doPost({ postData: { contents: JSON.stringify({
    kind: "don", montant: 1, type: "Particulier", prenom: "Test", nom: "Essai", email: EQUIPE_EMAIL,
    reference: "SVALBARD TE 0000", nomPublic: "non", nouvelles: "non",
  }) } });
}

function feuille_(nom) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nom);
  if (!sh) {
    sh = ss.insertSheet(nom);
    sh.appendRow(COLONNES[nom]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLONNES[nom].length).setFontWeight("bold");
  }
  return sh;
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
