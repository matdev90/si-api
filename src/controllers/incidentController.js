const { v4: uuidv4 } = require('uuid');
const Incident = require('../models/Incident');
const Investigation = require('../models/Investigation');
const { gradeIncident } = require('../services/gradingService');
const { notifyNewIncident } = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function create(req, res, next) {
  try {
    const data = req.validated;

    const id = uuidv4();
    const incident = await Incident.create({
      id,
      reporter_id: data.is_anonymous ? null : req.user.id,
      is_anonymous: !!data.is_anonymous,
      incident_type: data.incident_type,
      incident_date: data.incident_date,
      incident_time: data.incident_time,
      location: data.location,
      description: data.description,
      consequence: data.consequence,
      immediate_action: data.immediate_action || null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
    });

    await notifyNewIncident(incident);

    logger.info({ incidentId: id, reporter: data.is_anonymous ? 'anonymous' : req.user.id }, 'Incident reported');
    res.status(201).json(incident);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, severity, incident_type, unit, start_date, end_date, search, page = '1', limit = '20' } = req.query;
    const filters = {};

    if (req.user.role === 'kepala_unit') {
      filters.unit = req.user.unit;
    }

    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (incident_type) filters.incident_type = incident_type;
    if (unit && ['admin', 'pmkp', 'manajemen'].includes(req.user.role)) filters.unit = unit;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (search) filters.search = search;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    filters.offset = (pageNum - 1) * limitNum;
    filters.limit = limitNum;

    const { rows: incidents, total } = await Incident.findAll(filters);

    const sanitized = incidents.map(inc => ({
      ...inc,
      reporter_name: inc.is_anonymous ? 'Anonim' : inc.reporter_name,
      reporter_unit: inc.is_anonymous ? '-' : inc.reporter_unit,
    }));

    res.json({
      data: sanitized,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);

    if (incident.is_anonymous) {
      incident.reporter_name = 'Anonim';
      incident.reporter_unit = '-';
    }

    const investigation = await Investigation.findByIncidentId(req.params.id);
    res.json({ ...incident, investigation: investigation || null });
  } catch (err) {
    next(err);
  }
}

async function grade(req, res, next) {
  try {
    const { severity } = req.validated;

    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);
    if (incident.severity) throw new AppError('Incident already graded', 409);

    const result = await gradeIncident(req.params.id, severity, req.user.id);
    logger.info({ incidentId: req.params.id, severity, by: req.user.id }, 'Incident graded');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.validated;

    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);

    await Incident.update(req.params.id, { status });
    logger.info({ incidentId: req.params.id, status, by: req.user.id }, 'Incident status updated');
    res.json({ id: req.params.id, status });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, grade, updateStatus };
