/* Two 3D sections:
   1. Space gallery: scroll to fly past the planets and space features, through stars and nebula clouds.
   2. Surfaces: real 3D panels (canvas, steel, aluminum, acrylic) that catch the light.
   Needs three.js (loaded from a CDN in index.html) and POSTERS / MATERIALS / state from script.js. */
(function () {
  'use strict';

  const showSec = document.getElementById('showcase');
  const slabSec = document.getElementById('surfaces-section');
  const tip = document.getElementById('s3d-tip');

  // Fall back to flat versions when 3D isn't possible (reduced motion, no three.js, no WebGL)
  function noThree() {
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
     1. SPACE GALLERY: scroll to fly past the planets and space features,
        through a starfield and drifting nebula clouds
     ==================================================================== */
  function initTunnel() {
    const canvas = document.getElementById('s3d');
    const renderer = makeRenderer(canvas, false);
    if (!renderer) {
      showSec.hidden = true;
      return;
    }
    const BG = 0x03030f;
    renderer.setClearColor(BG, 1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 12, 44);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);

    // only the space posters: the planets, the Moon and the Sun
    const gallery = POSTERS.filter(p => p.category === 'Space');
    const N = gallery.length;
    const STEP = 3.4;
    const RADIUS = 2.9;
    const FIRST_Z = -7;
    const H = 1.9;
    const posters = [];
    const clickable = [];
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });

    gallery.forEach((p, i) => {
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

    /* ----- stars ----- */
    function dotTex() {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(0.25, 'rgba(255,255,255,0.85)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const dot = dotTex();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tints = [
      [1, 1, 1],
      [0.74, 0.85, 1],
      [1, 0.9, 0.76],
      [0.86, 0.8, 1]
    ];
    const Z_NEAR = 20;
    const Z_FAR = -150;
    function makeStars(count, px, minBright) {
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() * 2 - 1) * 80;
        pos[i * 3 + 1] = (Math.random() * 2 - 1) * 55;
        pos[i * 3 + 2] = Z_FAR + Math.random() * (Z_NEAR - Z_FAR);
        const t = tints[(Math.random() * tints.length) | 0];
        const b = minBright + Math.random() * (1 - minBright);
        col[i * 3] = t[0] * b;
        col[i * 3 + 1] = t[1] * b;
        col[i * 3 + 2] = t[2] * b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size: px * dpr,
        map: dot,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false,
        fog: false
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      scene.add(pts);
      return pts;
    }
    makeStars(2600, 2.2, 0.35); // fine dust
    const midStars = makeStars(700, 3.6, 0.55);
    const brightStars = makeStars(110, 6, 0.8); // the few that twinkle

    /* ----- nebula clouds ----- */
    function nebulaTex(colors) {
      const S = 256;
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.pow(Math.random(), 0.8) * 78;
        const x = S / 2 + Math.cos(a) * d;
        const y = S / 2 + Math.sin(a) * d * 0.72;
        const r = 26 + Math.random() * 52;
        const col = colors[(Math.random() * colors.length) | 0];
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${col},0.17)`);
        gr.addColorStop(0.5, `rgba(${col},0.07)`);
        gr.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, S, S);
      }
      // fade to nothing at the edges so no square outline shows
      g.globalCompositeOperation = 'destination-in';
      const m = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      m.addColorStop(0, 'rgba(0,0,0,1)');
      m.addColorStop(0.6, 'rgba(0,0,0,0.75)');
      m.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = m;
      g.fillRect(0, 0, S, S);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      return t;
    }
    const palettes = [
      ['120,80,255', '70,120,255'], // violet and blue
      ['236,72,153', '160,90,255'], // magenta and violet
      ['40,190,200', '60,120,255'], // teal and blue
      ['255,120,90', '236,72,153'] // a warm, rarer one
    ];
    const nebTex = palettes.map(nebulaTex);
    const nebulae = [];
    function addNebula(parent, x, y, z, size, opacity, pal) {
      const mat = new THREE.SpriteMaterial({
        map: nebTex[pal % nebTex.length],
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      mat.rotation = Math.random() * Math.PI * 2;
      const sp = new THREE.Sprite(mat);
      sp.position.set(x, y, z);
      sp.scale.set(size, size * 0.8, 1);
      parent.add(sp);
      nebulae.push({ mat, spin: (Math.random() < 0.5 ? -1 : 1) * (0.004 + Math.random() * 0.008) });
    }
    // clouds beside the flight path, so you drift past them
    const SPAN = N * STEP + 40;
    for (let k = 0; k < 10; k++) {
      const side = k % 2 ? 1 : -1;
      addNebula(
        scene,
        side * (17 + Math.random() * 16),
        (Math.random() * 2 - 1) * 14,
        10 - (k / 9) * (SPAN + 30),
        34 + Math.random() * 30,
        0.38 + Math.random() * 0.22,
        k
      );
    }
    // big clouds that travel with the camera, so the backdrop is never empty
    const backdrop = new THREE.Group();
    scene.add(backdrop);
    [
      [-36, 16, -120, 150, 0.55, 0],
      [34, -10, -125, 160, 0.5, 1],
      [4, 24, -140, 170, 0.4, 2],
      [-20, -26, -135, 140, 0.42, 3],
      [48, 22, -130, 120, 0.4, 2]
    ].forEach(n => addNebula(backdrop, n[0], n[1], n[2], n[3], n[4], n[5]));

    let started = false;
    function loadAll() {
      if (started) return;
      started = true;
      gallery.forEach((p, i) => loadImage(bySize(p.id)).then(im => setImage(posters[i].tex, im)));
    }

    fit(renderer, camera, canvas);
    addEventListener('resize', () => fit(renderer, camera, canvas));

    const ptr = pointerOn(canvas);
    canvas.addEventListener('click', e => {
      const i = pickFrom(canvas, camera, clickable, e.clientX, e.clientY);
      if (i >= 0) goCustomize(gallery[i].id);
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

      // the backdrop clouds follow the camera, with a slight parallax shift
      backdrop.position.set(camera.position.x * 0.9, camera.position.y * 0.9, camera.position.z);
      nebulae.forEach(n => (n.mat.rotation += n.spin * 0.016));
      midStars.material.opacity = 0.8 + Math.sin(time * 1.3) * 0.2;
      brightStars.material.opacity = 0.7 + Math.sin(time * 2.1 + 1.7) * 0.3;

      hovered = ptr.over ? pickFrom(canvas, camera, clickable, ptr.cx, ptr.cy) : -1;
      canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
      if (hovered >= 0) showTip(gallery[hovered].title, ptr.cx, ptr.cy);
      else hideTip();

      posters.forEach((o, i) => {
        o.g.position.y = o.baseY + Math.sin(time * 0.8 + o.phase) * 0.08;
        o.scale += ((i === hovered ? 1.07 : 1) - o.scale) * 0.15;
        o.g.scale.setScalar(o.scale);
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
        now.textContent = `${gallery[nearest].title} · ${nearest + 1}/${N}`;
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
     2. SURFACES: four real 3D panels that catch the light
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

    // procedural texture: canvas weave
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
        const front = new THREE.MeshStandardMaterial({ map: posterTex, metalness: 0.85, roughness: 0.28, envMapIntensity: 1.4 });
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

  initTunnel();
  initSlabs();
})();
