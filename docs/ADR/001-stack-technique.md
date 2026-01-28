# ADR-001: Stack Technique

## Date
2026-01-28

## Statut
Accepte

## Contexte

Le projet Nkapay necessite une architecture backend robuste pour gerer les operations de tontines avec des exigences de fiabilite, performance et maintenabilite.

## Decision

### Backend
- **Runtime**: Node.js 20 LTS pour la stabilite et le support long terme
- **Framework**: Express.js pour sa maturite et son ecosysteme
- **Langage**: TypeScript pour le typage statique et la qualite du code
- **ORM**: TypeORM pour la compatibilite TypeScript et les migrations

### Base de Donnees
- **SGBD**: MySQL 8 (utilisation de XAMPP en local)
- **Charset**: utf8mb4_unicode_ci pour le support complet Unicode
- **UUIDs**: CHAR(36) pour la lisibilite en developpement

### Qualite
- **Validation**: express-validator pour la validation des entrees
- **Documentation**: Swagger/OpenAPI pour l'auto-documentation
- **Logging**: Winston pour la flexibilite de configuration
- **Tests**: Jest pour les tests unitaires et d'integration
- **Linting**: ESLint + Prettier pour la coherence du code

## Consequences

### Positives
- TypeScript reduit les erreurs a l'execution
- TypeORM facilite les migrations et le versionning du schema
- Swagger genere automatiquement la documentation API
- Jest offre une couverture de tests complete

### Negatives
- Courbe d'apprentissage pour TypeORM
- Compilation TypeScript ajoute une etape de build
- Configuration initiale plus complexe

## Alternatives Considerees

| Alternative | Raison du rejet |
|-------------|-----------------|
| Sequelize | Moins integre avec TypeScript |
| Prisma | Migration depuis schema existant complexe |
| MongoDB | Modele relationnel requis pour les tontines |
| Fastify | Ecosysteme moins mature qu'Express |
