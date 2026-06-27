// ===================== MagicBento (ported) =====================
function initMagicBento(gridEl, cardData, opts = {}) {
  const {
    enableStars = true,
    enableSpotlight = true,
    enableBorderGlow = true,
    spotlightRadius = 300,
    particleCount = 8,
    glowColor = '124, 58, 237',
    enableTilt = false,
    clickEffect = true,
    enableMagnetism = true
  } = opts;

  const isMobile = window.innerWidth <= 768;
  const shouldDisableAnimations = isMobile;

  gridEl.classList.add('card-grid', 'bento-section');
  gridEl.innerHTML = '';

  cardData.forEach((card) => {
    const el = document.createElement('div');
    el.className = `magic-bento-card particle-container ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;
    el.style.setProperty('--glow-color', glowColor);
    el.innerHTML = `
      <div class="magic-bento-card__header">
        <div class="magic-bento-card__label">${card.label}</div>
      </div>
      <div class="magic-bento-card__content">
        <h2 class="magic-bento-card__title">${card.title}</h2>
        <p class="magic-bento-card__description">${card.description}</p>
      </div>
    `;
    gridEl.appendChild(el);

    if (shouldDisableAnimations) return;

    let isHovered = false;
    const timeouts = [];
    const activeParticles = [];

    function clearParticles() {
      timeouts.forEach(clearTimeout);
      timeouts.length = 0;
      activeParticles.forEach(p => {
        if (window.gsap) {
          gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.remove() });
        } else p.remove();
      });
      activeParticles.length = 0;
    }

    function spawnParticles() {
      if (!enableStars) return;
      for (let i = 0; i < particleCount; i++) {
        const t = setTimeout(() => {
          if (!isHovered) return;
          const rect = el.getBoundingClientRect();
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.style.left = `${Math.random() * rect.width}px`;
          particle.style.top = `${Math.random() * rect.height}px`;
          particle.style.background = `rgba(${glowColor}, 1)`;
          particle.style.boxShadow = `0 0 6px rgba(${glowColor}, 0.6)`;
          el.appendChild(particle);
          activeParticles.push(particle);
          if (window.gsap) {
            gsap.fromTo(particle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
            gsap.to(particle, {
              x: (Math.random() - 0.5) * 90, y: (Math.random() - 0.5) * 90,
              rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true
            });
            gsap.to(particle, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
          }
        }, i * 100);
        timeouts.push(t);
      }
    }

    el.addEventListener('mouseenter', () => {
      isHovered = true;
      spawnParticles();
      if (enableTilt && window.gsap) gsap.to(el, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    });
    el.addEventListener('mouseleave', () => {
      isHovered = false;
      clearParticles();
      if (window.gsap) {
        if (enableTilt) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
        if (enableMagnetism) gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      }
      el.style.setProperty('--glow-intensity', '0');
    });
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;

      if (enableSpotlight) {
        const relX = (x / rect.width) * 100, relY = (y / rect.height) * 100;
        el.style.setProperty('--glow-x', `${relX}%`);
        el.style.setProperty('--glow-y', `${relY}%`);
        el.style.setProperty('--glow-intensity', '1');
        el.style.setProperty('--glow-radius', `${spotlightRadius}px`);
      }
      if (window.gsap) {
        if (enableTilt) {
          gsap.to(el, { rotateX: ((y - cy) / cy) * -8, rotateY: ((x - cx) / cx) * 8, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
        }
        if (enableMagnetism) {
          gsap.to(el, { x: (x - cx) * 0.04, y: (y - cy) * 0.04, duration: 0.3, ease: 'power2.out' });
        }
      }
    });
    el.addEventListener('click', (e) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${maxDistance*2}px;height:${maxDistance*2}px;border-radius:50%;background:radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);left:${x-maxDistance}px;top:${y-maxDistance}px;pointer-events:none;z-index:1000;`;
      el.appendChild(ripple);
      if (window.gsap) {
        gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
      } else {
        setTimeout(() => ripple.remove(), 800);
      }
    });
  });

  // global spotlight glow tracking across whole grid (lightweight)
  if (enableSpotlight && !shouldDisableAnimations) {
    document.addEventListener('mousemove', (e) => {
      const rect = gridEl.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) {
        gridEl.querySelectorAll('.magic-bento-card').forEach(c => c.style.setProperty('--glow-intensity', '0'));
      }
    });
  }
}
