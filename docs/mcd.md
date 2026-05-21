# Modèle Conceptuel de Données (MCD) — Support Master

---

## Diagramme MCD

```mermaid
erDiagram
    UTILISATEUR {
        UUID id PK
        VARCHAR email
        VARCHAR password
        VARCHAR name
        ENUM role
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    TICKET {
        UUID id PK
        VARCHAR title
        TEXT description
        ENUM status
        ENUM priority
        INT category_id FK
        UUID created_by FK
        UUID assigned_to FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP closed_at
    }
    MESSAGE {
        UUID id PK
        UUID ticket_id FK
        UUID user_id FK
        TEXT content
        BOOLEAN is_internal
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    CATEGORIE {
        SERIAL id PK
        VARCHAR name
        VARCHAR description
    }

    UTILISATEUR ||--o{ TICKET : "soumet (created_by)"
    UTILISATEUR |o--o{ TICKET : "est assigné à (assigned_to)"
    UTILISATEUR ||--o{ MESSAGE : "rédige"
    TICKET ||--o{ MESSAGE : "contient"
    CATEGORIE |o--o{ TICKET : "catégorise"
```

---

## Représentation Merise

```
┌─────────────────────┐                     ┌──────────────────┐
│    UTILISATEUR      │                     │    CATEGORIE     │
├─────────────────────┤                     ├──────────────────┤
│ # id                │                     │ # id             │
│   email             │                     │   name           │
│   password          │                     │   description    │
│   name              │                     └────────┬─────────┘
│   role              │                              │
│   created_at        │                            (0,N)
│   updated_at        │                              │
└──────┬──────────────┘                       CATEGORISER
       │                                            │
     (1,N)   (0,N)                               (0,1)
       │       │                                    │
   SOUMETTRE  ASSIGNER     ┌─────────────────────────────────────────────┐
       │       │           │               TICKET                        │
     (1,1)   (0,1)         ├─────────────────────────────────────────────┤
       │       │           │ # id                                        │
       └───┬───┘           │   title                                     │
           │               │   description                               │
           └───────────────►   status (open / in_progress / resolved / closed)
                           │   priority (low / medium / high / urgent)   │
                           │   created_at                                │
                           │   updated_at                                │
                           │   closed_at                                 │
                           └──────────────────────┬──────────────────────┘
                                                  │
                                                (0,N)
                                                  │
                                              CONTENIR
                                                  │
                                                (1,1)
                                                  │
                           ┌──────────────────────▼──────────────────────┐
                           │                MESSAGE                       │
                           ├─────────────────────────────────────────────┤
                           │ # id                                        │
                           │   content                                   │
                           │   is_internal                               │
                           │   created_at                                │
                           │   updated_at                                │
                           └──────────────────────┬──────────────────────┘
                                                  │
                                                (1,1)
                                                  │
                                              REDIGER
                                                  │
                                                (1,N)
                                                  │
                                           UTILISATEUR
```

---

## Cardinalités

| Association | Entité A | Cardinalité A | Cardinalité B | Entité B |
|-------------|----------|---------------|---------------|----------|
| SOUMETTRE | UTILISATEUR | (1,N) | (1,1) | TICKET |
| ASSIGNER | UTILISATEUR | (0,N) | (0,1) | TICKET |
| REDIGER | UTILISATEUR | (1,N) | (1,1) | MESSAGE |
| CONTENIR | TICKET | (0,N) | (1,1) | MESSAGE |
| CATEGORISER | CATEGORIE | (0,N) | (0,1) | TICKET |

**Lecture :**
- Un UTILISATEUR soumet entre 1 et N tickets ; un TICKET est soumis par exactement 1 utilisateur.
- Un UTILISATEUR peut être assigné à 0 ou N tickets ; un TICKET peut avoir 0 ou 1 agent assigné.
- Un UTILISATEUR rédige 1 à N messages ; un MESSAGE est rédigé par exactement 1 utilisateur.
- Un TICKET contient 0 à N messages ; un MESSAGE appartient à exactement 1 ticket.
- Une CATEGORIE regroupe 0 à N tickets ; un TICKET appartient à 0 ou 1 catégorie.

---

## Types énumérés

| Type | Valeurs |
|------|---------|
| `user_role` | `admin`, `agent`, `client` |
| `ticket_status` | `open`, `in_progress`, `resolved`, `closed` |
| `ticket_priority` | `low`, `medium`, `high`, `urgent` |
