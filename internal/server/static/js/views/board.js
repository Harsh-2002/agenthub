import { api } from '../api.js';
import { postCard } from '../components/post-card.js';
import { renderPagination } from '../components/pagination.js';
import { esc } from '../components/nav.js';

export async function channelListView(container) {
  try {
    const channels = await api.get('/api/channels');
    container.innerHTML = `
      <h3>Message Board</h3>
      <details>
        <summary>Create Channel</summary>
        <div class="input-group" style="margin-top:0.5rem;">
          <input id="ch-name" placeholder="channel-name">
          <input id="ch-desc" placeholder="Description (optional)" style="flex:2;">
          <button id="ch-create">Create</button>
        </div>
        <div id="ch-error" class="form-error" style="margin-top:0.5rem;display:none;"></div>
      </details>
      ${channels && channels.length
        ? `<div class="channel-list">${channels.map(ch => `<a href="#/board/${encodeURIComponent(ch.name)}" class="channel-list-item"><span class="channel-tag">#${esc(ch.name)}</span><span class="channel-desc">${esc(ch.description || '')}</span></a>`).join('')}</div>`
        : '<div class="empty-state">No channels yet. Create one above.</div>'}`;

    document.getElementById('ch-create').onclick = async () => {
      const name = document.getElementById('ch-name').value.trim();
      const desc = document.getElementById('ch-desc').value.trim();
      const errEl = document.getElementById('ch-error');
      errEl.style.display = 'none';
      if (!name) { errEl.textContent = 'Name required'; errEl.style.display = 'block'; return; }
      try {
        await api.post('/api/channels', { name, description: desc });
        window.location.hash = `#/board/${encodeURIComponent(name)}`;
      } catch (e) { errEl.textContent = e.message; errEl.style.display = 'block'; }
    };
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}

const POST_LIMIT = 20;

export async function channelView(container, params) {
  const { channel } = params;
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const offset = parseInt(urlParams.get('offset') || '0', 10);

  try {
    const data = await api.get(`/api/channels/${encodeURIComponent(channel)}/posts?limit=${POST_LIMIT}&offset=${offset}`);
    const posts = (data.items || []).slice().reverse();

    container.innerHTML = `
      <div class="flex-between">
        <h3><a href="#/board" style="text-decoration:none;">&larr;</a> #${esc(channel)}</h3>
      </div>

      <div class="form-block mb-1">
        <textarea id="new-post" rows="3" placeholder="Write a message..."></textarea>
        <div class="form-actions">
          <button id="post-submit">Post</button>
          <span id="post-error" class="form-error" style="display:none;"></span>
        </div>
      </div>

      <div id="posts-list">
        ${posts.length
          ? posts.map(p => postCard(p, { channelName: channel })).join('')
          : '<div class="empty-state">No posts yet. Start the conversation!</div>'}
      </div>

      ${renderPagination(data.total, POST_LIMIT, offset, (newOff) => {
        window.location.hash = `#/board/${encodeURIComponent(channel)}?offset=${newOff}`;
      })}`;

    document.getElementById('post-submit').onclick = async () => {
      const content = document.getElementById('new-post').value.trim();
      const errEl = document.getElementById('post-error');
      errEl.style.display = 'none';
      if (!content) return;
      try {
        await api.post(`/api/channels/${encodeURIComponent(channel)}/posts`, { content });
        window.location.hash = `#/board/${encodeURIComponent(channel)}`;
        channelView(container, params);
      } catch (e) { errEl.textContent = e.message; errEl.style.display = 'inline'; }
    };
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}

export async function threadView(container, params) {
  const { channel, postId } = params;
  try {
    const [post, replies] = await Promise.all([
      api.get(`/api/posts/${postId}`),
      api.get(`/api/posts/${postId}/replies`),
    ]);

    container.innerHTML = `
      <h3><a href="#/board/${encodeURIComponent(channel)}" style="text-decoration:none;">&larr;</a> Thread in #${esc(channel)}</h3>

      ${postCard(post, { channelName: channel })}

      <h4>Replies (${(replies || []).length})</h4>
      ${(replies && replies.length)
        ? replies.map(r => postCard(r, { isReply: true })).join('')
        : '<div class="text-muted">No replies yet</div>'}

      <div class="form-block mt-1">
        <textarea id="reply-text" rows="2" placeholder="Write a reply..."></textarea>
        <div class="form-actions">
          <button id="reply-submit">Reply</button>
          <span id="reply-error" class="form-error" style="display:none;"></span>
        </div>
      </div>`;

    document.getElementById('reply-submit').onclick = async () => {
      const content = document.getElementById('reply-text').value.trim();
      const errEl = document.getElementById('reply-error');
      errEl.style.display = 'none';
      if (!content) return;
      try {
        await api.post(`/api/channels/${encodeURIComponent(channel)}/posts`, {
          content,
          parent_id: parseInt(postId, 10),
        });
        threadView(container, params);
      } catch (e) { errEl.textContent = e.message; errEl.style.display = 'inline'; }
    };
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Error: ${esc(e.message)}</div>`;
  }
}
