# Des Alpes à l'Arctique : site web

Site du voyage d'étude **Svalbard 2027** des neuf élèves du Collège du Sud (Bulle).
C'est un site statique (HTML, CSS et JS), fait pour être hébergé gratuitement sur **GitHub Pages**.

> **Statut : dépôt privé, site pas encore publié.**

## Contenu

```
index.html          Accueil
voyage.html         Le voyage : globe animé du trajet, objectifs, thèmes, retour
svalbard.html       Le Svalbard : chiffres, faits étonnants, climat, galerie de Daniel
equipe.html         L'équipe : élèves, encadrement, association
soutenir.html       Nous soutenir : objectif, dons, partenariats, livre, questions
credits.html        Crédits photos (obligatoires pour les photos sous licence libre)
css/style.css       le style
js/config.js        ⚙️ LES RÉGLAGES : e-mail, IBAN, TWINT, formulaires
js/layout.js        en-tête, menu, pied de page et fenêtres (contact, partenaire, livre, don), communs à toutes les pages
js/pay.js           fenêtre de don : TWINT, virement (carte en option)
js/globe.js         le globe du trajet (canvas : train → avions, puis loupe sur le bateau)
js/main.js          animations et formulaires
assets/img/         photos (© Daniel Rohrbasser + Wikimedia Commons, voir credits.html)
assets/geo/         contour détaillé du Svalbard (Natural Earth) pour le zoom du globe
apps-script/Code.gs le petit « serveur » gratuit (Google Sheets) : historique, e-mails, jauge
apps-script/test.js test hors ligne de Code.gs
```

## Ce qu'il reste à faire avant de publier

1. **Brancher Google Sheets** (10 minutes, une seule fois, voir plus bas) → `formEndpoint` dans `js/config.js`.
2. Quand le compte bancaire existe : `iban` et `bank` dans `js/config.js` **et** `IBAN` dans `apps-script/Code.gs` (pour l'e-mail de confirmation).
3. Quand l'association est inscrite chez TWINT : `twintLink` dans `js/config.js` **et** `LIEN_TWINT` dans `apps-script/Code.gs`.
4. Faire relire par Daniel les textes, les légendes et les faits de la page « Le Svalbard ».
5. Vérifier que toute l'équipe est d'accord pour que les noms soient publics. Il n'y a volontairement **aucune photo de groupe** sur le site.

Facultatif : `cardLink` (paiement par carte ou Apple Pay via Payrexx ou Stripe). Un onglet « Carte » apparaît alors tout seul.

## Comment marchent les dons (de A à Z)

1. Le donateur clique sur « Faire un don » (en haut de chaque page), choisit un montant, donne son nom et son e-mail, et choisit si son don apparaît **anonymement** (par défaut) ou **avec son prénom**.
2. **Automatique** : une ligne s'ajoute dans l'onglet « Dons » de la feuille Google Sheets, l'équipe reçoit un e-mail « Nouveau don annoncé », et le donateur reçoit un e-mail de confirmation avec le lien TWINT et l'IBAN.
3. Le donateur paie, sans quitter la fenêtre : **TWINT** (bouton, ou QR code sur ordinateur) ou **virement** (IBAN, montant et communication, chacun avec un bouton Copier).
4. **À faire par l'équipe** : quand l'argent arrive (dans l'app TWINT ou sur le relevé bancaire, grâce à la communication `Don Svalbard 2027 – Prénom Nom`), mettre **Payé ?** sur « oui » dans la feuille.
5. **Automatique** : le donateur reçoit un e-mail « Paiement bien reçu, merci ». L'onglet « Tableau de bord » recalcule le total, et la **jauge du site se met à jour toute seule**. Les prénoms des donateurs « avec mon nom » apparaissent sur la page Nous soutenir ; les anonymes, jamais.
6. Les recettes hors site (ventes de gâteaux, dons en main propre…) s'ajoutent dans la case jaune du « Tableau de bord ». Elles comptent aussi dans la jauge.

Le site ne peut pas savoir tout seul qu'un virement est arrivé : aucune banque ne le permet gratuitement. C'est pour ça qu'il y a la case « Payé ? ». C'est la seule action manuelle.

## Brancher les formulaires (Google Sheets)

**Pourquoi ?** Un site GitHub Pages ne peut pas envoyer d'e-mail ni garder de données. Google Apps Script sert de petit « serveur » gratuit : il reçoit les formulaires, les range dans une feuille Google Sheets et envoie les e-mails. **Tant que ce n'est pas branché, les formulaires affichent « l'envoi en ligne n'est pas encore activé ».**

1. Se connecter au compte Google **svalbardcsud@gmail.com**, puis créer une feuille Google Sheets, par exemple « Svalbard : dons et messages ».
2. Menu **Extensions → Apps Script**. Effacer le contenu, coller tout le fichier `apps-script/Code.gs`, puis enregistrer (icône disquette).
3. En haut, choisir la fonction **`installer`**, puis **Exécuter**. Google demande des autorisations (feuille et envoi d'e-mails) : **Autoriser**. Si « Google n'a pas validé cette application » s'affiche : *Paramètres avancés → Accéder au projet*. C'est normal, c'est votre propre script. Les onglets Dons, Messages et Tableau de bord se créent.
4. (Facultatif) Choisir **`testerUnDon`**, puis **Exécuter** : une ligne de test apparaît et deux e-mails arrivent dans la boîte svalbardcsud. Supprimer ensuite la ligne.
5. **Déployer → Nouveau déploiement → ⚙️ Application Web**, avec *Exécuter en tant que : moi* et *Qui a accès : Tout le monde*. Cliquer sur **Déployer**.
6. Copier l'**URL de l'application Web** (elle finit par `/exec`) et la coller dans `formEndpoint` de `js/config.js`. C'est terminé.

**Qui peut voir les dons ?** Seules les personnes qui ont accès à la feuille (le compte svalbardcsud, plus ceux avec qui vous la partagez via le bouton *Partager*). Onglet « Dons » : qui, combien, quand, payé ou pas. Onglet « Messages » : contacts, partenariats, réservations du livre. Les e-mails arrivent aussi dans la boîte svalbardcsud@gmail.com.

**Plusieurs comptes Google connectés dans Chrome ?** « Extensions → Apps Script » peut alors afficher « Impossible d'ouvrir le fichier ». Solution sans se déconnecter : ouvrir `https://script.google.com/home?authuser=N` (N = le numéro du compte, visible dans l'adresse du tableau : `.../spreadsheets/u/N/...`), vérifier l'avatar en haut à droite, cliquer sur **Nouveau projet**, coller le script et remplir `ID_FEUILLE` (le code entre `/d/` et `/edit` dans l'adresse du tableau). La suite est identique.

**Modifier le script plus tard** (par exemple pour ajouter l'IBAN) : le modifier dans Apps Script, puis *Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer*. L'URL ne change pas.

**Tester le script sans Google** : `node apps-script/test.js apps-script/Code.gs`.

## Voir le site en local

```bash
cd ~/Projets/Web/svalbard-2027 && python3 -m http.server 4173
```
puis ouvrir http://localhost:4173

## Publier le site

1. Rendre le dépôt public : GitHub → Settings → General → *Change visibility* → Public.
2. Settings → **Pages** → Source : *Deploy from a branch* → `main` / `(root)` → Save.
3. Environ une minute plus tard, le site est en ligne à `https://des-alpes-a-l-arctique.github.io/`.

### Changer l'adresse (URL)
- **Renommer le dépôt** : l'adresse devient `boulosnoah-droid.github.io/<nouveau-nom>/`.
- **Une organisation GitHub gratuite** (ex. `des-alpes-a-l-arctique`) : le site devient `des-alpes-a-l-arctique.github.io`, et il appartient au groupe plutôt qu'à Noah seul.
- **Un vrai nom de domaine**, par exemple `desalpesalarctique.ch` (environ CHF 10 à 20 par an chez un registraire suisse) : Settings → Pages → *Custom domain*, puis ajouter les enregistrements DNS indiqués par GitHub. Le HTTPS reste gratuit.

## Crédits
Photos © Daniel Rohrbasser, [artaventure.ch](https://artaventure.ch), et photos libres de Wikimedia Commons (auteurs et licences dans `credits.html` et `assets/credits.json`). Logo dessiné par un membre du groupe.
Polices : Archivo, Instrument Serif, JetBrains Mono (Google Fonts). Animations : GSAP, Lenis. Cartes : d3-geo, world-atlas, Natural Earth. QR codes : qrcode-generator.
