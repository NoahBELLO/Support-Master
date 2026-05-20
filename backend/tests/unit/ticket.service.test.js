const ticketService = require('../../src/modules/tickets/ticket.service');
const ticketRepo = require('../../src/modules/tickets/ticket.repository');
const AppError = require('../../src/utils/AppError');

jest.mock('../../src/modules/tickets/ticket.repository');

describe('TicketService', () => {
  beforeEach(() => jest.clearAllMocks());

  const admin = { id: 'admin-id', role: 'admin' };
  const agent = { id: 'agent-id', role: 'agent' };
  const client = { id: 'client-id', role: 'client' };

  describe('createTicket', () => {
    it('crée un ticket avec l\'id du créateur', async () => {
      const ticket = { id: 'ticket-1', title: 'Bug critique', created_by: 'client-id' };
      ticketRepo.create.mockResolvedValue(ticket);

      const result = await ticketService.createTicket(
        { title: 'Bug critique', description: 'Description longue' }, client
      );

      expect(ticketRepo.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'client-id' }));
      expect(result.id).toBe('ticket-1');
    });
  });

  describe('listTickets', () => {
    it('un client ne voit que ses propres tickets', async () => {
      ticketRepo.findAll.mockResolvedValue([]);

      await ticketService.listTickets(client);

      expect(ticketRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'client-id' })
      );
    });

    it('un admin voit tous les tickets sans filtre', async () => {
      ticketRepo.findAll.mockResolvedValue([]);

      await ticketService.listTickets(admin);

      expect(ticketRepo.findAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ createdBy: expect.anything() })
      );
    });

    it('un agent voit tous les tickets sans filtre', async () => {
      ticketRepo.findAll.mockResolvedValue([]);

      await ticketService.listTickets(agent);

      expect(ticketRepo.findAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ createdBy: expect.anything() })
      );
    });
  });

  describe('getTicket', () => {
    it('retourne un ticket par id', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'client-id' });

      const result = await ticketService.getTicket('ticket-1', client);

      expect(result.id).toBe('ticket-1');
    });

    it('lève 404 si ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      await expect(ticketService.getTicket('nonexistent', admin)).rejects.toThrow(AppError);
    });

    it("interdit l'accès à un ticket d'un autre client", async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-client' });

      await expect(ticketService.getTicket('ticket-1', client)).rejects.toThrow(AppError);
    });

    it('un admin peut accéder à n\'importe quel ticket', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-client' });

      await expect(ticketService.getTicket('ticket-1', admin)).resolves.not.toThrow();
    });
  });

  describe('updateTicket', () => {
    it('un agent peut changer le statut d\'un ticket', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'c-id', status: 'open' });
      ticketRepo.update.mockResolvedValue({ id: 'ticket-1', status: 'in_progress' });

      const result = await ticketService.updateTicket('ticket-1', { status: 'in_progress' }, agent);

      expect(result.status).toBe('in_progress');
    });

    it('un client ne peut pas modifier un ticket fermé', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'client-id', status: 'closed' });

      await expect(
        ticketService.updateTicket('ticket-1', { title: 'New title' }, client)
      ).rejects.toThrow(AppError);
    });

    it("un client ne peut pas modifier le ticket d'un autre", async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1', created_by: 'other-id', status: 'open' });

      await expect(
        ticketService.updateTicket('ticket-1', { title: 'New' }, client)
      ).rejects.toThrow(AppError);
    });

    it('lève 404 si ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      await expect(ticketService.updateTicket('bad-id', {}, admin)).rejects.toThrow(AppError);
    });
  });

  describe('deleteTicket', () => {
    it('supprime un ticket existant', async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-1' });
      ticketRepo.remove.mockResolvedValue();

      await expect(ticketService.deleteTicket('ticket-1')).resolves.not.toThrow();
      expect(ticketRepo.remove).toHaveBeenCalledWith('ticket-1');
    });

    it('lève 404 si ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      await expect(ticketService.deleteTicket('nonexistent')).rejects.toThrow(AppError);
    });
  });
});
