// ===================== MorphingText (ported from React hooks) =====================
// Two overlapping text layers cross-fade and cross-blur into each other on a
// timer, producing the "morph" between successive strings in a list. Same
// blur/opacity curve and timing as the original — just plain DOM nodes and a
// rAF loop instead of refs + useEffect.

const MORPH_TIME = 1.5;
const COOLDOWN_TIME = 0.5;

function initMorphingText(container, texts, opts = {}) {
  const { morphTime = MORPH_TIME, cooldownTime = COOLDOWN_TIME } = opts;

  container.classList.add('morphing-text');
  container.innerHTML = '';

  const text1 = document.createElement('span');
  text1.className = 'morphing-text-layer';
  const text2 = document.createElement('span');
  text2.className = 'morphing-text-layer';
  container.appendChild(text1);
  container.appendChild(text2);

  let textIndex = 0;
  let morph = 0;
  let cooldown = 0;
  let lastTime = new Date();

  function setStyles(fraction) {
    text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

    const invertedFraction = 1 - fraction;
    text1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
    text1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

    text1.textContent = texts[textIndex % texts.length];
    text2.textContent = texts[(textIndex + 1) % texts.length];
  }

  function doMorph() {
    morph -= cooldown;
    cooldown = 0;
    let fraction = morph / morphTime;
    if (fraction > 1) {
      cooldown = cooldownTime;
      fraction = 1;
    }
    setStyles(fraction);
    if (fraction === 1) textIndex++;
  }

  function doCooldown() {
    morph = 0;
    text2.style.filter = 'none';
    text2.style.opacity = '100%';
    text1.style.filter = 'none';
    text1.style.opacity = '0%';
  }

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    const newTime = new Date();
    const dt = (newTime.getTime() - lastTime.getTime()) / 1000;
    lastTime = newTime;
    cooldown -= dt;
    if (cooldown <= 0) doMorph();
    else doCooldown();
  }
  raf = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(raf);
}
