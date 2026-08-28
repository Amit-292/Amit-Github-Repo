// =============================
// Eksperty – script.js
// =============================

// ---------- Navbar scroll effect ----------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ---------- Active nav link on scroll ----------
const sections = document.querySelectorAll('section[id]');
const links    = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

// ---------- Scroll-reveal animation ----------
const revealEls = document.querySelectorAll(
  '.course-card, .testimonial-card, .about-stat-card, .contact-item'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

// ---------- Contact form ----------
const contactForm = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name    = contactForm.querySelector('[name="name"]').value.trim();
  const email   = contactForm.querySelector('[name="email"]').value.trim();
  const subject = contactForm.querySelector('[name="subject"]').value.trim();
  const message = contactForm.querySelector('[name="message"]').value.trim();

  const btn = contactForm.querySelector('button[type="submit"]');
  btn.textContent = 'Opening WhatsApp…';
  btn.disabled = true;

  const text = `Hi Eksperty! 👋\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;
  const whatsappURL = `https://wa.me/916302672256?text=${encodeURIComponent(text)}`;

  setTimeout(() => {
    window.open(whatsappURL, '_blank');
    formSuccess.classList.add('show');
    contactForm.reset();
    btn.textContent = 'Send Message 🚀';
    btn.disabled = false;
    setTimeout(() => formSuccess.classList.remove('show'), 5000);
  }, 800);
});

// ---------- Course Modal ----------
const modalOverlay = document.getElementById('modalOverlay');
const modalBody    = document.getElementById('modalBody');
const modalClose   = document.getElementById('modalClose');

document.querySelectorAll('[data-modal]').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-view-curriculum') || e.target.closest('.btn-view-curriculum')) {
      const tplId = 'tpl-' + card.dataset.modal;
      const tpl   = document.getElementById(tplId);
      if (tpl) {
        modalBody.innerHTML = '';
        modalBody.appendChild(tpl.content.cloneNode(true));
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
  });
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ---------- Smooth scroll for anchor links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
