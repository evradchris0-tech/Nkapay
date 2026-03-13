# 📋 Plan de Test API — Nkapay

> **Date de génération** : 2026-02-25
> **Base URL** : `http://localhost:3000`
> **Préfixe API** : `/api/v1`
> **Super Admin** : `237600000000` / `password123`

---

## 📌 Table des Matières

- 1. Santé
- 2. Authentification
- 3. Utilisateurs
- 4. Langues
- 5. Types de Tontine
- 6. Tontines
- 7. Adhésions Tontine
- 8. Définitions de Règles
- 9. Règles Tontine
- 10. Exercices
- 11. Exercice Membres
- 12. Règles Exercice
- 13. Cassations
- 14. Réunions
- 15. Présences
- 16. Transactions
- 17. Dues (Cotisations/Pots/Épargnes/Inscriptions)
- 18. Opérateurs de Paiement
- 19. Paiements Mobile
- 20. Projets
- 21. Distributions
- 22. Prêts
- 23. Remboursements
- 24. Types de Pénalité
- 25. Pénalités
- 26. Types Événement Secours
- 27. Événements Secours
- 28. Bilans & Secours Dus
- 29. Demandes d'Adhésion
- 30. Dashboard
- 31. Exports

---

## 1. ❤️ Santé

### GET `/health`
* **Description** : Vérifie que le serveur est opérationnel
* **Authentification** : Non requise
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `{ success: true, data: { status: "healthy", uptime: ... } }`

---

## 2. 🔐 Authentification

### POST `/api/v1/auth/login`
* **Description** : Authentifie un utilisateur et retourne les tokens JWT
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `identifiant` | string | Requis | Numéro de téléphone. Ex: `237600000000` |
| `motDePasse` | string | Requis | Mot de passe. Ex: `password123` |

* **Sortie (Response)** : `200` — `{ data: { accessToken, refreshToken, expiresIn, utilisateur: { id, prenom, nom, telephone1, estSuperAdmin } } }`

---

### POST `/api/v1/auth/refresh`
* **Description** : Génère un nouveau accessToken à partir du refreshToken
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `refreshToken` | string | Requis | Le refresh token obtenu au login |

* **Sortie (Response)** : `200` — `{ data: { accessToken, expiresIn } }`

---

### POST `/api/v1/auth/logout`
* **Description** : Révoque la session active ou toutes les sessions
* **Authentification** : Oui — Bearer Token
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `sessionId` | uuid | Optionnel | ID de la session à révoquer |
| `toutesLesSessions` | boolean | Optionnel | Si `true`, révoque toutes les sessions |

* **Sortie (Response)** : `200` — `{ success: true, message: "Déconnexion réussie" }`

---

### GET `/api/v1/auth/sessions`
* **Description** : Liste les sessions actives de l'utilisateur connecté
* **Authentification** : Oui — Bearer Token
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — Liste de `SessionUtilisateur[]`

---

### GET `/api/v1/auth/me`
* **Description** : Retourne les infos de l'utilisateur authentifié
* **Authentification** : Oui — Bearer Token
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — Objet `Utilisateur` complet

---

## 3. 👤 Utilisateurs

### GET `/api/v1/utilisateurs`
* **Description** : Liste paginée des utilisateurs
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `page` | integer (query) | Optionnel | Numéro de page (défaut: 1) |
| `limit` | integer (query) | Optionnel | Éléments par page (défaut: 20) |

* **Sortie (Response)** : `200` — `{ data: { items: Utilisateur[], total, page, limit } }`

---

### POST `/api/v1/utilisateurs`
* **Description** : Crée un nouvel utilisateur
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `prenom` | string | Requis | Ex: `Jean` |
| `nom` | string | Requis | Ex: `KAMGA` |
| `telephone1` | string | Requis | Unique. Ex: `237655001122` |
| `password` | string | Requis | Min 8 car. |
| `telephone2` | string | Optionnel | Numéro secondaire |
| `adresseResidence` | string | Optionnel | Adresse |

* **Sortie (Response)** : `201` — Objet `Utilisateur` créé

---

### GET `/api/v1/utilisateurs/:id`
* **Description** : Récupère un utilisateur par son ID
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID utilisateur |

* **Sortie (Response)** : `200` — Objet `Utilisateur`

---

### PUT `/api/v1/utilisateurs/:id`
* **Description** : Met à jour un utilisateur
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID utilisateur |
| `prenom` | string | Optionnel | Nouveau prénom |
| `nom` | string | Optionnel | Nouveau nom |

* **Sortie (Response)** : `200` — Objet `Utilisateur` mis à jour

---

### PATCH `/api/v1/utilisateurs/:id/password`
* **Description** : Change le mot de passe
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID utilisateur |
| `ancienMotDePasse` | string | Requis | Mot de passe actuel |
| `nouveauMotDePasse` | string | Requis | Nouveau mot de passe |
| `confirmationMotDePasse` | string | Requis | Confirmation |

* **Sortie (Response)** : `200` — `{ message: "Mot de passe modifié" }`

---

### DELETE `/api/v1/utilisateurs/:id`
* **Description** : Supprime un utilisateur
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation de suppression

---

## 4. 🌐 Langues

### GET `/api/v1/langues`
* **Description** : Liste toutes les langues disponibles
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `Langue[]`

---

### GET `/api/v1/langues/default`
* **Description** : Récupère la langue par défaut (FR)
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — Objet `Langue`

---

### POST `/api/v1/langues`
* **Description** : Crée une nouvelle langue
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string | Requis | Ex: `es` |
| `nom` | string | Requis | Ex: `Español` |
| `nomNatif` | string | Optionnel | Nom dans la langue |
| `estDefaut` | boolean | Optionnel | Langue par défaut |

* **Sortie (Response)** : `201` — Objet `Langue` créé

---

### GET `/api/v1/langues/:id`
* **Description** : Récupère une langue par ID
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `Langue`

---

### PUT `/api/v1/langues/:id`
* **Description** : Met à jour une langue
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `Langue` modifié

---

### DELETE `/api/v1/langues/:id`
* **Description** : Supprime une langue
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 5. 📋 Types de Tontine

### GET `/api/v1/tontines/types`
* **Description** : Liste les types de tontine
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `actifOnly` | boolean (query) | Optionnel | Filtrer actifs uniquement |

* **Sortie (Response)** : `200` — `TontineType[]`

---

### POST `/api/v1/tontines/types`
* **Description** : Crée un type de tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string | Requis | Ex: `STANDARD` |
| `libelle` | string | Requis | Ex: `Tontine Standard` |
| `description` | string | Optionnel | Description |

* **Sortie (Response)** : `201` — Objet `TontineType`

---

### GET `/api/v1/tontines/types/code/:code`
* **Description** : Trouve un type par son code
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string (path) | Requis | Ex: `STANDARD` |

* **Sortie (Response)** : `200` — Objet `TontineType`

---

### GET `/api/v1/tontines/types/:id`
* **Description** : Détail d'un type par ID
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `TontineType`

---

### PUT `/api/v1/tontines/types/:id`
* **Description** : Met à jour un type
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |
| `libelle` | string | Optionnel |  |
| `description` | string | Optionnel |  |
| `estActif` | boolean | Optionnel |  |

* **Sortie (Response)** : `200` — Objet mis à jour

---

### DELETE `/api/v1/tontines/types/:id`
* **Description** : Désactive un type
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation

---

## 6. 🏦 Tontines

### GET `/api/v1/tontines`
* **Description** : Liste toutes les tontines
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `statut` | string (query) | Optionnel | ACTIVE, INACTIVE, SUSPENDUE |

* **Sortie (Response)** : `200` — `Tontine[]`

---

### POST `/api/v1/tontines`
* **Description** : Crée une nouvelle tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `nom` | string | Requis | Ex: `Tontine CAYA` |
| `nomCourt` | string | Requis | Ex: `CAYA` |
| `tontineTypeId` | uuid | Requis | ID du type |
| `anneeFondation` | integer | Optionnel | Ex: 2020 |
| `motto` | string | Optionnel | Devise |
| `estOfficiellementDeclaree` | boolean | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Tontine` créé

---

### GET `/api/v1/tontines/code/:nomCourt`
* **Description** : Trouve une tontine par son nom court
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `nomCourt` | string (path) | Requis | Ex: `CAYA` |

* **Sortie (Response)** : `200` — Objet `Tontine`

---

### GET `/api/v1/tontines/:id`
* **Description** : Détail d'une tontine
* **Authentification** : Non requise
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `Tontine` avec relations

---

### PUT `/api/v1/tontines/:id`
* **Description** : Met à jour une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |
| `nom` | string | Optionnel |  |
| `motto` | string | Optionnel |  |

* **Sortie (Response)** : `200` — Objet mis à jour

---

### POST `/api/v1/tontines/:id/suspend`
* **Description** : Suspend une tontine active
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Tontine avec statut SUSPENDUE

---

### POST `/api/v1/tontines/:id/activate`
* **Description** : Réactive une tontine suspendue
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Tontine avec statut ACTIVE

---

### DELETE `/api/v1/tontines/:id`
* **Description** : Supprime une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation

---

## 7. 🤝 Adhésions Tontine

### POST `/api/v1/tontines/adhesions`
* **Description** : Ajoute un membre à une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid | Requis | ID tontine |
| `utilisateurId` | uuid | Requis | ID utilisateur |
| `matricule` | string | Requis | Ex: `CAYA-001` |
| `role` | string | Optionnel | PRESIDENT, TRESORIER, SECRETAIRE, MEMBRE... |

* **Sortie (Response)** : `201` — Objet `AdhesionTontine`

---

### GET `/api/v1/tontines/adhesions/tontine/:tontineId`
* **Description** : Liste les membres d'une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis | ID tontine |

* **Sortie (Response)** : `200` — `AdhesionTontine[]`

---

### GET `/api/v1/tontines/adhesions/user/:utilisateurId`
* **Description** : Adhésions d'un utilisateur
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `utilisateurId` | uuid (path) | Requis | ID utilisateur |

* **Sortie (Response)** : `200` — `AdhesionTontine[]`

---

### GET `/api/v1/tontines/adhesions/:id`
* **Description** : Détail d'une adhésion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `AdhesionTontine`

---

### PUT `/api/v1/tontines/adhesions/:id`
* **Description** : Met à jour une adhésion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet mis à jour

---

### PUT `/api/v1/tontines/adhesions/:id/role`
* **Description** : Change le rôle d'un membre
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |
| `role` | string | Requis | Nouveau rôle |

* **Sortie (Response)** : `200` — Adhésion avec rôle mis à jour

---

### POST `/api/v1/tontines/adhesions/:id/deactivate`
* **Description** : Désactive un membre
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Adhésion désactivée

---

### POST `/api/v1/tontines/adhesions/:id/reactivate`
* **Description** : Réactive un membre
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Adhésion réactivée

---

### DELETE `/api/v1/tontines/adhesions/:id`
* **Description** : Supprime une adhésion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation

---

## 8. 📏 Définitions de Règles

### GET `/api/v1/tontines/rule-definitions`
* **Description** : Liste toutes les définitions de règles
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `RuleDefinition[]`

---

### GET `/api/v1/tontines/rule-definitions/modifiables/tontine`
* **Description** : Règles modifiables au niveau tontine
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `RuleDefinition[]` filtrées

---

### GET `/api/v1/tontines/rule-definitions/modifiables/exercice`
* **Description** : Règles modifiables au niveau exercice
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `RuleDefinition[]` filtrées

---

### GET `/api/v1/tontines/rule-definitions/categorie/:categorie`
* **Description** : Filtre par catégorie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `categorie` | string (path) | Requis | Ex: `COTISATION` |

* **Sortie (Response)** : `200` — `RuleDefinition[]`

---

### GET `/api/v1/tontines/rule-definitions/cle/:cle`
* **Description** : Trouve par clé unique
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `cle` | string (path) | Requis | Ex: `MONTANT_COTISATION` |

* **Sortie (Response)** : `200` — Objet `RuleDefinition`

---

### GET `/api/v1/tontines/rule-definitions/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet `RuleDefinition`

---

### POST `/api/v1/tontines/rule-definitions`
* **Description** : Crée une définition
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `cle` | string | Requis | Clé unique |
| `libelle` | string | Requis | Libellé |
| `categorie` | string | Requis | Catégorie |
| `typeValeur` | string | Requis | NOMBRE, TEXTE, BOOLEEN |
| `valeurParDefaut` | string | Requis | Valeur par défaut |

* **Sortie (Response)** : `201` — Objet créé

---

### PUT `/api/v1/tontines/rule-definitions/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/tontines/rule-definitions/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation

---

## 9. ⚙️ Règles Tontine

### POST `/api/v1/tontines/regles-tontine`
* **Description** : Crée ou met à jour une règle tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid | Requis | ID tontine |
| `ruleDefinitionId` | uuid | Requis | ID définition |
| `valeur` | string | Requis | Valeur. Ex: `10000` |

* **Sortie (Response)** : `200` — Objet `RegleTontine`

---

### GET `/api/v1/tontines/regles-tontine/tontine/:tontineId`
* **Description** : Liste les règles d'une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — `RegleTontine[]`

---

### GET `/api/v1/tontines/regles-tontine/tontine/:tontineId/effectives`
* **Description** : Règles effectives (avec valeurs par défaut)
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Map clé→valeur

---

### GET `/api/v1/tontines/regles-tontine/tontine/:tontineId/valeur/:cle`
* **Description** : Récupère la valeur d'une règle
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis | ID |
| `cle` | string (path) | Requis | Ex: `MONTANT_COTISATION` |

* **Sortie (Response)** : `200` — `{ valeur: "10000" }`

---

### POST `/api/v1/tontines/regles-tontine/tontine/:tontineId/initialize`
* **Description** : Initialise les règles par défaut
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — `RegleTontine[]` créées

---

### GET `/api/v1/tontines/regles-tontine/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Objet

---

### PUT `/api/v1/tontines/regles-tontine/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |
| `valeur` | string | Requis | Nouvelle valeur |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/tontines/regles-tontine/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis | ID |

* **Sortie (Response)** : `200` — Confirmation

---

## 10. 📅 Exercices

### GET `/api/v1/exercices`
* **Description** : Liste les exercices
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (query) | Requis | ID tontine |
| `statut` | string (query) | Optionnel | BROUILLON, OUVERT, SUSPENDU, FERME |

* **Sortie (Response)** : `200` — `Exercice[]`

---

### POST `/api/v1/exercices`
* **Description** : Crée un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid | Requis |  |
| `libelle` | string | Requis | Ex: `Exercice 2025-2026` |
| `anneeDebut` | integer | Requis | Ex: 2025 |
| `moisDebut` | integer | Requis | 1-12 |
| `dureeMois` | integer | Requis | Durée en mois |

* **Sortie (Response)** : `201` — Objet `Exercice`

---

### GET `/api/v1/exercices/tontine/:tontineId/ouvert`
* **Description** : Trouve l'exercice ouvert d'une tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `tontineId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `Exercice`

---

### GET `/api/v1/exercices/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `Exercice`

---

### PATCH `/api/v1/exercices/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `libelle` | string | Optionnel |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/exercices/:id/ouvrir`
* **Description** : Ouvre un exercice BROUILLON
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `dateOuverture` | date | Optionnel |  |

* **Sortie (Response)** : `200` — Exercice OUVERT

---

### POST `/api/v1/exercices/:id/suspendre`
* **Description** : Suspend un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Exercice SUSPENDU

---

### POST `/api/v1/exercices/:id/reprendre`
* **Description** : Reprend un exercice suspendu
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Exercice OUVERT

---

### POST `/api/v1/exercices/:id/fermer`
* **Description** : Ferme un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Exercice FERME

---

### DELETE `/api/v1/exercices/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 11. 👥 Exercice Membres

### POST `/api/v1/exercices-membres`
* **Description** : Ajoute un membre à un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid | Requis |  |
| `adhesionTontineId` | uuid | Requis |  |
| `typeMembre` | string | Requis | ANCIEN ou NOUVEAU |
| `nombreParts` | integer | Optionnel | Défaut: 1 |

* **Sortie (Response)** : `201` — Objet `ExerciceMembre`

---

### GET `/api/v1/exercices-membres/exercice/:exerciceId`
* **Description** : Liste les membres d'un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |
| `typeMembre` | string (query) | Optionnel |  |
| `statut` | string (query) | Optionnel | ACTIF, INACTIF |

* **Sortie (Response)** : `200` — `ExerciceMembre[]`

---

### GET `/api/v1/exercices-membres/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/exercices-membres/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `nombreParts` | integer | Optionnel |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/exercices-membres/:id/deactivate`
* **Description** : Désactive
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Membre INACTIF

---

### POST `/api/v1/exercices-membres/:id/reactivate`
* **Description** : Réactive
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Membre ACTIF

---

### DELETE `/api/v1/exercices-membres/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 12. ⚙️ Règles Exercice

### POST `/api/v1/regles-exercice`
* **Description** : Crée ou met à jour une règle d'exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid | Requis |  |
| `ruleDefinitionId` | uuid | Requis |  |
| `valeur` | string | Requis |  |

* **Sortie (Response)** : `200` — Objet `RegleExercice`

---

### GET `/api/v1/regles-exercice/exercice/:exerciceId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `RegleExercice[]`

---

### GET `/api/v1/regles-exercice/exercice/:exerciceId/effectives`
* **Description** : Règles effectives
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Map clé→valeur

---

### GET `/api/v1/regles-exercice/exercice/:exerciceId/valeur/:cle`
* **Description** : Valeur effective
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |
| `cle` | string (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ valeur }`

---

### POST `/api/v1/regles-exercice/exercice/:exerciceId/initialize`
* **Description** : Copie les règles de la tontine
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `RegleExercice[]`

---

### GET `/api/v1/regles-exercice/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PUT `/api/v1/regles-exercice/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `valeur` | string | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/regles-exercice/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 13. 💰 Cassations

### POST `/api/v1/cassations/exercice/:exerciceId/calculer`
* **Description** : Calcule les cassations d'un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `Cassation[]` calculées

---

### PATCH `/api/v1/cassations/:id/distribuer`
* **Description** : Distribue une cassation
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Cassation distribuée

---

### PATCH `/api/v1/cassations/exercice/:exerciceId/distribuer-tout`
* **Description** : Distribue toutes les cassations
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Résultat global

---

### PATCH `/api/v1/cassations/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Cassation annulée

---

### GET `/api/v1/cassations/exercice/:exerciceId`
* **Description** : Liste les cassations
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `Cassation[]`

---

### GET `/api/v1/cassations/exercice/:exerciceId/summary`
* **Description** : Résumé statistique
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet résumé

---

### GET `/api/v1/cassations/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `Cassation`

---

### DELETE `/api/v1/cassations/exercice/:exerciceId/reset`
* **Description** : Réinitialise
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 14. 📆 Réunions

### GET `/api/v1/reunions`
* **Description** : Liste les réunions
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |
| `statut` | string (query) | Optionnel | PLANIFIEE, OUVERTE, CLOTUREE, ANNULEE |

* **Sortie (Response)** : `200` — `Reunion[]`

---

### POST `/api/v1/reunions`
* **Description** : Planifie une nouvelle réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid | Requis |  |
| `numeroReunion` | integer | Requis | Ex: 1 |
| `dateReunion` | date | Requis | Ex: `2025-10-05` |
| `heureDebut` | string | Optionnel | HH:MM |
| `lieu` | string | Optionnel |  |
| `hoteExerciceMembreId` | uuid | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Reunion`

---

### GET `/api/v1/reunions/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/reunions/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `lieu` | string | Optionnel |  |
| `heureDebut` | string | Optionnel |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/reunions/:id/ouvrir`
* **Description** : Ouvre une réunion planifiée
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Réunion OUVERTE

---

### POST `/api/v1/reunions/:id/cloturer`
* **Description** : Clôture une réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `clotureeParExerciceMembreId` | uuid | Requis |  |

* **Sortie (Response)** : `200` — Réunion CLOTUREE

---

### POST `/api/v1/reunions/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Réunion ANNULEE

---

### DELETE `/api/v1/reunions/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 15. ✅ Présences

### POST `/api/v1/presences`
* **Description** : Enregistre une présence
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `exerciceMembreId` | uuid | Requis |  |
| `estPresent` | boolean | Requis |  |
| `estEnRetard` | boolean | Optionnel |  |
| `heureArrivee` | string | Optionnel | HH:MM |
| `note` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `PresenceReunion`

---

### POST `/api/v1/presences/bulk`
* **Description** : Enregistre plusieurs présences
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `presences` | array | Requis | Tableau de `{exerciceMembreId, estPresent, estEnRetard}` |

* **Sortie (Response)** : `200` — Résumé des présences

---

### GET `/api/v1/presences/reunion/:reunionId`
* **Description** : Liste les présences
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `PresenceReunion[]`

---

### GET `/api/v1/presences/reunion/:reunionId/summary`
* **Description** : Statistiques de présence
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ totalMembres, presents, absents, enRetard, tauxPresence }`

---

### GET `/api/v1/presences/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/presences/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `estEnRetard` | boolean | Optionnel |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/presences/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 16. 💸 Transactions

### POST `/api/v1/transactions/cotisation`
* **Description** : Créer une transaction de type cotisation
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `exerciceMembreId` | uuid | Requis |  |
| `montant` | number | Requis | Ex: 10000 XAF |
| `description` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Transaction`

---

### POST `/api/v1/transactions/pot`
* **Description** : Transaction de type pot
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `exerciceMembreId` | uuid | Requis |  |
| `montant` | number | Requis | Ex: 50000 XAF |

* **Sortie (Response)** : `201` — Objet `Transaction`

---

### POST `/api/v1/transactions/inscription`
* **Description** : Droit d'inscription
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceMembreId` | uuid | Requis |  |
| `montant` | number | Requis | Ex: 5000 XAF |

* **Sortie (Response)** : `201` — Objet `Transaction`

---

### GET `/api/v1/transactions/summary`
* **Description** : Résumé financier global
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — Statistiques agrégées

---

### GET `/api/v1/transactions/reference/:reference`
* **Description** : Trouve par référence unique
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reference` | string (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `Transaction`

---

### POST `/api/v1/transactions`
* **Description** : Crée une transaction
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Optionnel |  |
| `typeTransaction` | string | Requis | COTISATION, POT, INSCRIPTION, PENALITE... |
| `exerciceMembreId` | uuid | Requis |  |
| `montant` | number | Requis |  |

* **Sortie (Response)** : `201` — 

---

### GET `/api/v1/transactions`
* **Description** : Liste paginée
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — `Transaction[]`

---

### GET `/api/v1/transactions/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/transactions/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/transactions/:id/soumettre`
* **Description** : Soumet pour validation
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Transaction SOUMISE

---

### POST `/api/v1/transactions/:id/valider`
* **Description** : Valide
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Transaction VALIDE

---

### POST `/api/v1/transactions/:id/rejeter`
* **Description** : Rejette
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Transaction REJETEE

---

### POST `/api/v1/transactions/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Transaction ANNULEE

---

### DELETE `/api/v1/transactions/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 17. 📊 Dues (Cotisations, Pots, Épargnes, Inscriptions)

### POST `/api/v1/dues/cotisations/reunion/:reunionId/generer`
* **Description** : Génère les cotisations dues pour une réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Cotisations générées

---

### POST `/api/v1/dues/cotisations/:id/payer`
* **Description** : Marque une cotisation comme payée
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Cotisation payée

---

### GET `/api/v1/dues/cotisations/reunion/:reunionId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `CotisationDue[]`

---

### GET `/api/v1/dues/cotisations/reunion/:reunionId/stats`
* **Description** : Statistiques
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ total, payees, impayees, montantTotal }`

---

### POST `/api/v1/dues/pots/reunion/:reunionId/generer`
* **Description** : Génère les pots dus
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Pots générés

---

### POST `/api/v1/dues/pots/:id/payer`
* **Description** : Marque un pot comme payé
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Pot payé

---

### GET `/api/v1/dues/pots/reunion/:reunionId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `PotDu[]`

---

### GET `/api/v1/dues/pots/reunion/:reunionId/stats`
* **Description** : Stats
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Statistiques

---

### GET `/api/v1/dues/pots/reunion/:reunionId/total`
* **Description** : Montant total du pot
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ total }`

---

### POST `/api/v1/dues/inscriptions/exercice/:exerciceId/generer`
* **Description** : Génère les inscriptions dues
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Inscriptions générées

---

### POST `/api/v1/dues/inscriptions/:id/payer`
* **Description** : Paie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Inscription payée

---

### GET `/api/v1/dues/inscriptions/exercice/:exerciceId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `InscriptionDue[]`

---

### GET `/api/v1/dues/inscriptions/exercice/:exerciceId/stats`
* **Description** : Stats
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Statistiques

---

### GET `/api/v1/dues/inscriptions/en-retard`
* **Description** : Inscriptions en retard
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `InscriptionDue[]` en retard

---

### POST `/api/v1/dues/epargnes/reunion/:reunionId/generer`
* **Description** : Génère les épargnes dues
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Épargnes générées

---

### POST `/api/v1/dues/epargnes/:id/payer`
* **Description** : Paie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Épargne payée

---

### GET `/api/v1/dues/epargnes/reunion/:reunionId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `EpargneDue[]`

---

### GET `/api/v1/dues/epargnes/reunion/:reunionId/stats`
* **Description** : Stats
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Statistiques

---

## 18. 📱 Opérateurs de Paiement

### GET `/api/v1/operateurs-paiement`
* **Description** : Liste les opérateurs
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `OperateurPaiement[]`

---

### GET `/api/v1/operateurs-paiement/code/:code`
* **Description** : Trouve par code
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string (path) | Requis | Ex: `MTN_MOMO` |

* **Sortie (Response)** : `200` — Objet

---

### POST `/api/v1/operateurs-paiement`
* **Description** : Crée un opérateur
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string | Requis |  |
| `nom` | string | Requis | Ex: `MTN Mobile Money` |
| `estActif` | boolean | Optionnel |  |

* **Sortie (Response)** : `201` — Objet créé

---

### GET `/api/v1/operateurs-paiement/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/operateurs-paiement/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/operateurs-paiement/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 19. 📲 Paiements Mobile

### POST `/api/v1/paiements-mobile`
* **Description** : Initie un paiement mobile
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `transactionId` | uuid | Requis |  |
| `operateurPaiementId` | uuid | Requis |  |
| `telephone` | string | Requis | Ex: `237670112233` |
| `montant` | number | Requis |  |

* **Sortie (Response)** : `201` — Objet `PaiementMobile`

---

### GET `/api/v1/paiements-mobile`
* **Description** : Liste tous les paiements
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `PaiementMobile[]`

---

### GET `/api/v1/paiements-mobile/pending`
* **Description** : Paiements en attente
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `PaiementMobile[]` pending

---

### GET `/api/v1/paiements-mobile/stats`
* **Description** : Stats des paiements mobile
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — Objet statistiques

---

### GET `/api/v1/paiements-mobile/transaction/:transactionId`
* **Description** : Paiements liés à une transaction
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `transactionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `PaiementMobile[]`

---

### GET `/api/v1/paiements-mobile/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### POST `/api/v1/paiements-mobile/:id/envoyer`
* **Description** : Marque comme envoyé
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Paiement ENVOYE

---

### POST `/api/v1/paiements-mobile/:id/confirmer`
* **Description** : Confirme la réception
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Paiement CONFIRME

---

### POST `/api/v1/paiements-mobile/:id/echouer`
* **Description** : Marque comme échoué
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Paiement ECHOUE

---

### POST `/api/v1/paiements-mobile/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Paiement ANNULE

---

## 20. 🎯 Projets

### POST `/api/v1/projets`
* **Description** : Crée un projet
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid | Requis |  |
| `nom` | string | Requis | Ex: `Achat de chaises` |
| `description` | string | Optionnel |  |
| `budgetPrevu` | number | Optionnel | En XAF |

* **Sortie (Response)** : `201` — Objet `Projet`

---

### GET `/api/v1/projets`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `Projet[]`

---

### GET `/api/v1/projets/exercice/:exerciceId`
* **Description** : Projets d'un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `Projet[]`

---

### GET `/api/v1/projets/exercice/:exerciceId/stats`
* **Description** : Statistiques
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet stats

---

### GET `/api/v1/projets/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PUT `/api/v1/projets/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/projets/:id/cloturer`
* **Description** : Clôture
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Projet clôturé

---

### POST `/api/v1/projets/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Projet annulé

---

### DELETE `/api/v1/projets/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 21. 🎁 Distributions

### GET `/api/v1/distributions/summary`
* **Description** : Résumé des distributions
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — Statistiques

---

### GET `/api/v1/distributions/reunion/:reunionId`
* **Description** : Distributions d'une réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `Distribution[]`

---

### POST `/api/v1/distributions`
* **Description** : Crée une distribution
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `exerciceMembreId` | uuid | Requis | Bénéficiaire |
| `montant` | number | Requis | En XAF |
| `description` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Distribution`

---

### GET `/api/v1/distributions`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `Distribution[]`

---

### GET `/api/v1/distributions/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/distributions/:id`
* **Description** : Met à jour
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### POST `/api/v1/distributions/:id/distribuer`
* **Description** : Exécute la distribution
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Distribution exécutée

---

### POST `/api/v1/distributions/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Distribution annulée

---

### DELETE `/api/v1/distributions/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 22. 🏧 Prêts

### GET `/api/v1/prets/summary`
* **Description** : Résumé des prêts
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — Statistiques des prêts

---

### POST `/api/v1/prets`
* **Description** : Demande de prêt
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid | Requis |  |
| `exerciceMembreId` | uuid | Requis |  |
| `montantCapital` | number | Requis | Ex: 150000 |
| `tauxInteret` | number | Requis | Ex: 0.05 |
| `dureeMois` | integer | Requis |  |
| `commentaire` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Pret` (statut DEMANDE)

---

### GET `/api/v1/prets`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `Pret[]`

---

### GET `/api/v1/prets/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `Pret` avec remboursements

---

### POST `/api/v1/prets/:id/approuver`
* **Description** : Approuve un prêt
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Prêt APPROUVE

---

### POST `/api/v1/prets/:id/refuser`
* **Description** : Refuse
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Prêt REFUSE

---

### POST `/api/v1/prets/:id/decaisser`
* **Description** : Décaisse le montant
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Prêt EN_COURS

---

### POST `/api/v1/prets/:id/solder`
* **Description** : Marque comme soldé
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Prêt SOLDE

---

### POST `/api/v1/prets/:id/defaut`
* **Description** : Déclare un défaut
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Prêt EN_DEFAUT

---

## 23. 💳 Remboursements de Prêts

### GET `/api/v1/remboursements-prets/pret/:pretId`
* **Description** : Liste les remboursements d'un prêt
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `pretId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `RemboursementPret[]`

---

### GET `/api/v1/remboursements-prets/reunion/:reunionId`
* **Description** : Remboursements d'une réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `RemboursementPret[]`

---

### POST `/api/v1/remboursements-prets`
* **Description** : Enregistre un remboursement
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `pretId` | uuid | Requis |  |
| `reunionId` | uuid | Requis |  |
| `montantCapital` | number | Requis |  |
| `montantInteret` | number | Requis |  |
| `commentaire` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `RemboursementPret`

---

### GET `/api/v1/remboursements-prets/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### DELETE `/api/v1/remboursements-prets/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 24. 🏷️ Types de Pénalité

### GET `/api/v1/types-penalites`
* **Description** : Liste les types de pénalité
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `includeInactive` | boolean (query) | Optionnel | Inclure les inactifs |

* **Sortie (Response)** : `200` — `TypePenalite[]`

---

### POST `/api/v1/types-penalites`
* **Description** : Crée un type
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string | Requis | Ex: `RETARD_REUNION` |
| `libelle` | string | Requis |  |
| `modeCalcul` | string | Requis | MONTANT_FIXE, POURCENTAGE, MONTANT_PAR_JOUR |
| `valeurDefaut` | number | Optionnel | Ex: 500 |
| `description` | string | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `TypePenalite`

---

### GET `/api/v1/types-penalites/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/types-penalites/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/types-penalites/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 25. ⚠️ Pénalités

### GET `/api/v1/penalites`
* **Description** : Liste les pénalités
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |
| `exerciceMembreId` | uuid (query) | Optionnel |  |
| `statut` | string (query) | Optionnel | EN_ATTENTE, PAYEE, ANNULEE, PARDONNEE |

* **Sortie (Response)** : `200` — `Penalite[]`

---

### GET `/api/v1/penalites/summary`
* **Description** : Résumé agrégé
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — Statistiques

---

### POST `/api/v1/penalites`
* **Description** : Applique une pénalité
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceMembreId` | uuid | Requis |  |
| `reunionId` | uuid | Optionnel |  |
| `typePenaliteId` | uuid | Requis |  |
| `montant` | number | Requis | Ex: 500 XAF |
| `motif` | string | Optionnel |  |
| `appliqueParExerciceMembreId` | uuid | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `Penalite` (statut EN_ATTENTE)

---

### GET `/api/v1/penalites/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### POST `/api/v1/penalites/:id/payer`
* **Description** : Paie une pénalité
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `transactionId` | uuid | Requis |  |

* **Sortie (Response)** : `200` — Pénalité PAYEE

---

### POST `/api/v1/penalites/:id/annuler`
* **Description** : Annule
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `motifAnnulation` | string | Requis |  |

* **Sortie (Response)** : `200` — Pénalité ANNULEE

---

### POST `/api/v1/penalites/:id/pardonner`
* **Description** : Pardonne
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `motif` | string | Requis | Raison du pardon |

* **Sortie (Response)** : `200` — Pénalité PARDONNEE

---

## 26. 🏷️ Types Événement Secours

### GET `/api/v1/types-evenements-secours`
* **Description** : Liste les types
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `includeInactive` | boolean (query) | Optionnel |  |

* **Sortie (Response)** : `200` — `TypeEvenementSecours[]`

---

### POST `/api/v1/types-evenements-secours`
* **Description** : Crée un type
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `code` | string | Requis | Ex: `NAISSANCE` |
| `libelle` | string | Requis |  |
| `description` | string | Optionnel |  |
| `montantParDefaut` | number | Optionnel |  |
| `estActif` | boolean | Optionnel |  |

* **Sortie (Response)** : `201` — Objet créé

---

### GET `/api/v1/types-evenements-secours/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PATCH `/api/v1/types-evenements-secours/:id`
* **Description** : Modifie
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet modifié

---

### DELETE `/api/v1/types-evenements-secours/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 27. 🆘 Événements Secours

### GET `/api/v1/evenements-secours`
* **Description** : Liste les événements
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |
| `statut` | string (query) | Optionnel | DECLARE, EN_COURS_VALIDATION, VALIDE, REFUSE, PAYE |
| `dateDebut` | date (query) | Optionnel |  |
| `dateFin` | date (query) | Optionnel |  |

* **Sortie (Response)** : `200` — `EvenementSecours[]`

---

### GET `/api/v1/evenements-secours/summary`
* **Description** : Résumé
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (query) | Optionnel |  |

* **Sortie (Response)** : `200` — Statistiques

---

### GET `/api/v1/evenements-secours/fonds/:exerciceId`
* **Description** : Solde du fonds de secours
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ solde, totalCotisations, totalDepenses }`

---

### GET `/api/v1/evenements-secours/renflouement/:exerciceId`
* **Description** : Calcul de renflouement
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |
| `montantCible` | number (query) | Optionnel |  |

* **Sortie (Response)** : `200` — `{ deficit, membresActifs, montantParMembre, estNecessaire }`

---

### POST `/api/v1/evenements-secours`
* **Description** : Déclare un événement
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceMembreId` | uuid | Requis |  |
| `typeEvenementSecoursId` | uuid | Requis |  |
| `dateEvenement` | date | Requis |  |
| `description` | string | Optionnel |  |
| `montantDemande` | number | Optionnel |  |

* **Sortie (Response)** : `201` — Objet `EvenementSecours` (DECLARE)

---

### GET `/api/v1/evenements-secours/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet complet

---

### POST `/api/v1/evenements-secours/:id/soumettre`
* **Description** : Soumet pour validation
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — EN_COURS_VALIDATION

---

### POST `/api/v1/evenements-secours/:id/valider`
* **Description** : Valide et approuve
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `valideParExerciceMembreId` | uuid | Requis |  |
| `montantApprouve` | number | Requis |  |

* **Sortie (Response)** : `200` — VALIDE

---

### POST `/api/v1/evenements-secours/:id/refuser`
* **Description** : Refuse
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `refuseParExerciceMembreId` | uuid | Requis |  |
| `motifRefus` | string | Requis |  |

* **Sortie (Response)** : `200` — REFUSE

---

### POST `/api/v1/evenements-secours/:id/payer`
* **Description** : Lien vers transaction manuelle
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `transactionId` | uuid | Requis |  |

* **Sortie (Response)** : `200` — PAYE

---

### POST `/api/v1/evenements-secours/:id/decaisser`
* **Description** : Décaissement automatique
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `decaisseParExerciceMembreId` | uuid | Requis |  |
| `reunionId` | uuid | Optionnel |  |
| `seuilAlerteFonds` | number | Optionnel |  |

* **Sortie (Response)** : `200` — PAYE + transaction créée

---

### POST `/api/v1/evenements-secours/:id/pieces`
* **Description** : Ajoute une pièce justificative
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `typePiece` | string | Requis | CERTIFICAT_NAISSANCE, CERTIFICAT_MEDICAL, FACTURE... |
| `nomFichier` | string | Requis |  |
| `cheminFichier` | string | Requis |  |

* **Sortie (Response)** : `201` — Pièce ajoutée

---

### GET `/api/v1/evenements-secours/:id/pieces`
* **Description** : Liste les pièces
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `PieceJustificative[]`

---

### DELETE `/api/v1/evenements-secours/:id/pieces/:pieceId`
* **Description** : Supprime une pièce
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `pieceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `204` — Pas de contenu

---

## 28. 📈 Bilans & Secours Dus

### GET `/api/v1/secours/bilans`
* **Description** : Liste tous les bilans
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `BilanSecoursExercice[]`

---

### GET `/api/v1/secours/bilans/exercice/:exerciceId`
* **Description** : Récupère ou crée le bilan d'un exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet `BilanSecoursExercice`

---

### GET `/api/v1/secours/bilans/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### PUT `/api/v1/secours/bilans/exercice/:exerciceId/solde-initial`
* **Description** : Met à jour le solde initial
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |
| `soldeInitial` | number | Requis | En XAF |

* **Sortie (Response)** : `200` — Bilan mis à jour

---

### POST `/api/v1/secours/bilans/exercice/:exerciceId/recalculer`
* **Description** : Recalcule le bilan
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Bilan recalculé

---

### POST `/api/v1/secours/bilans/exercice/:exerciceId/cloturer`
* **Description** : Clôture le bilan
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Bilan clôturé

---

### POST `/api/v1/secours/dus/exercice/:exerciceId/generer`
* **Description** : Génère les secours annuels dus
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `SecoursDu[]` générés

---

### POST `/api/v1/secours/dus/:id/payer`
* **Description** : Paie un secours dû
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Secours payé

---

### GET `/api/v1/secours/dus/exercice/:exerciceId`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `SecoursDu[]`

---

### GET `/api/v1/secours/dus/exercice/:exerciceId/stats`
* **Description** : Statistiques
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Statistiques

---

### GET `/api/v1/secours/dus/en-retard`
* **Description** : Secours en retard
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `SecoursDu[]` en retard

---

### GET `/api/v1/secours/dus/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

## 29. 📝 Demandes d'Adhésion

### GET `/api/v1/demandes-adhesion/summary`
* **Description** : Résumé des demandes
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — Statistiques

---

### POST `/api/v1/demandes-adhesion`
* **Description** : Soumet une demande
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `utilisateurId` | uuid | Requis |  |
| `tontineId` | uuid | Requis |  |
| `message` | string | Optionnel | Ex: `Je souhaite rejoindre CAYA` |

* **Sortie (Response)** : `201` — Objet `DemandeAdhesion` (SOUMISE)

---

### GET `/api/v1/demandes-adhesion`
* **Description** : Liste
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `DemandeAdhesion[]`

---

### GET `/api/v1/demandes-adhesion/:id`
* **Description** : Détail
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Objet

---

### POST `/api/v1/demandes-adhesion/:id/en-cours`
* **Description** : Passe en cours de traitement
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — EN_COURS

---

### POST `/api/v1/demandes-adhesion/:id/approuver`
* **Description** : Approuve la demande
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — APPROUVEE

---

### POST `/api/v1/demandes-adhesion/:id/refuser`
* **Description** : Refuse la demande
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |
| `motifRefus` | string | Optionnel | Raison du refus |

* **Sortie (Response)** : `200` — REFUSEE

---

### DELETE `/api/v1/demandes-adhesion/:id`
* **Description** : Supprime
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `id` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — Confirmation

---

## 30. 📊 Dashboard

### GET `/api/v1/dashboard/stats`
* **Description** : Statistiques globales du système
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `{ nombreTontines, nombreUtilisateurs, totalTransactions, ... }`

---

### GET `/api/v1/dashboard/activities`
* **Description** : Dernières activités
* **Authentification** : Oui
* **Entrée (Request)** : Aucune
* **Sortie (Response)** : `200` — `RecentActivity[]`

---

### GET `/api/v1/dashboard/member/:exerciceMembreId`
* **Description** : Dashboard individuel d'un membre
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceMembreId` | uuid (path) | Requis |  |

* **Sortie (Response)** : `200` — `{ cotisationsPaid, pretsActifs, penalites, distributions }`

---

## 31. 📄 Exports

### GET `/api/v1/exports/releve/:exerciceMembreId`
* **Description** : Télécharge le relevé individuel (PDF ou Excel)
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceMembreId` | uuid (path) | Requis |  |
| `format` | string (query) | Optionnel | `pdf` (défaut) ou `excel` |

* **Sortie (Response)** : `200` — Fichier binaire (application/pdf ou xlsx)

---

### GET `/api/v1/exports/rapport-exercice/:exerciceId`
* **Description** : Rapport complet de fin d'exercice
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `exerciceId` | uuid (path) | Requis |  |
| `format` | string (query) | Optionnel | `pdf` ou `excel` |

* **Sortie (Response)** : `200` — Fichier binaire

---

### GET `/api/v1/exports/rapport-mensuel/:reunionId`
* **Description** : Rapport mensuel par réunion
* **Authentification** : Oui
* **Entrée (Request)** :

| Champ | Type | Requis/Optionnel | Description |
|-------|------|------------------|-------------|
| `reunionId` | uuid (path) | Requis |  |
| `format` | string (query) | Optionnel | `pdf` ou `excel` |

* **Sortie (Response)** : `200` — Fichier binaire

---


---

## 📌 Notes Importantes

1. **Format de réponse global** : Toutes les réponses sont enveloppées dans `{ success: boolean, data: ..., message?: string }`
2. **Authentification** : Header `Authorization: Bearer <token>` obtenu via `POST /api/v1/auth/login`
3. **Données de seed** : Le serveur en mode développement peuple automatiquement la base avec :
   - **Super Admin** : `237600000000` / `password123`
   - **Tontines** : CAYA (12 membres), FAM-OMGBA (8 membres), SOLID-DLA (6 membres)
   - **Types pénalité** : RETARD_REUNION (500 XAF), ABSENCE_REUNION (1000 XAF), NON_PAIEMENT (2000 XAF), TROUBLE_REUNION (1500 XAF)
   - **Types secours** : NAISSANCE, DECES, MALADIE, MARIAGE
   - **Opérateurs** : MTN_MOMO, ORANGE_MONEY, WAVE
4. **Pagination** : Les listes supportent `?page=1&limit=20` sauf indication contraire
5. **Erreurs** : `400` (validation), `401` (non authentifié), `403` (non autorisé), `404` (non trouvé), `409` (conflit)
