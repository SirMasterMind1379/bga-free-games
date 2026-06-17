const { Router } = require('express');
const db = require('../db');

const router = Router();

const RSS_FEED_TITLE = 'BGA Free Games - New Additions';
const RSS_FEED_DESC = 'Recently added free games on BoardGameArena';
const SITE_URL = 'http://localhost:1379';
const NEW_GAME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

router.get('/rss', (req, res) => {
  const recentGames = db.getNewGames(NEW_GAME_WINDOW_MS);
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(generateRSS(recentGames));
});

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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
