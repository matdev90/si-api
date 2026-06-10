const { v4: uuidv4 } = require('uuid');
const { query, execute } = require('../config/database');

const Ruangan = {
  findAll(activeOnly = false) {
    let sql = `SELECT * FROM ruangan WHERE 1=1`;
    const params = [];
    if (activeOnly) { sql += ` AND is_active = 1`; }
    sql += ` ORDER BY name ASC`;
    return query(sql, params);
  },

  findById(id) {
    const rows = query(`SELECT * FROM ruangan WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  create({ name, description }) {
    const id = uuidv4();
    execute(`INSERT INTO ruangan (id, name, description) VALUES (?, ?, ?)`, [id, name, description || null]);
    return { id, name, description, is_active: 1 };
  },

  update(id, fields) {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    execute(`UPDATE ruangan SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
  },

  delete(id) {
    execute(`DELETE FROM ruangan WHERE id = ?`, [id]);
  }
};

module.exports = Ruangan;
