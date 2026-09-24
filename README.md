# Des Alpes à l'Arctique : site web

Site du voyage d'étude **Svalbard 2027** des neuf élèves du Collège du Sud (Bulle).
C'est un site statique (HTML, CSS et JS), fait pour être hébergé gratuitement sur **GitHub Pages**.

> **Statut : dépôt privé, site pas encore publié.**

## Contenu

```
index.html          la page (toutes les sections)
css/style.css       le style
js/config.js        ⚙️ LES RÉGLAGES : e-mail, IBAN, TWINT, montant collecté, adresse du formulaire
js/main.js          animations et formulaires
assets/img/         photos (© Daniel Rohrbasser) et logo
apps-script/Code.gs le petit « serveur » gratuit qui garde l'historique des dons (Google Sheets)
```

## Ce qu'il reste à faire avant de publier

Tout se règle dans **`js/config.js`** :

- [ ] `iban` (et `bank`) : dès que le compte de l'association est ouvert.
- [ ] `twintQr` : déposer l'image du QR code dans `assets/img/twint-qr.png`, puis écrire `"assets/img/twint-qr.png"`.
- [ ] `formEndpoint` : l'adresse Google Apps Script (voir plus bas).
- [ ] `raised` : le montant déjà réuni, à mettre à jour de temps en temps (laisser `null` pour ne rien afficher).
- [ ] Faire relire les textes et les légendes des nouvelles photos par Daniel.
- [ ] Vérifier que toute l'équipe est d'accord pour que la photo de groupe et les prénoms soient publics.

## Brancher les formulaires (historique des dons et des messages)

Sans cette étape, les formulaires marchent déjà : ils ouvrent un e-mail pré-rempli vers `svalbardcsud@gmail.com`.
Avec cette étape, chaque don et chaque message est **enregistré automatiquement dans un tableur Google Sheets**, et l'équipe reçoit un e-mail.

1. Se connecter au compte Google **svalbardcsud@gmail.com**.
2. Créer une nouvelle feuille Google Sheets, par exemple « Svalbard : dons et messages ».
3. Menu **Extensions → Apps Script**, effacer le contenu, puis coller tout le fichier `apps-script/Code.gs`. Enregistrer.
4. Choisir la fonction `testerUnDon` en haut, puis cliquer sur **Exécuter**. Google demande les autorisations (accès à la feuille et envoi d'e-mails) : accepter. Un onglet « Dons » apparaît avec une ligne de test.
5. **Déployer → Nouveau déploiement → Type : Application Web**, avec *Exécuter en tant que : moi* et *Qui a accès : Tout le monde*. Cliquer sur **Déployer**.
6. Copier l'**URL de l'application Web** (elle finit par `/exec`) et la coller dans `formEndpoint` de `js/config.js`.

Pour voir qui a donné : il suffit d'ouvrir la feuille. Onglet **Dons** : date, montant, nom, e-mail, référence. Il faut cocher la colonne **Payé ?** quand le virement ou le TWINT arrive sur le compte, en comparant avec la **référence** (ex. `SVALBARD NB 2409`). La feuille peut être partagée avec Daniel ou avec les autres élèves (bouton Partager, en lecture seule).

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
Photos © Daniel Rohrbasser, [artaventure.ch](https://artaventure.ch). Logo dessiné par un membre du groupe.
Polices : Archivo, Instrument Serif, JetBrains Mono (Google Fonts). Animations : GSAP, Lenis, d3-contour.
