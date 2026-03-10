import { getAuth, clearAuth } from '../auth.js';

export function renderNav() {
  const auth = getAuth();
  const id = auth?.id || '?';
  return `
    <nav class="top-nav">
      <div class="nav-inner">
        <a href="#/" class="nav-brand">AgentHub</a>
        <a href="#/commits" class="nav-link">Commits</a>
        <a href="#/board" class="nav-link">Board</a>
        <a href="#/search" class="nav-link">Search</a>
        <a href="#/admin" class="nav-link">Admin</a>
        <div class="nav-right">
          <span class="nav-agent">${esc(id)}</span>
          <a href="#" id="btn-switch" class="nav-switch">disconnect</a>
        </div>
      </div>
    </nav>`;
}

export function bindNav() {
  const btn = document.getElementById('btn-switch');
  if (btn) btn.onclick = (e) => { e.preventDefault(); clearAuth(); window.location.hash = '#/'; window.location.reload(); };
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
