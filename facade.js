// Façade SwissDem du premier écran (2D, SVG), inspirée des halles de stockage à boxes :
// pilastres de briques, bandeau anthracite aux grands numéros, portes sectionnelles vitrées.
// site.js annonce le volume (logement choisi ou inventaire) par l'événement « swissdem:volume » :
// la porte 03 se lève, la lumière sort du box et les cartons s'empilent selon le volume.
(() => {
  const stage = document.querySelector("[data-camion]");
  if (!stage) return;
  const NS = "http://www.w3.org/2000/svg";
  // Le logo est cherché à côté du script (marque/), à la racine du site comme dans la maquette
  const logo = new URL("marque/logo-swissdem.webp", document.currentScript ? document.currentScript.src : location.href).href;
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

  const svg = el("svg", { viewBox: "-20 0 1440 620", preserveAspectRatio: "xMidYMax slice", role: "img", "aria-label": stage.dataset.label || "" });
  svg.innerHTML = `<defs>
 <linearGradient id="fa-ciel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7f9cc9"/><stop offset=".7" stop-color="#c9d7ea"/><stop offset="1" stop-color="#e9eef5"/></linearGradient>
 <pattern id="fa-brique" width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill="#8f3e31"/><rect width="23" height="4.2" fill="#9b4536"/><rect x="-12" y="5" width="23" height="4.2" fill="#93402f"/><rect x="12" y="5" width="23" height="4.2" fill="#a04a3a"/></pattern>
 <linearGradient id="fa-bande" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a4049"/><stop offset="1" stop-color="#2a2f37"/></linearGradient>
 <linearGradient id="fa-vitre" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#dfe8f4"/><stop offset=".5" stop-color="#8ea6c4"/><stop offset="1" stop-color="#3d4a5c"/></linearGradient>
 <linearGradient id="fa-lumiere" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff2bf"/><stop offset="1" stop-color="#f0bb1c"/></linearGradient>
 <linearGradient id="fa-sol" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3b3f45"/><stop offset="1" stop-color="#25282d"/></linearGradient>
 <linearGradient id="fa-halo" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd21f" stop-opacity=".5"/><stop offset="1" stop-color="#ffd21f" stop-opacity="0"/></linearGradient>
 <clipPath id="fa-ouverture"><rect width="168" height="196"/></clipPath>
 <g id="fa-porte">
  <rect width="168" height="196" fill="#dcdfe3"/>
  <g fill="#2b3442"><rect x="10" y="22" width="46" height="22"/><rect x="61" y="22" width="46" height="22"/><rect x="112" y="22" width="46" height="22"/><rect x="10" y="62" width="46" height="22"/><rect x="61" y="62" width="46" height="22"/><rect x="112" y="62" width="46" height="22"/></g>
  <g stroke="#b9bec5" stroke-width="1.5"><line x1="0" y1="52" x2="168" y2="52"/><line x1="0" y1="92" x2="168" y2="92"/><line x1="0" y1="132" x2="168" y2="132"/><line x1="0" y1="164" x2="168" y2="164"/></g>
  <rect x="64" y="100" width="40" height="96" fill="none" stroke="#b9bec5" stroke-width="1.5"/>
 </g>
</defs>
<rect x="-400" width="2200" height="620" fill="url(#fa-ciel)"/>
<path d="M-200 120 q400 -40 800 10 t800 -20" stroke="#fff" stroke-opacity=".35" stroke-width="40" fill="none"/>
<rect x="-400" y="510" width="2200" height="110" fill="url(#fa-sol)"/>
<g stroke="#d9c98a" stroke-opacity=".45" stroke-width="3"><line x1="420" y1="620" x2="500" y2="530"/><line x1="964" y1="620" x2="884" y2="530"/></g>
<rect x="-6" y="110" width="196" height="400" fill="url(#fa-brique)"/><rect x="-6" y="104" width="196" height="8" fill="#5b6270"/>
<rect x="6" y="146" width="172" height="66" rx="3" fill="#fff"/><rect x="6" y="212" width="172" height="4" fill="#f4c300"/>
<image href="${logo}" x="14" y="151" width="156" height="52" preserveAspectRatio="xMidYMid meet"/>
<rect x="84" y="250" width="16" height="260" fill="#1d2229"/>
<rect x="190" y="110" width="1004" height="400" fill="#2a2f37"/><rect x="190" y="104" width="1004" height="8" fill="#5b6270"/>
<rect x="190" y="112" width="1004" height="196" fill="url(#fa-bande)"/>`;

  const x0 = 190, pas = 196, ouverte = 2;
  const cartons = [];
  let porte = null;
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * pas, dx = x + 26;
    el("rect", { x, y: 110, width: 24, height: 400, fill: "url(#fa-brique)" }, svg);
    el("rect", { x: dx + 14, y: 128, width: 140, height: 62, fill: "#1d2229" }, svg);
    el("rect", { x: dx + 18, y: 132, width: 132, height: 54, fill: "url(#fa-vitre)" }, svg);
    for (const k of [1, 2, 3]) el("rect", { x: dx + 18 + k * 33, y: 132, width: 3, height: 54, fill: "#1d2229" }, svg);
    el("text", { x: dx + 84, y: 288, "text-anchor": "middle", "font-family": "Archivo, sans-serif", "font-size": 44, "font-weight": 600, fill: i === ouverte ? "#f4c300" : "#d7dbe0" }, svg).textContent = String(i + 1).padStart(2, "0");
    const g = el("g", { transform: `translate(${dx} 314)` }, svg);
    if (i === ouverte) {
      el("rect", { width: 168, height: 196, fill: "url(#fa-lumiere)" }, g);
      [[6,148],[60,148],[114,148],[6,100],[60,100],[114,100],[32,52],[86,52],[114,52]].forEach(([cx, cy], k) => {
        const c = el("g", { class: "fa-carton off" }, g);
        el("rect", { x: cx, y: cy, width: 48, height: 48, fill: k % 2 ? "#d9a85b" : "#e5b66c", stroke: "#9b6d1f", "stroke-width": 1.2 }, c);
        el("rect", { x: cx + 18, y: cy, width: 12, height: 48, fill: "#c99a4f", opacity: .6 }, c);
        cartons.push(c);
      });
      porte = el("use", { href: "#fa-porte", class: "fa-porte" }, el("g", { "clip-path": "url(#fa-ouverture)" }, g));
      el("rect", { x: -4, y: -4, width: 176, height: 5, fill: "#f4c300" }, g);
      el("polygon", { class: "fa-halo", points: "0,196 168,196 260,306 -92,306", fill: "url(#fa-halo)" }, g);
    } else el("use", { href: "#fa-porte" }, g);
    el("rect", { x: dx - 2, y: 502, width: 172, height: 8, fill: "#8a919c" }, svg);
  }
  el("rect", { x: x0 + 5 * pas, y: 110, width: 24, height: 400, fill: "url(#fa-brique)" }, svg);
  stage.prepend(svg);
  // Écran large : on cale la façade à gauche pour garder l'enseigne entière ; écran étroit : centrée sur le box 03
  const cadrer = () => svg.setAttribute("preserveAspectRatio", stage.clientWidth / stage.clientHeight >= 1.8 ? "xMinYMax slice" : "xMidYMax slice");
  cadrer(); addEventListener("resize", cadrer, { passive: true });

  // De 1 à 9 cartons : environ un carton pour 6 m³ (studio 2, 3,5 pièces 5, maison 9)
  function remplir(m3) {
    const n = m3 ? Math.max(1, Math.min(9, Math.round(m3 / 6))) : 0;
    cartons.forEach((c, k) => { c.classList.toggle("off", k >= n); c.style.transitionDelay = `${300 + k * 70}ms`; });
    stage.classList.toggle("ouverte", n > 0);
  }
  document.addEventListener("swissdem:volume", e => remplir(e.detail.m3));
  // Le box s'ouvre quand le plateau arrive à l'écran
  const depart = () => remplir(window.swissdemVolume ?? 32);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(depart, 400); } }, { threshold: .4 });
    io.observe(stage);
  } else depart();
})();
