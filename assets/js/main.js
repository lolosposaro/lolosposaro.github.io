/* ===== MOBILE NAV ===== */
const toggle  = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');

toggle?.addEventListener('click', () => {
  navList?.classList.toggle('open');
  const icon = toggle.querySelector('i');
  if (icon) icon.className = navList?.classList.contains('open') ? 'bx bx-x' : 'bx bx-menu';
});

document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navList?.classList.remove('open');
    const icon = toggle?.querySelector('i');
    if (icon) icon.className = 'bx bx-menu';
  });
});

/* ===== ACTIVE NAV ON SCROLL ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
      active?.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ===== SCROLL REVEAL ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((el) => {
  const siblings = [...(el.parentElement?.querySelectorAll('.reveal') || [])];
  const idx = siblings.indexOf(el);
  el.style.transitionDelay = `${idx * 75}ms`;
  revealObserver.observe(el);
});

/* ===== SKILL BARS ===== */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill__bar-fill').forEach(bar => {
        bar.style.width = (bar.dataset.width || '0') + '%';
      });
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.skill__category').forEach(cat => barObserver.observe(cat));

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsGrid = document.querySelector('.stats__grid');
if (statsGrid) {
  let counted = false;
  const countObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !counted) {
      counted = true;
      statsGrid.querySelectorAll('.stat__number').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count || '0'), 1500);
      });
    }
  }, { threshold: 0.3 });
  countObserver.observe(statsGrid);
}

/* ===== TYPING EFFECT ===== */
const titles = [
  'Senior DevOps Engineer',
  'Platform Engineer',
  'Cloud Architect',
  'SRE',
];

const typedEl = document.getElementById('typed-text');
if (typedEl) {
  let titleIdx = 0;
  let charIdx  = titles[0].length;
  let deleting = false;

  typedEl.textContent = titles[0];

  // titles[0] is already shown; start the delete-then-cycle after a pause
  function typeLoop() {
    const current = titles[titleIdx];

    if (deleting) {
      charIdx--;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        titleIdx = (titleIdx + 1) % titles.length;
        charIdx  = 0;
        setTimeout(typeLoop, 350);
        return;
      }
      setTimeout(typeLoop, 45);
    } else {
      charIdx++;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        setTimeout(() => { deleting = true; typeLoop(); }, 2800);
        return;
      }
      setTimeout(typeLoop, 75);
    }
  }

  setTimeout(() => { deleting = true; typeLoop(); }, 2500);
}

/* ===== HEADER SHADOW ON SCROLL ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header?.classList.add('header--scrolled');
  } else {
    header?.classList.remove('header--scrolled');
  }
}, { passive: true });
