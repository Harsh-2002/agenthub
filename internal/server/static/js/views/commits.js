import { api } from '../api.js';
import { commitTable } from '../components/commit-row.js';
import { renderPagination } from '../components/pagination.js';
import { timeAgo } from '../components/time.js';
import { esc } from '../components/nav.js';

const LIMIT = 20;

export async function commitsListView(container, params) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const agent = urlParams.get('agent') || '';
  const offset = parseInt(urlParams.get('offset') || '0', 10);

  let path = `/api/git/commits?limit=${LIMIT}&offset=${offset}`;
  if (agent) path += `&agent=${encodeURIComponent(agent)}`;

  try {
    const data = await api.get(path);
    const commits = data.items || [];

    container.innerHTML = `
      <div class="flex-between">
        <h3>Commits</h3>
        <div class="input-group">
          <input id="filter-agent" type="text" placeholder="Filter by agent..." value="${esc(agent)}">
          <button id="filter-btn">Filter</button>
          ${agent ? '<button id="clear-filter" class="secondary">Clear</button>' : ''}
        </div>
      </div>
      ${commitTable(commits)}
      ${renderPagination(data.total, LIMIT, offset, (newOff) => {
        let h = `#/commits?offset=${newOff}`;
        if (agent) h += `&agent=${encodeURIComponent(agent)}`;
        window.location.hash = h;
      })}`;

    const filterBtn = document.getElementById('filter-btn');
    const filterInput = document.getElementById('filter-agent');
    const clearBtn = document.getElementById('clear-filter');

    filterBtn.onclick = () => {
      const v = filterInput.value.trim();
      window.location.hash = v ? `#/commits?agent=${encodeURIComponent(v)}` : '#/commits';
    };
    filterInput.onkeydown = (e) => { if (e.key === 'Enter') filterBtn.click(); };
    if (clearBtn) clearBtn.onclick = () => { window.location.hash = '#/commits'; };
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}

export async function commitDetailView(container, params) {
  const { hash } = params;
  try {
    const [commit, children, lineage] = await Promise.all([
      api.get(`/api/git/commits/${hash}`),
      api.get(`/api/git/commits/${hash}/children`),
      api.get(`/api/git/commits/${hash}/lineage`),
    ]);

    let diffHtml = '';
    if (commit.parent_hash) {
      try {
        const diff = await api.get(`/api/git/diff/${commit.parent_hash}/${commit.hash}`);
        diffHtml = renderDiff(diff);
      } catch { diffHtml = '<div class="text-muted">Could not load diff</div>'; }
    }

    container.innerHTML = `
      <h3>Commit <span class="hash mono">${hash.slice(0, 12)}</span></h3>
      <table>
        <tr><td><strong>Hash</strong></td><td class="hash mono">${esc(commit.hash)}</td></tr>
        <tr><td><strong>Agent</strong></td><td><a href="#/agents/${encodeURIComponent(commit.agent_id)}" class="agent-link">${esc(commit.agent_id)}</a></td></tr>
        <tr><td><strong>Message</strong></td><td class="msg">${esc(commit.message || '(none)')}</td></tr>
        <tr><td><strong>Parent</strong></td><td>${commit.parent_hash ? `<a href="#/commits/${commit.parent_hash}" class="hash mono">${commit.parent_hash.slice(0, 8)}</a>` : '(root)'}</td></tr>
        <tr><td><strong>When</strong></td><td>${timeAgo(commit.created_at)}</td></tr>
      </table>
      <div style="margin-bottom:1rem;">
        <a href="#/commits/${hash}/files" role="button">Browse Files</a>
      </div>

      ${(children && children.length)
        ? `<h4>Children (${children.length})</h4>${commitTable(children)}`
        : '<div class="text-muted mb-1">No children</div>'}

      ${lineage && lineage.length > 1
        ? `<details><summary>Lineage (${lineage.length} commits)</summary>${commitTable(lineage)}</details>`
        : ''}

      ${commit.parent_hash ? `<h4>Diff from parent</h4><div class="diff-view">${diffHtml}</div>` : ''}
    `;

    function commitTable(arr) {
      return `<div class="table-scroll"><table><thead><tr><th>Hash</th><th>Agent</th><th>Message</th><th>When</th></tr></thead>
        <tbody>${arr.map(c => `<tr>
          <td><a href="#/commits/${c.hash}" class="hash mono">${c.hash.slice(0, 8)}</a></td>
          <td><a href="#/agents/${encodeURIComponent(c.agent_id)}" class="agent-link">${esc(c.agent_id)}</a></td>
          <td class="msg">${esc(c.message || '')}</td>
          <td class="text-muted text-sm">${timeAgo(c.created_at)}</td>
        </tr>`).join('')}</tbody></table></div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}

function renderDiff(text) {
  if (!text) return '<div class="text-muted">Empty diff</div>';
  return '<pre>' + text.split('\n').map(line => {
    const e = esc(line);
    if (line.startsWith('+')) return `<span class="diff-add">${e}</span>`;
    if (line.startsWith('-')) return `<span class="diff-del">${e}</span>`;
    if (line.startsWith('@@')) return `<span class="diff-hunk">${e}</span>`;
    return e;
  }).join('\n') + '</pre>';
}
