// ============================================================
//  SmoothCursor — vanilla JS port of MagicUI smooth-cursor
//  Creates a spring-physics trailing cursor dot with a
//  smooth SVG tail that follows the real cursor.
// ============================================================

function initSmoothCursor() {
  // Skip on touch-only devices
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  if (document.getElementById('smooth-cursor-root')) return; // prevent double init

  // ── Inject wrapper ──────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'smooth-cursor-root';
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: visible;
  `;
  document.body.appendChild(root);

  // ── Cursor dot (the leading circle) ─────────────────────────
  const dot = document.createElement('div');
  dot.id = 'smooth-cursor-dot';
  dot.style.cssText = `
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #7C3AED;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 12px 3px rgba(124,58,237,0.55);
    transition: background 0.2s, box-shadow 0.2s, transform 0.12s;
    will-change: transform;
    pointer-events: none;
  `;
  root.appendChild(dot);

  // ── SVG tail ────────────────────────────────────────────────
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  `;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.id = 'sc-tail-grad';
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#7C3AED');
  stop1.setAttribute('stop-opacity', '0.85');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#06B6D4');
  stop2.setAttribute('stop-opacity', '0');

  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const tailPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tailPath.setAttribute('fill', 'none');
  tailPath.setAttribute('stroke', 'url(#sc-tail-grad)');
  tailPath.setAttribute('stroke-width', '2.5');
  tailPath.setAttribute('stroke-linecap', 'round');
  tailPath.setAttribute('opacity', '0.7');
  svg.appendChild(tailPath);
  root.appendChild(svg);

  // ── State ────────────────────────────────────────────────────
  const HISTORY_LEN = 22;
  const SPRING_STIFFNESS = 0.14;  // 0–1: higher = snappier
  const SPRING_DAMPING = 0.72;    // 0–1: higher = less oscillation

  let mouse  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let cursor = { x: mouse.x, y: mouse.y };
  let vel    = { x: 0, y: 0 };
  let history = Array(HISTORY_LEN).fill(null).map(() => ({ x: mouse.x, y: mouse.y }));
  let visible = false;
  let rafId = null;
  let hoveringClickable = false;

  // ── Track mouse ─────────────────────────────────────────────
  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!visible) {
      visible = true;
      root.style.opacity = '1';
      cursor.x = mouse.x;
      cursor.y = mouse.y;
      history.fill({ x: mouse.x, y: mouse.y });
    }
  });

  document.addEventListener('mouseleave', () => {
    visible = false;
    root.style.opacity = '0';
  });

  // Grow / recolor on interactive elements
  function onEnterClickable() {
    hoveringClickable = true;
    dot.style.transform = 'translate(-50%, -50%) scale(1.9)';
    dot.style.background = '#06B6D4';
    dot.style.boxShadow = '0 0 18px 5px rgba(6,182,212,0.5)';
    stop1.setAttribute('stop-color', '#06B6D4');
  }
  function onLeaveClickable() {
    hoveringClickable = false;
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
    dot.style.background = '#7C3AED';
    dot.style.boxShadow = '0 0 12px 3px rgba(124,58,237,0.55)';
    stop1.setAttribute('stop-color', '#7C3AED');
  }

  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('a, button, [role="button"], input, select, textarea, label');
    if (t) onEnterClickable();
  });
  document.addEventListener('mouseout', (e) => {
    const t = e.target.closest('a, button, [role="button"], input, select, textarea, label');
    if (t) onLeaveClickable();
  });

  // ── Build catmull-rom SVG path from history ──────────────────
  function buildTailPath(pts) {
    if (pts.length < 2) return '';
    const d = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 1; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      const cy = (pts[i].y + pts[i + 1].y) / 2;
      d.push(`Q ${pts[i].x} ${pts[i].y} ${cx} ${cy}`);
    }
    const last = pts[pts.length - 1];
    d.push(`L ${last.x} ${last.y}`);
    return d.join(' ');
  }

  // ── Animation loop ───────────────────────────────────────────
  function tick() {
    rafId = requestAnimationFrame(tick);
    if (!visible) return;

    // Spring physics toward mouse
    const ax = (mouse.x - cursor.x) * SPRING_STIFFNESS;
    const ay = (mouse.y - cursor.y) * SPRING_STIFFNESS;
    vel.x = vel.x * SPRING_DAMPING + ax;
    vel.y = vel.y * SPRING_DAMPING + ay;
    cursor.x += vel.x;
    cursor.y += vel.y;

    // Update history
    history.unshift({ x: cursor.x, y: cursor.y });
    history.length = HISTORY_LEN;

    // Position dot
    dot.style.left = cursor.x + 'px';
    dot.style.top  = cursor.y + 'px';

    // Update gradient direction
    const tail = history[history.length - 1];
    grad.setAttribute('x1', tail.x);
    grad.setAttribute('y1', tail.y);
    grad.setAttribute('x2', cursor.x);
    grad.setAttribute('y2', cursor.y);

    // Draw tail
    tailPath.setAttribute('d', buildTailPath([...history].reverse()));
  }

  root.style.opacity = '0';
  root.style.transition = 'opacity 0.3s';
  tick();
}
