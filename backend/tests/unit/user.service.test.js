const userService = require('../../src/modules/users/user.service');
const userRepo = require('../../src/modules/users/user.repository');
const AppError = require('../../src/utils/AppError');

jest.mock('../../src/modules/users/user.repository');

describe('UserService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listUsers', () => {
    it('retourne tous les utilisateurs', async () => {
      userRepo.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await userService.listUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('getUser', () => {
    it('retourne un utilisateur existant', async () => {
      userRepo.findById.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const result = await userService.getUser('1');

      expect(result.id).toBe('1');
    });

    it('lève 404 si introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(userService.getUser('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('updateUser', () => {
    it('met à jour un utilisateur', async () => {
      userRepo.findById.mockResolvedValue({ id: '1' });
      userRepo.update.mockResolvedValue({ id: '1', name: 'Updated', role: 'agent' });

      const result = await userService.updateUser('1', { name: 'Updated', role: 'agent' });

      expect(result.name).toBe('Updated');
    });

    it('lève 404 si utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(userService.updateUser('nonexistent', { name: 'X' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    it('supprime un utilisateur existant', async () => {
      userRepo.findById.mockResolvedValue({ id: '1' });
      userRepo.remove.mockResolvedValue();

      await expect(userService.deleteUser('1')).resolves.not.toThrow();
      expect(userRepo.remove).toHaveBeenCalledWith('1');
    });

    it('lève 404 si utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow(AppError);
    });
  });
});
