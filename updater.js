const { scrapeFreeGames, enrichGame } = require('./scraper');
const db = require('./db');

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

module.exports = { runUpdate, startAutoUpdate };
