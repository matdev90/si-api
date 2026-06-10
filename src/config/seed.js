const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getDatabase, execute, query } = require('./database');
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

async function seed() {
  await getDatabase();

  for (const user of seedUsers) {
    const existing = query(`SELECT id FROM users WHERE username = ?`, [user.username]);
    if (existing.length === 0) {
      const id = uuidv4();
      const password = await bcrypt.hash(user.password, 10);
      execute(`INSERT INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.username, password, user.name, user.role, user.unit]);
      console.log(`Seeded user: ${user.username} (${user.role})`);
    }
  }

  console.log('Seed completed.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
