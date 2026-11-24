const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const build = require('../scripts/build-static.cjs');

test('cada alteração visual muda a versão dos arquivos e mantém dados internos fora da publicação', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'noah-build-'));
  try {
    for (const dir of ['css', 'js', 'assets', 'data']) fs.mkdirSync(path.join(root, dir));
    const html = '<head><link href="css/style.css?v=antigo"></head><script src="js/app.js?v=antigo"></script>';
    for (const file of ['index.html','card.html']) fs.writeFileSync(path.join(root,file),html);
    fs.writeFileSync(path.join(root,'css/style.css'),'body{color:blue}');
    fs.writeFileSync(path.join(root,'js/app.js'),'/* convite */');
    fs.writeFileSync(path.join(root,'data/privado.json'),'["não publicar"]');
    const first = build(root);
    const output = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
    assert.match(output,new RegExp('noah-build" content="'+first));
    assert.ok(output.includes('css/style.css?v='+first));
    assert.ok(output.includes('js/app.js?v='+first));
    assert.equal(fs.existsSync(path.join(root,'dist/data')),false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'dist/release.json'))).version,first);
    assert.equal(build(root),first);
    fs.writeFileSync(path.join(root,'css/style.css'),'body{color:pink}');
    const second = build(root);
    assert.notEqual(second,first);
    assert.ok(fs.readFileSync(path.join(root,'dist/index.html'),'utf8').includes('css/style.css?v='+second));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
