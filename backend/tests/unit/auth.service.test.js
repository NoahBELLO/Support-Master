const authService = require('../../src/modules/auth/auth.service');
const userRepo = require('../../src/modules/auth/auth.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../src/utils/AppError');

jest.mock('../../src/modules/auth/auth.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('crée un utilisateur et retourne un token', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userRepo.create.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', name: 'Test', role: 'client' });
      jwt.sign.mockReturnValue('jwt_token');

      const result = await authService.register({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(result.token).toBe('jwt_token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('lève une erreur 409 si email déjà utilisé', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'uuid-1' });

      await expect(
        authService.register({ name: 'Test', email: 'test@test.com', password: 'password123' })
      ).rejects.toThrow(AppError);
    });

    it('hash le mot de passe avant de sauvegarder', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed');
      userRepo.create.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', name: 'Test', role: 'client' });
      jwt.sign.mockReturnValue('token');

      await authService.register({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed' }));
    });
  });

  describe('login', () => {
    it('retourne un token si identifiants valides', async () => {
      userRepo.findByEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.com', password: 'hashed', role: 'client', name: 'Test',
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt_token');

      const result = await authService.login({ email: 'test@test.com', password: 'password123' });

      expect(result.token).toBe('jwt_token');
      expect(result.user.password).toBeUndefined();
    });

    it('lève 401 si utilisateur introuvable', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@test.com', password: 'password123' })
      ).rejects.toThrow(AppError);
    });

    it('lève 401 si mot de passe incorrect', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'uuid-1', password: 'hashed', role: 'client' });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('me', () => {
    it('retourne le profil de l\'utilisateur connecté', async () => {
      userRepo.findById.mockResolvedValue({ id: 'uuid-1', email: 'test@test.com', role: 'client' });

      const result = await authService.me('uuid-1');

      expect(result.id).toBe('uuid-1');
    });

    it('lève 404 si utilisateur introuvable', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(authService.me('nonexistent')).rejects.toThrow(AppError);
    });
  });
});
