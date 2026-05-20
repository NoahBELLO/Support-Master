const AppError = require('../../utils/AppError');
const ticketRepo = require('./ticket.repository');

const createTicket = async (data, user) => {
  return ticketRepo.create({ ...data, createdBy: user.id });
};

const listTickets = async (user, query = {}) => {
  const filters = {};
  if (query.status) filters.status = query.status;
  if (user.role === 'client') filters.createdBy = user.id;
  return ticketRepo.findAll(filters);
};

const getTicket = async (id, user) => {
  const ticket = await ticketRepo.findById(id);
  if (!ticket) throw new AppError('Ticket introuvable', 404);
  if (user.role === 'client' && ticket.created_by !== user.id) {
    throw new AppError('Accès refusé', 403);
  }
  return ticket;
};

const updateTicket = async (id, data, user) => {
  const ticket = await ticketRepo.findById(id);
  if (!ticket) throw new AppError('Ticket introuvable', 404);

  if (user.role === 'client') {
    if (ticket.created_by !== user.id) throw new AppError('Accès refusé', 403);
    if (ticket.status !== 'open') throw new AppError('Ticket non modifiable', 400);
    const clientFields = {};
    if (data.title !== undefined) clientFields.title = data.title;
    if (data.description !== undefined) clientFields.description = data.description;
    return ticketRepo.update(id, clientFields);
  }

  const fields = {};
  if (data.title !== undefined) fields.title = data.title;
  if (data.description !== undefined) fields.description = data.description;
  if (data.status !== undefined) {
    fields.status = data.status;
    if (['closed', 'resolved'].includes(data.status)) {
      fields.closed_at = new Date().toISOString();
    }
  }
  if (data.priority !== undefined) fields.priority = data.priority;
  if (data.categoryId !== undefined) fields.category_id = data.categoryId;
  if (data.assignedTo !== undefined) fields.assigned_to = data.assignedTo;

  return ticketRepo.update(id, fields);
};

const deleteTicket = async (id) => {
  const ticket = await ticketRepo.findById(id);
  if (!ticket) throw new AppError('Ticket introuvable', 404);
  await ticketRepo.remove(id);
};

module.exports = { createTicket, listTickets, getTicket, updateTicket, deleteTicket };
