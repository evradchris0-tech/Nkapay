# Nkapay - Systeme de Gestion de Tontines

Application de gestion complete pour les tontines (associations rotatives d'epargne et de credit).

## Stack Technique

- **Backend**: Node.js 20 LTS, Express.js, TypeScript
- **ORM**: TypeORM
- **Base de donnees**: MySQL 8
- **Validation**: express-validator
- **Documentation API**: Swagger/OpenAPI
- **Logging**: Winston
- **Tests**: Jest
- **Linting**: ESLint + Prettier

## Prerequis

- Node.js 20 LTS ou superieur
- MySQL 8.0 (via XAMPP ou Docker)
- npm 10+

## Installation

```bash
# Cloner le depot
git clone https://github.com/evradchris0-tech/Nkapay.git
cd Nkapay

# Installer les dependances
npm install

# Copier le fichier de configuration
cp backend/.env.example backend/.env

# Configurer les variables d'environnement dans backend/.env
```

## Demarrage avec XAMPP

1. Demarrer MySQL via XAMPP (port 3306)
2. Creer la base de donnees `nkapay_db`
3. Configurer `backend/.env` avec vos identifiants MySQL
4. Lancer le backend en mode developpement

```bash
npm run backend:dev
```

## Demarrage avec Docker

```bash
# Demarrer les conteneurs (MySQL + phpMyAdmin)
npm run docker:up

# Acceder a phpMyAdmin: http://localhost:8080
# Lancer le backend
npm run backend:dev
```

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run backend:dev` | Demarre le backend en mode developpement |
| `npm run backend:build` | Compile le backend TypeScript |
| `npm run backend:start` | Demarre le backend compile |
| `npm run backend:test` | Execute les tests unitaires |
| `npm run backend:lint` | Verifie le code avec ESLint |
| `npm run db:migrate` | Execute les migrations TypeORM |
| `npm run docker:up` | Demarre les conteneurs Docker |
| `npm run docker:down` | Arrete les conteneurs Docker |

## Structure du Projet

```
Nkapay/
├── backend/              # API REST Node.js/Express
│   ├── src/
│   │   ├── config/       # Configuration (DB, JWT, env)
│   │   ├── modules/      # Modules metier
│   │   ├── shared/       # Code partage
│   │   └── app.ts        # Point d'entree
│   └── tests/
├── database/             # Scripts SQL, migrations
├── docs/                 # Documentation technique
└── docker-compose.yml
```

## Documentation API

Apres demarrage du backend, acceder a la documentation Swagger :
- http://localhost:3000/api-docs

## Licence

Proprietary - Tous droits reserves
