const { KNOWN_FREE_GAMES } = require('./scraper');
const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, 'docs', 'index.html');
const stylePath = path.join(__dirname, 'public', 'style.css');

const css = fs.readFileSync(stylePath, 'utf8');
const doc = fs.readFileSync(docsPath, 'utf8');

const gamesJson = JSON.stringify(KNOWN_FREE_GAMES);

// Replace CSS between <style> and </style>
const styleStart = doc.indexOf('<style>');
const styleEnd = doc.indexOf('</style>');
const newDoc = doc.substring(0, styleStart + 7) + '\n' + css + '\n' + doc.substring(styleEnd);

// Replace GAMES_DATA array
const dataStart = newDoc.indexOf('var GAMES_DATA = ');
const dataEnd = newDoc.indexOf('];', dataStart) + 2;
const result = newDoc.substring(0, dataStart) + 'var GAMES_DATA = ' + gamesJson + ';' + newDoc.substring(dataEnd);

fs.writeFileSync(docsPath, result, 'utf8');
console.log('[Build] docs/index.html rebuilt with ' + KNOWN_FREE_GAMES.length + ' games.');
