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
js/config.js        ⚙️ LES RÉGLAGES : e-mail, IBAN, adresse, TWINT, montant collecté, formulaires
js/layout.js        en-tête, menu, pied de page et fenêtres (contact, partenaire, livre, don), communs à toutes les pages
js/pay.js           fenêtre de don : TWINT, QR-facture suisse, virement
js/globe.js         le globe du trajet (train → avions → bateau)
js/main.js          animations et formulaires
assets/img/         photos (© Daniel Rohrbasser + Wikimedia Commons, voir credits.html)
assets/geo/         contour détaillé du Svalbard (Natural Earth) pour le zoom du globe
apps-script/Code.gs le petit « serveur » gratuit qui garde l'historique (Google Sheets)
```

## Ce qu'il reste à faire avant de publier

Tout se règle dans **`js/config.js`** :

- [ ] `iban` et `bank` : dès que le compte de l'association est ouvert.
- [ ] `creditor` : l'adresse postale de l'association (rue, numéro, NPA, localité). Elle est obligatoire pour générer le **QR-facture suisse**.
- [ ] `twintLink` : le **lien de paiement TWINT** de l'association (twint.ch → Clubs & associations, environ 1,3 % de frais, inscription gratuite).
- [ ] `cardLink` (facultatif) : un lien de paiement par carte ou Apple Pay (Payrexx, Stripe…). Un onglet « Carte » apparaît alors tout seul dans la fenêtre de don.
- [ ] `formEndpoint` : l'adresse Google Apps Script (voir plus bas). Sans elle, les formulaires affichent l'adresse e-mail à copier.
- [ ] `raised` : le montant déjà réuni, à mettre à jour de temps en temps (laisser `null` pour ne rien afficher).
- [ ] Faire relire par Daniel les textes, les légendes et les faits de la page « Le Svalbard ».
- [ ] Vérifier que toute l'équipe est d'accord pour que les noms soient publics. Il n'y a volontairement **aucune photo de groupe** sur le site.

## Comment marchent les dons

1. Le donateur ouvre « Faire un don » (bouton présent sur toutes les pages), choisit un montant, puis laisse son nom et son e-mail.
2. Le don est enregistré comme **promesse** dans Google Sheets (onglet « Dons »), et l'équipe reçoit un e-mail.
3. Le donateur choisit comment payer, sans quitter la fenêtre :
   - **TWINT** : bouton vers le lien de paiement TWINT, ou QR à scanner sur ordinateur ;
   - **App bancaire** : QR-facture suisse généré avec le montant exact, lisible par toutes les banques suisses ;
   - **Virement** : IBAN, bénéficiaire, montant et communication, chacun avec un bouton Copier.
4. Quand l'argent arrive sur le compte ou sur TWINT, on coche **Payé ?** dans la feuille, en s'aidant de la communication (`Don Svalbard 2027 – Prénom Nom`).

## Brancher les formulaires (historique des dons et des messages)

**À faire avant la mise en ligne.** Sans cette étape, les formulaires ne peuvent pas envoyer : ils affichent l'adresse `svalbardcsud@gmail.com` à copier.
Avec cette étape, chaque don, message, demande de partenariat ou réservation du livre est **enregistré automatiquement dans un tableur Google Sheets**, et l'équipe reçoit un e-mail.

1. Se connecter au compte Google **svalbardcsud@gmail.com**.
2. Créer une nouvelle feuille Google Sheets, par exemple « Svalbard : dons et messages ».
3. Menu **Extensions → Apps Script**, effacer le contenu, puis coller tout le fichier `apps-script/Code.gs`. Enregistrer.
4. Choisir la fonction `testerUnDon` en haut, puis cliquer sur **Exécuter**. Google demande les autorisations (accès à la feuille et envoi d'e-mails) : accepter. Un onglet « Dons » apparaît avec une ligne de test.
5. **Déployer → Nouveau déploiement → Type : Application Web**, avec *Exécuter en tant que : moi* et *Qui a accès : Tout le monde*. Cliquer sur **Déployer**.
6. Copier l'**URL de l'application Web** (elle finit par `/exec`) et la coller dans `formEndpoint` de `js/config.js`.

Pour voir qui a donné : il suffit d'ouvrir la feuille. Onglet **Dons** : date, montant, nom, e-mail, référence. Onglet **Messages** : contacts, partenariats et livres. Il faut cocher la colonne **Payé ?** quand le virement ou le TWINT arrive sur le compte, en comparant avec la **référence** (ex. `Don Svalbard 2027 – Léa Exemple`). La feuille peut être partagée avec Daniel ou avec les autres élèves (bouton Partager, en lecture seule).

## Voir le site en local

```bash
cd ~/Projets/Web/svalbard-2027 && python3 -m http.server 4173
```
puis ouvrir http://localhost:4173

## Publier le site

1. Rendre le dépôt public : GitHub → Settings → General → *Change visibility* → Public.
2. Settings → **Pages** → Source : *Deploy from a branch* → `main` / `(root)` → Save.
3. Environ une minute plus tard, le site est en ligne à `https://boulosnoah-droid.github.io/svalbard-2027/`.

### Changer l'adresse (URL)
- **Renommer le dépôt** : l'adresse devient `boulosnoah-droid.github.io/<nouveau-nom>/`.
- **Une organisation GitHub gratuite** (ex. `des-alpes-a-l-arctique`) : le site devient `des-alpes-a-l-arctique.github.io`, et il appartient au groupe plutôt qu'à Noah seul.
- **Un vrai nom de domaine**, par exemple `desalpesalarctique.ch` (environ CHF 10 à 20 par an chez un registraire suisse) : Settings → Pages → *Custom domain*, puis ajouter les enregistrements DNS indiqués par GitHub. Le HTTPS reste gratuit.

## Crédits
Photos © Daniel Rohrbasser, [artaventure.ch](https://artaventure.ch), et photos libres de Wikimedia Commons (auteurs et licences dans `credits.html` et `assets/credits.json`). Logo dessiné par un membre du groupe.
Polices : Archivo, Instrument Serif, JetBrains Mono (Google Fonts). Animations : GSAP, Lenis. Cartes : d3-geo, world-atlas, Natural Earth. QR codes : qrcode-generator.
