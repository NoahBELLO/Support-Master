const messageService = require('../../src/modules/messages/message.service');
const messageRepo = require('../../src/modules/messages/message.repository');
const ticketRepo = require('../../src/modules/tickets/ticket.repository');
const AppError = require('../../src/utils/AppError');

jest.mock('../../src/modules/messages/message.repository');
jest.mock('../../src/modules/tickets/ticket.repository');

describe('MessageService', () => {
  beforeEach(() => jest.clearAllMocks());

  const client = { id: 'client-id', role: 'client' };
  const agent = { id: 'agent-id', role: 'agent' };
  const openTicket = { id: 'ticket-1', created_by: 'client-id', status: 'open' };
  const closedTicket = { id: 'ticket-2', created_by: 'client-id', status: 'closed' };

  describe('addMessage', () => {
    it('ajoute un message dans un ticket ouvert', async () => {
      ticketRepo.findById.mockResolvedValue(openTicket);
      messageRepo.create.mockResolvedValue({ id: 'msg-1', content: 'Hello', is_internal: false });

      const result = await messageService.addMessage(
        { ticketId: 'ticket-1', content: 'Hello', isInternal: false }, client
      );

      expect(result.id).toBe('msg-1');
    });

    it('interdit un message sur un ticket fermé', async () => {
      ticketRepo.findById.mockResolvedValue(closedTicket);

      await expect(
        messageService.addMessage({ ticketId: 'ticket-2', content: 'Hello' }, client)
      ).rejects.toThrow(AppError);
    });

    it('force is_internal=false pour un client même si demandé', async () => {
      ticketRepo.findById.mockResolvedValue(openTicket);
      messageRepo.create.mockResolvedValue({ id: 'msg-1', is_internal: false });

      await messageService.addMessage(
        { ticketId: 'ticket-1', content: 'Hello', isInternal: true }, client
      );

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isInternal: false })
      );
    });

    it('permet à un agent de créer une note interne', async () => {
      ticketRepo.findById.mockResolvedValue(openTicket);
      messageRepo.create.mockResolvedValue({ id: 'msg-1', is_internal: true });

      await messageService.addMessage(
        { ticketId: 'ticket-1', content: 'Note interne', isInternal: true }, agent
      );

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isInternal: true })
      );
    });

    it('lève 404 si ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      await expect(
        messageService.addMessage({ ticketId: 'bad-id', content: 'Hello' }, client)
      ).rejects.toThrow(AppError);
    });

    it("interdit à un client de répondre sur le ticket d'un autre", async () => {
      ticketRepo.findById.mockResolvedValue({ id: 'ticket-x', created_by: 'other-id', status: 'open' });

      await expect(
        messageService.addMessage({ ticketId: 'ticket-x', content: 'Hello' }, client)
      ).rejects.toThrow(AppError);
    });
  });

  describe('listMessages', () => {
    it('exclut les notes internes pour un client', async () => {
      ticketRepo.findById.mockResolvedValue(openTicket);
      messageRepo.findByTicket.mockResolvedValue([]);

      await messageService.listMessages('ticket-1', client);

      expect(messageRepo.findByTicket).toHaveBeenCalledWith('ticket-1', false);
    });

    it('inclut les notes internes pour un agent', async () => {
      ticketRepo.findById.mockResolvedValue(openTicket);
      messageRepo.findByTicket.mockResolvedValue([]);

      await messageService.listMessages('ticket-1', agent);

      expect(messageRepo.findByTicket).toHaveBeenCalledWith('ticket-1', true);
    });

    it('lève 404 si ticket introuvable', async () => {
      ticketRepo.findById.mockResolvedValue(null);

      await expect(messageService.listMessages('bad-id', agent)).rejects.toThrow(AppError);
    });
  });
});
