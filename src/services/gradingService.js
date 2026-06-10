const { v4: uuidv4 } = require('uuid');
const Incident = require('../models/Incident');
const Investigation = require('../models/Investigation');
const logger = require('../utils/logger');

const gradingRules = {
  biru: { description: 'Tidak terjadi cedera', maxDays: 14, investigationType: 'sederhana' },
  hijau: { description: 'Cedera ringan, tidak perlu penanganan lanjut', maxDays: 14, investigationType: 'sederhana' },
  kuning: { description: 'Cedera sedang, perlu observasi/tindakan', maxDays: 45, investigationType: 'komprehensif' },
  merah: { description: 'Cedera berat/kematian, perlu investigasi penuh', maxDays: 45, investigationType: 'komprehensif' },
};

async function gradeIncident(incidentId, severity, validatorId) {
  const rule = gradingRules[severity];
  if (!rule) throw new Error('Invalid severity grade');

  const incident = await Incident.findById(incidentId);
  if (!incident) throw new Error('Incident not found');

  await Incident.update(incidentId, { severity, status: 'divalidasi' });

  const invId = uuidv4();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + rule.maxDays);

  await Investigation.create({
    id: invId,
    incident_id: incidentId,
    investigator_id: validatorId,
    type: rule.investigationType,
    deadline: deadline.toISOString().split('T')[0],
  });

  logger.info(`Incident ${incidentId} graded as ${severity}, investigation type: ${rule.investigationType}`);

  return { severity, investigationId: invId, type: rule.investigationType, deadline: deadline.toISOString().split('T')[0] };
}

module.exports = { gradeIncident, gradingRules };
