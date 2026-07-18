const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath} fehlt.`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

const heroPath = path.join(root, 'hero.jpg');
if (!fs.existsSync(heroPath)) {
  failures.push('hero.jpg fehlt. Das zentrale Hero-Bild darf nur bewusst entfernt werden.');
} else if (fs.statSync(heroPath).size < 10_000) {
  failures.push('hero.jpg ist unerwartet klein und vermutlich beschädigt.');
}

const homepageHeroCss = read('css/hero-restore.css');
if (homepageHeroCss && !homepageHeroCss.includes('/hero.jpg')) {
  failures.push('css/hero-restore.css verweist nicht mehr auf /hero.jpg.');
}

const subpageHeroCss = read('css/subpage-hero.css');
if (subpageHeroCss && !subpageHeroCss.includes('/hero.jpg')) {
  failures.push('css/subpage-hero.css verweist nicht mehr auf /hero.jpg.');
}

const navbar = read('navbar.html');
if (navbar && !navbar.includes('/css/subpage-hero.css')) {
  failures.push('navbar.html lädt den gemeinsamen Unterseiten-Hero nicht mehr.');
}

if (failures.length > 0) {
  console.error('\nHero-Schutz fehlgeschlagen:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nEine bewusste Hero-Änderung muss Bild, CSS und diesen Schutz gemeinsam aktualisieren.\n');
  process.exit(1);
}

console.log('Hero-Schutz: hero.jpg und alle zentralen Verweise sind vorhanden.');
