# Support Master — Système de tickets/support

Application fullstack de gestion de tickets d'assistance client, développée dans le cadre d'un atelier de réalisation d'une application fullstack moderne.

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Modèle de données](#3-modèle-de-données)
4. [Installation](#4-installation)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [API REST — Endpoints](#6-api-rest--endpoints)
7. [Stratégie de tests](#7-stratégie-de-tests)
8. [CI/CD](#8-cicd)
9. [Déploiement](#9-déploiement)
10. [Documentation complémentaire](#10-documentation-complémentaire)

---

## 1. Présentation du projet

### Contexte

Support Master est une plateforme web permettant aux entreprises de gérer les demandes d'assistance de leurs clients. Les clients soumettent des tickets décrivant leurs problèmes, les agents de support les traitent et y répondent, et les administrateurs supervisent l'ensemble de la plateforme.

### Utilisateurs

| Rôle | Description |
|------|-------------|
| **Client** | Utilisateur final qui soumet des tickets et suit leur résolution |
| **Agent** | Membre de l'équipe support qui traite et résout les tickets |
| **Administrateur** | Responsable de la plateforme : gestion des utilisateurs, des catégories et supervision globale |

### Objectifs métier

- Centraliser les demandes d'assistance dans un outil unique
- Permettre un suivi en temps réel de l'état de chaque demande
- Faciliter la communication entre clients et agents via un fil de messages par ticket
- Organiser les demandes par catégorie et priorité pour une meilleure réactivité
- Donner aux admins une visibilité complète sur l'activité de support

### Fonctionnalités principales

- Inscription et connexion sécurisée avec JWT
- Création, consultation et suivi de tickets par les clients
- Traitement des tickets par les agents (changement de statut, réponses)
- Notes internes entre agents (invisibles pour les clients)
- Gestion des utilisateurs et des catégories par les admins
- Filtrage des tickets par statut
- Documentation API interactive via Swagger UI

---

## 2. Architecture technique

### Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            NAVIGATEUR                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
               ┌───────────────▼───────────────┐
               │      FRONTEND — Next.js        │
               │         Port 3000              │
               │  (déployé sur Vercel)          │
               └───────────────┬───────────────┘
                               │ HTTP/REST (JSON)
               ┌───────────────▼───────────────┐
               │      BACKEND — Express.js      │
               │         Port 5000              │
               │  (déployé sur Render)          │
               │                                │
               │  ┌────────────────────────┐   │
               │  │  Middlewares           │   │
               │  │  ├── Auth (JWT)        │   │
               │  │  ├── RBAC (rôles)      │   │
               │  │  ├── Validation (Joi)  │   │
               │  │  └── Erreurs globales  │   │
               │  └────────────────────────┘   │
               │                                │
               │  ┌────────────────────────┐   │
               │  │  Modules               │   │
               │  │  ├── auth              │   │
               │  │  ├── users             │   │
               │  │  ├── tickets           │   │
               │  │  ├── messages          │   │
               │  │  └── categories        │   │
               │  └────────────────────────┘   │
               └───────────────┬───────────────┘
                               │ SQL (node-postgres)
               ┌───────────────▼───────────────┐
               │      PostgreSQL 16             │
               │         Port 5432              │
               └───────────────────────────────┘
```

### Stack technologique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js 20, Express.js 4 |
| Base de données | PostgreSQL 16 |
| Authentification | JWT (jsonwebtoken), bcryptjs |
| Validation | Joi |
| Documentation API | Swagger UI / OpenAPI 3.0 |
| Tests | Jest, Supertest, Playwright |
| Conteneurisation | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Déploiement | Vercel (frontend), Render (backend) |

### Architecture backend en couches

Chaque module suit un pattern MVC strict :

```
src/modules/<module>/
├── <module>.routes.js      → Déclaration des endpoints Express
├── <module>.controller.js  → Gestion des requêtes/réponses HTTP
├── <module>.service.js     → Logique métier
├── <module>.repository.js  → Accès à la base de données (requêtes SQL)
└── <module>.validator.js   → Schémas de validation Joi
```

---

## 3. Modèle de données

### Diagramme MLD

```
┌─────────────────────────────────┐
│            users                │
├─────────────────────────────────┤
│ id          UUID        PK      │
│ email       VARCHAR     UNIQUE  │
│ password    VARCHAR             │
│ name        VARCHAR             │
│ role        ENUM(admin,         │
│             agent, client)      │
│ created_at  TIMESTAMP           │
│ updated_at  TIMESTAMP           │
└──────────────┬──────────────────┘
               │ 1
               │ crée / est assigné
               │ *
┌──────────────▼──────────────────┐      ┌─────────────────────────┐
│            tickets              │      │       categories        │
├─────────────────────────────────┤      ├─────────────────────────┤
│ id          UUID        PK      │      │ id          SERIAL  PK  │
│ title       VARCHAR             │      │ name        VARCHAR      │
│ description TEXT                │ *──1 │ description VARCHAR      │
│ status      ENUM(open,          │      └─────────────────────────┘
│             in_progress,        │
│             resolved, closed)   │
│ priority    ENUM(low, medium,   │
│             high, urgent)       │
│ category_id INT         FK      │
│ created_by  UUID        FK      │
│ assigned_to UUID        FK NULL │
│ created_at  TIMESTAMP           │
│ updated_at  TIMESTAMP           │
│ closed_at   TIMESTAMP   NULL    │
└──────────────┬──────────────────┘
               │ 1
               │
               │ *
┌──────────────▼──────────────────┐
│            messages             │
├─────────────────────────────────┤
│ id          UUID        PK      │
│ ticket_id   UUID        FK      │
│ user_id     UUID        FK      │
│ content     TEXT                │
│ is_internal BOOLEAN             │
│ created_at  TIMESTAMP           │
│ updated_at  TIMESTAMP           │
└─────────────────────────────────┘
```

### Relations

- `users` → `tickets` (1-N via `created_by`) : un utilisateur crée plusieurs tickets
- `users` → `tickets` (1-N via `assigned_to`) : un agent peut être assigné à plusieurs tickets
- `categories` → `tickets` (1-N) : une catégorie regroupe plusieurs tickets
- `tickets` → `messages` (1-N) : un ticket contient plusieurs messages

### Types énumérés

| Énumération | Valeurs |
|-------------|---------|
| `user_role` | `admin`, `agent`, `client` |
| `ticket_status` | `open`, `in_progress`, `resolved`, `closed` |
| `ticket_priority` | `low`, `medium`, `high`, `urgent` |

---

## 4. Installation

### Prérequis

- [Docker](https://www.docker.com/) et Docker Compose
- Git

### Lancement avec Docker (recommandé)

```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-organisation>/support-master.git
cd support-master

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Lancer tous les services
docker compose up

# L'application est accessible sur :
# → Frontend  : http://localhost:3000
# → Backend   : http://localhost:5000
# → Swagger   : http://localhost:5000/api/docs
# → PgAdmin   : http://localhost:5050
```

### Lancement en développement local

```bash
# Backend
cd backend
npm install
npm run dev        # démarre avec nodemon sur :5000

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev        # démarre sur :3000
```

> La base de données PostgreSQL doit être accessible. Utiliser `docker compose up postgresql` pour lancer uniquement la base.

---

## 5. Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```env
# Base de données
DB_NAME=db_support_master
DB_USER=support_master_user
DB_PASSWORD=votre_mot_de_passe_fort

# Backend
PORT=5000
DATABASE_URL=postgresql://support_master_user:votre_mot_de_passe_fort@postgresql:5432/db_support_master
JWT_SECRET=votre_secret_jwt_64_caracteres_hexadecimaux
NODE_ENV=development

# PgAdmin
PGADMIN_EMAIL=admin@votredomaine.com
PGADMIN_PASSWORD=votre_mot_de_passe_pgadmin
```

> **Compte admin par défaut (développement uniquement)**
> - Email : `admin@support.local`
> - Mot de passe : `Admin1234!`

---

## 6. API REST — Endpoints

**Base URL :** `http://localhost:5000/api`
**Authentification :** `Authorization: Bearer <token>`

La documentation interactive complète est disponible sur **`/api/docs`** (Swagger UI).

### Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/register` | Créer un compte client | Non |
| `POST` | `/auth/login` | Se connecter (retourne un JWT) | Non |
| `GET` | `/auth/me` | Profil de l'utilisateur connecté | Oui |

**Exemple — Inscription**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "password": "motdepasse123"
}
```
```json
// Réponse 201
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "email": "jean@exemple.com", "name": "Jean Dupont", "role": "client" }
}
```

### Tickets

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| `POST` | `/tickets` | Créer un ticket | Tous |
| `GET` | `/tickets` | Lister les tickets (filtrés par rôle) | Tous |
| `GET` | `/tickets/:id` | Détail d'un ticket | Tous |
| `PUT` | `/tickets/:id` | Mettre à jour un ticket | Tous* |
| `DELETE` | `/tickets/:id` | Supprimer un ticket | Admin |

> *Les clients ne peuvent modifier que le titre/description si le ticket est encore `open`.

**Filtrage par statut :** `GET /tickets?status=open`

### Messages

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| `POST` | `/tickets/:ticketId/messages` | Ajouter un message | Tous |
| `GET` | `/tickets/:ticketId/messages` | Lister les messages | Tous |

> Le champ `isInternal: true` permet aux agents/admins de poster des notes internes, invisibles pour les clients.

### Utilisateurs (Admin)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/users` | Lister tous les utilisateurs |
| `GET` | `/users/:id` | Détail d'un utilisateur |
| `PUT` | `/users/:id` | Modifier un utilisateur (nom, rôle) |
| `DELETE` | `/users/:id` | Supprimer un utilisateur |

### Catégories (Admin)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/categories` | Lister les catégories |
| `POST` | `/categories` | Créer une catégorie |
| `PUT` | `/categories/:id` | Modifier une catégorie |
| `DELETE` | `/categories/:id` | Supprimer une catégorie |

### Codes HTTP utilisés

| Code | Signification |
|------|---------------|
| `200` | Succès |
| `201` | Ressource créée |
| `204` | Suppression réussie (sans corps) |
| `400` | Données invalides |
| `401` | Non authentifié |
| `403` | Accès refusé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex. email déjà utilisé) |

---

## 7. Stratégie de tests

### Types de tests

| Type | Outil | Périmètre |
|------|-------|-----------|
| **Unitaires** | Jest | Services, validateurs, utilitaires |
| **Intégration** | Jest + Supertest | Endpoints API + base de données réelle |
| **End-to-end** | Playwright | Parcours utilisateur complets via HTTP |

### Seuil de couverture

La couverture minimale configurée est de **70 % (lignes et fonctions)** et **60 % (branches)**.

### Lancer les tests

```bash
cd backend

# Tests unitaires + intégration
npm test

# Avec rapport de couverture
npm run test:coverage

# Tests end-to-end (Playwright — nécessite l'API en cours d'exécution)
npx playwright test
```

```bash
cd frontend

# Tests unitaires frontend
npm test
```

### Résultat actuel

```
Test Suites: 7 passed
Tests:       71 passed
Couverture:  ≥ 70 % (lignes/fonctions), ≥ 60 % (branches)
```

---

## 8. CI/CD

### Pipeline GitHub Actions

Le pipeline se déclenche automatiquement à chaque **pull request vers `main`**.

```
┌─────────────────────────────────────────────┐
│           GitHub Actions                    │
├─────────────────────────────────────────────┤
│  On: pull_request → main                    │
│                                             │
│  frontend-tests:                            │
│    ├── Checkout                             │
│    ├── Setup Node.js 20                     │
│    ├── npm ci                               │
│    ├── npm run lint                         │
│    ├── npm test                             │
│    └── npm run build                        │
└─────────────────────────────────────────────┘
```

Fichier de configuration : `.github/workflows/frontend-ci.yml`

---

## 9. Déploiement

### Frontend — Vercel

Le frontend est déployé sur [Vercel](https://vercel.com).

**URL de production :** *(à compléter après déploiement)*

### Backend — Render

Le backend est déployé sur [Render](https://render.com).

**URL de production :** *(à compléter après déploiement)*

### Variables d'environnement de production

Configurer les variables d'environnement directement dans les interfaces Vercel et Render (ne jamais committer le fichier `.env` avec des secrets de production).

---

## 10. Documentation complémentaire

- [User Stories et Critères d'acceptation](./docs/user-stories.md)
- [Scénarios BDD (Gherkin)](./docs/bdd-scenarios.md)
- [Documentation API interactive](http://localhost:5000/api/docs) *(en local)*

---

## Bonnes pratiques appliquées

- **Git Flow** : branches `feature/*`, commits conventionnels (`feat:`, `fix:`, etc.)
- **Séparation des responsabilités** : architecture en couches (routes → controller → service → repository)
- **Sécurité** : mots de passe hachés (bcrypt, 12 rounds), JWT, requêtes préparées (protection contre les injections SQL), CORS
- **Validation** : toutes les entrées utilisateur sont validées avec Joi avant traitement
- **Gestion centralisée des erreurs** : classe `AppError` + middleware global
- **Notes internes** : les agents peuvent communiquer entre eux sur un ticket sans que le client ne le voie
