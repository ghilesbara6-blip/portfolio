// ============================================================
//  Testimonials — WebGL particle field background +
//  smooth infinite card carousel.
//  initTestimonials(container, testimonials)
// ============================================================

function initTestimonials(container, testimonials) {
  if (!container || !testimonials || !testimonials.length) return;

  // ── Build structure ──────────────────────────────────────────
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.borderRadius = '24px';

  // WebGL canvas (background)
  const canvas = document.createElement('canvas');
  canvas.className = 'testimonials-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  // Cards track
  const track = document.createElement('div');
  track.className = 'testimonials-track';

  // Duplicate cards for infinite loop (clone set before + after)
  const allCards = [...testimonials, ...testimonials, ...testimonials];

  allCards.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'testimonials-card';
    card.innerHTML = `
      <div class="testimonials-quote">"</div>
      <p class="testimonials-text">${t.text}</p>
      <div class="testimonials-author">
        <div class="testimonials-avatar" data-initials="${t.name.split(' ').map(w => w[0]).join('').slice(0,2)}"></div>
        <div class="testimonials-meta">
          <strong>${t.name}</strong>
          <span>${t.role}</span>
        </div>
        <div class="testimonials-stars">${'★'.repeat(t.stars || 5)}</div>
      </div>
    `;
    track.appendChild(card);
  });

  container.appendChild(track);

  // Nav dots
  const dots = document.createElement('div');
  dots.className = 'testimonials-dots';
  testimonials.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testimonials-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  });
  container.appendChild(dots);

  // Prev / Next buttons
  const btnPrev = document.createElement('button');
  btnPrev.className = 'testimonials-btn testimonials-btn--prev';
  btnPrev.setAttribute('aria-label', 'Previous');
  btnPrev.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
  const btnNext = document.createElement('button');
  btnNext.className = 'testimonials-btn testimonials-btn--next';
  btnNext.setAttribute('aria-label', 'Next');
  btnNext.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
  container.appendChild(btnPrev);
  container.appendChild(btnNext);

  // ── Carousel state ───────────────────────────────────────────
  const n = testimonials.length;
  let current = 0;        // logical index 0..n-1
  let animating = false;
  let autoTimer = null;

  function getCardWidth() {
    const c = track.children[0];
    if (!c) return 380;
    const gap = 24;
    return c.getBoundingClientRect().width + gap;
  }

  function setPosition(idx, instant) {
    // We render the middle clone set; offset into it
    const offset = (idx + n) * getCardWidth();
    track.style.transition = instant ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    track.style.transform = `translateX(calc(-${offset}px + 50% - ${getCardWidth() / 2}px))`;
    // Update active card style
    Array.from(track.children).forEach((c, i) => {
      const logicalI = i % n;
      c.classList.toggle('active', logicalI === idx && Math.floor(i / n) === 1);
    });
    // Dots
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function goTo(idx, dir) {
    if (animating) return;
    animating = true;
    current = ((idx % n) + n) % n;
    setPosition(current, false);
    setTimeout(() => { animating = false; }, 650);
  }

  function next() { goTo(current + 1, 1); }
  function prev() { goTo(current - 1, -1); }

  btnNext.addEventListener('click', () => { resetAuto(); next(); });
  btnPrev.addEventListener('click', () => { resetAuto(); prev(); });

  // Touch/drag swipe
  let dragStartX = 0, dragging = false;
  track.addEventListener('pointerdown', (e) => { dragStartX = e.clientX; dragging = true; });
  track.addEventListener('pointermove', (e) => { if (!dragging) return; });
  track.addEventListener('pointerup', (e) => {
    if (!dragging) return; dragging = false;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 48) { resetAuto(); dx < 0 ? next() : prev(); }
  });

  // Auto-advance
  function startAuto() { autoTimer = setInterval(next, 4500); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  // Pause on hover
  container.addEventListener('mouseenter', () => clearInterval(autoTimer));
  container.addEventListener('mouseleave', startAuto);

  // Init
  setPosition(0, true);
  startAuto();

  // Handle resize
  window.addEventListener('resize', () => setPosition(current, true));

  // ── WebGL particle field ─────────────────────────────────────
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
  if (!gl) return;

  const PARTICLE_COUNT = 120;

  const vsSource = `
    attribute vec2 a_position;
    attribute float a_size;
    attribute float a_alpha;
    uniform vec2 u_resolution;
    varying float v_alpha;
    void main() {
      vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clip * vec2(1, -1), 0, 1);
      gl_PointSize = a_size;
      v_alpha = a_alpha;
    }
  `;

  const fsSource = `
    precision mediump float;
    varying float v_alpha;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float r = dot(uv, uv);
      if (r > 0.25) discard;
      float fade = 1.0 - smoothstep(0.15, 0.25, r);
      gl_FragColor = vec4(mix(u_color1, u_color2, v_alpha), fade * v_alpha * 0.65);
    }
  `;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const aPos   = gl.getAttribLocation(prog, 'a_position');
  const aSize  = gl.getAttribLocation(prog, 'a_size');
  const aAlpha = gl.getAttribLocation(prog, 'a_alpha');
  const uRes   = gl.getUniformLocation(prog, 'u_resolution');
  const uCol1  = gl.getUniformLocation(prog, 'u_color1');
  const uCol2  = gl.getUniformLocation(prog, 'u_color2');

  // Buffers
  const positions = new Float32Array(PARTICLE_COUNT * 2);
  const sizes     = new Float32Array(PARTICLE_COUNT);
  const alphas    = new Float32Array(PARTICLE_COUNT);
  const velocities = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: (Math.random() - 0.5) * 0.3,
    y: (Math.random() - 0.5) * 0.3
  }));

  function randomParticle(i) {
    const W = canvas.width, H = canvas.height;
    positions[i * 2]     = Math.random() * W;
    positions[i * 2 + 1] = Math.random() * H;
    sizes[i]  = 2 + Math.random() * 4;
    alphas[i] = 0.2 + Math.random() * 0.7;
  }
  for (let i = 0; i < PARTICLE_COUNT; i++) randomParticle(i);

  const posBuf  = gl.createBuffer();
  const sizeBuf = gl.createBuffer();
  const alpBuf  = gl.createBuffer();

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let glRaf = null;
  let t = 0;

  function glTick() {
    glRaf = requestAnimationFrame(glTick);
    t += 0.008;
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(uRes, W, H);
    // violet → cyan
    gl.uniform3f(uCol1, 0.486, 0.227, 0.929); // #7C3AED
    gl.uniform3f(uCol2, 0.024, 0.714, 0.831); // #06B6D4

    // Update particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 2]     += velocities[i].x;
      positions[i * 2 + 1] += velocities[i].y;
      // Pulse alpha
      alphas[i] = 0.2 + Math.abs(Math.sin(t + i * 0.4)) * 0.6;
      // Wrap
      if (positions[i * 2] < 0)  positions[i * 2] = W;
      if (positions[i * 2] > W)  positions[i * 2] = 0;
      if (positions[i * 2 + 1] < 0)  positions[i * 2 + 1] = H;
      if (positions[i * 2 + 1] > H)  positions[i * 2 + 1] = 0;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, alpBuf);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
  }

  // Pause GL when not visible
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { if (!glRaf) glTick(); }
      else { cancelAnimationFrame(glRaf); glRaf = null; }
    });
  }, { threshold: 0.1 });
  io.observe(container);
}
