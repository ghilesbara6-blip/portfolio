// ===================== TiltedCard (ported, lightweight spring, no `motion` dependency) =====================
function initTiltedCard(figureEl, opts = {}) {
  const {
    imageSrc, altText = 'Tilted card image', captionText = '',
    containerHeight = '320px', containerWidth = '100%',
    imageHeight = '320px', imageWidth = '320px',
    scaleOnHover = 1.06, rotateAmplitude = 10,
    showTooltip = true, displayOverlayContent = false, overlayHtml = ''
  } = opts;

  figureEl.classList.add('tilted-card-figure');
  figureEl.style.height = containerHeight;
  figureEl.style.width = containerWidth;

  const inner = document.createElement('div');
  inner.className = 'tilted-card-inner';
  inner.style.width = imageWidth;
  inner.style.height = imageHeight;

  const img = document.createElement('img');
  img.src = imageSrc;
  img.alt = altText;
  img.className = 'tilted-card-img';
  img.style.width = imageWidth;
  img.style.height = imageHeight;
  inner.appendChild(img);

  if (displayOverlayContent && overlayHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'tilted-card-overlay';
    overlay.innerHTML = overlayHtml;
    inner.appendChild(overlay);
  }
  figureEl.appendChild(inner);

  let caption;
  if (showTooltip) {
    caption = document.createElement('figcaption');
    caption.className = 'tilted-card-caption';
    caption.textContent = captionText;
    figureEl.appendChild(caption);
  }

  // spring state
  const state = { rx: 0, ry: 0, scale: 1, opacity: 0, capX: 0, capY: 0, rotFig: 0 };
  const target = { rx: 0, ry: 0, scale: 1, opacity: 0, capX: 0, capY: 0, rotFig: 0 };
  let lastY = 0;
  let raf;

  function tick() {
    const k = 0.18;
    state.rx += (target.rx - state.rx) * k;
    state.ry += (target.ry - state.ry) * k;
    state.scale += (target.scale - state.scale) * k;
    state.opacity += (target.opacity - state.opacity) * k;
    state.capX += (target.capX - state.capX) * k;
    state.capY += (target.capY - state.capY) * k;
    state.rotFig += (target.rotFig - state.rotFig) * k;

    inner.style.transform = `rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale(${state.scale})`;
    if (caption) {
      caption.style.transform = `translate(${state.capX}px, ${state.capY}px) rotate(${state.rotFig}deg)`;
      caption.style.opacity = state.opacity;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  figureEl.addEventListener('mousemove', (e) => {
    const rect = figureEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    target.rx = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    target.ry = (offsetX / (rect.width / 2)) * rotateAmplitude;
    target.capX = e.clientX - rect.left;
    target.capY = e.clientY - rect.top;
    const velocityY = offsetY - lastY;
    target.rotFig = -velocityY * 0.6;
    lastY = offsetY;
  });
  figureEl.addEventListener('mouseenter', () => { target.scale = scaleOnHover; target.opacity = 1; });
  figureEl.addEventListener('mouseleave', () => { target.opacity = 0; target.scale = 1; target.rx = 0; target.ry = 0; target.rotFig = 0; });

  return () => cancelAnimationFrame(raf);
}
