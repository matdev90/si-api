const path = require('node:path');
const fs = require('node:fs');
const Settings = require('../models/Settings');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function getSettings(req, res, next) {
  try {
    const settings = Settings.getAll();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

const hospitalFields = [
  'hospital_name', 'hospital_ownership', 'hospital_type', 'hospital_class',
  'hospital_bed_capacity', 'hospital_province', 'hospital_code',
];

async function updateSettings(req, res, next) {
  try {
    for (const field of hospitalFields) {
      if (req.validated[field] !== undefined) {
        Settings.set(field, String(req.validated[field]).trim());
      }
    }
    const settings = Settings.getAll();
    logger.info(`Settings updated by ${req.user.id}: ${Object.keys(req.validated).join(', ')}`);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }
    const ext = path.extname(req.file.originalname) || '.png';
    const filename = `logo${ext}`;
    const uploadDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    const logoPath = `/uploads/${filename}`;
    Settings.set('hospital_logo', logoPath);
    const settings = Settings.getAll();
    logger.info(`Hospital logo uploaded: ${logoPath}`);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, uploadLogo };
