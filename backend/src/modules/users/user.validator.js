const Joi = require('joi');

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('admin', 'agent', 'client'),
}).min(1);

module.exports = { updateSchema };
