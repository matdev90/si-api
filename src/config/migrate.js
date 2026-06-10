const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getDatabase, execute, query } = require('./database');

const migrations = [
  {
    name: '001_create_users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('pelapor','validator','pmkp','kepala_unit','manajemen','admin')),
        unit TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `
  },
  {
    name: '002_create_incidents',
    sql: `
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        reporter_id TEXT,
        is_anonymous INTEGER DEFAULT 0,
        incident_type TEXT NOT NULL CHECK(incident_type IN ('KTD','KNC','KPC','KTC','sentinel')),
        incident_date TEXT NOT NULL,
        incident_time TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        consequence TEXT NOT NULL,
        immediate_action TEXT,
        severity TEXT CHECK(severity IN ('biru','hijau','kuning','merah')),
        status TEXT DEFAULT 'dilaporkan' CHECK(status IN ('dilaporkan','divalidasi','investigasi','ditindaklanjuti','selesai','ditolak')),
        attachments TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      );
    `
  },
  {
    name: '003_create_investigations',
    sql: `
      CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        investigator_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('sederhana','komprehensif')),
        root_cause TEXT,
        recommendations TEXT,
        action_plan TEXT,
        deadline TEXT,
        completed_at TEXT,
        status TEXT DEFAULT 'berlangsung' CHECK(status IN ('berlangsung','selesai')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (incident_id) REFERENCES incidents(id),
        FOREIGN KEY (investigator_id) REFERENCES users(id)
      );
    `
  },
  {
    name: '004_create_notifications',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        incident_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('insiden_baru','deadline','validasi','tindak_lanjut','escalasi')),
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
      );
    `
  },
  {
    name: '005_create_audit_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `
  },
  {
    name: '006_create_ruangan',
    sql: `
      CREATE TABLE IF NOT EXISTS ruangan (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `
  }
];

async function runMigrations() {
  await getDatabase();

  execute(`CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    executed_at TEXT DEFAULT (datetime('now'))
  );`);

  for (const migration of migrations) {
    const existing = query(`SELECT id FROM migrations WHERE name = ?`, [migration.name]);
    if (existing.length === 0) {
      execute(migration.sql);
      execute(`INSERT INTO migrations (name) VALUES (?)`, [migration.name]);
      console.log(`Migrated: ${migration.name}`);
    } else {
      console.log(`Skipped: ${migration.name} (already applied)`);
    }
  }

  console.log('All migrations completed.');
}

async function run() {
  await runMigrations();

  // Auto-seed default users if none exist
  const userCount = query(`SELECT COUNT(*) as cnt FROM users`)[0]?.cnt || 0;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const seedUsers = [
      { username: 'admin', password: '12345', name: 'Administrator', role: 'admin', unit: 'IT' },
      { username: 'perawat1', password: '12345', name: 'Siti Nurhaliza', role: 'pelapor', unit: 'IGD' },
      { username: 'dokter1', password: '12345', name: 'Dr. Ahmad Fauzi', role: 'pelapor', unit: 'IGD' },
      { username: 'validator1', password: '12345', name: 'Ns. Dewi Sartika', role: 'validator', unit: 'PMKP' },
      { username: 'pmkp1', password: '12345', name: 'Dr. Budi Santoso', role: 'pmkp', unit: 'PMKP' },
      { username: 'kepala_igd', password: '12345', name: 'Dr. Andi Pratama', role: 'kepala_unit', unit: 'IGD' },
      { username: 'manajemen1', password: '12345', name: 'Hj. Fatimah', role: 'manajemen', unit: 'Direksi' },
    ];
    for (const user of seedUsers) {
      const id = uuidv4();
      const password = require('bcryptjs').hashSync(user.password, 10);
      execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.username, password, user.name, user.role, user.unit]);
    }
    console.log(`Seeded ${seedUsers.length} default users`);
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
