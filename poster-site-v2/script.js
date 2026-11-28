/* ---------- Settings ---------- */
const CURRENCY = 'USD'; // change to 'KES' etc. to format prices differently
const MAX_QTY = 5;
const SHIPPING_CENTS = 0;
const FEATURED_COUNT = 8; // posters in the home page carousel before the "See all" tile

/* ---------- Data ---------- */
// Add a poster by dropping img/<id>.jpg and img/thumbs/<id>.jpg into the folder
// and adding one entry here. "ratio" is image width / height.
const R169 = 1376 / 768;
const POSTERS = [
  /* Places */
  { id: 'iceland', title: 'Iceland', category: 'Places', ratio: 1529 / 688, featured: true,
    description: 'Northern lights over black volcanic sand and basalt sea stacks on Iceland’s south coast.' },
  { id: 'bora-bora', title: 'Bora Bora', category: 'Places', ratio: R169, featured: true,
    description: 'Mount Otemanu rising above a turquoise lagoon and overwater bungalows at sunset.' },
  { id: 'santorini', title: 'Santorini', category: 'Places', ratio: R169, featured: true,
    description: 'Whitewashed houses and blue domes above the volcanic caldera of the Aegean Sea.' },
  { id: 'patagonia', title: 'Patagonia', category: 'Places', ratio: R169,
    description: 'Jagged granite spires over a glacial lake at the southern end of South America.' },
  { id: 'banff', title: 'Banff', category: 'Places', ratio: R169,
    description: 'Turquoise glacial water mirroring the Rocky Mountains in Canada’s oldest national park.' },
  { id: 'azores', title: 'Azores', category: 'Places', ratio: R169,
    description: 'Twin crater lakes and green volcanic calderas in Portugal’s Atlantic islands.' },
  { id: 'zhangjiajie', title: 'Zhangjiajie', category: 'Places', ratio: R169,
    description: 'Towering sandstone pillars rising through morning mist in China’s Hunan province.' },
  { id: 'victoria-falls', title: 'Victoria Falls', category: 'Places', ratio: R169,
    description: 'The Zambezi plunging into its gorge beneath a rainbow, known locally as “the smoke that thunders”.' },
  { id: 'huacachina', title: 'Huacachina', category: 'Places', ratio: R169,
    description: 'A small desert oasis in Peru’s Ica region, ringed by huge golden dunes at sunset.' },

  /* Cities */
  { id: 'kyoto', title: 'Kyoto', category: 'Cities', ratio: R169, featured: true,
    description: 'A lantern-lit street and five-storey pagoda among cherry blossoms in Japan’s old capital.' },
  { id: 'rome', title: 'Rome', category: 'Cities', ratio: R169,
    description: 'The Colosseum and ancient ruins glowing under a golden sunset.' },
  { id: 'new-york-skyline', title: 'New York Skyline', category: 'Cities', ratio: R169, featured: true,
    description: 'Manhattan’s skyline lit up across the water at dusk.' },
  { id: 'new-york-harbor', title: 'New York Harbor', category: 'Cities', ratio: R169,
    description: 'The Statue of Liberty and Lower Manhattan in warm evening light.' },

  /* Space */
  { id: 'earth', title: 'Earth', category: 'Space', ratio: R169, featured: true,
    description: 'The blue planet glowing against the dark of space.' },
  { id: 'saturn', title: 'Saturn', category: 'Space', ratio: R169, featured: true,
    description: 'The ringed giant of the outer solar system, in front of the Milky Way.' },
  { id: 'jupiter', title: 'Jupiter', category: 'Space', ratio: R169, featured: true,
    description: 'The largest planet, with its banded clouds and the Great Red Spot.' },
  { id: 'mars', title: 'Mars', category: 'Space', ratio: R169,
    description: 'The Red Planet, with its giant volcano and a polar ice cap.' },
  { id: 'mercury', title: 'Mercury', category: 'Space', ratio: R169,
    description: 'The smallest planet, and the closest to the Sun, covered in craters.' },
  { id: 'moon', title: 'The Moon', category: 'Space', ratio: R169,
    description: 'Earth’s companion, scarred by ancient impact craters.' },
  { id: 'sun', title: 'The Sun', category: 'Space', ratio: R169,
    description: 'The star at the heart of our solar system, in blazing detail.' }
];
const CATEGORIES = ['Places', 'Cities', 'Space'];

const MATERIALS = [
  {
    id: 'canvas', name: 'Gallery Canvas', tagline: 'Classic & textured', multiplier: 1,
    description: 'Archival cotton canvas hand-stretched over a 4cm pine frame, with the image wrapped around the edges.',
    details: ['Matte cotton-poly weave', '4cm gallery wrap', 'Ready to hang']
  },
  {
    id: 'stainless-steel', name: 'Brushed Stainless Steel', tagline: 'Metallic & luminous', multiplier: 1.8,
    description: 'Printed directly onto brushed stainless steel. Light areas let the metal grain show through and shift as you move.',
    details: ['1.5mm brushed steel', 'Floating wall mount', 'Scratch resistant']
  },
  {
    id: 'aluminum', name: 'Aluminum Dibond', tagline: 'Sleek & modern', multiplier: 1.4,
    description: 'UV-printed onto a white aluminum composite panel for a crisp, matte, gallery-grade finish.',
    details: ['3mm composite panel', 'Matte UV finish', 'Hidden subframe']
  },
  {
    id: 'acrylic', name: 'Acrylic Glass', tagline: 'Glossy & vivid', multiplier: 1.6,
    description: 'Face-mounted behind 5mm crystal-clear acrylic, which deepens colors and adds a glossy, glass-like depth.',
    details: ['5mm acrylic face', 'High-gloss finish', 'Polished edges']
  }
];

// Width in cm; the height follows each poster's own shape.
// "scale" is how wide the poster is drawn in the preview (share of the stage).
const SIZES = [
  { id: 'small', label: 'Small', width: 40, base: 8900, scale: 0.46 },
  { id: 'medium', label: 'Medium', width: 60, base: 13900, scale: 0.62 },
  { id: 'large', label: 'Large', width: 80, base: 21900, scale: 0.78 },
  { id: 'xl', label: 'Extra Large', width: 100, base: 32900, scale: 0.94 }
];

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const find = (list, id) => list.find(item => item.id === id);
const formatPrice = cents =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(cents / 100);

const fullSrc = p => `./img/${p.id}.jpg`;
const thumbSrc = p => `./img/thumbs/${p.id}.jpg`;
const dims = (size, p) => `${size.width} × ${Math.round(size.width / p.ratio)} cm`;

function unitPrice(poster, material, size) {
  const raw = size.base * material.multiplier;
  return Math.round(raw / 100) * 100 - 1;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

const state = {
  posterId: POSTERS[0].id,
  materialId: 'canvas',
  sizeId: 'medium',
  qty: 1,
  cart: []
};

// Recently viewed posters are remembered in this browser and power the "For You" menu
const VIEWED_KEY = 'atelier-viewed';
let viewed = [];
try {
  viewed = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]').filter(id => find(POSTERS, id));
} catch (e) {
  viewed = [];
}
function noteViewed(id) {
  viewed = [id, ...viewed.filter(v => v !== id)].slice(0, 6);
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewed));
  } catch (e) {
    /* storage can be unavailable; the menu still works for this visit */
  }
}

/* ---------- Wishlist (saved in this browser) ---------- */
const SAVED_KEY = 'atelier-saved';
let saved = [];
try {
  saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]').filter(id => find(POSTERS, id));
} catch (e) {
  saved = [];
}
const isSaved = id => saved.includes(id);
const HEART =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

function paintHeart(btn, id) {
  if (!btn) return;
  const on = isSaved(id);
  btn.dataset.save = id;
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${find(POSTERS, id).title} ${on ? 'from' : 'to'} your wishlist`);
}
function syncSaved() {
  $$('[data-save]').forEach(b => {
    if (b.dataset.save) paintHeart(b, b.dataset.save);
  });
  const n = saved.length;
  $('#wish-count').textContent = n;
  $('#wish-count').hidden = !n;
  if (!allView.hidden) {
    renderChips();
    if (allFilter === 'Saved') renderGrid();
  }
}
function toggleSaved(id) {
  saved = isSaved(id) ? saved.filter(s => s !== id) : [...saved, id];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch (e) {
    /* storage can be unavailable; the wishlist still works for this visit */
  }
  syncSaved();
  showToast(isSaved(id) ? 'Saved to your wishlist' : 'Removed from your wishlist');
}
function bindWish() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-save]');
    if (!b || !b.dataset.save) return;
    e.preventDefault();
    toggleSaved(b.dataset.save);
  });
  $('#wish-btn').addEventListener('click', () => openAll('Saved'));
  syncSaved();
}

/* ---------- Gallery ---------- */
function cardHtml(p, attr) {
  const startPrice = unitPrice(p, MATERIALS[0], SIZES[0]);
  const h = Math.round(720 / p.ratio);
  const on = isSaved(p.id);
  return `
    <article class="card">
      <button class="card-main" type="button" ${attr}="${p.id}" aria-label="Customize the ${escapeHtml(p.title)} poster">
        <span class="card-media"><img src="${thumbSrc(p)}" width="720" height="${h}" alt="${escapeHtml(p.title)} poster" loading="lazy"></span>
        <span class="card-meta">
          <span class="card-title">${escapeHtml(p.title)}</span>
          <span class="card-sub">${escapeHtml(p.category)} · from ${formatPrice(startPrice)}</span>
        </span>
      </button>
      <button class="heart" type="button" data-save="${p.id}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${escapeHtml(p.title)} ${on ? 'from' : 'to'} your wishlist">${HEART}</button>
    </article>`;
}

function selectPoster(id) {
  state.posterId = id;
  state.qty = 1;
  noteViewed(id);
  renderConfigurator();
}

function renderGallery() {
  const row = $('#gallery');
  const featured = POSTERS.filter(p => p.featured).slice(0, FEATURED_COUNT);
  row.innerHTML =
    featured.map(p => cardHtml(p, 'data-poster')).join('') +
    `<article class="card see-all-card">
       <button class="card-main" type="button" id="see-all" aria-label="See all ${POSTERS.length} posters">
         <span class="card-media see-all-media"><span>See all<small>${POSTERS.length} posters</small></span></span>
       </button>
     </article>`;

  row.addEventListener('click', e => {
    const card = e.target.closest('[data-poster]');
    if (!card) return;
    selectPoster(card.dataset.poster);
    $('#customize').scrollIntoView({ behavior: 'smooth' });
  });

  const step = () => Math.max(280, row.clientWidth * 0.8);
  $('#row-prev').addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#row-next').addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));
}

function renderTiles() {
  $('#cat-tiles').innerHTML = CATEGORIES.map(c => {
    const list = POSTERS.filter(p => p.category === c);
    const pick = list.find(p => p.featured) || list[0];
    return `<button class="tile" type="button" data-cat="${c}">
      <img src="${thumbSrc(pick)}" alt="" loading="lazy">
      <span class="tile-label">${c}<small>${list.length} posters</small></span>
    </button>`;
  }).join('');
  $('#cat-tiles').addEventListener('click', e => {
    const t = e.target.closest('[data-cat]');
    if (t) openAll(t.dataset.cat);
  });
  $('#cat-all').addEventListener('click', e => {
    e.preventDefault();
    openAll('All');
  });
}

function renderSurfaces() {
  $('#surfaces').innerHTML = MATERIALS.map(
    m => `
    <button class="surface-card" type="button" data-material="${m.id}">
      <span class="mult">${m.multiplier === 1 ? 'Base price' : `${m.multiplier}× base`}</span>
      <span class="sc-name">${m.name}</span>
      <span class="sc-desc">${m.description}</span>
      <span class="sc-chips">${m.details.map(d => `<span>${d}</span>`).join('')}</span>
    </button>`
  ).join('');
  $('#surfaces').addEventListener('click', e => {
    const c = e.target.closest('[data-material]');
    if (!c) return;
    state.materialId = c.dataset.material;
    renderOptions();
    renderConfigurator();
    $('#customize').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------- Search ---------- */
function initSearch() {
  const form = $('#search-form');
  const input = $('#search-input');
  const box = $('#search-results');
  let items = [];
  let idx = -1;
  const find2 = q => POSTERS.filter(p => `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q));

  function close() {
    box.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    idx = -1;
  }
  function render() {
    const raw = input.value.trim();
    if (!raw) return close();
    items = find2(raw.toLowerCase()).slice(0, 6);
    idx = -1;
    box.innerHTML = items.length
      ? items.map(p => `<button type="button" class="sr-item" role="option" data-id="${p.id}"><img src="${thumbSrc(p)}" alt="" width="64" height="36"><span>${escapeHtml(p.title)}<small>${escapeHtml(p.category)}</small></span></button>`).join('') +
        `<button type="button" class="sr-all" data-all-results>See all results for “${escapeHtml(raw)}”</button>`
      : `<p class="sr-none">No posters found for “${escapeHtml(raw)}”</p>`;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function mark() {
    const btns = $$('.sr-item', box);
    btns.forEach((b, i) => b.classList.toggle('on', i === idx));
    if (btns[idx]) btns[idx].scrollIntoView({ block: 'nearest' });
  }
  function choose(id) {
    close();
    input.value = '';
    selectPoster(id);
    $('#customize').scrollIntoView({ behavior: 'smooth' });
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e => {
    const n = $$('.sr-item', box).length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(n - 1, idx + 1);
      mark();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(-1, idx - 1);
      mark();
    } else if (e.key === 'Escape') {
      close();
    }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (idx >= 0 && items[idx]) return choose(items[idx].id);
    if (q) {
      close();
      openAll('All', q);
    }
  });
  box.addEventListener('click', e => {
    const b = e.target.closest('.sr-item');
    if (b) return choose(b.dataset.id);
    if (e.target.closest('[data-all-results]')) {
      const q = input.value.trim();
      close();
      openAll('All', q);
    }
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.search')) close();
  });
}

/* ---------- Configurator ---------- */
function optionsMarkup(prefix) {
  const mats = MATERIALS.map(
    m => `
    <label class="option">
      <input type="radio" name="${prefix}material" value="${m.id}" ${m.id === state.materialId ? 'checked' : ''}>
      <span>${m.name}<small>${m.tagline}</small></span>
    </label>`
  ).join('');
  const sizes = SIZES.map(
    s => `
    <label class="option">
      <input type="radio" name="${prefix}size" value="${s.id}" ${s.id === state.sizeId ? 'checked' : ''}>
      <span>${s.label}<small></small></span>
    </label>`
  ).join('');
  return { mats, sizes };
}

function renderOptions() {
  const o = optionsMarkup('');
  $('#material-options').innerHTML = o.mats;
  $('#size-options').innerHTML = o.sizes;
  const poster = find(POSTERS, state.posterId);
  $$('#size-options small').forEach((el, i) => (el.textContent = dims(SIZES[i], poster)));
}

function renderConfigurator() {
  const poster = find(POSTERS, state.posterId);
  const material = find(MATERIALS, state.materialId);
  const size = find(SIZES, state.sizeId);
  const price = unitPrice(poster, material, size);

  const frame = $('#preview-frame');
  frame.className = `frame ${material.id}`;
  frame.style.width = `${size.scale * 100}%`;
  frame.style.aspectRatio = String(poster.ratio);
  const img = $('#preview-img');
  img.src = fullSrc(poster);
  img.alt = `${poster.title} poster previewed on ${material.name}`;

  $$('#size-options small').forEach((el, i) => (el.textContent = dims(SIZES[i], poster)));

  $('#stage-label').textContent = `${material.name} · ${dims(size, poster)}`;
  $('#config-cat').textContent = poster.category;
  $('#config-title').textContent = poster.title;
  $('#config-desc').textContent = poster.description;
  $('#material-desc').textContent = material.description;
  $('#material-details').innerHTML = material.details.map(d => `<li>${d}</li>`).join('');
  $('#qty-value').textContent = state.qty;
  $('#qty-minus').disabled = state.qty <= 1;
  $('#qty-plus').disabled = state.qty >= MAX_QTY;
  $('#config-total').textContent = formatPrice(price * state.qty);
  paintHeart($('#config-wish'), poster.id);
  $$('.surface-card').forEach(c => c.classList.toggle('on', c.dataset.material === material.id));
  document.dispatchEvent(new Event('configchange')); // the 3D sections listen for this
}

function bindConfigurator() {
  $('#material-options').addEventListener('change', e => {
    state.materialId = e.target.value;
    renderConfigurator();
  });
  $('#size-options').addEventListener('change', e => {
    state.sizeId = e.target.value;
    renderConfigurator();
  });
  $('#qty-minus').addEventListener('click', () => {
    state.qty = Math.max(1, state.qty - 1);
    renderConfigurator();
  });
  $('#qty-plus').addEventListener('click', () => {
    state.qty = Math.min(MAX_QTY, state.qty + 1);
    renderConfigurator();
  });

  // Moves the light reflection across steel as the pointer moves over the stage.
  $('#stage').addEventListener('pointermove', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    $('#preview-frame').style.setProperty('--sheen', `${100 - pct}%`);
  });

  $('#add-to-cart').addEventListener('click', () =>
    addToCart(state.posterId, state.materialId, state.sizeId, state.qty)
  );
}

/* ---------- Cart ---------- */
function addToCart(posterId, materialId, sizeId, qty) {
  const key = `${posterId}|${materialId}|${sizeId}`;
  const existing = state.cart.find(line => line.key === key);
  if (existing) {
    existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  } else {
    state.cart.push({ key, posterId, materialId, sizeId, qty });
  }
  renderCart();
  showToast('Added to cart');
}

function lineTotal(line) {
  return (
    unitPrice(find(POSTERS, line.posterId), find(MATERIALS, line.materialId), find(SIZES, line.sizeId)) *
    line.qty
  );
}

function renderCart() {
  const count = state.cart.reduce((sum, l) => sum + l.qty, 0);
  const label = `Open cart, ${count} item${count === 1 ? '' : 's'}`;
  $('#cart-count').textContent = count;
  $('#cart-btn').setAttribute('aria-label', label);
  $('#all-cart-count').textContent = count;
  $('#all-cart').setAttribute('aria-label', label);
  $('#cart-count').hidden = !count;
  $('#all-cart-count').hidden = !count;

  const body = $('#drawer-body');
  const foot = $('#drawer-foot');

  if (!state.cart.length) {
    body.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    foot.hidden = true;
    return;
  }

  body.innerHTML = state.cart
    .map(line => {
      const p = find(POSTERS, line.posterId);
      const m = find(MATERIALS, line.materialId);
      const s = find(SIZES, line.sizeId);
      return `
      <div class="line">
        <img src="${thumbSrc(p)}" alt="">
        <div class="line-info">
          <strong>${escapeHtml(p.title)}</strong>
          <span class="muted">${m.name} · ${dims(s, p)}</span>
          <span class="muted">${formatPrice(lineTotal(line))}</span>
          <div class="line-actions">
            <div class="line-qty" role="group" aria-label="Quantity for ${escapeHtml(p.title)}">
              <button type="button" data-dec="${line.key}" aria-label="Decrease quantity" ${line.qty <= 1 ? 'disabled' : ''}>&minus;</button>
              <output>${line.qty}</output>
              <button type="button" data-inc="${line.key}" aria-label="Increase quantity" ${line.qty >= MAX_QTY ? 'disabled' : ''}>+</button>
            </div>
            <button class="line-remove" type="button" data-remove="${line.key}">Remove</button>
          </div>
        </div>
      </div>`;
    })
    .join('');

  const subtotal = state.cart.reduce((sum, l) => sum + lineTotal(l), 0);
  $('#subtotal').textContent = formatPrice(subtotal);
  $('#grand-total').textContent = formatPrice(subtotal + SHIPPING_CENTS);
  foot.hidden = false;
}

let cartOpener = null;
function openDrawer() {
  cartOpener = document.activeElement;
  $('#drawer').inert = false;
  $('#drawer').classList.add('open');
  $('#overlay').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#drawer-close').focus();
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#overlay').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#drawer').inert = true;
  showCartView();
  const back = cartOpener && document.contains(cartOpener) && !cartOpener.closest('[inert]') ? cartOpener : $('#cart-btn');
  back.focus({ preventScroll: true });
}

function showCartView() {
  $('#cart-view').hidden = false;
  $('#checkout-view').hidden = true;
  $('#checkout-form').hidden = false;
  $('#success-view').hidden = true;
  $('#drawer-title').textContent = 'Your cart';
}

function bindCart() {
  $('#cart-btn').addEventListener('click', openDrawer);
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);
  $('#drawer-body').addEventListener('click', e => {
    const { remove, inc, dec } = e.target.dataset;
    if (remove) {
      state.cart = state.cart.filter(l => l.key !== remove);
    } else if (inc || dec) {
      const line = state.cart.find(l => l.key === (inc || dec));
      if (!line) return;
      line.qty = Math.min(MAX_QTY, Math.max(1, line.qty + (inc ? 1 : -1)));
    } else {
      return;
    }
    renderCart();
  });

  $('#checkout-btn').addEventListener('click', () => {
    $('#cart-view').hidden = true;
    $('#checkout-view').hidden = false;
    $('#drawer-title').textContent = 'Checkout';
    $('#pay-total').textContent = $('#grand-total').textContent;
  });
  $('#back-to-cart').addEventListener('click', showCartView);
  $('#success-close').addEventListener('click', closeDrawer);

  $('#checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const name = form.elements.name.value.trim();
    state.cart = [];
    renderCart();
    form.reset();
    form.hidden = true;
    $('#success-title').textContent = `Thank you, ${name}`;
    $('#success-view').hidden = false;
    $('#drawer-title').textContent = 'Order placed';
  });
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------- "All posters" view with category filter ---------- */
const allView = $('#all-view');
const FILTERS = ['All', ...CATEGORIES, 'Saved'];
let allFilter = 'All';
let allQuery = '';

const matchesQuery = p => {
  const q = allQuery.trim().toLowerCase();
  return !q || `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q);
};

function renderChips() {
  const counts = { All: POSTERS.length, Saved: saved.length };
  CATEGORIES.forEach(c => (counts[c] = POSTERS.filter(p => p.category === c).length));
  $('#all-chips').innerHTML = FILTERS.map(
    c => `<button class="chip" type="button" data-filter="${c}" aria-pressed="${c === allFilter}">${c}<small>${counts[c]}</small></button>`
  ).join('');
}
function renderGrid() {
  let list =
    allFilter === 'All' ? POSTERS : allFilter === 'Saved' ? POSTERS.filter(p => isSaved(p.id)) : POSTERS.filter(p => p.category === allFilter);
  list = list.filter(matchesQuery);
  $('#all-grid').innerHTML = list.length
    ? list.map(p => cardHtml(p, 'data-all')).join('')
    : `<p class="empty-state">${
        allFilter === 'Saved' && !allQuery
          ? 'No saved posters yet. Tap the heart on any poster to save it here.'
          : 'No posters match that search.'
      }</p>`;
  $('#all-query').hidden = !allQuery;
  $('#all-query-text').textContent = allQuery;
  $('#all-title').textContent = allQuery ? 'Search results' : allFilter === 'Saved' ? 'Your wishlist' : 'All posters';
}
function renderAll() {
  renderChips();
  renderGrid();
}

function setPageInert(on) {
  $$('header, main, footer').forEach(el => (el.inert = on));
}
function openAll(filter, query) {
  // the "See all" tile passes a click event, so only a known filter name changes anything
  if (typeof filter === 'string' && FILTERS.includes(filter)) {
    allFilter = filter;
    allQuery = typeof query === 'string' ? query : '';
  }
  renderAll();
  allView.hidden = false;
  setPageInert(true);
  document.body.style.overflow = 'hidden';
  allView.scrollTop = 0;
  $('#all-close').focus();
}
function closeAll() {
  allView.hidden = true;
  setPageInert(false);
  document.body.style.overflow = '';
  $('#see-all').focus({ preventScroll: true });
}

function bindAll() {
  $('#see-all').addEventListener('click', openAll);
  $('#all-close').addEventListener('click', closeAll);
  $('#all-cart').addEventListener('click', openDrawer);
  $('#all-chips').addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    allFilter = chip.dataset.filter;
    renderAll();
    $(`[data-filter="${allFilter}"]`).focus();
  });
  $('#all-query-clear').addEventListener('click', () => {
    allQuery = '';
    renderGrid();
  });
  $('#all-grid').addEventListener('click', e => {
    const card = e.target.closest('[data-all]');
    if (!card) return;
    openPanel(card.dataset.all, card); // stay in the gallery: the panel slides in on top
  });
}

/* ---------- Side panel: customize a poster without leaving the full gallery ---------- */
const panel = $('#panel');
const pstate = { posterId: POSTERS[0].id, qty: 1 };
let panelOpener = null;
let addedTimer;

function renderPanel() {
  const poster = find(POSTERS, pstate.posterId);
  const material = find(MATERIALS, state.materialId);
  const size = find(SIZES, state.sizeId);

  const frame = $('#panel-frame');
  frame.className = `frame ${material.id}`;
  frame.style.width = `${size.scale * 100}%`;
  frame.style.aspectRatio = String(poster.ratio);
  const img = $('#panel-img');
  img.src = fullSrc(poster);
  img.alt = `${poster.title} poster previewed on ${material.name}`;

  $$('#panel-size-options small').forEach((el, i) => (el.textContent = dims(SIZES[i], poster)));
  $('#panel-stage-label').textContent = `${material.name} · ${dims(size, poster)}`;
  $('#panel-cat').textContent = poster.category;
  $('#panel-name').textContent = poster.title;
  paintHeart($('#panel-wish'), poster.id);
  $('#panel-desc').textContent = poster.description;
  $('#panel-material-desc').textContent = material.description;
  $('#panel-qty').textContent = pstate.qty;
  $('#panel-minus').disabled = pstate.qty <= 1;
  $('#panel-plus').disabled = pstate.qty >= MAX_QTY;
  $('#panel-total').textContent = formatPrice(unitPrice(poster, material, size) * pstate.qty);
}

function openPanel(id, opener) {
  pstate.posterId = id;
  pstate.qty = 1;
  noteViewed(id);
  panelOpener = opener || null;
  const o = optionsMarkup('p-');
  $('#panel-material-options').innerHTML = o.mats;
  $('#panel-size-options').innerHTML = o.sizes;
  $('#panel-add').textContent = 'Add to cart';
  renderPanel();
  allView.inert = true; // keyboard focus stays inside the panel
  panel.inert = false;
  panel.classList.add('open');
  $('#panel-overlay').classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  $('.panel-body', panel).scrollTop = 0;
  $('#panel-close').focus();
}

function closePanel() {
  panel.classList.remove('open');
  $('#panel-overlay').classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;
  allView.inert = false;
  // back to the same card, with the gallery scroll position and filter untouched
  if (panelOpener && document.contains(panelOpener)) panelOpener.focus({ preventScroll: true });
}

function bindPanel() {
  $('#panel-close').addEventListener('click', closePanel);
  $('#panel-overlay').addEventListener('click', closePanel);

  // Material and size are shared with the main customizer so choices carry over
  const syncMain = () => {
    renderPanel();
    renderOptions();
    renderConfigurator();
  };
  $('#panel-material-options').addEventListener('change', e => {
    state.materialId = e.target.value;
    syncMain();
  });
  $('#panel-size-options').addEventListener('change', e => {
    state.sizeId = e.target.value;
    syncMain();
  });
  $('#panel-minus').addEventListener('click', () => {
    pstate.qty = Math.max(1, pstate.qty - 1);
    renderPanel();
  });
  $('#panel-plus').addEventListener('click', () => {
    pstate.qty = Math.min(MAX_QTY, pstate.qty + 1);
    renderPanel();
  });
  $('#panel-stage').addEventListener('pointermove', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    $('#panel-frame').style.setProperty('--sheen', `${100 - pct}%`);
  });

  $('#panel-add').addEventListener('click', () => {
    addToCart(pstate.posterId, state.materialId, state.sizeId, pstate.qty);
    const btn = $('#panel-add');
    btn.textContent = 'Added ✓';
    clearTimeout(addedTimer);
    addedTimer = setTimeout(() => (btn.textContent = 'Add to cart'), 1400);
  });
  $('#panel-view-cart').addEventListener('click', () => {
    closePanel();
    openDrawer();
  });
}

/* ---------- Mega menu: Explore / Custom Posters / For You ---------- */
function menuLink(item) {
  if (item.soon) {
    return `<button class="mega-link" type="button" disabled>${item.label}<span class="tag">Soon</span></button>`;
  }
  if (item.act === 'goto') {
    return `<a class="mega-link${item.more ? ' more' : ''}" href="${item.target}" data-act="goto" data-target="${item.target}">${item.label}</a>`;
  }
  const thumb = item.thumb ? `<img src="${item.thumb}" alt="" width="64" height="36">` : '';
  return `<button class="mega-link${item.more ? ' more' : ''}${thumb ? ' with-thumb' : ''}" type="button" data-act="${item.act}" data-id="${item.id || ''}">${thumb}<span>${item.label}</span></button>`;
}
const menuCol = (title, items, note) =>
  `<div class="mega-col"><h3>${title}</h3>${note ? `<p class="mega-note">${note}</p>` : ''}${items.map(menuLink).join('')}</div>`;

function buildExplore() {
  return [
    menuCol('Start browsing', [
      { label: 'All posters', act: 'all', id: 'All' },
      { label: 'Featured posters', act: 'goto', target: '#gallery-section' },
      { label: 'Compare surfaces', act: 'goto', target: '#surfaces-section' },
      { label: 'Customize a poster', act: 'goto', target: '#customize' }
    ]),
    menuCol('Shop by category', [
      ...CATEGORIES.map(c => ({ label: c, act: 'all', id: c })),
      { label: 'See all posters', act: 'all', id: 'All', more: true }
    ]),
    menuCol('Shop by surface', [
      ...MATERIALS.map(m => ({ label: m.name, act: 'material', id: m.id })),
      { label: 'Compare all surfaces', act: 'goto', target: '#surfaces-section', more: true }
    ]),
    menuCol('Popular posters', [
      ...POSTERS.filter(p => p.featured).map(p => ({ label: p.title, act: 'poster', id: p.id })),
      { label: 'See all posters', act: 'all', id: 'All', more: true }
    ])
  ].join('');
}

function buildCustom() {
  return [
    menuCol('Pick your size', SIZES.map(s => ({ label: `${s.label} · ${s.width} cm wide`, act: 'size', id: s.id }))),
    menuCol('Pick your surface', MATERIALS.map(m => ({ label: m.name, act: 'material', id: m.id }))),
    menuCol(
      'Make it yours',
      [
        { label: 'Request a place or city', soon: true },
        { label: 'Print your own photo', soon: true },
        { label: 'Add a name or date', soon: true }
      ],
      'More ways to personalize are on the way.'
    )
  ].join('');
}

function buildForYou() {
  const recent = viewed.map(id => find(POSTERS, id)).filter(Boolean).slice(0, 4);
  const last = recent[0];
  let picks = last ? POSTERS.filter(p => p.category === last.category && !viewed.includes(p.id)) : [];
  if (!picks.length) picks = POSTERS.filter(p => p.featured && !viewed.includes(p.id));
  picks = picks.slice(0, 4);
  const recentHtml = recent.length
    ? recent.map(p => menuLink({ label: p.title, act: 'poster', id: p.id, thumb: thumbSrc(p) })).join('')
    : '<p class="mega-empty">Nothing yet. Open a poster and it will show up here.</p>';
  return [
    `<div class="mega-col"><h3>Recently viewed</h3>${recentHtml}</div>`,
    menuCol(
      'Picked for you',
      picks.map(p => ({ label: p.title, act: 'poster', id: p.id, thumb: thumbSrc(p) })),
      last ? `Because you looked at ${last.title}` : 'Featured right now'
    ),
    menuCol('Gift ideas', [
      { label: 'For travelers', act: 'all', id: 'Places' },
      { label: 'For city lovers', act: 'all', id: 'Cities' },
      { label: 'For stargazers', act: 'all', id: 'Space' },
      { label: 'Your wishlist', act: 'all', id: 'Saved' },
      { label: 'Browse everything', act: 'all', id: 'All', more: true }
    ])
  ].join('');
}

function initMenu() {
  const header = $('.header');
  const mega = $('#mega');
  const triggers = $$('.mega-trigger');
  const mobile = $('#mobile-menu');
  const menuBtn = $('#menu-btn');
  let openPane = null;
  let closeTimer;

  $('#pane-explore').innerHTML = buildExplore();
  $('#pane-custom').innerHTML = buildCustom();

  function showMega(name) {
    clearTimeout(closeTimer);
    if (name === 'foryou') $('#pane-foryou').innerHTML = buildForYou(); // always fresh
    $$('.mega-pane').forEach(p => (p.hidden = p.dataset.pane !== name));
    mega.hidden = false;
    triggers.forEach(t => {
      const on = t.dataset.pane === name;
      t.classList.toggle('open', on);
      t.setAttribute('aria-expanded', String(on));
    });
    openPane = name;
  }
  function closeMega() {
    clearTimeout(closeTimer);
    mega.hidden = true;
    triggers.forEach(t => {
      t.classList.remove('open');
      t.setAttribute('aria-expanded', 'false');
    });
    openPane = null;
  }
  function closeMobile() {
    mobile.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
  }
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMega, 160);
  };

  triggers.forEach(t => {
    const name = t.dataset.pane;
    // Hover opens it for a mouse; a tap or the keyboard toggles it
    t.addEventListener('pointerenter', e => {
      if (e.pointerType === 'mouse') showMega(name);
    });
    t.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse') scheduleClose();
    });
    t.addEventListener('click', e => {
      const mouse = e.pointerType === 'mouse' && e.detail > 0;
      if (openPane === name && !mouse) closeMega();
      else showMega(name);
    });
  });
  mega.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  mega.addEventListener('pointerleave', e => {
    if (e.pointerType === 'mouse') scheduleClose();
  });
  header.addEventListener('focusout', e => {
    if (!header.contains(e.relatedTarget)) closeMega();
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.header')) {
      closeMega();
      closeMobile();
    }
  });

  // Phones and tablets: one Menu button with the same three groups as accordions
  menuBtn.addEventListener('click', () => {
    const open = mobile.hidden;
    if (open) {
      mobile.innerHTML = [
        ['Explore', buildExplore()],
        ['Custom Posters', buildCustom()],
        ['For You', buildForYou()]
      ]
        .map(([label, html]) => `<details class="m-group"><summary>${label}</summary><div class="m-cols">${html}</div></details>`)
        .join('');
    }
    mobile.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  });

  // What each menu item does
  const goTo = sel => $(sel).scrollIntoView({ behavior: 'smooth' });
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, id, target } = el.dataset;
    if (act === 'goto') e.preventDefault();
    closeMega();
    closeMobile();
    if (act === 'all') openAll(id);
    else if (act === 'goto') goTo(target);
    else if (act === 'poster') {
      selectPoster(id);
      goTo('#customize');
    } else if (act === 'material' || act === 'size') {
      if (act === 'material') state.materialId = id;
      else state.sizeId = id;
      renderOptions();
      renderConfigurator();
      goTo('#customize');
    }
  });

  return {
    closeAny() {
      if (openPane) {
        const t = triggers.find(x => x.dataset.pane === openPane);
        closeMega();
        if (t) t.focus();
        return true;
      }
      if (!mobile.hidden) {
        closeMobile();
        menuBtn.focus();
        return true;
      }
      return false;
    }
  };
}

/* ---------- Start ---------- */
renderGallery();
renderSurfaces();
renderOptions();
renderConfigurator();
bindConfigurator();
bindCart();
bindAll();
bindPanel();
const menu = initMenu();
renderCart();
renderTiles();
initSearch();
bindWish();

// Escape closes the top-most layer first: menu, cart, side panel, then the full gallery
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (menu.closeAny()) return;
  if ($('#drawer').classList.contains('open')) closeDrawer();
  else if (panel.classList.contains('open')) closePanel();
  else if (!allView.hidden) closeAll();
});
$('#year').textContent = new Date().getFullYear();

/* ---------- Interactive extras ---------- */
(function () {
  $('#stat-count').textContent = POSTERS.length;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // no reveals, tilt or highlighter

  // Reveal on scroll. The classes are removed afterwards so hover effects stay snappy.
  const ob = new IntersectionObserver(
    entries =>
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        ob.unobserve(el);
        setTimeout(() => {
          el.classList.remove('reveal', 'in');
          el.style.transitionDelay = '';
        }, 1100);
      }),
    { threshold: 0.1 }
  );
  $$('#gallery .card, .tile, .benefit, .surface-card, .section-head, .config-panel').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 6) * 50 + 'ms';
    ob.observe(el);
  });

  // 3D tilt with a moving glare on poster cards (works for cards added later too)
  const tilt = e => {
    const f = e.target.closest('.card-media');
    if (!f || f.classList.contains('see-all-media')) return;
    const r = f.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    f.style.transform = `perspective(800px) rotateY(${(x - 0.5) * 12}deg) rotateX(${-(y - 0.5) * 12}deg) scale(1.02)`;
    f.style.setProperty('--gx', x * 100 + '%');
    f.style.setProperty('--gy', y * 100 + '%');
  };
  const untilt = e => {
    const f = e.target.closest && e.target.closest('.card-media');
    if (f) f.style.transform = '';
  };
  [$('#gallery'), $('#all-grid')].forEach(g => {
    g.addEventListener('pointermove', tilt);
    g.addEventListener('pointerout', untilt);
  });

  // Tilt on the preview in the customizer
  const stg = $('#stage');
  const pf = $('#preview-frame');
  stg.addEventListener('pointermove', e => {
    const r = stg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    pf.style.transform = `perspective(900px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.03)`;
  });
  stg.addEventListener('pointerleave', () => (pf.style.transform = ''));

  // Highlighter cursor trail. Set to false to turn it off everywhere.
  const INK_ENABLED = true;
  if (!INK_ENABLED) {
    $('#ink').hidden = true;
    return;
  }
  const cv = $('#ink');
  const cx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let pts = [];
  let running = false;
  let lx = null;
  let ly = 0;
  const resize = () => {
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  const off = () => (allView.hidden ? scrollY : allView.scrollTop);

  function draw() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    pts = pts.filter(p => p.t > 0.02);
    if (!pts.length) {
      running = false;
      return;
    }
    pts.forEach(p => (p.t *= 0.92));
    const oy = off();
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    cx.strokeStyle = '#fff';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (b.n - a.n > 120) continue;
      cx.beginPath();
      cx.moveTo(a.x, a.y - oy);
      cx.lineTo(b.x, b.y - oy);
      cx.lineWidth = 110 * b.t + 3;
      cx.stroke();
    }
    requestAnimationFrame(draw);
  }
  // No highlighter over the 3D scenes (anything marked data-no-ink): it would draw over them
  const add = () => {
    if (lx === null) return;
    const under = document.elementFromPoint(lx, ly);
    if (under && under.closest('[data-no-ink]')) {
      pts = [];
      return;
    }
    pts.push({ x: lx, y: ly + off(), t: 1, n: performance.now() });
    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
  };
  addEventListener('pointermove', e => {
    lx = e.clientX;
    ly = e.clientY;
    add();
  });
  addEventListener('scroll', add, true);
})();
