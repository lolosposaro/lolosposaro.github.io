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

/* ===== HEADER BORDER ON SCROLL ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('header--scrolled', window.scrollY > 20);
}, { passive: true });

/* ===== ACTIVE NAV ON SCROLL ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav__link[href="#${entry.target.id}"]`)?.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' }).observe && sections.forEach(s =>
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav__link[href="#${entry.target.id}"]`)?.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe(s)
);

/* ===== SCROLL REVEAL ===== */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.07 });

document.querySelectorAll('.reveal').forEach((el) => {
  const siblings = [...(el.parentElement?.querySelectorAll('.reveal') || [])];
  el.style.transitionDelay = `${siblings.indexOf(el) * 80}ms`;
  revealObs.observe(el);
});

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsEl = document.querySelector('.stats');
if (statsEl) {
  let triggered = false;
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      statsEl.querySelectorAll('.stat__n').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count || '0'), 1400);
      });
    }
  }, { threshold: 0.3 }).observe(statsEl);
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

  function typeLoop() {
    const current = titles[titleIdx];
    if (deleting) {
      charIdx--;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        titleIdx = (titleIdx + 1) % titles.length;
        charIdx  = 0;
        setTimeout(typeLoop, 320);
        return;
      }
      setTimeout(typeLoop, 42);
    } else {
      charIdx++;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        setTimeout(() => { deleting = true; typeLoop(); }, 2600);
        return;
      }
      setTimeout(typeLoop, 72);
    }
  }

  setTimeout(() => { deleting = true; typeLoop(); }, 2400);
}
