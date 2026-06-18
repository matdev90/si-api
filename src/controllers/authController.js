const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

async function login(req, res, next) {
  try {
    const { username, password } = req.validated;

    const user = await User.findByUsername(username);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    const currentUnit = user.current_unit || user.unit;

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role, unit: currentUnit },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, unit: currentUnit, ruangan_id: user.ruangan_id },
      mustChangePassword: user.must_change_password === 1
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { username, password, name, role, unit } = req.validated;

    const existing = await User.findByUsername(username);
    if (existing) {
      throw new AppError('Username already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: uuidv4(),
      username,
      password: hashedPassword,
      name,
      role,
      unit
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.validated;
    const user = await User.findByIdWithPassword(req.user.id);
    if (!user) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hashed);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, me, changePassword };
