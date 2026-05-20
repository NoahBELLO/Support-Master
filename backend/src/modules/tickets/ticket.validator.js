const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  categoryId: Joi.string().uuid().optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(10),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  categoryId: Joi.string().uuid().allow(null),
  assignedTo: Joi.string().uuid().allow(null),
}).min(1);

module.exports = { createSchema, updateSchema };
