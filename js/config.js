/* ==========================================================================
   RÉGLAGES DU SITE — c'est le seul fichier à modifier pour finir le site.
   ========================================================================== */
window.SITE_CONFIG = {
  // Adresse qui reçoit tous les messages
  email: "svalbardcsud@gmail.com",

  // Adresse du « Web App » Google Apps Script (voir apps-script/Code.gs et README.md).
  // Tant qu'elle est vide, les formulaires ouvrent un e-mail pré-rempli à la place.
  formEndpoint: "",

  // Coordonnées bancaires — à remplir dès que le compte est ouvert
  iban: "",                 // ex. "CH12 3456 7890 1234 5678 9"
  ibanHolder: "Association Des Alpes à l'Arctique",
  bank: "",                 // ex. "Banque Cantonale de Fribourg, Bulle"

  // TWINT : chemin vers l'image du QR code (ex. "assets/img/twint-qr.png")
  twintQr: "",

  // Collecte : objectif et montant déjà réuni (null = on n'affiche pas encore le montant)
  goal: 40000,
  raised: null,
};
