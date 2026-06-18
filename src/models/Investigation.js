const { query, execute } = require('../config/database');

const Investigation = {
  findAll(filters = {}) {
    let baseSql = `FROM investigations inv
      JOIN incidents i ON inv.incident_id = i.id
      LEFT JOIN users u ON inv.investigator_id = u.id WHERE 1=1`;
    const params = [];

    if (filters.status) { baseSql += ` AND inv.status = ?`; params.push(filters.status); }
    if (filters.type) { baseSql += ` AND inv.type = ?`; params.push(filters.type); }

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const countResult = query(countSql, params);
    const total = countResult[0]?.total || 0;

    let sql = `SELECT inv.*, i.incident_type, i.severity, i.description as incident_description,
      u.name as investigator_name ${baseSql}`;
    sql += ` ORDER BY inv.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filters.limit, filters.offset || 0);
    }

    const rows = query(sql, params);
    return { rows, total };
  },

  findById(id) {
    const rows = query(`SELECT inv.*, i.incident_type, i.severity, i.description as incident_description,
      u.name as investigator_name
      FROM investigations inv
      JOIN incidents i ON inv.incident_id = i.id
      LEFT JOIN users u ON inv.investigator_id = u.id
      WHERE inv.id = ?`, [id]);
    return rows[0] || null;
  },

  findByIncidentId(incidentId) {
    const rows = query(`SELECT * FROM investigations WHERE incident_id = ?`, [incidentId]);
    return rows[0] || null;
  },

  create({ id, incident_id, investigator_id, type, deadline }) {
    execute(`INSERT INTO investigations (id, incident_id, investigator_id, type, deadline)
      VALUES (?, ?, ?, ?, ?)`, [id, incident_id, investigator_id, type, deadline]);
    return { id, incident_id, type, status: 'berlangsung' };
  },

  update(id, fields) {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields).map(v => v === undefined ? null : v);
    execute(`UPDATE investigations SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
  }
};

module.exports = Investigation;
