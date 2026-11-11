const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const DISHES = ['arepa', 'tequeno', 'chicha'];
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'ratings.json');

fs.mkdirSync(DIR, { recursive: true });
let data = Object.fromEntries(DISHES.map(d => [d, { sum: 0, count: 0 }]));
try { Object.assign(data, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch {}
const save = () => fs.writeFile(FILE, JSON.stringify(data), () => {});

// no máximo 10 avaliações por minuto por IP
const hits = new Map();
function limit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 10) return res.status(429).json({ error: 'Muitas tentativas. Tente em instantes.' });
  recent.push(now);
  hits.set(req.ip, recent);
  next();
}

app.use(express.json({ limit: '1kb' }));

app.get('/api/ratings', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(Object.fromEntries(DISHES.map(d => [d, { avg: data[d].count ? data[d].sum / data[d].count : 0, count: data[d].count }])));
});

app.post('/api/ratings', limit, (req, res) => {
  const { dish, stars } = req.body || {};
  if (!DISHES.includes(dish) || !Number.isInteger(stars) || stars < 1 || stars > 5)
    return res.status(400).json({ error: 'Dados inválidos' });
  data[dish].sum += stars;
  data[dish].count += 1;
  save();
  res.status(201).json({ ok: true });
});

app.get('/sw.js', (req, res, next) => { res.set('Cache-Control', 'no-cache'); next(); });
app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 3000, () => console.log('Na\'Guará no ar'));
