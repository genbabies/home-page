/* ==========================================================================
   STORIES & FRIEND TOPICS
   - Sample stories shown from the "Songs & stories" cards
   - Short "try it together" topics opened from each friend's button
   All copy here is hard-coded, trusted content.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  const SAMPLE = (text) => `<span class="sample">${text}</span>`;
  const YT_LINK = '<a class="btn btn-gold btn-sm" href="https://www.youtube.com/@GenBabies" target="_blank" rel="noopener">Watch more on YouTube ↗</a>';

  const STORIES = {
    garden: {
      title: 'The little seed’s big day',
      body: `
        <p>A tiny seed rested beneath the soil. “Am I growing yet?” it wondered.</p>
        <p>The rain gave it a drink. The sunshine warmed the ground. The seed stretched one small root, then another.</p>
        <p>One morning, a green leaf peeked into the garden. A butterfly landed nearby. “You grew!” she said.</p>
        <p>“A little every day,” smiled the seed.</p>
        <p><b>Wonder together:</b> What helps a plant grow? Can you find a leaf outside?</p>
        ${YT_LINK}
        ${SAMPLE('Original sample story')}`,
    },
    star: {
      title: 'A star says goodnight',
      body: `
        <p>A little star looked down at the garden. The birds had tucked their heads under their wings. The flowers had folded their petals.</p>
        <p>“Goodnight, leaves. Goodnight, trees. Goodnight, busy little bees,” whispered the star.</p>
        <p>The moon smiled. The garden grew quiet. And the little star shone softly until morning.</p>
        <p><b>Try together:</b> Take three slow breaths and name one lovely thing from today.</p>
        ${YT_LINK}
        ${SAMPLE('Original sample bedtime story')}`,
    },
  };

  const TOPICS = {
    animal: {
      title: 'Animal Adventure',
      body: `
        <p>Elephants use their trunks to smell, drink and pick things up.</p>
        <p><b>Try it:</b> Stretch your arm like a trunk. Can you gently pick up a soft toy?</p>
        <p><b>Wonder:</b> How is your nose different from an elephant’s trunk?</p>`,
    },
    kind: {
      title: 'Kindness Village',
      body: `
        <p>A friend wants to play with your blocks. What could you say?</p>
        <button class="btn btn-gold" id="kindness" type="button">“Let’s build together!”</button>
        <p id="kindresponse" aria-live="polite">Sharing can turn a small tower into a big adventure.</p>`,
    },
    invent: {
      title: 'Little Inventors Lab',
      body: `
        <p>Build a bridge from blocks or folded paper with a grown-up. Can a small toy cross it?</p>
        <p><b>Try → Notice → Change → Try again.</b></p>
        <p>Make the bridge wider. What happens? Trying again is part of inventing.</p>`,
    },
  };

  function showStory(key) {
    const story = STORIES[key];
    GB.openModal(story.title, story.body);
  }

  function showTopic(key) {
    const topic = TOPICS[key];
    GB.openModal(topic.title, topic.body);

    const kindBtn = $('#kindness');
    if (kindBtn) {
      kindBtn.addEventListener('click', () => {
        GB.tone();
        $('#kindresponse').textContent = 'That’s a kind invitation! What could you build together? 💛';
      });
    }
  }

  /* ---------- Story cards ---------- */
  $$('[data-story]').forEach((btn) =>
    btn.addEventListener('click', () => showStory(btn.dataset.story)));

  /* ---------- Friend buttons ---------- */
  $$('[data-friend]').forEach((btn) => btn.addEventListener('click', () => {
    const topic = btn.dataset.friend;

    // Mira jumps straight to the counting game
    if (topic === 'count') {
      GB.renderGame('count');
      $('#play').scrollIntoView({ behavior: GB.reducedMotion ? 'auto' : 'smooth' });
      return;
    }
    showTopic(topic);
  }));
})();
