const BASE_URL = 'https://proyecto1-stw-backend-production.up.railway.app';

async function apiGetSeries(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/series?${qs}`);
  return res.json();
}

async function apiCreateSeries(data) {
  const res = await fetch(`${BASE_URL}/series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiUpdateSeries(id, data) {
  const res = await fetch(`${BASE_URL}/series/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiDeleteSeries(id) {
  await fetch(`${BASE_URL}/series/${id}`, { method: 'DELETE' });
}

async function apiSetRating(id, rating) {
  const res = await fetch(`${BASE_URL}/series/${id}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  return res.json();
}