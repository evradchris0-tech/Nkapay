# Nkapay — Référence API Frontend

> **Base URL** : `https://api.nkapay.com/api/v1`
> **Content-Type** : `application/json`
> **Auth** : `Authorization: Bearer <accessToken>` (JWT, durée ~1h)

---

## Format de réponse universel

```json
{
  "success": true,
  "message": "string (optionnel)",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Erreur :**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [{ "field": "email", "message": "Email invalide", "value": "bad@" }]
}
```

**Codes HTTP communs :**
| Code | Signification |
|------|---------------|
| 400  | Données invalides / champ manquant |
| 401  | Token absent, expiré ou invalide |
| 403  | Rôle insuffisant |
| 404  | Ressource introuvable |
| 409  | Conflit (doublon) |
| 422  | Transition d'état impossible |
| 500  | Erreur serveur |

---

## Table des matières

1. [🔐 Authentification & Sessions](#-authentification--sessions)
2. [🏢 SaaS — Organisations & Onboarding](#-saas--organisations--onboarding)
3. [🛡️ Administration Super Admin](#️-administration-super-admin)
4. [👥 Utilisateurs & Langues](#-utilisateurs--langues)
5. [🏦 Tontines & Types](#-tontines--types)
6. [📋 Règles (RuleDefinition · RegleTontine · RegleExercice)](#-règles)
7. [🤝 Adhésions (AdhesionTontine · DemandeAdhesion)](#-adhésions)
8. [📅 Exercices & Membres](#-exercices--membres)
9. [🧮 Cassation](#-cassation)
10. [📆 Réunions & Présences](#-réunions--présences)
11. [💰 Transactions](#-transactions)
12. [📊 Obligations financières — Dues](#-obligations-financières--dues)
13. [💳 Paiements Mobile & Opérateurs](#-paiements-mobile--opérateurs)
14. [🏗️ Projets](#️-projets)
15. [🏥 Secours](#-secours)
16. [💼 Prêts & Remboursements](#-prêts--remboursements)
17. [⚠️ Pénalités & Types](#️-pénalités--types)
18. [📤 Distributions](#-distributions)
19. [📊 Dashboard & Exports](#-dashboard--exports)

---

## 🔐 Authentification & Sessions

---

### POST /auth/login

| Propriété    | Valeur               |
|--------------|----------------------|
| Auth requis  | ❌ Public            |
| Content-Type | application/json     |

**📤 Body**
```json
{
  "identifiant": "string",   // requis — numéro de téléphone (ex: "0700000001")
  "motDePasse": "string"     // requis
}
```

**📥 Succès 200**
```json
{
  "success": true,
  "message": "Connexion reussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "utilisateur": {
      "id": "uuid",
      "prenom": "string",
      "nom": "string",
      "telephone1": "string",
      "estSuperAdmin": false,
      "doitChangerMotDePasse": false
    },
    "organisations": [
      {
        "id": "uuid",
        "nom": "string",
        "slug": "string",
        "role": "ORG_ADMIN"
      }
    ]
  }
}
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Erreur de validation des donnees"` | Champ manquant |
| 401  | `"Identifiants incorrects"` | Téléphone/mot de passe invalide |
| 403  | `"Compte suspendu"` | Utilisateur désactivé |

---

### POST /auth/refresh

| Propriété    | Valeur           |
|--------------|------------------|
| Auth requis  | ❌ Public        |
| Content-Type | application/json |

**📤 Body**
```json
{
  "refreshToken": "string"   // requis — JWT refresh token
}
```

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600
  }
}
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Erreur de validation des donnees"` | Token manquant |
| 401  | `"Token invalide ou expire"` | Refresh token révoqué/expiré |

---

### POST /auth/logout

| Propriété    | Valeur               |
|--------------|----------------------|
| Auth requis  | ✅ JWT Bearer        |
| Content-Type | application/json     |

**📤 Body**
```json
{
  "sessionId": "uuid",            // optionnel — déconnecte une session spécifique
  "toutesLesSessions": false      // optionnel — si true, révoque toutes les sessions
}
```

**📥 Succès 200**
```json
{
  "success": true,
  "message": "Deconnexion reussie",
  "data": null
}
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 401  | `"Non authentifie"` | Token absent |

---

### GET /auth/sessions

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "creeLe": "2026-01-15T10:00:00.000Z",
      "derniereActivite": "2026-03-13T08:30:00.000Z",
      "adresseIp": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

---

### GET /auth/me

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "prenom": "string",
    "nom": "string",
    "nomComplet": "string",
    "telephone1": "string",
    "telephone2": "string | null",
    "adresseResidence": "string | null",
    "nomContactUrgence": "string | null",
    "telContactUrgence": "string | null",
    "numeroMobileMoney": "string | null",
    "numeroOrangeMoney": "string | null",
    "dateInscription": "2026-01-01T00:00:00.000Z",
    "doitChangerMotDePasse": false,
    "estSuperAdmin": false,
    "languePrefereeId": "uuid | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": "2026-01-01T00:00:00.000Z | null"
  }
}
```

---

## 🏢 SaaS — Organisations & Onboarding

> Les routes `/org/*` nécessitent un `organisationId` dans le token JWT (injecté après login).

---

### POST /auth/register-organisation

| Propriété    | Valeur           |
|--------------|------------------|
| Auth requis  | ❌ Public        |
| Content-Type | application/json |

Crée atomiquement un utilisateur + une organisation + le lien membre admin. Retourne des tokens directement utilisables.

**📤 Body**
```json
{
  "nomOrganisation": "string",   // requis
  "slug": "string",              // requis — identifiant URL unique (ex: "tontine-excellence")
  "emailContact": "string",      // requis — email de l'organisation
  "planCode": "FREE",            // optionnel — défaut: "FREE" (valeurs: "FREE", "PRO", "ENTERPRISE")
  "prenom": "string",            // requis — prénom du créateur (admin)
  "nom": "string",               // requis — nom du créateur
  "telephone": "string",         // requis — téléphone du créateur
  "email": "string",             // requis — email du créateur
  "motDePasse": "string"         // requis — min. 8 caractères
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "message": "Organisation créée avec succès",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600,
    "organisationId": "uuid"
  }
}
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Mot de passe trop court"` | Moins de 8 caractères |
| 400  | `"Plan introuvable"` | `planCode` inexistant |
| 409  | `"Ce numéro de téléphone est déjà utilisé"` | Doublon téléphone |
| 409  | `"Cet email est déjà utilisé"` | Doublon email |
| 409  | `"Ce slug est déjà pris"` | Doublon slug |

---

### GET /org/profile

| Propriété    | Valeur                            |
|--------------|-----------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId    |

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "string",
    "slug": "string",
    "emailContact": "string",
    "telephoneContact": "string | null",
    "pays": "CI",
    "devise": "XOF",
    "fuseauHoraire": "Africa/Abidjan",
    "logo": "string | null",
    "statut": "ACTIVE",
    "planAbonnementId": "uuid | null",
    "planCode": "FREE",
    "planLibelle": "Gratuit",
    "abonnementDebutLe": "2026-01-01T00:00:00.000Z | null",
    "abonnementFinLe": "2026-12-31T23:59:59.000Z | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": "2026-01-01T00:00:00.000Z | null"
  }
}
```

> `statut` : `ACTIVE` | `SUSPENDUE` | `EXPIREE`

---

### PUT /org/profile

| Propriété    | Valeur                                         |
|--------------|------------------------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId                 |
| Rôle requis  | `ORG_ADMIN`                                    |
| Content-Type | application/json                               |

**📤 Body**
```json
{
  "nom": "string",               // optionnel
  "emailContact": "string",      // optionnel
  "telephoneContact": "string",  // optionnel
  "pays": "string",              // optionnel
  "devise": "string",            // optionnel
  "fuseauHoraire": "string",     // optionnel
  "logo": "string"               // optionnel — URL
}
```

**📥 Succès 200** — retourne l'organisation mise à jour (même forme que GET /org/profile)

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 403  | `"Accès refusé"` | Rôle insuffisant (pas ORG_ADMIN) |
| 409  | `"Cet email est déjà utilisé"` | Email déjà pris |

---

### GET /org/membres

| Propriété    | Valeur                            |
|--------------|-----------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId    |

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "utilisateurId": "uuid",
      "prenom": "string",
      "nom": "string",
      "telephone1": "string",
      "email": "string | null",
      "role": "ORG_ADMIN",
      "statut": "ACTIF",
      "creeLe": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

> `role` : `ORG_ADMIN` | `ORG_MEMBRE`

---

### POST /org/membres

| Propriété    | Valeur                                         |
|--------------|------------------------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId                 |
| Rôle requis  | `ORG_ADMIN`                                    |
| Content-Type | application/json                               |

**📤 Body**
```json
{
  "utilisateurId": "uuid",       // requis
  "role": "ORG_MEMBRE"           // optionnel — "ORG_ADMIN" | "ORG_MEMBRE"
}
```

**📥 Succès 201** — retourne le membre ajouté (même forme que GET /org/membres item)

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 404  | `"Utilisateur introuvable"` | `utilisateurId` inexistant |
| 409  | `"Utilisateur déjà membre"` | Doublon |

---

### GET /org/regles

| Propriété    | Valeur                            |
|--------------|-----------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId    |

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ruleDefinitionId": "uuid",
      "cle": "COTISATION_MONTANT_DEFAUT",
      "libelle": "Montant par défaut de la cotisation",
      "typeValeur": "MONTANT",
      "valeur": "5000",
      "estActive": true,
      "modifieLe": "2026-01-01T00:00:00.000Z | null"
    }
  ]
}
```

---

### PUT /org/regles

| Propriété    | Valeur                                         |
|--------------|------------------------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId                 |
| Rôle requis  | `ORG_ADMIN`                                    |
| Content-Type | application/json                               |

**📤 Body**
```json
{
  "ruleDefinitionId": "uuid",   // requis
  "valeur": "string"            // requis
}
```

**📥 Succès 200** — retourne la règle mise à jour

---

### DELETE /org/regles/:ruleDefinitionId

| Propriété    | Valeur                                         |
|--------------|------------------------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId                 |
| Rôle requis  | `ORG_ADMIN`                                    |

Réinitialise la règle à sa valeur par défaut globale.

**📥 Succès 200**
```json
{ "success": true, "message": "Règle réinitialisée au défaut global", "data": null }
```

---

### GET /org/abonnement

| Propriété    | Valeur                            |
|--------------|-----------------------------------|
| Auth requis  | ✅ JWT Bearer + organisationId    |

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "planCode": "FREE",
    "planLibelle": "Gratuit",
    "prixMensuel": 0,
    "fonctionnalites": { "maxTontines": 1, "maxMembres": 20 },
    "abonnementDebutLe": "2026-01-01T00:00:00.000Z | null",
    "abonnementFinLe": "2026-12-31T23:59:59.000Z | null"
  }
}
```

---

## 🛡️ Administration Super Admin

> Toutes les routes `/admin/*` nécessitent `estSuperAdmin: true` dans le token JWT.

---

### GET /admin/organisations

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |

**📥 Succès 200** — liste de toutes les organisations (même forme que GET /org/profile)

---

### GET /admin/organisations/:id

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |

**📥 Succès 200** — organisation par ID

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 404  | `"Organisation introuvable"` | ID inexistant |

---

### POST /admin/organisations

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |
| Content-Type | application/json           |

**📤 Body**
```json
{
  "nom": "string",                // requis
  "slug": "string",               // requis
  "emailContact": "string",       // requis
  "telephoneContact": "string",   // optionnel
  "pays": "CI",                   // optionnel
  "devise": "XOF",                // optionnel
  "fuseauHoraire": "string",      // optionnel
  "planAbonnementId": "uuid"      // optionnel
}
```

**📥 Succès 201** — organisation créée

---

### PATCH /admin/organisations/:id/suspendre

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |

**📥 Succès 200**
```json
{ "success": true, "message": "Organisation suspendue", "data": { ... } }
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Transition invalide"` | Organisation déjà suspendue |
| 404  | `"Organisation introuvable"` | ID inexistant |

---

### PATCH /admin/organisations/:id/reactiver

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |

**📥 Succès 200**
```json
{ "success": true, "message": "Organisation réactivée", "data": { ... } }
```

---

### GET /admin/plans

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "FREE",
      "libelle": "Gratuit",
      "prixMensuel": 0,
      "maxTontines": 1,
      "maxMembres": 20,
      "fonctionnalites": { },
      "estActif": true
    }
  ]
}
```

---

### PUT /admin/plans/:id

| Propriété    | Valeur                     |
|--------------|----------------------------|
| Auth requis  | ✅ JWT Bearer + SuperAdmin |
| Content-Type | application/json           |

**📤 Body** — tous champs optionnels : `code`, `libelle`, `prixMensuel`, `maxTontines`, `maxMembres`, `fonctionnalites`, `estActif`

**📥 Succès 200** — plan mis à jour

---

## 👥 Utilisateurs & Langues

---

### GET /utilisateurs

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📤 Query params**
```
page=1&limit=20
```

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "prenom": "string",
      "nom": "string",
      "nomComplet": "string",
      "telephone1": "string",
      "telephone2": "string | null",
      "adresseResidence": "string | null",
      "nomContactUrgence": "string | null",
      "telContactUrgence": "string | null",
      "numeroMobileMoney": "string | null",
      "numeroOrangeMoney": "string | null",
      "dateInscription": "2026-01-01T00:00:00.000Z",
      "doitChangerMotDePasse": false,
      "estSuperAdmin": false,
      "languePrefereeId": "uuid | null",
      "creeLe": "2026-01-01T00:00:00.000Z",
      "modifieLe": "2026-01-01T00:00:00.000Z | null"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

---

### POST /utilisateurs

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body**
```json
{
  "prenom": "string",               // requis
  "nom": "string",                  // requis
  "telephone1": "string",           // requis — doit être unique
  "password": "string",             // requis
  "telephone2": "string",           // optionnel
  "adresseResidence": "string",     // optionnel
  "nomContactUrgence": "string",    // optionnel
  "telContactUrgence": "string",    // optionnel
  "numeroMobileMoney": "string",    // optionnel
  "numeroOrangeMoney": "string",    // optionnel
  "languePrefereeId": "uuid"        // optionnel
}
```

**📥 Succès 201** — utilisateur créé (même forme que GET /auth/me)

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 409  | `"Ce numero de telephone est deja utilise"` | Doublon téléphone1 |
| 409  | `"Le numero de telephone secondaire est deja utilise"` | Doublon téléphone2 |

---

### GET /utilisateurs/:id

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200** — utilisateur par ID (même forme que GET /auth/me)

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 404  | `"Utilisateur non trouve"` | ID inexistant |

---

### PUT /utilisateurs/:id

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body** — tous champs optionnels : `prenom`, `nom`, `telephone2`, `adresseResidence`, `nomContactUrgence`, `telContactUrgence`, `numeroMobileMoney`, `numeroOrangeMoney`, `languePrefereeId`

**📥 Succès 200** — utilisateur mis à jour

---

### PATCH /utilisateurs/:id/password

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body**
```json
{
  "ancienMotDePasse": "string",       // requis
  "nouveauMotDePasse": "string",      // requis
  "confirmationMotDePasse": "string"  // requis — doit matcher nouveauMotDePasse
}
```

**📥 Succès 200**
```json
{ "success": true, "message": "Mot de passe modifié", "data": null }
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Ancien mot de passe incorrect"` | Vérification échouée |
| 400  | `"Les mots de passe ne correspondent pas"` | Confirmation incorrecte |

---

### DELETE /utilisateurs/:id

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200**
```json
{ "success": true, "message": "Utilisateur supprimé", "data": null }
```

---

### GET /langues

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "code": "fr", "nom": "Français", "estDefaut": true }
  ]
}
```

---

### GET /langues/default

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200** — retourne la langue par défaut (même forme qu'un item de GET /langues)

---

### POST /langues

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body**
```json
{
  "code": "string",        // requis — ex: "fr", "en"
  "nom": "string",         // requis
  "estDefaut": false       // optionnel
}
```

**📥 Succès 201** — langue créée

---

### GET /langues/:id

**📥 Succès 200** — langue par ID

---

### PUT /langues/:id

**📤 Body** — `nom?: string`, `estDefaut?: boolean`

---

### DELETE /langues/:id

**📥 Succès 200**

---

## 🏦 Tontines & Types

---

### POST /tontines

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body**
```json
{
  "nom": "string",                           // requis
  "nomCourt": "string",                      // requis — code court unique (ex: "TEX")
  "tontineTypeId": "uuid",                   // requis
  "anneeFondation": 2020,                    // optionnel
  "motto": "string",                         // optionnel
  "logo": "string",                          // optionnel — URL
  "estOfficiellementDeclaree": false,        // optionnel
  "numeroEnregistrement": "string",          // optionnel
  "documentStatuts": "string"                // optionnel — URL
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "string",
    "nomCourt": "string",
    "anneeFondation": 2020,
    "motto": "string | null",
    "logo": "string | null",
    "estOfficiellementDeclaree": false,
    "numeroEnregistrement": "string | null",
    "statut": "ACTIVE",
    "tontineType": { "id": "uuid", "code": "CLASSIQUE", "libelle": "Classique" },
    "documentStatuts": "string | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null,
    "nombreMembres": 0,
    "nombreExercices": 0
  }
}
```

> `statut` : `ACTIVE` | `SUSPENDUE` | `FERMEE`

---

### GET /tontines

| Propriété    | Valeur   |
|--------------|----------|
| Auth requis  | ❌ Public |

**📤 Query params** : `page=1&limit=20`

**📥 Succès 200** — liste paginée avec `pagination`

---

### GET /tontines/:id

| Propriété    | Valeur   |
|--------------|----------|
| Auth requis  | ❌ Public |

**📥 Succès 200** — tontine complète

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 404  | `"Tontine non trouvee"` | ID inexistant |

---

### GET /tontines/code/:nomCourt

| Propriété    | Valeur   |
|--------------|----------|
| Auth requis  | ❌ Public |

**📥 Succès 200** — tontine par code court

---

### PUT /tontines/:id

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body** — tous champs optionnels : `nom`, `nomCourt`, `anneeFondation`, `motto`, `logo`, `estOfficiellementDeclaree`, `numeroEnregistrement`, `documentStatuts`

**📥 Succès 200** — tontine mise à jour

---

### POST /tontines/:id/suspend

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

**📥 Succès 200**
```json
{ "success": true, "message": "Tontine suspendue", "data": { ... } }
```

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Transition invalide"` | Tontine déjà suspendue |

---

### POST /tontines/:id/activate

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

---

### DELETE /tontines/:id

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |

---

### POST /tontines/types

| Propriété    | Valeur        |
|--------------|---------------|
| Auth requis  | ✅ JWT Bearer |
| Content-Type | application/json |

**📤 Body**
```json
{
  "code": "string",         // requis — ex: "CLASSIQUE"
  "libelle": "string",      // requis
  "description": "string"   // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CLASSIQUE",
    "libelle": "Tontine Classique",
    "description": "string | null",
    "estActif": true,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /tontines/types

| Auth requis  | ❌ Public |
|---|---|

**📥 Succès 200** — liste de tous les types

---

### GET /tontines/types/:id

| Auth requis  | ❌ Public |
|---|---|

---

### GET /tontines/types/code/:code

| Auth requis  | ❌ Public |
|---|---|

---

### PUT /tontines/types/:id

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body** — `libelle?: string`, `description?: string`, `estActif?: boolean`

---

### DELETE /tontines/types/:id

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

## 📋 Règles

### Enums utiles

- `typeValeur` : `MONTANT` | `POURCENTAGE` | `NOMBRE` | `BOOLEEN` | `TEXTE` | `DATE`
- `categorie` : `COTISATION` | `EPARGNE` | `POT` | `PRET` | `SECOURS` | `PENALITE` | `INSCRIPTION` | `DISTRIBUTION`

---

### POST /tontines/rule-definitions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "cle": "COTISATION_MONTANT_DEFAUT",   // requis — clé unique
  "libelle": "string",                   // requis
  "typeValeur": "MONTANT",              // requis
  "categorie": "COTISATION",            // requis
  "valeurDefaut": "5000",               // optionnel
  "valeurMin": "1000",                  // optionnel
  "valeurMax": "100000",                // optionnel
  "unite": "XOF",                       // optionnel
  "estObligatoire": false,              // optionnel
  "estModifiableParTontine": true,      // optionnel
  "estModifiableParExercice": true,     // optionnel
  "description": "string",             // optionnel
  "ordreAffichage": 1                   // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cle": "COTISATION_MONTANT_DEFAUT",
    "libelle": "string",
    "typeValeur": "MONTANT",
    "valeurDefaut": "5000 | null",
    "valeurMin": "1000 | null",
    "valeurMax": "100000 | null",
    "unite": "XOF | null",
    "estObligatoire": false,
    "estModifiableParTontine": true,
    "estModifiableParExercice": true,
    "categorie": "COTISATION",
    "description": "string | null",
    "ordreAffichage": 1,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /tontines/rule-definitions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `categorie?`, `typeValeur?`, `estObligatoire?`

**📥 Succès 200** — liste des rule definitions

---

### GET /tontines/rule-definitions/modifiables/tontine

Retourne les règles modifiables au niveau tontine.

---

### GET /tontines/rule-definitions/modifiables/exercice

Retourne les règles modifiables au niveau exercice.

---

### GET /tontines/rule-definitions/categorie/:categorie

Filtre par catégorie.

---

### GET /tontines/rule-definitions/cle/:cle

Retourne une règle par sa clé unique.

---

### GET /tontines/rule-definitions/:id

---

### PUT /tontines/rule-definitions/:id

**📤 Body** — `libelle?`, `valeurDefaut?`, `valeurMin?`, `valeurMax?`, `unite?`, `estObligatoire?`, `estModifiableParTontine?`, `estModifiableParExercice?`, `description?`, `ordreAffichage?`

---

### DELETE /tontines/rule-definitions/:id

---

### POST /tontines/regles-tontine

Crée ou met à jour une règle pour une tontine (upsert).

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "tontineId": "uuid",                        // requis
  "ruleDefinitionId": "uuid",                 // requis
  "valeur": "string",                         // requis
  "modifieParAdhesionTontineId": "uuid"       // optionnel
}
```

**📥 Succès 200/201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tontineId": "uuid",
    "ruleDefinitionId": "uuid",
    "ruleDefinition": {
      "id": "uuid", "cle": "string", "libelle": "string",
      "typeValeur": "MONTANT", "categorie": "COTISATION"
    },
    "valeur": "5000",
    "estActive": true,
    "modifieLe": "2026-01-01T00:00:00.000Z",
    "modifieParAdhesionTontineId": "uuid | null",
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /tontines/regles-tontine/tontine/:tontineId

---

### GET /tontines/regles-tontine/tontine/:tontineId/effectives

Retourne toutes les valeurs effectives (fusionne valeurs tontine + défauts globaux).

---

### GET /tontines/regles-tontine/tontine/:tontineId/valeur/:cle

**📥 Succès 200**
```json
{ "success": true, "data": { "cle": "COTISATION_MONTANT_DEFAUT", "valeur": "5000" } }
```

---

### POST /tontines/regles-tontine/tontine/:tontineId/initialize

Initialise les règles par défaut pour une tontine.

---

### GET /tontines/regles-tontine/:id

---

### PUT /tontines/regles-tontine/:id

**📤 Body** — `valeur?`, `estActive?`, `modifieParAdhesionTontineId?`

---

### DELETE /tontines/regles-tontine/:id

---

### POST /regles-exercice

Crée ou met à jour une règle pour un exercice (upsert).

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceId": "uuid",                       // requis
  "ruleDefinitionId": "uuid",                 // requis
  "valeur": "string",                         // requis
  "modifieParExerciceMembreId": "uuid"        // optionnel
}
```

**📥 Succès 200/201** — même forme que RegleTontine avec `estSurchargee` à la place de `estActive`

---

### GET /regles-exercice/exercice/:exerciceId

---

### GET /regles-exercice/exercice/:exerciceId/effectives

Cascade : exercice → tontine → organisation → défaut global.

---

### GET /regles-exercice/exercice/:exerciceId/valeur/:cle

---

### POST /regles-exercice/exercice/:exerciceId/initialize

Copie les règles actives de la tontine dans l'exercice.

---

### GET /regles-exercice/:id

---

### PUT /regles-exercice/:id

**📤 Body** — `valeur?`, `estSurchargee?`, `modifieParExerciceMembreId?`

---

### DELETE /regles-exercice/:id

---

## 🤝 Adhésions

### Enum RoleMembre

`PRESIDENT` | `VICE_PRESIDENT` | `TRESORIER` | `SECRETAIRE` | `MEMBRE`

### Enum StatutAdhesion

`ACTIF` | `SUSPENDU` | `SORTI`

---

### POST /tontines/adhesions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "tontineId": "uuid",                 // requis
  "utilisateurId": "uuid",             // requis
  "matricule": "string",               // requis — doit être unique dans la tontine
  "role": "MEMBRE",                    // optionnel
  "dateAdhesionTontine": "2026-01-01", // optionnel
  "photo": "string",                   // optionnel — URL
  "quartierResidence": "string"        // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tontine": { "id": "uuid", "nom": "string", "nomCourt": "string" },
    "utilisateur": { "id": "uuid", "nom": "string", "prenom": "string", "telephone1": "string" },
    "matricule": "string",
    "role": "MEMBRE",
    "statut": "ACTIF",
    "dateAdhesionTontine": "2026-01-01T00:00:00.000Z",
    "photo": "string | null",
    "quartierResidence": "string | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null
  }
}
```

---

### GET /tontines/adhesions/tontine/:tontineId

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `role?`, `statut?`, `page?`, `limit?`

---

### GET /tontines/adhesions/user/:utilisateurId

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### GET /tontines/adhesions/:id

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### PUT /tontines/adhesions/:id

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body** — `matricule?`, `role?`, `statut?`, `photo?`, `quartierResidence?`

---

### PUT /tontines/adhesions/:id/role

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{ "role": "TRESORIER" }
```

---

### POST /tontines/adhesions/:id/deactivate

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### POST /tontines/adhesions/:id/reactivate

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### DELETE /tontines/adhesions/:id

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### POST /adhesions

Soumet une demande d'adhésion à une tontine.

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "utilisateurId": "uuid",   // requis
  "tontineId": "uuid",       // requis
  "message": "string"        // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "utilisateurId": "uuid",
    "utilisateur": { "id": "uuid", "nom": "string", "prenom": "string", "telephone": "string" },
    "tontineId": "uuid",
    "tontine": { "id": "uuid", "nom": "string" },
    "message": "string | null",
    "statut": "SOUMISE",
    "soumiseLe": "2026-01-01T00:00:00.000Z",
    "traiteeLe": null,
    "traiteeParExerciceMembreId": null,
    "motifRefus": null
  }
}
```

> `statut` : `SOUMISE` | `EN_COURS` | `APPROUVEE` | `REFUSEE` | `EXPIREE`

---

### GET /adhesions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `tontineId?`, `utilisateurId?`, `statut?`, `dateDebut?`, `dateFin?`, `page?`, `limit?`

---

### GET /adhesions/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalDemandes": 50,
    "demandesSoumises": 10,
    "demandesEnCours": 5,
    "demandesApprouvees": 30,
    "demandesRefusees": 3,
    "demandesExpirees": 2
  }
}
```

---

### GET /adhesions/:id

---

### DELETE /adhesions/:id

---

### POST /adhesions/:id/en-cours

---

### POST /adhesions/:id/approuver

**📤 Body**
```json
{ "traiteeParExerciceMembreId": "uuid" }
```

---

### POST /adhesions/:id/refuser

**📤 Body**
```json
{
  "traiteeParExerciceMembreId": "uuid",
  "motifRefus": "string"
}
```

---

## 📅 Exercices & Membres

### Enum StatutExercice

`BROUILLON` | `OUVERT` | `SUSPENDU` | `FERME`

### Enum TypeMembre / StatutExerciceMembre

`TypeMembre` : `ORDINAIRE` | `BENEFICIAIRE` | `OBSERVATEUR`

`StatutExerciceMembre` : `ACTIF` | `INACTIF`

---

### POST /exercices

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "tontineId": "uuid",    // requis
  "libelle": "string",    // requis — ex: "Exercice 2026"
  "anneeDebut": 2026,     // requis
  "moisDebut": 1,         // requis — 1-12
  "anneeFin": 2026,       // requis
  "moisFin": 12,          // requis — 1-12
  "dureeMois": 12         // requis
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tontine": { "id": "uuid", "nom": "string", "nomCourt": "string" },
    "libelle": "Exercice 2026",
    "anneeDebut": 2026,
    "moisDebut": 1,
    "anneeFin": 2026,
    "moisFin": 12,
    "dureeMois": 12,
    "statut": "BROUILLON",
    "ouvertLe": null,
    "fermeLe": null,
    "nombreMembres": 0,
    "nombreReunions": 0,
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null
  }
}
```

---

### GET /exercices

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `tontineId?`, `statut?`, `annee?`, `page?`, `limit?`

---

### GET /exercices/tontine/:tontineId/ouvert

Retourne l'exercice actuellement OUVERT d'une tontine.

---

### GET /exercices/:id

---

### PATCH /exercices/:id

**📤 Body** — `libelle?`, `anneeDebut?`, `moisDebut?`, `anneeFin?`, `moisFin?`, `dureeMois?`

---

### DELETE /exercices/:id

---

### POST /exercices/:id/ouvrir

**📤 Body**
```json
{ "adhesionIds": ["uuid", "uuid"] }   // optionnel — IDs adhésions à inclure auto
```

---

### POST /exercices/:id/suspendre

---

### POST /exercices/:id/reprendre

---

### POST /exercices/:id/fermer

---

### POST /exercices-membres

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceId": "uuid",                    // requis
  "adhesionTontineId": "uuid",             // requis
  "typeMembre": "ORDINAIRE",               // requis
  "dateEntreeExercice": "2026-01-01",      // requis
  "moisEntree": 1,                         // optionnel
  "nombreParts": 1,                        // optionnel — défaut 1
  "parrainExerciceMembreId": "uuid"        // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exercice": { "id": "uuid", "libelle": "string" },
    "adhesionTontine": {
      "id": "uuid",
      "matricule": "string",
      "utilisateur": { "id": "uuid", "nom": "string", "prenom": "string" }
    },
    "typeMembre": "ORDINAIRE",
    "moisEntree": 1,
    "dateEntreeExercice": "2026-01-01T00:00:00.000Z",
    "nombreParts": 1,
    "statut": "ACTIF",
    "parrain": { "id": "uuid", "matricule": "string" } ,
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null
  }
}
```

---

### GET /exercices-membres/exercice/:exerciceId

**📤 Query** : `typeMembre?`, `statut?`

---

### GET /exercices-membres/:id

---

### PATCH /exercices-membres/:id

**📤 Body** — `typeMembre?`, `moisEntree?`, `nombreParts?`, `statut?`, `parrainExerciceMembreId?`

---

### DELETE /exercices-membres/:id

---

### POST /exercices-membres/:id/deactivate

---

### POST /exercices-membres/:id/reactivate

---

## 🧮 Cassation

La cassation calcule la répartition finale des fonds en fin d'exercice.

---

### POST /cassations/exercice/:exerciceId/calculer

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "exerciceId": "uuid",
      "exerciceMembreId": "uuid",
      "montantBrut": 60000,
      "montantRetenu": 5000,
      "montantNet": 55000,
      "statut": "CALCULE",
      "distribueeLe": null
    }
  ]
}
```

---

### PATCH /cassations/:id/distribuer

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### PATCH /cassations/exercice/:exerciceId/distribuer-tout

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### PATCH /cassations/:id/annuler

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### GET /cassations/exercice/:exerciceId

---

### GET /cassations/exercice/:exerciceId/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalBrut": 720000,
    "totalRetenu": 50000,
    "totalNet": 670000,
    "nombreDistribues": 18,
    "nombreEnAttente": 2
  }
}
```

---

### GET /cassations/:id

---

### DELETE /cassations/exercice/:exerciceId/reset

Supprime toutes les cassations d'un exercice pour recalculer.

---

## 📆 Réunions & Présences

### Enum StatutReunion

`PLANIFIEE` | `OUVERTE` | `CLOTUREE` | `ANNULEE`

---

### POST /reunions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceId": "uuid",                    // requis
  "numeroReunion": 1,                      // requis
  "dateReunion": "2026-03-15",             // requis — format YYYY-MM-DD
  "heureDebut": "09:00",                   // optionnel — format HH:mm
  "lieu": "string",                        // optionnel
  "hoteExerciceMembreId": "uuid"           // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exerciceId": "uuid",
    "numeroReunion": 1,
    "dateReunion": "2026-03-15",
    "heureDebut": "09:00 | null",
    "lieu": "string | null",
    "hoteExerciceMembreId": "uuid | null",
    "hote": { "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string" },
    "statut": "PLANIFIEE",
    "ouverteLe": null,
    "clotureeLe": null,
    "clotureeParExerciceMembreId": null,
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null,
    "nombrePresents": 0,
    "nombreAbsents": 0
  }
}
```

---

### GET /reunions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `exerciceId?`, `statut?`, `dateDebut?`, `dateFin?`, `page?`, `limit?`

---

### GET /reunions/:id

---

### PATCH /reunions/:id

**📤 Body** — `dateReunion?`, `heureDebut?`, `lieu?`, `hoteExerciceMembreId?`

---

### DELETE /reunions/:id

---

### POST /reunions/:id/ouvrir

**📤 Body**
```json
{ "heureDebut": "09:00" }   // optionnel
```

---

### POST /reunions/:id/cloturer

**📤 Body**
```json
{ "clotureeParExerciceMembreId": "uuid" }   // requis
```

---

### POST /reunions/:id/annuler

---

### POST /presences

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "reunionId": "uuid",             // requis
  "exerciceMembreId": "uuid",      // requis
  "estPresent": true,              // requis
  "estEnRetard": false,            // optionnel
  "heureArrivee": "09:15",         // optionnel — format HH:mm
  "note": "string"                 // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reunionId": "uuid",
    "exerciceMembreId": "uuid",
    "exerciceMembre": {
      "id": "uuid",
      "utilisateurId": "uuid",
      "utilisateurNom": "string",
      "ordreDistribution": 3
    },
    "estPresent": true,
    "estEnRetard": false,
    "heureArrivee": "09:15 | null",
    "note": "string | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null
  }
}
```

---

### POST /presences/bulk

Enregistre toutes les présences d'une réunion en une seule requête.

**📤 Body**
```json
{
  "reunionId": "uuid",     // requis
  "presences": [
    {
      "exerciceMembreId": "uuid",   // requis
      "estPresent": true,           // requis
      "estEnRetard": false,         // optionnel
      "heureArrivee": "09:15",      // optionnel
      "note": "string"              // optionnel
    }
  ]
}
```

**📥 Succès 201** — tableau de présences créées

---

### GET /presences/reunion/:reunionId

---

### GET /presences/reunion/:reunionId/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "reunionId": "uuid",
    "totalMembres": 20,
    "presents": 17,
    "absents": 3,
    "enRetard": 2,
    "tauxPresence": 85.0
  }
}
```

---

### GET /presences/:id

---

### PATCH /presences/:id

**📤 Body** — `estPresent?`, `estEnRetard?`, `heureArrivee?`, `note?`

---

### DELETE /presences/:id

---

## 💰 Transactions

### Enums

`typeTransaction` : `COTISATION` | `EPARGNE` | `POT` | `INSCRIPTION` | `PRET_DECAISSE` | `REMBOURSEMENT_PRET` | `PENALITE` | `SECOURS_PAYE` | `DISTRIBUTION` | `FRAIS_DIVERS` | `RENFLOUEMENT_SECOURS`

`statut` : `BROUILLON` | `SOUMIS` | `VALIDE` | `REJETE` | `ANNULE`

`modeCreation` : `MANUEL` | `MOBILE` | `IMPORT` | `AUTOMATIQUE`

---

### POST /transactions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "typeTransaction": "COTISATION",          // requis
  "montant": 5000,                          // requis
  "reunionId": "uuid",                      // optionnel
  "exerciceMembreId": "uuid",               // optionnel
  "projetId": "uuid",                       // optionnel
  "description": "string",                  // optionnel
  "modeCreation": "MANUEL",                 // optionnel — défaut: MANUEL
  "creeParUtilisateurId": "uuid",           // optionnel
  "creeParExerciceMembreId": "uuid",        // optionnel
  "autoSoumis": false                       // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reunionId": "uuid | null",
    "typeTransaction": "COTISATION",
    "exerciceMembreId": "uuid | null",
    "exerciceMembre": { "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string" },
    "projetId": "uuid | null",
    "projet": { "id": "uuid", "nom": "string" },
    "montant": 5000,
    "reference": "TXN-20260313-0001",
    "description": "string | null",
    "statut": "BROUILLON",
    "modeCreation": "MANUEL",
    "creeParUtilisateurId": "uuid | null",
    "creeParExerciceMembreId": "uuid | null",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "soumisLe": null,
    "autoSoumis": false,
    "valideLe": null,
    "valideParExerciceMembreId": null,
    "rejeteLe": null,
    "rejeteParExerciceMembreId": null,
    "motifRejet": null
  }
}
```

---

### POST /transactions/cotisation

Raccourci pour créer une cotisation mensuelle.

**📤 Body**
```json
{
  "reunionId": "uuid",                   // requis
  "exerciceMembreId": "uuid",            // requis
  "montant": 5000,                       // requis
  "modeCreation": "MANUEL",             // optionnel
  "creeParExerciceMembreId": "uuid",    // optionnel
  "autoSoumis": false,                  // optionnel
  "description": "string"              // optionnel
}
```

---

### POST /transactions/pot

Raccourci pour créer une contribution au pot.

**📤 Body** — même forme que `/transactions/cotisation`

---

### POST /transactions/inscription

Raccourci pour créer des frais d'inscription.

**📤 Body**
```json
{
  "exerciceMembreId": "uuid",            // requis
  "montant": 2000,                       // requis
  "modeCreation": "MANUEL",             // optionnel
  "creeParExerciceMembreId": "uuid",    // optionnel
  "autoSoumis": false                   // optionnel
}
```

---

### GET /transactions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query** : `reunionId?`, `exerciceId?`, `exerciceMembreId?`, `typeTransaction?`, `statut?`, `dateDebut?`, `dateFin?`, `page?`, `limit?`

---

### GET /transactions/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 150,
    "totalMontant": 750000,
    "parType": [
      { "type": "COTISATION", "count": 80, "montant": 400000 }
    ],
    "parStatut": [
      { "statut": "VALIDE", "count": 120, "montant": 600000 }
    ]
  }
}
```

---

### GET /transactions/reference/:reference

---

### GET /transactions/:id

---

### PATCH /transactions/:id

**📤 Body** — `montant?`, `description?`, `projetId?`

---

### DELETE /transactions/:id

---

### POST /transactions/:id/soumettre

**📤 Body**
```json
{ "autoSoumis": false }   // optionnel
```

---

### POST /transactions/:id/valider

**📤 Body**
```json
{ "valideParExerciceMembreId": "uuid" }   // requis
```

---

### POST /transactions/:id/rejeter

**📤 Body**
```json
{
  "rejeteParExerciceMembreId": "uuid",   // requis
  "motifRejet": "string"                 // requis
}
```

---

### POST /transactions/:id/annuler

---

## 📊 Obligations financières — Dues

Les dues représentent ce que chaque membre doit payer (cotisation, épargne, pot, inscription).

`statut` : `EN_ATTENTE` | `PARTIELLEMENT_PAYE` | `PAYE`

---

### POST /dues/cotisations/reunion/:reunionId/generer

Génère les cotisations dues pour tous les membres actifs d'une réunion.

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📥 Succès 201** — liste de `CotisationDueResponseDto`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reunionId": "uuid",
      "exerciceMembreId": "uuid",
      "montantDu": 5000,
      "montantPaye": 0,
      "soldeRestant": 5000,
      "statut": "EN_ATTENTE",
      "creeLe": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /dues/cotisations/:id/payer

**📤 Body**
```json
{ "montantPaye": 5000 }   // requis
```

---

### GET /dues/cotisations/reunion/:reunionId

---

### GET /dues/cotisations/reunion/:reunionId/stats

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalDu": 100000,
    "totalPaye": 75000,
    "totalRestant": 25000,
    "tauxRecouvrement": 75.0,
    "nombrePayees": 15,
    "nombreEnAttente": 5
  }
}
```

---

### POST /dues/pots/reunion/:reunionId/generer

---

### POST /dues/pots/:id/payer

**📤 Body** : `{ "montantPaye": number }`

---

### GET /dues/pots/reunion/:reunionId

---

### GET /dues/pots/reunion/:reunionId/stats

---

### GET /dues/pots/reunion/:reunionId/total

**📥 Succès 200**
```json
{ "success": true, "data": { "montantTotal": 150000 } }
```

---

### POST /dues/inscriptions/exercice/:exerciceId/generer

---

### POST /dues/inscriptions/:id/payer

**📤 Body** : `{ "montantPaye": number }`

---

### GET /dues/inscriptions/exercice/:exerciceId

---

### GET /dues/inscriptions/exercice/:exerciceId/stats

---

### GET /dues/inscriptions/en-retard

---

### POST /dues/epargnes/reunion/:reunionId/generer

---

### POST /dues/epargnes/:id/payer

**📤 Body** : `{ "montantPaye": number }`

---

### GET /dues/epargnes/reunion/:reunionId

---

### GET /dues/epargnes/reunion/:reunionId/stats

---

## 💳 Paiements Mobile & Opérateurs

### Enum OperateurMobile

`MTN` | `ORANGE` | `MOOV` | `WAVE` | `OTHER`

### Enum StatutPaiementMobile

`INITIE` | `ENVOYE` | `CONFIRME` | `ECHOUE` | `ANNULE`

---

### POST /paiements-mobile

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "transactionId": "uuid",        // requis
  "operateur": "MTN",             // requis
  "numeroTelephone": "string",    // requis
  "montant": 5000                 // requis
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "operateur": "MTN",
    "numeroTelephone": "0700000001",
    "montant": 5000,
    "statut": "INITIE",
    "referenceOperateur": "string | null",
    "messageOperateur": "string | null",
    "dateEnvoi": null,
    "dateConfirmation": null,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /paiements-mobile

**📤 Query** : `transactionId?`, `operateur?`, `statut?`, `dateDebut?`, `dateFin?`

---

### GET /paiements-mobile/pending

---

### GET /paiements-mobile/stats

---

### GET /paiements-mobile/transaction/:transactionId

---

### GET /paiements-mobile/:id

---

### POST /paiements-mobile/:id/envoyer

---

### POST /paiements-mobile/:id/confirmer

---

### POST /paiements-mobile/:id/echouer

---

### POST /paiements-mobile/:id/annuler

---

### POST /operateurs-paiement

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "code": "MTN",             // requis
  "nom": "MTN Mobile Money", // requis
  "logoUrl": "string",       // optionnel
  "estActif": true,          // optionnel
  "configApi": {},           // optionnel — objet JSON libre
  "fraisFixe": 0,            // optionnel
  "fraisPourcentage": 0.5    // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "MTN",
    "nom": "MTN Mobile Money",
    "logoUrl": "string | null",
    "estActif": true,
    "fraisFixe": 0,
    "fraisPourcentage": 0.5,
    "creeLe": "2026-01-01T00:00:00.000Z",
    "modifieLe": null
  }
}
```

---

### GET /operateurs-paiement

---

### GET /operateurs-paiement/:id

---

### GET /operateurs-paiement/code/:code

---

### PATCH /operateurs-paiement/:id

**📤 Body** — `nom?`, `logoUrl?`, `estActif?`, `configApi?`, `fraisFixe?`, `fraisPourcentage?`

---

### DELETE /operateurs-paiement/:id

---

## 🏗️ Projets

### Enum StatutProjet

`EN_COURS` | `CLOTURE` | `ANNULE`

---

### POST /projets

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceId": "uuid",                    // requis
  "nom": "string",                          // requis
  "creeParExerciceMembreId": "uuid",        // requis
  "description": "string",                 // optionnel
  "budgetPrevu": 100000                    // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exerciceId": "uuid",
    "nom": "string",
    "description": "string | null",
    "budgetPrevu": 100000,
    "statut": "EN_COURS",
    "creeParExerciceMembreId": "uuid",
    "creeLe": "2026-01-01T00:00:00.000Z",
    "clotureLe": null
  }
}
```

---

### GET /projets

**📤 Query** : `exerciceId?`, `statut?`

---

### GET /projets/exercice/:exerciceId

---

### GET /projets/exercice/:exerciceId/stats

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalProjets": 3,
    "budgetTotal": 300000,
    "montantDepense": 120000,
    "projetsEnCours": 2,
    "projetsClotures": 1
  }
}
```

---

### GET /projets/:id

---

### PUT /projets/:id

**📤 Body** — `nom?`, `description?`, `budgetPrevu?`, `statut?`

---

### POST /projets/:id/cloturer

---

### POST /projets/:id/annuler

---

### DELETE /projets/:id

---

## 🏥 Secours

### Enum StatutEvenementSecours

`DECLARE` | `EN_COURS_VALIDATION` | `VALIDE` | `REFUSE` | `PAYE`

---

### POST /evenements-secours

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceMembreId": "uuid",           // requis
  "typeEvenementSecoursId": "uuid",     // requis
  "dateEvenement": "2026-03-01",        // requis — YYYY-MM-DD
  "description": "string",             // optionnel
  "montantDemande": 50000,              // optionnel
  "reunionId": "uuid"                   // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exerciceMembreId": "uuid",
    "exerciceMembre": { "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string" },
    "typeEvenementSecoursId": "uuid",
    "typeEvenementSecours": {
      "id": "uuid", "code": "DECES", "libelle": "Décès", "montantParDefaut": 50000
    },
    "dateEvenement": "2026-03-01",
    "description": "string | null",
    "montantDemande": 50000,
    "montantApprouve": null,
    "montantDecaisse": null,
    "statut": "DECLARE",
    "dateDeclaration": "2026-03-13T00:00:00.000Z",
    "dateValidation": null,
    "dateDecaissement": null,
    "valideParExerciceMembreId": null,
    "transactionId": null,
    "reunionId": "uuid | null",
    "motifRefus": null,
    "piecesJustificatives": []
  }
}
```

---

### GET /evenements-secours

**📤 Query** : `exerciceId?`, `exerciceMembreId?`, `typeEvenementSecoursId?`, `statut?`, `dateDebut?`, `dateFin?`

---

### GET /evenements-secours/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalEvenements": 10,
    "totalMontantDemande": 500000,
    "totalMontantApprouve": 400000,
    "totalMontantPaye": 350000,
    "evenementsEnAttente": 2,
    "evenementsValides": 3,
    "evenementsPaues": 4,
    "evenementsRefuses": 1,
    "soldeFonds": 250000
  }
}
```

---

### GET /evenements-secours/fonds/:exerciceId

Retourne le solde actuel du fonds de secours pour un exercice.

---

### GET /evenements-secours/renflouement/:exerciceId

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "exerciceId": "uuid",
    "soldeFondsActuel": 50000,
    "montantCible": 200000,
    "deficit": 150000,
    "membresActifs": 20,
    "montantParMembre": 7500,
    "estNecessaire": true
  }
}
```

---

### GET /evenements-secours/:id

---

### POST /evenements-secours/:id/soumettre

---

### POST /evenements-secours/:id/valider

**📤 Body**
```json
{
  "valideParExerciceMembreId": "uuid",   // requis
  "montantApprouve": 50000               // requis
}
```

---

### POST /evenements-secours/:id/refuser

**📤 Body**
```json
{
  "refuseParExerciceMembreId": "uuid",   // requis
  "motifRefus": "string"                  // requis
}
```

---

### POST /evenements-secours/:id/payer

Lie l'événement à une transaction existante.

**📤 Body**
```json
{ "transactionId": "uuid" }   // requis
```

---

### POST /evenements-secours/:id/decaisser

Crée automatiquement la transaction + met à jour le bilan.

**📤 Body**
```json
{
  "decaisseParExerciceMembreId": "uuid",   // requis
  "reunionId": "uuid",                      // optionnel
  "seuilAlerteFonds": 50000                 // optionnel
}
```

---

### POST /evenements-secours/:id/pieces

Ajoute une pièce justificative.

**📤 Body**
```json
{
  "typePiece": "string",     // requis — ex: "CERTIFICAT_MEDICAL"
  "nomFichier": "string",    // requis — ex: "certificat.pdf"
  "urlFichier": "string"     // requis — URL du fichier
}
```

---

### GET /evenements-secours/:id/pieces

---

### DELETE /evenements-secours/:id/pieces/:pieceId

---

### POST /types-evenements-secours

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "code": "DECES",                // requis
  "libelle": "Décès",             // requis
  "description": "string",        // optionnel
  "montantParDefaut": 50000,      // optionnel
  "ordreAffichage": 1,            // optionnel
  "estActif": true                // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "DECES",
    "libelle": "Décès",
    "description": "string | null",
    "montantParDefaut": 50000,
    "ordreAffichage": 1,
    "estActif": true,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /types-evenements-secours

---

### GET /types-evenements-secours/:id

---

### PATCH /types-evenements-secours/:id

**📤 Body** — `libelle?`, `description?`, `montantParDefaut?`, `ordreAffichage?`, `estActif?`

---

### DELETE /types-evenements-secours/:id

---

### GET /secours/bilans

| Auth requis  | ✅ JWT Bearer |
|---|---|

---

### GET /secours/bilans/exercice/:exerciceId

Retourne ou crée le bilan de secours d'un exercice.

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exerciceId": "uuid",
    "soldeInitial": 0,
    "totalCotisations": 200000,
    "totalDepenses": 150000,
    "soldeFinal": 50000,
    "nombreEvenements": 4,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /secours/bilans/:id

---

### PUT /secours/bilans/exercice/:exerciceId/solde-initial

**📤 Body**
```json
{ "soldeInitial": 100000 }
```

---

### POST /secours/bilans/exercice/:exerciceId/recalculer

---

### POST /secours/bilans/exercice/:exerciceId/cloturer

---

### POST /secours/dus/exercice/:exerciceId/generer

Génère les secours dus annuels pour tous les membres.

---

### POST /secours/dus/:id/payer

**📤 Body**
```json
{ "montantPaye": 5000 }
```

---

### GET /secours/dus/exercice/:exerciceId

---

### GET /secours/dus/exercice/:exerciceId/stats

---

### GET /secours/dus/en-retard

---

### GET /secours/dus/:id

---

## 💼 Prêts & Remboursements

### Enum StatutPret

`DEMANDE` | `APPROUVE` | `REFUSE` | `DECAISSE` | `EN_COURS` | `SOLDE` | `DEFAUT`

---

### POST /prets

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "reunionId": "uuid",             // requis
  "exerciceMembreId": "uuid",      // requis
  "montantCapital": 100000,        // requis
  "dureeMois": 6,                  // requis
  "tauxInteret": 5.0,              // optionnel — en %
  "commentaire": "string"          // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reunionId": "uuid",
    "exerciceMembreId": "uuid",
    "exerciceMembre": { "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string" },
    "montantCapital": 100000,
    "tauxInteret": 5.0,
    "montantInteret": 5000,
    "montantTotalDu": 105000,
    "dureeMois": 6,
    "statut": "DEMANDE",
    "capitalRestant": 100000,
    "dateDemande": "2026-03-13T00:00:00.000Z",
    "dateApprobation": null,
    "dateDecaissement": null,
    "dateEcheance": null,
    "dateSolde": null,
    "approuveParExerciceMembreId": null,
    "motifRefus": null,
    "commentaire": "string | null",
    "nombreRemboursements": 0,
    "montantTotalRembourse": 0
  }
}
```

---

### GET /prets

**📤 Query** : `exerciceId?`, `exerciceMembreId?`, `statut?`, `dateDebut?`, `dateFin?`, `page?`, `limit?`

---

### GET /prets/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalPrets": 15,
    "totalCapitalPrete": 1500000,
    "totalCapitalRestant": 800000,
    "totalInterets": 75000,
    "pretsEnCours": 8,
    "pretsSoldes": 5,
    "pretsEnDefaut": 2
  }
}
```

---

### GET /prets/:id

---

### POST /prets/:id/approuver

**📤 Body**
```json
{
  "approuveParExerciceMembreId": "uuid",   // requis
  "tauxInteret": 5.0,                       // optionnel — peut modifier le taux
  "dureeMois": 6                            // optionnel — peut modifier la durée
}
```

---

### POST /prets/:id/refuser

**📤 Body**
```json
{
  "rejeteParExerciceMembreId": "uuid",   // requis
  "motifRefus": "string"                  // requis
}
```

---

### POST /prets/:id/decaisser

**📤 Body**
```json
{ "dateDecaissement": "2026-03-15" }   // optionnel — YYYY-MM-DD
```

---

### POST /prets/:id/solder

---

### POST /prets/:id/defaut

---

### POST /remboursements-prets

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "pretId": "uuid",              // requis
  "reunionId": "uuid",           // requis
  "montantCapital": 16667,       // requis
  "montantInteret": 833,         // optionnel
  "transactionId": "uuid",       // optionnel
  "commentaire": "string"        // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pretId": "uuid",
    "reunionId": "uuid",
    "transactionId": "uuid | null",
    "montantCapital": 16667,
    "montantInteret": 833,
    "montantTotal": 17500,
    "dateRemboursement": "2026-03-13T00:00:00.000Z",
    "capitalRestantApres": 83333,
    "commentaire": "string | null"
  }
}
```

---

### GET /remboursements-prets/pret/:pretId

---

### GET /remboursements-prets/reunion/:reunionId

---

### GET /remboursements-prets/:id

---

### DELETE /remboursements-prets/:id

---

## ⚠️ Pénalités & Types

### Enum StatutPenalite

`EN_ATTENTE` | `PAYEE` | `ANNULEE` | `PARDONNEE`

### Enum ModeCalculPenalite

`FIXE` | `POURCENTAGE_COTISATION`

---

### POST /penalites

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "exerciceMembreId": "uuid",              // requis
  "typePenaliteId": "uuid",               // requis
  "montant": 2000,                         // requis
  "reunionId": "uuid",                     // optionnel
  "motif": "string",                       // optionnel
  "appliqueParExerciceMembreId": "uuid"    // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exerciceMembreId": "uuid",
    "exerciceMembre": { "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string" },
    "reunionId": "uuid | null",
    "typePenaliteId": "uuid",
    "typePenalite": { "id": "uuid", "code": "RETARD", "libelle": "Retard" },
    "montant": 2000,
    "motif": "string | null",
    "statut": "EN_ATTENTE",
    "dateApplication": "2026-03-13T00:00:00.000Z",
    "appliqueParExerciceMembreId": "uuid | null",
    "transactionId": null,
    "datePaiement": null,
    "dateAnnulation": null,
    "motifAnnulation": null
  }
}
```

---

### GET /penalites

**📤 Query** : `exerciceId?`, `exerciceMembreId?`, `reunionId?`, `typePenaliteId?`, `statut?`, `dateDebut?`, `dateFin?`

---

### GET /penalites/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalPenalites": 30,
    "totalMontant": 60000,
    "totalMontantPaye": 40000,
    "totalMontantEnAttente": 20000,
    "penalitesEnAttente": 10,
    "penalitesPayees": 18,
    "penalitesAnnulees": 1,
    "penalitesPardonnees": 1
  }
}
```

---

### GET /penalites/:id

---

### POST /penalites/:id/payer

**📤 Body**
```json
{ "transactionId": "uuid" }   // requis — ID de la transaction de paiement
```

---

### POST /penalites/:id/annuler

**📤 Body**
```json
{ "motifAnnulation": "string" }   // requis
```

---

### POST /penalites/:id/pardonner

---

### POST /types-penalites

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "code": "RETARD",                         // requis
  "libelle": "Pénalité de retard",          // requis
  "modeCalcul": "FIXE",                     // requis
  "description": "string",                  // optionnel
  "valeurDefaut": 2000,                     // optionnel
  "estActif": true                          // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "RETARD",
    "libelle": "Pénalité de retard",
    "description": "string | null",
    "modeCalcul": "FIXE",
    "valeurDefaut": 2000,
    "estActif": true,
    "creeLe": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /types-penalites

---

### GET /types-penalites/:id

---

### PATCH /types-penalites/:id

**📤 Body** — `libelle?`, `description?`, `modeCalcul?`, `valeurDefaut?`, `estActif?`

---

### DELETE /types-penalites/:id

---

## 📤 Distributions

### Enum StatutDistribution

`PLANIFIEE` | `DISTRIBUEE` | `ANNULEE`

---

### POST /distributions

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Body**
```json
{
  "reunionId": "uuid",                          // requis
  "exerciceMembreBeneficiaireId": "uuid",       // requis
  "ordre": 1,                                   // requis — numéro d'ordre de distribution
  "montantBrut": 120000,                        // requis
  "montantRetenu": 5000,                        // optionnel — déduction (pénalités, dettes)
  "commentaire": "string"                       // optionnel
}
```

**📥 Succès 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reunionId": "uuid",
    "exerciceMembreBeneficiaireId": "uuid",
    "exerciceMembreBeneficiaire": {
      "id": "uuid", "utilisateurId": "uuid", "utilisateurNom": "string"
    },
    "ordre": 1,
    "montantBrut": 120000,
    "montantRetenu": 5000,
    "montantNet": 115000,
    "statut": "PLANIFIEE",
    "transactionId": null,
    "creeLe": "2026-01-01T00:00:00.000Z",
    "distribueeLe": null,
    "commentaire": "string | null"
  }
}
```

---

### GET /distributions

**📤 Query** : `reunionId?`, `exerciceId?`, `exerciceMembreId?`, `statut?`

---

### GET /distributions/summary

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalDistributions": 20,
    "totalMontantBrut": 2400000,
    "totalMontantRetenu": 100000,
    "totalMontantNet": 2300000,
    "distributionsPlanifiees": 5,
    "distributionsEffectuees": 14,
    "distributionsAnnulees": 1
  }
}
```

---

### GET /distributions/reunion/:reunionId

---

### GET /distributions/:id

---

### PATCH /distributions/:id

**📤 Body** — `ordre?`, `montantBrut?`, `montantRetenu?`, `commentaire?`

---

### DELETE /distributions/:id

---

### POST /distributions/:id/distribuer

**📤 Body**
```json
{ "transactionId": "uuid" }   // optionnel — lie une transaction existante
```

---

### POST /distributions/:id/annuler

---

## 📊 Dashboard & Exports

---

### GET /dashboard/stats

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "totalTontines": 5,
    "totalMembres": 120,
    "totalTransactions": 850,
    "totalMontantCollecte": 4250000,
    "exercicesOuverts": 3,
    "reunionsThisMois": 8,
    "pretsEnCours": 12,
    "penalitesEnAttente": 7
  }
}
```

---

### GET /dashboard/activities

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📥 Succès 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "TRANSACTION",
      "description": "Cotisation de Jean KONAN — 5 000 XOF",
      "date": "2026-03-13T08:30:00.000Z",
      "montant": 5000
    }
  ]
}
```

---

### GET /dashboard/member/:exerciceMembreId

**📥 Succès 200**
```json
{
  "success": true,
  "data": {
    "exerciceMembreId": "uuid",
    "membre": {
      "nomComplet": "Jean KONAN",
      "role": "TRESORIER",
      "parts": 2,
      "statut": "ACTIF"
    },
    "tontine": {
      "id": "uuid", "nom": "string", "type": "CLASSIQUE", "devise": "XOF"
    },
    "exercice": {
      "id": "uuid", "annee": 2026,
      "dateDebut": "2026-01-01", "dateFin": "2026-12-31", "statut": "OUVERT"
    },
    "solde": {
      "totalCotise": 30000,
      "totalDettes": 5000,
      "totalEpargne": 20000,
      "totalSecoursPaye": 0
    },
    "prochaineReunion": {
      "id": "uuid", "date": "2026-03-15",
      "lieu": "Salle A", "montantAttendu": 7500, "estBeneficiaire": false
    },
    "prets": {
      "enCours": true,
      "capitalRestant": 83333,
      "interetsPayes": 833,
      "prochaineEcheance": "2026-04-15",
      "montantProchaineEcheance": 17500
    },
    "secours": {
      "evenementEnCours": null,
      "totalRecu": 0
    },
    "activiteRecente": [
      {
        "id": "uuid",
        "date": "2026-03-13T08:30:00.000Z",
        "type": "COTISATION",
        "montant": 5000,
        "sens": "DEBIT",
        "description": "Cotisation réunion #3",
        "statut": "VALIDE"
      }
    ]
  }
}
```

---

### GET /exports/releve/:exerciceMembreId

| Auth requis  | ✅ JWT Bearer |
|---|---|

**📤 Query**
```
format=pdf   // requis — "pdf" | "excel"
```

**📥 Succès 200** — fichier binaire (Content-Type: `application/pdf` ou `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

**⚠️ Erreurs**
| Code | Message | Cause |
|------|---------|-------|
| 400  | `"Format invalide"` | Valeur autre que pdf/excel |
| 404  | `"ExerciceMembre introuvable"` | ID inexistant |

---

### GET /exports/rapport-exercice/:exerciceId

**📤 Query** : `format=pdf` ou `format=excel`

**📥 Succès 200** — fichier binaire

---

### GET /exports/rapport-mensuel/:reunionId

**📤 Query** : `format=pdf` ou `format=excel`

**📥 Succès 200** — fichier binaire

---

*Généré le 2026-03-13 — Nkapay API v1*
