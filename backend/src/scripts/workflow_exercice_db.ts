/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIMULATION COMPLÈTE D'UN EXERCICE DE TONTINE - NKAPAY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Utilise directement TypeORM pour simuler un exercice complet
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database.config';
import { Tontine } from '../modules/tontines/entities/tontine.entity';
import { TontineType } from '../modules/tontines/entities/tontine-type.entity';
import { Utilisateur } from '../modules/utilisateurs/entities/utilisateur.entity';
import { AdhesionTontine, RoleTontine } from '../modules/tontines/entities/adhesion-tontine.entity';
import { Exercice, StatutExercice } from '../modules/exercices/entities/exercice.entity';
import { ExerciceMembre, TypeMembre, StatutExerciceMembre } from '../modules/exercices/entities/exercice-membre.entity';
import { Reunion, StatutReunion } from '../modules/reunions/entities/reunion.entity';
import { PresenceReunion } from '../modules/reunions/entities/presence-reunion.entity';
import { CotisationDueMensuelle } from '../modules/transactions/entities/cotisation-due-mensuelle.entity';
import { PotDuMensuel } from '../modules/transactions/entities/pot-du-mensuel.entity';
import { Distribution, StatutDistribution } from '../modules/distributions/entities/distribution.entity';
import { Pret, StatutPret } from '../modules/prets/entities/pret.entity';
import { RemboursementPret } from '../modules/prets/entities/remboursement-pret.entity';
import { TypeEvenementSecours } from '../modules/secours/entities/type-evenement-secours.entity';
import { EvenementSecours, StatutEvenementSecours } from '../modules/secours/entities/evenement-secours.entity';
import { Penalite, StatutPenalite } from '../modules/penalites/entities/penalite.entity';
import { StatutDu } from '../modules/transactions/entities/inscription-due-exercice.entity';
import { Cassation, StatutCassation } from '../modules/exercices/entities/cassation.entity';
import * as bcrypt from 'bcrypt';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  COTISATION_MENSUELLE: 10000,
  EPARGNE_MENSUELLE: 5000,
  POT_MENSUEL: 2000,
  SECOURS_ANNUEL: 10000,
  INSCRIPTION: 5000,
  TAUX_INTERET_PRET: 5,
  DUREE_EXERCICE: 4,
};

// Couleurs console
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color: string, emoji: string, msg: string) {
  console.log(`${color}${emoji} ${msg}${C.reset}`);
}

function section(title: string) {
  console.log('\n' + C.bright + '═'.repeat(70) + C.reset);
  console.log(C.bright + C.cyan + `   ${title}` + C.reset);
  console.log(C.bright + '═'.repeat(70) + C.reset + '\n');
}

function subsection(title: string) {
  console.log('\n' + C.yellow + `   ─── ${title} ───` + C.reset + '\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
${C.bright}${C.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ██╗██╗  ██╗ █████╗ ██████╗  █████╗ ██╗   ██╗                        ║
║   ████╗  ██║██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝                        ║
║   ██╔██╗ ██║█████╔╝ ███████║██████╔╝███████║ ╚████╔╝                         ║
║   ██║╚██╗██║██╔═██╗ ██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝                          ║
║   ██║ ╚████║██║  ██╗██║  ██║██║     ██║  ██║   ██║                           ║
║   ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝                           ║
║                                                                              ║
║            SIMULATION D'UN EXERCICE COMPLET DE TONTINE                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
${C.reset}`);

  // Connexion à la base
  await AppDataSource.initialize();
  log(C.green, '✅', 'Connexion à la base de données établie');

  const userRepo = AppDataSource.getRepository(Utilisateur);
  const tontineRepo = AppDataSource.getRepository(Tontine);
  const tontineTypeRepo = AppDataSource.getRepository(TontineType);
  const adhesionRepo = AppDataSource.getRepository(AdhesionTontine);
  const exerciceRepo = AppDataSource.getRepository(Exercice);
  const exerciceMembreRepo = AppDataSource.getRepository(ExerciceMembre);
  const reunionRepo = AppDataSource.getRepository(Reunion);
  const presenceRepo = AppDataSource.getRepository(PresenceReunion);
  const cotisationRepo = AppDataSource.getRepository(CotisationDueMensuelle);
  const potRepo = AppDataSource.getRepository(PotDuMensuel);
  const distributionRepo = AppDataSource.getRepository(Distribution);
  const pretRepo = AppDataSource.getRepository(Pret);
  const remboursementRepo = AppDataSource.getRepository(RemboursementPret);
  const typeSecoursRepo = AppDataSource.getRepository(TypeEvenementSecours);
  const evenementSecoursRepo = AppDataSource.getRepository(EvenementSecours);
  const penaliteRepo = AppDataSource.getRepository(Penalite);
  const cassationRepo = AppDataSource.getRepository(Cassation);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: CRÉATION DE LA TONTINE ET DES MEMBRES
  // ═══════════════════════════════════════════════════════════════════════
  section('📋 PHASE 1: CRÉATION DE LA TONTINE ET DES MEMBRES');

  // Type de tontine
  let tontineType = await tontineTypeRepo.findOne({ where: { code: 'STANDARD' } });
  if (!tontineType) {
    tontineType = tontineTypeRepo.create({
      code: 'STANDARD',
      libelle: 'Tontine Standard',
      description: 'Tontine avec fonctionnalités standard'
    });
    await tontineTypeRepo.save(tontineType);
  }

  // Créer la tontine
  const tontine = tontineRepo.create({
    nom: 'Tontine Solidarité 2026',
    nomCourt: 'TS26',
    anneeFondation: 2026,
    motto: 'Ensemble pour réussir',
    tontineType,
    statut: 'ACTIVE'
  });
  await tontineRepo.save(tontine);
  log(C.green, '✅', `Tontine créée: "${tontine.nom}" (${tontine.nomCourt})`);

  // Créer les 4 membres
  const membresData = [
    { prenom: 'Paul', nom: 'KAMGA', email: 'paul.kamga@ts26.cm', telephone: '+237690111111', role: RoleTontine.PRESIDENT },
    { prenom: 'Jeanne', nom: 'FOTSO', email: 'jeanne.fotso@ts26.cm', telephone: '+237690222222', role: RoleTontine.TRESORIER },
    { prenom: 'Michel', nom: 'TAGNE', email: 'michel.tagne@ts26.cm', telephone: '+237690333333', role: RoleTontine.MEMBRE },
    { prenom: 'Sophie', nom: 'NGOUE', email: 'sophie.ngoue@ts26.cm', telephone: '+237690444444', role: RoleTontine.MEMBRE },
  ];

  subsection('Création des utilisateurs et adhésions');
  const membres: { user: Utilisateur; adhesion: AdhesionTontine; exerciceMembre?: ExerciceMembre; epargne: number }[] = [];

  for (const m of membresData) {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = userRepo.create({
      prenom: m.prenom,
      nom: m.nom,
      email: m.email,
      telephone: m.telephone,
      motDePasseHash: hashedPassword,
      dateNaissance: new Date('1985-05-15'),
      estActif: true
    });
    await userRepo.save(user);

    const adhesion = adhesionRepo.create({
      tontine,
      utilisateur: user,
      role: m.role,
      dateAdhesion: new Date('2026-01-15'),
      estActif: true
    });
    await adhesionRepo.save(adhesion);

    membres.push({ user, adhesion, epargne: 0 });
    log(C.green, '👤', `${m.prenom} ${m.nom} - ${m.role}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: OUVERTURE DE L'EXERCICE
  // ═══════════════════════════════════════════════════════════════════════
  section('📅 PHASE 2: OUVERTURE DE L\'EXERCICE 2026');

  const exercice = exerciceRepo.create({
    tontine,
    libelle: 'Exercice 2026',
    anneeDebut: 2026,
    moisDebut: 2,
    anneeFin: 2026,
    moisFin: 5,
    dureeMois: CONFIG.DUREE_EXERCICE,
    statut: StatutExercice.BROUILLON
  });
  await exerciceRepo.save(exercice);
  log(C.green, '✅', `Exercice créé: ${exercice.libelle}`);

  // Inscrire les membres à l'exercice
  subsection('Inscription des membres à l\'exercice');
  for (const m of membres) {
    const em = exerciceMembreRepo.create({
      exercice,
      adhesionTontine: m.adhesion,
      typeMembre: TypeMembre.NOUVEAU,
      moisEntree: 1,
      dateEntreeExercice: new Date('2026-02-01'),
      nombreParts: 1,
      statut: StatutExerciceMembre.ACTIF
    });
    await exerciceMembreRepo.save(em);
    m.exerciceMembre = em;
    log(C.green, '✓', `${m.user.prenom} ${m.user.nom} inscrit à l'exercice`);
  }

  // Ouvrir l'exercice
  exercice.statut = StatutExercice.OUVERT;
  exercice.ouvertLe = new Date();
  await exerciceRepo.save(exercice);
  log(C.green, '🚀', 'Exercice ouvert!');

  // Créer les types d'événements de secours s'ils n'existent pas
  let typeDecesParent = await typeSecoursRepo.findOne({ where: { code: 'DECES_PARENT' } });
  if (!typeDecesParent) {
    typeDecesParent = typeSecoursRepo.create({
      code: 'DECES_PARENT',
      libelle: 'Décès d\'un parent',
      description: 'Décès du père ou de la mère du membre',
      montantParDefaut: 30000,
      estActif: true
    });
    await typeSecoursRepo.save(typeDecesParent);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASES 3-6: LES 4 RÉUNIONS MENSUELLES
  // ═══════════════════════════════════════════════════════════════════════
  
  const mois = ['', 'Février', 'Mars', 'Avril', 'Mai'];
  const dates = ['', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15'];
  let pretMichel: Pret | null = null;

  for (let numReunion = 1; numReunion <= CONFIG.DUREE_EXERCICE; numReunion++) {
    section(`📍 RÉUNION ${numReunion} - ${mois[numReunion]} 2026`);

    // 1. Créer la réunion
    const reunion = reunionRepo.create({
      exercice,
      ordre: numReunion,
      dateReunion: new Date(dates[numReunion]),
      heureDebut: '15:00',
      lieu: 'Domicile de Paul KAMGA',
      adresse: 'Yaoundé, Quartier Bastos',
      statut: StatutReunion.PLANIFIEE
    });
    await reunionRepo.save(reunion);
    log(C.green, '📅', `Réunion planifiée pour le ${dates[numReunion]}`);

    // Ouvrir la réunion
    reunion.statut = StatutReunion.OUVERTE;
    await reunionRepo.save(reunion);
    log(C.green, '🔓', 'Réunion ouverte');

    // 2. Enregistrer les présences
    subsection('Présences');
    for (const m of membres) {
      // Sophie absente à la réunion 2
      const estPresent = !(numReunion === 2 && m.user.prenom === 'Sophie');
      
      const presence = presenceRepo.create({
        reunion,
        exerciceMembre: m.exerciceMembre!,
        estPresent,
        motifAbsence: estPresent ? null : 'Voyage professionnel'
      });
      await presenceRepo.save(presence);
      
      const status = estPresent ? `${C.green}✓ Présent${C.reset}` : `${C.red}✗ Absent${C.reset}`;
      console.log(`      ${m.user.prenom} ${m.user.nom}: ${status}`);
    }

    // 3. Cotisations
    subsection('Cotisations (10 000 FCFA/membre)');
    let totalCotisations = 0;
    for (const m of membres) {
      // Michel en retard à la réunion 3
      const paye = !(numReunion === 3 && m.user.prenom === 'Michel');
      
      const cotisation = cotisationRepo.create({
        reunion,
        exerciceMembre: m.exerciceMembre!,
        montantDu: CONFIG.COTISATION_MENSUELLE,
        montantPaye: paye ? CONFIG.COTISATION_MENSUELLE : 0,
        soldeRestant: paye ? 0 : CONFIG.COTISATION_MENSUELLE,
        statut: paye ? StatutDu.A_JOUR : StatutDu.EN_RETARD
      });
      await cotisationRepo.save(cotisation);
      
      if (paye) {
        totalCotisations += CONFIG.COTISATION_MENSUELLE;
        log(C.green, '💵', `${m.user.prenom}: ${CONFIG.COTISATION_MENSUELLE.toLocaleString()} FCFA ✓`);
      } else {
        log(C.red, '⚠️', `${m.user.prenom}: EN RETARD`);
      }
    }
    log(C.cyan, '📊', `Total cotisations: ${totalCotisations.toLocaleString()} FCFA`);

    // 4. Épargnes
    subsection('Épargnes (5 000 FCFA/membre)');
    let totalEpargnes = 0;
    for (const m of membres) {
      m.epargne += CONFIG.EPARGNE_MENSUELLE;
      totalEpargnes += CONFIG.EPARGNE_MENSUELLE;
      log(C.green, '🏦', `${m.user.prenom}: ${CONFIG.EPARGNE_MENSUELLE.toLocaleString()} FCFA (cumul: ${m.epargne.toLocaleString()} FCFA)`);
    }
    log(C.cyan, '📊', `Total épargnes du mois: ${totalEpargnes.toLocaleString()} FCFA`);

    // 5. Pot
    subsection('Pot (2 000 FCFA/membre) → Collation');
    let totalPot = 0;
    for (const m of membres) {
      const pot = potRepo.create({
        reunion,
        exerciceMembre: m.exerciceMembre!,
        montantDu: CONFIG.POT_MENSUEL,
        montantPaye: CONFIG.POT_MENSUEL,
        soldeRestant: 0,
        statut: StatutDu.A_JOUR
      });
      await potRepo.save(pot);
      totalPot += CONFIG.POT_MENSUEL;
    }
    log(C.yellow, '🍕', `Total pot: ${totalPot.toLocaleString()} FCFA → Dépensé pour la collation`);

    // 6. Distribution au bénéficiaire
    subsection('Distribution des cotisations');
    const beneficiaire = membres[numReunion - 1];
    
    const distribution = distributionRepo.create({
      reunion,
      exerciceMembreBeneficiaire: beneficiaire.exerciceMembre!,
      ordre: numReunion,
      montantBrut: totalCotisations,
      montantRetenu: 0,
      montantNet: totalCotisations,
      statut: StatutDistribution.DISTRIBUEE,
      distribueeLe: new Date()
    });
    await distributionRepo.save(distribution);
    log(C.magenta, '🎉', `${beneficiaire.user.prenom} ${beneficiaire.user.nom} reçoit ${totalCotisations.toLocaleString()} FCFA!`);

    // ─── ÉVÉNEMENTS SPÉCIAUX ───

    // Réunion 2: Prêt à Michel + Pénalité Sophie
    if (numReunion === 2) {
      subsection('💰 Demande de Prêt');
      const michel = membres.find(m => m.user.prenom === 'Michel')!;
      
      log(C.yellow, '📝', 'Michel demande un prêt de 50 000 FCFA pour une urgence familiale');
      
      pretMichel = pretRepo.create({
        exerciceMembre: michel.exerciceMembre!,
        montant: 50000,
        tauxInteret: CONFIG.TAUX_INTERET_PRET,
        montantInterets: 2500,
        montantTotal: 52500,
        soldeRestant: 52500,
        motif: 'Urgence familiale - frais médicaux',
        dureeRemboursementMois: 3,
        statut: StatutPret.DECAISSE,
        approuveLe: new Date(),
        decaisseLe: new Date()
      });
      await pretRepo.save(pretMichel);
      
      log(C.green, '✅', 'Prêt approuvé et décaissé');
      log(C.green, '💵', 'Montant: 50 000 FCFA');
      log(C.blue, '📈', `Intérêts (${CONFIG.TAUX_INTERET_PRET}%): 2 500 FCFA`);
      log(C.cyan, '💳', 'Total à rembourser: 52 500 FCFA');

      // Pénalité Sophie (absence)
      subsection('⚠️ Pénalités');
      const sophie = membres.find(m => m.user.prenom === 'Sophie')!;
      
      const penalite = penaliteRepo.create({
        exerciceMembre: sophie.exerciceMembre!,
        reunion,
        motif: 'Absence non justifiée à la réunion',
        montant: 1000,
        statut: StatutPenalite.APPLIQUEE
      });
      await penaliteRepo.save(penalite);
      log(C.red, '📛', 'Sophie: Pénalité de 1 000 FCFA pour absence');
    }

    // Réunion 3: Secours Jeanne + Remboursement Michel + Pénalité Michel
    if (numReunion === 3) {
      subsection('🆘 Événement de Secours');
      const jeanne = membres.find(m => m.user.prenom === 'Jeanne')!;
      const paul = membres.find(m => m.user.prenom === 'Paul')!;
      
      log(C.red, '💔', 'Décès du père de Jeanne FOTSO');
      
      const evenement = evenementSecoursRepo.create({
        exerciceMembre: jeanne.exerciceMembre!,
        typeEvenementSecours: typeDecesParent!,
        dateEvenement: new Date('2026-04-10'),
        description: 'Décès du père de Jeanne survenu le 10 avril 2026',
        montantDemande: 30000,
        montantApprouve: 30000,
        statut: StatutEvenementSecours.PAYE,
        dateValidation: new Date(),
        valideParExerciceMembre: paul.exerciceMembre!
      });
      await evenementSecoursRepo.save(evenement);
      
      log(C.green, '✅', 'Événement validé par le Président');
      log(C.green, '💵', 'Jeanne reçoit 30 000 FCFA du fonds de secours');

      // Remboursement partiel prêt Michel
      if (pretMichel) {
        subsection('💳 Remboursement de Prêt');
        const remboursement = remboursementRepo.create({
          pret: pretMichel,
          montant: 20000,
          commentaire: 'Remboursement partiel - 1ère échéance'
        });
        await remboursementRepo.save(remboursement);
        
        pretMichel.soldeRestant -= 20000;
        await pretRepo.save(pretMichel);
        
        log(C.green, '💵', 'Michel rembourse 20 000 FCFA');
        log(C.blue, '📊', `Solde restant: ${pretMichel.soldeRestant.toLocaleString()} FCFA`);
      }

      // Pénalité Michel (retard cotisation)
      const michel = membres.find(m => m.user.prenom === 'Michel')!;
      const penalite = penaliteRepo.create({
        exerciceMembre: michel.exerciceMembre!,
        reunion,
        motif: 'Cotisation payée en retard',
        montant: 500,
        statut: StatutPenalite.APPLIQUEE
      });
      await penaliteRepo.save(penalite);
      log(C.red, '📛', 'Michel: Pénalité de 500 FCFA pour retard');
    }

    // Réunion 4: Solde du prêt avant cassation
    if (numReunion === 4 && pretMichel) {
      subsection('💳 Solde du Prêt');
      
      const remboursement = remboursementRepo.create({
        pret: pretMichel,
        montant: pretMichel.soldeRestant,
        commentaire: 'Remboursement final avant cassation'
      });
      await remboursementRepo.save(remboursement);
      
      log(C.green, '✅', `Michel solde son prêt: ${pretMichel.soldeRestant.toLocaleString()} FCFA`);
      pretMichel.soldeRestant = 0;
      pretMichel.statut = StatutPret.REMBOURSE;
      await pretRepo.save(pretMichel);
    }

    // Clôturer la réunion
    reunion.statut = StatutReunion.CLOTUREE;
    await reunionRepo.save(reunion);
    log(C.green, '🔒', 'Réunion clôturée');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 7: CASSATION
  // ═══════════════════════════════════════════════════════════════════════
  section('🏁 CASSATION - FIN D\'EXERCICE');

  log(C.yellow, '📋', 'Distribution des épargnes à chaque membre:');
  console.log('');

  let totalCassation = 0;
  for (const m of membres) {
    const cassation = cassationRepo.create({
      exercice,
      exerciceMembre: m.exerciceMembre!,
      nombreParts: 1,
      montantBrut: m.epargne,
      deductions: 0,
      montantNet: m.epargne,
      statut: StatutCassation.DISTRIBUEE,
      distribueeLe: new Date()
    });
    await cassationRepo.save(cassation);

    totalCassation += m.epargne;

    console.log(`   ${C.cyan}┌─────────────────────────────────────────┐${C.reset}`);
    console.log(`   ${C.cyan}│${C.reset} ${C.bright}${m.user.prenom} ${m.user.nom}${C.reset}`);
    console.log(`   ${C.cyan}│${C.reset} Épargne accumulée: ${C.green}${m.epargne.toLocaleString()} FCFA${C.reset}`);
    console.log(`   ${C.cyan}│${C.reset} ${C.bright}MONTANT RESTITUÉ: ${C.magenta}${m.epargne.toLocaleString()} FCFA${C.reset}`);
    console.log(`   ${C.cyan}└─────────────────────────────────────────┘${C.reset}`);
    console.log('');
  }

  log(C.magenta, '💰', `TOTAL CASSATION: ${totalCassation.toLocaleString()} FCFA`);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 8: BILAN FINAL
  // ═══════════════════════════════════════════════════════════════════════
  section('📊 BILAN FINAL DE L\'EXERCICE');

  console.log(`
${C.bright}┌──────────────────────────────────────────────────────────────────────┐${C.reset}
${C.bright}│                    RÉSUMÉ FINANCIER - EXERCICE 2026                  │${C.reset}
${C.bright}├──────────────────────────────────────────────────────────────────────┤${C.reset}

   ${C.cyan}DISTRIBUTIONS MENSUELLES (Cotisations):${C.reset}
   ─────────────────────────────────────────
   • Réunion 1 → Paul KAMGA:    40 000 FCFA
   • Réunion 2 → Jeanne FOTSO:  40 000 FCFA
   • Réunion 3 → Michel TAGNE:  30 000 FCFA (1 absent)
   • Réunion 4 → Sophie NGOUE:  40 000 FCFA
   ${C.green}─────────────────────────────────────────${C.reset}
   ${C.green}Total distribué:               150 000 FCFA${C.reset}

   ${C.cyan}ÉPARGNES RESTITUÉES (Cassation):${C.reset}
   ─────────────────────────────────────────
   • Paul KAMGA:   4 × 5 000 = 20 000 FCFA
   • Jeanne FOTSO: 4 × 5 000 = 20 000 FCFA
   • Michel TAGNE: 4 × 5 000 = 20 000 FCFA
   • Sophie NGOUE: 4 × 5 000 = 20 000 FCFA
   ${C.green}─────────────────────────────────────────${C.reset}
   ${C.green}Total restitué:                 80 000 FCFA${C.reset}

   ${C.cyan}POT (Dépenses collation):${C.reset}
   ─────────────────────────────────────────
   • 4 réunions × 4 membres × 2 000 FCFA
   ${C.yellow}Total dépensé:                  32 000 FCFA${C.reset}

   ${C.cyan}SECOURS VERSÉ:${C.reset}
   ─────────────────────────────────────────
   • Jeanne FOTSO (décès parent): 30 000 FCFA
   ${C.red}Total secours:                  30 000 FCFA${C.reset}

   ${C.cyan}PRÊTS:${C.reset}
   ─────────────────────────────────────────
   • Michel TAGNE: 50 000 FCFA (✓ remboursé avec 2 500 FCFA d'intérêts)
   ${C.blue}Intérêts collectés:              2 500 FCFA${C.reset}

   ${C.cyan}PÉNALITÉS:${C.reset}
   ─────────────────────────────────────────
   • Sophie (absence):     1 000 FCFA
   • Michel (retard):        500 FCFA
   ${C.red}Total pénalités:                 1 500 FCFA${C.reset}

${C.bright}├──────────────────────────────────────────────────────────────────────┤${C.reset}
${C.bright}│                      BILAN PAR MEMBRE                                │${C.reset}
${C.bright}├──────────────────────────────────────────────────────────────────────┤${C.reset}

   ${C.bright}Membre          Cotisé    Épargné    Reçu Dist.  Cassation   Solde${C.reset}
   ────────────────────────────────────────────────────────────────────
   Paul KAMGA      40 000    20 000     40 000     20 000    ${C.green}+40 000${C.reset}
   Jeanne FOTSO    40 000    20 000     40 000     20 000    ${C.green}+40 000${C.reset} ${C.blue}(+30k secours)${C.reset}
   Michel TAGNE    40 000    20 000     30 000     20 000    ${C.green}+30 000${C.reset}
   Sophie NGOUE    40 000    20 000     40 000     20 000    ${C.green}+40 000${C.reset}

${C.bright}└──────────────────────────────────────────────────────────────────────┘${C.reset}
`);

  // Fermer l'exercice
  exercice.statut = StatutExercice.FERME;
  exercice.fermeLe = new Date();
  await exerciceRepo.save(exercice);

  console.log(`
${C.green}${C.bright}
   ✅ SIMULATION TERMINÉE AVEC SUCCÈS!
   
   L'exercice 2026 de la Tontine Solidarité est clôturé.
   Tous les membres ont récupéré leur épargne.
   
   Points clés simulés:
   • 4 réunions mensuelles avec cotisations et distributions
   • 1 prêt accordé et remboursé avec intérêts
   • 1 événement de secours (décès parent)
   • 2 pénalités appliquées
   • Cassation finale avec restitution des épargnes
${C.reset}`);

  await AppDataSource.destroy();
}

main().catch(console.error);
