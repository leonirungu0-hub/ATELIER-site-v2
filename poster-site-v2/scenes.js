/* Three 3D sections:
   1. Hero: a ring of posters you can drag, that also turns as you scroll.
   2. Tunnel: scroll through the section to fly past every poster.
   3. Surfaces: real 3D panels (canvas, steel, aluminum, acrylic) that catch the light.
   Needs three.js (loaded from a CDN in index.html) and POSTERS / MATERIALS / state from script.js. */
(function () {
  'use strict';

  const heroSec = document.getElementById('hero');
  const showSec = document.getElementById('showcase');
  const slabSec = document.getElementById('surfaces-section');
  const tip = document.getElementById('s3d-tip');

  // Fall back to flat versions when 3D isn't possible (reduced motion, no three.js, no WebGL)
  function noThree() {
    heroSec.classList.add('no3d');
    showSec.hidden = true;
    slabSec.classList.add('no3d');
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return noThree();
  if (typeof THREE === 'undefined' || typeof POSTERS === 'undefined') return noThree();
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return noThree();

  /* ---------- Shared helpers ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const small = () => innerWidth < 700;
  const bySize = id => (small() ? `./img/thumbs/${id}.jpg` : `./img/${id}.jpg`);
  const thumb = id => `./img/thumbs/${id}.jpg`;

  const imgCache = {};
  const loadImage = url =>
    imgCache[url] ||
    (imgCache[url] = new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    }));
  function makeTex() {
    const t = new THREE.Texture();
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  function setImage(tex, im) {
    if (!im) return;
    tex.image = im;
    tex.needsUpdate = true;
  }
  function makeRenderer(canvas, alpha) {
    try {
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      return r;
    } catch (e) {
      return null;
    }
  }
  function fit(renderer, camera, canvas) {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  // runs a draw function only while its section is on screen
  function makeLoop(frame) {
    let visible = false;
    let running = false;
    function tick(t) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      frame(t);
      requestAnimationFrame(tick);
    }
    function start() {
      if (!running && visible && !document.hidden) {
        running = true;
        requestAnimationFrame(tick);
      }
    }
    document.addEventListener('visibilitychange', start);
    return {
      set(v) {
        visible = v;
        start();
      }
    };
  }
  function whenVisible(el, margin, cb) {
    new IntersectionObserver(es => cb(es[0].isIntersecting), { rootMargin: margin }).observe(el);
  }
  function showTip(text, x, y) {
    tip.textContent = text;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.hidden = false;
  }
  const hideTip = () => (tip.hidden = true);
  function pointerOn(canvas) {
    const p = { x: 0, y: 0, cx: 0, cy: 0, over: false };
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      p.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      p.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      p.cx = e.clientX;
      p.cy = e.clientY;
      p.over = true;
    });
    canvas.addEventListener('pointerleave', () => {
      p.over = false;
      p.x = 0;
      p.y = 0;
    });
    return p;
  }
  function pickFrom(canvas, camera, list, cx, cy) {
    const raycaster = pickFrom.rc || (pickFrom.rc = new THREE.Raycaster());
    const ndc = pickFrom.v || (pickFrom.v = new THREE.Vector2());
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(list, false)[0];
    return hit ? hit.object.userData.i : -1;
  }
  const goCustomize = id => {
    selectPoster(id); // from script.js
    document.getElementById('customize').scrollIntoView({ behavior: 'smooth' });
  };

  /* ====================================================================
     1. HERO: a ring of posters
     ==================================================================== */
  function initHero() {
    const canvas = document.getElementById('hero3d');
    const renderer = makeRenderer(canvas, true);
    if (!renderer) return heroSec.classList.add('no3d');
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    const ring = new THREE.Group();
    scene.add(ring);

    const list = [...POSTERS.filter(p => p.featured), ...POSTERS.filter(p => !p.featured)].slice(0, 10);
    const N = list.length;
    const R = 4.7;
    const H = 1.45;
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x1a1648 });
    const items = [];
    const hit = [];

    list.forEach((p, i) => {
      const w = H * p.ratio;
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, H + 0.1, 0.08), frameMat);
      frame.position.z = -0.05;
      const tex = makeTex();
      const img = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshBasicMaterial({ map: tex }));
      img.userData.i = i;
      g.add(frame, img);
      const a = (i / N) * Math.PI * 2;
      g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
      g.rotation.y = a; // front of each poster faces outward
      ring.add(g);
      items.push({ g, scale: 1, id: p.id, title: p.title });
      hit.push(img);
      loadImage(thumb(p.id)).then(im => setImage(tex, im));
    });

    // glowing floor ring
    const glow = new THREE.Mesh(new THREE.TorusGeometry(R + 0.35, 0.012, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    glow.rotation.x = Math.PI / 2;
    glow.position.y = -1.15;
    scene.add(glow);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(R + 1.6, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -1.16;
    scene.add(disc);

    fit(renderer, camera, canvas);
    addEventListener('resize', () => fit(renderer, camera, canvas));

    const ptr = pointerOn(canvas);
    let rot = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let moved = 0;
    let hovered = -1;

    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      vel = dx * 0.006;
      rot += vel;
    });
    const endDrag = () => {
      dragging = false;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('click', e => {
      if (moved > 6) return; // that was a drag, not a click
      const i = pickFrom(canvas, camera, hit, e.clientX, e.clientY);
      if (i >= 0) goCustomize(items[i].id);
    });

    const loop = makeLoop(() => {
      if (!dragging) {
        rot += vel + (hovered >= 0 ? 0.0006 : 0.0028); // slows down when you hover a poster
        vel *= 0.94;
      }
      ring.rotation.y = rot + scrollY * 0.0012;
      camera.position.set(ptr.x * 1.0, 2.3 + ptr.y * 0.5, 13);
      camera.lookAt(0, -0.1, 0);

      hovered = ptr.over && !dragging ? pickFrom(canvas, camera, hit, ptr.cx, ptr.cy) : -1;
      canvas.style.cursor = dragging ? 'grabbing' : hovered >= 0 ? 'pointer' : 'grab';
      if (hovered >= 0) showTip(items[hovered].title, ptr.cx, ptr.cy);
      else hideTip();
      items.forEach((o, i) => {
        o.scale += ((i === hovered ? 1.09 : 1) - o.scale) * 0.15;
        o.g.scale.setScalar(o.scale);
      });
      renderer.render(scene, camera);
    });
    whenVisible(heroSec, '100px 0px', loop.set);
  }

  /* ====================================================================
     2. TUNNEL: scroll to fly through every poster (dark scene)
     ==================================================================== */
  function initTunnel() {
    const canvas = document.getElementById('s3d');
    const renderer = makeRenderer(canvas, false);
    if (!renderer) {
      showSec.hidden = true;
      return;
    }
    const BG = 0x0b0a2a;
    renderer.setClearColor(BG, 1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 9, 36);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);

    const N = POSTERS.length;
    const STEP = 3.1;
    const RADIUS = 2.9;
    const FIRST_Z = -7;
    const H = 1.9;
    const posters = [];
    const clickable = [];
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });

    POSTERS.forEach((p, i) => {
      const w = H * p.ratio;
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, H + 0.14, 0.1), frameMat);
      frame.position.z = -0.06;
      const tex = makeTex();
      const img = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshBasicMaterial({ map: tex }));
      img.userData.i = i;
      g.add(frame, img);
      const a = 0.4 + i * 1.15;
      const x = Math.cos(a) * RADIUS;
      const y = Math.sin(a) * RADIUS * 0.7;
      g.position.set(x, y, FIRST_Z - i * STEP);
      g.rotation.set(y * 0.06, -x * 0.09, (i % 2 ? 1 : -1) * 0.04);
      scene.add(g);
      posters.push({ g, tex, baseY: y, baseZ: g.position.z, phase: i * 0.9, scale: 1 });
      clickable.push(img);
    });

    // line-art shapes (white) and a few solid lime ones drifting through the tunnel
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const geos = [
      new THREE.IcosahedronGeometry(0.8, 0),
      new THREE.OctahedronGeometry(0.8),
      new THREE.TorusGeometry(0.7, 0.28, 8, 20),
      new THREE.BoxGeometry(1, 1, 1)
    ];
    const decor = [];
    const DECOR = 12;
    for (let k = 0; k < DECOR; k++) {
      const geo = geos[k % geos.length];
      const holder = new THREE.Group();
      holder.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), lineMat));
      if (k % 3 === 0) {
        holder.add(
          new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: [0xc6ff3a, 0x7b6cff, 0x2335a8][k % 3 === 0 ? (k / 3) % 3 : 0], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }))
        );
      }
      const ang = k * 2.1 + 1;
      const rad = 1.5 + (k % 3) * 0.5;
      holder.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.8, FIRST_Z + 2 - k * ((N * STEP) / DECOR));
      scene.add(holder);
      decor.push({ g: holder, spin: (k % 2 ? 1 : -1) * (0.6 + (k % 4) * 0.2), phase: k });
    }

    let started = false;
    function loadAll() {
      if (started) return;
      started = true;
      POSTERS.forEach((p, i) => loadImage(bySize(p.id)).then(im => setImage(posters[i].tex, im)));
    }

    fit(renderer, camera, canvas);
    addEventListener('resize', () => fit(renderer, camera, canvas));

    const ptr = pointerOn(canvas);
    canvas.addEventListener('click', e => {
      const i = pickFrom(canvas, camera, clickable, e.clientX, e.clientY);
      if (i >= 0) goCustomize(POSTERS[i].id);
    });

    const copy = document.getElementById('s3d-copy');
    const now = document.getElementById('s3d-now');
    const fill = document.getElementById('s3d-fill');
    const Z_START = 5;
    const Z_END = FIRST_Z - (N - 1) * STEP + 4.5;
    let current = 0;
    let px = 0;
    let py = 0;
    let lastNearest = -1;
    let hovered = -1;

    function progress() {
      const r = showSec.getBoundingClientRect();
      const total = showSec.offsetHeight - innerHeight;
      return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    }

    const loop = makeLoop(t => {
      const time = t * 0.001;
      current += (progress() - current) * 0.08;
      px += (ptr.x - px) * 0.06;
      py += (ptr.y - py) * 0.06;
      const sx = Math.sin(current * Math.PI * 3) * 0.35 + px * 0.45;
      const sy = Math.cos(current * Math.PI * 2) * 0.25 + py * 0.3;
      camera.position.set(sx, sy, Z_START + (Z_END - Z_START) * current);
      camera.lookAt(sx * 0.35, sy * 0.35, camera.position.z - 10);
      camera.rotation.z += Math.sin(current * Math.PI * 2) * 0.08;

      hovered = ptr.over ? pickFrom(canvas, camera, clickable, ptr.cx, ptr.cy) : -1;
      canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
      if (hovered >= 0) showTip(POSTERS[hovered].title, ptr.cx, ptr.cy);
      else hideTip();

      posters.forEach((o, i) => {
        o.g.position.y = o.baseY + Math.sin(time * 0.8 + o.phase) * 0.08;
        o.scale += ((i === hovered ? 1.07 : 1) - o.scale) * 0.15;
        o.g.scale.setScalar(o.scale);
      });
      decor.forEach(d => {
        d.g.rotation.y = current * 10 * d.spin + d.phase;
        d.g.rotation.x = time * 0.2 * d.spin + d.phase;
      });

      let nearest = 0;
      let best = Infinity;
      posters.forEach((o, i) => {
        const d = Math.abs(camera.position.z - o.baseZ);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
      if (nearest !== lastNearest) {
        lastNearest = nearest;
        now.textContent = `${POSTERS[nearest].title} · ${nearest + 1}/${N}`;
      }
      fill.style.width = current * 100 + '%';
      copy.style.opacity = String(1 - clamp(current * 7, 0, 1));
      renderer.render(scene, camera);
    });
    whenVisible(showSec, '100px 0px', v => {
      if (v) fit(renderer, camera, canvas);
      loop.set(v);
    });
    whenVisible(showSec, '1200px 0px', v => v && loadAll());
  }

  /* ====================================================================
     3. SURFACES: four real 3D panels that catch the light
     ==================================================================== */
  function initSlabs() {
    const canvas = document.getElementById('slabs3d');
    const renderer = makeRenderer(canvas, true);
    if (!renderer) return slabSec.classList.add('no3d');
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    // a small studio "room" for the metal and acrylic to reflect
    function studioEnv() {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 512;
      const g = c.getContext('2d');
      const bg = g.createLinearGradient(0, 0, 0, 512);
      bg.addColorStop(0, '#2b2f38');
      bg.addColorStop(0.5, '#a8adb7');
      bg.addColorStop(1, '#23262d');
      g.fillStyle = bg;
      g.fillRect(0, 0, 1024, 512);
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.fillRect(120, 110, 320, 70);
      g.fillRect(580, 90, 380, 90);
      g.fillRect(360, 300, 280, 50);
      g.fillStyle = 'rgba(255,240,200,0.9)';
      g.fillRect(780, 280, 160, 40);
      const t = new THREE.CanvasTexture(c);
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.encoding = THREE.sRGBEncoding;
      const pm = new THREE.PMREMGenerator(renderer);
      const env = pm.fromEquirectangular(t).texture;
      pm.dispose();
      t.dispose();
      return env;
    }
    try {
      scene.environment = studioEnv();
    } catch (e) {
      /* without a reflection map the metals just look flatter */
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 4, 6);
    scene.add(key);

    // procedural textures: brushed metal lines and canvas weave
    function brushed() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = '#808080';
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) {
        const v = 90 + Math.random() * 120;
        g.strokeStyle = `rgba(${v},${v},${v},${0.1 + Math.random() * 0.25})`;
        g.lineWidth = 1;
        const y = Math.random() * 256;
        const x0 = Math.random() * 256;
        g.beginPath();
        g.moveTo(x0, y);
        g.lineTo(x0 + 40 + Math.random() * 200, y);
        g.stroke();
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
    function weave() {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          g.fillStyle = (x + y) % 2 ? '#bdbdbd' : '#5a5a5a';
          g.fillRect(x * 8, y * 8, 8, 8);
        }
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(26, 15);
      return t;
    }
    const brushedTex = brushed();
    const weaveTex = weave();

    // soft shadow under each panel
    function blob() {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      r.addColorStop(0, 'rgba(0,0,0,0.35)');
      r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const blobTex = blob();

    const posterTex = makeTex();
    let shownPoster = null;
    function syncPoster() {
      if (shownPoster === state.posterId) return;
      shownPoster = state.posterId;
      const id = shownPoster;
      loadImage(bySize(id)).then(im => {
        if (id === state.posterId) setImage(posterTex, im);
      });
    }

    const W = 2.7;
    const Hh = 1.52;
    const specs = {
      canvas: { T: 0.22 },
      'stainless-steel': { T: 0.05 },
      aluminum: { T: 0.09 },
      acrylic: { T: 0.2 }
    };
    function materialsFor(id) {
      const back = new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.9 });
      if (id === 'canvas') {
        const side = new THREE.MeshStandardMaterial({ color: 0xd9cfbd, roughness: 0.95 });
        const front = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.95, bumpMap: weaveTex, bumpScale: 0.8 });
        return [side, side, side, side, front, back];
      }
      if (id === 'stainless-steel') {
        const side = new THREE.MeshStandardMaterial({ color: 0xbfc4ca, metalness: 1, roughness: 0.3 });
        const front = new THREE.MeshStandardMaterial({ map: posterTex, metalness: 0.85, roughness: 0.3, bumpMap: brushedTex, bumpScale: 0.25, envMapIntensity: 1.4 });
        return [side, side, side, side, front, side];
      }
      if (id === 'aluminum') {
        const side = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.55 });
        const front = new THREE.MeshStandardMaterial({ map: posterTex, metalness: 0.1, roughness: 0.55 });
        return [side, side, side, side, front, side];
      }
      const side = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f0, transparent: true, opacity: 0.6, roughness: 0.1, clearcoat: 1 });
      const front = new THREE.MeshPhysicalMaterial({ map: posterTex, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
      return [side, side, side, side, front, back];
    }

    const slabs = [];
    const hit = [];
    MATERIALS.forEach((m, k) => {
      const T = (specs[m.id] || { T: 0.1 }).T;
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, T), materialsFor(m.id));
      mesh.userData.i = k;
      g.add(mesh);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(W * 1.25, 0.9),
        new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -Hh / 2 - 0.3;
      scene.add(shadow);
      scene.add(g);
      slabs.push({ g, shadow, id: m.id, name: m.name, scale: 1, lift: 0 });
      hit.push(mesh);
    });

    // lay the panels out in one row on wide screens, in a 2 x 2 grid on narrow ones
    function layout() {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 400;
      const aspect = w / h;
      const cols = aspect >= 1.8 ? 4 : 2;
      const rows = Math.ceil(slabs.length / cols);
      const gapX = 3.35;
      const gapY = 2.35;
      slabs.forEach((s, k) => {
        const c = k % cols;
        const r = Math.floor(k / cols);
        s.bx = (c - (cols - 1) / 2) * gapX;
        s.by = ((rows - 1) / 2 - r) * gapY;
        s.g.position.set(s.bx, s.by, 0);
        s.shadow.position.x = s.bx;
        s.shadow.position.z = 0;
        s.shadow.position.y = s.by - Hh / 2 - 0.3;
      });
      const needW = (cols - 1) * gapX + W + 0.8;
      const needH = (rows - 1) * gapY + Hh + 0.9;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      camera.position.set(0, 0.2, Math.max(needW / 2 / (t * aspect), needH / 2 / t) * 1.04);
    }
    function resize() {
      fit(renderer, camera, canvas);
      layout();
    }
    addEventListener('resize', resize);
    resize();

    const ptr = pointerOn(canvas);
    let hovered = -1;
    canvas.addEventListener('click', () => {
      if (hovered < 0) return;
      state.materialId = slabs[hovered].id;
      renderOptions();
      renderConfigurator();
      document.getElementById('customize').scrollIntoView({ behavior: 'smooth' });
    });
    document.addEventListener('configchange', syncPoster);
    syncPoster();

    const cards = () => [...document.querySelectorAll('#surfaces .surface-card')];
    const loop = makeLoop(t => {
      const time = t * 0.001;
      const r = canvas.getBoundingClientRect();
      const prog = clamp(1 - (r.bottom) / (innerHeight + r.height), 0, 1); // 0 = just entering, 1 = leaving
      key.position.set(ptr.x * 5, 3 + ptr.y * 2, 6);
      camera.lookAt(0, 0, 0);

      hovered = ptr.over ? pickFrom(canvas, camera, hit, ptr.cx, ptr.cy) : -1;
      canvas.style.cursor = hovered >= 0 ? 'pointer' : 'default';
      if (hovered >= 0) showTip(slabs[hovered].name, ptr.cx, ptr.cy);
      else hideTip();
      cards().forEach(c => c.classList.toggle('hot', hovered >= 0 && c.dataset.material === slabs[hovered].id));

      slabs.forEach((s, k) => {
        const selected = s.id === state.materialId;
        const targetScale = 1 + (hovered === k ? 0.07 : 0) + (selected ? 0.04 : 0);
        s.scale += (targetScale - s.scale) * 0.15;
        s.lift += (((hovered === k ? 0.12 : 0) + (selected ? 0.06 : 0)) - s.lift) * 0.15;
        s.g.scale.setScalar(s.scale);
        s.g.position.y = s.by + s.lift + Math.sin(time * 0.9 + k) * 0.04;
        s.g.rotation.y += (((prog - 0.5) * 0.9 + ptr.x * 0.55) - s.g.rotation.y) * 0.08;
        s.g.rotation.x += ((-ptr.y * 0.25) - s.g.rotation.x) * 0.08;
      });
      renderer.render(scene, camera);
    });
    whenVisible(slabSec, '100px 0px', loop.set);
  }

  initHero();
  initTunnel();
  initSlabs();
})();
