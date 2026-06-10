const { Router } = require('express');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./auth');
const incidentRoutes = require('./incidents');
const dashboardRoutes = require('./dashboard');
const investigationRoutes = require('./investigations');
const exportRoutes = require('./export');
const notificationRoutes = require('./notifications');
const masterRoutes = require('./master');
const laporanRoutes = require('./laporan');
const settingsRoutes = require('./settings');
const swaggerSpec = require('../config/swagger');

const router = Router();

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SI-API Docs',
}));

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/investigations', investigationRoutes);
router.use('/export', exportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/master', masterRoutes);
router.use('/laporan', laporanRoutes);
router.use('/settings', settingsRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
