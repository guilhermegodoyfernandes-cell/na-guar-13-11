if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

const btn = document.getElementById('install');
const hint = document.getElementById('ios-hint');
let promptEvt;

addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  promptEvt = e;
  btn.hidden = false;
});

btn.addEventListener('click', async () => {
  if (!promptEvt) return;
  promptEvt.prompt();
  await promptEvt.userChoice;
  promptEvt = null;
  btn.hidden = true;
});

addEventListener('appinstalled', () => { btn.hidden = true; hint.hidden = true; });

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !standalone) hint.hidden = false;

// Destaca no menu a seção visível
const links = [...document.querySelectorAll('.tabs a')];
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(a => a.removeAttribute('aria-current'));
      const a = links.find(l => l.hash === '#' + en.target.id);
      if (a) a.setAttribute('aria-current', 'true');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => io.observe(s));

// ---------- Avaliação por estrelas ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const fmt = s => (s.count ? `${s.avg.toFixed(1).replace('.', ',')} de 5 · ${s.count} ${s.count === 1 ? 'avaliação' : 'avaliações'}` : 'Seja o primeiro a avaliar');
let stats = {};

async function loadStats() {
  try {
    const r = await fetch('/api/ratings');
    if (!r.ok) throw new Error();
    stats = await r.json();
  } catch { stats = store.get('naguara-local', {}); }
}

function renderRate(el) {
  const dish = el.dataset.dish, mine = store.get('naguara-mine', {})[dish], s = stats[dish] || { avg: 0, count: 0 };
  el.innerHTML = `<h3>Avalie ${el.dataset.name}</h3><p class="rate-sum" aria-live="polite">${fmt(s)}</p>
    <div class="stars" role="group" aria-label="Nota de 1 a 5 estrelas">${[1, 2, 3, 4, 5].map(n =>
      `<button type="button" data-n="${n}" class="${n <= (mine || 0) ? 'on' : ''}" aria-label="${n} ${n === 1 ? 'estrela' : 'estrelas'}" ${mine ? 'disabled' : ''}>★</button>`).join('')}</div>
    <p class="rate-msg" aria-live="polite">${mine ? `Obrigado! Você deu ${mine} ${mine === 1 ? 'estrela' : 'estrelas'}.` : 'Toque nas estrelas para dar sua nota.'}</p>`;
}

async function vote(el, stars) {
  const dish = el.dataset.dish;
  const mine = store.get('naguara-mine', {});
  mine[dish] = stars;
  store.set('naguara-mine', mine);
  let saved = false;
  try {
    const r = await fetch('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish, stars }) });
    saved = r.ok;
  } catch {}
  await loadStats();
  if (!saved) { // sem servidor: guarda neste aparelho
    const local = store.get('naguara-local', {}), s = local[dish] || { avg: 0, count: 0 };
    local[dish] = { avg: (s.avg * s.count + stars) / (s.count + 1), count: s.count + 1 };
    store.set('naguara-local', local);
    stats = local;
  }
  renderRate(el);
  if (!saved) el.querySelector('.rate-msg').textContent += ' (Sem conexão com o servidor: nota guardada neste aparelho.)';
}

document.querySelectorAll('.rate').forEach(el => {
  el.addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (b) vote(el, Number(b.dataset.n));
  });
});
loadStats().then(() => document.querySelectorAll('.rate').forEach(renderRate));
