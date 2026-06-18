const Investigation = require('../models/Investigation');
const Incident = require('../models/Incident');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function complete(req, res, next) {
  try {
    const { root_cause, recommendations, action_plan, faktor_kontributor, pic_name, pic_role, follow_up_actions, follow_up_deadline, management_review } = req.validated;

    const investigation = await Investigation.findById(req.params.id);
    if (!investigation) throw new AppError('Investigation not found', 404);
    if (investigation.status === 'selesai') throw new AppError('Investigation already completed', 409);

    await Investigation.update(req.params.id, {
      root_cause,
      recommendations,
      action_plan: action_plan || null,
      faktor_kontributor: faktor_kontributor ? JSON.stringify(faktor_kontributor) : null,
      pic_name: pic_name || null,
      pic_role: pic_role || null,
      follow_up_actions: follow_up_actions || null,
      follow_up_deadline: follow_up_deadline || null,
      management_review: management_review ? 1 : 0,
      completed_at: new Date().toISOString(),
      status: 'selesai',
    });

    await Incident.update(investigation.incident_id, { status: 'selesai' });

    logger.info({ investigationId: req.params.id, incidentId: investigation.incident_id }, 'Investigation completed');
    res.json({ id: req.params.id, status: 'selesai' });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    filters.offset = (pageNum - 1) * limitNum;
    filters.limit = limitNum;

    const { rows: data, total } = await Investigation.findAll(filters);

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await Investigation.findById(req.params.id);
    if (!data) throw new AppError('Investigation not found', 404);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { complete, list, getById };
