// ===================== ImageTrail (ported, variant 6 — speed-reactive) =====================
function initImageTrail(container, items) {
  function lerp(a, b, n) { return (1 - n) * a + n * b; }
  function getLocalPointerPos(e, rect) {
    let clientX = 0, clientY = 0;
    if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = e.clientX; clientY = e.clientY; }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  function getMouseDistance(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }

  container.classList.add('content');
  container.innerHTML = '';
  const images = items.map((url) => {
    const wrap = document.createElement('div');
    wrap.className = 'content__img';
    const inner = document.createElement('div');
    inner.className = 'content__img-inner';
    inner.style.backgroundImage = `url(${url})`;
    wrap.appendChild(inner);
    container.appendChild(wrap);
    return { el: wrap, inner, rect: null };
  });

  function getRect(img) { img.rect = img.el.getBoundingClientRect(); }
  images.forEach(getRect);
  window.addEventListener('resize', () => images.forEach(getRect));

  const imagesTotal = images.length;
  let imgPosition = 0;
  let zIndexVal = 1;
  let activeImagesCount = 0;
  let isIdle = true;
  const threshold = 60;

  let mousePos = { x: 0, y: 0 };
  let lastMousePos = { x: 0, y: 0 };
  let cacheMousePos = { x: 0, y: 0 };

  function mapSpeedToSize(speed, minSize, maxSize) { const maxSpeed = 200; return minSize + (maxSize - minSize) * Math.min(speed / maxSpeed, 1); }
  function mapSpeedToBrightness(speed, minB, maxB) { const maxSpeed = 70; return minB + (maxB - minB) * Math.min(speed / maxSpeed, 1); }
  function mapSpeedToBlur(speed, minBlur, maxBlur) { const maxSpeed = 90; return minBlur + (maxBlur - minBlur) * Math.min(speed / maxSpeed, 1); }
  function mapSpeedToGrayscale(speed, minG, maxG) { const maxSpeed = 90; return minG + (maxG - minG) * Math.min(speed / maxSpeed, 1); }

  function showNextImage() {
    const dx = mousePos.x - cacheMousePos.x;
    const dy = mousePos.y - cacheMousePos.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    zIndexVal++;
    imgPosition = imgPosition < imagesTotal - 1 ? imgPosition + 1 : 0;
    const img = images[imgPosition];

    const scaleFactor = mapSpeedToSize(speed, 0.3, 1.7);
    const brightnessValue = mapSpeedToBrightness(speed, 0, 1.3);
    const blurValue = mapSpeedToBlur(speed, 16, 0);
    const grayscaleValue = mapSpeedToGrayscale(speed, 500, 0);

    if (!window.gsap) return;
    gsap.killTweensOf(img.el);
    gsap.timeline({
      onStart: () => { activeImagesCount++; isIdle = false; },
      onComplete: () => { activeImagesCount--; if (activeImagesCount === 0) isIdle = true; }
    })
      .fromTo(img.el,
        { opacity: 1, scale: 0, zIndex: zIndexVal, x: cacheMousePos.x - img.rect.width / 2, y: cacheMousePos.y - img.rect.height / 2 },
        { duration: 0.7, ease: 'power3', scale: scaleFactor,
          filter: `grayscale(${grayscaleValue}%) brightness(${brightnessValue * 100}%) blur(${blurValue}px)`,
          x: mousePos.x - img.rect.width / 2, y: mousePos.y - img.rect.height / 2 }, 0)
      .fromTo(img.inner, { scale: 2 }, { duration: 0.7, ease: 'power3', scale: 1 }, 0)
      .to(img.el, { duration: 0.35, ease: 'power3.in', opacity: 0, scale: 0.2 }, 0.4);
  }

  function render() {
    const distance = getMouseDistance(mousePos, lastMousePos);
    cacheMousePos.x = lerp(cacheMousePos.x, mousePos.x, 0.3);
    cacheMousePos.y = lerp(cacheMousePos.y, mousePos.y, 0.3);
    if (distance > threshold) { showNextImage(); lastMousePos = { ...mousePos }; }
    if (isIdle && zIndexVal !== 1) zIndexVal = 1;
    requestAnimationFrame(render);
  }

  function handlePointerMove(ev) {
    const rect = container.getBoundingClientRect();
    mousePos = getLocalPointerPos(ev, rect);
  }
  container.addEventListener('mousemove', handlePointerMove);
  container.addEventListener('touchmove', handlePointerMove);

  function initRender(ev) {
    const rect = container.getBoundingClientRect();
    mousePos = getLocalPointerPos(ev, rect);
    cacheMousePos = { ...mousePos };
    requestAnimationFrame(render);
    container.removeEventListener('mousemove', initRender);
    container.removeEventListener('touchmove', initRender);
  }
  container.addEventListener('mousemove', initRender);
  container.addEventListener('touchmove', initRender);
}
