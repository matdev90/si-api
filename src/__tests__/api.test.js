const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const express = require('express');

const { getDatabase, execute } = require('../config/database');

let app, tokens = {}, incidentId, investigationId;

beforeAll(async () => {
  await getDatabase();

  const hash = await bcrypt.hash('12345', 10);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'test_pelapor', hash, 'Test Pelapor', 'pelapor', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'test_validator', hash, 'Test Validator', 'validator', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'test_pmkp', hash, 'Test PMKP', 'pmkp', 'Mutu']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'test_admin', hash, 'Test Admin', 'admin', 'TI']);

  const { securityMiddleware } = require('../middleware/security');
  const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
  const routes = require('../routes');

  app = express();
  app.use(securityMiddleware);
  app.use(express.json());

  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
});

async function login(username) {
  const res = await request(app).post('/api/v1/auth/login').send({ username, password: '12345' });
  return res.body.token;
}

describe('Auth API', () => {
  it('POST /api/v1/auth/login - success', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'test_pelapor', password: '12345' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('pelapor');
    tokens.pelapor = res.body.token;
  });

  it('POST /api/v1/auth/login - invalid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'test_pelapor', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/login - non-existent user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'nonexistent', password: '12345' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/login - validation error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'ab' });
    expect(res.status).toBe(422);
  });

  it('GET /api/v1/auth/me - with valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('test_pelapor');
  });

  it('GET /api/v1/auth/me - without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/register - admin only', async () => {
    tokens.admin = await login('test_admin');
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ username: 'new_user', password: '12345', name: 'New User', role: 'pelapor', unit: 'IGD' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('new_user');
  });

  it('POST /api/v1/auth/register - non-admin forbidden', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ username: 'another', password: '12345', name: 'Another', role: 'pelapor', unit: 'IGD' });
    expect(res.status).toBe(403);
  });

  it('POST /api/v1/auth/register - duplicate username', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ username: 'new_user', password: '12345', name: 'New User', role: 'pelapor', unit: 'IGD' });
    expect(res.status).toBe(409);
  });
});

describe('Incidents API', () => {
  it('POST /api/v1/incidents - create incident', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'Rawat Inap', description: 'Pasien terima obat salah dosis', consequence: 'Hipotensi',
        immediate_action: 'Observasi',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    incidentId = res.body.id;
  });

  it('POST /api/v1/incidents - anonymous incident', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KNC', incident_date: '2026-06-10', incident_time: '10:00',
        location: 'Farmasi', description: 'Hampir memberikan obat expired', consequence: 'Tidak ada',
        is_anonymous: true,
      });
    expect(res.status).toBe(201);
  });

  it('POST /api/v1/incidents - validation error', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ incident_type: 'INVALID' });
    expect(res.status).toBe(422);
  });

  it('POST /api/v1/incidents - unauthorized without token', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .send({ incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00', location: 'Test', description: 'Test description for incident', consequence: 'Test consequence' });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/incidents - list incidents', async () => {
    const res = await request(app).get('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/v1/incidents - pagination', async () => {
    const res = await request(app).get('/api/v1/incidents?page=1&limit=2')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.page).toBe(1);
  });

  it('GET /api/v1/incidents - filter by status', async () => {
    const res = await request(app).get('/api/v1/incidents?status=dilaporkan')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/incidents - search', async () => {
    const res = await request(app).get('/api/v1/incidents?search=obat')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/incidents/:id - get by id', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incidentId}`)
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.incident_type).toBe('KTD');
  });

  it('GET /api/v1/incidents/:id - 404', async () => {
    const res = await request(app).get('/api/v1/incidents/nonexistent-id')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /api/v1/incidents/:id/grade - grade incident', async () => {
    tokens.validator = await login('test_validator');
    const res = await request(app).patch(`/api/v1/incidents/${incidentId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'merah' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('merah');
  });

  it('PATCH /api/v1/incidents/:id/grade - regrade allowed', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incidentId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'hijau' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('hijau');
    expect(res.body.regrade).toBe(true);
  });

  it('PATCH /api/v1/incidents/:id/grade - pelapor cannot grade', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incidentId}/grade`)
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ severity: 'hijau' });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/v1/incidents/:id/status - update status', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('investigasi');
  });
});

describe('Investigations API', () => {
  it('GET /api/v1/investigations - list investigations', async () => {
    const res = await request(app).get('/api/v1/investigations')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    investigationId = res.body.data[0].id;
  });

  it('GET /api/v1/investigations - pagination', async () => {
    const res = await request(app).get('/api/v1/investigations?page=1&limit=2')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/v1/investigations/:id - get by id', async () => {
    const res = await request(app).get(`/api/v1/investigations/${investigationId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.incident_id).toBe(incidentId);
  });

  it('GET /api/v1/investigations/:id - 404', async () => {
    const res = await request(app).get('/api/v1/investigations/nonexistent')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /api/v1/investigations/:id/complete - complete investigation', async () => {
    tokens.pmkp = await login('test_pmkp');
    const res = await request(app).patch(`/api/v1/investigations/${investigationId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({ root_cause: 'Kurang verifikasi', recommendations: 'Double check obat', action_plan: 'Sosialisasi SPO' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('PATCH /api/v1/investigations/:id/complete - duplicate completion rejected', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${investigationId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({ root_cause: 'Valid root cause analysis', recommendations: 'Valid recommendations here' });
    expect(res.status).toBe(409);
  });

  it('PATCH /api/v1/investigations/:id/complete - pelapor cannot complete', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${investigationId}/complete`)
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ root_cause: 'Test', recommendations: 'Test recommendations' });
    expect(res.status).toBe(403);
  });
});

describe('Dashboard API', () => {
  it('GET /api/v1/dashboard/stats', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/dashboard/trends', async () => {
    const res = await request(app).get('/api/v1/dashboard/trends')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/dashboard/trends - yearly', async () => {
    const res = await request(app).get('/api/v1/dashboard/trends?period=yearly')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
  });
});

describe('Notifications API', () => {
  it('GET /api/v1/notifications', async () => {
    const res = await request(app).get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('PATCH /api/v1/notifications/read-all', async () => {
    const res = await request(app).patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/notifications - unread count 0 after read-all', async () => {
    const res = await request(app).get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.body.unreadCount).toBe(0);
  });
});

describe('Export API', () => {
  it('GET /api/v1/export/excel', async () => {
    const res = await request(app).get('/api/v1/export/excel')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheet');
  });

  it('GET /api/v1/export/excel - unauthorized role', async () => {
    const res = await request(app).get('/api/v1/export/excel')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/export/pdf', async () => {
    const res = await request(app).get('/api/v1/export/pdf')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('pdf');
  });

  it('GET /api/v1/export/pdf - unauthorized role', async () => {
    const res = await request(app).get('/api/v1/export/pdf')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(403);
  });
});

describe('System', () => {
  it('GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/nonexistent - 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
  });
});
