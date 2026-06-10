const { query, execute } = require('../config/database');

const Notification = {
  findByUserId(userId, limit = 20) {
    return query(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, [userId, limit]);
  },

  create({ id, user_id, incident_id, type, message }) {
    execute(`INSERT INTO notifications (id, user_id, incident_id, type, message) VALUES (?, ?, ?, ?, ?)`,
      [id, user_id, incident_id, type, message]);
  },

  markAsRead(id) {
    execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
  },

  markAllAsRead(userId) {
    execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
  },

  getUnreadCount(userId) {
    const rows = query(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`, [userId]);
    return rows[0]?.count || 0;
  }
};

module.exports = Notification;
