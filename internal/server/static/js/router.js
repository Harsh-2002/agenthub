export class Router {
  constructor(container) {
    this.container = container;
    this.routes = [];
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(pattern, handler) {
    const keys = [];
    // Replace :params and *splats with tokens before escaping
    let src = pattern
      .replace(/:(\w+)/g, (_, k) => { keys.push(k); return '~~P~~'; })
      .replace(/\/\*(\w+)/g, (_, k) => { keys.push(k); return '~~S~~'; });
    // Escape regex-special chars in the literal segments
    src = src.replace(/([/.])/g, '\\$1');
    // Replace tokens with actual regex groups
    src = src.replace(/~~P~~/g, '([^/]+)').replace(/~~S~~/g, '(?:\\/(.*))?');
    this.routes.push({ re: new RegExp(`^${src}$`), keys, handler });
    return this;
  }

  resolve() {
    const hash = (window.location.hash.slice(1) || '/').split('?')[0];
    for (const route of this.routes) {
      const m = hash.match(route.re);
      if (m) {
        const params = {};
        route.keys.forEach((k, i) => params[k] = m[i + 1] ? decodeURIComponent(m[i + 1]) : '');
        this.container.innerHTML = '<div aria-busy="true" class="empty-state">Loading...</div>';
        route.handler(params);
        return;
      }
    }
    this.container.innerHTML = '<div class="empty-state">Page not found</div>';
  }

  start() { this.resolve(); }
}
