/* ==========================================================================
   RÉGLAGES DU SITE — c'est le seul fichier à modifier pour finir le site.
   ========================================================================== */
window.SITE_CONFIG = {
  // Adresse qui reçoit tous les messages
  email: "svalbardcsud@gmail.com",

  // Adresse du « Web App » Google Apps Script (voir apps-script/Code.gs et README.md).
  // C'est elle qui permet d'envoyer les formulaires, d'enregistrer les dons et de mettre
  // la jauge à jour toute seule. Tant qu'elle est vide, les formulaires affichent l'e-mail.
  formEndpoint: "",

  // ---- Paiement des dons -------------------------------------------------
  // Compte bancaire de l'association (pour le virement)
  iban: "",                 // ex. "CH12 3456 7890 1234 5678 9"
  bank: "",                 // ex. "Banque Cantonale de Fribourg"
  accountHolder: "Association Des Alpes à l'Arctique", // titulaire du compte
  // Lien de paiement TWINT (twint.ch → Clubs & associations → « lien de paiement »)
  twintLink: "",
  // Facultatif : lien de paiement par carte / Apple Pay (Payrexx, Stripe…)
  cardLink: "",

  // Collecte : objectif. Le montant réuni est lu automatiquement dans Google Sheets
  // (onglet « Tableau de bord ») dès que formEndpoint est rempli. « raised » ne sert
  // que si on veut forcer un montant à la main (null = automatique / masqué).
  goal: 40000,
  raised: null,
};
