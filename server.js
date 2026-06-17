const express = require('express');
const path = require('path');
const { scrapeFreeGames, getAllGenres, enrichGame } = require('./scraper');
const db = require('./db');
const RSS_FEED_TITLE = 'BGA Free Games - New Additions';
const RSS_FEED_DESC = 'Recently added free games on BoardGameArena';
const SITE_URL = 'http://localhost:1379';

const app = express();
const PORT = 1379;

db.init();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/games', (req, res) => {
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

app.get('/api/genres', (req, res) => {
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

app.get('/api/update', async (req, res) => {
  try {
    const result = await runUpdate();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json(db.getStats());
});

app.get('/rss', (req, res) => {
  const recentGames = db.getNewGames(30 * 24 * 60 * 60 * 1000);
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(generateRSS(recentGames));
});

app.get('/api/games/:id', (req, res) => {
  const game = db.getGameById(req.params.id);
  if (!game) return res.status(404).json({ error: 'not found' });
  res.json(game);
});

let updating = false;

async function runUpdate() {
  if (updating) return { status: 'already_updating' };
  updating = true;
  try {
    console.log('[Update] Starting scrape...');
    const raw = await scrapeFreeGames();
    const games = raw.map(g => enrichGame(g));
    console.log(`[Update] Scraped ${games.length} free games`);
    const result = db.upsertGames(games);
    console.log(`[Update] DB updated: ${result.total} total, ${result.newGames} new`);
    return result;
  } finally {
    updating = false;
  }
}

async function startAutoUpdate() {
  console.log('[AutoUpdate] Running initial scrape...');
  try {
    const result = await runUpdate();
    console.log(`[AutoUpdate] Initial: ${result.total || 0} games, ${result.newGames || 0} new`);
  } catch (err) {
    console.error('[AutoUpdate] Initial scrape failed:', err.message);
  }

  console.log('[AutoUpdate] Will update every 60 seconds');
  setInterval(async () => {
    try {
      const result = await runUpdate();
      if (result.newGames > 0) {
        console.log(`[AutoUpdate] ${result.newGames} new game(s) detected!`);
      }
    } catch (err) {
      console.error('[AutoUpdate] Update failed:', err.message);
    }
  }, 60000);
}

function generateRSS(games) {
  const items = games.map(g => `
    <item>
      <title>${escapeXML(g.name)}</title>
      <link>https://boardgamearena.com${escapeXML(g.url)}</link>
      <guid isPermaLink="false">${escapeXML(g.url)}-${g.discoveredAt || ''}</guid>
      <pubDate>${new Date(g.discoveredAt || Date.now()).toUTCString()}</pubDate>
      <description>${escapeXML(g.name)} is now available as a free game on BoardGameArena${g.players ? ' (' + escapeXML(g.players) + ' players)' : ''}.</description>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(RSS_FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXML(RSS_FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

function escapeXML(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

startAutoUpdate();

app.listen(PORT, () => {
  console.log(`BGA Free Games app running at http://localhost:${PORT}`);
  console.log(`  RSS feed: http://localhost:${PORT}/rss`);
});
