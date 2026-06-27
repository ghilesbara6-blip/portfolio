// ===================== BubbleMenu (ported) =====================
function initBubbleMenu(rootEl, items, opts = {}) {
  const { animationEase = 'back.out(1.5)', animationDuration = 0.5, staggerDelay = 0.12 } = opts;

  const toggleBtn = rootEl.querySelector('.toggle-bubble');
  const overlay = rootEl._overlay;
  const pillList = overlay.querySelector('.pill-list');
  let isOpen = false;

  function buildPills() {
    pillList.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'none');
      li.className = 'pill-col';
      const a = document.createElement('a');
      a.setAttribute('role', 'menuitem');
      a.href = item.href || '#';
      a.className = 'pill-link';
      a.style.setProperty('--item-rot', `${item.rotation ?? 0}deg`);
      a.style.setProperty('--hover-bg', item.hoverStyles?.bgColor || '#7C3AED');
      a.style.setProperty('--hover-color', item.hoverStyles?.textColor || '#fff');
      const span = document.createElement('span');
      span.className = 'pill-label';
      span.textContent = item.label;
      a.appendChild(span);
      a.addEventListener('click', (e) => {
        if (item.href && item.href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(item.href);
          closeMenu();
          if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 80);
        }
      });
      li.appendChild(a);
      pillList.appendChild(li);
    });
  }
  buildPills();

  function openMenu() {
    isOpen = true;
    toggleBtn.classList.add('open');
    overlay.classList.add('show');
    const bubbles = [...pillList.querySelectorAll('.pill-link')];
    const labels = [...pillList.querySelectorAll('.pill-label')];
    if (window.gsap) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(labels, { y: 24, autoAlpha: 0 });
      bubbles.forEach((bubble, i) => {
        const delay = i * staggerDelay + (Math.random() - 0.5) * 0.1;
        const tl = gsap.timeline({ delay });
        tl.to(bubble, { scale: 1, duration: animationDuration, ease: animationEase });
        if (labels[i]) {
          tl.to(labels[i], { y: 0, autoAlpha: 1, duration: animationDuration, ease: 'power3.out' }, `-=${animationDuration * 0.9}`);
        }
      });
    }
  }
  function closeMenu() {
    isOpen = false;
    toggleBtn.classList.remove('open');
    const bubbles = [...pillList.querySelectorAll('.pill-link')];
    const labels = [...pillList.querySelectorAll('.pill-label')];
    if (window.gsap) {
      gsap.killTweensOf([...bubbles, ...labels]);
      gsap.to(labels, { y: 24, autoAlpha: 0, duration: 0.2, ease: 'power3.in' });
      gsap.to(bubbles, {
        scale: 0, duration: 0.2, ease: 'power3.in',
        onComplete: () => overlay.classList.remove('show')
      });
    } else {
      overlay.classList.remove('show');
    }
  }

  toggleBtn.addEventListener('click', () => { isOpen ? closeMenu() : openMenu(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
}
