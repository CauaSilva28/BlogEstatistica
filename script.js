const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const fmt = v => (Math.round(v * 1000) / 1000).toString().replace('.', ',');
const icons = ['▤', '▥', 'x̄', 'σ', '↗', '⊞', '∩', 'X', 'B', 'λ', '≈', '∿'];

/* ---------- Cards de assuntos ---------- */
$$('.topic').forEach((t, i) => {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = '#' + t.id;
  a.dataset.t = t.id;
  a.innerHTML = `<span class="ic">${icons[i]}</span><b>${t.dataset.title}</b><small>${t.dataset.desc}</small>`;
  $('#cards' + t.dataset.bim).appendChild(a);
});

/* ---------- Menu mobile, topo e progresso ---------- */
$('#menuBtn').onclick = () => $('#menu').classList.toggle('open');
$$('#menu a').forEach(a => a.addEventListener('click', () => $('#menu').classList.remove('open')));
$('#topo').onclick = () => window.scrollTo({ top: 0 });
addEventListener('scroll', () => {
  const h = document.documentElement;
  const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
  $('#progress').style.width = (p * 100) + '%';
  $('#topo').hidden = h.scrollTop < 500;
});

/* ---------- Expandir / recolher exemplos ---------- */
let aberto = true;
$('#toggleAll').onclick = e => {
  aberto = !aberto;
  $$('details.blk').forEach(d => d.open = aberto);
  e.target.textContent = aberto ? 'Recolher todos os exemplos' : 'Expandir todos os exemplos';
};

/* ---------- Pesquisa ---------- */
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
$('#busca').addEventListener('input', e => {
  const q = norm(e.target.value.trim());
  let achou = 0;
  $$('.topic').forEach(t => {
    const ok = !q || norm(t.textContent + t.dataset.desc).includes(q);
    t.classList.toggle('hide', !ok);
    $(`.card[data-t="${t.id}"]`).classList.toggle('hide', !ok);
    if (ok) achou++;
  });
  $('#vazio').hidden = achou > 0;
});

/* ---------- Gráficos SVG (JavaScript puro) ---------- */
const W = 480, L = 40, R = 12, T = 16, B = 38;
const svg = (h, body) => `<svg viewBox="0 0 ${W} ${h}" role="img">${body}</svg>`;

function barChart(vals, labels, { poly = false, gap = 0, H = 260 } = {}) {
  const pw = W - L - R, ph = H - T - B, n = vals.length, bw = pw / n;
  const max = Math.max(...vals) * 1.15;
  let s = `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#94a3b8"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="#94a3b8"/>`;
  const pts = [];
  vals.forEach((v, i) => {
    const h = v / max * ph, x = L + i * bw + gap / 2, cx = x + (bw - gap) / 2;
    s += `<rect x="${x}" y="${T + ph - h}" width="${bw - gap}" height="${h}" fill="${poly ? '#dbeafe' : '#2563eb'}" stroke="#fff"/>`;
    s += `<text x="${cx}" y="${T + ph + 15}" text-anchor="middle" font-size="${n > 9 ? 9 : 11}">${labels[i]}</text>`;
    if (!poly || v > 0) s += `<text x="${cx}" y="${T + ph - h - 4}" text-anchor="middle" font-size="10">${fmt(v)}</text>`;
    pts.push(`${cx},${T + ph - h}`);
  });
  if (poly) s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>` +
    pts.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3.5" fill="#1d4ed8"/>`).join('');
  return svg(H, s);
}

function scatter() {
  const ys = [34, 36, 36, 38, 41, 42, 43, 44, 46], H = 280;
  const pw = W - L - R, ph = H - T - B;
  const X = i => L + 20 + i / 8 * (pw - 40), Y = y => T + ph - (y - 30) / 20 * ph;
  let s = `<line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#94a3b8"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="#94a3b8"/>`;
  [30, 35, 40, 45, 50].forEach(y => s += `<text x="${L - 6}" y="${Y(y) + 4}" text-anchor="end" font-size="10">${y}</text><line x1="${L}" x2="${W - R}" y1="${Y(y)}" y2="${Y(y)}" stroke="#e2e8f0"/>`);
  s += `<line x1="${X(0)}" y1="${Y(34)}" x2="${X(8)}" y2="${Y(46)}" stroke="#f59e0b" stroke-width="2.5"/>`;
  ys.forEach((y, i) => s += `<circle cx="${X(i)}" cy="${Y(y)}" r="5" fill="#2563eb"/><text x="${X(i)}" y="${T + ph + 15}" text-anchor="middle" font-size="10">${1980 + i}</text>`);
  s += `<text x="${W - R}" y="${T + 10}" text-anchor="end" font-size="11" fill="#b45309">reta: ŷ = 1,5x + 40</text>`;
  return svg(H, s);
}

const pdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function normal(mu, sd, a, b) {
  const H = 230, pw = W - L - R, ph = H - T - B, lo = mu - 4 * sd, hi = mu + 4 * sd;
  const X = x => L + (x - lo) / (hi - lo) * pw, Y = z => T + ph - pdf(z) / pdf(0) * ph * .95;
  let curve = '', fill = '';
  const aa = Math.max(a, lo), bb = Math.min(b, hi);
  for (let i = 0; i <= 160; i++) {
    const x = lo + (hi - lo) * i / 160, p = `${X(x)},${Y((x - mu) / sd)} `;
    curve += p;
    if (x >= aa && x <= bb) fill += p;
  }
  let s = `<polygon points="${X(aa)},${T + ph} ${fill}${X(bb)},${T + ph}" fill="#93c5fd" opacity=".8"/>`;
  s += `<polyline points="${curve}" fill="none" stroke="#1d4ed8" stroke-width="2.5"/><line x1="${L}" y1="${T + ph}" x2="${W - R}" y2="${T + ph}" stroke="#94a3b8"/>`;
  for (let k = -3; k <= 3; k++) s += `<text x="${X(mu + k * sd)}" y="${T + ph + 15}" text-anchor="middle" font-size="10">${fmt(mu + k * sd)}</text><text x="${X(mu + k * sd)}" y="${T + ph + 29}" text-anchor="middle" font-size="9" fill="#64748b">z=${k}</text>`;
  return svg(H, s);
}

const fact = n => n < 2 ? 1 : n * fact(n - 1);
const comb = (n, k) => fact(n) / (fact(k) * fact(n - k));
const pmfs = {
  urn: () => ({ ks: [0, 1, 2], ps: [1 / 15, 13 / 30, 1 / 2] }),
  bin: () => { const ks = [...Array(13).keys()]; return { ks, ps: ks.map(k => comb(20, k) * .2 ** k * .8 ** (20 - k)) }; },
  poi: () => { const ks = [...Array(16).keys()]; return { ks, ps: ks.map(k => Math.exp(-6) * 6 ** k / fact(k)) }; }
};

const hf = [4, 8, 16, 7, 4, 1];
$$('.viz').forEach(el => {
  const d = el.dataset;
  if (d.viz === 'hist') el.innerHTML = barChart(hf, ['6⊢12', '12⊢18', '18⊢24', '24⊢30', '30⊢36', '36⊢42']);
  if (d.viz === 'poly') el.innerHTML = barChart([0, ...hf, 0], [3, 9, 15, 21, 27, 33, 39, 45], { poly: true });
  if (d.viz === 'scatter') el.innerHTML = scatter();
  if (d.viz === 'normal') el.innerHTML = normal(+d.mu, +d.sd, +d.a, +d.b);
  if (d.viz === 'pmf') { const { ks, ps } = pmfs[d.type](); el.innerHTML = barChart(ps, ks, { gap: 6 }); }
});
