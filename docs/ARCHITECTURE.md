# Architecture du Projet Nkapay

## Vue d'ensemble

Nkapay est une application de gestion de tontines construite avec une architecture en couches.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Langage | TypeScript |
| ORM | TypeORM |
| Base de donnees | MySQL 8 |
| Validation | express-validator |
| Documentation | Swagger/OpenAPI |
| Logging | Winston |
| Tests | Jest |

## Structure du Backend

```
backend/src/
├── config/                 # Configuration centralisee
│   ├── env.config.ts       # Variables d'environnement
│   ├── database.config.ts  # Configuration TypeORM
│   └── swagger.config.ts   # Configuration Swagger
│
├── modules/                # Modules metier (par domaine)
│   ├── auth/               # Authentification
│   ├── utilisateurs/       # Gestion des utilisateurs
│   ├── tontines/           # Gestion des tontines
│   ├── exercices/          # Exercices comptables
│   ├── reunions/           # Reunions
│   ├── transactions/       # Operations financieres
│   ├── prets/              # Gestion des prets
│   └── secours/            # Module de secours
│
├── shared/                 # Code partage
│   ├── entities/           # Entites de base
│   ├── errors/             # Classes d'erreurs
│   ├── middlewares/        # Middlewares Express
│   └── utils/              # Utilitaires
│
├── database/               # Scripts de base de donnees
│   ├── migrations/         # Migrations TypeORM
│   └── seeds/              # Donnees de reference
│
├── types/                  # Declarations TypeScript
└── app.ts                  # Point d'entree
```

## Organisation des Modules

Chaque module metier suit la structure suivante :

```
modules/[nom-module]/
├── controllers/            # Controleurs HTTP
├── services/               # Logique metier
├── repositories/           # Acces aux donnees
├── entities/               # Entites TypeORM
├── dtos/                   # Data Transfer Objects
├── validators/             # Regles de validation
├── routes/                 # Definition des routes
└── index.ts                # Point d'export
```

## Flux de Donnees

```
Client HTTP
    │
    ▼
[Route] → [Middleware Auth] → [Validation]
    │
    ▼
[Controller] ─── traite la requete HTTP
    │
    ▼
[Service] ────── logique metier
    │
    ▼
[Repository] ─── acces aux donnees
    │
    ▼
[Entity] ─────── modele de donnees
    │
    ▼
[MySQL] ──────── persistance
```

## Conventions de Nommage

- **Fichiers**: kebab-case (ex: `user-service.ts`)
- **Classes**: PascalCase (ex: `UserService`)
- **Fonctions/Variables**: camelCase (ex: `getUserById`)
- **Constantes**: SCREAMING_SNAKE_CASE (ex: `MAX_RETRY_COUNT`)
- **Tables SQL**: snake_case (ex: `adhesion_tontine`)
- **Colonnes SQL**: snake_case (ex: `date_adhesion_tontine`)
