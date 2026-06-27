// ===================== BorderGlow (ported) =====================
function initBorderGlow(cardEl, opts = {}) {
  const {
    edgeSensitivity = 30,
    glowColor = '262 83% 68%',
    backgroundColor = '#15131d',
    borderRadius = 24,
    glowRadius = 50,
    glowIntensity = 1.0,
    coneSpread = 28,
    colors = ['#7C3AED', '#06B6D4', '#FF4242'],
    fillOpacity = 0.4
  } = opts;

  function parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 262, s: 83, l: 68 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }
  function buildGlowVars(el) {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    opacities.forEach((op, i) => {
      el.style.setProperty(`--glow-color${keys[i]}`, `hsl(${base} / ${Math.min(op * glowIntensity, 100)}%)`);
    });
  }
  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['--gradient-one','--gradient-two','--gradient-three','--gradient-four','--gradient-five','--gradient-six','--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
  function buildGradientVars(el) {
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      el.style.setProperty(GRADIENT_KEYS[i], `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`);
    }
    el.style.setProperty('--gradient-base', `linear-gradient(${colors[0]} 0 100%)`);
  }

  cardEl.style.setProperty('--card-bg', backgroundColor);
  cardEl.style.setProperty('--edge-sensitivity', edgeSensitivity);
  cardEl.style.setProperty('--border-radius', `${borderRadius}px`);
  cardEl.style.setProperty('--glow-padding', `${glowRadius}px`);
  cardEl.style.setProperty('--cone-spread', coneSpread);
  cardEl.style.setProperty('--fill-opacity', fillOpacity);
  buildGlowVars(cardEl);
  buildGradientVars(cardEl);

  function getCenter(el) { const r = el.getBoundingClientRect(); return [r.width / 2, r.height / 2]; }
  function getEdgeProximity(el, x, y) {
    const [cx, cy] = getCenter(el);
    const dx = x - cx, dy = y - cy;
    let kx = Infinity, ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }
  function getCursorAngle(el, x, y) {
    const [cx, cy] = getCenter(el);
    const dx = x - cx, dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  cardEl.addEventListener('pointermove', (e) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const edge = getEdgeProximity(cardEl, x, y);
    const angle = getCursorAngle(cardEl, x, y);
    cardEl.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    cardEl.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  });
}
