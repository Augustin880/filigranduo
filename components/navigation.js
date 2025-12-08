function initNavigation() {
  const toggle = document.getElementById('navigation-toggle-btn');
  const overlay = document.getElementById('navigation-mobile-menu');

  if (!toggle || !overlay) {
    console.warn('Navigation elements not found (yet)');
    return;
  }

  const backdrop = overlay.querySelector('.navigation-mobile-backdrop');

  function openMenu() {
    overlay.classList.add('navigation-active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('navigation-active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    overlay.classList.contains('navigation-active')
      ? closeMenu()
      : openMenu();
  });

  backdrop?.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}
