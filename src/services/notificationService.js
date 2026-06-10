const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

async function notifyNewIncident(incident) {
  const validators = await User.findAll();
  const targets = validators.filter(u => ['validator', 'pmkp', 'admin'].includes(u.role));

  for (const target of targets) {
    await Notification.create({
      id: uuidv4(),
      user_id: target.id,
      incident_id: incident.id,
      type: 'insiden_baru',
      message: `Insiden baru: ${incident.incident_type} - ${incident.description?.substring(0, 100)}`,
    });
  }

  logger.info(`Notifications sent for incident ${incident.id} to ${targets.length} users`);
}

async function notifyDeadline(incidentId, investigationId, daysLeft) {
  const investigation = await require('../models/Investigation').findById(investigationId);
  if (!investigation) return;

  const pmkpUsers = await User.findAll();
  const targets = pmkpUsers.filter(u => ['pmkp', 'admin', 'kepala_unit'].includes(u.role));

  for (const target of targets) {
    await Notification.create({
      id: uuidv4(),
      user_id: target.id,
      incident_id: incidentId,
      type: 'deadline',
      message: `Investigasi insiden ${incidentId} akan jatuh tempo dalam ${daysLeft} hari`,
    });
  }
}

module.exports = { notifyNewIncident, notifyDeadline };
