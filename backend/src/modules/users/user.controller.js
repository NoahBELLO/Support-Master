const userService = require('./user.service');

const list = async (req, res, next) => {
  try { res.json(await userService.listUsers()); }
  catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try { res.json(await userService.getUser(req.params.id)); }
  catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { res.json(await userService.updateUser(req.params.id, req.body)); }
  catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { list, getOne, update, remove };
