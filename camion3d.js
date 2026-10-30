// Camion SwissDem en 3D (Three.js), premier écran de l'accueil, en studio blanc.
// Il entre sur le plateau tournant, freine, puis se présente de trois quarts.
// On le fait pivoter au doigt, à la souris ou aux flèches ; il revient seul à sa pose.
// Sans WebGL ou si Three.js ne se charge pas, la vraie photo du camion s'affiche à la place.
const scene3d = document.querySelector("[data-camion]");
if (scene3d) demarrer(scene3d).catch(() => repli(scene3d));

function repli(el) {
  el.classList.add("sans-3d");
  const img = el.querySelector("img");
  if (img) img.hidden = false;
}

// Une attente qui ne bloque jamais le camion : passé le délai, on continue sans
const auPlus = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

function charger(src) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

// Flanc du caisson : logo, les trois services aux couleurs du logo, la ville en bleu, la vague sombre et verte
async function flanc(THREE, el) {
  const [, logo] = await Promise.all([
    auPlus(document.fonts.load("600 50px Archivo").catch(() => {}), 1500),
    auPlus(charger(el.dataset.logo).catch(() => null), 1500),
  ]);
  const c = document.createElement("canvas");
  c.width = 1600; c.height = 860;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1600, 860);
  // La ville, côté cabine
  const immeubles = [[1040, 96, 230], [1150, 120, 360], [1282, 84, 280], [1378, 132, 430], [1522, 70, 260]];
  for (const [x, w, h] of immeubles) {
    g.fillStyle = "#1c5bb8"; g.fillRect(x, 720 - h, w, h);
    g.fillStyle = "#dbe6f6";
    for (let y = 720 - h + 26; y < 680; y += 44) for (let xx = x + 16; xx < x + w - 20; xx += 30) g.fillRect(xx, y, 14, 20);
  }
  // La vague
  g.fillStyle = "#23262b";
  g.beginPath(); g.moveTo(0, 860); g.lineTo(0, 760); g.bezierCurveTo(520, 690, 1000, 850, 1600, 640); g.lineTo(1600, 860); g.fill();
  g.strokeStyle = "#1f9a3e"; g.lineWidth = 12;
  g.beginPath(); g.moveTo(0, 730); g.bezierCurveTo(520, 660, 1000, 820, 1600, 610); g.stroke();
  if (logo) g.drawImage(logo, 80, 70, 560, 188);
  const couleurs = ["#f4c300", "#1f9a3e", "#1c5bb8"];
  el.dataset.services.split("|").forEach((s, i) => {
    const y = 370 + i * 86;
    g.fillStyle = couleurs[i]; g.beginPath(); g.arc(102, y - 17, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0f1319"; g.font = "600 50px Archivo, sans-serif"; g.fillText(s, 140, y);
  });
  g.fillStyle = "#3d4450"; g.font = "500 40px Archivo, sans-serif"; g.fillText(el.dataset.site, 84, 660);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { flanc: t, logo };
}

// Portes arrière : deux battants, poignées, petit logo
function arriere(THREE, logo) {
  const c = document.createElement("canvas");
  c.width = 820; c.height = 860;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 820, 860);
  g.fillStyle = "#d3d7dc"; g.fillRect(407, 0, 6, 860);
  g.fillStyle = "#2a2d31"; g.fillRect(360, 380, 18, 150); g.fillRect(442, 380, 18, 150);
  if (logo) g.drawImage(logo, 230, 70, 360, 121);
  g.fillStyle = "#c8241b"; g.fillRect(40, 800, 90, 30); g.fillRect(690, 800, 90, 30);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ombre(THREE, w, h, force) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, `rgba(20,28,40,${force})`); r.addColorStop(.55, `rgba(20,28,40,${force * .45})`); r.addColorStop(1, "rgba(20,28,40,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

async function demarrer(el) {
  const THREE = await import("three");
  const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", el.dataset.label);
  canvas.tabIndex = 0;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const soleil = new THREE.DirectionalLight(0xffffff, 1.4);
  soleil.position.set(-4, 10, 7);
  scene.add(soleil, new THREE.HemisphereLight(0xffffff, 0xdfe3ea, 0.5));
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 200);

  // ---------- Matières ----------
  const rouge = new THREE.MeshPhysicalMaterial({ color: 0xc8241b, roughness: .3, metalness: .15, clearcoat: 1, clearcoatRoughness: .08 });
  const blanc = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .45, clearcoat: .4 });
  const noir = new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: .7 });
  const verre = new THREE.MeshPhysicalMaterial({ color: 0x10151b, roughness: .05, metalness: .2, clearcoat: 1 });
  const pneu = new THREE.MeshStandardMaterial({ color: 0x202326, roughness: .9 });
  const jante = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: .3, metalness: .8 });
  const phare = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: .5, roughness: .2 });
  const { flanc: texFlanc, logo } = await flanc(THREE, el);
  const decor = new THREE.MeshPhysicalMaterial({ map: texFlanc, roughness: .45, clearcoat: .4 });
  const decorArr = new THREE.MeshPhysicalMaterial({ map: arriere(THREE, logo), roughness: .45, clearcoat: .4 });

  const boite = (l, h, p, r, m, x, y, z = 0) => {
    const o = new THREE.Mesh(new RoundedBoxGeometry(l, h, p, 4, r), m);
    o.position.set(x, y, z);
    return o;
  };
  const extru = (pts, prof, m, biseau = .06) => {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 4, curveSegments: 8 });
    geo.translate(0, 0, -prof / 2);
    return new THREE.Mesh(geo, m);
  };

  // ---------- Le camion (avant vers +x, longueur ~6,1 m) ----------
  const camion = new THREE.Group();     // avance et tourne avec le plateau
  const tangage = new THREE.Group();    // plonge au freinage
  tangage.position.y = .55;
  const corps = new THREE.Group();
  corps.position.y = -.55;
  tangage.add(corps);
  camion.add(tangage);

  // Caisson et décors
  corps.add(boite(4.1, 2.3, 2.2, .08, blanc, -1.05, 1.95));
  const cote = new THREE.PlaneGeometry(3.96, 2.14);
  const fd = new THREE.Mesh(cote, decor); fd.position.set(-1.05, 1.95, 1.102); corps.add(fd);
  const fg = new THREE.Mesh(cote, decor); fg.position.set(-1.05, 1.95, -1.102); fg.rotation.y = Math.PI; corps.add(fg);
  const ar = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 2.14), decorArr); ar.position.set(-3.102, 1.95, 0); ar.rotation.y = -Math.PI / 2; corps.add(ar);

  // Cabine : profil extrudé sur la largeur
  const cabine = new THREE.Group();
  cabine.position.x = 1.08;
  cabine.add(extru([[0, .42], [1.9, .42], [1.9, 1.0], [1.5, 1.2], [1.0, 2.25], [.15, 2.38], [0, 2.38]], 1.88, rouge));
  cabine.add(extru([[0, 2.42], [1.1, 2.42], [.3, 3.0], [0, 3.04]], 1.8, rouge, .04));   // déflecteur de toit
  const vitre = [[.3, 1.45], [1.3, 1.45], [1.02, 2.08], [.3, 2.08]];
  for (const z of [1.006, -1.006]) { const v = extru(vitre, .01, verre, .005); v.position.z = z; cabine.add(v); }
  const pente = Math.hypot(.5, 1.05), ang = Math.atan2(.5, 1.05);
  const pb = new THREE.Mesh(new RoundedBoxGeometry(.02, pente * .86, 1.76, 2, .01), verre);
  pb.position.set(1.25 + Math.cos(ang) * .065, 1.725 + Math.sin(ang) * .065, 0);
  pb.rotation.z = ang;
  cabine.add(pb);
  cabine.add(boite(.26, .32, 2.08, .06, noir, 1.9, .56));          // pare-chocs
  cabine.add(boite(.08, .26, 1.3, .03, noir, 1.94, .86));          // calandre
  for (const z of [.74, -.74]) cabine.add(boite(.08, .16, .42, .04, phare, 1.93, 1.06, z));
  for (const z of [1.13, -1.13]) cabine.add(boite(.1, .34, .08, .03, noir, 1.36, 1.9, z));
  corps.add(cabine);

  // Châssis et pare-chocs arrière
  corps.add(boite(5.7, .28, 1.5, .04, noir, -.2, .62));
  corps.add(boite(.18, .22, 2.1, .04, noir, -3.08, .55));

  // Roues : elles tournent avec la distance parcourue
  const R = .38, roues = [];
  const roue = (x, z) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, R, z);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .28, 40), pneu); p.rotation.x = Math.PI / 2;
    const j = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .29, 32), jante); j.rotation.x = Math.PI / 2;
    pivot.add(p, j);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .3, 8), noir);
      b.rotation.x = Math.PI / 2; b.position.set(Math.cos(a) * .12, Math.sin(a) * .12, 0);
      pivot.add(b);
    }
    roues.push(pivot);
    camion.add(pivot);
  };
  for (const z of [.92, -.92]) { roue(2.3 + .0, z); roue(-2.1, z); }
  // le camion est centré sur sa longueur
  camion.children.forEach(o => { o.position.x += .06; });

  const ombreCamion = ombre(THREE, 7.4, 3.4, .42);
  ombreCamion.position.y = .002;
  camion.add(ombreCamion);
  camion.position.y = .08;

  // Plateau tournant : disque blanc, graduations, ombre douce au sol
  const plateau = new THREE.Group();
  const disque = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, .08, 120), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .25, clearcoat: 1, clearcoatRoughness: .2 }));
  disque.position.y = .04;
  plateau.add(disque);
  const trait = new THREE.MeshBasicMaterial({ color: 0xc4cad2 });
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2, long = i % 6 === 0 ? .22 : .1;
    const t = new THREE.Mesh(new THREE.PlaneGeometry(.025, long), trait);
    t.rotation.x = -Math.PI / 2; t.rotation.z = -a;
    t.position.set(Math.sin(a) * (4.1 - long / 2), .081, Math.cos(a) * (4.1 - long / 2));
    plateau.add(t);
  }
  const ombreSol = ombre(THREE, 10.5, 10.5, .22);
  ombreSol.position.y = .001;
  scene.add(ombreSol);
  plateau.add(camion);
  scene.add(plateau);

  // ---------- Cadrage ----------
  const cible = new THREE.Vector3(0, .75, 0);   // sous le centre du camion : il se tient au-dessus du devis qui flotte en bas
  let D = 30, demiLargeur = 8;
  const cadrer = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    D = Math.max(7.2 / (2 * t), (camera.aspect < 1.4 ? 9.2 : 11.6) / (2 * t * camera.aspect));   // sur téléphone, le plateau peut déborder
    demiLargeur = D * t * camera.aspect;
    camera.updateProjectionMatrix();
  };

  // ---------- Mouvement ----------
  const POSE = -.62, ARRIVEE = 2.6, TOUR = 1.5;
  const S = { x: 0, dist: 0, v: 0, yaw: POSE, yawV: 0, pitch: 0, pitchV: 0, phase: reduit ? "libre" : "arrivee", t: 0, depart: 0, tire: false, dernier: 0, px: 0, py: 0, camX: 0, camY: 0 };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const posArrivee = t => S.depart * (1 - easeOut(Math.min(1, t / ARRIVEE)));
  cadrer();
  if (!reduit) { S.depart = -(demiLargeur + 5); S.x = S.depart; S.yaw = 0; }

  let enCours = false, visible = true, avant = 0;
  const actif = () => S.phase !== "libre" || S.tire || Math.abs(S.yawV) > 1e-3 || Math.abs(S.pitch) > 1e-4 || Math.abs(S.pitchV) > 1e-4
    || Math.abs(S.camX - S.px) > 1e-3 || Math.abs(S.camY - S.py) > 1e-3 || (performance.now() - S.dernier > 3500 && Math.abs(S.yaw - POSE) > 1e-3);

  function pas(dt, now) {
    let cibleTangage = 0;
    if (S.phase === "arrivee") {
      S.t += dt;
      const x = posArrivee(S.t), v = (x - S.x) / dt;
      cibleTangage = THREE.MathUtils.clamp((v - S.v) / dt * .0045, -.05, .05);
      S.dist += x - S.x; S.x = x; S.v = v;
      if (S.t >= ARRIVEE) { S.phase = "tour"; S.t = 0; S.v = 0; }
    } else if (S.phase === "tour") {
      S.t += dt;
      S.yaw = POSE * easeInOut(Math.min(1, S.t / TOUR));
      if (S.t >= TOUR) { S.phase = "libre"; S.dernier = now; }
    } else if (!S.tire) {
      if (now - S.dernier > 3500) S.yawV += ((POSE - S.yaw) * 10 - S.yawV * 5.5) * dt;   // retour à la pose
      else S.yawV *= Math.exp(-dt * 3.2);                                                    // inertie
      S.yaw += S.yawV * dt;
    }
    // Suspension : un ressort amorti suit la décélération
    S.pitchV += ((cibleTangage - S.pitch) * 90 - S.pitchV * 9) * dt;
    S.pitch += S.pitchV * dt;
    // Parallaxe douce de la caméra avec le pointeur
    S.camX += (S.px - S.camX) * Math.min(1, dt * 4);
    S.camY += (S.py - S.camY) * Math.min(1, dt * 4);
  }

  function rendu() {
    camion.position.x = S.x;
    plateau.rotation.y = S.yaw;
    tangage.rotation.z = S.pitch;
    roues.forEach(r => { r.rotation.z = -S.dist / R; });
    camera.position.set(S.camX * 1.6, 2.2 + D * .2 + S.camY * .8, D);
    camera.lookAt(cible);
    renderer.render(scene, camera);
  }

  function boucle(now) {
    const dt = Math.min(.05, (now - avant) / 1000 || .016);
    avant = now;
    pas(dt, now);
    rendu();
    if (visible && actif()) requestAnimationFrame(boucle);
    else enCours = false;
  }
  const relancer = () => { if (!enCours && visible) { enCours = true; avant = performance.now(); requestAnimationFrame(boucle); } };

  // ---------- Interaction ----------
  const touche = () => el.classList.add("touche");
  let lastX = 0, lastT = 0;
  canvas.addEventListener("pointerdown", e => {
    if (S.phase !== "libre") return;
    S.tire = true; lastX = e.clientX; lastT = e.timeStamp; S.yawV = 0;
    canvas.setPointerCapture(e.pointerId); touche(); relancer();
  });
  canvas.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    if (e.pointerType === "mouse") { S.px = (e.clientX - r.left) / r.width * 2 - 1; S.py = (e.clientY - r.top) / r.height * 2 - 1; }
    if (S.tire) {
      const dx = e.clientX - lastX, dt = Math.max(1, e.timeStamp - lastT) / 1000;
      S.yaw += dx * .008; S.yawV = dx * .008 / dt;
      lastX = e.clientX; lastT = e.timeStamp;
    }
    relancer();
  });
  const lacher = () => { if (!S.tire) return; S.tire = false; S.dernier = performance.now(); setTimeout(relancer, 3600); relancer(); };
  canvas.addEventListener("pointerup", lacher);
  canvas.addEventListener("pointercancel", lacher);
  canvas.addEventListener("pointerleave", () => { S.px = 0; S.py = 0; relancer(); });
  canvas.addEventListener("keydown", e => {
    if (S.phase !== "libre" || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    S.yawV += e.key === "ArrowLeft" ? -2.4 : 2.4;
    S.dernier = performance.now(); touche(); setTimeout(relancer, 3600); relancer();
  });

  new ResizeObserver(() => { cadrer(); rendu(); }).observe(el);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; relancer(); }).observe(el);

  el.prepend(canvas);
  rendu();
  el.classList.add("pret");
  relancer();
}
