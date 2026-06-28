// ============================================================
//  FallingText — Matter.js physics hero text component
//  Ported from React Bits <FallingText /> to vanilla JS.
//  Call initFallingText(containerEl, textEl, canvasEl, hintEl, options)
// ============================================================

function initFallingText(containerEl, textEl, canvasEl, hintEl, options = {}) {
  if (!containerEl || !textEl || !canvasEl) return;
  if (typeof Matter === 'undefined') {
    console.warn('FallingText: Matter.js not loaded.');
    return;
  }

  const {
    text           = '',
    highlightWords = [],
    highlightClass = 'highlighted',
    trigger        = 'hover',
    gravity        = 0.56,
    mouseConstraintStiffness = 0.9,
    fontSize       = '1rem'
  } = options;

  // — Build word spans —
  textEl.innerHTML = text.split(' ').map(word => {
    const hl = highlightWords.some(hw => word.startsWith(hw));
    return `<span class="ft-word${hl ? ' ' + highlightClass : ''}">${word}</span>`;
  }).join(' ');
  textEl.style.fontSize = fontSize;

  let started = false;
  let animFrame = null;
  let engineInst, runnerInst, renderInst;

  function destroy() {
    if (!started) return;
    if (animFrame) cancelAnimationFrame(animFrame);
    Matter.Render.stop(renderInst);
    Matter.Runner.stop(runnerInst);
    const canvas = canvasEl.querySelector('canvas');
    if (canvas) canvasEl.removeChild(canvas);
    Matter.World.clear(engineInst.world);
    Matter.Engine.clear(engineInst);
    started = false;
  }

  function startPhysics() {
    if (started) return;
    started = true;
    if (hintEl) hintEl.classList.add('ft-hint-hidden');

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;

    const rect = containerEl.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W <= 0 || H <= 0) return;

    engineInst = Engine.create();
    engineInst.world.gravity.y = gravity;

    renderInst = Render.create({
      element: canvasEl,
      engine: engineInst,
      options: { width: W, height: H, background: 'transparent', wireframes: false }
    });

    const wall = { isStatic: true, render: { fillStyle: 'transparent' } };
    const floor   = Bodies.rectangle(W / 2, H + 25, W, 50, wall);
    const leftW   = Bodies.rectangle(-25, H / 2, 50, H, wall);
    const rightW  = Bodies.rectangle(W + 25, H / 2, 50, H, wall);
    const ceiling = Bodies.rectangle(W / 2, -25, W, 50, wall);

    const wordSpans = textEl.querySelectorAll('.ft-word');
    const wordBodies = [...wordSpans].map(span => {
      const r = span.getBoundingClientRect();
      const x = r.left - rect.left + r.width / 2;
      const y = r.top - rect.top + r.height / 2;
      const body = Bodies.rectangle(x, y, r.width, r.height, {
        render: { fillStyle: 'transparent' },
        restitution: 0.75, frictionAir: 0.01, friction: 0.2
      });
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 5, y: 0 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      span.style.position = 'absolute';
      span.style.left = `${x - r.width / 2}px`;
      span.style.top  = `${y - r.height / 2}px`;
      span.style.transform = 'none';
      return { span, body };
    });

    const mouse = Mouse.create(containerEl);
    const mc = MouseConstraint.create(engineInst, {
      mouse,
      constraint: { stiffness: mouseConstraintStiffness, render: { visible: false } }
    });
    renderInst.mouse = mouse;

    World.add(engineInst.world, [floor, leftW, rightW, ceiling, mc, ...wordBodies.map(wb => wb.body)]);

    runnerInst = Runner.create();
    Runner.run(runnerInst, engineInst);
    Render.run(renderInst);

    function loop() {
      wordBodies.forEach(({ span, body }) => {
        const hw = span.offsetWidth / 2;
        const hh = span.offsetHeight / 2;
        span.style.left      = `${body.position.x - hw}px`;
        span.style.top       = `${body.position.y - hh}px`;
        span.style.transform = `rotate(${body.angle}rad)`;
      });
      animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  // — Trigger logic —
  if (trigger === 'auto') {
    startPhysics();
  } else if (trigger === 'scroll') {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { startPhysics(); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(containerEl);
  } else {
    // hover / click / touch
    containerEl.addEventListener('mouseenter', startPhysics);
    containerEl.addEventListener('click', startPhysics);
    containerEl.addEventListener('touchstart', startPhysics, { passive: true });
  }

  return { destroy };
}
