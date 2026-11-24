/* ==========================================================================
   3D WONDER WORLD
   A dependency-free software 3D scene drawn on a 2D canvas: perspective
   projection, depth sorting and shaded solids. Tapping a toy starts the
   matching learning activity (see learning.js).
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$ } = GB;

  const canvas = $('#wonder3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const statusEl = $('#space-status');
  const setStatus = (text) => { statusEl.textContent = text; };

  const PALETTE = ['#ffcb4d', '#f8a7cf', '#78d6b2', '#64bcf1', '#bba0f2'];
  const DISPLAY_FONT = 'Outfit, sans-serif';

  /* ---------- State ---------- */
  let W = 0, H = 0;
  let time = 0, lastFrame = 0;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0;
  let theme = 'garden';           // garden | space | rainbow
  let toys = [];                  // current learning objects
  let hits = [];                  // hit-test circles from the latest frame
  let bursts = [];                // sparkle particles
  let inView = true;

  /* Decorative floating blocks that always orbit the scene */
  const floatDecor = [
    ...Array.from({ length: 4 }, (_, i) => ({
      x: -300 + i * 195, y: -190, z: 20, r: 22, type: 'cube', label: 'ABCD'[i],
      learn: 'letters', step: i, color: PALETTE[i], name: 'Tap a letter and learn',
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      x: -290 + i * 115, y: 100, z: -40, r: 21, type: 'cube', label: String(i + 1),
      learn: 'numbers', step: i, color: PALETTE[(i + 2) % 5], name: 'Count ' + (i + 1),
    })),
    { x: -330, y: -30, z: 80, r: 29, type: 'planet', color: '#79c7fa', learn: 'shapes', step: 0, name: 'A planet looks round, like a sphere.' },
    { x: 330, y: -30, z: 80, r: 30, type: 'planet', color: '#e9a7d9', learn: 'shapes', step: 0, name: 'Some planets have rings. Notice the round shape.' },
  ];

  /* ---------- Canvas sizing ---------- */
  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = box.width;
    H = box.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* ---------- 3D maths ---------- */
  function rotate(p) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = p.x * c + p.z * s;
    const z = -p.x * s + p.z * c;
    return { x, y: p.y * cp - z * sp, z: p.y * sp + z * cp };
  }

  function project(p) {
    const a = rotate(p);
    const scale = (Math.min(W / 780, H / 510) * 650) / (650 + a.z);
    return { x: W / 2 + a.x * scale, y: H * 0.52 + a.y * scale, s: scale, z: a.z };
  }

  function shade(hex, mult) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (shift) => Math.round(Math.min(255, Math.max(0, ((n >> shift) & 255) * mult)));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  /* ---------- Primitives ---------- */
  function drawSphere(x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.04, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.2, color);
    g.addColorStop(1, shade(color, 0.65));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStar(x, y, r, color, angle = 0) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = angle + (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 ? r * 0.45 : r;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = '#e7b14755';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawRing(p, r, color) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.3);
    ctx.scale(1, 0.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10 * p.s;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlanet(p, r, color) {
    drawRing(p, r, '#f6ca7899');
    drawSphere(p.x, p.y, r, color);
    // Front half of the ring, drawn over the sphere
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.3);
    ctx.scale(1, 0.3);
    ctx.strokeStyle = '#ffe2a0';
    ctx.lineWidth = 7 * p.s;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  const CUBE_FACES = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  const CUBE_SHADES = [0.94, 0.7, 1.12, 0.65, 0.82, 1];

  function drawCube(t, p) {
    const r = t.r * 0.65;
    const angle = time * 0.35 + t.x * 0.004;
    const verts = [];
    for (let i = 0; i < 8; i++) {
      const x = (i & 1 ? 1 : -1) * r;
      const z = (i & 4 ? 1 : -1) * r;
      verts.push(project({
        x: t.x + x * Math.cos(angle) + z * Math.sin(angle),
        y: t.y + (i & 2 ? 1 : -1) * r,
        z: t.z - x * Math.sin(angle) + z * Math.cos(angle),
      }));
    }

    CUBE_FACES
      .map((face, i) => ({ face, i, z: face.reduce((sum, v) => sum + verts[v].z, 0) / 4 }))
      .sort((a, b) => b.z - a.z)
      .forEach(({ face, i }) => {
        ctx.beginPath();
        face.forEach((v, j) => (j ? ctx.lineTo(verts[v].x, verts[v].y) : ctx.moveTo(verts[v].x, verts[v].y)));
        ctx.closePath();
        ctx.fillStyle = shade(t.color, CUBE_SHADES[i]);
        ctx.fill();
        ctx.strokeStyle = '#fff6';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${t.r * 0.95 * p.s}px ${DISPLAY_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.label, p.x, p.y);
  }

  /* ---------- Learning objects (apples, animals, pyramid, ball) ---------- */
  function drawApple(p, r) {
    drawSphere(p.x - r * 0.25, p.y, r * 0.7, '#f7748b');
    drawSphere(p.x + r * 0.25, p.y, r * 0.7, '#ed5c79');
    ctx.strokeStyle = '#77592d';
    ctx.lineWidth = 5 * p.s;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r * 0.55);
    ctx.lineTo(p.x + r * 0.1, p.y - r * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#76c679';
    ctx.beginPath();
    ctx.ellipse(p.x + r * 0.32, p.y - r * 0.83, r * 0.3, r * 0.13, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPyramid(t, p, r) {
    const u = r / p.s;
    const apex = project({ x: t.x, y: t.y - u, z: t.z });
    const a = project({ x: t.x - u, y: t.y + u, z: t.z });
    const b = project({ x: t.x + u, y: t.y + u, z: t.z });
    const c = project({ x: t.x, y: t.y + u, z: t.z - 40 });
    [[[apex, a, c], '#b990ee'], [[apex, c, b], '#9873d8']].forEach(([pts, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff9';
      ctx.stroke();
    });
  }

  const FUR = { Cat: '#f3b060', Dog: '#c99366', Elephant: '#a9b5d9', Rabbit: '#f3c5e5' };

  function drawAnimal(t, p, r) {
    const fur = FUR[t.animal];
    drawSphere(p.x, p.y + r * 0.4, r * 0.62, fur);
    drawSphere(p.x - r * 0.45, p.y + r * 0.92, r * 0.23, fur);
    drawSphere(p.x + r * 0.45, p.y + r * 0.92, r * 0.23, fur);

    if (t.animal === 'Rabbit') {
      [-1, 1].forEach((sign) => {
        ctx.save();
        ctx.translate(p.x + sign * r * 0.35, p.y - r * 0.8);
        ctx.scale(0.4, 1.3);
        drawSphere(0, 0, r * 0.45, fur);
        ctx.restore();
      });
    } else if (t.animal === 'Elephant') {
      drawSphere(p.x - r * 0.65, p.y - r * 0.2, r * 0.53, fur);
      drawSphere(p.x + r * 0.65, p.y - r * 0.2, r * 0.53, fur);
    } else {
      [-1, 1].forEach((sign) => drawSphere(p.x + sign * r * 0.5, p.y - r * 0.6, r * 0.3, fur));
    }

    drawSphere(p.x, p.y - r * 0.2, r * 0.68, fur);
    [-1, 1].forEach((sign) => {
      drawSphere(p.x + sign * r * 0.22, p.y - r * 0.28, r * 0.09, '#273858');
      drawSphere(p.x + sign * r * 0.2, p.y - r * 0.31, r * 0.025, '#fff');
    });

    if (t.animal === 'Elephant') {
      ctx.strokeStyle = fur;
      ctx.lineWidth = r * 0.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + r * 0.1);
      ctx.quadraticCurveTo(p.x, p.y + r * 0.9, p.x + r * 0.45, p.y + r * 0.68);
      ctx.stroke();
    } else {
      drawSphere(p.x, p.y + r * 0.05, r * 0.12, '#805877');
    }
  }

  function drawLearningObject(t, p, r) {
    if (t.type === 'apple') drawApple(p, r);
    if (t.type === 'pyramid') drawPyramid(t, p, r);
    if (t.type === 'animal') drawAnimal(t, p, r);
    if (t.type === 'ball') drawSphere(p.x, p.y, r, t.color);

    // Caption pill under the object
    ctx.fillStyle = '#ffffffeb';
    ctx.beginPath();
    ctx.roundRect(p.x - r * 1.3, p.y + r * 1.22, r * 2.6, r * 0.46, 10);
    ctx.fill();
    ctx.fillStyle = '#10308a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${12 * p.s}px ${DISPLAY_FONT}`;
    ctx.fillText(t.caption || t.label || t.animal, p.x, p.y + r * 1.45);
  }

  /* ---------- Scene content for each learning mode ---------- */
  GB.setLearningWorld = function setLearningWorld(mode) {
    const objects = [];

    if (mode === 'letters') {
      for (let i = 0; i < 8; i++) {
        objects.push({ type: 'cube', label: 'ABCDEFGH'[i], caption: 'ABCDEFGH'[i], learn: mode, step: i });
      }
    }
    if (mode === 'numbers') {
      for (let i = 0; i < 5; i++) objects.push({ type: 'apple', caption: String(i + 1), learn: mode, step: i });
    }
    if (mode === 'shapes') {
      objects.push(
        { type: 'ball', caption: 'Sphere', learn: mode, step: 0 },
        { type: 'cube', label: '■', caption: 'Cube', learn: mode, step: 2 },
        { type: 'pyramid', caption: 'Pyramid', learn: mode, step: 1 },
        { type: 'star', caption: 'Star', learn: mode, step: 3 },
      );
    }
    if (mode === 'animals') {
      ['Cat', 'Dog', 'Elephant', 'Rabbit'].forEach((animal, i) =>
        objects.push({ type: 'animal', animal, caption: animal, learn: mode, step: i }));
    }

    // Lay objects out in a centered row, or a 4-column grid when there are many
    const many = objects.length > 5;
    objects.forEach((obj, i) => {
      Object.assign(obj, {
        x: ((many ? i % 4 : i) - (many ? 1.5 : (objects.length - 1) / 2)) * 140,
        y: many ? Math.floor(i / 4) * 140 - 95 : -25,
        z: i % 2 ? -35 : 35,
        r: mode === 'animals' ? 47 : 40,
        color: PALETTE[i % 5],
        name: obj.caption + ' — let’s learn together',
      });
    });

    toys = objects;
    setStatus({
      letters: 'Tap a letter block',
      numbers: 'Tap an apple and count',
      shapes: 'Explore solid shapes',
      animals: 'Meet the toy animals',
    }[mode]);
  };

  /* ---------- Sparkle burst ---------- */
  function magic() {
    for (let i = 0; i < 45; i++) {
      bursts.push({
        x: W / 2, y: H * 0.45,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.7) * 6,
        life: 1,
        r: 3 + Math.random() * 6,
        color: PALETTE[i % 5],
      });
    }
    setStatus('A little sparkle, a big imagination!');
    GB.tone();
  }

  /* ---------- Render loop ---------- */
  const ISLAND = {
    garden: ['#8fcd8c', '#c5eab0'],
    space: ['#738cbe', '#a2b9e1'],
    rainbow: ['#e6b4ef', '#f9d6f4'],
  };

  function drawIsland() {
    const center = project({ x: 0, y: 125, z: 20 });
    const radius = Math.min(W * 0.39, 340) * center.s;
    const [shadowColor, topColor] = ISLAND[theme];

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(1, 0.25);
    ctx.fillStyle = shadowColor;
    ctx.shadowColor = '#24649833';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.ellipse(0, 15, radius, radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!inView) return;

    const dt = Math.min((now - lastFrame) / 1000 || 0, 0.05);
    lastFrame = now;
    const paused = GB.reducedMotion || GB.isPaused();
    if (!paused) time += dt;

    yaw += (targetYaw - yaw) * 0.06;
    pitch += (targetPitch - pitch) * 0.06;
    ctx.clearRect(0, 0, W, H);

    const orbit = time * 0.16;
    drawIsland();

    // Twinkling background stars
    for (let i = 0; i < 16; i++) {
      const a = i * 2.399 + orbit;
      const p = project({ x: Math.cos(a) * 310, y: -210 + Math.sin(i * 3) * 35, z: Math.sin(a) * 150 });
      drawStar(p.x, p.y, (3 + (i % 3)) * p.s, '#ffffffbb', time * 0.1);
    }

    // Toys + decor, back to front
    hits = [];
    [...toys, ...floatDecor]
      .map((toy, i) => {
        const t = { ...toy };
        t.y += paused ? 0 : Math.sin(time * 1.2 + i) * 12;
        if (theme === 'space') {              // "Space explorers": orbit the island
          const a = (i / 7) * Math.PI * 2 + orbit;
          t.x = Math.cos(a) * 230;
          t.z = Math.sin(a) * 110;
          t.y = -50 + Math.sin(a) * 70;
        }
        return { t, p: project(t) };
      })
      .sort((a, b) => b.p.z - a.p.z)
      .forEach(({ t, p }) => {
        const r = t.r * p.s;

        // Ground shadow
        const ground = project({ x: t.x, y: 113, z: t.z });
        ctx.fillStyle = '#2d725a16';
        ctx.beginPath();
        ctx.ellipse(ground.x, ground.y, r * 0.8, r * 0.17, 0, 0, Math.PI * 2);
        ctx.fill();

        if (['animal', 'apple', 'pyramid', 'ball'].includes(t.type)) drawLearningObject(t, p, r);
        else if (t.type === 'cube') drawCube(t, p);
        else if (t.type === 'star') drawStar(p.x, p.y, r, t.color, time * 0.3);
        else if (t.type === 'planet') drawPlanet(p, r, t.color);
        else drawSphere(p.x, p.y, r, t.color);

        hits.push({ x: p.x, y: p.y, r: r * 1.2, toy: t });
      });

    // Sparkle particles
    bursts = bursts.filter((b) => b.life > 0);
    bursts.forEach((b) => {
      if (!paused) { b.x += b.vx; b.y += b.vy; b.vy += 0.04; b.life -= dt * 0.8; }
      ctx.globalAlpha = Math.max(0, b.life);
      drawStar(b.x, b.y, b.r, b.color, time);
    });
    ctx.globalAlpha = 1;
  }

  /* ---------- Interaction ---------- */
  function pointerPosition(event) {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  canvas.addEventListener('pointermove', (event) => {
    const { x, y } = pointerPosition(event);
    if (!GB.reducedMotion) {
      targetYaw = (x / W - 0.5) * 0.65;
      targetPitch = (y / H - 0.5) * 0.22;
    }
    canvas.style.cursor = hits.some((h) => Math.hypot(h.x - x, h.y - y) < h.r) ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerleave', () => { targetYaw = targetPitch = 0; });

  canvas.addEventListener('click', (event) => {
    const { x, y } = pointerPosition(event);
    const hit = [...hits].reverse().find((h) => Math.hypot(h.x - x, h.y - y) < h.r);
    if (!hit) return;

    magic();
    GB.startLearning(hit.toy.learn, hit.toy.step || 0);
    setStatus(hit.toy.name);
    $('#inline-learning').scrollIntoView({ behavior: GB.reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  });

  $$('[data-scene]').forEach((btn) => btn.addEventListener('click', () => {
    theme = btn.dataset.scene;
    $$('[data-scene]').forEach((other) => other.classList.toggle('active', other === btn));
    magic();
    setStatus(btn.textContent.trim() + ' — tap a toy to explore');
  }));

  $('#sparkle').addEventListener('click', magic);

  // Only animate while the canvas is on screen
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    lastFrame = performance.now();
  }).observe(canvas);

  GB.setLearningWorld('letters');
  requestAnimationFrame(frame);
})();
