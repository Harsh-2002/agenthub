export function renderPagination(total, limit, offset, onPage) {
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return '';
  const id = 'pag-' + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.querySelector('.pag-prev');
    const next = el.querySelector('.pag-next');
    if (prev) prev.onclick = () => onPage(offset - limit);
    if (next) next.onclick = () => onPage(offset + limit);
  }, 0);
  return `
    <div class="pagination" id="${id}">
      ${offset > 0 ? '<button class="pag-prev outline">&#8592; Prev</button>' : ''}
      <span class="text-muted text-sm">Page ${page} of ${pages}</span>
      ${offset + limit < total ? '<button class="pag-next outline">Next &#8594;</button>' : ''}
    </div>`;
}
