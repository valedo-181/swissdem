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
    try { localStorage.setItem(CLE, JSON.stringify(n)); localStorage.setItem('swissdem-volume', String(Math.round(total() * 10) / 10)); } catch (e) {}
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

// Checklist de déménagement (v7) : cases enregistrées sur l'appareil, avancement, dates de chaque étape
// à partir de la date du déménagement, étape en cours mise en avant, impression ou PDF. Sans JavaScript, la liste reste à cocher et à imprimer.
(function(){
  const outils = document.querySelector('.check-outils[data-check]');
  if (!outils) return;
  const T = JSON.parse(outils.dataset.check);
  const de = document.documentElement.lang.startsWith('de');
  const CLE = 'swissdem-checklist';
  const cases = [...document.querySelectorAll('.check input[type=checkbox]')];
  const etapes = [...document.querySelectorAll('.check .etape')];
  const champDate = outils.querySelector('input[name=date]');
  let etat = {};
  try { etat = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) {}
  const garder = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };
  cases.forEach(c => { c.checked = !!(etat.cases || []).includes(c.name); });
  if (etat.date) champDate.value = etat.date;
  const jour = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const fmt = d => d.toLocaleDateString(de ? 'de-CH' : 'fr-CH', {weekday:'long', day:'numeric', month:'long'});

  function maj(){
    const faites = cases.filter(c => c.checked).length;
    outils.querySelector('[data-fait]').textContent = T.fait.replace('{n}', faites).replace('{t}', cases.length);
    outils.querySelector('.barre i').style.transform = `scaleX(${cases.length ? faites / cases.length : 0})`;
    etapes.forEach(e => {
      const cs = [...e.querySelectorAll('input')], n = cs.filter(c => c.checked).length;
      e.querySelector('.compte').textContent = `${n}/${cs.length}`;
      e.classList.toggle('complete', n === cs.length);
      e.querySelectorAll('li').forEach(li => li.classList.toggle('coche', li.querySelector('input').checked));
    });
    // Dates : chaque étape commence N jours avant le jour J (après le déménagement : N jours après)
    const v = champDate.value, aujourd = jour(new Date());
    outils.classList.toggle('a-date', !!v);   // à l'impression, le cadre n'apparaît qu'avec une date
    let courante = null;
    etapes.forEach((e, i) => {
      const q = e.querySelector('.quand');
      e.classList.remove('maintenant', 'passee');
      if (!v) { q.hidden = true; return; }
      const [a, m, j] = v.split('-').map(Number), jj = new Date(a, m - 1, j);
      const debut = new Date(jj); debut.setDate(jj.getDate() - Number(e.dataset.jours));
      const suivante = etapes[i + 1] ? (() => { const d = new Date(jj); d.setDate(jj.getDate() - Number(etapes[i + 1].dataset.jours)); return d; })() : null;
      q.hidden = false;
      q.textContent = T.des.replace('{d}', fmt(debut));
      if (debut <= aujourd && (!suivante || aujourd < suivante)) courante = e;
      else if (suivante && suivante <= aujourd) e.classList.add('passee');
    });
    if (courante) { courante.classList.add('maintenant'); courante.querySelector('.quand').textContent += ` · ${T.maintenant}`; }
  }
  cases.forEach(c => c.addEventListener('change', () => { etat.cases = cases.filter(x => x.checked).map(x => x.name); garder(); maj(); }));
  champDate.addEventListener('change', () => { etat.date = champDate.value; garder(); maj(); });
  outils.querySelector('[data-vider]').addEventListener('click', () => { cases.forEach(c => { c.checked = false; }); etat.cases = []; garder(); maj(); });
  outils.querySelector('[data-imprimer]').addEventListener('click', () => print());
  // Le navigateur nomme le PDF d'après le titre de la page : on le remplace le temps de l'impression
  const titre = document.title;
  addEventListener('beforeprint', () => { document.title = 'Checklist_SwissDem_Transports'; });
  addEventListener('afterprint', () => { document.title = titre; });
  outils.hidden = false;
  maj();
})();

// Vidéos (v7) : muettes et en boucle, chargées seulement à l'approche et mises en pause hors de l'écran.
// Avec « réduire les animations », pas de lecture automatique : la photo reste affichée avec les commandes de lecture.
(function(){
  const videos = [...document.querySelectorAll('video.video-auto[data-src]')];
  if (!videos.length) return;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charger = v => { if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; } };
  if (reduit || !('IntersectionObserver' in window)) { videos.forEach(v => { v.controls = true; v.preload = 'none'; v.src = v.dataset.src; }); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { charger(v); v.play().catch(() => { v.controls = true; }); }
    else if (!v.paused) v.pause();
  }), {rootMargin: '200px 0px'});
  videos.forEach(v => io.observe(v));
})();

// Garde-meubles (v7) : le volume à stocker dessiné en cartons empilés (vue isométrique, 2,4 m de haut),
// une silhouette de 1,75 m pour l'échelle ; curseur, volumes types et inventaire de l'estimateur ; le volume rejoint le devis.
(function(){
  const zone = document.querySelector('.volume-wrap[data-volume]');
  if (!zone) return;
  const T = JSON.parse(zone.dataset.volume);
  const de = document.documentElement.lang.startsWith('de');
  const svg = zone.querySelector('.vol-svg'), range = zone.querySelector('input[type=range]');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const C = .6, D = 4, H = 4, PAR = D * H;            // carton de 0,6 m ; 4 en profondeur et 4 en hauteur = 2,4 m × 2,4 m
  const A = Math.cos(Math.PI / 6), B = .5;            // projection isométrique
  const iso = (x, y, z) => [(x - z) * A, (x + z) * B - y];
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString(de ? 'de-CH' : 'fr-CH', {maximumFractionDigits:1});
  const monde = el('g', {class:'vol-monde'}), sol = el('g', {class:'vol-sol'}), pile = el('g', {class:'vol-pile'}), gens = el('g', {class:'vol-gens'});
  monde.append(sol, pile, gens); svg.append(monde);
  const poly = pts => pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
  function carton(k){
    const i = Math.floor(k / PAR), j = Math.floor((k % PAR) / D), l = k % D;
    const x = i * C, y = j * C, z = l * C, h = Math.abs(Math.sin(k * 12.9898) * 43758.5453 % 1);
    const P = (a, b, c) => iso(x + a * C, y + b * C, z + c * C);
    const g = el('g', {class:'ct'});
    g.append(el('polygon', {points: poly([P(0,1,0), P(1,1,0), P(1,1,1), P(0,1,1)]), class:'f-top', style:`--h:${h}`}),
             el('polygon', {points: poly([P(0,0,1), P(1,0,1), P(1,1,1), P(0,1,1)]), class:'f-g'}),
             el('polygon', {points: poly([P(1,0,0), P(1,0,1), P(1,1,1), P(1,1,0)]), class:'f-d'}),
             el('polyline', {points: poly([P(.5,1,0), P(.5,1,1)]), class:'scotch'}));
    g.dataset.ordre = (i + l) * 100 + j;   // ordre du peintre : de l'arrière vers l'avant, du bas vers le haut
    return g;
  }
  const cartons = [];
  let n = 0, vol = 0;
  function dessiner(v){
    vol = v;
    const cible = Math.max(1, Math.round(v / (C * C * C)));
    const avant = n;
    for (let k = cartons.length; k < cible; k++) cartons.push(carton(k));
    cartons.forEach((g, k) => {
      if (k < cible && !g.isConnected) { g.style.setProperty('--d', Math.min(40, k - avant) * 8 + 'ms'); g.classList.remove('sort'); g.classList.add('entre'); }
      if (k < cible) g.classList.remove('sort');
    });
    const visibles = cartons.slice(0, cible).sort((a, b) => a.dataset.ordre - b.dataset.ordre);
    // Les cartons en trop s'effacent puis quittent le dessin
    cartons.slice(cible).forEach(g => { if (g.isConnected) { g.classList.add('sort'); setTimeout(() => { if (g.classList.contains('sort')) g.remove(); }, 260); } });
    visibles.forEach(g => pile.append(g));
    n = cible;
    // Sol et cotes
    const tranches = Math.ceil(cible / PAR), largeur = tranches * C, prof = D * C, haut = Math.min(H, Math.ceil(cible / D)) * C;
    sol.replaceChildren(
      el('polygon', {points: poly([iso(-.3,0,-.3), iso(largeur + .3,0,-.3), iso(largeur + .3,0,prof + .3), iso(-.3,0,prof + .3)]), class:'plancher'}));
    const tx = (a, b, txt, cls) => { const [x1, y1] = a, [x2, y2] = b, t = el('text', {x:(x1 + x2) / 2, y:(y1 + y2) / 2, class:'cote-t ' + cls}); t.textContent = txt; return t; };
    sol.append(tx(iso(0,0,prof + .55), iso(largeur,0,prof + .55), fmt(largeur) + ' m', 'cx'), tx(iso(largeur + .55,0,0), iso(largeur + .55,0,prof), fmt(prof) + ' m', 'cz'));
    // Silhouette de 1,75 m, debout devant la pile, à gauche
    const [px, py] = iso(-.7, 0, prof + .1);
    const perso = el('g', {class:'perso'});
    perso.append(el('title', {}), el('circle', {cx:px, cy:py - 1.63, r:.12}), el('rect', {x:px - .21, y:py - 1.48, width:.42, height:.7, rx:.12}),
                 el('rect', {x:px - .16, y:py - .86, width:.32, height:.86, rx:.06}));
    perso.firstChild.textContent = T.personne;
    gens.replaceChildren(perso);
    // Cadrage : tout le dessin tient dans la vue, avec une transition douce
    const xs = [iso(-.9,0,prof + .4)[0], iso(largeur + .9,0,-.3)[0]], ys = [iso(0,2.6,0)[1], iso(largeur,0,prof + .9)[1]];
    const w = xs[1] - xs[0], h = ys[1] - ys[0], e = Math.min(820 / w, 460 / h, 95);
    monde.style.transform = `translate(${450 - (xs[0] + w / 2) * e}px, ${260 - (ys[0] + h / 2) * e}px) scale(${e})`;
    // Textes
    zone.querySelector('[data-m3]').textContent = fmt(v);
    const eq = T.equiv.find(([max]) => v <= max)[1];
    zone.querySelector('[data-equiv]').textContent = T.comme.replace('{x}', eq);
    zone.querySelector('[data-sol]').textContent = T.sol.replace('{l}', fmt(largeur)).replace('{p}', fmt(prof)) + ', ' + T.haut.replace('{h}', fmt(haut));
    range.value = Math.round(v);
    zone.querySelectorAll('.vol-presets .chip').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.v) === Math.round(v)));
  }
  // Volume de l'estimateur, s'il a été rempli sur cet appareil
  let mien = 0;
  try { mien = parseFloat(localStorage.getItem('swissdem-volume')) || 0; } catch (e) {}
  if (mien > 0) {
    const b = document.createElement('button');
    b.className = 'chip mien'; b.type = 'button'; b.dataset.v = Math.round(mien); b.textContent = `${T.mon} · ${fmt(mien)} m³`;
    zone.querySelector('.vol-presets').prepend(b);
  }
  zone.querySelectorAll('.vol-presets .chip').forEach(b => b.addEventListener('click', () => dessiner(b.classList.contains('mien') ? mien : Number(b.dataset.v))));
  range.addEventListener('input', () => dessiner(Number(range.value)));
  zone.querySelector('[data-vol-go]').addEventListener('click', () => {
    const f = document.querySelector('.cartouche form');
    if (!f) return;
    if (f.elements.volume) f.elements.volume.value = fmt(vol);
    document.getElementById('devis').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center'});
    setTimeout(() => f.querySelector('input[name="npa_depart"]').focus({preventScroll:true}), 600);
  });
  dessiner(mien > 0 ? mien : 23);
})();

// Nettoyage (v7) : le plan du logement, pièce par pièce. Toucher une pièce affiche ce que l'équipe y nettoie,
// coché ligne après ligne ; la pièce passe au vert. Quand toutes ont été vues, le logement est « prêt pour l'état des lieux ».
(function(){
  const zone = document.querySelector('.pieces-wrap[data-pieces]');
  if (!zone) return;
  const T = JSON.parse(zone.dataset.pieces);
  const svg = zone.querySelector('.pc-plan'), liste = zone.querySelector('.pc-taches ul'), titre = zone.querySelector('[data-piece]');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at, txt) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); if (txt != null) n.textContent = txt; return n; };
  // Mêmes plans que les pages de service (cadre de 800 × 500), plus un balcon sous la façade
  const PLANS = {
    studio: [[0,0,500,320,'piece'],[500,0,300,320,'hall'],[0,320,300,180,'cuisine'],[300,320,200,180,'bains'],[500,320,300,180,'cave']],
    p25: [[0,0,430,320,'sejour'],[430,0,370,320,'chambre'],[0,320,300,180,'cuisine'],[300,320,200,180,'bains'],[500,320,300,180,'cave']],
    p35: [[0,0,380,320,'sejour'],[380,0,210,210,'chambre'],[590,0,210,210,'chambre'],[380,210,420,110,'hall'],[0,320,280,180,'cuisine'],[280,320,190,180,'bains'],[470,320,330,180,'cave']],
    p45: [[0,0,340,300,'sejour'],[340,0,230,200,'chambre'],[570,0,230,200,'chambre'],[340,200,460,100,'hall'],[0,300,230,200,'chambre'],[230,300,210,200,'cuisine'],[440,300,150,200,'bains'],[590,300,210,200,'cave']],
  };
  const SORTE = {piece:'vie', sejour:'vie', chambre:'vie', hall:'vie', cuisine:'cuisine', bains:'bains', cave:'cave', galetas:'cave', balcon:'balcon'};
  const X = 30, Y = 30;
  let vues = new Set(), active = null, pieces = [];
  function dessiner(type){
    svg.replaceChildren(); vues = new Set(); active = null;
    const plan = PLANS[type].concat([[0, 530, type === 'studio' ? 300 : 430, 90, 'balcon']]);
    pieces = plan.map(([x, y, w, h, cle], i) => {
      const nom = cle === 'balcon' ? T.balcon : T.noms[cle];
      const g = el('g', {class:'pc ' + SORTE[cle], tabindex:0, role:'button', 'aria-label':nom});
      g.append(el('rect', {x:X + x, y:Y + y, width:w, height:h, class:'pc-fond'}),
               el('text', {x:X + x + 16, y:Y + y + 30, class:'pc-nom'}, nom));
      const cx = X + x + w - 28, cy = Y + y + 28;
      const ok = el('g', {class:'pc-ok', transform:`translate(${cx} ${cy})`});
      ok.append(el('circle', {r:14}), el('path', {d:'M-6 0.5l4 4 8-8'}));
      g.append(ok);
      g.style.setProperty('--i', i);
      const p = { g, cle, nom };
      g.addEventListener('click', () => choisir(p));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choisir(p); } });
      svg.append(g);
      return p;
    });
    // Murs : le contour du logement, épais, par-dessus les pièces
    svg.append(el('rect', {x:X, y:Y, width:800, height:500, class:'pc-mur'}));
    titre.textContent = T.choisir; liste.replaceChildren();
    compter();
  }
  function compter(){
    const n = vues.size, t = pieces.length;
    zone.querySelector('[data-compte]').textContent = n === t ? T.tout : T.compte.replace('{n}', n).replace('{t}', t);
    zone.classList.toggle('pret', n === t);
  }
  function choisir(p){
    if (active) active.g.classList.remove('on');
    active = p; p.g.classList.add('on', 'fait');
    vues.add(p);
    titre.textContent = p.nom;
    liste.replaceChildren(...T.taches[SORTE[p.cle]].map((t, i) => {
      const li = document.createElement('li'); li.textContent = t; li.style.setProperty('--i', i); return li;
    }));
    compter();
  }
  zone.querySelectorAll('.vol-presets .chip').forEach(b => b.addEventListener('click', () => {
    zone.querySelectorAll('.vol-presets .chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    dessiner(b.dataset.type);
  }));
  dessiner('p35');
})();

// Déménagement (v7) : le volume chargé dans des camions 3,5 t (vue isométrique, environ 20 m³ par camion) ;
// au-delà, un second camion apparaît. Logements types, inventaire de l'estimateur, volume transmis au devis.
(function(){
  const zone = document.querySelector('.camion-wrap[data-camion-volume]');
  if (!zone) return;
  const T = JSON.parse(zone.dataset.camionVolume);
  const de = document.documentElement.lang.startsWith('de');
  const svg = zone.querySelector('.vol-svg'), range = zone.querySelector('input[type=range]');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const A = Math.cos(Math.PI / 6), B = .5, iso = (x, y, z) => [(x - z) * A, (x + z) * B - y];
  const poly = pts => pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString(de ? 'de-CH' : 'fr-CH', {maximumFractionDigits:1});
  const C = .52, NX = 8, NY = 4, NZ = 4, PLACES = NX * NY * NZ, CAP = 20;   // caisse ≈ 4,2 × 2,1 × 2,1 m
  const LC = NX * C, PC = NZ * C, HC = NY * C, ESP = LC + 2.4;            // camions à la file, le second derrière le premier
  const monde = el('g', {class:'vol-monde'}); svg.append(monde);
  const face = (g, pts, cls) => g.append(el('polygon', {points: poly(pts), class: cls}));
  const bloc = (g, x, y, z, l, h, p, cls) => {
    const P = (a, b, c) => iso(x + a * l, y + b * h, z + c * p);
    face(g, [P(0,0,1), P(1,0,1), P(1,1,1), P(0,1,1)], cls + ' fg'); face(g, [P(1,0,0), P(1,0,1), P(1,1,1), P(1,1,0)], cls + ' fd'); face(g, [P(0,1,0), P(1,1,0), P(1,1,1), P(0,1,1)], cls + ' ft');
  };
  const roue = (g, x, z) => { const [cx, cy] = iso(x, .32, z); g.append(el('ellipse', {cx, cy, rx:.3, ry:.33, class:'roue'})); };
  // Un camion : arrière (plancher, paroi du fond, paroi gauche), cartons, puis avant (cabine, roues, arêtes de la caisse)
  function camion(t){
    const x0 = -t * ESP, z0 = 0, y0 = .6;
    const g = el('g', {class:'cm'}), fond = el('g'), charge = el('g'), devant = el('g');
    const P = (x, y, z) => iso(x0 + x, y0 + y, z0 + z);
    bloc(fond, x0 - .1, .2, z0 + .15, LC + .1, .4, PC - .3, 'chassis');   // sous la caisse : dessiné avant le chargement
    face(fond, [P(0,0,0), P(LC,0,0), P(LC,0,PC), P(0,0,PC)], 'plancher-c');
    face(fond, [P(0,0,0), P(LC,0,0), P(LC,HC,0), P(0,HC,0)], 'paroi');
    face(fond, [P(0,0,0), P(0,0,PC), P(0,HC,PC), P(0,HC,0)], 'paroi p2');
    bloc(devant, x0 + LC + .05, .2, z0 + .1, 1.5, 1.85, PC - .2, 'cabine');
    bloc(devant, x0 + LC + .95, 1.2, z0 + .12, .5, .6, PC - .24, 'vitre');
    roue(devant, x0 + .8, z0 + PC); roue(devant, x0 + LC - .3, z0 + PC); roue(devant, x0 + LC + .9, z0 + PC);
    devant.append(el('polyline', {points: poly([P(0,HC,PC), P(LC,HC,PC), P(LC,0,PC), P(0,0,PC), P(0,HC,PC), P(0,HC,0), P(LC,HC,0), P(LC,HC,PC)]), class:'arete'}));
    g.append(fond, charge, devant);
    const cartons = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) {
      const c = el('g', {class:'ct'}), x = i * C, y = j * C, z = k * C, h = Math.abs(Math.sin((t * 300 + cartons.length) * 12.9898) * 43758.5453 % 1);
      const Q = (a, b, d) => P(x + a * C, y + b * C, z + d * C);
      face(c, [Q(0,1,0), Q(1,1,0), Q(1,1,1), Q(0,1,1)], 'f-top'); c.lastChild.style.setProperty('--h', h);
      face(c, [Q(0,0,1), Q(1,0,1), Q(1,1,1), Q(0,1,1)], 'f-g'); face(c, [Q(1,0,0), Q(1,0,1), Q(1,1,1), Q(1,1,0)], 'f-d');
      c.dataset.ordre = (i + k) * 100 + j; c.dataset.rang = i * NY * NZ + j * NZ + k;   // chargé du fond vers les portes, du bas vers le haut
      cartons.push(c);
    }
    // ordre de chargement : depuis la cabine (x grand) vers l'arrière, couche par couche
    cartons.sort((a, b) => (NX - 1 - Math.floor(a.dataset.rang / (NY * NZ))) * 1000 + (a.dataset.rang % (NY * NZ)) - ((NX - 1 - Math.floor(b.dataset.rang / (NY * NZ))) * 1000 + (b.dataset.rang % (NY * NZ))));
    return { g, charge, cartons, plein: 0 };
  }
  const camions = [];
  let vol = 0;
  function dessiner(v){
    vol = v;
    const nb = Math.max(1, Math.ceil(v / CAP - 1e-9));
    while (camions.length < nb) { const c = camion(camions.length); camions.push(c); }
    camions.forEach((c, t) => {
      if (t >= nb) { c.g.remove(); return; }
      const part = Math.min(1, Math.max(0, (v - t * CAP) / CAP)), n = Math.round(part * PLACES);
      const avant = c.plein;
      c.cartons.forEach((ct, k) => {
        if (k < n && !ct.isConnected) { ct.style.setProperty('--d', Math.min(40, k - avant) * 10 + 'ms'); ct.classList.add('entre'); }
        if (k >= n && ct.isConnected) ct.remove();
      });
      c.cartons.slice(0, n).sort((a, b) => a.dataset.ordre - b.dataset.ordre).forEach(ct => c.charge.append(ct));
      c.plein = n;
    });
    // Ordre des camions : celui du fond d'abord, celui de devant par-dessus
    camions.slice(0, nb).reverse().forEach(c => monde.append(c.g));
    const xmin = -(nb - 1) * ESP - .4;
    const xs = [iso(xmin, 0, PC + .3)[0], iso(LC + 1.8, 0, -.2)[0]], ys = [iso(xmin, HC + .9, 0)[1], iso(LC + 1.6, 0, PC + .4)[1]];
    const w = xs[1] - xs[0], h = ys[1] - ys[0], e = Math.min(820 / w, 460 / h, 110);
    monde.style.transform = `translate(${450 - (xs[0] + w / 2) * e}px, ${260 - (ys[0] + h / 2) * e}px) scale(${e})`;
    zone.querySelector('[data-m3]').textContent = fmt(v);
    zone.querySelector('[data-equiv]').textContent = T.comme.replace('{x}', T.equiv.find(([max]) => v <= max)[1]);
    zone.querySelector('[data-camions]').textContent = v <= CAP ? T.un : T.lourd;
    range.value = Math.round(v);
    zone.querySelectorAll('.vol-presets .chip').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.v) === Math.round(v)));
  }
  let mien = 0;
  try { mien = parseFloat(localStorage.getItem('swissdem-volume')) || 0; } catch (e) {}
  if (mien > 0) {
    const b = document.createElement('button');
    b.className = 'chip mien'; b.type = 'button'; b.dataset.v = Math.round(mien); b.textContent = `${T.mon} · ${fmt(mien)} m³`;
    zone.querySelector('.vol-presets').prepend(b);
  }
  zone.querySelectorAll('.vol-presets .chip').forEach(b => b.addEventListener('click', () => dessiner(b.classList.contains('mien') ? mien : Number(b.dataset.v))));
  range.addEventListener('input', () => dessiner(Number(range.value)));
  zone.querySelector('[data-camion-go]').addEventListener('click', () => {
    const f = document.querySelector('.cartouche form');
    if (!f) return;
    if (f.elements.volume) f.elements.volume.value = fmt(vol);
    document.getElementById('devis').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center'});
    setTimeout(() => f.querySelector('input[name="npa_depart"]').focus({preventScroll:true}), 600);
  });
  dessiner(mien > 0 ? mien : 32);
})();

// Entreprises (v7) : les postes de travail dessinés en rangées (vue isométrique), une couleur d'étiquette par rangée
// comme sur le plan de transfert ; nombre de postes et type de locaux donnent un volume et une organisation indicatifs.
(function(){
  const zone = document.querySelector('.postes-wrap[data-postes]');
  if (!zone) return;
  const T = JSON.parse(zone.dataset.postes);
  const de = document.documentElement.lang.startsWith('de');
  const svg = zone.querySelector('.vol-svg'), range = zone.querySelector('input[type=range]');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const A = Math.cos(Math.PI / 6), B = .5, iso = (x, y, z) => [(x - z) * A, (x + z) * B - y];
  const poly = pts => pts.map(p => p.map(v => v.toFixed(2)).join(',')).join(' ');
  const fmt = v => Math.round(v).toLocaleString(de ? 'de-CH' : 'fr-CH');
  const PAR_RANG = 6, PAS_X = 1.6, PAS_Z = 2.3, ETIQ = ['var(--move)', 'var(--clean)', 'var(--store)'];
  const monde = el('g', {class:'vol-monde'}), sol = el('g', {}), salle = el('g', {});
  monde.append(sol, salle); svg.append(monde);
  // Un bloc (boîte) : dessus et deux faces visibles
  const bloc = (g, x, y, z, l, h, p, cls) => {
    const P = (a, b, c) => iso(x + a * l, y + b * h, z + c * p);
    g.append(el('polygon', {points: poly([P(0,0,1), P(1,0,1), P(1,1,1), P(0,1,1)]), class: cls + ' fg'}),
             el('polygon', {points: poly([P(1,0,0), P(1,0,1), P(1,1,1), P(1,1,0)]), class: cls + ' fd'}),
             el('polygon', {points: poly([P(0,1,0), P(1,1,0), P(1,1,1), P(0,1,1)]), class: cls + ' ft'}));
  };
  function poste(k){
    const i = k % PAR_RANG, r = Math.floor(k / PAR_RANG), x = i * PAS_X, z = r * PAS_Z;
    const g = el('g', {class:'ps'});
    // Dessiné de l'arrière vers l'avant : pieds, plateau, écran, puis la chaise côté allée
    bloc(g, x + .04, 0, z + .04, .05, .7, .67, 'pied');
    bloc(g, x + 1.31, 0, z + .04, .05, .7, .67, 'pied');
    bloc(g, x, .7, z, 1.4, .05, .75, 'bureau');
    bloc(g, x + .5, .75, z + .12, .42, .3, .04, 'ecran');
    bloc(g, x + .48, 0, z + .95, .46, .46, .46, 'chaise');
    bloc(g, x + .48, .46, z + 1.36, .46, .42, .06, 'chaise');
    const [a, b] = iso(x + .08, .72, z + .75), [c, d] = iso(x + .42, .72, z + .75);
    g.append(el('line', {x1:a, y1:b, x2:c, y2:d, class:'etiq', style:`stroke:${ETIQ[r % 3]}`}));   // étiquette du service
    g.dataset.ordre = (i * PAS_X + r * PAS_Z) * 10;
    return g;
  }
  const postes = [];
  let n = 0, type = T.types[0];
  function dessiner(nb){
    const avant = n;
    for (let k = postes.length; k < nb; k++) postes.push(poste(k));
    postes.slice(nb).forEach(g => g.remove());
    postes.slice(0, nb).forEach((g, k) => { if (!g.isConnected) { g.style.setProperty('--d', Math.min(30, k - avant) * 18 + 'ms'); g.classList.add('entre'); } });
    postes.slice(0, nb).sort((a, b) => a.dataset.ordre - b.dataset.ordre).forEach(g => salle.append(g));
    n = nb;
    const cols = Math.min(nb, PAR_RANG), rangs = Math.ceil(nb / PAR_RANG), L = cols * PAS_X, P = rangs * PAS_Z;
    sol.replaceChildren(el('polygon', {points: poly([iso(-.4,0,-.4), iso(L + .2,0,-.4), iso(L + .2,0,P), iso(-.4,0,P)]), class:'plancher'}));
    const xs = [iso(-.6,0,P + .2)[0], iso(L + .4,0,-.6)[0]], ys = [iso(0,1.3,0)[1], iso(L,0,P + .4)[1]];
    const w = xs[1] - xs[0], h = ys[1] - ys[0], e = Math.min(820 / w, 460 / h, 120);
    monde.style.transform = `translate(${450 - (xs[0] + w / 2) * e}px, ${260 - (ys[0] + h / 2) * e}px) scale(${e})`;
    zone.querySelector('[data-n]').textContent = nb;
    zone.querySelector('[data-vol]').textContent = T.volume.replace('{v}', fmt(nb * type[2]));
    zone.querySelector('[data-caisses]').textContent = T.caisses.replace('{c}', fmt(nb * 4));
    zone.querySelector('[data-horaire]').textContent = T.horaires.find(([max]) => nb <= max)[1];
    range.value = nb;
  }
  zone.querySelectorAll('.vol-presets .chip').forEach(b => b.addEventListener('click', () => {
    type = T.types.find(t => t[0] === b.dataset.type);
    zone.querySelectorAll('.vol-presets .chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    dessiner(n);
  }));
  range.addEventListener('input', () => dessiner(Number(range.value)));
  zone.querySelector('[data-postes-go]').addEventListener('click', () => {
    const f = document.querySelector('.cartouche form');
    if (!f) return;
    if (f.elements.volume) f.elements.volume.value = `${n} ${T.unite}, ${fmt(n * type[2])} m³`;
    document.getElementById('devis').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center'});
    setTimeout(() => f.querySelector('input[name="npa_depart"]').focus({preventScroll:true}), 600);
  });
  dessiner(12);
})();

// Garde-meubles (v7) : situations en onglets (sans JavaScript, toutes restent affichées)
(function(){
  const zone = document.querySelector('[data-situations]');
  if (!zone) return;
  const tabs = zone.querySelector('.situ-tabs'), boutons = [...tabs.querySelectorAll('button')], panneaux = [...zone.querySelectorAll('.situ-p')];
  const montrer = k => {
    boutons.forEach(b => b.setAttribute('aria-selected', b.dataset.situ === k));
    panneaux.forEach(p => { p.hidden = p.dataset.situ !== k; });
  };
  boutons.forEach((b, i) => {
    b.addEventListener('click', () => montrer(b.dataset.situ));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault(); const c = boutons[(i + d + boutons.length) % boutons.length]; c.focus(); montrer(c.dataset.situ);
    });
  });
  tabs.hidden = false;
  zone.classList.add('onglets');
  montrer(boutons[0].dataset.situ);
})();

// Garde-meubles (v7) : inventaire d'exemple, cocher ce qu'on voudrait sortir pendant le stockage
(function(){
  const zone = document.querySelector('[data-inventaire]');
  if (!zone) return;
  const T = JSON.parse(zone.dataset.inventaire);
  const cases = [...zone.querySelectorAll('tbody input')], msg = zone.querySelector('[data-sortir]'), rdv = zone.querySelector('.inv-rdv');
  const maj = () => {
    const c = cases.filter(x => x.checked).length;
    msg.textContent = c > 1 ? T.sortir.replace('{n}', c) : c ? T.sortir1 : T.sortir0;
    rdv.hidden = !c;
    cases.forEach(x => x.closest('tr').classList.toggle('on', x.checked));
  };
  cases.forEach(x => x.addEventListener('change', maj));
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
  const cartes = reduit ? [] : [...document.querySelectorAll('.panels > li')];

  let attente = false;
  function defiler(){
    attente = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    barre.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
    if (top) top.classList.toggle('compact', scrollY > 40);
    // « Ce qui est compris » : en descendant, les cartes s'allument l'une après l'autre, dans l'ordre de lecture
    if (cartes.length) {
      const r = cartes[0].parentElement.getBoundingClientRect();
      const p = (innerHeight * .8 - r.top) / (r.height + innerHeight * .3);
      const i = p > 0 && p < 1 ? Math.min(cartes.length - 1, Math.floor(p * cartes.length)) : -1;
      cartes.forEach((c, k) => c.classList.toggle('actif', k === i));
    }
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
    '.atouts > li', '.quotes > *', '.carte', '.agency', '.check > li', '.marque-geante', '.situ', '.inv', '.panels > li', '.faq details, main details', '.others a', '.towns-list li', '.fiche', '.plan-wrap'];
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
