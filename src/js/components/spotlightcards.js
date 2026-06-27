// ============================================================
//  SpotlightCards — aurora ambient + magnetic 3D tilt + focus-dim
//  Vanilla JS port. Call initSpotlightCards(container, items, opts).
// ============================================================

function initSpotlightCards(container, items, opts) {
  if (!container) return;
  const options = opts || {};
  const tiltMax = options.tiltMax || 9;

  container.innerHTML = '';
  container.classList.add('spotlight-cards');

  const grid = document.createElement('div');
  grid.className = 'spotlight-grid';
  container.appendChild(grid);

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'spotlight-card';
    card.dataset.title = item.title;

    card.innerHTML = `
      <div class="spotlight-card-tint" style="background: radial-gradient(ellipse at 20% 20%, ${item.color}1f, transparent 65%);"></div>
      <div class="spotlight-card-glow" style="background: radial-gradient(ellipse at 20% 20%, ${item.color}33, transparent 65%);"></div>
      <div class="spotlight-card-shimmer"></div>
      <div class="spotlight-card-icon" style="background:${item.color}1f; box-shadow: inset 0 0 0 1px ${item.color}40; color:${item.color};">
        ${item.icon}
      </div>
      <div class="spotlight-card-text">
        <h3 class="spotlight-card-title">${item.title}</h3>
        <p class="spotlight-card-desc">${item.description}</p>
      </div>
      <div class="spotlight-card-accent" style="background: linear-gradient(to right, ${item.color}90, transparent);"></div>
    `;

    let rafId = null;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    const STIFFNESS = 0.18;

    function animate() {
      currentRotX += (targetRotX - currentRotX) * STIFFNESS;
      currentRotY += (targetRotY - currentRotY) * STIFFNESS;
      card.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;

      if (Math.abs(targetRotX - currentRotX) > 0.01 || Math.abs(targetRotY - currentRotY) > 0.01) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
      }
    }

    function startAnimation() {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;
      targetRotX = tiltMax - normY * tiltMax * 2;
      targetRotY = normX * tiltMax * 2 - tiltMax;
      startAnimation();
    });

    card.addEventListener('mouseenter', () => setHovered(item.title));

    card.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
      startAnimation();
      setHovered(null);
    });

    grid.appendChild(card);
  });

  function setHovered(title) {
    const cards = grid.querySelectorAll('.spotlight-card');
    if (title === null) {
      grid.classList.remove('has-hover');
      cards.forEach((c) => c.classList.remove('dimmed'));
      return;
    }
    grid.classList.add('has-hover');
    cards.forEach((c) => {
      c.classList.toggle('dimmed', c.dataset.title !== title);
    });
  }
}
