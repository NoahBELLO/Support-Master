const categoryService = require('./category.service');

const list = async (req, res, next) => {
  try { res.json(await categoryService.listCategories()); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await categoryService.createCategory(req.body)); }
  catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { res.json(await categoryService.updateCategory(req.params.id, req.body)); }
  catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { list, create, update, remove };
