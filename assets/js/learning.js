/* ==========================================================================
   LEARNING BOARD — the "try it below" activity under the 3D world.
   Four modes: letters, numbers, shapes, animals.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  const board = $('#learning-board');
  if (!board) return;

  const LETTERS = [
    ['A', '🍎', 'Apple'], ['B', '⚽', 'Ball'], ['C', '🐱', 'Cat'], ['D', '🐶', 'Dog'],
    ['E', '🐘', 'Elephant'], ['F', '🐟', 'Fish'], ['G', '🍇', 'Grapes'], ['H', '🏠', 'House'],
  ];
  const ANIMALS = [['🐱', 'Cat'], ['🐶', 'Dog'], ['🐘', 'Elephant'], ['🐰', 'Rabbit']];
  const SHAPES = [['●', 'Circle'], ['▲', 'Triangle'], ['■', 'Square'], ['★', 'Star']];
  const SHAPE_COLORS = ['#ee75b5', '#2fa57f', '#7a5fe0', '#e9a010'];

  const EXPLAINERS = {
    letters: 'A letter is a symbol. Letters help us build words. Find the same letter above.',
    numbers: 'Each apple counts as one. Tap once, say the number, then count the next apple.',
    shapes: 'A circle is flat. A sphere is solid, like a ball. A triangle is flat; a pyramid is solid. Match the flat shape below.',
    animals: 'Animals have different names and features. An elephant has a trunk. A rabbit has long ears. Find the named animal.',
  };

  let mode = 'letters';
  let step = 0;
  let counted = 0;

  /** Builds { title, hint, options } for the current mode and step. */
  function buildRound() {
    if (mode === 'letters') {
      const item = LETTERS[step % LETTERS.length];
      return {
        title: `Find the letter ${item[0]}`,
        hint: `${item[1]} ${item[0]} is for ${item[2]}. Tap the matching letter.`,
        options: LETTERS.map(([letter], i) =>
          `<button class="learning-option" data-answer="${i === step % LETTERS.length}" aria-label="Letter ${letter}">${letter}</button>`),
      };
    }

    if (mode === 'numbers') {
      const target = (step % 10) + 1;
      return {
        title: `Let’s count to ${target}`,
        hint: 'Tap each apple once. We’ll count together.',
        options: Array.from({ length: target }, (_, i) =>
          `<button class="learning-option" data-count="${i}" aria-label="Count apple ${i + 1}">🍎</button>`),
      };
    }

    if (mode === 'shapes') {
      const item = SHAPES[step % SHAPES.length];
      return {
        title: `Find the ${item[1].toLowerCase()}`,
        hint: `Look for this shape: ${item[0]}`,
        options: SHAPES.map(([glyph, name], i) =>
          `<button class="learning-option" data-answer="${i === step % SHAPES.length}" aria-label="${name}" style="color:${SHAPE_COLORS[i]}">${glyph}</button>`),
      };
    }

    const animal = ANIMALS[step % ANIMALS.length];
    return {
      title: `Where is the ${animal[1].toLowerCase()}?`,
      hint: `Look at each animal and tap the ${animal[1].toLowerCase()}.`,
      options: ANIMALS.map(([glyph, name], i) =>
        `<button class="learning-option" data-answer="${i === step % ANIMALS.length}" aria-label="${name}">${glyph}</button>`),
    };
  }

  /** Renders a round. Also called by the 3D world when a toy is tapped. */
  GB.startLearning = function startLearning(nextMode, nextStep = 0) {
    mode = nextMode;
    step = nextStep;
    counted = 0;

    if (typeof GB.setLearningWorld === 'function') GB.setLearningWorld(mode);
    $$('[data-learn]').forEach((btn) => btn.classList.toggle('active', btn.dataset.learn === mode));

    const round = buildRound();
    board.innerHTML = `
      <div class="learning-prompt">
        <span class="sample">Play right here · No timer</span>
        <h3>${round.title}</h3>
        <p>${round.hint}</p>
      </div>
      <div class="learning-options">${round.options.join('')}</div>
      <div class="learn-explain">${EXPLAINERS[mode]}</div>
      <div class="inline-feedback" aria-live="polite">Take your time. Let’s discover together!</div>
      <button class="activity-next" type="button" id="activity-next">Try another ↗</button>`;

    $('#activity-next').addEventListener('click', () => GB.startLearning(mode, step + 1));
  };

  /* ---------- Tab switching ---------- */
  $$('[data-learn]').forEach((btn) =>
    btn.addEventListener('click', () => GB.startLearning(btn.dataset.learn)));

  /* ---------- Answer handling (event delegation) ---------- */
  board.addEventListener('click', (event) => {
    const option = event.target.closest('.learning-option');
    if (!option || option.disabled) return;

    const feedback = $('.inline-feedback', board);

    // Counting mode: every apple tapped adds one
    if (option.hasAttribute('data-count')) {
      counted += 1;
      option.disabled = true;
      option.classList.add('selected');
      GB.tone();
      const target = (step % 10) + 1;
      feedback.textContent = counted === target
        ? `You counted ${counted}! Wonderful counting.`
        : `That’s ${counted}! Tap the next apple.`;
      return;
    }

    // Choice modes: one right answer
    if (option.dataset.answer === 'true') {
      option.classList.add('selected');
      GB.tone();
      feedback.textContent = mode === 'letters'
        ? `${LETTERS[step % LETTERS.length][0]} is for ${LETTERS[step % LETTERS.length][2]}. You found it!`
        : 'You found it! Great discovering.';
      $$('.learning-option', board).forEach((btn) => { btn.disabled = true; });
    } else {
      feedback.textContent = 'Let’s look again together. You can try another.';
    }
  });

  GB.startLearning('letters');
})();
