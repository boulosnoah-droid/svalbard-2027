/* ==========================================================================
   RÉGLAGES DU SITE — c'est le seul fichier à modifier pour finir le site.
   ========================================================================== */
window.SITE_CONFIG = {
  // Adresse qui reçoit tous les messages
  email: "svalbardcsud@gmail.com",

  // Adresse du « Web App » Google Apps Script (voir apps-script/Code.gs et README.md).
  // Tant qu'elle est vide, les formulaires affichent l'adresse e-mail à la place.
  formEndpoint: "",

  // ---- Paiement des dons -------------------------------------------------
  // Compte bancaire de l'association (sert au virement ET au QR-facture suisse)
  iban: "",                 // ex. "CH12 3456 7890 1234 5678 9"
  bank: "",                 // ex. "Banque Cantonale de Fribourg"
  // Adresse de l'association : obligatoire pour générer le QR-facture suisse
  creditor: {
    name: "Association Des Alpes à l'Arctique",
    street: "",             // ex. "Rue de la Condémine"
    number: "",             // ex. "1"
    zip: "",                // ex. "1630"
    town: "",               // ex. "Bulle"
    country: "CH",
  },
  // Lien de paiement TWINT (twint.ch → Clubs & associations → « lien de paiement »)
  twintLink: "",
  // Facultatif : lien de paiement par carte / Apple Pay (Payrexx, Stripe…)
  cardLink: "",

  // Collecte : objectif et montant déjà réuni (null = on n'affiche pas encore le montant)
  goal: 40000,
  raised: null,
};
