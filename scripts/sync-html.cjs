// index.html is the canonical, self-contained source for both distributions.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'));
const destination = path.join(root, 'Mgboard_Web.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(destination) || !source.equals(fs.readFileSync(destination))) {
    console.error('HTML files differ. Run npm run sync after editing index.html.');
    process.exit(1);
  }
  console.log('PASS: standalone HTML files are byte-identical.');
} else {
  fs.writeFileSync(destination, source);
  console.log('Updated Mgboard_Web.html from index.html.');
}
