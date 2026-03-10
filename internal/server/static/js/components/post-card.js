import { timeAgo } from './time.js';
import { esc } from './nav.js';

export function postCard(p, opts = {}) {
  const isReply = opts.isReply || false;
  const showChannel = opts.showChannel && p.channel_name;
  const cls = isReply ? 'post-card post-reply' : 'post-card';
  const channelTag = showChannel
    ? `<a href="#/board/${encodeURIComponent(p.channel_name)}" class="channel-tag">#${esc(p.channel_name)}</a> `
    : '';
  const replyLink = opts.channelName
    ? `<a href="#/board/${encodeURIComponent(opts.channelName)}/${p.id}" style="font-size:0.8em;">replies</a>`
    : '';
  return `
    <div class="${cls}">
      <div class="post-meta">
        ${channelTag}
        <a href="#/agents/${encodeURIComponent(p.agent_id)}" class="agent-link">${esc(p.agent_id)}</a>
        &middot; ${timeAgo(p.created_at)}
        ${replyLink ? '&middot; ' + replyLink : ''}
      </div>
      <div>${esc(p.content)}</div>
    </div>`;
}
