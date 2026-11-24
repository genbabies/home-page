/* ==========================================================================
   DISCOVERY LAB — three tiny games: counting, shapes, phonics
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  const box = $('#game');
  if (!box) return;

  const SHAPE_NAMES = ['circle', 'triangle', 'square'];
  const SHAPE_GLYPHS = ['●', '▲', '■'];
  const SHAPE_COLORS = ['#d98c2b', '#3f9a76', '#7a63c9'];
  const APPLES = 5;

  let game = 'count';
  let counted = 0;
  let stage = 0;

  const footer = '<button class="mini" id="reset" type="button">Start again</button>';

  function renderCount() {
    const apples = Array.from({ length: APPLES }, (_, i) =>
      `<button class="choice apple" type="button" aria-label="Count apple ${i + 1}">🍎</button>`).join('');
    box.innerHTML = `
      <span class="sample">Tap each apple once</span>
      <h3>Can you count ${APPLES} apples?</h3>
      <div class="choices">${apples}</div>
      <div class="feedback" aria-live="polite">Let’s count together: 0 of ${APPLES}</div>${footer}`;
  }

  function renderShape() {
    const choices = SHAPE_GLYPHS.map((glyph, i) =>
      `<button class="choice shape" type="button" data-shape="${i}" aria-label="${SHAPE_NAMES[i]}" style="color:${SHAPE_COLORS[i]}">${glyph}</button>`).join('');
    box.innerHTML = `
      <span class="sample">Match all three shapes</span>
      <h3>Find the ${SHAPE_NAMES[stage]} ${SHAPE_GLYPHS[stage]}</h3>
      <div class="choices">${choices}</div>
      <div class="feedback" aria-live="polite">${stage} of 3 shapes found</div>${footer}`;
  }

  function renderLetter() {
    box.innerHTML = `
      <span class="sample">A says /a/ as in apple</span>
      <h3>What begins with A?</h3>
      <div class="choices">
        <button class="choice letter" type="button" data-correct="true" aria-label="Apple">🍎</button>
        <button class="choice letter" type="button" aria-label="Ball">⚽</button>
        <button class="choice letter" type="button" aria-label="Cat">🐱</button>
      </div>
      <div class="feedback" aria-live="polite">Find the apple!</div>${footer}`;
  }

  function render(type) {
    game = type;
    counted = 0;
    stage = 0;
    $$('[data-game]').forEach((tab) => tab.classList.toggle('active', tab.dataset.game === type));
    ({ count: renderCount, shape: renderShape, letter: renderLetter })[type]();
  }
  GB.renderGame = render;

  box.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    const feedback = $('.feedback', box);

    if (btn.id === 'reset') { render(game); return; }

    if (btn.classList.contains('apple') && !btn.disabled) {
      btn.disabled = true;
      btn.classList.add('done');
      counted += 1;
      GB.tone();
      feedback.textContent = counted === APPLES
        ? `Wonderful! You counted all ${APPLES}. Time for a little stretch!`
        : `That’s ${counted}! Keep counting.`;
    }

    if (btn.classList.contains('letter')) {
      if (btn.dataset.correct) {
        GB.tone();
        feedback.textContent = 'You found it! A is for apple. 🍎';
        $$('.letter', box).forEach((x) => { x.disabled = true; });
      } else {
        feedback.textContent = 'Let’s try together. Apple starts with A.';
      }
    }

    if (btn.classList.contains('shape')) {
      if (Number(btn.dataset.shape) === stage) {
        GB.tone();
        stage += 1;
        if (stage < 3) {
          renderShape();
        } else {
          feedback.textContent = 'You matched all three! Look for shapes around your room.';
          $$('.shape', box).forEach((x) => { x.disabled = true; });
        }
      } else {
        feedback.textContent = 'Let’s try again. Look at the shape beside the question.';
      }
    }
  });

  $$('[data-game]').forEach((tab) => tab.addEventListener('click', () => render(tab.dataset.game)));
  render('count');
})();
