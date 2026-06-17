const { Router } = require('express');
const db = require('../db');
const { runUpdate } = require('../updater');

const router = Router();

router.get('/games', (req, res) => {
  const games = db.getFreeGames();
  const { q, sort, genre } = req.query;
  let filtered = games;

  if (q) {
    const ql = q.toLowerCase();
    filtered = filtered.filter(g => g.name.toLowerCase().includes(ql));
  }

  if (genre) {
    const gl = genre.toLowerCase();
    filtered = filtered.filter(g => g.genres && g.genres.some(gn => gn.toLowerCase() === gl));
  }

  if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'players') {
    filtered.sort((a, b) => (a.players || '').localeCompare(b.players || ''));
  } else if (sort === 'popularity') {
    filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({ games: filtered, total: filtered.length });
});

router.get('/genres', (req, res) => {
  const games = db.getFreeGames();
  const genreMap = {};

  for (const g of games) {
    if (g.genres) {
      for (const gn of g.genres) {
        genreMap[gn] = (genreMap[gn] || 0) + 1;
      }
    }
  }

  const genres = Object.entries(genreMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ genres });
});

router.get('/update', async (req, res) => {
  try {
    const result = await runUpdate();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json(db.getStats());
});

router.get('/games/:id', (req, res) => {
  const game = db.getGameById(req.params.id);
  if (!game) return res.status(404).json({ error: 'not found' });
  res.json(game);
});

module.exports = router;
