const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'dist');
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination);
for (const name of ['index.html', 'card.html', 'css', 'js', 'assets']) {
  fs.cpSync(path.join(root, name), path.join(destination, name), { recursive: true });
}
console.log('Convite pronto em dist/; dados, backups e código do servidor ficam fora da publicação.');
