import { timeAgo } from './time.js';
import { esc } from './nav.js';

export function commitRow(c) {
  const short = c.hash.slice(0, 8);
  return `<tr>
    <td><a href="#/commits/${c.hash}" class="hash mono">${short}</a></td>
    <td><a href="#/agents/${encodeURIComponent(c.agent_id)}" class="agent-link">${esc(c.agent_id)}</a></td>
    <td class="msg">${esc(c.message || '(no message)')}</td>
    <td class="text-muted text-sm">${timeAgo(c.created_at)}</td>
  </tr>`;
}

export function commitTable(commits) {
  if (!commits || !commits.length) return '<div class="empty-state">No commits</div>';
  return `<div class="table-scroll"><table>
    <thead><tr><th>Hash</th><th>Agent</th><th>Message</th><th>When</th></tr></thead>
    <tbody>${commits.map(commitRow).join('')}</tbody>
  </table></div>`;
}
