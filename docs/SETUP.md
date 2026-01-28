# Guide d'Installation

## Prerequis

- Node.js 20 LTS ou superieur
- npm 10+
- MySQL 8.0 (via XAMPP ou Docker)
- Git

## Installation Locale

### 1. Cloner le depot

```bash
git clone https://github.com/evradchris0-tech/Nkapay.git
cd Nkapay
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp backend/.env.example backend/.env
```

Editer `backend/.env` avec vos parametres :

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=nkapay_db

JWT_SECRET=votre_secret_jwt_min_32_caracteres
```

### 4. Creer la base de donnees

Avec XAMPP ou MySQL CLI :

```sql
CREATE DATABASE nkapay_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Executer les migrations

```bash
npm run db:migrate
```

### 6. Demarrer le serveur

```bash
npm run backend:dev
```

Le serveur demarre sur http://localhost:3000

### 7. Acceder a la documentation

Ouvrir http://localhost:3000/api-docs

## Installation avec Docker

### 1. Demarrer les conteneurs

```bash
npm run docker:up
```

Cela demarre :
- MySQL sur le port 3307
- phpMyAdmin sur http://localhost:8080

### 2. Configurer le backend

Dans `backend/.env` :

```env
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=nkapay_user
DB_PASSWORD=nkapay_pass_2026
DB_DATABASE=nkapay_db
```

### 3. Demarrer le backend

```bash
npm run backend:dev
```

## Verification de l'Installation

```bash
# Verifier le health check
curl http://localhost:3000/health
```

Reponse attendue :

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-28T12:00:00.000Z",
    "uptime": 10.5
  }
}
```
