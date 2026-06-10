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

async function updateSettings(req, res, next) {
  try {
    const { hospital_name } = req.validated;
    if (hospital_name && hospital_name.trim()) {
      Settings.set('hospital_name', hospital_name.trim());
    }
    const settings = Settings.getAll();
    logger.info(`Hospital name updated to: ${hospital_name}`);
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
