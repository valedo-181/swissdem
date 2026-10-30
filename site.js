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

// Volume (v7) : le logement choisi dans le cartouche ou l'inventaire de l'estimateur donne un volume en m³,
// affiché sur le plateau et transmis au camion 3D (événement « swissdem:volume ») qui se charge en conséquence.
// Repères : 9 m³ par pièce ; un camion 3,5 t prend environ 20 m³. Aucun prix n'est affiché : il vient du devis.
(function(){
  const de = document.documentElement.lang.startsWith('de');
  const T = de ? {
    m3: v => `≈ ${v} m³`, camion: 'Ein 3,5-t-Lastwagen', lourd: 'Lastwagen oder zwei Fahrten', visite: 'Volumen bei der Besichtigung',
    plateau: 'nach Ihrer Wohnung', inventaire: 'nach Ihrem Inventar', types: 'Von einer typischen Wohnung ausgehen:', vider: 'Leeren',
    total: 'Ihr geschätztes Volumen', joindre: 'Zur Offertanfrage hinzufügen', joint: 'Hinzugefügt ✓',
    note: 'Unverbindliche Schätzung. Der Verantwortliche bestätigt das Volumen bei der Besichtigung; der Preis steht in der Offerte.',
    vide: 'Zählen Sie Ihre Möbel oder wählen Sie oben eine typische Wohnung.', moins: 'Weniger', plus: 'Mehr',
    pieces: {sejour:'Wohnzimmer', chambres:'Schlafzimmer', cuisine:'Küche, Waschküche', cave:'Keller, Balkon', cartons:'Kartons'},
    typesNoms: {studio:'Studio', p25:'2,5 Zimmer', p35:'3,5 Zimmer', p45:'4,5 Zimmer', p55:'5,5 Zimmer'},
  } : {
    m3: v => `≈ ${v} m³`, camion: 'Un camion 3,5 t', lourd: 'Poids lourd ou deux voyages', visite: 'Volume confirmé à la visite',
    plateau: 'selon votre logement', inventaire: 'selon votre inventaire', types: "Partir d'un logement type :", vider: 'Vider',
    total: 'Votre volume estimé', joindre: 'Joindre à ma demande de devis', joint: 'Joint à votre demande ✓',
    note: "Estimation indicative et sans engagement. Le responsable de l'agence confirme le volume à la visite ; le prix figure sur le devis.",
    vide: 'Comptez vos meubles, ou choisissez un logement type ci-dessus.', moins: 'Retirer', plus: 'Ajouter',
    pieces: {sejour:'Séjour', chambres:'Chambres', cuisine:'Cuisine, buanderie', cave:'Cave, balcon', cartons:'Cartons'},
    typesNoms: {studio:'Studio', p25:'2,5 pièces', p35:'3,5 pièces', p45:'4,5 pièces', p55:'5,5 pièces'},
  };
  // [clé, pièce, m³, français, allemand, pas]
  const OBJETS = [
    ['canape3','sejour',1.5,'Canapé 3 places','Sofa 3-plätzig'], ['canape2','sejour',1,'Canapé 2 places','Sofa 2-plätzig'],
    ['fauteuil','sejour',.6,'Fauteuil','Sessel'], ['tablebasse','sejour',.3,'Table basse','Salontisch'],
    ['meubletv','sejour',.6,'Meuble TV','TV-Möbel'], ['tv','sejour',.2,'Télévision','Fernseher'],
    ['biblio','sejour',1,'Bibliothèque','Bücherregal'], ['buffet','sejour',1.2,'Buffet, vaisselier','Buffet, Sideboard'],
    ['tablemanger','sejour',.8,'Table à manger','Esstisch'], ['chaise','sejour',.2,'Chaise','Stuhl'],
    ['litdouble','chambres',1.8,'Lit double','Doppelbett'], ['litsimple','chambres',1,'Lit simple','Einzelbett'],
    ['litenfant','chambres',.7,"Lit d'enfant",'Kinderbett'], ['armoire2','chambres',1.5,'Armoire 2 portes','Schrank 2-türig'],
    ['armoire3','chambres',2.2,'Armoire 3 portes','Schrank 3-türig'], ['commode','chambres',.8,'Commode','Kommode'],
    ['chevet','chambres',.2,'Table de nuit','Nachttisch'], ['bureau','chambres',.8,'Bureau','Schreibtisch'],
    ['chaisebureau','chambres',.3,'Chaise de bureau','Bürostuhl'],
    ['tablecuisine','cuisine',.5,'Table de cuisine','Küchentisch'], ['chaisecuisine','cuisine',.15,'Chaise de cuisine','Küchenstuhl'],
    ['frigo','cuisine',.8,'Réfrigérateur','Kühlschrank'], ['lavelinge','cuisine',.6,'Lave-linge','Waschmaschine'],
    ['seche','cuisine',.6,'Sèche-linge','Tumbler'], ['microondes','cuisine',.1,'Micro-ondes','Mikrowelle'],
    ['velo','cave',.8,'Vélo','Velo'], ['etagere','cave',.6,'Étagère','Regal'],
    ['jardin','cave',1,'Meubles de jardin ou de balcon','Garten- oder Balkonmöbel'], ['sport','cave',.3,'Skis, équipement de sport','Ski, Sportausrüstung'],
    ['poussette','cave',.4,'Poussette','Kinderwagen'], ['valise','cave',.15,'Valise','Koffer'],
    ['carton','cartons',.08,'Carton standard','Umzugskarton',5], ['penderie','cartons',.3,'Carton penderie','Kleiderbox'],
  ];
  // Inventaires types, calés sur la règle des 9 m³ par pièce
  const TYPES = {
    studio:{canape2:1,tablebasse:1,meubletv:1,tv:1,litdouble:1,armoire2:1,chevet:1,tablecuisine:1,chaisecuisine:2,microondes:1,etagere:1,valise:2,carton:20},
    p25:{canape3:1,fauteuil:1,tablebasse:1,meubletv:1,tv:1,biblio:1,buffet:1,tablemanger:1,chaise:4,litdouble:1,armoire3:1,chevet:2,commode:1,bureau:1,chaisebureau:1,tablecuisine:1,chaisecuisine:2,microondes:1,lavelinge:1,velo:1,etagere:1,jardin:1,sport:1,valise:2,carton:50,penderie:1},
    p35:{canape3:1,fauteuil:2,tablebasse:1,meubletv:1,tv:1,biblio:1,buffet:1,tablemanger:1,chaise:4,litdouble:1,armoire3:1,chevet:3,commode:2,bureau:1,chaisebureau:1,tablecuisine:1,chaisecuisine:2,microondes:1,lavelinge:1,velo:2,etagere:2,jardin:1,sport:2,valise:3,carton:70,penderie:2,litsimple:1,armoire2:1},
    p45:{canape3:1,fauteuil:2,tablebasse:1,meubletv:1,tv:1,biblio:2,buffet:1,tablemanger:1,chaise:6,litdouble:1,armoire3:1,chevet:4,commode:3,bureau:1,chaisebureau:1,tablecuisine:1,chaisecuisine:2,microondes:1,lavelinge:1,velo:3,etagere:3,jardin:1,sport:2,valise:3,carton:90,penderie:3,litsimple:1,armoire2:2,litenfant:1,poussette:1,seche:1},
    p55:{canape3:1,fauteuil:2,tablebasse:1,meubletv:1,tv:1,biblio:2,buffet:1,tablemanger:1,chaise:6,litdouble:1,armoire3:1,chevet:5,commode:4,bureau:2,chaisebureau:2,tablecuisine:1,chaisecuisine:2,microondes:1,lavelinge:1,velo:4,etagere:4,jardin:2,sport:3,valise:3,carton:110,penderie:4,litsimple:2,armoire2:3,litenfant:1,poussette:1,seche:1,canape2:1},
  };
  const CAMION = 20, PAR_LOGEMENT = [9, 23, 32, 41, 50, null, null];   // ordre des options « Logement » du cartouche
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString(de ? 'de-CH' : 'fr-CH', {maximumFractionDigits:1});
  const annoncer = m3 => { window.swissdemVolume = m3; document.dispatchEvent(new CustomEvent('swissdem:volume', {detail:{m3}})); };
  const form = document.querySelector('.cartouche form');

  // Plateau : une étiquette sous l'indication de rotation, mise à jour avec le logement ou l'inventaire
  const stage = document.querySelector('[data-camion]');
  let badge = null;
  if (stage) {
    badge = document.createElement('p');
    badge.className = 'volume-badge'; badge.setAttribute('aria-live', 'polite');
    stage.append(badge);
  }
  function afficher(m3, source){
    if (!badge) return;
    badge.innerHTML = m3 == null ? `<b>${T.visite}</b>`
      : `<b>${T.m3(fmt(m3))}</b><span>${source} · ${m3 <= CAMION ? T.camion : T.lourd}</span>`;
    badge.classList.add('on');
  }
  const sel = form && form.elements.pieces;
  if (sel) {
    const logement = () => {
      const v = PAR_LOGEMENT[sel.selectedIndex];
      afficher(v, T.plateau);
      annoncer(v ?? 60);
      if (form.elements.volume) form.elements.volume.value = '';
    };
    sel.addEventListener('change', logement);
    const v = PAR_LOGEMENT[sel.selectedIndex];
    window.swissdemVolume = v ?? 60;
    afficher(v, T.plateau);
  }

  // Estimateur pièce par pièce (accueil)
  const zone = document.querySelector('[data-estim]');
  if (!zone) return;
  zone.closest('section').hidden = false;
  const CLE = 'swissdem-inventaire';
  let n = {};
  try { n = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) {}
  let onglet = 'sejour';
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  const types = el('div', 'estim-types');
  types.append(el('span', null, T.types));
  Object.keys(TYPES).forEach(k => {
    const b = el('button', 'chip', T.typesNoms[k]); b.type = 'button';
    b.addEventListener('click', () => { n = {...TYPES[k]}; maj(true); });
    types.append(b);
  });
  const vider = el('button', 'chip ghost', T.vider); vider.type = 'button';
  vider.addEventListener('click', () => { n = {}; maj(true); });
  types.append(vider);

  const tabs = el('div', 'estim-tabs'); tabs.setAttribute('role', 'tablist');
  const liste = el('ul', 'estim-liste'); liste.id = 'estim-liste'; liste.setAttribute('role', 'tabpanel');
  Object.entries(T.pieces).forEach(([k, nom]) => {
    const b = el('button', null); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.piece = k;
    b.setAttribute('aria-controls', 'estim-liste');
    b.append(el('span', null, nom), el('em'));
    b.addEventListener('click', () => { onglet = k; dessiner(true); });
    tabs.append(b);
  });

  const aside = el('aside', 'estim-total');
  aside.innerHTML = `<p class="t">${T.total}</p><p class="m3" aria-live="polite"><b>0</b> m³</p><div class="flotte" aria-hidden="true"></div><p class="camion"></p>`;
  const go = el('button', 'btn move', T.joindre); go.type = 'button';
  aside.append(go, el('p', 'note', T.note));
  const gauche = el('div', 'estim-pieces');
  // Sur téléphone, le total reste visible en haut de la liste pendant qu'on compte
  const mini = el('p', 'estim-mini'); mini.setAttribute('aria-hidden', 'true');
  gauche.append(mini, types, tabs, liste);
  zone.append(gauche, aside);

  const total = () => OBJETS.reduce((s, o) => s + (n[o[0]] || 0) * o[2], 0);
  const camionSvg = p => `<svg viewBox="0 0 120 58"><rect x="3" y="5" width="78" height="38" rx="5" class="cx"/><rect x="6" y="8" width="${(72 * p).toFixed(1)}" height="32" rx="3" class="ch"/><path d="M84 17h17l12 13v13H84z" class="cb"/><circle cx="24" cy="47" r="7" class="rw"/><circle cx="98" cy="47" r="7" class="rw"/></svg>`;
  function dessiner(entree){
    liste.classList.toggle('entree', !!entree);
    tabs.querySelectorAll('button').forEach(b => {
      const k = b.dataset.piece, c = OBJETS.filter(o => o[1] === k).reduce((s, o) => s + (n[o[0]] || 0), 0);
      b.setAttribute('aria-selected', k === onglet);
      b.querySelector('em').textContent = c || '';
    });
    liste.replaceChildren(...OBJETS.filter(o => o[1] === onglet).map(([k, , m3, fr, al, pas = 1]) => {
      const li = el('li'), c = n[k] || 0, nom = de ? al : fr;
      li.classList.toggle('on', c > 0);
      const lab = el('span', 'nom', nom); lab.append(el('small', null, `${fmt(m3 * pas)} m³${pas > 1 ? ` / ${pas}` : ''}`));
      const moins = el('button', 'pas', '−'), val = el('output', null, c), plus = el('button', 'pas', '+');
      moins.type = plus.type = 'button';
      moins.setAttribute('aria-label', `${T.moins} : ${nom}`); plus.setAttribute('aria-label', `${T.plus} : ${nom}`);
      moins.disabled = !c;
      moins.addEventListener('click', () => { n[k] = Math.max(0, c - pas); maj(); });
      plus.addEventListener('click', () => { n[k] = c + pas; maj(); });
      li.append(lab, el('span', 'cpt'));
      li.lastChild.append(moins, val, plus);
      return li;
    }));
  }
  let dernier = -1;
  function maj(type){
    try { localStorage.setItem(CLE, JSON.stringify(n)); } catch (e) {}
    const focus = document.activeElement && document.activeElement.getAttribute('aria-label');
    dessiner();
    if (focus) { const b = liste.querySelector(`[aria-label="${CSS.escape(focus)}"]`); if (b && !b.disabled) b.focus(); }
    const v = total();
    aside.querySelector('.m3 b').textContent = fmt(v);
    mini.innerHTML = `<b>${T.m3(fmt(v))}</b><span>${v ? (v <= CAMION ? T.camion : T.lourd) : ''}</span>`;
    const camions = Math.max(1, Math.ceil(v / CAMION - 1e-9)), flotte = aside.querySelector('.flotte');
    if (flotte.children.length !== Math.min(3, camions) || dernier < 0) flotte.innerHTML = Array.from({length:Math.min(3, camions)}, () => camionSvg(0)).join('');
    [...flotte.querySelectorAll('.ch')].forEach((r, i) => r.setAttribute('width', (72 * Math.min(1, Math.max(0, (v - i * CAMION) / CAMION))).toFixed(1)));
    aside.querySelector('.camion').textContent = v ? (v <= CAMION ? T.camion : T.lourd) : T.vide;
    go.disabled = !v; go.textContent = T.joindre;
    if (type) aside.classList.remove('pulse'), void aside.offsetWidth, aside.classList.add('pulse');
    dernier = v;
  }
  go.addEventListener('click', () => {
    const v = total();
    if (!v || !form) return;
    if (form.elements.volume) form.elements.volume.value = fmt(v);
    if (form.elements.inventaire) form.elements.inventaire.value = OBJETS.filter(o => n[o[0]]).map(o => `${de ? o[4] : o[3]} × ${n[o[0]]}`).join('; ');
    afficher(v, T.inventaire);
    annoncer(v);
    go.textContent = T.joint;
    // On remonte au plateau : le camion se charge sous les yeux du visiteur, le cartouche juste dessous
    (stage || document.getElementById('devis')).scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    setTimeout(() => form.querySelector('input[name="npa_depart"]').focus({preventScroll:true}), 700);
  });
  maj();
})();

// Carte des deux cantons (v7) : les communes desservies, placées par leurs coordonnées réelles.
// Les agences, responsables, téléphones et communes sont lus dans les fiches .agency de la page (donc déjà traduits) ;
// les lacs sont tracés à main levée : la carte est schématique. Toucher une commune affiche son agence et le trajet.
(function(){
  const zone = document.querySelector('[data-carte]');
  const fiches = [...document.querySelectorAll('#agences .agency')];
  if (!zone || fiches.length < 2) return;
  const de = document.documentElement.lang.startsWith('de');
  const T = de ? {
    titre: 'Wählen Sie Ihre Gemeinde', aide: 'Tippen Sie auf einen Punkt der Karte: Sie sehen die zuständige Filiale und ihren Verantwortlichen.',
    agence: v => `Filiale ${v}`, siege: 'Filiale', km: k => `${k} km Luftlinie von der Filiale`, ici: 'Hier befindet sich die Filiale',
    voir: c => `Umzug in ${c}`, legende: 'Schematische Karte, Gemeinden nach ihren tatsächlichen Koordinaten platziert.',
    lacs: ['Neuenburgersee', 'Murtensee', 'Greyerzersee'],
  } : {
    titre: 'Choisissez votre commune', aide: "Touchez un point de la carte : vous voyez l'agence qui s'en occupe et son responsable.",
    agence: v => `Agence de ${v}`, siege: 'Agence', km: k => `à ${k} km à vol d'oiseau de l'agence`, ici: "C'est ici que se trouve l'agence",
    voir: c => `Déménager à ${c}`, legende: 'Carte schématique, communes placées selon leurs coordonnées réelles.',
    lacs: ['Lac de Neuchâtel', 'Lac de Morat', 'Lac de la Gruyère'],
  };
  // Coordonnées (longitude, latitude), par nom de page de commune
  const GEO = {
    'neuchatel':[6.931,46.992], 'la-chaux-de-fonds':[6.826,47.100], 'le-locle':[6.749,47.057], 'peseux':[6.889,46.987],
    'corcelles':[6.873,46.984], 'boudry':[6.838,46.950], 'marin-epagnier':[7.003,47.012], 'cortaillod':[6.845,46.941],
    'val-de-ruz':[6.902,47.058], 'val-de-travers':[6.583,46.903], 'hauterive':[6.972,47.010], 'saint-blaise':[6.988,47.015],
    'fribourg':[7.161,46.806], 'bulle':[7.057,46.619], 'morat':[7.117,46.928], 'murten':[7.117,46.928],
    'estavayer-le-lac':[6.846,46.849], 'villars-sur-glane':[7.118,46.791], 'dudingen':[7.190,46.849], 'duedingen':[7.190,46.849],
    'marly':[7.161,46.777], 'romont':[6.919,46.697], 'chatel-saint-denis':[6.901,46.527], 'givisiez':[7.126,46.812],
    'belfaux':[7.106,46.822], 'kerzers':[7.195,46.976],
  };
  const LACS = [
    [[6.64,46.79],[6.72,46.835],[6.80,46.885],[6.85,46.93],[6.90,46.968],[6.95,46.99],[7.03,47.008],[7.035,46.998],[6.98,46.965],[6.93,46.928],[6.87,46.875],[6.80,46.83],[6.73,46.792],[6.66,46.772]],
    [[7.035,46.898],[7.06,46.922],[7.10,46.945],[7.125,46.952],[7.118,46.936],[7.075,46.912],[7.045,46.894]],
    [[7.065,46.628],[7.085,46.66],[7.105,46.698],[7.118,46.728],[7.104,46.724],[7.083,46.685],[7.06,46.642]],
  ];
  const W = 640, H = 760, LON = [6.52, 7.28], LAT = [46.47, 47.15];
  const k = Math.cos(46.8 * Math.PI / 180);
  const ech = Math.min(W / ((LON[1] - LON[0]) * k), H / (LAT[1] - LAT[0]));
  const ox = (W - (LON[1] - LON[0]) * k * ech) / 2, oy = (H - (LAT[1] - LAT[0]) * ech) / 2;
  const xy = ([lon, lat]) => [ox + (lon - LON[0]) * k * ech, oy + (LAT[1] - lat) * ech];
  const kmEntre = (a, b) => Math.round(Math.hypot((a[0] - b[0]) * k * 111.32, (a[1] - b[1]) * 110.57));
  const slug = a => a.getAttribute('href').split('/').pop().replace('.html', '');

  // Agences et communes, depuis les fiches
  const agences = fiches.map((f, i) => {
    const nom = f.querySelector('h3').textContent.trim();
    const liens = [...f.querySelectorAll('.towns a')].filter(a => GEO[slug(a)]);
    return { i, nom, tel: f.querySelector('.tel'), mail: f.querySelector('.mail'), resp: f.querySelector('.resp')?.textContent.trim(),
             communes: liens.map(a => ({ nom: a.textContent.trim(), href: a.getAttribute('href'), geo: GEO[slug(a)], lien: a })) };
  });
  agences.forEach(a => { a.siege = a.communes[0]; });   // la première commune de chaque fiche est la ville de l'agence

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at = {}, txt) => { const n = document.createElementNS(NS, tag); for (const c in at) n.setAttribute(c, at[c]); if (txt != null) n.textContent = txt; return n; };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'carte-svg', role: 'group', 'aria-label': T.titre });
  // Zones desservies : l'enveloppe des communes de chaque agence, arrondie par un trait épais
  const enveloppe = pts => {
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const bas = [], haut = [];
    for (const q of p) { while (bas.length > 1 && x(bas[bas.length - 2], bas[bas.length - 1], q) <= 0) bas.pop(); bas.push(q); }
    for (const q of p.reverse()) { while (haut.length > 1 && x(haut[haut.length - 2], haut[haut.length - 1], q) <= 0) haut.pop(); haut.push(q); }
    return bas.slice(0, -1).concat(haut.slice(0, -1));
  };
  agences.forEach(a => {
    const pts = enveloppe(a.communes.map(c => xy(c.geo)));
    a.zone = el('path', { d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z', class: 'zone' });
    svg.append(a.zone);
  });
  LACS.forEach((l, i) => {
    const pts = l.map(xy);
    svg.append(el('path', { d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z', class: 'lac' }));
    if (i < 2) { const [cx, cy] = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
      const t = el('text', { x: cx, y: cy, class: 'lac-t' + (i ? ' l2' : ''), 'text-anchor': 'middle', transform: `rotate(${i ? -32 : -38} ${cx} ${cy})` }, T.lacs[i]);
      svg.append(t); }
  });
  const trajet = el('path', { class: 'trajet', pathLength: 1 });
  svg.append(trajet);
  // Une seule étiquette par grappe de communes voisines : les autres apparaissent au survol ou à la sélection
  const toujours = new Set(['neuchatel', 'la-chaux-de-fonds', 'le-locle', 'val-de-travers', 'boudry', 'fribourg', 'bulle', 'morat', 'murten', 'estavayer-le-lac', 'romont', 'chatel-saint-denis', 'kerzers', 'dudingen', 'duedingen', 'val-de-ruz']);
  // Sur téléphone, ces noms-là ne s'affichent qu'au toucher, faute de place
  const petit = matchMedia('(max-width: 560px)').matches;   // sur téléphone, la carte est réduite : points plus gros
  const mineurs = new Set(['le-locle', 'val-de-ruz', 'boudry', 'kerzers', 'dudingen', 'duedingen', 'chatel-saint-denis']);
  const points = [];
  agences.forEach(a => a.communes.forEach((c, j) => {
    const [x, y] = xy(c.geo), siege = j === 0, s = slug(c.lien);
    const g = el('g', { class: 'pt' + (siege ? ' siege' : '') + (toujours.has(s) ? ' nomme' : '') + (mineurs.has(s) ? ' mineur' : ''), tabindex: 0, role: 'button', 'aria-label': c.nom,
                        style: `--d:${kmEntre(c.geo, a.siege.geo)}` });
    if (siege) g.append(el('circle', { cx: x, cy: y, r: petit ? 22 : 15, class: 'halo' }));
    g.append(el('circle', { cx: x, cy: y, r: (siege ? 8 : 6) * (petit ? 1.5 : 1), class: 'dot' }));
    const gauche = x > W * .62;
    const ecart = petit ? 17 : 12;
    g.append(el('text', { x: x + (gauche ? -ecart : ecart), y: y + (petit ? 8 : 4), class: 'nom', 'text-anchor': gauche ? 'end' : 'start' }, c.nom));
    svg.append(g);
    const p = { g, c, a, x, y };
    points.push(p);
    g.addEventListener('click', () => choisir(p));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choisir(p); } });
    g.addEventListener('mouseenter', () => g.classList.add('survol'));
    g.addEventListener('mouseleave', () => g.classList.remove('survol'));
    c.lien.addEventListener('mouseenter', () => g.classList.add('survol'));
    c.lien.addEventListener('mouseleave', () => g.classList.remove('survol'));
  }));
  // Les grappes passent au-dessus des zones et des lacs, les agences au-dessus de tout
  points.filter(p => p.g.classList.contains('siege')).forEach(p => svg.append(p.g));

  const panneau = document.createElement('div');
  panneau.className = 'carte-info';
  panneau.setAttribute('aria-live', 'polite');
  const accueil = () => {
    panneau.innerHTML = `<p class="t">${T.titre}</p><p class="aide">${T.aide}</p>` + agences.map(a =>
      `<div class="ag"><b>${T.agence(a.nom)}</b><span>${a.resp || ''}</span><a href="${a.tel.getAttribute('href')}">${a.tel.textContent}</a></div>`).join('');
  };
  let actif = null;
  function choisir(p){
    if (actif) actif.g.classList.remove('on');
    actif = p; p.g.classList.add('on');
    agences.forEach(a => a.zone.classList.toggle('on', a === p.a));
    const s = xy(p.a.siege.geo), km = kmEntre(p.c.geo, p.a.siege.geo);
    // Trajet : une courbe douce de l'agence à la commune, qui se dessine
    const mx = (s[0] + p.x) / 2 + (p.y - s[1]) * .18, my = (s[1] + p.y) / 2 - (p.x - s[0]) * .18;
    trajet.setAttribute('d', `M${s[0].toFixed(1)} ${s[1].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    trajet.classList.remove('trace'); void trajet.getBBox(); trajet.classList.toggle('trace', km > 0);
    panneau.innerHTML = `<p class="t">${p.c.nom}</p><p class="dist">${km ? T.km(km) : T.ici}</p>
      <div class="ag on"><b>${T.agence(p.a.nom)}</b><span>${p.a.resp || ''}</span>
      <a class="tel" href="${p.a.tel.getAttribute('href')}">${p.a.tel.textContent}</a>
      <a class="mail" href="${p.a.mail.getAttribute('href')}">${p.a.mail.textContent}</a></div>
      <a class="more" href="${p.c.href}">${T.voir(p.c.nom)}</a>`;
    // Sur téléphone, la fiche est sous la carte : on l'amène à l'écran
    if (matchMedia('(max-width: 900px)').matches) panneau.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest'});
  }
  accueil();
  const fig = document.createElement('figure');
  fig.className = 'carte-fig';
  fig.append(svg, Object.assign(document.createElement('figcaption'), { textContent: T.legende }));
  zone.append(fig, panneau);
  zone.hidden = false;
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
    if (t.closest('.legal-txt')) return;   // textes légaux : titres immobiles, lecture d'abord
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
    '.atouts > li', '.quotes > *', '.carte', '.agency', '.faq details, main details', '.others a', '.towns-list li', '.fiche', '.plan-wrap'];
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

  // Chiffres de la barre de preuves : « 5,0 », « 24 h »
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
