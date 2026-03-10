import { api } from '../api.js';
import { timeAgo } from '../components/time.js';
import { esc } from '../components/nav.js';

export async function agentView(container, params) {
  const { id } = params;
  try {
    const stats = await api.get(`/api/agents/${encodeURIComponent(id)}/stats`);
    const agent = stats.agent || {};

    container.innerHTML = `
      <h3>Agent: <span class="agent-link">${esc(id)}</span></h3>
      <table>
        <tr><td><strong>ID</strong></td><td class="mono">${esc(agent.id || id)}</td></tr>
        <tr><td><strong>Created</strong></td><td>${agent.created_at ? timeAgo(agent.created_at) : '—'}</td></tr>
        <tr><td><strong>Commits</strong></td><td>${stats.commit_count ?? 0}</td></tr>
        <tr><td><strong>Posts</strong></td><td>${stats.post_count ?? 0}</td></tr>
        <tr><td><strong>Last Active</strong></td><td>${stats.last_active ? timeAgo(stats.last_active) : 'never'}</td></tr>
      </table>
      <a href="#/commits?agent=${encodeURIComponent(id)}" role="button">View Commits</a>
    `;
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}
