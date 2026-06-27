// ===================== CardSwap (ported) =====================
function initCardSwap(container, cardsData, opts = {}) {
  const {
    width = 360, height = 260, cardDistance = 50, verticalDistance = 56,
    delay = 4500, pauseOnHover = true, skewAmount = 5, easing = 'elastic'
  } = opts;

  const config = easing === 'elastic'
    ? { ease: 'elastic.out(0.6,0.9)', durDrop: 1.6, durMove: 1.6, durReturn: 1.6, promoteOverlap: 0.9, returnDelay: 0.05 }
    : { ease: 'power1.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 };

  container.classList.add('card-swap-container');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.innerHTML = '';

  const cardEls = cardsData.map((data) => {
    const el = document.createElement('div');
    el.className = 'cs-card';
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.innerHTML = `<div><span class="cs-tag">${data.tag}</span><h3>${data.title}</h3></div><p>${data.desc}</p>`;
    container.appendChild(el);
    return el;
  });

  const total = cardEls.length;
  function makeSlot(i, distX, distY, total) {
    return { x: i * distX, y: -i * distY, z: -i * distX * 1.5, zIndex: total - i };
  }
  function placeNow(el, slot) {
    if (!window.gsap) return;
    gsap.set(el, { x: slot.x, y: slot.y, z: slot.z, xPercent: -50, yPercent: -50, skewY: skewAmount, transformOrigin: 'center center', zIndex: slot.zIndex, force3D: true });
  }

  let order = Array.from({ length: total }, (_, i) => i);
  let intervalId;

  cardEls.forEach((el, i) => placeNow(el, makeSlot(i, cardDistance, verticalDistance, total)));

  function swap() {
    if (!window.gsap || order.length < 2) return;
    const [front, ...rest] = order;
    const elFront = cardEls[front];
    const tl = gsap.timeline();

    tl.to(elFront, { y: '+=450', duration: config.durDrop, ease: config.ease });
    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const el = cardEls[idx];
      const slot = makeSlot(i, cardDistance, verticalDistance, total);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.12}`);
    });
    const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
    tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, 'return');
    tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return');
    tl.call(() => { order = [...rest, front]; });
  }

  swap();
  intervalId = window.setInterval(swap, delay);

  if (pauseOnHover) {
    container.addEventListener('mouseenter', () => clearInterval(intervalId));
    container.addEventListener('mouseleave', () => { intervalId = window.setInterval(swap, delay); });
  }
}
