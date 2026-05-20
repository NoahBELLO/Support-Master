# Scénarios BDD — Support Master

Scénarios métier rédigés en Gherkin (Behavior Driven Development) pour le système de tickets/support.

---

## Feature: Authentification

```gherkin
Feature: Authentification des utilisateurs
  En tant qu'utilisateur de la plateforme
  Je veux pouvoir m'inscrire et me connecter
  Afin d'accéder à mon espace personnel

  Scenario: Connexion réussie avec des identifiants valides
    Given un client possède un compte avec l'email "jean@exemple.com" et le mot de passe "Password123!"
    When il soumet une requête POST /api/auth/login avec ces identifiants
    Then il reçoit un code HTTP 200
    And la réponse contient un champ "token" non vide
    And la réponse contient les informations de l'utilisateur sans le mot de passe

  Scenario: Connexion échouée avec un mauvais mot de passe
    Given un client possède un compte avec l'email "jean@exemple.com"
    When il soumet une requête POST /api/auth/login avec le mot de passe "mauvais"
    Then il reçoit un code HTTP 401
    And la réponse contient un message d'erreur générique

  Scenario: Inscription avec un email déjà utilisé
    Given un compte existe déjà avec l'email "jean@exemple.com"
    When un nouvel utilisateur tente de s'inscrire avec le même email "jean@exemple.com"
    Then il reçoit un code HTTP 409
    And la réponse contient un message indiquant que l'email est déjà utilisé

  Scenario: Inscription avec un mot de passe trop court
    Given aucun compte n'existe avec l'email "nouveau@exemple.com"
    When l'utilisateur tente de s'inscrire avec le mot de passe "abc" (3 caractères)
    Then il reçoit un code HTTP 400
    And la réponse contient un message de validation indiquant la longueur minimale requise

  Scenario: Accès au profil sans token d'authentification
    Given aucun token JWT n'est fourni dans la requête
    When l'utilisateur envoie GET /api/auth/me sans en-tête Authorization
    Then il reçoit un code HTTP 401
    And la réponse contient un message "Non authentifié"
```

---

## Feature: Gestion des tickets

```gherkin
Feature: Création et gestion des tickets de support
  En tant qu'utilisateur authentifié
  Je veux créer et gérer des tickets
  Afin d'obtenir de l'aide sur mes problèmes

  Scenario: Création d'un ticket valide par un client
    Given un client est connecté avec un token JWT valide
    When il soumet une requête POST /api/tickets avec le titre "Impossible de me connecter" et la description "Depuis ce matin, mon compte est bloqué."
    Then il reçoit un code HTTP 201
    And le ticket est créé avec le statut "open"
    And le ticket est associé au client connecté

  Scenario: Création d'un ticket avec un titre trop court
    Given un client est connecté avec un token JWT valide
    When il soumet une requête POST /api/tickets avec un titre de 3 caractères
    Then il reçoit un code HTTP 400
    And la réponse contient une erreur de validation sur le champ "title"

  Scenario: Un client ne peut pas consulter le ticket d'un autre client
    Given le client A possède le ticket avec l'id "uuid-ticket-client-A"
    And le client B est connecté avec un token JWT valide
    When le client B envoie GET /api/tickets/uuid-ticket-client-A
    Then il reçoit un code HTTP 403
    And la réponse contient un message "Accès refusé"

  Scenario: Un agent voit tous les tickets
    Given un agent est connecté avec un token JWT valide
    And plusieurs tickets existent créés par différents clients
    When l'agent envoie GET /api/tickets
    Then il reçoit un code HTTP 200
    And la réponse contient les tickets de tous les clients

  Scenario: Changement de statut d'un ticket par un agent
    Given un ticket existe avec le statut "open"
    And un agent est connecté avec un token JWT valide
    When l'agent envoie PUT /api/tickets/:id avec le corps { "status": "in_progress" }
    Then il reçoit un code HTTP 200
    And le ticket a désormais le statut "in_progress"

  Scenario: Un client ne peut pas changer le statut de son ticket
    Given un client est connecté et possède un ticket avec le statut "open"
    When il envoie PUT /api/tickets/:id avec le corps { "status": "resolved" }
    Then il reçoit un code HTTP 403
    And le statut du ticket reste "open"

  Scenario: Fermeture d'un ticket par un agent
    Given un ticket avec le statut "resolved" existe
    And un agent est connecté
    When l'agent envoie PUT /api/tickets/:id avec { "status": "closed" }
    Then il reçoit un code HTTP 200
    And le ticket a le statut "closed"
    And le champ "closed_at" est renseigné avec la date actuelle

  Scenario: Suppression d'un ticket par un administrateur
    Given un ticket existe avec l'id "uuid-ticket-a-supprimer"
    And un administrateur est connecté
    When il envoie DELETE /api/tickets/uuid-ticket-a-supprimer
    Then il reçoit un code HTTP 204
    And le ticket n'existe plus en base de données

  Scenario: Un agent ne peut pas supprimer un ticket
    Given un ticket existe
    And un agent est connecté
    When il envoie DELETE /api/tickets/:id
    Then il reçoit un code HTTP 403
```

---

## Feature: Messagerie sur les tickets

```gherkin
Feature: Échange de messages sur un ticket
  En tant qu'utilisateur authentifié
  Je veux envoyer et consulter des messages sur un ticket
  Afin de communiquer avec le support

  Scenario: Un client envoie un message sur son ticket
    Given un client est connecté et possède un ticket avec le statut "open"
    When il envoie POST /api/tickets/:ticketId/messages avec { "content": "Voici les logs d'erreur." }
    Then il reçoit un code HTTP 201
    And le message est associé au ticket et au client

  Scenario: Un agent poste une note interne sur un ticket
    Given un agent est connecté
    And un ticket existe avec le statut "in_progress"
    When l'agent envoie POST /api/tickets/:ticketId/messages avec { "content": "Vérifier la base de données côté serveur.", "isInternal": true }
    Then il reçoit un code HTTP 201
    And le message est créé avec is_internal = true

  Scenario: Un client ne voit pas les notes internes
    Given un ticket possède un message public et une note interne
    And le client propriétaire du ticket est connecté
    When il envoie GET /api/tickets/:ticketId/messages
    Then il reçoit un code HTTP 200
    And la réponse contient le message public
    And la réponse ne contient pas la note interne

  Scenario: Envoi d'un message sur un ticket fermé
    Given un ticket a le statut "closed"
    And un client est connecté
    When il tente d'envoyer POST /api/tickets/:ticketId/messages avec un contenu valide
    Then il reçoit un code HTTP 400
    And la réponse indique que le ticket est fermé

  Scenario: Un client ne peut pas envoyer un message sur le ticket d'un autre client
    Given un ticket appartient au client A
    And le client B est connecté
    When le client B tente d'envoyer POST /api/tickets/:ticketId/messages
    Then il reçoit un code HTTP 403
```

---

## Feature: Administration

```gherkin
Feature: Gestion administrative de la plateforme
  En tant qu'administrateur
  Je veux gérer les utilisateurs et les catégories
  Afin de maintenir la plateforme opérationnelle

  Scenario: L'admin modifie le rôle d'un utilisateur
    Given un administrateur est connecté
    And un utilisateur avec le rôle "client" existe
    When l'admin envoie PUT /api/users/:id avec { "role": "agent" }
    Then il reçoit un code HTTP 200
    And l'utilisateur a désormais le rôle "agent"

  Scenario: L'admin crée une nouvelle catégorie
    Given un administrateur est connecté
    When il envoie POST /api/categories avec { "name": "Sécurité", "description": "Problèmes de sécurité et d'accès" }
    Then il reçoit un code HTTP 201
    And la catégorie est disponible dans la liste des catégories

  Scenario: L'admin ne peut pas créer deux catégories avec le même nom
    Given la catégorie "Technique" existe déjà
    And un administrateur est connecté
    When il envoie POST /api/categories avec { "name": "Technique" }
    Then il reçoit un code HTTP 409 ou 400
    And la réponse indique que le nom est déjà utilisé

  Scenario: Un client ne peut pas accéder à la liste des utilisateurs
    Given un client est connecté
    When il envoie GET /api/users
    Then il reçoit un code HTTP 403
    And la réponse contient un message "Accès réservé aux administrateurs"

  Scenario: L'admin assigne un ticket à un agent
    Given un administrateur est connecté
    And un ticket avec le statut "open" existe
    And un agent avec l'id "uuid-agent" existe
    When l'admin envoie PUT /api/tickets/:id avec { "assignedTo": "uuid-agent" }
    Then il reçoit un code HTTP 200
    And le ticket est associé à l'agent "uuid-agent"
```
