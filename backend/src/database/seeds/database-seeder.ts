/**
 * Seeder complet de développement — Nkapay
 *
 * Peuple TOUTES les tables du projet avec des données camerounaises réalistes.
 * Idempotent : peut être relancé sans crasher ni dupliquer.
 *
 * Ordre de seeding (respect des FK) :
 *  1. Langues
 *  2. Super Admin + Utilisateurs
 *  3. TontineTypes, Tontines, OperateursPaiement, TypesPenalite
 *  4. Adhésions Tontine
 *  5. Exercices + ExerciceMembres
 *  6. Réunions + Présences
 *  7. Dues (Cotisations, Pots, Épargnes, Inscriptions, Secours) + Transactions + Distributions
 *  8. Prêts + Remboursements + Pénalités + Événements Secours + Cassations + Demandes d'adhésion
 */

import { DataSource, Repository } from 'typeorm';

// Entities
import { Langue } from '../../modules/utilisateurs/entities/langue.entity';
import { Utilisateur } from '../../modules/utilisateurs/entities/utilisateur.entity';
import { TontineType } from '../../modules/tontines/entities/tontine-type.entity';
import { Tontine, StatutTontine } from '../../modules/tontines/entities/tontine.entity';
import {
  AdhesionTontine,
  RoleMembre,
  StatutAdhesion,
} from '../../modules/tontines/entities/adhesion-tontine.entity';
import { Exercice, StatutExercice } from '../../modules/exercices/entities/exercice.entity';
import {
  ExerciceMembre,
  TypeMembre,
  StatutExerciceMembre,
} from '../../modules/exercices/entities/exercice-membre.entity';
import { Reunion, StatutReunion } from '../../modules/reunions/entities/reunion.entity';
import { PresenceReunion } from '../../modules/reunions/entities/presence-reunion.entity';
import {
  Transaction,
  TypeTransaction,
  StatutTransaction,
  ModeCreationTransaction,
} from '../../modules/transactions/entities/transaction.entity';
import { CotisationDueMensuelle } from '../../modules/transactions/entities/cotisation-due-mensuelle.entity';
import { PotDuMensuel } from '../../modules/transactions/entities/pot-du-mensuel.entity';
import { EpargneDueMensuelle } from '../../modules/transactions/entities/epargne-due-mensuelle.entity';
import {
  InscriptionDueExercice,
  StatutDu,
} from '../../modules/transactions/entities/inscription-due-exercice.entity';
import { SecoursDuAnnuel } from '../../modules/secours/entities/secours-du-annuel.entity';
import { OperateurPaiement } from '../../modules/transactions/entities/operateur-paiement.entity';
import {
  Distribution,
  StatutDistribution,
} from '../../modules/distributions/entities/distribution.entity';
import { Pret, StatutPret } from '../../modules/prets/entities/pret.entity';
import { RemboursementPret } from '../../modules/prets/entities/remboursement-pret.entity';
import {
  TypePenalite,
  ModeCalculPenalite,
} from '../../modules/penalites/entities/type-penalite.entity';
import { Penalite, StatutPenalite } from '../../modules/penalites/entities/penalite.entity';
import { TypeEvenementSecours } from '../../modules/secours/entities/type-evenement-secours.entity';
import {
  EvenementSecours,
  StatutEvenementSecours,
} from '../../modules/secours/entities/evenement-secours.entity';
import { BilanSecoursExercice } from '../../modules/secours/entities/bilan-secours-exercice.entity';
import {
  DemandeAdhesion,
  StatutDemandeAdhesion,
} from '../../modules/adhesions/entities/demande-adhesion.entity';

// Utils
import { hashPassword } from '../../modules/auth/utils/password.util';

// Data
import {
  SUPER_ADMIN,
  UTILISATEURS_DATA,
  LANGUES_DATA,
  TONTINE_TYPES_DATA,
  TONTINES_DATA,
  OPERATEURS_PAIEMENT_DATA,
  TYPES_PENALITE_DATA,
  EXERCICES_DATA,
  MONTANTS,
} from './seed-data';

// ============================================================================
// HELPERS
// ============================================================================

let txRefCounter = 0;
function generateRef(): string {
  txRefCounter++;
  return `SEED-${Date.now()}-${txRefCounter.toString().padStart(4, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ============================================================================
// MAIN SEEDER
// ============================================================================

export async function runDatabaseSeeder(dataSource: DataSource): Promise<void> {
  const log = (msg: string) => console.log(`[SEED] ${msg}`);

  // --- Guard : skip si la base contient déjà des données ---
  const userCount = await dataSource.getRepository(Utilisateur).count();
  if (userCount >= 5) {
    log('Base de données déjà peuplée (≥ 5 utilisateurs). Seed ignoré.');
    return;
  }

  log('='.repeat(60));
  log('Démarrage du seeding complet de développement...');
  log('='.repeat(60));

  // --- Références stockées au fur et à mesure ---
  const refs: SeedRefs = {} as SeedRefs;

  await seedLangues(dataSource, refs, log);
  await seedUtilisateurs(dataSource, refs, log);
  await seedReferenceData(dataSource, refs, log);
  await seedTontines(dataSource, refs, log);
  await seedAdhesions(dataSource, refs, log);
  await seedExercices(dataSource, refs, log);
  await seedExerciceMembres(dataSource, refs, log);
  await seedReunions(dataSource, refs, log);
  await seedPresences(dataSource, refs, log);
  await seedDuesEtTransactions(dataSource, refs, log);
  await seedDistributions(dataSource, refs, log);
  await seedPrets(dataSource, refs, log);
  await seedPenalites(dataSource, refs, log);
  await seedSecours(dataSource, refs, log);
  await seedDemandesAdhesion(dataSource, refs, log);

  log('='.repeat(60));
  log('Seeding complet terminé avec succès !');
  log(
    `  Super Admin : telephone ${SUPER_ADMIN.telephone1} / mot de passe : ${SUPER_ADMIN.password}`
  );
  log(`  Tous les utilisateurs : mot de passe "password123"`);
  log('='.repeat(60));
}

// ============================================================================
// TYPES
// ============================================================================

interface SeedRefs {
  langues: Langue[];
  utilisateurs: Utilisateur[];
  superAdmin: Utilisateur;
  tontineTypes: Map<string, TontineType>; // code → entity
  tontines: Map<string, Tontine>; // nomCourt → entity
  operateurs: OperateurPaiement[];
  typesPenalite: Map<string, TypePenalite>;
  typesSecours: Map<string, TypeEvenementSecours>;
  adhesions: Map<string, AdhesionTontine[]>; // tontineNomCourt → adhesions
  exercices: Map<string, Exercice>; // tontineNomCourt → exercice
  exerciceMembres: Map<string, ExerciceMembre[]>; // tontineNomCourt → membres
  reunions: Map<string, Reunion[]>; // tontineNomCourt → réunions
  transactions: Transaction[];
  prets: Pret[];
}

// ============================================================================
// STEP 1 : LANGUES
// ============================================================================

async function seedLangues(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Langue);
  const langues: Langue[] = [];

  for (const data of LANGUES_DATA) {
    let langue = await repo.findOne({ where: { code: data.code } });
    if (!langue) {
      langue = await repo.save(repo.create(data));
    }
    langues.push(langue);
  }

  refs.langues = langues;
  log(`✅ ${langues.length} langues`);
}

// ============================================================================
// STEP 2 : UTILISATEURS
// ============================================================================

async function seedUtilisateurs(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Utilisateur);
  const passwordHash = await hashPassword('password123');
  const langFr = refs.langues.find((l) => l.code === 'fr')!;

  // Super Admin
  let admin = await repo.findOne({ where: { telephone1: SUPER_ADMIN.telephone1 } });
  if (!admin) {
    admin = await repo.save(
      repo.create({
        prenom: SUPER_ADMIN.prenom,
        nom: SUPER_ADMIN.nom,
        telephone1: SUPER_ADMIN.telephone1,
        passwordHash: await hashPassword(SUPER_ADMIN.password),
        estSuperAdmin: true,
        doitChangerMotDePasse: false,
        languePrefereeId: langFr.id,
        dateInscription: new Date('2024-01-01'),
      })
    );
  }
  refs.superAdmin = admin;

  // 20 membres
  const utilisateurs: Utilisateur[] = [admin];
  for (const data of UTILISATEURS_DATA) {
    let user = await repo.findOne({ where: { telephone1: data.telephone1 } });
    if (!user) {
      user = await repo.save(
        repo.create({
          ...data,
          passwordHash,
          doitChangerMotDePasse: false,
          languePrefereeId: langFr.id,
          dateInscription: new Date('2024-06-15'),
        })
      );
    }
    utilisateurs.push(user);
  }

  refs.utilisateurs = utilisateurs;
  log(`✅ ${utilisateurs.length} utilisateurs (1 super admin + 20 membres)`);
}

// ============================================================================
// STEP 3 : DONNÉES DE RÉFÉRENCE (TontineTypes, Opérateurs, TypesPénalité)
// ============================================================================

async function seedReferenceData(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  // Tontine Types
  const ttRepo = ds.getRepository(TontineType);
  refs.tontineTypes = new Map();
  for (const data of TONTINE_TYPES_DATA) {
    let tt = await ttRepo.findOne({ where: { code: data.code } });
    if (!tt) tt = await ttRepo.save(ttRepo.create(data));
    refs.tontineTypes.set(data.code, tt);
  }
  log(`✅ ${refs.tontineTypes.size} types de tontine`);

  // Opérateurs Paiement
  const opRepo = ds.getRepository(OperateurPaiement);
  refs.operateurs = [];
  for (const data of OPERATEURS_PAIEMENT_DATA) {
    let op = await opRepo.findOne({ where: { code: data.code } });
    if (!op) op = await opRepo.save(opRepo.create(data));
    refs.operateurs.push(op);
  }
  log(`✅ ${refs.operateurs.length} opérateurs de paiement`);

  // Types Pénalité
  const tpRepo = ds.getRepository(TypePenalite);
  refs.typesPenalite = new Map();
  for (const data of TYPES_PENALITE_DATA) {
    let tp = await tpRepo.findOne({ where: { code: data.code } });
    if (!tp) {
      tp = await tpRepo.save(
        tpRepo.create({
          ...data,
          modeCalcul: data.modeCalcul as ModeCalculPenalite,
        })
      );
    }
    refs.typesPenalite.set(data.code, tp);
  }
  log(`✅ ${refs.typesPenalite.size} types de pénalité`);

  // Types événement secours (récupérer ceux créés par le seeder existant)
  const tsRepo = ds.getRepository(TypeEvenementSecours);
  const typesSecours = await tsRepo.find();
  refs.typesSecours = new Map();
  for (const ts of typesSecours) {
    refs.typesSecours.set(ts.code, ts);
  }
  log(`✅ ${refs.typesSecours.size} types d'événement secours (existants)`);
}

// ============================================================================
// STEP 4 : TONTINES
// ============================================================================

async function seedTontines(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Tontine);
  refs.tontines = new Map();

  for (const data of TONTINES_DATA) {
    let tontine = await repo.findOne({ where: { nomCourt: data.nomCourt } });
    if (!tontine) {
      const tontineType = refs.tontineTypes.get(data.tontineTypeCode)!;
      tontine = await repo.save(
        repo.create({
          nom: data.nom,
          nomCourt: data.nomCourt,
          anneeFondation: data.anneeFondation,
          motto: data.motto,
          estOfficiellementDeclaree: data.estOfficiellementDeclaree,
          numeroEnregistrement: data.numeroEnregistrement || null,
          tontineTypeId: tontineType.id,
          statut: StatutTontine.ACTIVE,
        })
      );
    }
    refs.tontines.set(data.nomCourt, tontine);
  }
  log(`✅ ${refs.tontines.size} tontines`);
}

// ============================================================================
// STEP 5 : ADHÉSIONS (Utilisateurs ↔ Tontines)
// ============================================================================

async function seedAdhesions(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(AdhesionTontine);
  refs.adhesions = new Map();
  const users = refs.utilisateurs;
  let totalCount = 0;

  // CAYA : 12 membres (admin + users 0..10)
  const cayaMembers = [refs.superAdmin, ...users.slice(1, 12)];
  await createAdhesions(repo, refs.tontines.get('CAYA')!, cayaMembers, refs, 'CAYA');

  // FAM-OMGBA : 8 membres (users 0..7)
  const omgbaMembers = users.slice(1, 9);
  await createAdhesions(repo, refs.tontines.get('FAM-OMGBA')!, omgbaMembers, refs, 'FAM-OMGBA');

  // SOLID-DLA : 6 membres (users 10..15)
  const dlaMembers = users.slice(11, 17);
  await createAdhesions(repo, refs.tontines.get('SOLID-DLA')!, dlaMembers, refs, 'SOLID-DLA');

  for (const [, adhesions] of refs.adhesions) totalCount += adhesions.length;
  log(`✅ ${totalCount} adhésions tontine`);
}

async function createAdhesions(
  repo: Repository<AdhesionTontine>,
  tontine: Tontine,
  users: Utilisateur[],
  refs: SeedRefs,
  nomCourt: string
): Promise<void> {
  const adhesions: AdhesionTontine[] = [];
  const roles = [RoleMembre.PRESIDENT, RoleMembre.TRESORIER, RoleMembre.SECRETAIRE];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let adhesion = await repo.findOne({
      where: { tontineId: tontine.id, utilisateurId: user.id },
    });
    if (!adhesion) {
      adhesion = await repo.save(
        repo.create({
          tontineId: tontine.id,
          utilisateurId: user.id,
          matricule: `${nomCourt}-${(i + 1).toString().padStart(3, '0')}`,
          role: i < roles.length ? roles[i] : RoleMembre.MEMBRE,
          statut: StatutAdhesion.ACTIVE,
          quartierResidence: user.adresseResidence,
        })
      );
    }
    adhesions.push(adhesion);
  }

  refs.adhesions.set(nomCourt, adhesions);
}

// ============================================================================
// STEP 6 : EXERCICES
// ============================================================================

async function seedExercices(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Exercice);
  refs.exercices = new Map();

  for (const data of EXERCICES_DATA) {
    const tontine = refs.tontines.get(data.tontineNomCourt)!;

    let exercice = await repo.findOne({
      where: { tontineId: tontine.id, libelle: data.libelle },
    });

    if (!exercice) {
      exercice = await repo.save(
        repo.create({
          tontineId: tontine.id,
          libelle: data.libelle,
          anneeDebut: data.anneeDebut,
          moisDebut: data.moisDebut,
          anneeFin: data.anneeFin,
          moisFin: data.moisFin,
          dureeMois: data.dureeMois,
          statut: StatutExercice.OUVERT,
          ouvertLe: new Date(`${data.anneeDebut}-${data.moisDebut.toString().padStart(2, '0')}-01`),
        })
      );
    }

    refs.exercices.set(data.tontineNomCourt, exercice);
  }
  log(`✅ ${refs.exercices.size} exercices`);
}

// ============================================================================
// STEP 7 : EXERCICE MEMBRES
// ============================================================================

async function seedExerciceMembres(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(ExerciceMembre);
  refs.exerciceMembres = new Map();
  let totalCount = 0;

  for (const [nomCourt, exercice] of refs.exercices) {
    const adhesions = refs.adhesions.get(nomCourt) || [];
    const membres: ExerciceMembre[] = [];

    for (const adhesion of adhesions) {
      let em = await repo.findOne({
        where: { exerciceId: exercice.id, adhesionTontineId: adhesion.id },
      });
      if (!em) {
        em = await repo.save(
          repo.create({
            exerciceId: exercice.id,
            adhesionTontineId: adhesion.id,
            typeMembre: TypeMembre.ANCIEN,
            moisEntree: 1,
            dateEntreeExercice: new Date(
              `${exercice.anneeDebut}-${exercice.moisDebut.toString().padStart(2, '0')}-01`
            ),
            nombreParts: 1,
            statut: StatutExerciceMembre.ACTIF,
          })
        );
      }
      membres.push(em);
    }

    refs.exerciceMembres.set(nomCourt, membres);
    totalCount += membres.length;
  }
  log(`✅ ${totalCount} exercice-membres`);
}

// ============================================================================
// STEP 8 : RÉUNIONS (pour CAYA : 6 passées, 1 ouverte, 5 futures)
// ============================================================================

async function seedReunions(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Reunion);
  refs.reunions = new Map();
  let totalCount = 0;

  const lieux = [
    'Domicile du Président — Bastos',
    'Restaurant Le Berceau Africain — Nlongkak',
    'Salle Polyvalente CAYA — Messa',
    'Chez Trésorier — Essos',
    'Hotel Hilton — Centre-ville',
    'Restaurant La Terrasse — Tsinga',
    'Chez Secrétaire — Biyem Assi',
    'Paillote du Lac — Mvan',
    'Club CAYA — Emana',
    'Restaurant Le Paradis — Ekounou',
    'Domicile Membre — Nkolbisson',
    'Salle des fêtes — Ngousso',
  ];

  for (const [nomCourt, exercice] of refs.exercices) {
    const nbReunions = nomCourt === 'CAYA' ? 12 : nomCourt === 'FAM-OMGBA' ? 6 : 4;
    const membres = refs.exerciceMembres.get(nomCourt) || [];
    const reunions: Reunion[] = [];

    for (let i = 1; i <= nbReunions; i++) {
      let reunion = await repo.findOne({
        where: { exerciceId: exercice.id, numeroReunion: i },
      });

      if (!reunion) {
        const dateReunion = addMonths(
          new Date(`${exercice.anneeDebut}-${exercice.moisDebut.toString().padStart(2, '0')}-15`),
          i - 1
        );

        let statut: StatutReunion;
        const now = new Date();
        if (dateReunion < addDays(now, -15)) {
          statut = StatutReunion.CLOTUREE;
        } else if (dateReunion < addDays(now, 15)) {
          statut = StatutReunion.OUVERTE;
        } else {
          statut = StatutReunion.PLANIFIEE;
        }

        reunion = await repo.save(
          repo.create({
            exerciceId: exercice.id,
            numeroReunion: i,
            dateReunion,
            heureDebut: '14:00',
            lieu: lieux[(i - 1) % lieux.length],
            hoteExerciceMembreId: membres.length > 0 ? membres[(i - 1) % membres.length].id : null,
            statut,
            ouverteLe: statut !== StatutReunion.PLANIFIEE ? dateReunion : null,
            clotureeLe: statut === StatutReunion.CLOTUREE ? addDays(dateReunion, 0) : null,
            clotureeParExerciceMembreId:
              statut === StatutReunion.CLOTUREE && membres.length > 0 ? membres[0].id : null,
          })
        );
      }

      reunions.push(reunion);
    }

    refs.reunions.set(nomCourt, reunions);
    totalCount += reunions.length;
  }
  log(`✅ ${totalCount} réunions`);
}

// ============================================================================
// STEP 9 : PRÉSENCES (pour les réunions clôturées ou ouvertes)
// ============================================================================

async function seedPresences(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(PresenceReunion);
  let totalCount = 0;

  for (const [nomCourt] of refs.reunions) {
    const reunions = refs.reunions.get(nomCourt)!;
    const membres = refs.exerciceMembres.get(nomCourt) || [];

    for (const reunion of reunions) {
      if (reunion.statut === StatutReunion.PLANIFIEE) continue;

      for (let j = 0; j < membres.length; j++) {
        const existing = await repo.findOne({
          where: { reunionId: reunion.id, exerciceMembreId: membres[j].id },
        });
        if (existing) {
          totalCount++;
          continue;
        }

        const estPresent = Math.random() > 0.1; // 90% de présence
        const estEnRetard = estPresent && Math.random() > 0.7; // 30% en retard parmi les présents

        await repo.save(
          repo.create({
            reunionId: reunion.id,
            exerciceMembreId: membres[j].id,
            estPresent,
            estEnRetard,
            heureArrivee: estPresent ? (estEnRetard ? '14:45' : '13:55') : null,
            note: !estPresent ? 'Absent - non justifié' : null,
          })
        );
        totalCount++;
      }
    }
  }
  log(`✅ ${totalCount} présences`);
}

// ============================================================================
// STEP 10 : DUES + TRANSACTIONS
// ============================================================================

async function seedDuesEtTransactions(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const txRepo = ds.getRepository(Transaction);
  const cotRepo = ds.getRepository(CotisationDueMensuelle);
  const potRepo = ds.getRepository(PotDuMensuel);
  const eparRepo = ds.getRepository(EpargneDueMensuelle);
  const insRepo = ds.getRepository(InscriptionDueExercice);
  const secDuRepo = ds.getRepository(SecoursDuAnnuel);
  refs.transactions = [];

  const montantConfig: Record<
    string,
    { cotisation: number; pot: number; epargne: number; inscription: number }
  > = {
    CAYA: {
      cotisation: MONTANTS.COTISATION_CAYA,
      pot: MONTANTS.POT_CAYA,
      epargne: MONTANTS.EPARGNE_CAYA,
      inscription: MONTANTS.INSCRIPTION_CAYA,
    },
    'FAM-OMGBA': {
      cotisation: MONTANTS.COTISATION_OMGBA,
      pot: MONTANTS.POT_OMGBA,
      epargne: 0,
      inscription: MONTANTS.INSCRIPTION_OMGBA,
    },
    'SOLID-DLA': {
      cotisation: MONTANTS.COTISATION_SOLID,
      pot: MONTANTS.POT_SOLID,
      epargne: 0,
      inscription: MONTANTS.INSCRIPTION_SOLID,
    },
  };

  let txCount = 0;
  let dueCount = 0;

  for (const [nomCourt] of refs.exerciceMembres) {
    const membres = refs.exerciceMembres.get(nomCourt)!;
    const reunions = refs.reunions.get(nomCourt) || [];
    const cfg = montantConfig[nomCourt];
    const tresorier = membres[1]; // Le trésorier (index 1 = rôle TRESORIER)

    // --- Inscriptions (une par membre) ---
    for (const membre of membres) {
      const existing = await insRepo.findOne({ where: { exerciceMembreId: membre.id } });
      if (!existing) {
        await insRepo.save(
          insRepo.create({
            exerciceMembreId: membre.id,
            montantDu: cfg.inscription,
            montantPaye: cfg.inscription,
            soldeRestant: 0,
            statut: StatutDu.A_JOUR,
          })
        );
        dueCount++;

        // Transaction d'inscription
        const tx = await txRepo.save(
          txRepo.create({
            reunionId: reunions.length > 0 ? reunions[0].id : null,
            typeTransaction: TypeTransaction.INSCRIPTION,
            exerciceMembreId: membre.id,
            montant: cfg.inscription,
            reference: generateRef(),
            description: `Frais d'inscription - ${nomCourt}`,
            statut: StatutTransaction.VALIDE,
            modeCreation: ModeCreationTransaction.MANUEL,
            creeParExerciceMembreId: tresorier?.id || null,
            soumisLe: new Date(),
            autoSoumis: true,
            valideLe: new Date(),
            valideParExerciceMembreId: tresorier?.id || null,
          })
        );
        refs.transactions.push(tx);
        txCount++;
      }
    }

    // --- Secours annuels (une par membre) ---
    for (const membre of membres) {
      const existing = await secDuRepo.findOne({ where: { exerciceMembreId: membre.id } });
      if (!existing) {
        await secDuRepo.save(
          secDuRepo.create({
            exerciceMembreId: membre.id,
            montantDu: MONTANTS.SECOURS_ANNUEL,
            montantPaye: MONTANTS.SECOURS_ANNUEL,
            soldeRestant: 0,
            statut: StatutDu.A_JOUR,
          })
        );
        dueCount++;
      }
    }

    // --- Cotisations, Pots, Épargnes pour chaque réunion clôturée ---
    for (const reunion of reunions) {
      if (reunion.statut !== StatutReunion.CLOTUREE) continue;

      for (const membre of membres) {
        // Cotisation due
        const existCot = await cotRepo.findOne({
          where: { reunionId: reunion.id, exerciceMembreId: membre.id },
        });
        if (!existCot) {
          await cotRepo.save(
            cotRepo.create({
              reunionId: reunion.id,
              exerciceMembreId: membre.id,
              montantDu: cfg.cotisation,
              montantPaye: cfg.cotisation,
              soldeRestant: 0,
              statut: StatutDu.A_JOUR,
            })
          );
          dueCount++;
        }

        // Transaction cotisation
        const tx = await txRepo.save(
          txRepo.create({
            reunionId: reunion.id,
            typeTransaction: TypeTransaction.COTISATION,
            exerciceMembreId: membre.id,
            montant: cfg.cotisation,
            reference: generateRef(),
            description: `Cotisation réunion #${reunion.numeroReunion}`,
            statut: StatutTransaction.VALIDE,
            modeCreation: ModeCreationTransaction.MANUEL,
            creeParExerciceMembreId: tresorier?.id || null,
            soumisLe: reunion.clotureeLe || new Date(),
            autoSoumis: true,
            valideLe: reunion.clotureeLe || new Date(),
            valideParExerciceMembreId: tresorier?.id || null,
          })
        );
        refs.transactions.push(tx);
        txCount++;

        // Pot du
        const existPot = await potRepo.findOne({
          where: { reunionId: reunion.id, exerciceMembreId: membre.id },
        });
        if (!existPot) {
          await potRepo.save(
            potRepo.create({
              reunionId: reunion.id,
              exerciceMembreId: membre.id,
              montantDu: cfg.pot,
              montantPaye: cfg.pot,
              soldeRestant: 0,
              statut: StatutDu.A_JOUR,
            })
          );
          dueCount++;
        }

        // Transaction pot
        const txPot = await txRepo.save(
          txRepo.create({
            reunionId: reunion.id,
            typeTransaction: TypeTransaction.POT,
            exerciceMembreId: membre.id,
            montant: cfg.pot,
            reference: generateRef(),
            description: `Pot réunion #${reunion.numeroReunion}`,
            statut: StatutTransaction.VALIDE,
            modeCreation: ModeCreationTransaction.MANUEL,
            creeParExerciceMembreId: tresorier?.id || null,
            soumisLe: reunion.clotureeLe || new Date(),
            autoSoumis: true,
            valideLe: reunion.clotureeLe || new Date(),
            valideParExerciceMembreId: tresorier?.id || null,
          })
        );
        refs.transactions.push(txPot);
        txCount++;

        // Épargne (si applicable)
        if (cfg.epargne > 0) {
          const existEpar = await eparRepo.findOne({
            where: { reunionId: reunion.id, exerciceMembreId: membre.id },
          });
          if (!existEpar) {
            await eparRepo.save(
              eparRepo.create({
                reunionId: reunion.id,
                exerciceMembreId: membre.id,
                montantDu: cfg.epargne,
                montantPaye: cfg.epargne,
                soldeRestant: 0,
                statut: StatutDu.A_JOUR,
              })
            );
            dueCount++;
          }

          const txEp = await txRepo.save(
            txRepo.create({
              reunionId: reunion.id,
              typeTransaction: TypeTransaction.EPARGNE,
              exerciceMembreId: membre.id,
              montant: cfg.epargne,
              reference: generateRef(),
              description: `Épargne réunion #${reunion.numeroReunion}`,
              statut: StatutTransaction.VALIDE,
              modeCreation: ModeCreationTransaction.MANUEL,
              creeParExerciceMembreId: tresorier?.id || null,
              soumisLe: reunion.clotureeLe || new Date(),
              autoSoumis: true,
              valideLe: reunion.clotureeLe || new Date(),
              valideParExerciceMembreId: tresorier?.id || null,
            })
          );
          refs.transactions.push(txEp);
          txCount++;
        }
      }
    }
  }

  log(`✅ ${dueCount} dues (inscriptions, cotisations, pots, épargnes, secours)`);
  log(`✅ ${txCount} transactions`);
}

// ============================================================================
// STEP 11 : DISTRIBUTIONS (1 bénéficiaire par réunion clôturée, CAYA seulement)
// ============================================================================

async function seedDistributions(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Distribution);
  const txRepo = ds.getRepository(Transaction);
  let count = 0;

  const cayaReunions = (refs.reunions.get('CAYA') || []).filter(
    (r) => r.statut === StatutReunion.CLOTUREE
  );
  const cayaMembres = refs.exerciceMembres.get('CAYA') || [];

  for (let i = 0; i < cayaReunions.length; i++) {
    const reunion = cayaReunions[i];
    const beneficiaire = cayaMembres[i % cayaMembres.length];

    const existing = await repo.findOne({ where: { reunionId: reunion.id, ordre: 1 } });
    if (existing) {
      count++;
      continue;
    }

    const montantBrut = MONTANTS.COTISATION_CAYA * cayaMembres.length;

    // Transaction de distribution
    const tx = await txRepo.save(
      txRepo.create({
        reunionId: reunion.id,
        typeTransaction: TypeTransaction.COTISATION,
        exerciceMembreId: beneficiaire.id,
        montant: montantBrut,
        reference: generateRef(),
        description: `Distribution à ${beneficiaire.id} — réunion #${reunion.numeroReunion}`,
        statut: StatutTransaction.VALIDE,
        modeCreation: ModeCreationTransaction.AUTOMATIQUE,
        creeParExerciceMembreId: cayaMembres[1]?.id || null,
        soumisLe: reunion.clotureeLe,
        autoSoumis: true,
        valideLe: reunion.clotureeLe,
        valideParExerciceMembreId: cayaMembres[1]?.id || null,
      })
    );

    await repo.save(
      repo.create({
        reunionId: reunion.id,
        exerciceMembreBeneficiaireId: beneficiaire.id,
        ordre: 1,
        montantBrut,
        montantRetenu: 0,
        montantNet: montantBrut,
        statut: StatutDistribution.DISTRIBUEE,
        transactionId: tx.id,
        distribueeLe: reunion.clotureeLe,
        commentaire: `Distribution réunion #${reunion.numeroReunion}`,
      })
    );

    refs.transactions.push(tx);
    count++;
  }
  log(`✅ ${count} distributions`);
}

// ============================================================================
// STEP 12 : PRÊTS + REMBOURSEMENTS
// ============================================================================

async function seedPrets(ds: DataSource, refs: SeedRefs, log: (m: string) => void): Promise<void> {
  const pretRepo = ds.getRepository(Pret);
  const rembRepo = ds.getRepository(RemboursementPret);
  const txRepo = ds.getRepository(Transaction);
  refs.prets = [];

  const cayaMembres = refs.exerciceMembres.get('CAYA') || [];
  const cayaReunions = (refs.reunions.get('CAYA') || []).filter(
    (r) => r.statut === StatutReunion.CLOTUREE
  );
  if (cayaMembres.length < 5 || cayaReunions.length < 3) {
    log('⏭️  Pas assez de données CAYA pour créer des prêts');
    return;
  }

  const tresorier = cayaMembres[1];

  // Prêt 1 : EN_COURS (membre #3, 150 000 XAF, 5% intérêt, 6 mois)
  const existingPret1 = await pretRepo.findOne({
    where: { exerciceMembreId: cayaMembres[3].id, statut: StatutPret.EN_COURS },
  });
  if (!existingPret1) {
    const capital = 150000;
    const taux = 0.05;
    const interet = capital * taux * 6;
    const pret1 = await pretRepo.save(
      pretRepo.create({
        reunionId: cayaReunions[1].id,
        exerciceMembreId: cayaMembres[3].id,
        montantCapital: capital,
        tauxInteret: taux,
        montantInteret: interet,
        montantTotalDu: capital + interet,
        dureeMois: 6,
        statut: StatutPret.EN_COURS,
        capitalRestant: capital - 50000,
        dateApprobation: cayaReunions[1].dateReunion,
        dateDecaissement: cayaReunions[1].dateReunion,
        dateEcheance: addMonths(new Date(cayaReunions[1].dateReunion), 6),
        approuveParExerciceMembreId: tresorier.id,
        commentaire: 'Prêt pour rénovation domicile',
      })
    );
    refs.prets.push(pret1);

    // 2 remboursements
    for (let r = 0; r < 2; r++) {
      const rembCapital = 25000;
      const rembInteret = capital * taux;
      const tx = await txRepo.save(
        txRepo.create({
          reunionId: cayaReunions[2 + r]?.id || cayaReunions[2].id,
          typeTransaction: TypeTransaction.REMBOURSEMENT_PRET,
          exerciceMembreId: cayaMembres[3].id,
          montant: rembCapital + rembInteret,
          reference: generateRef(),
          description: `Remboursement prêt #${r + 1}`,
          statut: StatutTransaction.VALIDE,
          modeCreation: ModeCreationTransaction.MANUEL,
          creeParExerciceMembreId: tresorier.id,
          soumisLe: new Date(),
          autoSoumis: true,
          valideLe: new Date(),
          valideParExerciceMembreId: tresorier.id,
        })
      );

      await rembRepo.save(
        rembRepo.create({
          pretId: pret1.id,
          reunionId: cayaReunions[2 + r]?.id || cayaReunions[2].id,
          transactionId: tx.id,
          montantCapital: rembCapital,
          montantInteret: rembInteret,
          montantTotal: rembCapital + rembInteret,
          capitalRestantApres: capital - 25000 * (r + 1) - 25000 * r,
          commentaire: `Remboursement mensuel #${r + 1}`,
        })
      );
    }
  }

  // Prêt 2 : SOLDE (membre #5, 80 000 XAF, remboursé intégralement)
  const existingPret2 = await pretRepo.findOne({
    where: { exerciceMembreId: cayaMembres[5].id, statut: StatutPret.SOLDE },
  });
  if (!existingPret2) {
    const capital = 80000;
    const taux = 0.05;
    const interet = capital * taux * 3;
    const pret2 = await pretRepo.save(
      pretRepo.create({
        reunionId: cayaReunions[0].id,
        exerciceMembreId: cayaMembres[5].id,
        montantCapital: capital,
        tauxInteret: taux,
        montantInteret: interet,
        montantTotalDu: capital + interet,
        dureeMois: 3,
        statut: StatutPret.SOLDE,
        capitalRestant: 0,
        dateApprobation: cayaReunions[0].dateReunion,
        dateDecaissement: cayaReunions[0].dateReunion,
        dateEcheance: addMonths(new Date(cayaReunions[0].dateReunion), 3),
        dateSolde: cayaReunions[2]?.dateReunion || new Date(),
        approuveParExerciceMembreId: tresorier.id,
        commentaire: 'Prêt pour frais de scolarité — soldé',
      })
    );
    refs.prets.push(pret2);
  }

  // Prêt 3 : DEMANDE (membre #7, en attente)
  const existingPret3 = await pretRepo.findOne({
    where: { exerciceMembreId: cayaMembres[7]?.id, statut: StatutPret.DEMANDE },
  });
  if (!existingPret3 && cayaMembres[7]) {
    const pret3 = await pretRepo.save(
      pretRepo.create({
        reunionId: cayaReunions[cayaReunions.length - 1].id,
        exerciceMembreId: cayaMembres[7].id,
        montantCapital: 200000,
        tauxInteret: 0.05,
        montantInteret: 0,
        montantTotalDu: 200000,
        dureeMois: 6,
        statut: StatutPret.DEMANDE,
        capitalRestant: 200000,
        commentaire: 'Demande de prêt pour commerce — en attente',
      })
    );
    refs.prets.push(pret3);
  }

  log(`✅ ${refs.prets.length} prêts`);
}

// ============================================================================
// STEP 13 : PÉNALITÉS
// ============================================================================

async function seedPenalites(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(Penalite);
  const txRepo = ds.getRepository(Transaction);
  let count = 0;

  const cayaMembres = refs.exerciceMembres.get('CAYA') || [];
  const cayaReunions = (refs.reunions.get('CAYA') || []).filter(
    (r) => r.statut === StatutReunion.CLOTUREE
  );
  const typeRetard = refs.typesPenalite.get('RETARD_REUNION');
  const typeAbsence = refs.typesPenalite.get('ABSENCE_REUNION');
  const tresorier = cayaMembres[1];

  if (!typeRetard || !typeAbsence || cayaMembres.length < 6 || cayaReunions.length < 2) {
    log('⏭️  Données insuffisantes pour créer des pénalités');
    return;
  }

  // Pénalité 1 : Retard — EN_ATTENTE
  const existingP = await repo.count();
  if (existingP > 0) {
    log(`✅ ${existingP} pénalités (existantes)`);
    return;
  }

  await repo.save(
    repo.create({
      exerciceMembreId: cayaMembres[4].id,
      reunionId: cayaReunions[0].id,
      typePenaliteId: typeRetard.id,
      montant: typeRetard.valeurDefaut || 500,
      motif: 'Arrivé 45 min en retard à la réunion #1',
      statut: StatutPenalite.EN_ATTENTE,
      appliqueParExerciceMembreId: tresorier.id,
    })
  );
  count++;

  // Pénalité 2 : Absence — PAYÉE
  const txPen = await txRepo.save(
    txRepo.create({
      reunionId: cayaReunions[1].id,
      typeTransaction: TypeTransaction.PENALITE,
      exerciceMembreId: cayaMembres[6].id,
      montant: typeAbsence.valeurDefaut || 1000,
      reference: generateRef(),
      description: 'Paiement pénalité absence',
      statut: StatutTransaction.VALIDE,
      modeCreation: ModeCreationTransaction.MANUEL,
      creeParExerciceMembreId: tresorier.id,
      soumisLe: new Date(),
      autoSoumis: true,
      valideLe: new Date(),
      valideParExerciceMembreId: tresorier.id,
    })
  );

  await repo.save(
    repo.create({
      exerciceMembreId: cayaMembres[6].id,
      reunionId: cayaReunions[1].id,
      typePenaliteId: typeAbsence.id,
      montant: typeAbsence.valeurDefaut || 1000,
      motif: 'Absent sans justification à la réunion #2',
      statut: StatutPenalite.PAYEE,
      appliqueParExerciceMembreId: tresorier.id,
      transactionId: txPen.id,
      datePaiement: new Date(),
    })
  );
  count++;

  // Pénalité 3 : Retard — PARDONNÉE
  await repo.save(
    repo.create({
      exerciceMembreId: cayaMembres[8]?.id || cayaMembres[3].id,
      reunionId: cayaReunions[2]?.id || cayaReunions[1].id,
      typePenaliteId: typeRetard.id,
      montant: typeRetard.valeurDefaut || 500,
      motif: 'Retard réunion #3 — pardonné car raison familiale urgente',
      statut: StatutPenalite.PARDONNEE,
      appliqueParExerciceMembreId: tresorier.id,
    })
  );
  count++;

  log(`✅ ${count} pénalités`);
}

// ============================================================================
// STEP 14 : ÉVÉNEMENTS SECOURS
// ============================================================================

async function seedSecours(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const evtRepo = ds.getRepository(EvenementSecours);
  const bilanRepo = ds.getRepository(BilanSecoursExercice);
  let count = 0;

  const cayaMembres = refs.exerciceMembres.get('CAYA') || [];
  const cayaExercice = refs.exercices.get('CAYA');
  const cayaReunions = (refs.reunions.get('CAYA') || []).filter(
    (r) => r.statut === StatutReunion.CLOTUREE
  );
  const typeNaissance = refs.typesSecours.get('NAISSANCE');
  const typeMaladie = refs.typesSecours.get('MALADIE');

  if (!typeNaissance || !typeMaladie || !cayaExercice || cayaMembres.length < 6) {
    log('⏭️  Données insuffisantes pour créer des événements secours');
    return;
  }

  const existingEvt = await evtRepo.count();
  if (existingEvt > 0) {
    log(`✅ ${existingEvt} événements secours (existants)`);
    return;
  }

  // Événement 1 : Naissance — VALIDE
  await evtRepo.save(
    evtRepo.create({
      exerciceMembreId: cayaMembres[2].id,
      typeEvenementSecoursId: typeNaissance.id,
      dateEvenement: new Date('2025-08-15'),
      description: 'Naissance du 3ème enfant',
      montantDemande: 50000,
      montantApprouve: 50000,
      statut: StatutEvenementSecours.VALIDE,
      valideParExerciceMembreId: cayaMembres[0].id,
      dateValidation: new Date('2025-08-20'),
      reunionId:
        cayaReunions.length > 3
          ? cayaReunions[3].id
          : cayaReunions[cayaReunions.length - 1]?.id || null,
    })
  );
  count++;

  // Événement 2 : Maladie — DECLARE (en attente)
  await evtRepo.save(
    evtRepo.create({
      exerciceMembreId: cayaMembres[5].id,
      typeEvenementSecoursId: typeMaladie.id,
      dateEvenement: new Date('2026-01-10'),
      description: "Hospitalisation d'urgence — appendicite",
      montantDemande: 75000,
      statut: StatutEvenementSecours.DECLARE,
    })
  );
  count++;

  // Bilan secours exercice CAYA
  const existingBilan = await bilanRepo.findOne({ where: { exerciceId: cayaExercice.id } });
  if (!existingBilan) {
    await bilanRepo.save(
      bilanRepo.create({
        exerciceId: cayaExercice.id,
        soldeInitial: 0,
        totalCotisations: MONTANTS.SECOURS_ANNUEL * cayaMembres.length,
        totalDepenses: 50000,
        soldeFinal: MONTANTS.SECOURS_ANNUEL * cayaMembres.length - 50000,
        nombreEvenements: 1,
      })
    );
  }

  log(`✅ ${count} événements secours + 1 bilan`);
}

// ============================================================================
// STEP 15 : DEMANDES D'ADHÉSION
// ============================================================================

async function seedDemandesAdhesion(
  ds: DataSource,
  refs: SeedRefs,
  log: (m: string) => void
): Promise<void> {
  const repo = ds.getRepository(DemandeAdhesion);
  const users = refs.utilisateurs;
  let count = 0;

  const existingCount = await repo.count();
  if (existingCount > 0) {
    log(`✅ ${existingCount} demandes d'adhésion (existantes)`);
    return;
  }

  const cayaTontine = refs.tontines.get('CAYA')!;
  const solidTontine = refs.tontines.get('SOLID-DLA')!;
  const cayaMembres = refs.exerciceMembres.get('CAYA') || [];

  // Demande 1 : APPROUVEE
  if (users[18]) {
    await repo.save(
      repo.create({
        utilisateurId: users[18].id,
        tontineId: cayaTontine.id,
        message: 'Bonjour, je souhaite rejoindre la Tontine CAYA. Je suis recommandé par M. OMGBA.',
        statut: StatutDemandeAdhesion.APPROUVEE,
        traiteeParExerciceMembreId: cayaMembres[0]?.id || null,
        traiteeLe: new Date(),
      })
    );
    count++;
  }

  // Demande 2 : SOUMISE (en attente)
  if (users[19]) {
    await repo.save(
      repo.create({
        utilisateurId: users[19].id,
        tontineId: solidTontine.id,
        message:
          "Bonsoir, je voudrais intégrer Solidarité Active de Douala pour l'exercice prochain.",
        statut: StatutDemandeAdhesion.SOUMISE,
      })
    );
    count++;
  }

  // Demande 3 : REFUSEE
  if (users[17]) {
    await repo.save(
      repo.create({
        utilisateurId: users[17].id,
        tontineId: cayaTontine.id,
        message: "Demande d'adhésion à CAYA.",
        statut: StatutDemandeAdhesion.REFUSEE,
        traiteeParExerciceMembreId: cayaMembres[0]?.id || null,
        traiteeLe: new Date(),
        motifRefus: 'Nombre maximum de membres atteint pour cet exercice.',
      })
    );
    count++;
  }

  log(`✅ ${count} demandes d'adhésion`);
}
