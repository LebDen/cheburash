const express = require('express');
const app = express();
const KEY = '09282991-acfd-4c79-a43c-93ea02c3414a';

app.use(express.static('public'));

app.get('/rasp', async (req, res) => {
  const p = req.query.p || 'search/';
  const q = req.query.q || '';
  const url = `https://api.rasp.yandex.ru/v3.0/${p}?${q}&apikey=${KEY}&format=json&lang=ru_RU`;
  try {
    const r = await fetch(url);
    const body = await r.text();
    res.set('Access-Control-Allow-Origin',*'' );
    res.set('Cache-Control', 'public, max-age=60');
    res.status(r.status).send(body);
  } catch (e) { res.status(502).json({ error: 'upstream' }); }
});

app.listen(3000, () => console.log('ok'));