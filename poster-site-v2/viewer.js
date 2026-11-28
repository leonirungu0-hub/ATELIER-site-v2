/* Product viewer for the customizer.
   Views (left rail): 3D poster you can drag, an exploded "Layers" view with numbered hotspots,
   and four illustrated rooms where the poster hangs at its real size.
   Also: wishlist heart, zoom lightbox with a loupe.
   Needs script.js (state, POSTERS, MATERIALS, SIZES, helpers) and, for 3D, three.js. */
(function () {
  'use strict';

  const root = document.getElementById('stage');
  if (!root || typeof state === 'undefined' || typeof POSTERS === 'undefined') return;

  const q = s => root.querySelector(s);
  const main = q('#v-main');
  const canvas = q('#v3d');
  const tabs = q('#v-tabs');
  const roomEl = q('#v-room');
  const hotsEl = q('#v-hots');
  const card = q('#v-card');
  const discover = q('#v-discover');
  const discoverText = q('#v-discover-text');
  const wishBtn = q('#viewer-wish');
  const zoomBtn = q('#v-zoom-btn');
  const label = q('#stage-label');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  const poster = () => find(POSTERS, state.posterId);
  const material = () => find(MATERIALS, state.materialId);
  const sizeOpt = () => find(SIZES, state.sizeId);
  const imgUrl = p => (innerWidth < 700 ? thumbSrc(p) : fullSrc(p));

  /* ====================================================================
     ROOMS: small illustrated scenes (viewBox 1600 x 1100). "ppc" is how many
     scene units one centimetre takes up, so the poster is drawn to scale.
     ==================================================================== */
  const gradV = (id, a, b) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const glow = (id, c, o) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const blur = (id, n) =>
    `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n}"/></filter>`;
  function books(x, base, n, seed) {
    const cols = ['#e4572e', '#f2c14e', '#7b6cff', '#4fd66b', '#eeeeee', '#2e9cca', '#c6ff3a'];
    let out = '';
    let cx = x;
    let s = seed * 977;
    for (let i = 0; i < n; i++) {
      s = (s * 9301 + 49297) % 233280;
      const w = 20 + (s % 14);
      const h = 66 + (Math.floor(s / 8) % 48);
      out += `<rect x="${cx}" y="${base - h}" width="${w}" height="${h}" fill="${cols[(i + seed) % cols.length]}"/>`;
      cx += w + 2;
    }
    return out;
  }

  const ROOMS = [
    {
      name: 'Living room',
      short: 'Living',
      cx: 800,
      cy: 405,
      ppc: 3.6,
      maxH: 300,
      ref: 'the sofa is 220 cm wide',
      draw: u => `
<defs>${gradV('w' + u, '#f1e6d3', '#dccaa9')}${gradV('f' + u, '#b98a5a', '#8f6640')}
${glow('g' + u, '#fff3c4', 0.8)}${blur('b' + u, 16)}</defs>
<rect width="1600" height="800" fill="url(#w${u})"/>
<polygon points="1060,0 1420,0 1600,250 1600,770 1260,770" fill="#fff" opacity=".22" filter="url(#b${u})"/>
<rect y="768" width="1600" height="32" fill="#f7f0e2"/>
<rect y="800" width="1600" height="300" fill="url(#f${u})"/>
<path d="M0 846H1600M0 902H1600M0 968H1600M0 1044H1600" stroke="#000" stroke-opacity=".08"/>
<rect x="380" y="900" width="840" height="170" rx="12" fill="#efe4d0"/>
<rect x="404" y="920" width="792" height="130" rx="6" fill="none" stroke="#c9a97a" stroke-width="4"/>
<path d="M180 700h100l-18 100h-64z" fill="#b5634a"/>
<g fill="#3f7d52"><ellipse cx="230" cy="620" rx="26" ry="86" transform="rotate(-18 230 700)"/><ellipse cx="230" cy="610" rx="26" ry="92" transform="rotate(14 230 700)"/><ellipse cx="228" cy="590" rx="22" ry="80"/><ellipse cx="208" cy="640" rx="20" ry="70" transform="rotate(-40 230 700)" fill="#34694a"/><ellipse cx="256" cy="636" rx="20" ry="70" transform="rotate(38 230 700)" fill="#34694a"/></g>
<ellipse cx="800" cy="806" rx="410" ry="16" fill="#000" opacity=".18"/>
<rect x="430" y="585" width="740" height="170" rx="42" fill="#2e5a4e"/>
<rect x="395" y="640" width="76" height="150" rx="30" fill="#2a5247"/>
<rect x="1129" y="640" width="76" height="150" rx="30" fill="#2a5247"/>
<rect x="420" y="676" width="760" height="104" rx="26" fill="#3a6e5f"/>
<rect x="466" y="622" width="300" height="106" rx="26" fill="#43806e"/>
<rect x="834" y="622" width="300" height="106" rx="26" fill="#43806e"/>
<rect x="446" y="780" width="14" height="22" fill="#3b2a1d"/><rect x="1140" y="780" width="14" height="22" fill="#3b2a1d"/>
<rect x="1018" y="636" width="112" height="104" rx="22" fill="#e0a33a" transform="rotate(-9 1074 688)"/>
<circle cx="1336" cy="400" r="190" fill="url(#g${u})"/>
<rect x="1332" y="430" width="8" height="372" fill="#2b2b2b"/>
<ellipse cx="1336" cy="802" rx="40" ry="8" fill="#2b2b2b"/>
<path d="M1280 340h112l-26 92h-60z" fill="#f6e6bb"/>
<rect x="650" y="940" width="300" height="16" rx="6" fill="#6b4a31"/><rect x="670" y="956" width="12" height="50" fill="#5a3d28"/><rect x="918" y="956" width="12" height="50" fill="#5a3d28"/>
<rect x="700" y="918" width="110" height="22" rx="3" fill="#d9d1c0"/><rect x="712" y="900" width="86" height="18" rx="3" fill="#c76b4a"/>
<rect x="866" y="906" width="40" height="34" rx="6" fill="#f4efe4"/>
<rect width="1600" height="220" fill="#000" opacity=".1"/>`
    },
    {
      name: 'Study',
      short: 'Study',
      cx: 930,
      cy: 385,
      ppc: 3.4,
      maxH: 280,
      ref: 'the bookcase is 2 m tall',
      draw: u => `
<defs>${gradV('w' + u, '#2a3382', '#181d52')}${gradV('f' + u, '#14173f', '#0a0c2b')}${gradV('s' + u, '#4a5be0', '#7b6cff')}
${glow('g' + u, '#ffe7a3', 0.7)}</defs>
<rect width="1600" height="800" fill="url(#w${u})"/>
<rect y="768" width="1600" height="32" fill="#0f1237"/>
<rect y="800" width="1600" height="300" fill="url(#f${u})"/>
<rect x="470" y="920" width="900" height="140" rx="10" fill="#1f2468"/>
<path d="M500 950H1340M500 990H1340M500 1030H1340" stroke="#c6ff3a" stroke-opacity=".25" stroke-width="3"/>
<rect x="110" y="130" width="340" height="672" fill="#5a3b28"/>
<rect x="124" y="144" width="312" height="644" fill="#2a1d15"/>
<rect x="124" y="298" width="312" height="12" fill="#6a4630"/><rect x="124" y="458" width="312" height="12" fill="#6a4630"/><rect x="124" y="618" width="312" height="12" fill="#6a4630"/><rect x="124" y="776" width="312" height="12" fill="#6a4630"/>
${books(138, 298, 8, 1)}${books(138, 458, 7, 2)}${books(138, 618, 8, 3)}${books(138, 776, 7, 4)}
<ellipse cx="1000" cy="652" rx="200" ry="150" fill="url(#g${u})"/>
<rect x="520" y="770" width="980" height="28" rx="5" fill="#c58f55"/>
<rect x="548" y="798" width="20" height="302" fill="#a8763f"/><rect x="1452" y="798" width="20" height="302" fill="#a8763f"/>
<rect x="1180" y="798" width="260" height="190" rx="4" fill="#b58049"/>
<path d="M1190 862H1430" stroke="#8d6032" stroke-width="3"/><rect x="1290" y="826" width="40" height="8" rx="4" fill="#e9d2a8"/><rect x="1290" y="900" width="40" height="8" rx="4" fill="#e9d2a8"/>
<rect x="750" y="752" width="290" height="18" rx="5" fill="#b6bcc6"/>
<rect x="778" y="610" width="234" height="144" rx="9" fill="#12141c"/>
<rect x="788" y="620" width="214" height="124" rx="4" fill="url(#s${u})"/>
<rect x="1100" y="724" width="40" height="46" rx="7" fill="#f3efe5"/>
<path d="M1140 736h10a10 10 0 0 1 0 22h-10" fill="none" stroke="#f3efe5" stroke-width="6"/>
<path d="M600 770 640 650 720 618" fill="none" stroke="#e9ecef" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M700 604l64 20-14 28z" fill="#e9ecef"/>
<path d="M1210 744h50l-6 26h-38z" fill="#d6c3a0"/>
<g fill="#4fd66b"><ellipse cx="1226" cy="716" rx="10" ry="30" transform="rotate(-20 1235 744)"/><ellipse cx="1244" cy="710" rx="10" ry="34" transform="rotate(8 1235 744)"/><ellipse cx="1260" cy="718" rx="9" ry="28" transform="rotate(28 1235 744)" fill="#3fb85a"/></g>
<rect width="1600" height="200" fill="#000" opacity=".14"/>`
    },
    {
      name: 'Loft',
      short: 'Loft',
      cx: 800,
      cy: 395,
      ppc: 3.8,
      maxH: 300,
      ref: 'the credenza is 205 cm wide',
      draw: u => `
<defs>
<pattern id="br${u}" width="140" height="64" patternUnits="userSpaceOnUse"><rect width="140" height="64" fill="#a85540"/><rect x="72" y="2" width="66" height="28" fill="#b3604a"/><rect x="37" y="34" width="66" height="28" fill="#9d4b37"/><rect x="2" y="2" width="66" height="28" fill="#ad5942"/><path d="M0 0H140M0 32H140M0 0V32M70 0V32M35 32V64M105 32V64" stroke="#d9b8a4" stroke-width="4" fill="none"/></pattern>
<radialGradient id="vg${u}" cx=".5" cy=".4" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
${gradV('f' + u, '#8a8c93', '#666870')}${glow('g' + u, '#ffd98a', 0.85)}</defs>
<rect width="1600" height="800" fill="url(#br${u})"/>
<rect width="1600" height="800" fill="url(#vg${u})"/>
<rect y="800" width="1600" height="300" fill="url(#f${u})"/>
<rect y="790" width="1600" height="14" fill="#3b3c42"/>
<circle cx="1230" cy="330" r="270" fill="url(#g${u})"/>
<path d="M1230 0V236" stroke="#111" stroke-width="4"/>
<path d="M1166 304A64 64 0 0 1 1294 304Z" fill="#1a1a1a"/>
<circle cx="1230" cy="312" r="15" fill="#ffe9a8"/>
<rect x="470" y="930" width="660" height="120" rx="8" fill="#3a3c44"/>
<rect x="110" y="610" width="230" height="170" rx="40" fill="#8a4b2a"/>
<rect x="92" y="690" width="266" height="100" rx="30" fill="#9c5a34"/>
<rect x="120" y="786" width="12" height="22" fill="#2a1a10"/><rect x="318" y="786" width="12" height="22" fill="#2a1a10"/>
<ellipse cx="800" cy="808" rx="410" ry="14" fill="#000" opacity=".28"/>
<rect x="410" y="640" width="780" height="146" rx="6" fill="#6b4429"/>
<path d="M670 650V776M930 650V776" stroke="#4a2d19" stroke-width="3"/>
<rect x="640" y="700" width="14" height="40" rx="5" fill="#e6c27a"/><rect x="686" y="700" width="14" height="40" rx="5" fill="#e6c27a"/><rect x="900" y="700" width="14" height="40" rx="5" fill="#e6c27a"/><rect x="946" y="700" width="14" height="40" rx="5" fill="#e6c27a"/>
<rect x="440" y="786" width="12" height="24" fill="#2a1a10"/><rect x="1148" y="786" width="12" height="24" fill="#2a1a10"/>
<path d="M520 640c-24-32-24-64 0-74h22c24 10 24 42 0 74z" fill="#e8d7b8"/>
<path d="M530 570c-8-40-26-70-40-86M534 570c4-44 18-76 40-96" stroke="#4f7a3c" stroke-width="5" fill="none"/>
<rect x="930" y="616" width="130" height="24" fill="#3a6ea8"/><rect x="942" y="594" width="106" height="22" fill="#f2c14e"/>
<path d="M1380 700h90l-14 100h-62z" fill="#d6c3a0"/>
<g fill="#3a7a4a"><ellipse cx="1400" cy="590" rx="30" ry="100" transform="rotate(-24 1425 700)"/><ellipse cx="1440" cy="560" rx="30" ry="110" transform="rotate(10 1425 700)"/><ellipse cx="1470" cy="600" rx="26" ry="96" transform="rotate(34 1425 700)" fill="#2f6a3e"/></g>`
    },
    {
      name: 'Bedroom',
      short: 'Bedroom',
      cx: 800,
      cy: 300,
      ppc: 3.4,
      maxH: 260,
      ref: 'the bedside tables are 38 cm wide',
      draw: u => `
<defs>${gradV('w' + u, '#d3dccd', '#b9c6b4')}${gradV('f' + u, '#d1b48b', '#b4946a')}${glow('g' + u, '#fff0c2', 0.8)}${blur('b' + u, 18)}</defs>
<rect width="1600" height="800" fill="url(#w${u})"/>
<polygon points="0,60 260,0 520,0 380,770 0,770" fill="#fff" opacity=".2" filter="url(#b${u})"/>
<rect y="768" width="1600" height="32" fill="#eef1e8"/>
<rect y="800" width="1600" height="300" fill="url(#f${u})"/>
<path d="M0 850H1600M0 910H1600M0 980H1600M0 1060H1600" stroke="#000" stroke-opacity=".07"/>
<rect x="300" y="900" width="1000" height="170" rx="14" fill="#e8e1d1"/>
<rect x="322" y="920" width="956" height="130" rx="8" fill="none" stroke="#b9a98a" stroke-width="4"/>
<rect x="380" y="470" width="840" height="330" rx="34" fill="#8d725c"/>
<path d="M520 490V640M680 490V640M840 490V640M1000 490V640M1160 490V640" stroke="#7a6049" stroke-width="3"/>
<rect x="345" y="650" width="910" height="170" rx="28" fill="#f6f2ea"/>
<rect x="440" y="570" width="310" height="104" rx="46" fill="#e9eef0"/>
<rect x="850" y="570" width="310" height="104" rx="46" fill="#e9eef0"/>
<rect x="470" y="600" width="260" height="92" rx="42" fill="#fff"/>
<rect x="870" y="600" width="260" height="92" rx="42" fill="#fff"/>
<rect x="345" y="708" width="910" height="26" fill="#e7e1d4"/>
<rect x="345" y="745" width="910" height="66" rx="18" fill="#c9794a"/>
<rect x="190" y="690" width="130" height="112" rx="8" fill="#a98763"/><path d="M200 744H310" stroke="#8c6d4b" stroke-width="3"/>
<rect x="1280" y="690" width="130" height="112" rx="8" fill="#a98763"/><path d="M1290 744H1400" stroke="#8c6d4b" stroke-width="3"/>
<circle cx="255" cy="610" r="120" fill="url(#g${u})"/><circle cx="1345" cy="610" r="120" fill="url(#g${u})"/>
<path d="M222 570h66l-12 72h-42z" fill="#f6e3b6"/><rect x="252" y="642" width="6" height="48" fill="#444"/>
<path d="M1312 570h66l-12 72h-42z" fill="#f6e3b6"/><rect x="1342" y="642" width="6" height="48" fill="#444"/>
<rect width="1600" height="200" fill="#000" opacity=".08"/>`
    }
  ];

  function posterBox(room) {
    const p = poster();
    const s = sizeOpt();
    let w = s.width * room.ppc;
    let h = w / p.ratio;
    if (h > room.maxH) {
      h = room.maxH;
      w = h * p.ratio;
    }
    return { x: room.cx - w / 2, y: room.cy - h / 2, w, h };
  }

  function roomSvg(i, u, withPoster) {
    const r = ROOMS[i];
    let inner = r.draw(u);
    if (withPoster) {
      const b = posterBox(r);
      inner +=
        `<rect x="${b.x + 6}" y="${b.y + 12}" width="${b.w}" height="${b.h}" fill="#000" opacity=".28"/>` +
        `<image href="${thumbSrc(poster())}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid slice"/>`;
    }
    return `<svg class="v-svg" viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${inner}</svg>`;
  }

  /* ====================================================================
     VIEWS + THUMBNAIL RAIL
     ==================================================================== */
  const LAYERS_ICON =
    '<svg viewBox="0 0 64 48" class="vt-icon" aria-hidden="true" focusable="false">' +
    '<path d="M32 22 58 32 32 42 6 32Z" fill="#fff" opacity=".85"/>' +
    '<path d="M32 13 58 23 32 33 6 23Z" fill="#7b6cff"/>' +
    '<path d="M32 4 58 14 32 24 6 14Z" fill="#c6ff3a"/></svg>';

  const VIEWS = [
    { id: 'orbit', name: '3D view', label: '3D' },
    { id: 'layers', name: 'See the layers', label: 'Layers' },
    ...ROOMS.map((r, i) => ({ id: 'room-' + i, name: r.name + ' preview', label: r.short, room: i }))
  ];
  let view = 'orbit';
  let roomIndex = 0;
  let has3d = false;

  VIEWS.forEach(v => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'v-tab';
    b.setAttribute('role', 'tab');
    b.dataset.view = v.id;
    b.setAttribute('aria-label', v.name);
    b.innerHTML = `<span class="v-thumb"></span><span class="v-tab-name">${v.label}</span>`;
    tabs.appendChild(b);
  });

  function thumbHtml(v) {
    if (v.id === 'orbit') return `<img class="vt-poster" src="${thumbSrc(poster())}" alt="">`;
    if (v.id === 'layers') return LAYERS_ICON;
    return roomSvg(v.room, 't' + v.room, true);
  }
  function updateThumbs() {
    $$('.v-tab', tabs).forEach((b, i) => {
      const slot = b.querySelector('.v-thumb');
      const html = thumbHtml(VIEWS[i]);
      if (slot.dataset.html !== html) {
        slot.innerHTML = html;
        slot.dataset.html = html;
      }
    });
  }

  /* ====================================================================
     ROOM VIEW
     ==================================================================== */
  let art = null;
  function renderRoom(rebuild) {
    const r = ROOMS[roomIndex];
    if (rebuild || !art) {
      roomEl.innerHTML =
        `<div class="v-room-scene">${roomSvg(roomIndex, 'm', false)}` +
        `<div class="v-art frame ${state.materialId}"><img alt=""></div></div>`;
      art = roomEl.querySelector('.v-art');
    }
    const p = poster();
    const b = posterBox(r);
    art.className = `v-art frame ${material().id}`;
    art.style.left = (b.x / 1600) * 100 + '%';
    art.style.top = (b.y / 1100) * 100 + '%';
    art.style.width = (b.w / 1600) * 100 + '%';
    art.style.aspectRatio = String(b.w / b.h);
    const im = art.querySelector('img');
    const url = fullSrc(p);
    if (im.getAttribute('src') !== url) im.src = url;
    im.alt = `${p.title} poster on a wall, shown to scale`;
    label.textContent = `${material().name} · ${dims(sizeOpt(), p)} · to scale, ${r.ref}`;
  }
  roomEl.addEventListener('pointermove', e => {
    if (!art) return;
    const rect = roomEl.getBoundingClientRect();
    art.style.setProperty('--sheen', `${100 - ((e.clientX - rect.left) / rect.width) * 100}%`);
  });

  /* ====================================================================
     3D: assembled poster <-> exploded layers, with hotspots
     ==================================================================== */
  const HOT = {
    canvas: [
      ['Archival pigment ink', 'Fade-resistant pigment inks go straight onto the canvas, so colours stay deep for decades.'],
      ['Woven texture', 'A fine cotton-poly weave catches light softly. No glare, so it looks good from any angle.'],
      ['Gallery wrap', 'The image carries on around a 4 cm edge, so it hangs beautifully with no frame.'],
      ['Pine stretcher frame', 'Kiln-dried pine keeps the canvas drum-tight and flat, year after year.'],
      ['Sawtooth hanger', 'Pre-fitted and ready to go. One nail, a quick level, and it is up.']
    ],
    'stainless-steel': [
      ['Direct-to-metal print', 'UV-cured inks are printed straight onto brushed steel, with the highlights left to shimmer.'],
      ['Satin metal finish', 'A smooth satin surface catches the light and shifts as you move past it.'],
      ['1.5 mm steel edge', 'Slim, crisp and deburred, with rounded corners that are safe to handle.'],
      ['Magnet sheet', 'A flexible magnetic backing holds the poster flat and secure on its wall plate.'],
      ['Wall plate', 'Fix the plate, snap the poster on, and lift it off any time. No drilling into the picture.']
    ],
    aluminum: [
      ['UV-cured matte print', 'Colour is bonded to the panel for crisp detail and a calm, gallery-style matte finish.'],
      ['Satin matte surface', 'Low reflection keeps the picture clear under windows and bright lights.'],
      ['3 mm composite edge', 'Aluminum skins around a solid core give razor-straight edges and a clean profile.'],
      ['Rigid core', 'A lightweight polyethylene core keeps the panel flat and stable in any room.'],
      ['Hidden subframe', 'Rails on the back float the panel about 2 cm off the wall. The fixings never show.']
    ],
    acrylic: [
      ['Face-mounted print', 'The photo is printed on archival paper and sealed behind the acrylic, with no air or dust between.'],
      ['Gloss depth', 'Crystal-clear acrylic deepens the blacks and makes every colour glow.'],
      ['5 mm polished edge', 'Diamond-polished edges catch the light like glass.'],
      ['White backing', 'A solid white backing keeps colours bright and the whole piece rigid.'],
      ['Stand-off mounts', 'Chrome stand-offs hold the panel a few centimetres off the wall for a floating look.']
    ]
  };
  const GAP = 1.4;
  const EX_X = [1.0, -0.2, -2.35];
  const ORBIT = { r: 5.8, a: 0, y: 0.05, look: [0, 0, 0], yaw: -0.28, pitch: 0.04 };
  const LAYERS = { r: 9.2, a: 0, y: 0.4, look: [-0.45, 0, -0.1], yaw: -0.22, pitch: 0.1 };

  let renderer, scene, camera, rig, key, posterTex, weaveTex, hexTex;
  const layers = [];
  let hs = [];
  let zBase = [0, 0, 0];
  let sx = 1;
  let builtKey = '';
  let loadedFor = '';

  // easing state
  let ex = 0;
  let exT = 0;
  let yaw = ORBIT.yaw;
  let yawT = ORBIT.yaw;
  let pitch = ORBIT.pitch;
  let pitchT = ORBIT.pitch;
  let vel = 0;
  let dragging = false;
  let lastInput = performance.now();
  let swayAmt = 0;
  let focus = -1;
  let visible = false;
  const cam = { r: ORBIT.r, a: 0, y: ORBIT.y };
  const camT = { r: ORBIT.r, a: 0, y: ORBIT.y };
  let look;
  let lookT;

  const zAt = (i, e) => zBase[i] + e * GAP * (1 - i);
  const toCyl = (x, y, z) => ({ r: Math.hypot(x, z), a: Math.atan2(x, z), y });

  function initThree() {
    if (typeof THREE === 'undefined') return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, 1.45, 0.1, 80);
    rig = new THREE.Group();
    scene.add(rig);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(2, 3, 6);
    scene.add(key);
    const back = new THREE.DirectionalLight(0xffffff, 0.8); // lights the back when the camera flies round
    back.position.set(-4, 3, -6);
    scene.add(back);
    look = new THREE.Vector3(0, 0, 0);
    lookT = new THREE.Vector3(0, 0, 0);
    try {
      scene.environment = studioEnv();
    } catch (e) {
      /* without a reflection map the metals just look flatter */
    }
    weaveTex = makeWeave();
    hexTex = makeHex();
    posterTex = new THREE.Texture();
    posterTex.encoding = THREE.sRGBEncoding;
    posterTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return true;
  }

  function studioEnv() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#59608a');
    bg.addColorStop(0.5, '#2c3050');
    bg.addColorStop(1, '#15172c');
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 512);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(120, 110, 320, 70);
    g.fillRect(580, 90, 380, 90);
    g.fillRect(360, 300, 280, 50);
    g.fillStyle = 'rgba(214,255,120,0.8)';
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
  function makeWeave() {
    // fine pre-tiled weave: a bump map shares the poster's UVs in three.js r128, so it can't use .repeat
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        g.fillStyle = (x + y) % 2 ? '#bdbdbd' : '#5a5a5a';
        g.fillRect(x * 4, y * 4, 4, 4);
      }
    }
    return new THREE.CanvasTexture(c);
  }
  function makeHex() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#e7e9ea';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#b4babe';
    g.lineWidth = 3;
    const r = 16;
    const h = Math.sqrt(3) * r;
    for (let row = -1; row < 6; row++) {
      for (let col = -1; col < 6; col++) {
        const cx = col * r * 3 + (row % 2 ? r * 1.5 : 0);
        const cy = row * h * 0.5;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k;
          const px = cx + r * Math.cos(a);
          const py = cy + r * Math.sin(a);
          if (k) g.lineTo(px, py);
          else g.moveTo(px, py);
        }
        g.closePath();
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  const std = (color, rough, metal) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal || 0 });
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  const pin = (r, len, mat) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24), mat);
    m.rotation.x = Math.PI / 2;
    return m;
  };

  function faceMats(id) {
    const back = std(0xe9e3d6, 0.9);
    if (id === 'canvas') {
      const side = std(0xd9cfbd, 0.95);
      const front = new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.95, bumpMap: weaveTex, bumpScale: 0.5 });
      return [side, side, side, side, front, back];
    }
    if (id === 'stainless-steel') {
      const side = std(0xbfc4ca, 0.3, 1);
      const front = new THREE.MeshStandardMaterial({ map: posterTex, metalness: 0.85, roughness: 0.28, envMapIntensity: 1.4 });
      return [side, side, side, side, front, side];
    }
    if (id === 'aluminum') {
      const side = std(0xf1f1ee, 0.55);
      const front = new THREE.MeshStandardMaterial({ map: posterTex, metalness: 0.1, roughness: 0.55 });
      return [side, side, side, side, front, side];
    }
    const side = new THREE.MeshPhysicalMaterial({ color: 0xcfe9f0, transparent: true, opacity: 0.6, roughness: 0.1, clearcoat: 1 });
    const front = new THREE.MeshPhysicalMaterial({ map: posterTex, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
    return [side, side, side, side, front, back];
  }

  function disposeNode(o) {
    o.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose());
    });
  }

  function build() {
    layers.splice(0).forEach(g => {
      rig.remove(g);
      disposeNode(g);
    });
    const p = poster();
    const id = state.materialId;
    let W = 3.4;
    let H = W / p.ratio;
    if (H > 2.35) {
      H = 2.35;
      W = H * p.ratio;
    }
    sx = W / 3.4;
    hexTex.repeat.set(W * 2.2, H * 2.2);

    const L = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
    let Tp, Tc, Tm, coreX, mountHot;
    if (id === 'canvas') {
      Tp = 0.2;
      Tc = 0.16;
      Tm = 0.05;
      L[0].add(box(W, H, Tp, faceMats(id)));
      const wood = std(0xc9a46a, 0.8);
      const bw = 0.14;
      const bar = (w, h, x, y) => {
        const b = box(w, h, Tc, wood);
        b.position.set(x, y, 0);
        L[1].add(b);
      };
      bar(W * 0.94, bw, 0, H * 0.47 - bw / 2);
      bar(W * 0.94, bw, 0, -(H * 0.47 - bw / 2));
      bar(bw, H * 0.94 - 2 * bw, -(W * 0.47 - bw / 2), 0);
      bar(bw, H * 0.94 - 2 * bw, W * 0.47 - bw / 2, 0);
      const plate = box(0.9, 0.09, Tm, std(0xaab0b8, 0.35, 0.9));
      plate.position.set(0, H * 0.3, 0);
      L[2].add(plate);
      [-0.34, 0.34].forEach(x => {
        const s = pin(0.035, Tm + 0.02, std(0x333840, 0.5, 0.6));
        s.position.set(x, H * 0.3, 0);
        L[2].add(s);
      });
      coreX = -(W * 0.47 - bw / 2);
      mountHot = [0, H * 0.3];
    } else if (id === 'stainless-steel') {
      Tp = 0.05;
      Tc = 0.025;
      Tm = 0.05;
      L[0].add(box(W, H, Tp, faceMats(id)));
      L[1].add(box(W * 0.96, H * 0.96, Tc, std(0x14161b, 0.55, 0.25)));
      const mw = Math.min(W * 0.45, 1.5);
      const mh = Math.min(H * 0.55, 1.0);
      L[2].add(box(mw, mh, Tm, std(0x9ea4ac, 0.35, 1)));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const m = pin(0.1, Tm + 0.03, std(0x15171c, 0.5, 0.3));
        m.position.set(a * mw * 0.32, b * mh * 0.3, 0);
        L[2].add(m);
      });
      coreX = -W * 0.38;
      mountHot = [-mw * 0.32, mh * 0.3];
    } else if (id === 'aluminum') {
      Tp = 0.09;
      Tc = 0.05;
      Tm = 0.05;
      L[0].add(box(W, H, Tp, faceMats(id)));
      L[1].add(box(W * 0.92, H * 0.92, Tc, new THREE.MeshStandardMaterial({ map: hexTex, roughness: 0.7 })));
      [-1, 1].forEach(s => {
        const r = box(W * 0.72, 0.07, Tm, std(0xcdd0d4, 0.35, 0.8));
        r.position.set(0, s * H * 0.26, 0);
        L[2].add(r);
      });
      coreX = -W * 0.38;
      mountHot = [-W * 0.22, H * 0.26];
    } else {
      Tp = 0.2;
      Tc = 0.04;
      Tm = 0.14;
      L[0].add(box(W, H, Tp, faceMats(id)));
      L[1].add(box(W * 0.98, H * 0.98, Tc, std(0xf3f3f1, 0.65, 0)));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const s = pin(0.075, Tm, std(0xe3e6ea, 0.15, 1));
        s.position.set(a * W * 0.4, b * H * 0.38, 0);
        L[2].add(s);
      });
      coreX = -W * 0.38;
      mountHot = [-W * 0.4, H * 0.38];
    }
    zBase = [0, -(Tp / 2 + Tc / 2), -(Tp / 2 + Tc + Tm / 2)];
    L.forEach(g => {
      rig.add(g);
      layers.push(g);
    });

    // hotspots: where the marker sits on a layer, and where the camera goes to look at it
    const copy = HOT[id];
    const defs = [
      { layer: 0, at: [W * 0.2, H * 0.16, Tp / 2 + 0.012], cam: [0, 0.1, 2.3], look: [0, 0, 0] },
      { layer: 0, at: [-W * 0.22, -H * 0.18, Tp / 2 + 0.012], cam: [1.9, 0.5, 1.2], look: [0, 0, 0] },
      { layer: 0, at: [W / 2, 0, 0], cam: [2.6, 0.4, 1.0], look: [-0.3, 0, 0] },
      { layer: 1, at: [coreX, 0, Tc / 2 + 0.012], cam: [0.9, 0.3, 2.6], look: [0.4, 0, 0] },
      { layer: 2, at: [mountHot[0], mountHot[1], Tm / 2 + 0.012], cam: [-0.6, 0.35, -3.0], look: [0, 0, 0] }
    ];
    hotsEl.innerHTML = '';
    hs = defs.map((d, i) => {
      const anchor = new THREE.Object3D();
      anchor.position.set(d.at[0], d.at[1], d.at[2]);
      layers[d.layer].add(anchor);
      const P = [EX_X[d.layer] * sx + d.at[0], d.at[1], zAt(d.layer, 1) + d.at[2]];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'v-hot';
      el.textContent = String(i + 1);
      el.setAttribute('aria-label', `Detail ${i + 1} of ${defs.length}: ${copy[i][0]}`);
      el.addEventListener('click', () => focusHot(i));
      hotsEl.appendChild(el);
      return {
        anchor,
        el,
        title: copy[i][0],
        text: copy[i][1],
        cam: [P[0] + d.cam[0], P[1] + d.cam[1], P[2] + d.cam[2]],
        look: [P[0] + d.look[0], P[1] + d.look[1], P[2] + d.look[2]]
      };
    });
    focus = -1;
    card.hidden = true;
  }

  function loadPosterTex() {
    const p = poster();
    if (loadedFor === p.id) return;
    loadedFor = p.id;
    const im = new Image();
    const done = () => root.classList.add('is3d');
    im.onload = () => {
      if (loadedFor !== p.id) return;
      posterTex.image = im;
      posterTex.needsUpdate = true;
      done();
    };
    im.onerror = done;
    im.src = imgUrl(p);
  }

  /* ----- camera poses ----- */
  function setPose(pos, lk) {
    const c = toCyl(pos[0], pos[1], pos[2]);
    camT.r = c.r;
    camT.a = c.a;
    camT.y = c.y;
    lookT.set(lk[0], lk[1], lk[2]);
  }
  function goOverview(mode) {
    const P = mode === 'layers' ? LAYERS : ORBIT;
    camT.r = P.r;
    camT.a = P.a;
    camT.y = P.y;
    lookT.set(P.look[0], P.look[1], P.look[2]);
    yaw = wrap(yaw);
    yawT = P.yaw;
    pitchT = P.pitch;
    vel = 0;
  }

  /* ----- hotspot tour ----- */
  function focusHot(i) {
    if (view !== 'layers' || !hs[i]) return;
    focus = i;
    yaw = wrap(yaw);
    yawT = 0;
    pitchT = 0;
    vel = 0;
    setPose(hs[i].cam, hs[i].look);
    card.hidden = false;
    q('#v-card-title').textContent = hs[i].title;
    q('#v-card-text').textContent = hs[i].text;
    q('#v-card-count').textContent = `Detail ${i + 1} of ${hs.length}`;
    $$('#v-dots i', card).forEach((d, j) => d.classList.toggle('on', j === i));
    hs.forEach((h, j) => h.el.classList.toggle('on', j === i));
    updateDiscover();
  }
  function closeFocus() {
    if (focus < 0) return;
    focus = -1;
    card.hidden = true;
    hs.forEach(h => h.el.classList.remove('on'));
    goOverview('layers');
    updateDiscover();
  }
  function stepHot(d) {
    if (focus < 0) return;
    focusHot((focus + d + hs.length) % hs.length);
  }

  function updateDiscover() {
    const show = has3d && (view === 'orbit' || (view === 'layers' && focus < 0));
    discover.hidden = !show;
    discoverText.textContent = view === 'orbit' ? 'Discover more' : 'Take the tour';
  }

  /* ----- view switching ----- */
  function setView(id) {
    const v = VIEWS.find(x => x.id === id) || VIEWS[0];
    if (v.id === 'layers' && !has3d) return;
    closeFocusQuiet();
    view = v.id;
    root.dataset.view = v.room !== undefined ? 'room' : v.id;
    $$('.v-tab', tabs).forEach(b => {
      const on = b.dataset.view === view;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (v.room !== undefined) {
      roomIndex = v.room;
      renderRoom(true);
      roomEl.hidden = false;
    } else {
      roomEl.hidden = true;
      label.textContent = `${material().name} · ${dims(sizeOpt(), poster())}`;
      if (has3d) {
        exT = view === 'layers' ? 1 : 0;
        goOverview(view);
        ensureLoop();
      }
    }
    updateDiscover();
  }
  function closeFocusQuiet() {
    focus = -1;
    card.hidden = true;
    hs.forEach(h => h.el.classList.remove('on'));
  }

  tabs.addEventListener('click', e => {
    const b = e.target.closest('.v-tab');
    if (b) setView(b.dataset.view);
  });
  tabs.addEventListener('keydown', e => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const list = $$('.v-tab', tabs).filter(b => !b.hidden);
    const at = list.findIndex(b => b === document.activeElement);
    const next = list[(at + step + list.length) % list.length];
    next.focus();
    setView(next.dataset.view);
  });
  discover.addEventListener('click', () => {
    if (view === 'orbit') setView('layers');
    else focusHot(0);
  });
  q('#v-prev').addEventListener('click', () => stepHot(-1));
  q('#v-next').addEventListener('click', () => stepHot(1));
  q('#v-card-close').addEventListener('click', closeFocus);

  /* ----- dragging ----- */
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    vel = 0;
    lastInput = performance.now();
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('grabbing');
    if (focus >= 0) closeFocus();
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yawT += dx * 0.008;
    vel = dx * 0.008;
    if (e.pointerType === 'mouse') pitchT = clamp(pitchT + dy * 0.005, -0.5, 0.5);
    lastInput = performance.now();
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('grabbing');
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* the pointer may already be released */
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  // the light follows the pointer, so steel and acrylic glint as you move
  main.addEventListener('pointermove', e => {
    if (!has3d) return;
    const r = main.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    key.position.set(nx * 5, 3 + ny * 2.5, 6);
  });

  /* ----- render loop ----- */
  let last = 0;
  let rafId = 0;
  const tmpV = () => tmpV.v || (tmpV.v = new THREE.Vector3());
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);

    ex += (exT - ex) * (reduce ? 1 : 1 - Math.exp(-dt * 3.2));
    if (Math.abs(exT - ex) < 0.0005) ex = exT;
    const e = ex * ex * (3 - 2 * ex);
    layers.forEach((g, i) => g.position.set(EX_X[i] * sx * e, 0, zAt(i, e)));

    if (!dragging) {
      yawT += vel;
      vel *= Math.pow(0.9, dt * 60);
      if (Math.abs(vel) < 0.0001) vel = 0;
    }
    const swayOn = !reduce && view === 'orbit' && focus < 0 && !dragging && t - lastInput > 2500;
    swayAmt += ((swayOn ? 1 : 0) - swayAmt) * (1 - Math.exp(-dt * 1.5));
    const ky = reduce ? 1 : 1 - Math.exp(-dt * 10);
    yaw += (yawT - yaw) * ky;
    pitch += (pitchT - pitch) * ky;
    rig.rotation.y = yaw + Math.sin((t / 1000) * 0.6) * 0.28 * swayAmt;
    rig.rotation.x = pitch;

    // the model scales with the chosen size in the 3D view (kept at 1 for the layers tour)
    const sT = view === 'orbit' ? 0.8 + 0.2 * clamp((sizeOpt().scale - 0.46) / 0.48, 0, 1) : 1;
    const s = rig.scale.x + (sT - rig.scale.x) * k;
    rig.scale.setScalar(s);

    cam.r += (camT.r - cam.r) * k;
    cam.y += (camT.y - cam.y) * k;
    cam.a += wrap(camT.a - cam.a) * k;
    camera.position.set(Math.sin(cam.a) * cam.r, cam.y, Math.cos(cam.a) * cam.r);
    look.lerp(lookT, k);
    camera.lookAt(look);

    renderer.render(scene, camera);
    if (view === 'layers') placeMarkers();
  }
  function placeMarkers() {
    const w = main.clientWidth;
    const h = main.clientHeight;
    const v = tmpV();
    hs.forEach(m => {
      m.anchor.getWorldPosition(v);
      v.project(camera);
      const ok = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      m.el.style.opacity = ok ? '' : '0';
      m.el.style.pointerEvents = ok ? '' : 'none';
      m.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
    });
  }
  const shouldRun = () => has3d && visible && !document.hidden && root.dataset.view !== 'room';
  function tick(t) {
    rafId = 0;
    if (!shouldRun()) return;
    frame(t);
    rafId = requestAnimationFrame(tick);
  }
  function ensureLoop() {
    if (!rafId && shouldRun()) rafId = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', ensureLoop);
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    ensureLoop();
  }, { rootMargin: '120px 0px' }).observe(main);

  function resize() {
    if (!has3d) return;
    const w = main.clientWidth || 600;
    const h = main.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!rafId && visible && root.dataset.view !== 'room') renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(main);

  /* ====================================================================
     SYNC with the configurator (poster, surface, size)
     ==================================================================== */
  function sync() {
    paintHeart(wishBtn, state.posterId);
    if (has3d) {
      const k = state.posterId + '|' + state.materialId;
      if (k !== builtKey) {
        builtKey = k;
        build();
        loadPosterTex();
        if (view === 'layers') {
          goOverview('layers');
          updateDiscover();
        }
      }
    }
    updateThumbs();
    if (root.dataset.view === 'room') renderRoom(false);
  }
  document.addEventListener('configchange', sync);

  /* ====================================================================
     ZOOM LIGHTBOX (click to zoom, drag to pan, loupe on hover)
     ==================================================================== */
  const zoom = document.getElementById('v-zoom');
  const zView = document.getElementById('vz-view');
  const zImg = document.getElementById('vz-img');
  const zLens = document.getElementById('vz-lens');
  const zLevel = document.getElementById('vz-level');
  const z = { open: false, scale: 1, fit: 1, tx: 0, ty: 0, nw: 0, nh: 0, ready: false };
  const pointers = new Map();
  let zDown = null;
  let pinch = 0;

  function zApply() {
    if (!z.ready) return;
    const vw = zView.clientWidth;
    const vh = zView.clientHeight;
    const w = z.nw * z.scale;
    const h = z.nh * z.scale;
    z.tx = w <= vw ? (vw - w) / 2 : clamp(z.tx, vw - w, 0);
    z.ty = h <= vh ? (vh - h) / 2 : clamp(z.ty, vh - h, 0);
    zImg.style.width = z.nw + 'px';
    zImg.style.height = z.nh + 'px';
    zImg.style.transform = `translate(${z.tx}px, ${z.ty}px) scale(${z.scale})`;
    zLevel.textContent = Math.round((z.scale / z.fit) * 100) + '%';
    zView.classList.toggle('zoomed', z.scale > z.fit * 1.02);
  }
  function zFit() {
    z.fit = Math.min(zView.clientWidth / z.nw, zView.clientHeight / z.nh);
  }
  function zoomTo(s, cx, cy) {
    const next = clamp(s, z.fit, z.fit * 6);
    const f = next / z.scale;
    z.tx = cx - (cx - z.tx) * f;
    z.ty = cy - (cy - z.ty) * f;
    z.scale = next;
    zApply();
  }
  const zCenter = () => [zView.clientWidth / 2, zView.clientHeight / 2];

  function openZoom() {
    const p = poster();
    z.open = true;
    z.ready = false;
    document.getElementById('vz-title').textContent = `${p.title} · ${material().name}`;
    zoom.hidden = false;
    $$('header, main, footer').forEach(el => (el.inert = true));
    document.body.style.overflow = 'hidden';
    zImg.alt = `${p.title}, full size`;
    zImg.onload = () => {
      z.nw = zImg.naturalWidth;
      z.nh = zImg.naturalHeight;
      z.ready = true;
      zFit();
      z.scale = z.fit;
      zApply();
    };
    zImg.src = fullSrc(p);
    if (zImg.complete && zImg.naturalWidth) zImg.onload();
    document.getElementById('vz-close').focus();
  }
  function closeZoom() {
    if (!z.open) return;
    z.open = false;
    zoom.hidden = true;
    zLens.hidden = true;
    $$('header, main, footer').forEach(el => (el.inert = false));
    document.body.style.overflow = '';
    zoomBtn.focus({ preventScroll: true });
  }
  zoomBtn.addEventListener('click', openZoom);
  document.getElementById('vz-close').addEventListener('click', closeZoom);
  document.getElementById('vz-in').addEventListener('click', () => zoomTo(z.scale * 1.5, ...zCenter()));
  document.getElementById('vz-out').addEventListener('click', () => zoomTo(z.scale / 1.5, ...zCenter()));
  zView.addEventListener('wheel', e => {
    e.preventDefault();
    const r = zView.getBoundingClientRect();
    zoomTo(z.scale * Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  zView.addEventListener('pointerdown', e => {
    zView.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zDown = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  zView.addEventListener('pointermove', e => {
    const r = zView.getBoundingClientRect();
    const prev = pointers.get(e.pointerId);
    if (prev) {
      if (pointers.size === 2) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoomTo(z.scale * (d / pinch), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        pinch = d;
        if (zDown) zDown.moved = true;
      } else {
        if (z.scale > z.fit * 1.02) {
          z.tx += e.clientX - prev.x;
          z.ty += e.clientY - prev.y;
          zApply();
        }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (zDown && Math.hypot(e.clientX - zDown.x, e.clientY - zDown.y) > 5) zDown.moved = true;
      }
    }
    // loupe: only for a mouse, and only while the picture is shown whole
    if (e.pointerType === 'mouse' && z.ready && z.scale <= z.fit * 1.02) {
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const w = z.nw * z.scale;
      const h = z.nh * z.scale;
      const u = (px - z.tx) / w;
      const v = (py - z.ty) / h;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const M = 3;
        const S = 190;
        zLens.hidden = false;
        zLens.style.left = px - S / 2 + 'px';
        zLens.style.top = py - S / 2 + 'px';
        zLens.style.backgroundImage = `url("${zImg.src}")`;
        zLens.style.backgroundSize = `${w * M}px ${h * M}px`;
        zLens.style.backgroundPosition = `${-(u * w * M - S / 2)}px ${-(v * h * M - S / 2)}px`;
      } else zLens.hidden = true;
    } else zLens.hidden = true;
  });
  const zUp = e => {
    const wasClick = zDown && !zDown.moved && performance.now() - zDown.t < 400 && pointers.size === 1;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (wasClick && z.ready) {
      const r = zView.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      zoomTo(z.scale > z.fit * 1.02 ? z.fit : z.fit * 2.5, x, y);
      zLens.hidden = true;
    }
    if (!pointers.size) zDown = null;
  };
  zView.addEventListener('pointerup', zUp);
  zView.addEventListener('pointercancel', zUp);
  zView.addEventListener('pointerleave', () => (zLens.hidden = true));
  addEventListener('resize', () => {
    if (!z.open || !z.ready) return;
    const wasFit = z.scale <= z.fit * 1.02;
    zFit();
    if (wasFit) z.scale = z.fit;
    zApply();
  });
  // capture phase so Escape closes the zoom first and nothing underneath reacts
  document.addEventListener('keydown', e => {
    if (z.open) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeZoom();
      } else if (e.key === '+' || e.key === '=') zoomTo(z.scale * 1.5, ...zCenter());
      else if (e.key === '-') zoomTo(z.scale / 1.5, ...zCenter());
      else if (e.key === '0') zoomTo(z.fit, ...zCenter());
      return;
    }
    if (focus >= 0 && root.contains(document.activeElement)) {
      if (e.key === 'ArrowRight') stepHot(1);
      else if (e.key === 'ArrowLeft') stepHot(-1);
    }
    if (focus >= 0 && e.key === 'Escape') closeFocus();
  }, true);

  /* ====================================================================
     START
     ==================================================================== */
  has3d = initThree();
  const dots = q('#v-dots');
  dots.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
  if (!has3d) {
    const layersTab = tabs.querySelector('[data-view="layers"]');
    layersTab.hidden = true;
    discover.hidden = true;
  } else {
    resize();
  }
  function $$(s, r = document) {
    return [...r.querySelectorAll(s)];
  }
  sync();
  setView('orbit');
})();
