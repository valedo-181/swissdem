// SwissDem v4 : menu mobile et bande de devis, communs à toutes les pages.
// Menu mobile
(function(){
  const top = document.querySelector('.top'), b = top.querySelector('.menu-btn');
  b.addEventListener('click', () => { const o = top.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
  top.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => { top.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && top.classList.contains('open')) { top.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
})();

// Bande de devis : NPA suisses à 4 chiffres obligatoires
(function(){
  const f = document.querySelector('.skirt form');
  f.addEventListener('submit', e => {
    const ok = [...f.querySelectorAll('input[pattern]')].every(i => /^\d{4}$/.test(i.value.trim()));
    f.classList.toggle('invalid', !ok);
    f.querySelectorAll('input[pattern]').forEach(i => i.setAttribute('aria-invalid', /^\d{4}$/.test(i.value.trim()) ? 'false' : 'true'));
    if (!ok) e.preventDefault();
  });
})();

// Barre d'appel mobile : cachée tant que la bande de devis ou l'appel final du pied de page est à l'écran
// (un seul bouton jaune à la fois, et rien ne couvre « Continuer »)
(function(){
  const cibles = [...document.querySelectorAll('.skirt, .road .close')];
  if (!cibles.length || !('IntersectionObserver' in window)) return;
  const vues = new Set();
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? vues.add(e.target) : vues.delete(e.target));
    document.body.classList.toggle('skirt-on', vues.size > 0);
  });
  cibles.forEach(c => io.observe(c));
})();
