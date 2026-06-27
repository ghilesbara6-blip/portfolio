// ===================== Counter (ported, simple spring via rAF — no `motion` dependency) =====================
function initCounter(container, value, opts = {}) {
  const {
    fontSize = 56,
    padding = 4,
    places = (() => {
      const str = value.toString();
      const chars = [...str];
      const dotIdx = chars.indexOf('.');
      return chars.map((ch, i) => {
        if (ch === '.') return '.';
        const exp = dotIdx === -1 ? chars.length - i - 1 : (i < dotIdx ? dotIdx - i - 1 : -(i - dotIdx));
        return 10 ** exp;
      });
    })(),
    gap = 4,
    borderRadius = 6,
    horizontalPadding = 4,
    textColor = '#f0eee8',
    fontWeight = 700
  } = opts;

  const height = fontSize + padding;

  container.classList.add('counter-container');
  const counter = document.createElement('span');
  counter.className = 'counter-counter';
  counter.style.fontSize = `${fontSize}px`;
  counter.style.gap = `${gap}px`;
  counter.style.borderRadius = `${borderRadius}px`;
  counter.style.paddingLeft = `${horizontalPadding}px`;
  counter.style.paddingRight = `${horizontalPadding}px`;
  counter.style.color = textColor;
  counter.style.fontWeight = fontWeight;
  counter.style.direction = 'ltr';
  container.appendChild(counter);

  function normalizeNearInteger(num) {
    const nearest = Math.round(num);
    const tolerance = 1e-9 * Math.max(1, Math.abs(num));
    return Math.abs(num - nearest) < tolerance ? nearest : num;
  }
  function getValueRoundedToPlace(v, place) { return Math.floor(normalizeNearInteger(v / place)); }

  const digitEls = [];

  places.forEach((place) => {
    const isDecimal = place === '.';
    const digitWrap = document.createElement('span');
    digitWrap.className = 'counter-digit';
    digitWrap.style.height = `${height}px`;
    if (isDecimal) {
      digitWrap.style.width = 'fit-content';
      digitWrap.textContent = '.';
      counter.appendChild(digitWrap);
      return;
    }
    for (let i = 0; i < 10; i++) {
      const numEl = document.createElement('span');
      numEl.className = 'counter-number';
      numEl.textContent = i;
      numEl.style.transform = 'translateY(0px)';
      digitWrap.appendChild(numEl);
    }
    counter.appendChild(digitWrap);
    digitEls.push({ place, el: digitWrap, current: 0 });
  });

  const gradWrap = document.createElement('span');
  gradWrap.className = 'gradient-container';
  gradWrap.innerHTML = `
    <span class="top-gradient" style="height:10px;background:linear-gradient(to bottom, transparent, transparent)"></span>
    <span class="bottom-gradient" style="height:10px;background:linear-gradient(to top, transparent, transparent)"></span>
  `;
  container.appendChild(gradWrap);

  function setDigit(entry, targetDigit, height) {
    [...entry.el.children].forEach((numEl, i) => {
      let offset = (10 + i - targetDigit) % 10;
      let y = offset * height;
      if (offset > 5) y -= 10 * height;
      numEl.style.transform = `translateY(${y}px)`;
      numEl.style.transition = 'transform 0.6s cubic-bezier(.2,.8,.2,1)';
    });
  }

  function animateTo(targetValue) {
    digitEls.forEach((entry) => {
      const target = getValueRoundedToPlace(targetValue, entry.place);
      const digit = ((target % 10) + 10) % 10;
      setDigit(entry, digit, height);
    });
  }

  // animate from 0 up to value on first paint
  requestAnimationFrame(() => {
    setTimeout(() => animateTo(value), 60);
  });

  return { update: animateTo };
}
