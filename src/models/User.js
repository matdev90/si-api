const { query, execute } = require('../config/database');

const User = {
  findAll() {
    return query(`SELECT id, username, name, role, unit, is_active, created_at FROM users ORDER BY created_at DESC`);
  },

  findById(id) {
    const rows = query(`SELECT id, username, name, role, unit, is_active, created_at FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  findByUsername(username) {
    const rows = query(`SELECT * FROM users WHERE username = ?`, [username]);
    return rows[0] || null;
  },

  create({ id, username, password, name, role, unit }) {
    execute(`INSERT INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, username, password, name, role, unit]);
    return { id, username, name, role, unit };
  },

  update(id, fields) {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    execute(`UPDATE users SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
  },

  delete(id) {
    execute(`DELETE FROM users WHERE id = ?`, [id]);
  }
};

module.exports = User;
