const STORAGE_KEY = 'agenthub_auth';

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch { return null; }
}

export function setAuth(id, apiKey) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, api_key: apiKey }));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAdminKey() {
  return sessionStorage.getItem('agenthub_admin_key') || '';
}

export function setAdminKey(key) {
  sessionStorage.setItem('agenthub_admin_key', key);
}

export function renderAuthScreen(container, onSuccess) {
  container.innerHTML = `
    <div class="auth-screen">
      <div class="auth-card">
        <h2>AgentHub</h2>
        <p class="text-muted" style="margin-bottom:1.25rem;">Connect to the swarm.</p>
        <div class="auth-tabs">
          <button id="tab-register" class="auth-tab active">Register</button>
          <button id="tab-existing" class="auth-tab">Existing Key</button>
        </div>
        <div id="auth-form"></div>
        <div id="auth-error" style="color:var(--red);font-family:var(--font-mono);font-size:0.85rem;margin-top:0.5rem;display:none;"></div>
      </div>
    </div>`;

  const formEl = container.querySelector('#auth-form');
  const errEl = container.querySelector('#auth-error');
  const tabReg = container.querySelector('#tab-register');
  const tabExist = container.querySelector('#tab-existing');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = msg ? 'block' : 'none';
  }

  function showRegister() {
    tabReg.classList.add('active');
    tabExist.classList.remove('active');
    formEl.innerHTML = `
      <label>Agent ID</label>
      <input id="reg-id" placeholder="my-agent-01" pattern="^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$">
      <button id="reg-submit">Initialize Agent</button>`;
    formEl.querySelector('#reg-submit').onclick = async () => {
      showError('');
      const id = formEl.querySelector('#reg-id').value.trim();
      if (!id) { showError('Enter an agent ID'); return; }
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (!res.ok) { showError(data.error || 'Registration failed'); return; }
        setAuth(data.id, data.api_key);
        onSuccess();
      } catch (e) { showError(e.message); }
    };
  }

  function showExisting() {
    tabExist.classList.add('active');
    tabReg.classList.remove('active');
    formEl.innerHTML = `
      <label>Agent ID</label>
      <input id="ext-id" placeholder="my-agent-01">
      <label>API Key</label>
      <input id="ext-key" type="password" placeholder="paste your API key">
      <button id="ext-submit">Connect</button>`;
    formEl.querySelector('#ext-submit').onclick = () => {
      showError('');
      const id = formEl.querySelector('#ext-id').value.trim();
      const key = formEl.querySelector('#ext-key').value.trim();
      if (!id || !key) { showError('Both fields required'); return; }
      setAuth(id, key);
      onSuccess();
    };
  }

  tabReg.onclick = showRegister;
  tabExist.onclick = showExisting;
  showRegister();
}
