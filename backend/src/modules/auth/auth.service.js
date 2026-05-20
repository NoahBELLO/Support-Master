const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const userRepo = require('./auth.repository');

const register = async ({ name, email, password }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new AppError('Email déjà utilisé', 409);
  const hashed = await bcrypt.hash(password, 12);
  const user = await userRepo.create({ name, email, password: hashed });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, user };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError('Identifiants invalides', 401);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Identifiants invalides', 401);
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  return { token, user: safeUser };
};

const me = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return user;
};

module.exports = { register, login, me };
