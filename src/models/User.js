const { query, execute } = require('../config/database');

const User = {
  findAll() {
    return query(`SELECT u.id, u.username, u.name, u.role, u.unit, COALESCE(r.name, u.unit) as current_unit, u.ruangan_id, u.is_active, u.created_at FROM users u LEFT JOIN ruangan r ON u.ruangan_id = r.id ORDER BY u.created_at DESC`);
  },

  findById(id) {
    const rows = query(`SELECT u.id, u.username, u.name, u.role, u.unit, COALESCE(r.name, u.unit) as current_unit, u.ruangan_id, u.is_active, u.created_at, u.must_change_password FROM users u LEFT JOIN ruangan r ON u.ruangan_id = r.id WHERE u.id = ?`, [id]);
    return rows[0] || null;
  },

  findByIdWithPassword(id) {
    const rows = query(`SELECT * FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  findByUsername(username) {
    const rows = query(`SELECT u.*, COALESCE(r.name, u.unit) as current_unit FROM users u LEFT JOIN ruangan r ON u.ruangan_id = r.id WHERE u.username = ?`, [username]);
    return rows[0] || null;
  },

  create({ id, username, password, name, role, unit, ruangan_id }) {
    execute(`INSERT INTO users (id, username, password, name, role, unit, ruangan_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, username, password, name, role, unit, ruangan_id || null]);
    return { id, username, name, role, unit, ruangan_id };
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
