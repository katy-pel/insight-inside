/* ============================================================
   Insight Inside — main.js (onepager v2.0)
   ============================================================ */

/* --- KONFIGURACE -------------------------------------------
   Vložte sem endpoint formulářové služby (Formspree / web3forms).
   Příklad Formspree:  'https://formspree.io/f/xxxxxxxx'
   Příklad web3forms:  'https://api.web3forms.com/submit'  (+ access_key níže)
   Dokud je prázdný, formulář použije e-mailový (mailto) fallback.
------------------------------------------------------------ */
const FORM_ENDPOINT = '';                 // <-- doplní klient
const WEB3FORMS_ACCESS_KEY = '';          // <-- jen pro web3forms
const CONTACT_EMAIL = 'info@insight-inside.cz';

/* --- Sticky Nav -------------------------------------------- */
const nav = document.querySelector('.nav');
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* --- Mobile Menu ------------------------------------------- */
const hamburger = document.querySelector('.nav__hamburger');
const mobileMenu = document.querySelector('.nav__mobile');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Zavřít po kliknutí na odkaz
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* --- Scroll Fade-in ---------------------------------------- */
const fadeEls = document.querySelectorAll('.fade-in');
if (fadeEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => observer.observe(el));
}

/* --- Smooth scroll pro kotvy (offset pod sticky hlavičku) -- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') {                       // logo / "nahoru"
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* --- Scrollspy: aktivní odkaz podle pozice ----------------- */
const navLinks = Array.from(document.querySelectorAll('.nav__links .nav__link'));
const spySections = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (spySections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link =>
          link.classList.toggle('active', link.getAttribute('href') === '#' + id)
        );
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  spySections.forEach(sec => spy.observe(sec));
}

/* --- Kontaktní formulář ------------------------------------ */
const form = document.querySelector('.contact-form');
if (form) {
  const status = form.querySelector('.form-status');

  const showStatus = (msg, ok) => {
    if (!status) return;
    status.textContent = msg;
    status.className = 'form-status is-visible ' + (ok ? 'form-status--ok' : 'form-status--error');
  };

  const buildMailto = (d) => {
    const body =
      `Jméno: ${d.name || ''}\n` +
      `Firma: ${d.company || ''}\n` +
      `E-mail: ${d.email || ''}\n` +
      `Telefon: ${d.phone || ''}\n` +
      `Typ poptávky: ${d.type || ''}\n\n` +
      `Zpráva:\n${d.message || ''}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Poptávka z webu — ' + (d.name || ''))}` +
           `&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot — pokud je vyplněn, tiše ignorovat (spam)
    if (form.querySelector('[name="_gotcha"]')?.value) return;

    // Nativní validace (required pole + souhlas)
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // Bez nakonfigurovaného endpointu → e-mailový fallback
    if (!FORM_ENDPOINT) {
      window.location.href = buildMailto(data);
      showStatus('Otevíráme váš e-mailový klient s předvyplněnou zprávou…', true);
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Odesílám…'; }

    try {
      if (WEB3FORMS_ACCESS_KEY) fd.append('access_key', WEB3FORMS_ACCESS_KEY);
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        form.reset();
        showStatus('Děkujeme! Vaše poptávka byla odeslána. Ozveme se vám co nejdříve.', true);
      } else {
        throw new Error('Server vrátil chybu ' + res.status);
      }
    } catch (err) {
      showStatus('Odeslání se nezdařilo. Zkuste to prosím znovu, nebo nám napište na ' + CONTACT_EMAIL + '.', false);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  });
}
