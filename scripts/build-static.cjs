const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function buildStatic(root = path.resolve(__dirname, '..')) {
  const destination = path.join(root, 'dist');
  const runtimeFiles = ['index.html', 'card.html'];
  function collect(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const name = directory + '/' + entry.name;
      if (entry.isDirectory()) collect(name);
      else runtimeFiles.push(name);
    }
  }
  collect('css');
  collect('js');
  const hash = createHash('sha256');
  for (const file of runtimeFiles.sort()) hash.update(file).update('\0').update(fs.readFileSync(path.join(root, file))).update('\0');
  const version = hash.digest('hex').slice(0, 16);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination);
  for (const name of ['index.html', 'card.html', 'css', 'js', 'assets']) {
    fs.cpSync(path.join(root, name), path.join(destination, name), { recursive: true });
  }
  for (const entry of ['index.html', 'card.html']) {
    const file = path.join(destination, entry);
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace('</head>', `<meta name="noah-build" content="${version}">\n</head>`);
    html = html.replace(/((?:src|href)="(?:js|css)\/[^"?]+\.(?:js|css))(?:\?[^"\s]*)?"/g, `$1?v=${version}"`);
    fs.writeFileSync(file, html);
  }
  fs.writeFileSync(path.join(destination, 'release.json'), JSON.stringify({ version }) + '\n');
  return version;
}

if (require.main === module) console.log(`Convite ${buildStatic()} pronto em dist/; dados e backups ficam fora da publicação.`);
module.exports = buildStatic;
