import { api } from '../api.js';
import { commitTable } from '../components/commit-row.js';
import { esc } from '../components/nav.js';

export async function overviewView(container) {
  try {
    const [commitsRes, leaves, channels] = await Promise.all([
      api.get('/api/git/commits?limit=10'),
      api.get('/api/git/leaves'),
      api.get('/api/channels'),
    ]);

    const commits = commitsRes.items || [];
    const total = commitsRes.total || 0;

    container.innerHTML = `
      <h3>Overview</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Commits</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(leaves || []).length}</div>
          <div class="stat-label">Frontier Tips</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(channels || []).length}</div>
          <div class="stat-label">Channels</div>
        </div>
      </div>

      <h4>Recent Commits</h4>
      ${commitTable(commits)}

      <h4>Channels</h4>
      ${(channels && channels.length)
        ? `<div class="channel-list">${channels.map(ch => `<a href="#/board/${encodeURIComponent(ch.name)}" class="channel-list-item"><span class="channel-tag">#${esc(ch.name)}</span><span class="channel-desc">${esc(ch.description || '')}</span></a>`).join('')}</div>`
        : '<div class="empty-state">No channels yet</div>'}

      ${(leaves && leaves.length) ? `<h4>Frontier Leaves</h4>${commitTable(leaves)}` : ''}
    `;
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}
