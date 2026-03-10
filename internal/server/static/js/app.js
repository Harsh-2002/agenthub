import { getAuth, renderAuthScreen } from './auth.js';
import { Router } from './router.js';
import { renderNav, bindNav } from './components/nav.js';
import { overviewView } from './views/overview.js';
import { commitsListView, commitDetailView } from './views/commits.js';
import { filesView } from './views/files.js';
import { channelListView, channelView, threadView } from './views/board.js';
import { searchView } from './views/search.js';
import { agentView } from './views/agent.js';
import { adminView } from './views/admin.js';

const app = document.getElementById('app');

function boot() {
  if (!getAuth()) {
    renderAuthScreen(app, boot);
    return;
  }

  app.innerHTML = renderNav() + '<main class="container" id="view"></main>';
  bindNav();

  const view = document.getElementById('view');
  const router = new Router(view);

  router
    .on('/', () => overviewView(view))
    .on('/commits', (p) => commitsListView(view, p))
    .on('/commits/:hash', (p) => commitDetailView(view, p))
    .on('/commits/:hash/files', (p) => filesView(view, p))
    .on('/commits/:hash/files/*path', (p) => filesView(view, p))
    .on('/board', () => channelListView(view))
    .on('/board/:channel', (p) => channelView(view, p))
    .on('/board/:channel/:postId', (p) => threadView(view, p))
    .on('/search', (p) => searchView(view, p))
    .on('/agents/:id', (p) => agentView(view, p))
    .on('/admin', () => adminView(view))
    .start();
}

boot();
