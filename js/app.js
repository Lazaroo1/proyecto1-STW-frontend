let state = {
  page: 1,
  limit: 24,
  total: 0,
  sort: 'id',
  order: 'asc',
  q: '',
  series: [],
};

const grid        = document.getElementById('grid');
const modal       = document.getElementById('modal');
const modalTitle  = document.getElementById('modal-title');
const formId      = document.getElementById('form-id');
const formName    = document.getElementById('form-name');
const formCurrent = document.getElementById('form-current');
const formTotal   = document.getElementById('form-total');
const formImage   = document.getElementById('form-image');
const pageLabel   = document.getElementById('page-label');
const totalLabel  = document.getElementById('total-label');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');

async function load() {
  const data = await apiGetSeries({
    page: state.page,
    limit: state.limit,
    sort: state.sort,
    order: state.order,
    q: state.q,
  });

  state.series = data.data || [];
  state.total  = data.total || 0;

  renderGrid();
  renderPagination();
}

function renderGrid() {
  grid.innerHTML = '';

  if (state.series.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div style="font-size:3rem">📭</div>
        <p>No hay series todavía. ¡Agrega una!</p>
      </div>`;
    return;
  }

  state.series.forEach(s => {
    const pct     = s.total_episodes > 0 ? Math.round((s.current_episode / s.total_episodes) * 100) : 0;
    const done    = s.current_episode === s.total_episodes;
    const imgHTML = s.image_url
      ? `<img src="${s.image_url}" alt="${s.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholder = `<div class="card-placeholder" ${s.image_url ? 'style="display:none"' : ''}>🎬</div>`;

    const starsHTML = Array.from({ length: 10 }, (_, i) => {
      const filled = i < s.rating ? '⭐' : '☆';
      return `<span class="star" data-id="${s.id}" data-val="${i + 1}">${filled}</span>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${imgHTML}
      ${placeholder}
      <div class="card-overlay">
        ${done ? '<span class="card-badge">✓ Completada</span>' : ''}
        <div class="card-title">${s.name}</div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="card-eps">Ep. ${s.current_episode} / ${s.total_episodes} &mdash; ${pct}%</div>
        <div class="stars">${starsHTML}</div>
        <div class="card-actions">
          <button class="btn-edit" data-id="${s.id}">✏️ Editar</button>
          <button class="btn-delete" data-id="${s.id}">🗑 Eliminar</button>
        </div>
      </div>`;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', async e => {
      e.stopPropagation();
      const id  = parseInt(star.dataset.id);
      const val = parseInt(star.dataset.val);
      await apiSetRating(id, val);
      load();
    });
  });

  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const s = state.series.find(x => x.id === parseInt(btn.dataset.id));
      if (s) openModal(s);
    });
  });

  grid.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('¿Eliminar esta serie?')) return;
      await apiDeleteSeries(parseInt(btn.dataset.id));
      load();
    });
  });
}

function renderPagination() {
  const totalPages = Math.ceil(state.total / state.limit) || 1;
  pageLabel.textContent  = `Página ${state.page} de ${totalPages}`;
  totalLabel.textContent = `${state.total} serie${state.total !== 1 ? 's' : ''}`;
  btnPrev.disabled = state.page <= 1;
  btnNext.disabled = state.page >= totalPages;
}

function openModal(series = null) {
  modalTitle.textContent = series ? 'Editar Serie' : 'Agregar Serie';
  formId.value      = series ? series.id : '';
  formName.value    = series ? series.name : '';
  formCurrent.value = series ? series.current_episode : 0;
  formTotal.value   = series ? series.total_episodes : 1;
  formImage.value   = series ? series.image_url : '';
  modal.classList.remove('hidden');
  formName.focus();
}

function closeModal() {
  modal.classList.add('hidden');
}

async function saveSeries() {
  const data = {
    name:            formName.value.trim(),
    current_episode: parseInt(formCurrent.value),
    total_episodes:  parseInt(formTotal.value),
    image_url:       formImage.value.trim(),
  };

  if (!data.name) { alert('El nombre es requerido'); return; }
  if (data.total_episodes < 1) { alert('Total de episodios debe ser mayor a 0'); return; }
  if (data.current_episode < 0) { alert('Episodio actual no puede ser negativo'); return; }
  if (data.current_episode > data.total_episodes) { alert('Episodio actual no puede superar el total'); return; }

  const id = formId.value;
  const result = id ? await apiUpdateSeries(id, data) : await apiCreateSeries(data);

  if (result.error) { alert('Error: ' + result.error); return; }

  closeModal();
  load();
}

async function exportCSV() {
  const data = await apiGetSeries({ limit: 1000, sort: state.sort, order: state.order, q: state.q });
  const rows = data.data || [];

  const headers = ['ID', 'Nombre', 'Episodio actual', 'Total episodios', 'Rating', 'Imagen'];
  const lines = [
    headers.join(','),
    ...rows.map(s =>
      [s.id, `"${s.name.replace(/"/g, '""')}"`, s.current_episode, s.total_episodes, s.rating, `"${s.image_url}"`].join(',')
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'series.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('btn-add').addEventListener('click', () => openModal());
document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-save').addEventListener('click', saveSeries);
document.getElementById('btn-csv').addEventListener('click', exportCSV);

modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.getElementById('search').addEventListener('input', e => {
  state.q = e.target.value;
  state.page = 1;
  load();
});

document.getElementById('sort').addEventListener('change', e => {
  state.sort = e.target.value;
  load();
});

document.getElementById('order').addEventListener('change', e => {
  state.order = e.target.value;
  load();
});

document.getElementById('limit').addEventListener('change', e => {
  state.limit = parseInt(e.target.value);
  state.page = 1;
  load();
});

btnPrev.addEventListener('click', () => { state.page--; load(); });
btnNext.addEventListener('click', () => { state.page++; load(); });

load();