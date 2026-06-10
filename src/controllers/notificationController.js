const Notification = require('../models/Notification');

async function list(req, res, next) {
  try {
    const notifications = await Notification.findByUserId(req.user.id);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await Notification.markAsRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
