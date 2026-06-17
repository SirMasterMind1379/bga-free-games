const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const GENRE_KEYWORDS = [
  { keywords: ['strategy', 'war', 'civilization', 'kingdom', 'castle', 'empire', 'conquest', 'innovation', 'alhambra', 'through the ages', 'puerto rico', 'tzolkin', 'marco polo', 'luxor', 'targi', 'war chest', 'planet unknown'], genre: 'Strategy' },
  { keywords: ['family', 'party', 'kids', 'happy', 'color', 'flip', 'bubble', 'loco', 'spot it', 'shifting', 'saint', 'just desserts', 'chakra', 'bandido', 'abandon', 'tranquility'], genre: 'Family' },
  { keywords: ['card', 'deck', 'poker', 'trick', 'crew', 'the crew', 'hearts', 'belote', 'tarot', 'cribbage', 'rummy', 'regicide', 'saboteur', 'skull', 'fluxx', 'tock', 'wizard', 'bang', 'oh hell', 'coinche', 'altered'], genre: 'Card' },
  { keywords: ['dice', 'yahtzee', 'martian dice', 'piraten', 'dice forge', 'bubblee'], genre: 'Dice' },
  { keywords: ['abstract', 'chess', 'checkers', 'hive', 'gomoku', 'reversi', 'quarto', 'quoridor', 'connect four', 'santorini'], genre: 'Abstract' },
  { keywords: ['thematic', 'adventure', 'burgle', 'daybreak', 'lost ruins', 'memoir'], genre: 'Thematic' },
  { keywords: ['race for the galaxy', 'seasons', 'solo', 'stone age', 'coloretto', '6 nimmt', 'nothanks', 'no thanks', 'pickomino', 'heckmeck', 'skull king', 'battleships', 'cubirds', 'go goa', 'kumata', 'red notice', 'pentaquest'], genre: 'Family' },
  { keywords: ['backgammon', 'koi-koi', 'dragonheart', 'mini rogue'], genre: 'Thematic' },
];

function assignGenres(name) {
  const nl = name.toLowerCase();
  const found = new Set();
  for (const entry of GENRE_KEYWORDS) {
    if (entry.keywords.some(k => nl.includes(k))) {
      found.add(entry.genre);
    }
  }
  if (found.size === 0) found.add('Family');
  return [...found];
}

function assignStats(name) {
  const nl = name.toLowerCase();
  const popMap = [
    { keywords: ['yahtzee', 'race for the galaxy', 'stone age', 'seasons', 'through the ages', 'castles of burgundy', 'puerto rico'], pop: 88 },
    { keywords: ['6 nimmt', 'backgammon', 'solo', 'connect four', 'hearts', 'chess', 'cribbage', 'rummy', 'battleships'], pop: 80 },
    { keywords: ['the crew', 'santorini', 'innovation', 'coloretto', 'hive', 'no thanks', 'kingdom builder', 'dice forge', 'lost ruins', 'wizard', 'bang', 'saboteur'], pop: 72 },
    { keywords: ['quoridor', 'gomoku', 'reversi', 'quarto', 'checkers', 'alhambra', 'tock', 'belote', 'french tarot'], pop: 65 },
    { keywords: ['bandido', 'regicide', 'flip 7', 'martian dice', 'piraten', 'daybreak', 'fluxx', 'burgle', 'targi', 'tzolkin', 'war chest', 'planet unknown', 'memoire', 'mini rogue', 'lewis clark'], pop: 60 },
    { keywords: ['cubirds'], pop: 88 },
    { keywords: ['go goa', 'pentaquest', 'kumata', 'red notice'], pop: 50 },
  ];
  for (const entry of popMap) {
    if (entry.keywords.some(k => nl.includes(k))) {
      return { popularity: entry.pop };
    }
  }
  return { popularity: 65 };
}

function enrichGame(g) {
  const genres = assignGenres(g.name);
  const stats = assignStats(g.name);
  return {
    ...g,
    genres,
    isPremium: false,
    image: g.image || '',
    complexity: g.complexity || 0,
    popularity: stats.popularity,
  };
}

const BASE_KNOWN_GAMES = [
  { name: '6 nimmt!', url: '/gamepanel?game=sechsnimmt', players: '2-10' },
  { name: 'Abandon All Artichokes', url: '/gamepanel?game=abandonallartichokes', players: '2-4' },
  { name: 'Alhambra', url: '/gamepanel?game=alhambra', players: '2-6' },
  { name: 'Altered', url: '/gamepanel?game=altered', players: '2-4' },
  { name: 'Backgammon', url: '/gamepanel?game=backgammon', players: '2' },
  { name: 'Bandido', url: '/gamepanel?game=bandido', players: '1-4' },
  { name: 'BANG!', url: '/gamepanel?game=bang', players: '4-7' },
  { name: 'Battleships Pencil & Paper', url: '/gamepanel?game=battleship', players: '2' },
  { name: 'Belote', url: '/gamepanel?game=belote', players: '4' },
  { name: 'Bubblee Pop', url: '/gamepanel?game=bubbleepop', players: '2-4' },
  { name: 'Burgle Bros.', url: '/gamepanel?game=burglebros', players: '1-4' },
  { name: 'The Castles of Burgundy', url: '/gamepanel?game=thecastlesofburgundy', players: '2-4' },
  { name: 'Chakra', url: '/gamepanel?game=chakra', players: '2-4' },
  { name: 'Checkers', url: '/gamepanel?game=checkers', players: '2' },
  { name: 'Chess', url: '/gamepanel?game=chess', players: '2' },
  { name: 'Coinche', url: '/gamepanel?game=coinche', players: '4' },
  { name: 'CuBirds', url: '/gamepanel?game=cubirds', players: '2-4' },
  { name: 'Coloretto', url: '/gamepanel?game=coloretto', players: '2-5' },
  { name: 'Color Pop', url: '/gamepanel?game=colorpop', players: '2-4' },
  { name: 'Connect Four', url: '/gamepanel?game=connectfour', players: '2' },
  { name: 'The Crew', url: '/gamepanel?game=thecrew', players: '2-4' },
  { name: 'The Crew: Mission Deep Sea', url: '/gamepanel?game=thecrewmissiondeepsea', players: '2-4' },
  { name: 'Cribbage', url: '/gamepanel?game=cribbage', players: '2-3' },
  { name: 'Daybreak', url: '/gamepanel?game=daybreak', players: '1-4' },
  { name: 'Dice Forge', url: '/gamepanel?game=diceforge', players: '2-4' },
  { name: 'Dragonheart', url: '/gamepanel?game=dragonheart', players: '2-4' },
  { name: 'Flip 7', url: '/gamepanel?game=flip7', players: '2-4' },
  { name: 'Fluxx', url: '/gamepanel?game=fluxx', players: '2-6' },
  { name: 'French Tarot', url: '/gamepanel?game=frenchtarot', players: '2-5' },
  { name: 'Go Goa', url: '/gamepanel?game=gogoa', players: '1-6' },
  { name: 'Gomoku', url: '/gamepanel?game=gomoku', players: '2' },
  { name: 'Happy City', url: '/gamepanel?game=happycity', players: '2-4' },
  { name: 'Hearts', url: '/gamepanel?game=hearts', players: '4' },
  { name: 'Hive', url: '/gamepanel?game=hive', players: '2' },
  { name: 'Innovation', url: '/gamepanel?game=innovation', players: '2-4' },
  { name: 'Just Desserts', url: '/gamepanel?game=justdesserts', players: '2-5' },
  { name: 'Kingdom Builder', url: '/gamepanel?game=kingdombuilder', players: '2-4' },
  { name: 'Koi-Koi', url: '/gamepanel?game=koikoi', players: '2' },
  { name: 'Kumata', url: '/gamepanel?game=kumata', players: '2-4' },
  { name: 'Lewis & Clark', url: '/gamepanel?game=lewisclark', players: '1-5' },
  { name: 'Loco Momo', url: '/gamepanel?game=locomomo', players: '2-4' },
  { name: 'Lost Ruins of Arnak', url: '/gamepanel?game=lostruinsofarnak', players: '1-4' },
  { name: 'Luxor', url: '/gamepanel?game=luxor', players: '2-4' },
  { name: 'Martian Dice', url: '/gamepanel?game=martiandice', players: '2-4' },
  { name: 'Mini Rogue', url: '/gamepanel?game=minirogue', players: '1-3' },
  { name: 'Memoir \'44', url: '/gamepanel?game=memoir44', players: '2' },
  { name: 'No Thanks!', url: '/gamepanel?game=nothanks', players: '3-5' },
  { name: 'Oh Hell!', url: '/gamepanel?game=ohhell', players: '3-6' },
  { name: 'Pickomino', url: '/gamepanel?game=pickomino', players: '2-7' },
  { name: 'Pentaquest', url: '/gamepanel?game=pentaquest', players: '1-8' },
  { name: 'Piraten kapern', url: '/gamepanel?game=piratenkapern', players: '2-5' },
  { name: 'Planet Unknown', url: '/gamepanel?game=planetunknown', players: '1-6' },
  { name: 'Puerto Rico', url: '/gamepanel?game=puertorico', players: '2-5' },
  { name: 'Quarto', url: '/gamepanel?game=quarto', players: '2' },
  { name: 'Quoridor', url: '/gamepanel?game=quoridor', players: '2-4' },
  { name: 'Race for the Galaxy', url: '/gamepanel?game=raceforthegalaxy', players: '2-4' },
  { name: 'Red Notice', url: '/gamepanel?game=rednotice', players: '2' },
  { name: 'Regicide', url: '/gamepanel?game=regicide', players: '1-4' },
  { name: 'Reversi', url: '/gamepanel?game=reversi', players: '2' },
  { name: 'Rummy', url: '/gamepanel?game=rummy', players: '2-4' },
  { name: 'Saboteur', url: '/gamepanel?game=saboteur', players: '3-10' },
  { name: 'Saint Petersburg', url: '/gamepanel?game=saintpetersburg', players: '2-4' },
  { name: 'Santorini', url: '/gamepanel?game=santorini', players: '2-4' },
  { name: 'Seasons', url: '/gamepanel?game=seasons', players: '2-4' },
  { name: 'Shifting Stones', url: '/gamepanel?game=shiftingstones', players: '2-4' },
  { name: 'Skull', url: '/gamepanel?game=skull', players: '3-6' },
  { name: 'Solo', url: '/gamepanel?game=solo', players: '2-4' },
  { name: 'Spot it', url: '/gamepanel?game=spotit', players: '2-8' },
  { name: 'Stone Age', url: '/gamepanel?game=stoneage', players: '2-4' },
  { name: 'Targi', url: '/gamepanel?game=targi', players: '2' },
  { name: 'Through the Ages', url: '/gamepanel?game=throughtheages', players: '2-4' },
  { name: 'Thurn and Taxis', url: '/gamepanel?game=thurnandtaxis', players: '2-4' },
  { name: 'Tock', url: '/gamepanel?game=tock', players: '2-4' },
  { name: 'Tranquility', url: '/gamepanel?game=tranquility', players: '1-5' },
  { name: 'Tzolk\'in', url: '/gamepanel?game=tzolkin', players: '2-4' },
  { name: 'The Voyages of Marco Polo', url: '/gamepanel?game=thevoyagesofmarcopolo', players: '2-4' },
  { name: 'War Chest', url: '/gamepanel?game=warchest', players: '2-4' },
  { name: 'Wizard', url: '/gamepanel?game=wizard', players: '3-6' },
  { name: 'Yahtzee', url: '/gamepanel?game=yahtzee', players: '1-4' },
];

const KNOWN_FREE_GAMES = BASE_KNOWN_GAMES.map(enrichGame);

async function scrapeFreeGames() {
  try {
    const games = await scrapeFromBGA();
    if (games.length > 0) return games.map(enrichGame);
  } catch (err) {
    console.warn('BGA scraping failed, using known list:', err.message);
  }
  return KNOWN_FREE_GAMES;
}

async function scrapeFromBGA() {
  const urls = [
    'https://boardgamearena.com/gamelist?section=all',
    'https://boardgamearena.com/games',
    'https://boardgamearena.com/gamelist',
  ];

  for (const url of urls) {
    try {
      const resp = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.5' },
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: s => s < 400,
      });

      const $ = cheerio.load(resp.data);
      const games = [];
      const seen = new Set();

      $('a[href*="gamepanel?game="]').each((i, el) => {
        const href = $(el).attr('href') || '';
        const match = href.match(/gamepanel\?game=([^&]+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          const isPremium = $(el).closest('*').find('[class*="premium"], [class*="crown"], .fa-crown').length > 0 ||
            $(el).text().toLowerCase().includes('premium');
          if (!isPremium) {
            const name = $(el).text().trim() || $(el).find('img').first().attr('alt') || match[1];
            games.push({ name, url: '/gamepanel?game=' + match[1], players: '' });
          }
        }
      });

      if (games.length > 0) return games;
    } catch (e) {
      continue;
    }
  }
  return [];
}

function getAllGenres() {
  const set = new Set();
  for (const g of KNOWN_FREE_GAMES) {
    if (g.genres) g.genres.forEach(gn => set.add(gn));
  }
  return [...set].sort();
}

module.exports = { scrapeFreeGames, scrapeFromBGA, KNOWN_FREE_GAMES, getAllGenres, enrichGame };
