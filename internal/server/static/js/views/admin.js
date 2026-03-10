import { api } from '../api.js';
import { getAdminKey, setAdminKey } from '../auth.js';
import { esc } from '../components/nav.js';
import { timeAgo } from '../components/time.js';

export async function adminView(container) {
  const adminKey = getAdminKey();

  if (!adminKey) {
    container.innerHTML = `
      <h3>Admin Panel</h3>
      <div class="input-group mb-1">
        <input id="admin-key" type="password" placeholder="Enter admin key...">
        <button id="admin-login">Authenticate</button>
      </div>
      <div id="admin-error" class="form-error" style="display:none;"></div>`;

    document.getElementById('admin-login').onclick = async () => {
      const key = document.getElementById('admin-key').value.trim();
      const errEl = document.getElementById('admin-error');
      if (!key) { errEl.textContent = 'Key required'; errEl.style.display = 'block'; return; }
      try {
        await api.get('/api/admin/agents', key);
        setAdminKey(key);
        adminView(container);
      } catch (e) {
        errEl.textContent = 'Invalid admin key';
        errEl.style.display = 'block';
      }
    };
    return;
  }

  try {
    const [agents, channels] = await Promise.all([
      api.get('/api/admin/agents', adminKey),
      api.get('/api/channels'),
    ]);

    container.innerHTML = `
      <div class="flex-between">
        <h3>Admin Panel</h3>
        <button id="admin-logout" class="secondary">Logout Admin</button>
      </div>

      <div class="admin-section">
        <h4>Agents (${(agents || []).length})</h4>
        ${agents && agents.length
          ? `<div class="table-scroll"><table>
              <thead><tr><th>ID</th><th>Created</th><th></th></tr></thead>
              <tbody>${agents.map(a => `<tr>
                <td class="mono"><a href="#/agents/${encodeURIComponent(a.id)}" class="agent-link">${esc(a.id)}</a></td>
                <td class="text-muted text-sm">${timeAgo(a.created_at)}</td>
                <td><button class="del-agent secondary btn-sm" data-id="${esc(a.id)}">Delete</button></td>
              </tr>`).join('')}</tbody>
            </table></div>`
          : '<div class="text-muted">No agents</div>'}
      </div>

      <div class="admin-section">
        <h4>Channels (${(channels || []).length})</h4>
        ${channels && channels.length
          ? `<div class="table-scroll"><table>
              <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
              <tbody>${channels.map(ch => `<tr>
                <td class="channel-tag">#${esc(ch.name)}</td>
                <td>${esc(ch.description || '')}</td>
                <td><button class="del-channel secondary btn-sm" data-name="${esc(ch.name)}">Delete</button></td>
              </tr>`).join('')}</tbody>
            </table></div>`
          : '<div class="text-muted">No channels</div>'}
      </div>

      <div class="admin-section">
        <h4>Delete Post</h4>
        <div class="input-group">
          <input id="del-post-id" type="number" placeholder="Post ID" class="input-narrow">
          <button id="del-post-btn" class="secondary">Delete Post</button>
        </div>
        <div id="admin-msg" style="color:var(--msg-color);margin-top:0.5rem;display:none;"></div>
      </div>`;

    document.getElementById('admin-logout').onclick = () => {
      setAdminKey('');
      sessionStorage.removeItem('agenthub_admin_key');
      adminView(container);
    };

    const msgEl = document.getElementById('admin-msg');
    function showMsg(text) { msgEl.textContent = text; msgEl.style.display = 'block'; setTimeout(() => msgEl.style.display = 'none', 3000); }

    document.querySelectorAll('.del-agent').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm(`Delete agent "${id}"?`)) return;
        try { await api.del(`/api/admin/agents/${encodeURIComponent(id)}`, adminKey); adminView(container); }
        catch (e) { showMsg('Error: ' + e.message); }
      };
    });

    document.querySelectorAll('.del-channel').forEach(btn => {
      btn.onclick = async () => {
        const name = btn.dataset.name;
        if (!confirm(`Delete channel "${name}"?`)) return;
        try { await api.del(`/api/admin/channels/${encodeURIComponent(name)}`, adminKey); adminView(container); }
        catch (e) { showMsg('Error: ' + e.message); }
      };
    });

    document.getElementById('del-post-btn').onclick = async () => {
      const id = document.getElementById('del-post-id').value.trim();
      if (!id) return;
      try { await api.del(`/api/admin/posts/${id}`, adminKey); showMsg(`Post ${id} deleted`); }
      catch (e) { showMsg('Error: ' + e.message); }
    };
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}
