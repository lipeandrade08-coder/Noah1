const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const quiz = require('../js/quiz');
test('14 personagens têm imagem real local e podem ser alcançados com as respostas', () => {
  assert.equal(quiz.questions.length, 14);
  assert.equal(Object.keys(quiz.characters).length, 14);
  for (const [id, character] of Object.entries(quiz.characters)) {
    assert.ok(!character.image.endsWith('.svg'));
    assert.ok(fs.existsSync(path.join(__dirname, '../assets/images', character.image)));
    const counts = {};
    const answers = quiz.questions.map(q => {
      const chosen = q.options.find(o => o[0] === id)?.[0] || [...q.options].sort((a,b) => (counts[a[0]] || 0) - (counts[b[0]] || 0))[0][0];
      counts[chosen] = (counts[chosen] || 0) + 1; return chosen;
    });
    assert.equal(quiz.result(answers), id);
  }
});
test('respostas incompletas ou incompatíveis não geram resultado e empate respeita a última preferência', () => {
  assert.equal(quiz.result([]), null);
  assert.equal(quiz.result(Array(8).fill('woody')), null);
  assert.equal(quiz.result(['woody','alien','slinky','buzz','hamm','buzz','hamm','alien','zurg','duke','betty','soldiers','dolly','mrsPotato']), 'alien');
});
