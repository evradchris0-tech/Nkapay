# 📚 Logique Métier - Système de Tontine NKAPAY

Ce document explique les concepts clés du système de tontine et leur implémentation.

---

## 🎯 Principes Fondamentaux

Une **tontine** est un système d'épargne rotative traditionnelle africaine où un groupe de membres cotise régulièrement, et chaque membre bénéficie à tour de rôle du total collecté.

---

## 💰 Les 5 Types de Contributions Mensuelles

### 1. COTISATION (CotisationDueMensuelle)
**Argent REDISTRIBUÉ mensuellement à 1 bénéficiaire**

```
📋 Définition:
- Montant fixe payé par chaque membre à chaque réunion
- Le TOTAL des cotisations va à UN bénéficiaire par mois
- Chaque membre sera bénéficiaire UNE fois par exercice

📊 Exemple (4 membres, cotisation 10 000 FCFA/mois):
- Réunion 1 → Marie reçoit 40 000 FCFA (4 × 10 000)
- Réunion 2 → Pierre reçoit 40 000 FCFA
- Réunion 3 → Jean reçoit 40 000 FCFA
- Réunion 4 → Yvette reçoit 40 000 FCFA

📁 Entité: CotisationDueMensuelle
📁 Distribution via: Distribution
```

### 2. ÉPARGNE (EpargneDueMensuelle)
**Argent INDIVIDUEL récupéré à la CASSATION**

```
📋 Définition:
- Montant épargné individuellement chaque mois
- Chaque membre garde SON épargne (pas de mutualisation)
- Récupérée intégralement à la FIN de l'exercice (cassation)

📊 Exemple (4 membres, épargne 5 000 FCFA/mois, 12 mois):
- Marie épargne: 12 × 5 000 = 60 000 FCFA → récupère 60 000 à la cassation
- Pierre épargne: 12 × 5 000 = 60 000 FCFA → récupère 60 000 à la cassation
- etc.

📁 Entité: EpargneDueMensuelle
📁 Distribution via: Cassation
```

### 3. POT (PotDuMensuel)
**Argent pour les DÉPENSES de la réunion - CONSOMMÉ**

```
📋 Définition:
- Contribution pour les frais de la réunion
- Utilisé pour: collation, boissons, nourriture
- N'est PAS redistribué (c'est une dépense)

📊 Exemple (4 membres, pot 2 000 FCFA/mois):
- 4 × 2 000 = 8 000 FCFA → Acheté nourriture et boissons

📁 Entité: PotDuMensuel
⚠️ C'est une DÉPENSE, pas un capital
```

### 4. SECOURS (SecoursDuAnnuel)
**Contribution au fonds de SOLIDARITÉ pour les événements**

```
📋 Définition:
- Montant annuel versé au fonds de secours
- Fonds MUTUALISÉ entre tous les membres
- Sert à aider les membres en cas d'événements (décès, maladie, etc.)

📊 Exemple (4 membres, secours 10 000 FCFA/an):
- Fonds total: 4 × 10 000 = 40 000 FCFA
- Si décès du père de Marie → Marie reçoit 30 000 FCFA du fonds

📁 Entité: SecoursDuAnnuel
📁 Événements: EvenementSecours
📁 Types: TypeEvenementSecours (DECES, MALADIE, MARIAGE, NAISSANCE...)
```

### 5. INSCRIPTION (InscriptionDueExercice)
**Frais d'adhésion unique à l'exercice**

```
📋 Définition:
- Frais payé une seule fois au début de l'exercice
- Couvre les frais administratifs

📁 Entité: InscriptionDueExercice
```

---

## 🆘 Système de SECOURS (Solidarité)

### Types d'Événements (TypeEvenementSecours)
```
┌────────────────────────────────────────────────────────────┐
│ ÉVÉNEMENTS OUVRANT DROIT À UN SECOURS                      │
├────────────────────────────────────────────────────────────┤
│ • DECES_MEMBRE        - Décès du membre                    │
│ • DECES_CONJOINT      - Décès du conjoint                  │
│ • DECES_PARENT        - Décès père/mère                    │
│ • DECES_ENFANT        - Décès d'un enfant                  │
│ • MALADIE             - Maladie grave                      │
│ • MARIAGE             - Mariage du membre                  │
│ • NAISSANCE           - Naissance d'un enfant              │
│ • ACCIDENT            - Accident grave                     │
│ • AUTRE               - Autre événement validé             │
└────────────────────────────────────────────────────────────┘
```

### Cycle de Vie d'un Événement de Secours
```
┌──────────────┐    ┌─────────────────────┐    ┌──────────┐    ┌───────┐
│   DECLARE    │ ─> │ EN_COURS_VALIDATION │ ─> │  VALIDE  │ ─> │ PAYE  │
│ (membre)     │    │ (bureau examine)    │    │ (approuvé)│    │(versé)│
└──────────────┘    └─────────────────────┘    └──────────┘    └───────┘
        │                    │
        ↓                    ↓
   ┌─────────┐         ┌─────────┐
   │ REFUSE  │         │ REFUSE  │
   └─────────┘         └─────────┘
```

### Bilan du Fonds de Secours (BilanSecoursExercice)
```
┌────────────────────────────────────────┐
│ BILAN FONDS DE SECOURS - Exercice      │
├────────────────────────────────────────┤
│ Solde initial:        50 000 FCFA      │
│ + Cotisations:       120 000 FCFA      │
│ - Dépenses secours:   80 000 FCFA      │
│ ────────────────────────────────────   │
│ = Solde final:        90 000 FCFA      │
│                                        │
│ Nombre d'événements traités: 3         │
└────────────────────────────────────────┘
```

---

## 🔄 Cycle de Vie d'un Exercice

### Phase 1: OUVERTURE (Mois 0)
```
1. Création de l'exercice (ex: 2026-2027)
2. Inscription des membres (4 membres minimum)
3. Paiement des frais d'inscription
4. Paiement du secours annuel
5. Définition des règles (cotisation, pot, épargne, taux intérêt)
6. Statut: EN_COURS
```

### Phase 2: RÉUNIONS MENSUELLES (Mois 1 à N-1)
```
À chaque réunion:
┌──────────────────────────────────────────────────────────┐
│ 1. PLANIFIER la réunion (date, lieu)                     │
│ 2. OUVRIR la réunion                                     │
│ 3. Enregistrer les PRÉSENCES                             │
│ 4. GÉNÉRER les dues:                                     │
│    - Cotisations dues                                    │
│    - Épargnes dues                                       │
│    - Pots dus                                            │
│ 5. Collecter les PAIEMENTS                               │
│ 6. Désigner le BÉNÉFICIAIRE du mois                      │
│ 7. DISTRIBUER le total des cotisations au bénéficiaire   │
│ 8. Traiter les demandes de PRÊTS (si applicable)         │
│ 9. Traiter les demandes de SECOURS (si événement)        │
│ 10. CLÔTURER la réunion                                  │
└──────────────────────────────────────────────────────────┘
```

### Phase 3: CASSATION (Dernière réunion)
```
La CASSATION = distribution de l'ÉPARGNE de chaque membre

┌──────────────────────────────────────────────────────────┐
│ CASSATION - Distribution finale des épargnes             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Pour chaque membre:                                      │
│   Épargne brute = montant_épargne × mois × parts         │
│   - Déductions (prêts non remboursés, pénalités)         │
│   = Montant net à remettre                               │
│                                                          │
│ Exemple (épargne 5 000 FCFA/mois, 12 mois, 1 part):      │
│   Marie: 12 × 5 000 = 60 000 FCFA                        │
│   Pierre: 12 × 5 000 - 10 000 (prêt) = 50 000 FCFA       │
│   Jean: 12 × 5 000 = 60 000 FCFA                         │
│   Yvette: 12 × 5 000 = 60 000 FCFA                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Phase 4: CLÔTURE
```
1. Vérifier que tous les prêts sont remboursés (ou déduits)
2. Distribuer les ÉPARGNES (cassation)
3. Établir le bilan du fonds de secours
4. Statut: CLOTURE
5. Fin de l'exercice
```

---

## 🏦 Système de Prêts

### Éligibilité
- Le membre doit être à jour de ses cotisations
- Montant maximum = règle définie (ex: 5× cotisation mensuelle)
- Durée maximum selon règles

### Cycle de Vie d'un Prêt
```
┌─────────────┐     ┌───────────┐     ┌────────────┐     ┌──────────────┐
│  DEMANDE    │ ──> │ APPROUVÉ  │ ──> │ DÉCAISSÉ   │ ──> │ REMBOURSÉ    │
│ (création)  │     │ (bureau)  │     │ (trésorier)│     │ (échéances)  │
└─────────────┘     └───────────┘     └────────────┘     └──────────────┘
        ↓                 ↓                 ↓
   ┌─────────┐      ┌─────────┐       ┌──────────┐
   │ REJETÉ  │      │ ANNULÉ  │       │ EN_COURS │
   └─────────┘      └─────────┘       └──────────┘
```

### Intérêts
- Taux défini dans les règles (ex: 5%)
- Si prêt non remboursé à la cassation → déduit de l'épargne

---

## 📊 Tableau Récapitulatif des Contributions

| Type | Entité | Fréquence | Mutualisation | Destination |
|------|--------|-----------|---------------|-------------|
| Cotisation | CotisationDueMensuelle | Mensuelle | ✅ Oui | 1 bénéficiaire/mois |
| Épargne | EpargneDueMensuelle | Mensuelle | ❌ Non | Cassation (retour individuel) |
| Pot | PotDuMensuel | Mensuelle | ❌ Consommé | Dépenses réunion |
| Secours | SecoursDuAnnuel | Annuelle | ✅ Oui | Fonds événements |
| Inscription | InscriptionDueExercice | Unique | - | Frais admin |

---

## 🔗 Relations entre Entités

```
Tontine
  └── Exercice
        ├── ExerciceMembre (inscription d'un membre)
        │     ├── InscriptionDueExercice (frais annuel)
        │     ├── SecoursDuAnnuel (cotisation fonds secours)
        │     ├── nombreParts
        │     └── role (MEMBRE, PRESIDENT, TRESORIER...)
        │
        ├── Reunion (mensuelle)
        │     ├── CotisationDueMensuelle (par membre) → Distribution
        │     ├── EpargneDueMensuelle (par membre) → Cassation
        │     ├── PotDuMensuel (par membre) → Dépenses
        │     ├── Presence (par membre)
        │     └── Distribution (au bénéficiaire du mois)
        │
        ├── EvenementSecours (événements déclarés)
        │     └── TypeEvenementSecours
        │
        ├── BilanSecoursExercice (solde fonds secours)
        │
        ├── Pret (demandes de prêts)
        │     └── Remboursement
        │
        ├── Penalite (amendes)
        │     └── TypePenalite
        │
        └── Cassation (fin d'exercice - retour épargne)
```

---

## ⚠️ Points d'Attention Importants

1. **COTISATION ≠ ÉPARGNE**
   - Cotisation = redistribuée mensuellement (1 bénéficiaire)
   - Épargne = conservée individuellement (cassation)

2. **POT = Dépense**
   - Le pot est consommé (collation), pas redistribué

3. **SECOURS = Solidarité**
   - Fonds mutualisé pour les événements malheureux/heureux
   - Décès, maladie, mariage, naissance...

4. **CASSATION = Fin d'exercice**
   - Distribution de l'épargne de chaque membre
   - Moins les déductions éventuelles (prêts, pénalités)

5. **Un seul bénéficiaire par réunion**
   - La distribution des cotisations va à une seule personne par mois

---

*Document généré pour NKAPAY - Système de Gestion de Tontines*
