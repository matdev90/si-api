const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Investigation = require('../models/Investigation');
const Notification = require('../models/Notification');

let userId, incidentId;

describe('User model', () => {
  it('creates a user', async () => {
    userId = uuidv4();
    const hash = await bcrypt.hash('12345', 10);
    const user = User.create({ id: userId, username: 'testuser', password: hash, name: 'Test User', role: 'pelapor', unit: 'IGD' });
    expect(user.id).toBe(userId);
    expect(user.username).toBe('testuser');
  });

  it('finds user by username', () => {
    const user = User.findByUsername('testuser');
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.password).toBeDefined();
  });

  it('finds user by id', () => {
    const user = User.findById(userId);
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.password).toBeUndefined();
  });

  it('returns null for non-existent user', () => {
    const user = User.findById('nonexistent');
    expect(user).toBeNull();
  });

  it('lists all users', () => {
    const users = User.findAll();
    expect(users.length).toBeGreaterThanOrEqual(1);
  });

  it('updates user', () => {
    User.update(userId, { name: 'Updated Name' });
    const user = User.findById(userId);
    expect(user.name).toBe('Updated Name');
  });
});

describe('Incident model', () => {
  it('creates an incident', () => {
    incidentId = uuidv4();
    const inc = Incident.create({
      id: incidentId, reporter_id: userId, is_anonymous: false,
      incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
      location: 'Rawat Inap', description: 'Pasien terima obat salah dosis',
      consequence: 'Hipotensi', immediate_action: 'Observasi',
    });
    expect(inc.id).toBe(incidentId);
    expect(inc.status).toBe('dilaporkan');
  });

  it('finds incident by id', () => {
    const inc = Incident.findById(incidentId);
    expect(inc).toBeDefined();
    expect(inc.incident_type).toBe('KTD');
  });

  it('lists incidents with pagination', () => {
    const { rows, total } = Incident.findAll({ limit: 10, offset: 0 });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('filters incidents by status', () => {
    const { total } = Incident.findAll({ status: 'dilaporkan' });
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('filters incidents by search', () => {
    const { total } = Incident.findAll({ search: 'obat' });
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('updates incident', () => {
    Incident.update(incidentId, { severity: 'merah', status: 'divalidasi' });
    const inc = Incident.findById(incidentId);
    expect(inc.severity).toBe('merah');
    expect(inc.status).toBe('divalidasi');
  });

  it('returns empty array for non-existent search', () => {
    const { total } = Incident.findAll({ search: 'zzzznonexistent' });
    expect(total).toBe(0);
  });

  it('gets stats', () => {
    const stats = Incident.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.merah).toBeGreaterThanOrEqual(1);
  });

  it('gets trends', () => {
    const trends = Incident.getTrends('monthly');
    expect(trends.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Investigation model', () => {
  let invId;

  it('creates an investigation', () => {
    invId = uuidv4();
    const inv = Investigation.create({ id: invId, incident_id: incidentId, investigator_id: userId, type: 'komprehensif', deadline: '2026-07-10' });
    expect(inv.id).toBe(invId);
    expect(inv.status).toBe('berlangsung');
  });

  it('finds by incident id', () => {
    const inv = Investigation.findByIncidentId(incidentId);
    expect(inv).toBeDefined();
    expect(inv.id).toBe(invId);
  });

  it('finds by id', () => {
    const inv = Investigation.findById(invId);
    expect(inv).toBeDefined();
    expect(inv.incident_id).toBe(incidentId);
  });

  it('lists investigations with pagination', () => {
    const { rows, total } = Investigation.findAll({ limit: 10, offset: 0 });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('completes investigation', () => {
    Investigation.update(invId, {
      root_cause: 'Kurang verifikasi', recommendations: 'Double check obat',
      action_plan: 'Sosialisasi SPO', completed_at: new Date().toISOString(), status: 'selesai',
    });
    const inv = Investigation.findById(invId);
    expect(inv.status).toBe('selesai');
    expect(inv.root_cause).toBe('Kurang verifikasi');
  });
});

describe('Notification model', () => {
  let notifId;

  it('creates a notification', () => {
    notifId = uuidv4();
    Notification.create({ id: notifId, user_id: userId, incident_id: incidentId, type: 'insiden_baru', message: 'Insiden baru dilaporkan' });
    const notifs = Notification.findByUserId(userId);
    expect(notifs.length).toBeGreaterThanOrEqual(1);
  });

  it('gets unread count', () => {
    const count = Notification.getUnreadCount(userId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('marks as read', () => {
    Notification.markAsRead(notifId);
    const count = Notification.getUnreadCount(userId);
    expect(count).toBe(0);
  });
});
