const { query, execute } = require('../config/database');

const Incident = {
  findAll(filters = {}) {
    let baseSql = `FROM incidents i LEFT JOIN users u ON i.reporter_id = u.id LEFT JOIN ruangan r ON i.ruangan_id = r.id LEFT JOIN ruangan ru ON u.ruangan_id = ru.id WHERE 1=1`;
    const params = [];

    if (filters.unit) { baseSql += ` AND COALESCE(ru.name, u.unit) = ?`; params.push(filters.unit); }
    if (filters.ruangan_id) { baseSql += ` AND i.ruangan_id = ?`; params.push(filters.ruangan_id); }
    if (filters.location) { baseSql += ` AND COALESCE(r.name, i.location) LIKE ?`; params.push(`%${filters.location}%`); }
    if (filters.status) { baseSql += ` AND i.status = ?`; params.push(filters.status); }
    if (filters.severity) { baseSql += ` AND i.severity = ?`; params.push(filters.severity); }
    if (filters.incident_type) { baseSql += ` AND i.incident_type = ?`; params.push(filters.incident_type); }
    if (filters.start_date) { baseSql += ` AND i.incident_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { baseSql += ` AND i.incident_date <= ?`; params.push(filters.end_date); }
    if (filters.search) {
      baseSql += ` AND (i.description LIKE ? OR COALESCE(r.name, i.location) LIKE ? OR i.incident_type LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const countSql = `SELECT COUNT(*) as total ${baseSql}`;
    const countResult = query(countSql, params);
    const total = countResult[0]?.total || 0;

    let sql = `SELECT i.*, u.name as reporter_name, u.unit as reporter_unit, COALESCE(r.name, i.location) as current_location ${baseSql}`;
    sql += ` ORDER BY i.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filters.limit, filters.offset || 0);
    }

    const rows = query(sql, params);

    return { rows, total };
  },

  findById(id) {
    const rows = query(`SELECT i.*, u.name as reporter_name, u.unit as reporter_unit, COALESCE(r.name, i.location) as current_location
      FROM incidents i LEFT JOIN users u ON i.reporter_id = u.id LEFT JOIN ruangan r ON i.ruangan_id = r.id WHERE i.id = ?`, [id]);
    return rows[0] || null;
  },

  create({ id, reporter_id, is_anonymous, incident_type, incident_date, incident_time, location, description, consequence, immediate_action, attachments,
    no_rm, umur, jenis_kelamin, penanggung_biaya, tgl_masuk_rs, jam_masuk_rs, ruangan_id,
    probabilitas, dampak, grade_otomatis, severity, akibat_insiden, tindakan_awal, tindakan_oleh, pernah_terjadi, pencegahan_ulang,
    incident_summary, tipe_insiden, subtipe_insiden, spesialisasi, unit_penyebab, first_reporter }) {
    execute(`INSERT INTO incidents (id, reporter_id, is_anonymous, incident_type, incident_date, incident_time, location, description, consequence, immediate_action, attachments,
      no_rm, umur, jenis_kelamin, penanggung_biaya, tgl_masuk_rs, jam_masuk_rs, ruangan_id,
      probabilitas, dampak, grade_otomatis, severity, akibat_insiden, tindakan_awal, tindakan_oleh, pernah_terjadi, pencegahan_ulang,
      incident_summary, tipe_insiden, subtipe_insiden, spesialisasi, unit_penyebab, first_reporter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?)`,
      [id, reporter_id, is_anonymous ? 1 : 0, incident_type, incident_date, incident_time, location, description, consequence, immediate_action, attachments,
        no_rm || null, umur || null, jenis_kelamin || null, penanggung_biaya || null, tgl_masuk_rs || null, jam_masuk_rs || null, ruangan_id || null,
        probabilitas || null, dampak || null, grade_otomatis || null, severity || null, akibat_insiden || null, tindakan_awal || null, tindakan_oleh || null, pernah_terjadi || 'Tidak', pencegahan_ulang || null,
        incident_summary || null, tipe_insiden || null, subtipe_insiden || null, spesialisasi || null, unit_penyebab || null, first_reporter || null]);
    return { id, incident_type, incident_date, incident_time, location, description, consequence, immediate_action, status: 'dilaporkan',
      is_anonymous: !!is_anonymous, no_rm, umur, jenis_kelamin, penanggung_biaya, severity,
      probabilitas, dampak, grade_otomatis, akibat_insiden, tindakan_awal, tindakan_oleh, pernah_terjadi, pencegahan_ulang,
      incident_summary, tipe_insiden, subtipe_insiden, spesialisasi, unit_penyebab, first_reporter };
  },

  delete(id) {
    execute(`DELETE FROM incidents WHERE id = ?`, [id]);
  },

  update(id, fields) {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    execute(`UPDATE incidents SET ${sets}, updated_at = datetime('now') WHERE id = ?`, [...values, id]);
  },

  getStats(filters = {}) {
    let sql = `SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN status = 'dilaporkan' THEN 1 ELSE 0 END), 0) as baru,
      COALESCE(SUM(CASE WHEN status IN ('divalidasi','investigasi') THEN 1 ELSE 0 END), 0) as diproses,
      COALESCE(SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END), 0) as selesai,
      COALESCE(SUM(CASE WHEN severity = 'merah' THEN 1 ELSE 0 END), 0) as merah,
      COALESCE(SUM(CASE WHEN severity = 'kuning' THEN 1 ELSE 0 END), 0) as kuning,
      COALESCE(SUM(CASE WHEN severity = 'hijau' THEN 1 ELSE 0 END), 0) as hijau,
      COALESCE(SUM(CASE WHEN severity = 'biru' THEN 1 ELSE 0 END), 0) as biru
      FROM incidents i LEFT JOIN users u ON i.reporter_id = u.id LEFT JOIN ruangan r ON u.ruangan_id = r.id WHERE 1=1`;
    const params = [];

    if (filters.unit) { sql += ` AND COALESCE(r.name, u.unit) = ?`; params.push(filters.unit); }
    if (filters.start_date) { sql += ` AND i.incident_date >= ?`; params.push(filters.start_date); }
    if (filters.end_date) { sql += ` AND i.incident_date <= ?`; params.push(filters.end_date); }

    const rows = query(sql, params);
    return rows[0] || { total: 0 };
  },

  getTrends(period = 'monthly', unit = null) {
    const dateFormat = period === 'yearly' ? '%Y' : '%Y-%m';
    let sql = `SELECT strftime('${dateFormat}', i.incident_date) as periode,
      COUNT(*) as total,
      SUM(CASE WHEN i.severity = 'merah' THEN 1 ELSE 0 END) as merah,
      SUM(CASE WHEN i.severity = 'kuning' THEN 1 ELSE 0 END) as kuning,
      SUM(CASE WHEN i.severity = 'hijau' THEN 1 ELSE 0 END) as hijau,
      SUM(CASE WHEN i.severity = 'biru' THEN 1 ELSE 0 END) as biru
      FROM incidents i LEFT JOIN users u ON i.reporter_id = u.id LEFT JOIN ruangan r ON u.ruangan_id = r.id WHERE 1=1`;
    const params = [];

    if (unit) { sql += ` AND COALESCE(r.name, u.unit) = ?`; params.push(unit); }

    sql += ` GROUP BY periode ORDER BY periode DESC LIMIT 12`;

    return query(sql, params);
  }
};

module.exports = Incident;
