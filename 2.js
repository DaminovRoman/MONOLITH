/* ============================================================
   MONOLITH — Neo Monolith Luxury — behavior layer
   Vanilla JS, no dependencies.
   ============================================================ */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. LIGHT SEAM — scroll progress fill + section ticks
     Trigger: window scroll (rAF-throttled)
     Duration: continuous, driven by scroll position (not time)
     Easing: linear (progress bars should track 1:1 with input)
     Purpose: signature element — orientation + atmosphere
  ---------------------------------------------------------- */
  const seamFill = document.getElementById('seamFill');
  const seamTicks = document.getElementById('seamTicks');
  const sections = [...document.querySelectorAll('main > section[id], .hero')];

  function buildTicks() {
    if (!seamTicks) return;
    seamTicks.innerHTML = '';
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    sections.forEach((sec) => {
      if (!sec.id) return;
      const ratio = sec.offsetTop / docHeight;
      const tick = document.createElement('div');
      tick.className = 'seam-tick';
      tick.style.top = `${ratio * 100}%`;
      tick.dataset.sectionId = sec.id;
      const label = document.createElement('span');
      label.className = 'seam-tick__label';
      label.textContent = sec.id.replace('-', ' ');
      tick.appendChild(label);
      seamTicks.appendChild(tick);
    });
  }

  let ticking = false;
  function updateSeam() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    if (seamFill) {
      const isMobile = window.matchMedia('(max-width: 860px)').matches;
      if (isMobile) seamFill.style.width = `${progress * 100}%`;
      else seamFill.style.height = `${progress * 100}%`;
    }

    // Active tick = last section whose top has been passed
    let activeSection = sections[0]?.id;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top - 120 <= 0) activeSection = sec.id;
    }
    document.querySelectorAll('.seam-tick').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.sectionId === activeSection);
    });

    // Nav scrolled state
    document.getElementById('siteNav')?.classList.toggle('is-scrolled', scrollTop > 40);

    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateSeam);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('load', () => { buildTicks(); updateSeam(); });
  window.addEventListener('resize', () => { buildTicks(); updateSeam(); });

  /* ----------------------------------------------------------
     2. SMOOTH REVEAL — scroll-triggered fade+rise
     Trigger: element enters viewport (IntersectionObserver, 15% visible)
     Duration: 1000ms (700ms for delayed group, staggered via CSS transition-delay)
     Delay: 0ms base / 150ms for [data-reveal-delay]
     Easing: var(--ease-luxury) = cubic-bezier(0.16,1,0.3,1) — decelerated, "settles" softly
     Purpose: each section arrives like a showroom spotlight turning on, never jarring
  ---------------------------------------------------------- */
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-reveal], [data-reveal-delay]').forEach((el) => revealObserver.observe(el));
  } else {
    // Reduced motion or no IO support: show everything immediately
    document.querySelectorAll('[data-reveal], [data-reveal-delay]').forEach((el) => el.classList.add('is-visible'));
  }

  /* ----------------------------------------------------------
     2b. PROCESS STEP SYNC — ambient number tracks active timeline step
     Trigger: timeline item crosses viewport center (IntersectionObserver)
     Duration: 400ms opacity/label crossfade (CSS)
     Purpose: turns the empty right-hand space next to a left-aligned
     timeline into a live readout, echoing the mono spec readouts elsewhere
  ---------------------------------------------------------- */
  const markNum = document.getElementById('processMarkNum');
  const markLabel = document.getElementById('processMarkLabel');
  const timelineItems = document.querySelectorAll('.timeline__item');
  if (timelineItems.length && markNum && 'IntersectionObserver' in window) {
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const step = entry.target.dataset.step;
          const title = entry.target.querySelector('h3')?.textContent || '';
          markNum.textContent = step;
          markLabel.textContent = title;
        }
      });
    }, { threshold: 0.6, rootMargin: '-30% 0px -30% 0px' });
    timelineItems.forEach((item) => stepObserver.observe(item));
  }

  /* ----------------------------------------------------------
     2c. STAT COUNTERS — numbers count up from 0 on first view
     Trigger: .philosophy__stats enters viewport (IntersectionObserver, once)
     Duration: 1400ms, eased (fast start, gentle settle)
     Purpose: gives the philosophy stats (11 / 340+ / 92%) a moment of
     confirmation rather than appearing as static, pre-set text
  ---------------------------------------------------------- */
  const statNums = document.querySelectorAll('.stat__num');
  if (statNums.length) {
    const animateStat = (el) => {
      const raw = el.textContent.trim();
      const match = raw.match(/^(\d+)(.*)$/); // splits "340+" -> "340", "+"
      if (!match) return;
      const target = parseInt(match[1], 10);
      const suffix = match[2] || '';
      if (prefersReducedMotion) { el.textContent = `${target}${suffix}`; return; }

      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = `${target}${suffix}`;
      }
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const statObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.stat__num').forEach(animateStat);
            statObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('.philosophy__stats').forEach((el) => statObserver.observe(el));
    } else {
      statNums.forEach(animateStat);
    }
  }

  /* ----------------------------------------------------------
     3. MAGNETIC BUTTONS
     Trigger: mousemove within button bounds (desktop / fine pointer only)
     Duration: 300ms return-to-rest on mouseleave
     Delay: 0ms
     Easing: var(--ease-magnet) = cubic-bezier(0.34,1.56,0.64,1) — slight overshoot, "magnetic snap"
     Purpose: buttons feel weighted/responsive like a physical control, reinforcing precision-engineering feel
  ---------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.btn--magnetic').forEach((btn) => {
      const strength = 14;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transition = 'transform 0.15s ease-out';
        btn.style.transform = `translate(${(x / rect.width) * strength}px, ${(y / rect.height) * strength}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ----------------------------------------------------------
     4. CURSOR GLOW — ambient light following pointer
     Trigger: mousemove over document (fine pointer only)
     Duration: continuous, 120ms trailing smoothing via CSS left/top transition
     Delay: 0ms
     Easing: var(--ease-soft)
     Purpose: reinforces "showroom ambient light" atmosphere without being a gimmick — very low opacity
  ---------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let glowActive = false;
    document.addEventListener('mousemove', (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
      if (!glowActive) { glow.classList.add('is-active'); glowActive = true; }
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
  }

  /* ----------------------------------------------------------
     5. MOBILE MENU
  ---------------------------------------------------------- */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  const siteNav = document.getElementById('siteNav');
  function closeMobileMenu() {
    burger?.setAttribute('aria-expanded', 'false');
    if (mobileMenu) mobileMenu.hidden = true;
    siteNav?.classList.remove('nav--menu-open');
    document.body.style.overflow = '';
  }
  burger?.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    if (mobileMenu) mobileMenu.hidden = isOpen;
    siteNav?.classList.toggle('nav--menu-open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });
  mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileMenu));

  /* ----------------------------------------------------------
     6. CONFIGURATOR — color / wheels / interior / lighting
     Trigger: click on swatch / pill
     Duration: 600ms glow color transition (CSS), instant text update
     Purpose: give immediate, tactile feedback that the car is "yours" — reduces
     decision friction, a well-documented lever for premium purchase confidence
  ---------------------------------------------------------- */
  const configState = {
    color: 'Обсидиан чёрный',
    colorHex: '#1a1a1d',
    wheels: '21″ Forged',
    interior: 'Чёрная кожа',
    light: 'Янтарное',
    basePrice: 48900000,
  };

  const priceModifiers = {
    wheelExtra: { '22″ Carbon': 890000, '20″ Classic': 0, '21″ Forged': 0 },
    interiorExtra: { 'Кремовый Alcantara': 420000, 'Коньячная кожа': 540000, 'Чёрная кожа': 0 },
  };

  function formatPrice(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  function updateReadout() {
    const readoutConfig = document.getElementById('readoutConfig');
    const readoutPrice = document.getElementById('readoutPrice');
    if (readoutConfig) readoutConfig.textContent = `${configState.color} · ${configState.wheels} · ${configState.interior}`;
    const total = configState.basePrice
      + (priceModifiers.wheelExtra[configState.wheels] || 0)
      + (priceModifiers.interiorExtra[configState.interior] || 0);
    if (readoutPrice) readoutPrice.textContent = formatPrice(total);
  }

  document.querySelectorAll('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach((s) => { s.classList.remove('is-active'); s.setAttribute('aria-checked', 'false'); });
      sw.classList.add('is-active');
      sw.setAttribute('aria-checked', 'true');
      configState.colorHex = sw.dataset.color;
      configState.color = sw.getAttribute('aria-label');
      const glow = document.getElementById('configGlow');
      if (glow) glow.style.background = configState.colorHex;
      updateReadout();
    });
  });

  document.querySelectorAll('[data-wheels]').forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.parentElement.querySelectorAll('.pill').forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-checked', 'false'); });
      pill.classList.add('is-active');
      pill.setAttribute('aria-checked', 'true');
      configState.wheels = pill.dataset.wheels;
      updateReadout();
    });
  });
  document.querySelectorAll('[data-interior]').forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.parentElement.querySelectorAll('.pill').forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-checked', 'false'); });
      pill.classList.add('is-active');
      pill.setAttribute('aria-checked', 'true');
      configState.interior = pill.dataset.interior;
      updateReadout();
    });
  });
  document.querySelectorAll('[data-light]').forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.parentElement.querySelectorAll('.pill').forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-checked', 'false'); });
      pill.classList.add('is-active');
      pill.setAttribute('aria-checked', 'true');
      configState.light = pill.dataset.light;
    });
  });

  // Initialize glow to default color on load
  window.addEventListener('DOMContentLoaded', () => {
    const glow = document.getElementById('configGlow');
    if (glow) glow.style.background = configState.colorHex;
    updateReadout();
  });

  /* ----------------------------------------------------------
     7. CONSULTATION MODAL
     Trigger: click [data-open-consult] / close via backdrop, ✕, or Escape
     Duration: 500ms panel entrance (CSS), 400ms backdrop fade
     Easing: var(--ease-luxury) for panel, var(--ease-soft) for backdrop
     Purpose: single, focused conversion action reachable from anywhere on the page
  ---------------------------------------------------------- */
  const modal = document.getElementById('consultModal');
  const consultForm = document.getElementById('consultForm');
  const modalNote = document.getElementById('modalNote');
  let lastFocused = null;

  function openModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeMobileMenu();
    const firstField = modal.querySelector('input');
    firstField?.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  document.querySelectorAll('[data-open-consult]').forEach((btn) => btn.addEventListener('click', openModal));
  document.querySelectorAll('[data-close-consult]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  consultForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (modalNote) modalNote.textContent = 'Спасибо! Персональный менеджер свяжется с вами в течение 15 минут.';
    consultForm.reset();
    setTimeout(closeModal, 2200);
  });

  /* ----------------------------------------------------------
     8. NAV LINK SMOOTH SCROLL WITH SEAM SYNC (fallback safe)
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ----------------------------------------------------------
     9. VIEW TRANSITIONS API — graceful progressive enhancement
     Applies a soft cross-fade when navigating within the page via anchor
     links, on browsers that support it. No-op fallback everywhere else.
  ---------------------------------------------------------- */
  if (document.startViewTransition && !prefersReducedMotion) {
    document.documentElement.classList.add('vt-supported');
  }

})();
