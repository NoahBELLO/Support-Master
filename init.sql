-- Système de tickets/support
-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'client');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Utilisateurs
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    role        user_role NOT NULL DEFAULT 'client',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catégories de tickets
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Tickets de support
CREATE TABLE tickets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status      ticket_status NOT NULL DEFAULT 'open',
    priority    ticket_priority NOT NULL DEFAULT 'medium',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at   TIMESTAMP WITH TIME ZONE
);

-- Messages/réponses dans un ticket
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- note interne visible seulement par agents/admins
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_tickets_created_by   ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to  ON tickets(assigned_to);
CREATE INDEX idx_tickets_status       ON tickets(status);
CREATE INDEX idx_messages_ticket_id   ON messages(ticket_id);

-- Données initiales : catégories
INSERT INTO categories (name, description) VALUES
    ('Technique',    'Problèmes techniques liés au produit'),
    ('Facturation',  'Questions concernant les paiements et abonnements'),
    ('Compte',       'Gestion du compte utilisateur'),
    ('Autre',        'Toute autre demande');

-- Compte admin par défaut (mot de passe : Admin1234! — à changer en prod)
-- Hash bcrypt généré pour 'Admin1234!'
INSERT INTO users (email, password, name, role) VALUES (
    'admin@support.local',
    '$2a$12$m3E8VKJ1J40CzB/2t2DDMenvCJGVQT.eqimeVq6aS16QNm77bdRu2',
    'Administrateur',
    'admin'
);
