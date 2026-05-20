# User Stories — Support Master

Système de tickets/support client avec trois rôles : **client**, **agent** et **administrateur**.

---

## Rôle : Client

---

### US-01 — Créer un compte

> En tant que **client**,
> je veux **créer un compte sur la plateforme**,
> afin de **pouvoir soumettre des tickets d'assistance**.

**Critères d'acceptation**

- L'email est obligatoire et doit être au format valide
- Le mot de passe doit contenir au minimum 8 caractères
- Le nom est obligatoire (2 caractères minimum)
- Un email déjà utilisé doit afficher un message d'erreur explicite
- Après inscription réussie, l'utilisateur reçoit un token JWT et est connecté automatiquement
- Le rôle attribué est `client` par défaut
- Le mot de passe est stocké de manière hachée (jamais en clair)

---

### US-02 — Se connecter

> En tant que **client**,
> je veux **me connecter avec mon email et mon mot de passe**,
> afin d'**accéder à mon espace et à mes tickets**.

**Critères d'acceptation**

- L'email et le mot de passe sont obligatoires
- Des identifiants incorrects affichent un message d'erreur générique (sans préciser si c'est l'email ou le mot de passe)
- Une connexion réussie retourne un token JWT valide
- Le token JWT expire après 7 jours
- Un compte inexistant retourne une erreur 401

---

### US-03 — Créer un ticket de support

> En tant que **client**,
> je veux **créer un ticket de support**,
> afin de **signaler un problème et obtenir de l'aide**.

**Critères d'acceptation**

- Le titre est obligatoire (5 caractères minimum)
- La description est obligatoire (10 caractères minimum)
- La priorité est optionnelle et vaut `medium` par défaut
- La catégorie est optionnelle
- Le ticket est créé avec le statut `open`
- Le ticket est automatiquement associé à l'utilisateur connecté (créateur)
- Un ticket ne peut pas être créé si l'utilisateur n'est pas authentifié

---

### US-04 — Consulter mes tickets

> En tant que **client**,
> je veux **voir la liste de mes tickets**,
> afin de **suivre l'ensemble de mes demandes d'assistance**.

**Critères d'acceptation**

- Le client ne voit que ses propres tickets (jamais ceux d'autres clients)
- La liste affiche pour chaque ticket : le titre, le statut, la priorité, la date de création
- Il est possible de filtrer les tickets par statut (`open`, `in_progress`, `resolved`, `closed`)
- Si aucun ticket n'existe, la liste est vide (pas d'erreur)

---

### US-05 — Consulter le détail d'un ticket

> En tant que **client**,
> je veux **consulter le détail d'un de mes tickets**,
> afin de **lire les échanges et suivre l'avancement de ma demande**.

**Critères d'acceptation**

- Le client ne peut accéder qu'à ses propres tickets (erreur 403 sinon)
- Le détail affiche : titre, description, statut, priorité, catégorie, date de création, agent assigné (si présent)
- Les messages visibles incluent uniquement les messages publics (les notes internes des agents sont masquées)

---

### US-06 — Envoyer un message sur un ticket

> En tant que **client**,
> je veux **envoyer un message sur un de mes tickets**,
> afin de **fournir des informations supplémentaires ou répondre à l'agent**.

**Critères d'acceptation**

- Le contenu du message est obligatoire (non vide)
- Il n'est pas possible d'envoyer un message sur un ticket dont le statut est `closed`
- Le message est visible par le client et par les agents/admins
- Le client ne peut pas créer de note interne (`isInternal` est toujours `false` pour un client)
- L'envoi sur un ticket appartenant à un autre client retourne une erreur 403

---

## Rôle : Agent

---

### US-07 — Consulter tous les tickets

> En tant qu'**agent**,
> je veux **voir l'ensemble des tickets de la plateforme**,
> afin de **traiter les demandes en attente**.

**Critères d'acceptation**

- L'agent voit tous les tickets (de tous les clients), contrairement au client
- La liste peut être filtrée par statut
- Chaque ticket affiche : titre, statut, priorité, nom du client créateur, agent assigné

---

### US-08 — Répondre à un ticket

> En tant qu'**agent**,
> je veux **envoyer un message de réponse sur un ticket**,
> afin d'**aider le client à résoudre son problème**.

**Critères d'acceptation**

- L'agent peut poster un message public sur n'importe quel ticket non fermé
- La réponse est visible par le client et tous les agents/admins
- Il n'est pas possible de répondre sur un ticket `closed`
- Le message est associé à l'agent qui l'a posté (nom et rôle visibles)

---

### US-09 — Ajouter une note interne

> En tant qu'**agent**,
> je veux **ajouter une note interne à un ticket**,
> afin de **communiquer avec les autres agents sans que le client ne le voie**.

**Critères d'acceptation**

- Le champ `isInternal: true` marque le message comme note interne
- Les notes internes sont visibles uniquement par les agents et les admins
- Un client qui consulte les messages du ticket ne voit pas les notes internes
- Il n'est pas possible d'ajouter une note interne sur un ticket `closed`

---

### US-10 — Changer le statut d'un ticket

> En tant qu'**agent**,
> je veux **modifier le statut d'un ticket**,
> afin de **refléter l'avancement du traitement de la demande**.

**Critères d'acceptation**

- Les statuts disponibles sont : `open`, `in_progress`, `resolved`, `closed`
- Passer un ticket en `closed` renseigne automatiquement la date de fermeture (`closed_at`)
- Un ticket `closed` ne peut plus être modifié
- Le changement de statut est possible sur tous les tickets, pas seulement les tickets assignés à l'agent

---

## Rôle : Administrateur

---

### US-11 — Gérer les utilisateurs

> En tant qu'**administrateur**,
> je veux **consulter, modifier et supprimer des comptes utilisateurs**,
> afin de **contrôler les accès à la plateforme**.

**Critères d'acceptation**

- L'admin peut lister tous les utilisateurs (id, email, nom, rôle, date de création)
- L'admin peut modifier le nom et le rôle d'un utilisateur
- L'admin peut supprimer un compte utilisateur
- La modification du rôle permet de promouvoir un client en agent ou en admin
- Un utilisateur inexistant retourne une erreur 404

---

### US-12 — Gérer les catégories de tickets

> En tant qu'**administrateur**,
> je veux **créer, modifier et supprimer des catégories**,
> afin d'**organiser les tickets par thématique**.

**Critères d'acceptation**

- L'admin peut créer une catégorie avec un nom unique et une description optionnelle
- Un nom de catégorie déjà existant retourne une erreur de conflit
- L'admin peut modifier le nom ou la description d'une catégorie existante
- L'admin peut supprimer une catégorie
- Tous les utilisateurs authentifiés peuvent consulter la liste des catégories

---

### US-13 — Assigner un ticket à un agent

> En tant qu'**administrateur**,
> je veux **assigner un ticket à un agent spécifique**,
> afin de **répartir la charge de travail au sein de l'équipe support**.

**Critères d'acceptation**

- L'admin peut renseigner le champ `assignedTo` avec l'UUID d'un utilisateur ayant le rôle `agent`
- Un ticket peut être réassigné à un autre agent
- L'assignation peut être annulée (mettre `assignedTo` à `null`)
- La tentative d'assigner à un utilisateur inexistant retourne une erreur 404

---

### US-14 — Supprimer un ticket

> En tant qu'**administrateur**,
> je veux **pouvoir supprimer définitivement un ticket**,
> afin de **nettoyer les données obsolètes ou erronées**.

**Critères d'acceptation**

- Seul un administrateur peut supprimer un ticket
- La suppression est définitive et supprime également tous les messages associés
- Un ticket inexistant retourne une erreur 404
- Une tentative de suppression par un agent ou un client retourne une erreur 403
- Une suppression réussie retourne le code HTTP 204 (sans corps de réponse)
