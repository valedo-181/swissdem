// SwissDem v7 : menu mobile, cartouche de devis, barre d'appel, plan interactif et mouvement au défilement, communs à toutes les pages.
// Menu mobile
(function(){
  const top = document.querySelector('.top'), b = top && top.querySelector('.menu-btn');
  if (!b) return;
  const poser = o => { top.classList.toggle('open', o); b.setAttribute('aria-expanded', o); };
  b.addEventListener('click', () => poser(!top.classList.contains('open')));
  top.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => poser(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && top.classList.contains('open')) { poser(false); b.focus(); } });
})();

// Cartouche de devis : NPA suisses à 4 chiffres obligatoires
(function(){
  const f = document.querySelector('.cartouche form');
  if (!f) return;
  f.addEventListener('submit', e => {
    const champs = [...f.querySelectorAll('input[pattern]')];
    champs.forEach(i => i.setAttribute('aria-invalid', /^\d{4}$/.test(i.value.trim()) ? 'false' : 'true'));
    const ok = champs.every(i => i.getAttribute('aria-invalid') === 'false');
    f.classList.toggle('invalid', !ok);
    if (!ok) { e.preventDefault(); champs.find(i => i.getAttribute('aria-invalid') === 'true').focus(); }
  });
})();

// Barre d'appel mobile : cachée tant que le cartouche, le bouton de la formule ou l'appel final du pied de page est à l'écran
// (un seul bouton jaune à la fois, et rien ne couvre « Continuer »)
(function(){
  const cibles = [...document.querySelectorAll('.cartouche, .recap-go, .foot .close')];
  if (!cibles.length || !('IntersectionObserver' in window)) return;
  const vues = new Set();
  const io = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? vues.add(e.target) : vues.delete(e.target));
    document.body.classList.toggle('form-on', vues.size > 0);
  });
  cibles.forEach(c => io.observe(c));
})();

// Composez votre formule (accueil) : chaque situation ajoute ou retire son service du récapitulatif ;
// « Préparer mon devis » reporte le choix dans le cartouche (prestation et champ caché « formule »).
// Sans JavaScript, les trois services restent affichés.
(function(){
  const boutons = [...document.querySelectorAll('.situations button')];
  if (!boutons.length) return;
  const blocs = [...document.querySelectorAll('.recap .bloc')];
  const compte = document.querySelector('.recap .compte'), vide = document.querySelector('.recap .vide');
  const go = document.querySelector('[data-preparer]');
  const nom = {m:'demenagement', c:'nettoyage', s:'garde-meubles'}, rang = {m:0, c:2, s:3};   // options du choix « Prestation »
  const choisis = () => boutons.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.svc);
  function maj(){
    const c = choisis();
    blocs.forEach(b => { b.hidden = !c.includes(b.dataset.svc); });
    vide.hidden = c.length > 0;
    go.closest('.recap-go').hidden = !c.length;
    compte.textContent = c.length > 1 ? compte.dataset.plusieurs.replace('{n}', c.length) : compte.dataset.un;
    compte.hidden = !c.length;
  }
  boutons.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); maj(); }));
  go.addEventListener('click', () => {
    const c = choisis(), f = document.querySelector('.cartouche form');
    if (!f || !c.length) return;
    f.elements.prestation.selectedIndex = rang[c[0]];
    f.elements.formule.value = c.map(k => nom[k]).join(',');
    setTimeout(() => f.querySelector('input[name="npa_depart"]').focus({preventScroll:true}), 600);
  });
  maj();
})();

// Plan du logement : redessiné selon le logement choisi dans le cartouche, pièces colorées par service.
// Les noms de pièces viennent de l'attribut data-plan (JSON), traduit par langue ; data-layout et data-iso
// fixent le plan et le service mis en avant au chargement (pages de service).
(function(){
  const svg = document.querySelector('svg.plan');
  if (!svg) return;
  const T = JSON.parse(svg.dataset.plan);
  const titre = svg.querySelector('title');
  const NS = 'http://www.w3.org/2000/svg';
  // Couleurs : les jetons de site.css, pour que le plan suive la palette
  const css = getComputedStyle(document.documentElement), jeton = n => css.getPropertyValue(n).trim();
  const INK = jeton('--ink'), BLANC = jeton('--white');
  const el = (tag, a, txt) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); if (txt) n.textContent = txt; return n; };
  // Pièces : [x, y, l, h, clé du nom, service] dans un cadre de 800 × 500 (m = déménagement, c = nettoyage, s = garde-meubles)
  const L = {
    studio: [[0,0,500,320,'piece','m'],[500,0,300,320,'hall','m'],[0,320,300,180,'cuisine','c'],[300,320,200,180,'bains','c'],[500,320,300,180,'cave','s']],
    p25: [[0,0,430,320,'sejour','m'],[430,0,370,320,'chambre','m'],[0,320,300,180,'cuisine','c'],[300,320,200,180,'bains','c'],[500,320,300,180,'cave','s']],
    p35: [[0,0,380,320,'sejour','m'],[380,0,210,210,'chambre','m'],[590,0,210,210,'chambre','m'],[380,210,420,110,'hall','m'],[0,320,280,180,'cuisine','c'],[280,320,190,180,'bains','c'],[470,320,330,180,'cave','s']],
    p45: [[0,0,340,300,'sejour','m'],[340,0,230,200,'chambre','m'],[570,0,230,200,'chambre','m'],[340,200,460,100,'hall','m'],[0,300,230,200,'chambre','m'],[230,300,210,200,'cuisine','c'],[440,300,150,200,'bains','c'],[590,300,210,200,'cave','s']],
    p55: [[0,0,320,290,'sejour','m'],[320,0,160,190,'chambre','m'],[480,0,160,190,'chambre','m'],[640,0,160,190,'chambre','m'],[320,190,480,100,'hall','m'],[0,290,220,210,'chambre','m'],[220,290,200,210,'cuisine','c'],[420,290,150,210,'bains','c'],[570,290,230,210,'galetas','s']],
    bureaux: [[0,0,520,320,'open','m'],[520,0,280,180,'reunion','m'],[520,180,280,140,'bureau','m'],[0,320,260,180,'archives','s'],[260,320,220,180,'cuisine','c'],[480,320,320,180,'sanitaires','c']],
  };
  const choix = ['studio','p25','p35','p45','p55','p55','bureaux'];
  const X = 70, Y = 60, LARG = 12, PROF = 7.5;   // cotes d'exemple : 12,00 × 7,50 m
  const m = v => v.toFixed(2).replace('.', ',');
  function dessiner(cle, anime){
    svg.replaceChildren();
    if (titre) svg.append(titre);
    const pieces = L[cle];
    const defs = el('defs');
    const pat = el('pattern', {id:'hach', width:7, height:7, patternUnits:'userSpaceOnUse', patternTransform:'rotate(45)'});
    pat.append(el('rect', {width:7, height:7, fill:BLANC}), el('line', {x1:0, y1:0, x2:0, y2:7, stroke:jeton('--clean'), 'stroke-width':2}));
    defs.append(pat); svg.append(defs);
    const fond = {m:jeton('--move-tint'), c:'url(#hach)', s:jeton('--store-tint')};
    const groupes = [];
    pieces.forEach(([x,y,w,h,nom,s], i) => {
      const g = el('g', {class:'room', 'data-svc':s, style:`--i:${i}`});
      g.append(el('rect', {x:X+x, y:Y+y, width:w, height:h, fill:fond[s]}));
      svg.append(g); groupes.push(g);
    });
    // Cloisons fines, murs de façade épais
    for (const [x,y,w,h] of pieces) svg.append(el('rect', {x:X+x, y:Y+y, width:w, height:h, fill:'none', stroke:INK, 'stroke-width':2.5}));
    svg.append(el('rect', {x:X, y:Y, width:800, height:500, fill:'none', stroke:INK, 'stroke-width':11}));
    // Fenêtres sur la façade (trois traits)
    for (const [x,y,w,h] of pieces) {
      if (y === 0) { const l = Math.min(w * .45, 130), x0 = X + x + (w - l) / 2;
        svg.append(el('rect', {x:x0, y:Y-5.5, width:l, height:11, fill:BLANC, stroke:INK, 'stroke-width':1}), el('line', {x1:x0, y1:Y, x2:x0+l, y2:Y, stroke:INK, 'stroke-width':1})); }
      if (x === 0 && h >= 180) { const l = Math.min(h * .4, 110), y0 = Y + y + (h - l) / 2;
        svg.append(el('rect', {x:X-5.5, y:y0, width:11, height:l, fill:BLANC, stroke:INK, 'stroke-width':1}), el('line', {x1:X, y1:y0, x2:X, y2:y0+l, stroke:INK, 'stroke-width':1})); }
    }
    // Portes : une ouverture et un battant par pièce
    for (const [x,y,w,h,,s] of pieces) {
      const bg = s === 'c' ? BLANC : fond[s], R = 42;
      if (x > 0) { const xb = X + x, yb = Y + y + h - 14;
        svg.append(el('line', {x1:xb, y1:yb-R, x2:xb, y2:yb, stroke:bg, 'stroke-width':5}), el('line', {x1:xb, y1:yb, x2:xb+R, y2:yb, stroke:INK, 'stroke-width':1.5}), el('path', {d:`M${xb} ${yb-R} A${R} ${R} 0 0 1 ${xb+R} ${yb}`, fill:'none', stroke:INK, 'stroke-width':1}));
      } else if (y > 0) { const xb = X + x + 14, yb = Y + y;
        svg.append(el('line', {x1:xb, y1:yb, x2:xb+R, y2:yb, stroke:bg, 'stroke-width':5}), el('line', {x1:xb, y1:yb, x2:xb, y2:yb+R, stroke:INK, 'stroke-width':1.5}), el('path', {d:`M${xb+R} ${yb} A${R} ${R} 0 0 1 ${xb} ${yb+R}`, fill:'none', stroke:INK, 'stroke-width':1}));
      }
    }
    // Noms des pièces et renvois numérotés (repris dans la légende)
    pieces.forEach(([x,y,w,h,nom,s], i) => {
      // Une porte dans le mur du haut (pièce contre la façade gauche) : le nom passe après son battant
      const lb = el('text', {x:X+x+(x === 0 && y > 0 ? 70 : 16), y:Y+y+32, class:'lbl'}, T.pieces[nom]);
      if (s === 'c') lb.setAttribute('style', `paint-order:stroke;stroke:${BLANC};stroke-width:6px`);
      groupes[i].append(lb);
    });
    ['m','c','s'].forEach((s, i) => {
      const k = pieces.findIndex(q => q[5] === s);
      if (k < 0) return;
      const [x,y,w,h] = pieces[k], cx = X + x + w / 2, cy = Y + y + h / 2 + 8;
      groupes[k].append(el('circle', {cx, cy, r:17, class:'key', fill:BLANC, stroke:INK, 'stroke-width':1.5}), el('text', {x:cx, y:cy, dy:'.35em', 'text-anchor':'middle', class:'key-t'}, String(i + 1)));
    });
    // Cotes d'exemple, en mètres
    const cote = (horiz, bornes, total, max) => {
      const g = el('g', {class:'dims'});
      const p = horiz ? Y - 34 : X - 34;
      const pt = (v, d) => horiz ? [X + v, p + d] : [p + d, Y + v];
      const [a1,b1] = pt(0,0), [a2,b2] = pt(max,0);
      g.append(el('line', {x1:a1, y1:b1, x2:a2, y2:b2, stroke:INK, 'stroke-width':1}));
      bornes.forEach(v => { const [cx,cy] = pt(v,0); g.append(el('line', {x1:cx-5, y1:cy+5, x2:cx+5, y2:cy-5, stroke:INK, 'stroke-width':1.5})); });
      for (let j = 0; j < bornes.length - 1; j++) {
        const mid = (bornes[j] + bornes[j+1]) / 2, [tx,ty] = pt(mid, -8), val = m((bornes[j+1] - bornes[j]) / max * total);
        const t = el('text', {x:tx, y:ty, 'text-anchor':'middle', class:'dim'}, val);
        if (!horiz) t.setAttribute('transform', `rotate(-90 ${tx} ${ty})`);
        g.append(t);
      }
      svg.append(g);
    };
    const haut = [...new Set(pieces.filter(q => q[1] === 0).flatMap(q => [q[0], q[0] + q[2]]))].sort((a,b) => a-b);
    const gauche = [...new Set(pieces.filter(q => q[0] === 0).flatMap(q => [q[1], q[1] + q[3]]))].sort((a,b) => a-b);
    cote(true, haut, LARG, 800);
    cote(false, gauche, PROF, 500);
    svg.classList.toggle('draw', !!anime);
    isoler(actif);
  }
  // Légende : isole les pièces d'un service
  let actif = svg.dataset.iso || null;
  const boutons = [...document.querySelectorAll('.legend button')];
  function isoler(s){
    actif = s;
    svg.classList.toggle('isolate', !!s);
    svg.querySelectorAll('.room').forEach(r => r.classList.toggle('on', r.dataset.svc === s));
    boutons.forEach(b => b.setAttribute('aria-pressed', b.dataset.svc === s ? 'true' : 'false'));
  }
  boutons.forEach(b => {
    b.addEventListener('click', () => isoler(actif === b.dataset.svc ? null : b.dataset.svc));
    b.addEventListener('mouseenter', () => { if (!actif) { svg.classList.add('isolate'); svg.querySelectorAll('.room').forEach(r => r.classList.toggle('on', r.dataset.svc === b.dataset.svc)); } });
    b.addEventListener('mouseleave', () => isoler(actif));
  });
  const sel = document.querySelector('.cartouche select[name="pieces"]');
  const lire = () => choix[sel ? sel.selectedIndex : 2] || 'p35';
  if (sel) sel.addEventListener('change', () => dessiner(lire(), true));
  dessiner(svg.dataset.layout || lire(), false);
})();

// Mouvement (v7) : barre d'avancement, en-tête compact, titres mot par mot, blocs en cascade,
// chiffres qui défilent, étapes qui s'allument, cartes inclinées à la souris.
// Avec « réduire les animations », seuls la barre (sans transition) et l'en-tête compact restent.
(function(){
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = document.querySelector('.top');
  const barre = document.createElement('div');
  barre.className = 'avance'; barre.setAttribute('aria-hidden', 'true');
  document.body.append(barre);
  const cote = !reduit && document.querySelector('.cote');
  const etapes = cote ? [...cote.children] : [];

  let attente = false;
  function defiler(){
    attente = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    barre.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
    if (top) top.classList.toggle('compact', scrollY > 40);
    if (cote) {
      // 0 quand le haut des étapes passe à 80 % de l'écran, 1 quand il atteint 30 %
      const r = cote.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (innerHeight * .5)));
      cote.style.setProperty('--p', p.toFixed(3));
      etapes.forEach((li, i) => li.classList.toggle('atteint', p >= i / etapes.length + .01 || (i === 0 && p > 0)));
    }
  }
  addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(defiler); } }, {passive:true});
  addEventListener('resize', defiler);
  defiler();

  if (reduit || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('anim');

  // Titres : chaque mot dans un masque (seulement les titres sans balise intérieure)
  document.querySelectorAll('main h1, main section h2').forEach(t => {
    if (t.children.length) { t.classList.add('rv'); return; }
    const mots = t.textContent.trim().split(/\s+/);
    t.textContent = '';
    mots.forEach((m, k) => {
      const w = document.createElement('span'), s = document.createElement('span');
      w.className = 'w'; s.textContent = m; s.style.setProperty('--k', k);
      w.append(s); t.append(w, ' ');
    });
    t.classList.add('mots');
  });

  // Blocs révélés, avec un décalage dans chaque groupe
  const groupes = ['.head .intro', '.copy .lead', '.proof > span', '.situations > *', '.recap', '.nomenclature > li', '.trade', '.cote > li',
    '.atouts > li', '.quotes > *', '.agency', '.faq details, main details', '.others a', '.towns-list li', '.fiche', '.plan-wrap'];
  const vus = new Set();
  groupes.forEach(sel => document.querySelectorAll(sel).forEach(el => {
    if (vus.has(el) || el.closest('.stage')) return;
    vus.add(el);
    const freres = [...el.parentElement.children].filter(f => f.matches(sel));
    el.style.setProperty('--d', Math.min(5, freres.indexOf(el)));
    el.classList.add('rv');
  }));

  // Icônes : longueur de trait normalisée pour le dessin
  document.querySelectorAll('.atouts .ico svg *').forEach(f => { if (f.getTotalLength) f.setAttribute('pathLength', 1); });

  // Chiffres de la barre de preuves : « 3 000+ », « 15 ans », « 5,0 »
  const compter = b => {
    const m = b.textContent.match(/^(\d{1,3}(?:[\s\u202f\u00a0']\d{3})*)(?:,(\d))?(.*)$/);
    if (!m) return;
    const fin = parseFloat(m[1].replace(/\D/g, '') + (m[2] ? '.' + m[2] : '')), dec = m[2] ? 1 : 0, suite = m[3];
    const fmt = v => v.toLocaleString('fr-CH', {minimumFractionDigits:dec, maximumFractionDigits:dec}).replace(/[\s\u202f\u00a0\u2019']/g, '\u202f') + suite;
    const t0 = performance.now(), duree = 1400;
    const pas = now => { const t = Math.min(1, (now - t0) / duree), e = 1 - Math.pow(1 - t, 4); b.textContent = fmt(fin * e); if (t < 1) requestAnimationFrame(pas); };
    b.setAttribute('aria-label', b.textContent);
    requestAnimationFrame(pas);
  };

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('vu');
    if (e.target.matches('.proof > span')) e.target.querySelectorAll('b').forEach(b => { if (/^\d/.test(b.textContent)) compter(b); });
    io.unobserve(e.target);
  }), {rootMargin:'0px 0px -8% 0px', threshold:.12});
  document.querySelectorAll('.rv, .mots, main section h2').forEach(el => io.observe(el));

  // Cartes inclinées : suivent la souris, au plus 5 degrés
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.nomenclature > li, .atouts > li, .cote > li').forEach(c => {
      c.classList.add('incline');
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }
})();
