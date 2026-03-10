import { api } from '../api.js';
import { esc } from '../components/nav.js';

export async function filesView(container, params) {
  const { hash } = params;
  const path = params.path || '';

  const breadcrumbs = buildBreadcrumbs(hash, path);

  try {
    const entries = await api.get(`/api/git/tree/${hash}${path ? '?path=' + encodeURIComponent(path) : ''}`);

    if (!Array.isArray(entries)) {
      // Might be a blob — try fetching it
      await renderBlob(container, hash, path, breadcrumbs);
      return;
    }

    const sorted = entries.slice().sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'tree' ? -1 : 1;
    });

    container.innerHTML = `
      <h3>Files</h3>
      ${breadcrumbs}
      <div class="table-scroll"><table>
        <thead><tr><th>Name</th><th>Type</th></tr></thead>
        <tbody>
          ${path ? `<tr><td><a href="#/commits/${hash}/files${parentPath(path)}">&#8593; ..</a></td><td></td></tr>` : ''}
          ${sorted.map(e => {
            const icon = e.type === 'tree' ? '&#128193;' : '&#128196;';
            const sub = path ? path + '/' + e.name : e.name;
            return `<tr>
              <td><span class="file-icon">${icon}</span><a href="#/commits/${hash}/files/${sub}">${esc(e.name)}</a></td>
              <td class="text-muted text-sm">${e.type}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;
  } catch (e) {
    // If tree fails, might be a blob
    if (path) {
      try {
        await renderBlob(container, hash, path, breadcrumbs);
        return;
      } catch {}
    }
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}

async function renderBlob(container, hash, path, breadcrumbs) {
  const content = await api.get(`/api/git/blob/${hash}?path=${encodeURIComponent(path)}`);
  const lines = content.split('\n');
  const numbered = lines.map((line, i) =>
    `<span class="line-num">${i + 1}</span>${esc(line)}`
  ).join('\n');

  container.innerHTML = `
    <h3>${esc(path.split('/').pop())}</h3>
    ${breadcrumbs}
    <div class="blob-view"><pre><code>${numbered}</code></pre></div>`;
}

function buildBreadcrumbs(hash, path) {
  let html = `<div class="breadcrumb"><a href="#/commits/${hash}/files">root</a>`;
  if (path) {
    const parts = path.split('/').filter(Boolean);
    let accum = '';
    for (let i = 0; i < parts.length; i++) {
      accum += (i === 0 ? '' : '/') + parts[i];
      html += `<span class="sep">/</span>`;
      if (i === parts.length - 1) {
        html += `<span>${esc(parts[i])}</span>`;
      } else {
        html += `<a href="#/commits/${hash}/files/${accum}">${esc(parts[i])}</a>`;
      }
    }
  }
  html += '</div>';
  return html;
}

function parentPath(path) {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? '/' + parts.join('/') : '';
}
