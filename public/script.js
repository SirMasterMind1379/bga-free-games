(function () {
  'use strict';

  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const genreFilter = document.getElementById('genreFilter');
  const gameGrid = document.getElementById('gameGrid');
  const gameCount = document.getElementById('gameCount');
  const genreCount = document.getElementById('genreCount');
  const lastUpdated = document.getElementById('lastUpdated');
  const updateBtn = document.getElementById('updateBtn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const darkToggle = document.getElementById('darkToggle');
  const toast = document.getElementById('toast');

  let gamesCache = [];
  let genresCache = [];

  function getTheme() { return localStorage.getItem('bga-theme') || 'light'; }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bga-theme', theme);
    darkToggle.checked = theme === 'dark';
  }

  setTheme(getTheme());
  darkToggle.addEventListener('change', function () { setTheme(this.checked ? 'dark' : 'light'); });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.add('hidden'); }, 4000);
  }

  function showError(msg) { error.textContent = msg; error.classList.remove('hidden'); loading.classList.add('hidden'); }
  function hideError() { error.classList.add('hidden'); }

  async function fetchGames() {
    const params = new URLSearchParams();
    const q = searchInput.value;
    const sort = sortSelect.value;
    const genre = genreFilter.value;
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    if (genre) params.set('genre', genre);

    try {
      const resp = await fetch('/api/games?' + params.toString());
      if (!resp.ok) throw new Error('Failed to fetch games');
      const data = await resp.json();
      gamesCache = data.games;
      return data;
    } catch (err) { showError('Could not load games. ' + err.message); throw err; }
  }

  async function fetchGenres() {
    try {
      const resp = await fetch('/api/genres');
      if (!resp.ok) return;
      const data = await resp.json();
      genresCache = data.genres || [];
      populateGenreFilter(genresCache);
    } catch {}
  }

  function populateGenreFilter(genres) {
    const current = genreFilter.value;
    genreFilter.innerHTML = '<option value="">All Genres</option>';
    for (const g of genres) {
      const opt = document.createElement('option');
      opt.value = g.name.toLowerCase();
      opt.textContent = g.name + ' (' + g.count + ')';
      genreFilter.appendChild(opt);
    }
    genreFilter.value = current;
  }

  async function fetchStatus() {
    try {
      const resp = await fetch('/api/status');
      if (!resp.ok) return;
      const data = await resp.json();
      gameCount.textContent = data.free + ' free games';
      if (data.genres !== undefined) genreCount.textContent = data.genres + ' genres';
      if (data.lastUpdated) {
        const d = new Date(data.lastUpdated);
        lastUpdated.textContent = 'Updated: ' + d.toLocaleTimeString();
      }
    } catch {}
  }

  function renderGames(games) {
    gameGrid.innerHTML = '';
    if (games.length === 0) {
      gameGrid.innerHTML = '<p style="text-align:center;color:var(--fg-muted);padding:2rem;">No games found.</p>';
      return;
    }

    for (const g of games) {
      const card = document.createElement('div');
      card.className = 'game-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'game-card-name';
      const nameLink = document.createElement('a');
      nameLink.href = 'https://boardgamearena.com' + g.url;
      nameLink.target = '_blank';
      nameLink.rel = 'noopener';
      nameLink.textContent = g.name;
      nameEl.appendChild(nameLink);
      card.appendChild(nameEl);

      const metaEl = document.createElement('div');
      metaEl.className = 'game-card-meta';
      if (g.players) {
        const playersSpan = document.createElement('span');
        playersSpan.textContent = g.players + ' players';
        metaEl.appendChild(playersSpan);
      }
      card.appendChild(metaEl);

      if (g.genres && g.genres.length > 0) {
        const genresEl = document.createElement('div');
        genresEl.className = 'game-card-genres';
        for (const gn of g.genres) {
          const pill = document.createElement('span');
          pill.className = 'genre-pill';
          pill.textContent = gn;
          genresEl.appendChild(pill);
        }
        card.appendChild(genresEl);
      }

      if (g.popularity) {
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML =
          '<span class="stat-label">Popularity</span>' +
          '<div class="stat-bar"><div class="stat-bar-fill" style="width:' + g.popularity + '%"></div></div>' +
          '<span class="stat-value">' + g.popularity + '</span>';
        card.appendChild(row);
      } else {
        const na = document.createElement('div');
        na.className = 'no-stats-msg';
        na.textContent = '—';
        card.appendChild(na);
      }

      const badge = document.createElement('div');
      badge.className = 'free-badge';
      badge.textContent = 'Free';
      card.appendChild(badge);

      gameGrid.appendChild(card);
    }
  }

  function debounce(fn, ms) {
    let timer;
    return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
  }

  searchInput.addEventListener('input', debounce(loadGames, 200));
  sortSelect.addEventListener('change', loadGames);
  genreFilter.addEventListener('change', loadGames);

  async function loadGames() {
    loading.classList.remove('hidden');
    hideError();
    try {
      await fetchGames();
      renderGames(gamesCache);
      await fetchStatus();
    } catch {}
    loading.classList.add('hidden');
  }

  updateBtn.addEventListener('click', async function () {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    try {
      const resp = await fetch('/api/update');
      const data = await resp.json();
      if (data.success) {
        showToast('Updated! ' + (data.newGames || 0) + ' new games found.');
        await loadGames();
        await fetchGenres();
      } else { showToast('Update failed: ' + (data.error || 'unknown error')); }
    } catch (err) { showToast('Update failed: ' + err.message); }
    updateBtn.disabled = false;
    updateBtn.textContent = 'Check for Updates';
  });

  fetchGenres();
  loadGames();
})();
