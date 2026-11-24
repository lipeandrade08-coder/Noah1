const NoahQuiz = (() => {
  const characters = {
    woody: { name: 'Woody', image: 'woody-1.jpg', traits: ['Lealdade', 'Coragem', 'Liderança'], description: 'Você cuida da turma, une os amigos e não deixa ninguém para trás. Como o xerife Woody, transforma amizade em uma grande aventura!', mission: 'Reunir seus parceiros para comemorar o primeiro aninho do Noah.' },
    buzz: { name: 'Buzz Lightyear', image: 'buzz-toy-story.jpg', traits: ['Aventura', 'Determinação', 'Imaginação'], description: 'Seu olhar vai sempre além! Você gosta de descobrir coisas novas e encara desafios com entusiasmo de patrulheiro espacial.', mission: 'Trazer sua energia de explorador para a aventura do Noah.' },
    jessie: { name: 'Jessie', image: 'jessie-toy-story.jpg', traits: ['Alegria', 'Energia', 'Coragem'], description: 'Você contagia quem está por perto, entra nas brincadeiras e encontra um motivo para celebrar cada conquista. Iupi-i-o!', mission: 'Espalhar alegria e celebrar cada sorriso do aniversariante.' },
    rex: { name: 'Rex', image: 'rex-toy-story.jpg', traits: ['Gentileza', 'Diversão', 'Superação'], description: 'Às vezes bate um frio na barriga, mas seu coração é gigante. Você prova que coragem também é tentar, mesmo com um pouquinho de medo!', mission: 'Participar das brincadeiras no seu ritmo e compartilhar bons momentos.' },
    alien: { name: 'Alien do Pizza Planet', image: 'aliens-toy-story.jpg', traits: ['Curiosidade', 'União', 'Encantamento'], description: 'Você percebe os pequenos detalhes e adora descobrir surpresas junto da turma. Uma novidade e seus olhos já brilham: ooooh!', mission: 'Descobrir os detalhes do convite e guardar lembranças com a turma.' },
    slinky: { name: 'Slinky', image: 'slinky-toy-story.jpg', traits: ['Companheirismo', 'Paciência', 'Confiança'], description: 'Você é aquele amigo com quem todo mundo pode contar. Escuta, ajuda e sempre encontra um jeito de manter a turma unida.', mission: 'Ficar pertinho dos amigos e esticar a diversão com o Noah.' },
    hamm: { name: 'Hamm', image: 'porquinho-toy-story.jpg', traits: ['Esperteza', 'Bom humor', 'Praticidade'], description: 'Você pensa rápido, tem boas ideias e sempre encontra uma saída criativa. E ainda consegue arrancar uma risada da turma!', mission: 'Compartilhar suas melhores ideias e seu bom humor na comemoração.' },
    potato: { name: 'Sr. Cabeça de Batata', image: 'Cabeca-de-Batata-toy-story.jpg', traits: ['Personalidade', 'Criatividade', 'Sinceridade'], description: 'Seu jeito é único! Você gosta de dar um toque pessoal em tudo, fala o que pensa e diverte os amigos com suas combinações inesperadas.', mission: 'Trazer seu jeito especial para a turma do pequeno xerife.' },
    zurg: { name: 'Imperador Zurg', image: 'quiz/zurg.jpg', traits: ['Determinação', 'Estratégia', 'Presença'], description: 'Você entra na brincadeira com presença de sobra, gosta de grandes planos e adora um desafio digno de uma aventura espacial. Aqui, toda essa energia vira diversão!', mission: 'Trocar os planos de dominar a galáxia por um dia de alegria com o Noah.' },
    soldiers: { name: 'Soldadinhos Verdes', image: 'quiz/soldados.jpg', traits: ['Organização', 'Cooperação', 'Atenção'], description: 'Missão dada é missão em equipe! Você gosta de combinar o plano, prestar atenção nos detalhes e ajudar cada amigo a encontrar seu lugar.', mission: 'Convocar a turma para comemorar junto do pequeno xerife.' },
    betty: { name: 'Betty (Bo Peep)', image: 'quiz/betty.jpg', traits: ['Independência', 'Criatividade', 'Coragem'], description: 'Você encontra seus próprios caminhos, improvisa com confiança e sabe que delicadeza e força podem caminhar juntas. Nenhuma aventura limita sua imaginação!', mission: 'Inspirar a turma a descobrir novas formas de brincar com o Noah.' },
    dolly: { name: 'Dolly', image: 'quiz/dolly.jpg', traits: ['Acolhimento', 'Equilíbrio', 'Responsabilidade'], description: 'Você recebe todo mundo com carinho e sabe colocar ordem na bagunça sem perder a ternura. Seu jeito faz qualquer grupo se sentir em casa.', mission: 'Acolher os amigos e ajudar a criar lembranças cheias de carinho.' },
    mrsPotato: { name: 'Sra. Cabeça de Batata', image: 'quiz/sra-batata.jpg', traits: ['Cuidado', 'Afeto', 'Generosidade'], description: 'Você pensa no bem-estar de todos e tem sempre um carinho extra para oferecer. Seu superpoder é fazer os amigos se sentirem queridos e protegidos.', mission: 'Distribuir carinho e celebrar o primeiro aninho do Noah com a família.' },
    duke: { name: 'Duke Caboom', image: 'quiz/duke-caboom.jpg', traits: ['Ousadia', 'Entusiasmo', 'Persistência'], description: 'Você gosta de movimento, sonha alto e tenta de novo quando algo não sai como imaginou. Sua energia transforma cada conquista em uma grande comemoração!', mission: 'Levar seu entusiasmo para as brincadeiras e torcer pelas conquistas do Noah.' }

  };
  const questions = [
    { text: 'Quando você chega a uma festa, o que faz primeiro?', options: [['woody','Reúno os amigos para ninguém ficar de fora.'],['buzz','Exploro o lugar e descubro tudo o que tem por lá.'],['jessie','Entro na animação e chamo a turma para brincar.'],['rex','Observo um pouco até me sentir à vontade.']] },
    { text: 'Qual dessas pequenas alegrias combina mais com você?', options: [['slinky','Estar junto de quem eu gosto.'],['hamm','Encontrar uma solução esperta para um problema.'],['potato','Inventar algo com a minha cara.'],['alien','Descobrir uma surpresa escondida.']] },
    { text: 'Um amigo ficou de fora da brincadeira. Você…', options: [['woody','Organizo a turma para incluir esse amigo.'],['jessie','Invento uma brincadeira animada para todo mundo.'],['slinky','Fico ao lado dele e faço companhia.'],['potato','Digo o que penso e defendo o amigo do meu jeito.']] },
    { text: 'Escolha uma aventura para passar a tarde:', options: [['buzz','Uma missão espacial cheia de descobertas.'],['rex','Um jogo divertido para superar meus próprios desafios.'],['hamm','Um enigma que precisa de uma boa estratégia.'],['alien','Uma exploração em grupo atrás de pistas misteriosas.']] },
    { text: 'Quando um plano dá errado, como você reage?', options: [['woody','Tomo a frente e ajudo a turma a se organizar.'],['rex','Respiro fundo e tento mais uma vez.'],['potato','Improviso uma alternativa bem diferente.'],['hamm','Analiso a situação e penso num plano mais prático.']] },
    { text: 'Qual presente imaginário você escolheria?', options: [['buzz','Uma nave para conhecer lugares novos.'],['jessie','Um dia inteiro de dança, movimento e brincadeiras.'],['slinky','Um passeio tranquilo com meus melhores amigos.'],['alien','Uma caixa misteriosa para abrir junto da turma.']] },
    { text: 'Qual é a sua maior força em uma equipe?', options: [['woody','Inspirar confiança e cuidar de todos.'],['buzz','Ter determinação para chegar mais longe.'],['hamm','Pensar rápido e fazer a turma rir.'],['slinky','Escutar e ajudar com paciência.']] },
    { text: 'Que lembrança você quer levar da festa do Noah?', options: [['jessie','A alegria de brincar e celebrar sem parar.'],['rex','A felicidade de ter participado e me divertido.'],['potato','Os momentos engraçados e cheios de personalidade.'],['alien','Cada detalhe surpreendente que descobri com a turma.']] },
    { text: 'Como você prepararia uma missão surpresa para a turma?', options: [['zurg','Criaria um plano grandioso, com uma entrada marcante.'],['soldiers','Dividiria as tarefas e combinaria tudo com a equipe.'],['betty','Encontraria um caminho criativo que ninguém imaginou.'],['dolly','Organizaria tudo para que cada amigo se sentisse bem.']] },
    { text: 'Qual papel você escolheria em uma grande aventura?', options: [['mrsPotato','Cuidar para que ninguém precise de nada.'],['duke','Encarar um desafio de movimento e tentar até conseguir.'],['zurg','Planejar a próxima reviravolta da história.'],['soldiers','Prestar atenção no caminho e ajudar o grupo a avançar.']] },
    { text: 'Um amigo novo chegou à turma. Como você o recebe?', options: [['betty','Mostro que ele pode inventar seu próprio jeito de brincar.'],['dolly','Apresento os amigos e ajudo ele a se sentir em casa.'],['mrsPotato','Ofereço carinho e pergunto se está tudo bem.'],['duke','Comemoro a chegada e convido para uma aventura.']] },
    { text: 'Qual seria seu acessório de brinquedo favorito?', options: [['zurg','Uma capa espacial para fazer uma entrada inesquecível.'],['soldiers','Um rádio para combinar as missões com a equipe.'],['betty','Um cajado para inventar mil formas de explorar.'],['mrsPotato','Uma bolsa com tudo que os amigos podem precisar.']] },
    { text: 'Que tipo de desafio faz seus olhos brilharem?', options: [['dolly','Transformar uma bagunça em uma brincadeira para todos.'],['duke','Aprender um movimento novo, com cuidado e persistência.'],['zurg','Criar uma estratégia para um jogo cheio de reviravoltas.'],['betty','Encontrar uma saída diferente para uma situação difícil.']] },
    { text: 'O que nunca pode faltar na sua turma?', options: [['soldiers','Cooperação e um plano feito em conjunto.'],['dolly','Um lugar acolhedor para todo mundo participar.'],['mrsPotato','Carinho e atenção aos pequenos detalhes.'],['duke','Entusiasmo para comemorar cada tentativa e conquista.']] }

  ];
  function result(answers) {
    if (answers.length !== questions.length || answers.some((id, i) => !questions[i].options.some(option => option[0] === id))) return null;
    const scores = {};
    answers.forEach(id => { scores[id] = (scores[id] || 0) + 1; });
    const highest = Math.max(...Object.values(scores));
    // Em empate, a preferência mais recente evita favorecer sempre o primeiro personagem.
    return [...answers].reverse().find(id => scores[id] === highest);
  }
  return { characters, questions, result };
})();
if (typeof module === 'object' && module.exports) module.exports = NoahQuiz;

function initQuizToyStory() {
  const { characters, questions, result } = NoahQuiz;
  const panel = document.getElementById('quiz-question-panel');
  const heading = document.getElementById('quiz-question');
  const options = document.getElementById('quiz-options');
  const counter = document.getElementById('quiz-step-count');
  const progress = document.getElementById('quiz-progress');
  const bar = document.getElementById('quiz-progress-bar');
  const back = document.getElementById('quiz-back');
  const card = document.getElementById('quiz-result-card');
  const title = document.getElementById('quiz-result-title');
  let answers = [];
  let step = 0;
  const path = image => 'assets/images/' + image;
  function focus(element) { element.focus({ preventScroll: true }); element.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }
  function render(moveFocus = false) {
    const finished = step === questions.length;
    panel.hidden = finished; card.hidden = !finished;
    card.classList.toggle('show', finished);
    progress.setAttribute('aria-valuenow', String(step));
    bar.style.width = `${step / questions.length * 100}%`;
    if (finished) {
      const id = result(answers);
      const character = characters[id];
      title.textContent = character.name;
      document.getElementById('quiz-result-desc').textContent = character.description;
      const image = document.getElementById('quiz-result-img'); image.src = path(character.image); image.alt = character.name; image.parentElement.dataset.character = id;
      const traits = document.getElementById('quiz-traits'); traits.replaceChildren();
      character.traits.forEach(value => { const tag = document.createElement('span'); tag.textContent = value; traits.append(tag); });
      document.getElementById('quiz-party-role').textContent = 'Sua missão na festa: ' + character.mission;
      const text = `Meu parceiro na turma do Noah é ${character.name}! ${character.traits.join(', ')}. Descubra o seu no convite do 1º aninho do Noah: ${location.origin}${location.pathname}#quiz-section`;
      document.getElementById('btn-share-quiz-whatsapp').href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
      if (moveFocus) { playFanfare(); triggerConfetti(60, 75); focus(title); }
      return;
    }
    document.getElementById('quiz-result-img').removeAttribute('src');
    document.getElementById('quiz-result-img').alt = '';
    heading.textContent = questions[step].text;
    counter.textContent = `Pergunta ${step + 1} de ${questions.length} · Escolha o que mais combina com você`;
    back.hidden = step === 0;
    options.replaceChildren();
    questions[step].options.forEach(([id, text]) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option-btn'; button.textContent = text;
      button.setAttribute('aria-pressed', String(answers[step] === id));
      button.addEventListener('click', event => {
        if (event.detail > 1) return;
        answers[step] = id; step++; playTone(523.25, 0.15, 'triangle'); render(true);
      });
      options.append(button);
    });
    if (moveFocus) focus(heading);
  }
  back.addEventListener('click', () => { if (step > 0) { step--; render(true); } });
  document.getElementById('quiz-restart').addEventListener('click', () => { answers = []; step = 0; render(true); });
  render();
}
