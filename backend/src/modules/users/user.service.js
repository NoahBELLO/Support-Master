const AppError = require('../../utils/AppError');
const userRepo = require('./user.repository');

const listUsers = async () => userRepo.findAll();

const getUser = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return user;
};

const updateUser = async (id, data) => {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return userRepo.update(id, data);
};

const deleteUser = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  await userRepo.remove(id);
};

module.exports = { listUsers, getUser, updateUser, deleteUser };
