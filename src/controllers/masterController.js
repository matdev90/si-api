const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ruangan = require('../models/Ruangan');

const masterController = {
  // ===== RUANGAN =====
  async listRuangan(req, res, next) {
    try {
      const rows = Ruangan.findAll();
      res.json({ data: rows });
    } catch (err) { next(err); }
  },

  async getRuangan(req, res, next) {
    try {
      const row = Ruangan.findById(req.params.id);
      if (!row) return res.status(404).json({ error: 'Ruangan tidak ditemukan' });
      res.json(row);
    } catch (err) { next(err); }
  },

  async createRuangan(req, res, next) {
    try {
      const { name, description } = req.validated;
      const existing = Ruangan.findAll().find(r => r.name.toLowerCase() === name.toLowerCase());
      if (existing) return res.status(409).json({ error: 'Ruangan sudah ada' });
      const ruangan = Ruangan.create({ name, description });
      res.status(201).json(ruangan);
    } catch (err) { next(err); }
  },

  async updateRuangan(req, res, next) {
    try {
      const existing = Ruangan.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Ruangan tidak ditemukan' });
      Ruangan.update(req.params.id, req.validated);
      res.json({ ...existing, ...req.validated });
    } catch (err) { next(err); }
  },

  async deleteRuangan(req, res, next) {
    try {
      const existing = Ruangan.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Ruangan tidak ditemukan' });
      Ruangan.delete(req.params.id);
      res.json({ message: 'Ruangan berhasil dihapus' });
    } catch (err) { next(err); }
  },

  // ===== USERS =====
  async listUsers(req, res, next) {
    try {
      const rows = User.findAll();
      res.json({ data: rows });
    } catch (err) { next(err); }
  },

  async getUser(req, res, next) {
    try {
      const user = User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
      res.json(user);
    } catch (err) { next(err); }
  },

  async createUser(req, res, next) {
    try {
      const { username, password, name, role, unit, ruangan_id } = req.validated;
      const existing = User.findByUsername(username);
      if (existing) return res.status(409).json({ error: 'Username sudah digunakan' });
      const hashed = await bcrypt.hash(password, 10);
      const user = User.create({ id: uuidv4(), username, password: hashed, name, role, unit, ruangan_id });
      res.status(201).json(user);
    } catch (err) { next(err); }
  },

  async updateUser(req, res, next) {
    try {
      const existing = User.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });
      const fields = { ...req.validated };
      if (fields.password) {
        fields.password = await bcrypt.hash(fields.password, 10);
      } else {
        delete fields.password;
      }
      User.update(req.params.id, fields);
      const updated = User.findById(req.params.id);
      res.json(updated);
    } catch (err) { next(err); }
  },

  async deleteUser(req, res, next) {
    try {
      const existing = User.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'User tidak ditemukan' });
      if (existing.id === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
      User.delete(req.params.id);
      res.json({ message: 'User berhasil dihapus' });
    } catch (err) { next(err); }
  },
};

module.exports = masterController;
