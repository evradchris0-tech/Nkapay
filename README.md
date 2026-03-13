# 💰 Nkapay — Système de Gestion de Tontines

> Application full-stack de gestion complète pour les **tontines** (associations rotatives d'épargne et de crédit), construite avec une architecture modulaire en couches.

---

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Stack Technique](#-stack-technique)
- [Structure du Projet](#-structure-du-projet)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Scripts Disponibles](#-scripts-disponibles)
- [Modules Métier](#-modules-métier)
- [Documentation API](#-documentation-api)
- [Tests](#-tests)
- [Variables d'Environnement](#-variables-denvironnement)
- [Conventions](#-conventions)
- [Licence](#-licence)

---

## 🔍 Aperçu

**Nkapay** est une plateforme de gestion de tontines permettant de gérer l'ensemble du cycle de vie d'une tontine : création, adhésion des membres, exercices comptables, réunions, cotisations, distributions, prêts, secours, pénalités et exports de rapports.

Le projet est organisé en **monorepo** avec un workspace npm contenant :

| Composant | Description |
|-----------|-------------|
| `backend/` | API REST Node.js / Express / TypeScript |
| `Frontend/` | Application web Angular 20 |
| `database/` | Scripts SQL, migrations et seeders |
| `docs/` | Documentation technique et architecture |

---

## 🛠 Stack Technique

### Backend

| Couche | Technologie |
|--------|-------------|
| Runtime | Node.js ≥ 20 LTS |
| Framework | Express.js 4 |
| Langage | TypeScript 5 |
| ORM | TypeORM |
| Base de données | MySQL 8 |
| Authentification | JSON Web Tokens (`jsonwebtoken`, `bcrypt`) |
| Validation | express-validator |
| Documentation API | Swagger / OpenAPI (`swagger-jsdoc`, `swagger-ui-express`) |
| Logging | Winston |
| Sécurité | Helmet, CORS |
| Exports | ExcelJS, PDFKit |
| Tests | Jest, Supertest |
| Linting | ESLint + Prettier |

### Frontend

| Couche | Technologie |
|--------|-------------|
| Framework | Angular 20 |
| Langage | TypeScript 5.8 |
| Styles | SCSS |
| Tests | Jasmine + Karma |
| Gestion d'état | RxJS |

### Infrastructure

| Service | Détails |
|---------|---------|
| Base de données | MySQL 8.0 (Docker ou XAMPP) |
| Administration DB | phpMyAdmin (port `8080`) |
| Conteneurisation | Docker Compose |

---

## 📁 Structure du Projet

```
Nkapay/
├── backend/                        # API REST
│   ├── src/
│   │   ├── app.ts                  # Point d'entrée Express
│   │   ├── config/                 # Configuration centralisée
│   │   │   ├── env.config.ts       #   Variables d'environnement
│   │   │   ├── database.config.ts  #   Configuration TypeORM / MySQL
│   │   │   └── swagger.config.ts   #   Configuration Swagger/OpenAPI
│   │   │
│   │   ├── modules/                # Modules métier (Domain-Driven)
│   │   │   ├── adhesions/          #   Adhésions aux tontines
│   │   │   ├── auth/               #   Authentification & JWT
│   │   │   ├── dashboard/          #   Tableau de bord & stats
│   │   │   ├── distributions/      #   Distributions des fonds
│   │   │   ├── exercices/          #   Exercices comptables & cassation
│   │   │   ├── exports/            #   Exports PDF & Excel
│   │   │   ├── penalites/          #   Gestion des pénalités
│   │   │   ├── prets/              #   Gestion des prêts
│   │   │   ├── reunions/           #   Planification des réunions
│   │   │   ├── secours/            #   Module de secours
│   │   │   ├── tontines/           #   CRUD tontines & règles
│   │   │   ├── transactions/       #   Opérations financières
│   │   │   └── utilisateurs/       #   Gestion des utilisateurs
│   │   │
│   │   ├── shared/                 # Code partagé transversal
│   │   │   ├── entities/           #   Entités de base (BaseEntity)
│   │   │   ├── errors/             #   Classes d'erreurs custom
│   │   │   ├── middlewares/        #   Auth, validation, error-handler
│   │   │   ├── services/           #   Services partagés
│   │   │   └── utils/              #   Utilitaires (event-bus, repository factory…)
│   │   │
│   │   ├── database/               # Scripts de base de données
│   │   │   ├── migrations/         #   Migrations TypeORM
│   │   │   └── seeds/              #   Données de référence
│   │   │
│   │   ├── types/                  # Déclarations TypeScript globales
│   │   └── scripts/                # Scripts utilitaires
│   │
│   ├── tests/                      # Tests
│   │   ├── unit/                   #   Tests unitaires
│   │   ├── integration/            #   Tests d'intégration
│   │   └── helpers/                #   Helpers de test
│   │
│   ├── postman/                    # Collections Postman (8 collections)
│   ├── docs/                       # Docs backend (business logic, workflow)
│   ├── jest.config.js              # Configuration Jest
│   ├── tsconfig.json               # Configuration TypeScript
│   ├── .eslintrc.js                # Configuration ESLint
│   ├── .prettierrc                 # Configuration Prettier
│   └── .env.example                # Template variables d'environnement
│
├── Frontend/                       # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.ts              # Composant racine
│   │   │   ├── app.routes.ts       # Configuration du routage
│   │   │   ├── app.config.ts       # Configuration Angular
│   │   │   │
│   │   │   ├── core/               # Noyau applicatif
│   │   │   │   ├── guards/         #   Guards d'authentification
│   │   │   │   ├── interceptors/   #   Intercepteurs HTTP
│   │   │   │   ├── models/         #   Interfaces & modèles TS
│   │   │   │   ├── pipes/          #   Pipes personnalisés
│   │   │   │   ├── services/       #   Services API & auth
│   │   │   │   └── utils/          #   Utilitaires
│   │   │   │
│   │   │   ├── features/           # Modules fonctionnels
│   │   │   │   ├── admin/          #   Administration
│   │   │   │   ├── auth/           #   Pages de connexion
│   │   │   │   ├── dashboard/      #   Tableau de bord
│   │   │   │   ├── distributions/  #   Distributions
│   │   │   │   ├── exercices/      #   Exercices comptables
│   │   │   │   ├── membres/        #   Gestion des membres
│   │   │   │   ├── penalites/      #   Pénalités
│   │   │   │   ├── prets/          #   Prêts
│   │   │   │   ├── rapports/       #   Rapports & exports
│   │   │   │   ├── reunions/       #   Réunions
│   │   │   │   ├── secours/        #   Secours
│   │   │   │   ├── tontines/       #   Tontines
│   │   │   │   └── transactions/   #   Transactions
│   │   │   │
│   │   │   ├── layouts/            # Layouts (sidebar, header…)
│   │   │   └── shared/             # Composants partagés
│   │   │
│   │   ├── environments/           # Configurations par environnement
│   │   ├── styles.scss             # Styles globaux SCSS
│   │   └── main.ts                 # Bootstrap Angular
│   │
│   ├── angular.json                # Configuration Angular CLI
│   └── tsconfig.json               # Configuration TypeScript
│
├── database/                       # Scripts SQL
│   ├── diagrams/                   # Diagrammes de schéma
│   ├── init/                       # Scripts d'initialisation Docker
│   ├── migrations/                 # Migrations SQL manuelles
│   └── seeders/                    # Données de peuplement
│
├── docs/                           # Documentation projet
│   ├── ARCHITECTURE.md             # Architecture technique détaillée
│   ├── SETUP.md                    # Guide d'installation
│   ├── ADR/                        # Architecture Decision Records
│   └── README.md                   # Index de la documentation
│
├── docker-compose.yml              # MySQL 8 + phpMyAdmin
├── package.json                    # Monorepo (npm workspaces)
├── .editorconfig                   # Règles d'éditeur
└── .gitignore
```

---

## ✅ Prérequis

- **Node.js** ≥ 20 LTS
- **npm** ≥ 10
- **MySQL 8.0** — via [Docker](https://www.docker.com/) ou [XAMPP](https://www.apachefriends.org/)
- **Angular CLI** ≥ 20 (pour le frontend)

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/evradchris0-tech/Nkapay.git
cd Nkapay

# 2. Installer toutes les dépendances (backend + frontend)
npm install

# 3. Configurer les variables d'environnement
cp backend/.env.example backend/.env
# → Éditer backend/.env avec vos paramètres MySQL et JWT
```

---

## 🏁 Démarrage

### Option A — Avec Docker (recommandé)

```bash
# Démarrer MySQL 8 + phpMyAdmin
npm run docker:up

# phpMyAdmin disponible sur http://localhost:8080

# Lancer le backend en mode développement
npm run backend:dev

# Lancer le frontend Angular
cd Frontend && npm start
# → http://localhost:4200
```

### Option B — Avec XAMPP

1. Démarrer MySQL via XAMPP (port `3306`)
2. Créer la base de données `nkapay_db`
3. Configurer `backend/.env` avec vos identifiants MySQL
4. Lancer les services :

```bash
npm run backend:dev     # API → http://localhost:3000
cd Frontend && npm start  # App → http://localhost:4200
```

---

## 📜 Scripts Disponibles

### Depuis la racine (monorepo)

| Commande | Description |
|----------|-------------|
| `npm run backend:dev` | Démarre le backend en mode développement (hot-reload) |
| `npm run backend:build` | Compile le TypeScript backend |
| `npm run backend:start` | Démarre le backend compilé (production) |
| `npm run backend:test` | Exécute les tests Jest avec couverture |
| `npm run backend:lint` | Vérifie le code avec ESLint |
| `npm run db:migrate` | Exécute les migrations TypeORM |
| `npm run db:seed` | Peuple la base avec les données de référence |
| `npm run docker:up` | Démarre les conteneurs Docker |
| `npm run docker:down` | Arrête les conteneurs Docker |
| `npm run docker:logs` | Affiche les logs Docker en temps réel |

### Depuis `backend/`

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur dev avec `ts-node-dev` (hot-reload) |
| `npm run build` | Compilation TypeScript |
| `npm run test` | Tests Jest + couverture |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint:fix` | Correction automatique ESLint |
| `npm run format` | Formatage Prettier |
| `npm run migration:generate` | Générer une migration TypeORM |
| `npm run migration:run` | Appliquer les migrations |
| `npm run migration:revert` | Annuler la dernière migration |
| `npm run seed:run` | Exécuter les seeders |

### Depuis `Frontend/`

| Commande | Description |
|----------|-------------|
| `npm start` | Serveur dev Angular (`http://localhost:4200`) |
| `npm run build` | Build de production |
| `npm run test` | Tests Jasmine/Karma |

---

## 🧩 Modules Métier

Chaque module backend suit une architecture en couches cohérente :

```
modules/<nom-module>/
├── controllers/    # Contrôleurs HTTP (routes → service)
├── services/       # Logique métier
├── repositories/   # Accès aux données (TypeORM)
├── entities/       # Entités / modèles de données
├── dto/            # Data Transfer Objects
├── validators/     # Règles de validation (express-validator)
├── routes/         # Définition des routes Express
└── index.ts        # Point d'export du module
```

### Liste des modules

| Module | Description |
|--------|-------------|
| **auth** | Authentification JWT (login, register, refresh token) |
| **utilisateurs** | CRUD utilisateurs, rôles et permissions |
| **tontines** | Création et gestion des tontines, règles, paramétrage |
| **adhesions** | Adhésion / départ des membres dans les tontines |
| **exercices** | Exercices comptables, ouverture, clôture, cassation |
| **reunions** | Planification et suivi des réunions |
| **transactions** | Cotisations, versements et opérations financières |
| **distributions** | Distribution des fonds aux bénéficiaires |
| **prets** | Gestion des prêts aux membres |
| **secours** | Module d'aide sociale / secours |
| **penalites** | Gestion des pénalités (retards, absences…) |
| **dashboard** | Tableau de bord et statistiques |
| **exports** | Génération de rapports PDF et Excel |

---

## 📖 Documentation API

Après démarrage du backend, la documentation Swagger est disponible :

```
http://localhost:3000/api-docs
```

Des **collections Postman** sont également disponibles dans `backend/postman/` pour tester les workflows complets.

---

## 🧪 Tests

```bash
# Tests unitaires + couverture
npm run backend:test

# Tests en mode watch
cd backend && npm run test:watch
```

Les tests sont organisés en :
- `tests/unit/` — Tests unitaires des services et utilitaires
- `tests/integration/` — Tests d'intégration des endpoints API
- `backend/scripts/test-caya-workflows.ts` — Script de test de workflows complets

---

## 🔐 Variables d'Environnement

Copier `backend/.env.example` → `backend/.env` et configurer :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement d'exécution | `development` |
| `PORT` | Port du serveur API | `3000` |
| `API_PREFIX` | Préfixe des routes API | `/api/v1` |
| `DB_HOST` | Hôte MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USERNAME` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | — |
| `DB_DATABASE` | Nom de la base de données | `nkapay_db` |
| `DB_SYNCHRONIZE` | Synchronisation auto des schémas | `false` |
| `DB_LOGGING` | Affichage des requêtes SQL | `true` |
| `JWT_SECRET` | Clé secrète JWT (≥ 32 caractères) | — |
| `JWT_EXPIRES_IN` | Durée de validité du token | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Durée du refresh token | `7d` |
| `LOG_LEVEL` | Niveau de logging Winston | `debug` |
| `CORS_ORIGIN` | Origine CORS autorisée | `http://localhost:4200` |

---

## 📐 Conventions

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers | `kebab-case` | `user-service.ts` |
| Classes | `PascalCase` | `UserService` |
| Fonctions / Variables | `camelCase` | `getUserById` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Tables SQL | `snake_case` | `adhesion_tontine` |
| Colonnes SQL | `snake_case` | `date_adhesion_tontine` |

### Flux de données (Backend)

```
Client HTTP
    │
    ▼
[Route] → [Middleware Auth] → [Validation]
    │
    ▼
[Controller] ─── traite la requête HTTP
    │
    ▼
[Service] ────── logique métier
    │
    ▼
[Repository] ─── accès aux données (TypeORM)
    │
    ▼
[Entity] ─────── modèle de données
    │
    ▼
[MySQL] ──────── persistance
```

---

## 📄 Licence

**Proprietary** — Tous droits réservés.
