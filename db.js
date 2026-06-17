/**
 * db.js – JSON file-based database for game data
 *
 * Uses a flat JSON file (games.json) as the persistent store rather than
 * a full database. Rationale:
 * - The data set is small (~80 games) and read-heavy.
 * - The sync API is safe because writes are infrequent (once per 60s max)
 *   and there's only one server process.
 * - Zero external dependencies — no SQLite, no MongoDB.
 *
 * The schema stored in games.json:
 *   { games: Game[], lastUpdated: ISO-8601|null, updateCount: number }
 * Each Game object has { id?, name, url, players, genres[], popularity,
 *   isPremium, discoveredAt, image?, complexity? }
 *
 * The upsertGames() function is the only write path — it preserves the
 * discoveredAt timestamp for existing games (so RSS doesn't re-notify).
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'games.json');

function init() {
  if (!fs.existsSync(DB_PATH)) {
    writeGames({ games: [], lastUpdated: null, updateCount: 0 });
  }
}

function read() {
  init();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { games: [], lastUpdated: null, updateCount: 0 };
  }
}

function writeGames(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getGames() {
  return read().games;
}

function getFreeGames() {
  return read().games.filter(g => !g.isPremium);
}

function getGameById(id) {
  return read().games.find(g => g.id === id) || null;
}

function getGameByUrl(url) {
  return read().games.find(g => g.url === url) || null;
}

// Insert or update games. New games get a discoveredAt timestamp;
// existing games keep their original timestamp so the RSS feed
// only shows genuinely new discoveries, not re-scrapes.
function upsertGames(newGames) {
  const data = read();
  const now = new Date().toISOString();
  let newCount = 0;

  for (const ng of newGames) {
    const existing = data.games.find(g => g.url === ng.url);
    if (existing) {
      Object.assign(existing, ng, { discoveredAt: existing.discoveredAt });
    } else {
      ng.discoveredAt = now;
      data.games.push(ng);
      newCount++;
    }
  }

  data.lastUpdated = now;
  data.updateCount = (data.updateCount || 0) + 1;
  writeGames(data);
  return { total: data.games.length, newGames: newCount };
}

function getNewGames(since) {
  const data = read();
  const cutoff = new Date(Date.now() - since).toISOString();
  return data.games
    .filter(g => g.discoveredAt && g.discoveredAt >= cutoff)
    .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
}

// Returns metadata: counts, genre variety, update timestamp, top 5 popular.
function getStats() {
  const data = read();
  const free = data.games.filter(g => !g.isPremium);
  const genreMap = {};
  for (const g of free) {
    if (g.genres) {
      for (const gn of g.genres) {
        genreMap[gn] = (genreMap[gn] || 0) + 1;
      }
    }
  }
  const topPopular = [...free].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5).map(g => g.name);
  return {
    total: data.games.length,
    free: free.length,
    genres: Object.keys(genreMap).length,
    lastUpdated: data.lastUpdated,
    updateCount: data.updateCount || 0,
    topPopular,
  };
}

module.exports = { init, getGames, getFreeGames, getGameById, getGameByUrl, upsertGames, getNewGames, getStats };
