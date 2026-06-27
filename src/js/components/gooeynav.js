// ===================== GooeyNav (ported) =====================
function initGooeyNav(container, items, opts = {}) {
  const {
    particleCount = 15,
    particleDistances = [90, 10],
    particleR = 100,
    initialActiveIndex = 0,
    animationTime = 600,
    timeVariance = 300,
    colors = [1, 2, 3, 1, 2, 3, 1, 4]
  } = opts;

  container.innerHTML = '';
  container.classList.add('gooey-nav-container');
  const nav = document.createElement('nav');
  const ul = document.createElement('ul');
  nav.appendChild(ul);
  const filterSpan = document.createElement('span');
  filterSpan.className = 'effect filter';
  const textSpan = document.createElement('span');
  textSpan.className = 'effect text';
  container.appendChild(nav);
  container.appendChild(filterSpan);
  container.appendChild(textSpan);

  let activeIndex = initialActiveIndex;

  items.forEach((item, index) => {
    const li = document.createElement('li');
    if (index === activeIndex) li.classList.add('active');
    const a = document.createElement('a');
    a.href = item.href || '#';
    a.textContent = item.label;
    a.tabIndex = 0;
    li.appendChild(a);
    ul.appendChild(li);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      handleClick(li, index);
      if (item.href && item.href.startsWith('#')) {
        const target = document.querySelector(item.href);
        if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    });
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(li, index); }
    });
  });

  function noise(n = 1) { return n / 2 - Math.random() * n; }
  function getXY(distance, pointIndex, totalPoints) {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  }
  function createParticle(i, t, d, r) {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  }
  function makeParticles(element) {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');
      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('gooey-particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);
        point.classList.add('gooey-point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => element.classList.add('active'));
        setTimeout(() => { try { element.removeChild(particle); } catch {} }, t);
      }, 30);
    }
  }
  function updateEffectPosition(element) {
    const containerRect = container.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`, top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`, height: `${pos.height}px`
    };
    Object.assign(filterSpan.style, styles);
    Object.assign(textSpan.style, styles);
    textSpan.innerText = element.innerText;
  }
  function handleClick(liEl, index) {
    if (activeIndex === index) return;
    [...ul.children].forEach(li => li.classList.remove('active'));
    liEl.classList.add('active');
    activeIndex = index;
    updateEffectPosition(liEl);
    [...filterSpan.querySelectorAll('.gooey-particle')].forEach(p => filterSpan.removeChild(p));
    textSpan.classList.remove('active');
    void textSpan.offsetWidth;
    textSpan.classList.add('active');
    makeParticles(filterSpan);
  }

  function syncInitial() {
    const activeLi = ul.children[activeIndex];
    if (activeLi) { updateEffectPosition(activeLi); textSpan.classList.add('active'); }
  }
  syncInitial();
  const ro = new ResizeObserver(() => {
    const activeLi = ul.children[activeIndex];
    if (activeLi) updateEffectPosition(activeLi);
  });
  ro.observe(container);
}
