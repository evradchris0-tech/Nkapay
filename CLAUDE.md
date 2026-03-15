# NkapAy — Contexte projet Claude Code

## Concept
Application SaaS multi-tenant de gestion de tontines africaines.
Une tontine regroupe des membres qui cotisent, s'accordent des prêts, distribuent les fonds et s'entraident via un fonds de secours.
Chaque organisation est isolée. Un SuperAdmin supervise toutes les organisations.

---

## Environnement

| | URL |
|---|---|
| Backend | http://localhost:3000 |
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api-docs |
| Frontend | http://localhost:4200 |

---

## Stack

**Backend** : Node.js 20 · Express 4 · TypeScript strict · TypeORM · MySQL 8 · JWT · Jest/Supertest
**Frontend** : Angular 20.3 · TypeScript 5.8 · Signals · CSS pur · Inter + Material Icons CDN

---

## Conventions Angular — RÈGLES ABSOLUES

| Règle | ✅ Faire | ❌ Interdire |
|---|---|---|
| Composants | `standalone: true` | NgModule |
| State | `signal()` `computed()` `effect()` | `BehaviorSubject` dans les composants |
| Injection | `inject()` uniquement | Constructeur avec paramètres services |
| HTTP | `ApiService` uniquement | `HttpClient` directement |
| Templates | `*ngIf` / `*ngFor` avec `CommonModule` (cohérent avec l'existant) | Nouvelle syntaxe `@if/@for` (ne pas mixer) |
| Styles | `var(--...)` CSS variables | Couleurs hardcodées, Angular Material, PrimeNG |
| Icônes | `<span class="material-icons">nom</span>` | Autres librairies d'icônes |
| Notifications | `NotificationService.success/error/warning/info()` | `alert()` sauf confirmations destructives |
| Formulaires | `ReactiveFormsModule` (complexes) · `FormsModule [(ngModel)]` (simples) | — |
| Navigation | `RouterLink` ou `Router.navigate()` | `location.href` |
| Réponse API | Vérifier `response.success` avant `response.data` | Accès direct sans vérification |
| Erreurs | `err.error?.message` pour le message backend | — |

> ⚠️ **Pas de `takeUntilDestroyed()`** dans le projet — convention de facto, ne pas introduire.
> ⚠️ **`AuthState`** a deux champs redondants `user` ET `utilisateur` — vérifier lequel est utilisé dans le composant concerné avant de coder.

---

## Format de réponse API

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field?: string; message: string }[];
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Pattern de consommation obligatoire
this.api.get<ApiResponse<Reunion>>('/reunions/1').subscribe({
  next: res => {
    if (res.success) {
      this.item.set(res.data!);
    } else {
      this.notif.error(res.message ?? 'Erreur');
    }
  },
  error: err => this.notif.error(err.error?.message ?? 'Erreur serveur')
});
```

---

## Services core

```typescript
// ApiService — SEUL point HTTP autorisé
private api = inject(ApiService);
this.api.get<ApiResponse<T>>('/route')
this.api.get<PaginatedResponse<T>>('/route', { page: 1, limit: 10 })
this.api.post<ApiResponse<T>>('/route', payload)
this.api.put<ApiResponse<T>>('/route/:id', payload)
this.api.patch<ApiResponse<T>>('/route/:id', payload)
this.api.delete<ApiResponse<void>>('/route/:id')
this.api.download('/route', 'fichier.pdf')

// AuthService — signals
this.auth.currentUser()      // AuthUser | null
this.auth.isAuthenticated()  // boolean
this.auth.isSuperAdmin()     // boolean

// NotificationService
this.notif.success('') / .error('') / .warning('') / .info('')
```

---

## Services frontend par feature

| Service | Méthodes clés |
|---|---|
| `TontineService` | getAll, getById, create, update, delete, getRegles, suspendre, activer |
| `ExerciceService` | getAll, getById, create, update, ouvrir, fermer, suspendre, reprendre, getExerciceOuvert |
| `ReunionService` | getAll, getById, planifier, update, delete, ouvrir, cloturer, annuler |
| `PresenceService` | getByReunion, getSummary, getCotisationsDues |
| `MembreService` | getAdhesionsByTontine, createAdhesion, desactiverAdhesion, inscrireMembreExercice |
| `TransactionService` | getAll, getById, create, soumettre, valider, rejeter, annuler |
| `PretService` | getAll, getById, create, approuver, refuser, decaisser, solder, mettreEnDefaut, getSummary |
| `PenaliteService` | getAll, create, payer, annuler |
| `DistributionService` | getAll, create, valider, executer |
| `SecoursService` | getSecoursDus, getSecoursEnRetard, getBilanSecours, getTypesEvenement, payerSecours |
| `UtilisateurService` | getAll, getById, create, update, delete |
| `DashboardService` | getStats, getRecentActivities |

---

## State machines — transitions autorisées

| Entité | Transitions |
|---|---|
| Transaction | `BROUILLON → SOUMIS → VALIDE / REJETE → ANNULE` |
| Exercice | `BROUILLON → OUVERT → SUSPENDU ↔ OUVERT → FERME` |
| Prêt | `DEMANDE → APPROUVE / REFUSE → DECAISSE → EN_COURS → SOLDE / DEFAUT` |
| Réunion | `PLANIFIEE → OUVERTE → CLOTUREE / ANNULEE` |
| EvenementSecours | `DECLARE → EN_COURS_VALIDATION → VALIDE / REFUSE → PAYE` |
| DemandeAdhesion | `SOUMISE → EN_COURS → APPROUVEE / REFUSEE / EXPIREE` |

---

## Modèle de données

```
Organisation ──┬── Tontine ──┬── Exercice ──┬── Réunion ──── Présence / CotisationDue
               │             │              ├── ExerciceMembre
               │             │              ├── Prêt ──── Remboursement
               │             │              ├── Pénalité · Distribution
               │             │              ├── EvenementSecours
               │             │              └── Transaction (11 types)
               │             ├── AdhesionTontine · RegleTontine
               ├── Utilisateur
               └── MembreOrganisation
```

---

## État des features

| Feature | Route | État |
|---|---|---|
| auth | /auth/login | ✅ Complet |
| dashboard | /dashboard | ⚠️ Stats basiques, activités manquantes |
| tontines | /dashboard/tontines | ✅ list + form + detail + search + adhesion |
| exercices | /dashboard/exercices | ⚠️ list + form — detail placeholder |
| reunions | /dashboard/reunions | ✅ list + form + detail complet |
| membres | /dashboard/membres | ⚠️ list — detail placeholder |
| transactions | /dashboard/transactions | ⚠️ list + form — pas de workflow |
| prets | /dashboard/prets | ⚠️ list + form — detail placeholder, pas de workflow |
| penalites | /dashboard/penalites | ⚠️ list + form — pas de détail |
| distributions | /dashboard/distributions | ⚠️ list + form — pas de détail |
| secours | /dashboard/secours | ❌ list partielle (retards seulement) |
| rapports | /dashboard/rapports | ⚠️ Export PDF tontines seulement |
| admin | /dashboard/admin | ⚠️ utilisateur list+form — organisations manquantes |
| organisations | — | ❌ Absent |
| projets | — | ❌ Absent |

**Référence visuelle** : `features/tontines/` est le module le plus avancé.

---

## Dette technique à ne pas aggraver

- `AuthState` : champs `user` ET `utilisateur` redondants — vérifier avant de coder
- `SecoursService` : ne couvre pas les événements secours (DECLARE→PAYE)
- `tontine.model.ts` : champs résiduels (`type`, `montantCotisation`, `periodicite`) qui viennent des `RegleTontine`
- Pas de `takeUntilDestroyed()` — ne pas introduire (cohérence)
- `docs/API_REFERENCE.md` = source de vérité API (3491 lignes, 19 sections, 226+ endpoints)

---

## Pattern composant standard

```typescript
@Component({
  standalone: true,
  selector: 'app-xxx',
  imports: [CommonModule, RouterModule],
  templateUrl: './xxx.component.html',
  styleUrl: './xxx.component.scss'
})
export class XxxComponent {
  private api   = inject(ApiService);
  private notif = inject(NotificationService);

  items     = signal<Item[]>([]);
  isLoading = signal(false);
  hasError  = signal(false);
  page      = signal(1);
  total     = signal(0);
  readonly limit = 10;

  totalPages = computed(() => Math.ceil(this.total() / this.limit));
  isEmpty    = computed(() => !this.isLoading() && this.items().length === 0);

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.api.get<PaginatedResponse<Item>>('/items', { page: this.page(), limit: this.limit })
      .subscribe({
        next: res => {
          if (res.success) {
            this.items.set(res.data);
            this.total.set(res.pagination.total);
          } else {
            this.notif.error(res.message ?? 'Erreur chargement');
          }
          this.isLoading.set(false);
        },
        error: err => {
          this.hasError.set(true);
          this.isLoading.set(false);
          this.notif.error(err.error?.message ?? 'Erreur serveur');
        }
      });
  }
}
```

---

## Format de livraison obligatoire

1. `.ts` — logique (signals, inject, vérification `response.success`)
2. `.html` — template (`*ngIf/*ngFor` + états loading / empty / error)
3. `.scss` — styles scopés (CSS variables uniquement)
4. `core/models/xxx.model.ts` — si nouveaux types
5. `feature.routes.ts` — si nouvelle route