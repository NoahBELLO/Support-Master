const AppError = require('../../utils/AppError');
const categoryRepo = require('./category.repository');

const listCategories = async () => categoryRepo.findAll();

const createCategory = async (data) => categoryRepo.create(data);

const updateCategory = async (id, data) => {
  const cat = await categoryRepo.findById(id);
  if (!cat) throw new AppError('Catégorie introuvable', 404);
  return categoryRepo.update(id, data);
};

const deleteCategory = async (id) => {
  const cat = await categoryRepo.findById(id);
  if (!cat) throw new AppError('Catégorie introuvable', 404);
  await categoryRepo.remove(id);
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
