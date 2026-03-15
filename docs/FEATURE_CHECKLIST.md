# FEATURE_CHECKLIST.md — NkapAy
> Valider chaque composant avant de l'intégrer dans la branche principale.

---

## ✅ Checklist par composant généré

### Architecture Angular 20
- [ ] Standalone component (`standalone: true`)
- [ ] Tous les imports déclarés dans le tableau `imports: []`
- [ ] Injection via `inject()` (pas de constructeur si évitable)
- [ ] Aucun `NgModule` introduit
- [ ] Aucun `BehaviorSubject` — signals uniquement
- [ ] `takeUntilDestroyed()` sur tout observable souscrit
- [ ] Aucun appel `HttpClient` direct — `ApiService` uniquement

### TypeScript
- [ ] Aucun `any` non justifié
- [ ] Interfaces définies pour toutes les réponses API (dans `core/models/`)
- [ ] Optional chaining sur les valeurs potentiellement nulles
- [ ] Séparation responsabilités : logique dans service, affichage dans composant

### Template HTML
- [ ] Syntaxe `@if / @for / @switch` (Angular 17+)
- [ ] Bindings signals : `{{ signal() }}` et non `{{ signal }}`
- [ ] État **loading** géré (`@if (isLoading()) { <app-loading-spinner> }`)
- [ ] État **empty** géré (`@if (isEmpty()) { <div class="empty-state"> }`)
- [ ] État **error** géré (`@if (hasError()) { <div class="error-state"> }`)
- [ ] `aria-label` sur les boutons sans texte visible
- [ ] Pas de style inline dans le HTML

### Formulaires
- [ ] Validation sur tous les champs requis
- [ ] Messages d'erreur inline sous chaque champ
- [ ] Bouton submit désactivé si formulaire invalide ou en cours de soumission
- [ ] Pré-remplissage fonctionnel en mode édition
- [ ] Toast succès après soumission réussie
- [ ] Toast erreur après échec

### UX & Feedback
- [ ] `NotificationService` utilisé pour tous les feedbacks (pas d'`alert()`)
- [ ] `ConfirmDialog` pour toute action destructrice (suppression, etc.)
- [ ] Loading spinner pendant les appels API
- [ ] Boutons désactivés pendant les requêtes en cours

### Design & SCSS
- [ ] Aucune couleur hardcodée — uniquement `var(--...)` du design system
- [ ] Styles scopés au composant (`.scss` dédié)
- [ ] Cohérence visuelle avec `tontine-list` / `tontine-detail`
- [ ] Material Icons pour toutes les icônes
- [ ] Responsive testé aux 3 breakpoints : `768px`, `1024px`, `1280px`
- [ ] Aucune dépendance Angular Material ou PrimeNG

### Routes & Intégration
- [ ] Route déclarée dans le bon `feature.routes.ts`
- [ ] Guards appliqués (`authGuard`, `adminGuard` si nécessaire)
- [ ] Lien depuis la sidebar si c'est une page principale
- [ ] Breadcrumb ou titre de page cohérent avec le menu

---

## 📊 Suivi d'avancement des features

| Feature | Composant | .ts | .html | .scss | Tests manuels | ✅ Prêt |
|---|---|---|---|---|---|---|
| auth | login | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth | change-password | ✅ | ✅ | ✅ | ✅ | ✅ |
| dashboard | stats | ✅ | ✅ | ✅ | ✅ | ✅ |
| tontines | list | ✅ | ✅ | ✅ | ✅ | ✅ |
| tontines | detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| tontines | form | ✅ | ✅ | ✅ | ✅ | ✅ |
| tontines | search | ✅ | ✅ | ✅ | ✅ | ✅ |
| tontines | adhesion-request | ✅ | ✅ | ✅ | ✅ | ✅ |
| reunions | list | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| reunions | **detail** ← PRIORITÉ | ✅ | ❌ | ❌ | ❌ | ❌ |
| reunions | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| exercices | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| exercices | detail | ✅ | ❌ | ❌ | ❌ | ❌ |
| exercices | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| membres | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| membres | detail | ✅ | ❌ | ❌ | ❌ | ❌ |
| transactions | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| transactions | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| prets | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| prets | detail | ✅ | ❌ | ❌ | ❌ | ❌ |
| prets | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| penalites | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| penalites | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| distributions | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| distributions | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| secours | list | ✅ | ❌ | ❌ | ❌ | ❌ |
| secours | form | ✅ | ❌ | ❌ | ❌ | ❌ |
| rapports | rapports | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin | utilisateur-list | ✅ | ❌ | ❌ | ❌ | ❌ |
| admin | utilisateur-form | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🗓️ Ordre de développement recommandé

### Sprint 1 — Cœur fonctionnel (haute valeur métier)
1. `reunions/detail` ← placeholder prioritaire
2. `reunions/form`
3. `reunions/list`

### Sprint 2 — Flux financier
4. `transactions/list`
5. `transactions/form`
6. `prets/list + detail + form`
7. `penalites/list + form`

### Sprint 3 — Gestion membres & exercices
8. `membres/list + detail`
9. `exercices/list + detail + form`

### Sprint 4 — Distribution & secours
10. `distributions/list + form`
11. `secours/list + form`

### Sprint 5 — Administration & rapports
12. `admin/utilisateur-list + form`
13. `rapports/rapports`
