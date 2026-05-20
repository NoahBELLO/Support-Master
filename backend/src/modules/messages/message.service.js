const AppError = require('../../utils/AppError');
const messageRepo = require('./message.repository');
const ticketRepo = require('../tickets/ticket.repository');

const addMessage = async ({ ticketId, content, isInternal }, user) => {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError('Ticket introuvable', 404);
  if (user.role === 'client' && ticket.created_by !== user.id) {
    throw new AppError('Accès refusé', 403);
  }
  if (ticket.status === 'closed') throw new AppError('Ticket fermé', 400);

  const internal = Boolean(isInternal) && user.role !== 'client';
  return messageRepo.create({ ticketId, userId: user.id, content, isInternal: internal });
};

const listMessages = async (ticketId, user) => {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError('Ticket introuvable', 404);
  if (user.role === 'client' && ticket.created_by !== user.id) {
    throw new AppError('Accès refusé', 403);
  }
  return messageRepo.findByTicket(ticketId, user.role !== 'client');
};

module.exports = { addMessage, listMessages };
