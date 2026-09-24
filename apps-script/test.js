// Test hors ligne du script Google Sheets (simule la feuille et les e-mails).
// Lancer : node apps-script/test.js apps-script/Code.gs
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const mails = [], sheets = {}, triggers = [], cache = {};
function Sheet(name) {
  this.name = name; this.rows = [];
  this.getName = () => name;
  this.appendRow = (r) => this.rows.push(r.slice());
  this.setFrozenRows = () => {};
  this.clear = () => { this.rows = []; this.cells = {}; };
  this.cells = {};
  const self = this;
  this.getRange = (a, b, c, d) => {
    if (typeof a === "string") {
      return { setValues(v) { self.cells[a] = v; }, setFontWeight() { return this; }, setFontSize() { return this; }, setNumberFormat() {}, setBackground() {}, setDataValidation() {},
        getValue() { // lecture de B7 : on calcule le total comme la formule
          const paid = sheets.Dons.rows.slice(1).filter((r) => r[10] === "oui").reduce((s, r) => s + r[1], 0); return paid + (self.other || 0); } };
    }
    const row = a, col = b, nr = c || 1, nc = d || 1;
    return {
      getValues: () => [self.rows[row - 1].slice(col - 1, col - 1 + nc)],
      setValue: (v) => { self.rows[row - 1][col - 1] = v; },
      setFontWeight() { return this; },
      getRow: () => row, getColumn: () => col, getSheet: () => self,
    };
  };
  this.getDataRange = () => ({ getValues: () => self.rows.map((r) => r.slice()) });
  this.setColumnWidth = () => {};
}
const ss = { getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => (sheets[n] = new Sheet(n)), getUrl: () => "https://docs.google.com/spreadsheets/d/TEST", toast: () => {} };
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ss, getActive: () => ss, newDataValidation: () => ({ requireValueInList() { return this; }, build() { return {}; } }) },
  MailApp: { sendEmail: (m) => mails.push(m) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: (k) => cache[k], put: (k, v) => (cache[k] = v) }) },
  ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return this; } }), MimeType: { JSON: "json" } },
  ScriptApp: { getProjectTriggers: () => triggers.slice(), deleteTrigger() {}, newTrigger: (fn) => ({ forSpreadsheet() { return this; }, onEdit() { return this; }, create() { triggers.push(fn); } }) },
  console,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], "utf8"), ctx);
const post = (o) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).s);

// 1) installation
ctx.installer();
assert(sheets.Dons && sheets.Messages && sheets["Tableau de bord"], "onglets créés");
assert.deepStrictEqual(triggers, ["surModification"], "déclencheur installé");
// 2) un don anonyme + un don avec nom
assert(post({ kind: "don", montant: 100, type: "Particulier", prenom: "Léa", nom: "Exemple", email: "lea@example.com", reference: "Don Svalbard 2027 – Léa Exemple", nomPublic: "non" }).ok);
assert(post({ kind: "don", montant: 250, type: "Entreprise", prenom: "Marc", nom: "Test", organisation: "=HACK()", email: "marc@example.com", reference: "Don Svalbard 2027 – Marc Test", nomPublic: "oui" }).ok);
assert.strictEqual(sheets.Dons.rows.length, 3, "2 dons enregistrés");
assert.strictEqual(sheets.Dons.rows[2][5], "'=HACK()", "formule neutralisée");
assert.strictEqual(mails.length, 4, "2 mails équipe + 2 mails donateurs");
assert(mails[1].to === "lea@example.com" && /compte est en cours d'ouverture/.test(mails[1].body), "confirmation donateur");
// 3) GET avant paiement : rien de payé
let g = JSON.parse(ctx.doGet().s); assert.strictEqual(g.raised, 0); assert.deepStrictEqual(g.names, []);
// 4) on coche « Payé ? » pour les deux → mails de merci, date, colonne Merci
[2, 3].forEach((row) => { sheets.Dons.rows[row - 1][10] = "oui"; ctx.surModification({ range: sheets.Dons.getRange(row, 11) }); });
assert.strictEqual(mails.length, 6, "2 mails « paiement reçu »");
assert(/bien reçu votre don de CHF 250/.test(mails[5].body));
assert.strictEqual(sheets.Dons.rows[1][12], "oui"); assert(Object.prototype.toString.call(sheets.Dons.rows[1][11]) === "[object Date]", "date du paiement");
// re-cocher ne renvoie pas de mail
ctx.surModification({ range: sheets.Dons.getRange(2, 11) }); assert.strictEqual(mails.length, 6, "pas de doublon");
// 5) GET après paiement : total 350, seul Marc (nom public) apparaît
g = JSON.parse(ctx.doGet().s);
assert.strictEqual(g.raised, 350); assert.strictEqual(g.donors, 2); assert.deepStrictEqual(g.names, ["Marc"]);
// 6) messages
assert(post({ kind: "livre", nom: "Anne", email: "anne@example.com", quantite: "2", remise: "Par la poste", adresse: "Rue 1, Bulle" }).ok);
assert(post({ kind: "partenariat", nom: "Paul", email: "paul@example.com", organisation: "Sport SA", soutien: "Don financier, Prêt de matériel" }).ok);
assert.strictEqual(sheets.Messages.rows.length, 3);
assert.strictEqual(sheets.Messages.rows[1][6], "2 exemplaire(s) · Par la poste · Rue 1, Bulle");
assert.strictEqual(mails[mails.length - 1].replyTo, "paul@example.com");
// 7) protections : e-mail invalide, robot, limite de 5/h
assert.strictEqual(post({ kind: "contact", nom: "x", email: "pas-un-mail" }).ok, false);
const before = sheets.Messages.rows.length; post({ kind: "contact", nom: "robot", email: "r@x.ch", website: "spam" });
assert.strictEqual(sheets.Messages.rows.length, before, "robot ignoré");
for (let i = 0; i < 6; i++) post({ kind: "contact", nom: "flood", email: "flood@x.ch", message: "m" });
assert.strictEqual(sheets.Messages.rows.filter((r) => r[2] === "flood").length, 5, "limite 5/h");
console.log("✓ tous les tests passent —", mails.length, "e-mails simulés");
