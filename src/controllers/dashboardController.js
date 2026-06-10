const Incident = require('../models/Incident');

async function stats(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const filters = {};

    if (req.user.role === 'kepala_unit') {
      filters.unit = req.user.unit;
    }

    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const data = await Incident.getStats(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function trends(req, res, next) {
  try {
    const period = req.query.period || 'monthly';
    const unit = req.user.role === 'kepala_unit' ? req.user.unit : req.query.unit;

    const data = await Incident.getTrends(period, unit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, trends };
