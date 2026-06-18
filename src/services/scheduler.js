const cron = require('node-cron');
const { query } = require('../config/database');
const { notifyDeadline } = require('./notificationService');
const logger = require('../utils/logger');

function startScheduler() {
  logger.info('Starting deadline notification scheduler (daily at 07:00)');

  cron.schedule('0 7 * * *', async () => {
    try {
      const now = new Date().toISOString().split('T')[0];
      const alertDays = [1, 3, 7];

      for (const daysLeft of alertDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysLeft);
        const targetStr = targetDate.toISOString().split('T')[0];

        const rows = query(`SELECT id, incident_id FROM investigations
          WHERE deadline = ? AND status = 'berlangsung'`, [targetStr]);

        for (const inv of rows) {
          await notifyDeadline(inv.incident_id, inv.id, daysLeft);
        }

        if (rows.length > 0) {
          logger.info(`Deadline notifications sent for ${rows.length} investigations (${daysLeft} days remaining)`);
        }
      }

      const overdue = query(`SELECT inv.id, inv.incident_id, inv.deadline
        FROM investigations inv WHERE inv.deadline < ? AND inv.status = 'berlangsung'`, [now]);

      for (const inv of overdue) {
        await notifyDeadline(inv.incident_id, inv.id, 0);
      }

      if (overdue.length > 0) {
        logger.info(`Overdue notifications sent for ${overdue.length} investigations`);
      }
    } catch (err) {
      logger.error({ err }, 'Deadline scheduler error');
    }
  });

  logger.info('Scheduler started successfully');
}

module.exports = { startScheduler };
