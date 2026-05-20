const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Support Master API',
    version: '1.0.0',
    description: 'API REST pour le système de tickets/support client',
  },
  servers: [
    { url: 'http://localhost:5000/api', description: 'Développement local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Message d\'erreur' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'agent', 'client'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Impossible de se connecter' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          category_name: { type: 'string' },
          creator_name: { type: 'string' },
          assignee_name: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          closed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ticket_id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          is_internal: { type: 'boolean', description: 'Note interne visible uniquement par agents/admins' },
          user_name: { type: 'string' },
          user_role: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', example: 'Technique' },
          description: { type: 'string', nullable: true },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un compte client',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2, example: 'Jean Dupont' },
                  email: { type: 'string', format: 'email', example: 'jean@exemple.com' },
                  password: { type: 'string', minLength: 8, example: 'motdepasse123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Compte créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email déjà utilisé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Se connecter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'jean@exemple.com' },
                  password: { type: 'string', example: 'motdepasse123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Connexion réussie', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Données invalides' },
          401: { description: 'Identifiants incorrects' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Profil de l\'utilisateur connecté',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profil', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Utilisateurs'],
        summary: 'Lister tous les utilisateurs (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Liste des utilisateurs', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          401: { description: 'Non authentifié' },
          403: { description: 'Accès réservé aux admins' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Utilisateurs'],
        summary: 'Obtenir un utilisateur par id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Utilisateur', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: 'Introuvable' },
        },
      },
      put: {
        tags: ['Utilisateurs'],
        summary: 'Modifier un utilisateur (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'agent', 'client'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Utilisateur mis à jour' },
          404: { description: 'Introuvable' },
        },
      },
      delete: {
        tags: ['Utilisateurs'],
        summary: 'Supprimer un utilisateur (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Supprimé' },
          404: { description: 'Introuvable' },
        },
      },
    },
    '/tickets': {
      post: {
        tags: ['Tickets'],
        summary: 'Créer un ticket de support',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title: { type: 'string', minLength: 5, example: 'Problème de connexion au compte' },
                  description: { type: 'string', minLength: 10, example: 'Je ne peux plus me connecter depuis ce matin.' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                  categoryId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ticket créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } },
          400: { description: 'Données invalides' },
          401: { description: 'Non authentifié' },
        },
      },
      get: {
        tags: ['Tickets'],
        summary: 'Lister les tickets (filtrés par rôle)',
        description: 'Les clients voient uniquement leurs tickets. Les agents et admins voient tous les tickets.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] } },
        ],
        responses: {
          200: { description: 'Liste des tickets', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/tickets/{id}': {
      get: {
        tags: ['Tickets'],
        summary: 'Obtenir un ticket par id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Ticket', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } },
          403: { description: 'Accès refusé' },
          404: { description: 'Introuvable' },
        },
      },
      put: {
        tags: ['Tickets'],
        summary: 'Mettre à jour un ticket',
        description: 'Clients : titre/description si statut open. Agents/admins : tout modifier.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  assignedTo: { type: 'string', format: 'uuid', nullable: true },
                  categoryId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Ticket mis à jour', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } },
          400: { description: 'Données invalides ou ticket non modifiable' },
          403: { description: 'Accès refusé' },
          404: { description: 'Introuvable' },
        },
      },
      delete: {
        tags: ['Tickets'],
        summary: 'Supprimer un ticket (admin uniquement)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Supprimé' },
          403: { description: 'Accès refusé' },
          404: { description: 'Introuvable' },
        },
      },
    },
    '/tickets/{ticketId}/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Ajouter un message à un ticket',
        description: 'Les agents/admins peuvent marquer un message comme note interne (invisible par le client).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ticketId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Merci pour votre retour, nous traitons votre demande.' },
                  isInternal: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Message ajouté', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } },
          400: { description: 'Ticket fermé ou données invalides' },
          403: { description: 'Accès refusé' },
          404: { description: 'Ticket introuvable' },
        },
      },
      get: {
        tags: ['Messages'],
        summary: 'Lister les messages d\'un ticket',
        description: 'Les notes internes sont masquées pour les clients.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ticketId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Messages', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Message' } } } } },
          403: { description: 'Accès refusé' },
          404: { description: 'Ticket introuvable' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Catégories'],
        summary: 'Lister toutes les catégories',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Catégories', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } },
        },
      },
      post: {
        tags: ['Catégories'],
        summary: 'Créer une catégorie (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Facturation' },
                  description: { type: 'string', example: 'Questions relatives aux paiements' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Catégorie créée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
          400: { description: 'Données invalides' },
          403: { description: 'Accès refusé' },
        },
      },
    },
    '/categories/{id}': {
      put: {
        tags: ['Catégories'],
        summary: 'Modifier une catégorie (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Catégorie mise à jour' },
          404: { description: 'Introuvable' },
        },
      },
      delete: {
        tags: ['Catégories'],
        summary: 'Supprimer une catégorie (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: 'Supprimée' },
          404: { description: 'Introuvable' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
