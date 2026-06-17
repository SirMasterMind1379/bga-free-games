const express = require('express');
const path = require('path');
const db = require('./db');
const { startAutoUpdate } = require('./updater');
const apiRoutes = require('./routes/api');
const feedRoutes = require('./routes/feed');

const app = express();
const PORT = 1379;

db.init();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);
app.use('/', feedRoutes);

startAutoUpdate();

app.listen(PORT, () => {
  console.log(`BGA Free Games app running at http://localhost:${PORT}`);
  console.log(`  RSS feed: http://localhost:${PORT}/rss`);
});
