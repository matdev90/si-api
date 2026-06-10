const { query, execute } = require('../config/database');

const User = {
  findAll() {
    return query(`SELECT id, username, name, role, unit, is_active, created_at FROM users ORDER BY created_at DESC`);
  },

  findById(id) {
    const rows = query(`SELECT id, username, name, role, unit, is_active, created_at, must_change_password FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  findByIdWithPassword(id) {
    const rows = query(`SELECT * FROM users WHERE id = ?`, [id]);
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
  },

  updatePassword(id, hashedPassword) {
    execute(`UPDATE users SET password = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`, [hashedPassword, id]);
  }
};

module.exports = User;
