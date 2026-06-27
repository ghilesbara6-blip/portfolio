// ============================================================
//  DockNavbar — vanilla JS port of the React DockNavbar
//  macOS-style dock with magnification hover effect.
//  Items grow on hover; immediate neighbors scale up proportionally.
// ============================================================

function initDockNavbar(container, items) {
  if (!container) return;

  // ── Build DOM ────────────────────────────────────────────────
  container.innerHTML = '';
  container.className = 'dock-navbar__wrap';

  const nav = document.createElement('nav');
  nav.className = 'dock-navbar__bar';
  nav.setAttribute('aria-label', 'Dock navigation');

  const ul = document.createElement('ul');
  ul.className = 'dock-navbar__list';

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'dock-navbar__item';

    // Link or button
    let inner;
    if (item.href) {
      inner = document.createElement('a');
      inner.className = 'dock-navbar__link';
      inner.href = item.href;
    } else {
      inner = document.createElement('button');
      inner.className = 'dock-navbar__link dock-navbar__btn';
      inner.type = 'button';
      if (item.onClick) inner.addEventListener('click', item.onClick);
    }

    const img = document.createElement('img');
    img.className = 'dock-navbar__icon';
    img.src = item.icon;
    img.alt = item.label;
    img.loading = 'eager';
    inner.appendChild(img);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'dock-navbar__tooltip';
    const tooltipSpan = document.createElement('span');
    tooltipSpan.textContent = item.label;
    tooltip.appendChild(tooltipSpan);

    li.appendChild(inner);
    li.appendChild(tooltip);

    // ── Magnification events ─────────────────────────────────
    li.addEventListener('mouseenter', () => {
      li.classList.add('hover');
      const prev1 = ul.children[idx - 1];
      const next1 = ul.children[idx + 1];
      const prev2 = ul.children[idx - 2];
      const next2 = ul.children[idx + 2];
      if (prev1) prev1.classList.add('sibling-close');
      if (next1) next1.classList.add('sibling-close');
      if (prev2) prev2.classList.add('sibling-far');
      if (next2) next2.classList.add('sibling-far');
    });

    li.addEventListener('mouseleave', () => {
      li.classList.remove('hover');
      const prev1 = ul.children[idx - 1];
      const next1 = ul.children[idx + 1];
      const prev2 = ul.children[idx - 2];
      const next2 = ul.children[idx + 2];
      if (prev1) prev1.classList.remove('sibling-close');
      if (next1) next1.classList.remove('sibling-close');
      if (prev2) prev2.classList.remove('sibling-far');
      if (next2) next2.classList.remove('sibling-far');
    });

    ul.appendChild(li);
  });

  nav.appendChild(ul);
  container.appendChild(nav);
}
