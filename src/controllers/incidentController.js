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
    const grade = data.grade_otomatis || (
      data.probabilitas && data.dampak
        ? (() => { const s = data.probabilitas * data.dampak; return s <= 4 ? 'biru' : s <= 8 ? 'hijau' : s <= 15 ? 'kuning' : 'merah'; })()
        : null
    );
    const severity = grade || null;

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
      no_rm: data.no_rm,
      umur: data.umur,
      jenis_kelamin: data.jenis_kelamin,
      penanggung_biaya: data.penanggung_biaya,
      tgl_masuk_rs: data.tgl_masuk_rs,
      jam_masuk_rs: data.jam_masuk_rs,
      ruangan_id: data.ruangan_id,
      probabilitas: data.probabilitas,
      dampak: data.dampak,
      grade_otomatis: grade,
      severity,
      akibat_insiden: data.akibat_insiden,
      tindakan_awal: data.tindakan_awal,
      tindakan_oleh: data.tindakan_oleh,
      pernah_terjadi: data.pernah_terjadi || 'Tidak',
      pencegahan_ulang: data.pencegahan_ulang,
      incident_summary: data.incident_summary,
      tipe_insiden: data.tipe_insiden,
      subtipe_insiden: data.subtipe_insiden,
      spesialisasi: data.spesialisasi,
      unit_penyebab: data.unit_penyebab,
      first_reporter: data.first_reporter,
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
    const { status, severity, incident_type, unit, location, ruangan_id, start_date, end_date, search, page = '1', limit = '20' } = req.query;
    const filters = {};

    if (req.user.role === 'kepala_unit' || req.user.role === 'pelapor') {
      filters.unit = req.user.unit;
    }

    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (incident_type) filters.incident_type = incident_type;
    if (unit && ['admin', 'pmkp', 'manajemen'].includes(req.user.role)) filters.unit = unit;
    if (location) filters.location = location;
    if (ruangan_id && ['admin', 'pmkp', 'manajemen'].includes(req.user.role)) filters.ruangan_id = ruangan_id;
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

    const isRegrade = !!incident.severity;
    const result = await gradeIncident(req.params.id, severity, req.user.id, isRegrade);
    logger.info({ incidentId: req.params.id, severity, by: req.user.id, regrade: isRegrade }, 'Incident graded');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

const validTransitions = {
  dilaporkan: ['divalidasi', 'ditolak'],
  divalidasi: ['investigasi', 'ditolak'],
  investigasi: ['ditindaklanjuti', 'ditolak'],
  ditindaklanjuti: ['selesai', 'ditolak'],
  selesai: [],
  ditolak: [],
};

async function updateStatus(req, res, next) {
  try {
    const { status } = req.validated;

    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);
    if (incident.status === status) {
      return res.json({ id: req.params.id, status });
    }

    const allowed = validTransitions[incident.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`Status cannot be changed from "${incident.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`, 400);
    }

    await Incident.update(req.params.id, { status });
    logger.info({ incidentId: req.params.id, from: incident.status, to: status, by: req.user.id }, 'Incident status updated');
    res.json({ id: req.params.id, status });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found', 404);
    await Incident.delete(req.params.id);
    logger.info({ incidentId: req.params.id, by: req.user.id }, 'Incident deleted');
    res.json({ id: req.params.id, deleted: true });
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, grade, updateStatus, remove };
