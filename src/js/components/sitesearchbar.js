// ============================================================
//  SiteSearchBar — vanilla JS port of ActionSearchBar.
//  A real, always-visible search bar pinned to the top of the
//  page. Typing filters a live dropdown of site-wide actions
//  (sections, contact, links); Enter/click runs action.onSelect().
//  Call initSiteSearchBar(container, actions).
// ============================================================

function initSiteSearchBar(container, actions) {
  if (!container) return;

  container.innerHTML = '';
  container.className = 'site-search';

  container.innerHTML = `
    <div class="site-search-bar">
      <span class="site-search-icon-slot">
        <svg class="site-search-icon site-search-icon-search icon-visible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <svg class="site-search-icon site-search-icon-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </span>
      <input
        id="site-search-input"
        class="site-search-input"
        type="text"
        placeholder="Search the site — sections, contact, links…"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
      />
      <kbd class="site-search-kbd">&#8984;K</kbd>
    </div>
    <div class="site-search-results" role="listbox" aria-label="Search results">
      <ul class="site-search-list"></ul>
      <div class="site-search-footer">
        <span>&#8593;&#8595; navigate</span>
        <span>&#8629; select</span>
        <span>esc to close</span>
      </div>
    </div>
  `;

  const input = container.querySelector('#site-search-input');
  const resultsPanel = container.querySelector('.site-search-results');
  const list = container.querySelector('.site-search-list');
  const iconSearch = container.querySelector('.site-search-icon-search');
  const iconSend = container.querySelector('.site-search-icon-send');

  let query = '';
  let isFocused = false;
  let selectedAction = null;
  let activeIndex = -1;
  let filtered = actions;
  let debounceTimer = null;

  function recomputeFiltered() {
    const normalized = query.toLowerCase().trim();
    filtered = !normalized
      ? actions
      : actions.filter((a) => `${a.label} ${a.description || ''}`.toLowerCase().includes(normalized));
    render();
  }

  function debouncedRecompute() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(recomputeFiltered, 150);
  }

  function render() {
    if (query.length > 0) {
      iconSearch.classList.remove('icon-visible');
      iconSend.classList.add('icon-visible');
    } else {
      iconSend.classList.remove('icon-visible');
      iconSearch.classList.add('icon-visible');
    }

    const shouldShow = isFocused && !selectedAction;
    input.setAttribute('aria-expanded', String(shouldShow));

    if (!shouldShow) {
      resultsPanel.classList.remove('open');
      return;
    }

    list.innerHTML = '';

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'site-search-empty';
      empty.textContent = 'No matching commands';
      list.appendChild(empty);
    } else {
      filtered.forEach((action, index) => {
        const li = document.createElement('li');
        li.className = 'site-search-item';
        li.id = `site-search-action-${action.id}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(index === activeIndex));
        if (index === activeIndex) li.classList.add('active');

        li.innerHTML = `
          <div class="site-search-item-main">
            <span class="site-search-item-icon" aria-hidden="true" style="color:${action.color || 'var(--violet)'}">${action.icon || ''}</span>
            <span class="site-search-item-label">${action.label}</span>
            ${action.description ? `<span class="site-search-item-desc">${action.description}</span>` : ''}
          </div>
          <div class="site-search-item-right">
            ${action.short ? `<span class="site-search-item-short">${action.short}</span>` : ''}
            ${action.end ? `<span class="site-search-item-end">${action.end}</span>` : ''}
          </div>
        `;

        li.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus, avoid blur-before-click race
        li.addEventListener('click', () => selectAction(action));
        list.appendChild(li);
      });
    }

    resultsPanel.classList.add('open');

    const items = list.querySelectorAll('.site-search-item');
    items.forEach((el, i) => {
      el.classList.remove('animate-in');
      void el.offsetWidth;
      setTimeout(() => el.classList.add('animate-in'), 30 + i * 60);
    });
  }

  function selectAction(action) {
    selectedAction = action;
    render();
    if (typeof action.onSelect === 'function') action.onSelect();
    // Reset shortly after so the bar is ready for the next search.
    setTimeout(() => {
      selectedAction = null;
      query = '';
      input.value = '';
    }, 300);
  }

  input.addEventListener('input', (e) => {
    query = e.target.value;
    activeIndex = -1;
    render();
    debouncedRecompute();
  });

  input.addEventListener('focus', () => {
    selectedAction = null;
    isFocused = true;
    activeIndex = -1;
    recomputeFiltered();
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      isFocused = false;
      activeIndex = -1;
      render();
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (!filtered.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = activeIndex < filtered.length - 1 ? activeIndex + 1 : 0;
        render();
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = activeIndex > 0 ? activeIndex - 1 : filtered.length - 1;
        render();
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) selectAction(filtered[activeIndex]);
        break;
      case 'Escape':
        isFocused = false;
        activeIndex = -1;
        input.blur();
        render();
        break;
    }
  });

  // ── Global ⌘K / Ctrl+K focuses the bar from anywhere on the page ──
  document.addEventListener('keydown', (e) => {
    const isK = e.key === 'k' || e.key === 'K';
    if ((e.metaKey || e.ctrlKey) && isK) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  window.focusSiteSearch = () => input.focus();

  // ── Mobile: tapping the collapsed pill expands + focuses it ──
  const bar = container.querySelector('.site-search-bar');
  bar.addEventListener('click', (e) => {
    if (e.target === input) return;
    container.classList.add('is-active');
    input.focus();
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!query) container.classList.remove('is-active');
    }, 150);
  });

  render();
}
