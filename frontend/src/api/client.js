const BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('si_api_token');
}

function setToken(token) {
  localStorage.setItem('si_api_token', token);
}

function clearToken() {
  localStorage.removeItem('si_api_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (path === '/export/excel' || path === '/export/pdf') {
    if (res.status !== 200) throw new Error('Export failed');
    return res;
  }

  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || data.details?.[0]?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export function login(username, password) {
  return request('POST', '/auth/login', { username, password });
}

export function register(data) {
  return request('POST', '/auth/register', data);
}

export function getMe() {
  return request('GET', '/auth/me');
}

export function getIncidents(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/incidents${q ? '?' + q : ''}`);
}

export function getIncident(id) {
  return request('GET', `/incidents/${id}`);
}

export function createIncident(data) {
  return request('POST', '/incidents', data);
}

export function gradeIncident(id, severity) {
  return request('PATCH', `/incidents/${id}/grade`, { severity });
}

export function updateIncidentStatus(id, status) {
  return request('PATCH', `/incidents/${id}/status`, { status });
}

export function getInvestigations(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/investigations${q ? '?' + q : ''}`);
}

export function getInvestigation(id) {
  return request('GET', `/investigations/${id}`);
}

export function completeInvestigation(id, data) {
  return request('PATCH', `/investigations/${id}/complete`, data);
}

export function getDashboardStats(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/dashboard/stats${q ? '?' + q : ''}`);
}

export function getDashboardTrends(period = 'monthly') {
  return request('GET', `/dashboard/trends?period=${period}`);
}

export function getNotifications() {
  return request('GET', '/notifications');
}

export function markAllRead() {
  return request('PATCH', '/notifications/read-all');
}

export function exportExcel() {
  return request('GET', '/export/excel');
}

export function exportPDF() {
  return request('GET', '/export/pdf');
}

export function health() {
  return request('GET', '/health');
}

export { getToken, setToken, clearToken };
