const { query, execute } = require('../config/database');

const Settings = {
  getAll() {
    const rows = query('SELECT key, value FROM settings');
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  get(key) {
    const rows = query('SELECT value FROM settings WHERE key = ?', [key]);
    return rows[0]?.value || null;
  },

  set(key, value) {
    execute(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`, [key, value]);
  }
};

module.exports = Settings;
