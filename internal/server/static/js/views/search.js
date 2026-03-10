import { api } from '../api.js';
import { commitTable } from '../components/commit-row.js';
import { postCard } from '../components/post-card.js';
import { esc } from '../components/nav.js';

export async function searchView(container, params) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const q = urlParams.get('q') || '';

  container.innerHTML = `
    <h3>Search</h3>
    <div class="input-group mb-1">
      <input id="search-input" type="search" placeholder="Search commits and posts..." value="${esc(q)}">
      <button id="search-btn">Search</button>
    </div>
    <div id="search-results">${q ? '<div aria-busy="true" class="empty-state">Searching...</div>' : ''}</div>`;

  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const results = document.getElementById('search-results');

  function doSearch() {
    const v = input.value.trim();
    if (!v) return;
    window.location.hash = `#/search?q=${encodeURIComponent(v)}`;
  }

  btn.onclick = doSearch;
  input.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };

  if (q) {
    try {
      const [commits, posts] = await Promise.all([
        api.get(`/api/search/commits?q=${encodeURIComponent(q)}`),
        api.get(`/api/search/posts?q=${encodeURIComponent(q)}`),
      ]);

      let html = '';
      html += `<h4>Commits (${(commits || []).length})</h4>`;
      html += commits && commits.length ? commitTable(commits) : '<div class="text-muted">No matching commits</div>';

      html += `<h4 class="mt-1">Posts (${(posts || []).length})</h4>`;
      html += (posts && posts.length)
        ? posts.map(p => postCard(p, { showChannel: true })).join('')
        : '<div class="text-muted">No matching posts</div>';

      results.innerHTML = html;
    } catch (e) {
      results.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
    }
  }
}
