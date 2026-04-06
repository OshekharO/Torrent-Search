'use strict';

// ── Theme ─────────────────────────────────────────────────────────────────────

(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-bs-theme', saved);
  updateThemeIcon(saved);
})();

function changeTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-bs-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.src = theme === 'dark' ? 'assets/brightness.svg' : 'assets/night-mode.svg';
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const queryInput = document.getElementById('query');
  queryInput.focus();

  // Restore search from URL on load
  const params = new URLSearchParams(window.location.search);
  if (params.has('query')) {
    queryInput.value = params.get('query');
    find(params.get('query'));
  }

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', changeTheme);

  // Search form
  document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const term = queryInput.value.trim();
    if (!term) return;
    const url = new URL(window.location);
    url.searchParams.set('query', term);
    history.pushState({}, '', url);
    find(term);
  });

  // Event delegation — card action buttons
  document.getElementById('result_div').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const magnet = decodeURIComponent(btn.getAttribute('data-magnet') || '');
    switch (btn.getAttribute('data-action')) {
      case 'copy':  copy(magnet);        break;
      case 'open':  openMagnet(magnet);  break;
      case 'share': share(magnet);       break;
    }
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

async function find(search) {
  const section     = document.getElementById('results-section');
  const loading     = document.getElementById('loading');
  const resultsBody = document.getElementById('results-body');
  const resultDiv   = document.getElementById('result_div');
  const queryName   = document.getElementById('query_name');
  const resultCount = document.getElementById('result-count');
  const submitBtn   = document.getElementById('submit');

  // Show loading state
  section.hidden      = false;
  loading.hidden      = false;
  resultsBody.hidden  = true;
  resultDiv.innerHTML = '';
  submitBtn.disabled  = true;

  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const base    = 'https://news-api-mocha.vercel.app/api/torrent';
    const encoded = encodeURIComponent(search);

    const [result1, result2] = await Promise.allSettled([
      fetch(`${base}/nyaasi/${encoded}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch(`${base}/piratebay/${encoded}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    ]);

    if (result1.status === 'rejected' && result2.status === 'rejected') {
      const err = new Error('Both sources failed');
      err.reasons = [result1.reason, result2.reason];
      throw err;
    }

    let data1 = (result1.status === 'fulfilled' && Array.isArray(result1.value)) ? result1.value : [];
    let data2 = (result2.status === 'fulfilled' && Array.isArray(result2.value)) ? result2.value : [];

    data1 = data1.map(item => ({ ...item, _source: 'NyaaS'     }));
    data2 = data2.map(item => ({ ...item, _source: 'PirateBay' }));

    const combined = [...data1, ...data2].sort(
      (a, b) => (parseInt(b.Seeders) || 0) - (parseInt(a.Seeders) || 0)
    );

    loading.hidden     = true;
    resultsBody.hidden = false;

    if (combined.length === 0) {
      setQueryLabel(queryName, 'No results for', search);
      resultCount.hidden      = true;
      resultDiv.innerHTML     = `
        <div class="empty-state">
          <i class="fas fa-circle-exclamation" aria-hidden="true"></i>
          <p>No torrents found. Try a different search term.</p>
        </div>`;
    } else {
      setQueryLabel(queryName, 'Results for', search);
      resultCount.textContent = `${combined.length} found`;
      resultCount.hidden      = false;

      const frag = document.createDocumentFragment();
      combined.forEach((item, i) => frag.appendChild(buildCard(item, i)));
      resultDiv.appendChild(frag);
    }
  } catch (_err) {
    loading.hidden  = true;
    section.hidden  = true;
    swal('Oops!', "Couldn't fetch results. Please check your connection and try again.", 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildCard(item, index) {
  const seeders  = parseInt(item.Seeders)  || 0;
  const leechers = parseInt(item.Leechers) || 0;
  const isNyaa   = item._source === 'NyaaS';
  const health   = seeders > 20 ? 'health-good' : seeders > 0 ? 'health-ok' : 'health-dead';
  const healthLabel = seeders > 20 ? 'Healthy' : seeders > 0 ? 'Fair' : 'Dead';

  // Meta tags (Size, Category, Date)
  let metaHtml = '';
  if (item.Size)         metaHtml += metaTag('fa-hard-drive',   escapeHtml(item.Size));
  if (item.Category)     metaHtml += metaTag('fa-tag',          escapeHtml(item.Category));
  if (item.DateUploaded) metaHtml += metaTag('fa-calendar-days', escapeHtml(item.DateUploaded));
  if (!isNyaa && item.UploadedBy) metaHtml += metaTag('fa-user', escapeHtml(item.UploadedBy));

  // Action buttons
  let actionsHtml = `
    <button class="action-btn" data-action="copy" title="Copy magnet link">
      <i class="fas fa-copy" aria-hidden="true"></i> Copy
    </button>
    <button class="action-btn" data-action="open" title="Open in torrent client">
      <i class="fas fa-up-right-from-square" aria-hidden="true"></i> Open
    </button>`;

  if (item.Url) {
    actionsHtml += `
    <a class="action-btn" href="${escapeHtml(item.Url)}" target="_blank" rel="noopener noreferrer" title="View torrent page">
      <i class="fas fa-globe" aria-hidden="true"></i> Page
    </a>`;
  }

  if (isNyaa && item.Torrent) {
    actionsHtml += `
    <a class="action-btn" href="${escapeHtml(item.Torrent)}" target="_blank" rel="noopener noreferrer" title="Download .torrent file">
      <i class="fas fa-download" aria-hidden="true"></i> .torrent
    </a>`;
  }

  actionsHtml += `
    <button class="action-btn" data-action="share" title="Share magnet link">
      <i class="fas fa-share-nodes" aria-hidden="true"></i> Share
    </button>`;

  const card = document.createElement('div');
  card.className = 'torrent-card';
  card.style.animationDelay = `${Math.min(index * 30, 300)}ms`;

  card.innerHTML = `
    <span class="card-source ${isNyaa ? 'source-nyaa' : 'source-pirate'}" aria-label="Source: ${item._source}">
      ${item._source}
    </span>
    <p class="card-title-text" title="${escapeHtml(item.Name)}">${escapeHtml(item.Name)}</p>
    ${metaHtml ? `<div class="card-meta">${metaHtml}</div>` : ''}
    <div class="card-stats">
      <span class="stat seeder" title="Seeders">
        <i class="fas fa-arrow-up" aria-hidden="true"></i> ${seeders.toLocaleString()}
      </span>
      <span class="stat leecher" title="Leechers">
        <i class="fas fa-arrow-down" aria-hidden="true"></i> ${leechers.toLocaleString()}
      </span>
      <span class="health-dot ${health}" title="${healthLabel}" aria-label="Health: ${healthLabel}"></span>
    </div>
    <div class="card-actions">${actionsHtml}</div>`;

  // Set magnet via DOM API — never via innerHTML — to prevent attribute injection
  const magnet = encodeURIComponent(item.Magnet || '');
  card.querySelectorAll('[data-action]').forEach(btn => btn.setAttribute('data-magnet', magnet));

  return card;
}

function metaTag(icon, text) {
  return `<span class="meta-tag"><i class="fas ${icon}" aria-hidden="true"></i>${text}</span>`;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(String(str ?? '')));
  return el.innerHTML;
}

function copy(magnet) {
  navigator.clipboard.writeText(magnet)
    .then(() => swal('Copied!', 'Magnet link copied to clipboard.', 'success'))
    .catch(() => swal('Error', 'Could not copy. Please copy it manually.', 'error'));
}

function openMagnet(magnet) {
  window.open(magnet, '_blank');
}

function share(magnet) {
  if (navigator.share) {
    navigator.share({ title: 'Torrent Search', text: magnet }).catch(() => {});
  } else {
    swal('Not supported', "Your browser doesn't support native sharing.", 'info');
  }
}

