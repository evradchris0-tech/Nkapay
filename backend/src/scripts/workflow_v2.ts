/**
 * WORKFLOW COMPLET D'UN EXERCICE DE TONTINE
 * Simulation avec accès direct à la base de données via TypeORM
 *
 * Ce script simule un exercice complet avec 4 membres sur 4 réunions mensuelles
 * Version 2: Utilise les valeurs de rôles directement en string
 */

import { AppDataSource } from '../config/database.config';
import { v4 as uuidv4 } from 'uuid';

// Timestamp unique pour cette exécution
const TIMESTAMP = Date.now().toString().slice(-6);
const NOM_COURT_TONTINE = `TS${TIMESTAMP}`;

// Configuration de l'exercice
const CONFIG = {
  COTISATION_MENSUELLE: 10000, // FCFA - redistribuée au bénéficiaire du mois
  EPARGNE_MENSUELLE: 5000, // FCFA - gardée individuellement pour cassation
  POT_MENSUEL: 2000, // FCFA - dépensé pour les rafraîchissements
  SECOURS_ANNUEL: 10000, // FCFA - contribution annuelle au fonds de solidarité
  INSCRIPTION: 5000, // FCFA - frais d'inscription à l'exercice
  TAUX_INTERET_PRET: 5, // Pourcentage d'intérêt sur les prêts
  DUREE_EXERCICE: 4, // Nombre de mois/réunions
};

// Données des membres
const MEMBRES_DATA = [
  {
    nom: 'NKOULOU',
    prenom: 'Paul',
    tel: `69010${TIMESTAMP}1`,
    matricule: `${NOM_COURT_TONTINE}-001`,
    role: 'PRESIDENT',
  },
  {
    nom: 'MBARGA',
    prenom: 'Jeanne',
    tel: `69010${TIMESTAMP}2`,
    matricule: `${NOM_COURT_TONTINE}-002`,
    role: 'TRESORIER',
  },
  {
    nom: 'ATANGANA',
    prenom: 'Michel',
    tel: `69010${TIMESTAMP}3`,
    matricule: `${NOM_COURT_TONTINE}-003`,
    role: 'MEMBRE',
  },
  {
    nom: 'ESSOMBA',
    prenom: 'Sophie',
    tel: `69010${TIMESTAMP}4`,
    matricule: `${NOM_COURT_TONTINE}-004`,
    role: 'MEMBRE',
  },
];

function log(message: string) {
  console.log(message);
}

function separator(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`   ${title}`);
  console.log('═'.repeat(70) + '\n');
}

async function main() {
  // Connexion à la base de données
  await AppDataSource.initialize();
  log('✅ Connexion à la base de données établie');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1: CRÉATION DE LA TONTINE ET DES MEMBRES
    // ═══════════════════════════════════════════════════════════════════
    separator('📋 PHASE 1: CRÉATION DE LA TONTINE ET DES MEMBRES');

    // Récupérer le type de tontine STANDARD via requête SQL directe
    const [tontineType] = await queryRunner.query(
      `SELECT id FROM tontine_type WHERE code = 'STANDARD' LIMIT 1`
    );

    if (!tontineType) {
      throw new Error('Type de tontine STANDARD non trouvé');
    }

    // Créer la tontine
    const tontineId = uuidv4();
    await queryRunner.query(
      `
      INSERT INTO tontine (id, nom, nom_court, annee_fondation, motto, statut, tontine_type_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        tontineId,
        `Tontine Solidarité ${NOM_COURT_TONTINE}`,
        NOM_COURT_TONTINE,
        2026,
        'Ensemble pour réussir',
        'ACTIVE',
        tontineType.id,
      ]
    );
    log(`✅ Tontine créée: "Tontine Solidarité ${NOM_COURT_TONTINE}" (${NOM_COURT_TONTINE})`);

    // Créer les utilisateurs et leurs adhésions
    const utilisateurs: any[] = [];
    const adhesions: any[] = [];

    for (const membre of MEMBRES_DATA) {
      // Créer l'utilisateur
      const userId = uuidv4();
      await queryRunner.query(
        `
        INSERT INTO utilisateur (id, nom, prenom, telephone1, password_hash)
        VALUES (?, ?, ?, ?, ?)
      `,
        [userId, membre.nom, membre.prenom, membre.tel, '$2b$10$hashedpassword']
      );
      utilisateurs.push({ id: userId, ...membre });

      // Créer l'adhésion à la tontine
      const adhesionId = uuidv4();
      await queryRunner.query(
        `
        INSERT INTO adhesion_tontine (id, tontine_id, utilisateur_id, matricule, role, statut)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [adhesionId, tontineId, userId, membre.matricule, membre.role, 'ACTIVE']
      );
      adhesions.push({ id: adhesionId, oduserId: userId, ...membre });
      log(`   👤 ${membre.prenom} ${membre.nom} (${membre.matricule}) - ${membre.role}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: CRÉATION ET OUVERTURE DE L'EXERCICE
    // ═══════════════════════════════════════════════════════════════════
    separator("📋 PHASE 2: CRÉATION ET OUVERTURE DE L'EXERCICE");

    const exerciceId = uuidv4();
    const dateDebut = new Date('2026-02-01');
    const dateFin = new Date('2026-05-31');

    await queryRunner.query(
      `
      INSERT INTO exercice (id, tontine_id, nom, date_debut, date_fin, statut, ouvert_le)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [exerciceId, tontineId, 'Exercice 2026', dateDebut, dateFin, 'OUVERT', new Date()]
    );
    log(
      `✅ Exercice créé: "Exercice 2026" (${dateDebut.toLocaleDateString('fr-FR')} - ${dateFin.toLocaleDateString('fr-FR')})`
    );

    // Inscrire les membres à l'exercice
    const exerciceMembres: any[] = [];
    for (let i = 0; i < adhesions.length; i++) {
      const adhesion = adhesions[i];
      const emId = uuidv4();

      // Le premier membre (président) est aussi président de l'exercice
      const roleExercice = i === 0 ? 'PRESIDENT' : i === 1 ? 'TRESORIER' : 'MEMBRE';

      await queryRunner.query(
        `
        INSERT INTO exercice_membre (id, exercice_id, adhesion_tontine_id, numero_ordre, role, statut)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [emId, exerciceId, adhesion.id, i + 1, roleExercice, 'ACTIF']
      );
      exerciceMembres.push({
        id: emId,
        adhesionId: adhesion.id,
        ...adhesion,
        roleExercice,
        ordre: i + 1,
      });
      log(`   ✅ ${adhesion.prenom} inscrit à l'exercice (ordre: ${i + 1}, rôle: ${roleExercice})`);
    }

    // Créer les types de pénalités
    const typePenaliteAbsence = uuidv4();
    const typePenaliteRetard = uuidv4();

    await queryRunner.query(
      `
      INSERT INTO type_penalite (id, code, libelle, description, valeur_defaut)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        typePenaliteAbsence,
        'ABSENCE_WF',
        'Absence à la réunion',
        'Pénalité pour absence non justifiée',
        1000,
      ]
    );

    await queryRunner.query(
      `
      INSERT INTO type_penalite (id, code, libelle, description, valeur_defaut)
      VALUES (?, ?, ?, ?, ?)
    `,
      [typePenaliteRetard, 'RETARD_WF', 'Retard à la réunion', 'Pénalité pour retard', 500]
    );
    log(`✅ Types de pénalités créés`);

    // Créer le type d'événement secours
    const typeSecoursDeces = uuidv4();
    await queryRunner.query(
      `
      INSERT INTO type_evenement_secours (id, code, libelle, description, montant_par_defaut)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        typeSecoursDeces,
        'DECES_PARENT_WF',
        "Décès d'un parent",
        "Aide en cas de décès d'un parent proche",
        30000,
      ]
    );
    log(`✅ Types d'événements secours créés`);

    // ═══════════════════════════════════════════════════════════════════
    // SIMULATION DES 4 RÉUNIONS MENSUELLES
    // ═══════════════════════════════════════════════════════════════════

    const reunions: any[] = [];
    let caisseSecours = 0;
    let caissePrets = 0;
    const epargnesParMembre: { [key: string]: number } = {};
    let pretMichelId: string | null = null;

    // Initialiser les épargnes à 0
    for (const em of exerciceMembres) {
      epargnesParMembre[em.id] = 0;
    }

    for (let mois = 1; mois <= CONFIG.DUREE_EXERCICE; mois++) {
      separator(
        `📅 RÉUNION ${mois} - ${new Date(2026, mois, 15).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
      );

      const reunionId = uuidv4();
      const dateReunion = new Date(2026, mois, 15);

      // Créer la réunion
      await queryRunner.query(
        `
        INSERT INTO reunion (id, exercice_id, numero, date_reunion, heure_debut, lieu, statut, ouverte_le, cloturee_le, hote_exercice_membre_id, cloturee_par_exercice_membre_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          reunionId,
          exerciceId,
          mois,
          dateReunion,
          '14:00',
          mois % 2 === 0 ? 'Chez Paul' : 'Chez Jeanne',
          'CLOTUREE',
          dateReunion,
          dateReunion,
          exerciceMembres[mois % 4].id,
          exerciceMembres[0].id,
        ]
      );
      reunions.push({ id: reunionId, numero: mois, date: dateReunion });
      log(`📍 Réunion #${mois} créée - ${dateReunion.toLocaleDateString('fr-FR')}`);

      // Bénéficiaire du mois (rotation par ordre)
      const beneficiaire = exerciceMembres[mois - 1];
      log(`   🎯 Bénéficiaire du mois: ${beneficiaire.prenom} ${beneficiaire.nom}`);

      // --- COTISATIONS ---
      log(`\n   💰 COTISATIONS (${CONFIG.COTISATION_MENSUELLE.toLocaleString()} FCFA/membre):`);
      let totalCotisations = 0;

      for (const em of exerciceMembres) {
        const cotisationId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO cotisation_due_mensuelle (id, reunion_id, exercice_membre_id, montant_du, montant_paye, solde_restant, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            cotisationId,
            reunionId,
            em.id,
            CONFIG.COTISATION_MENSUELLE,
            CONFIG.COTISATION_MENSUELLE,
            0,
            'PAYE',
          ]
        );
        totalCotisations += CONFIG.COTISATION_MENSUELLE;
        log(`      ✓ ${em.prenom}: ${CONFIG.COTISATION_MENSUELLE.toLocaleString()} FCFA payé`);
      }

      // Distribution au bénéficiaire
      const distributionId = uuidv4();
      await queryRunner.query(
        `
        INSERT INTO distribution (id, reunion_id, exercice_membre_id, montant_brut, montant_net, statut, distribuee_le)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          distributionId,
          reunionId,
          beneficiaire.id,
          totalCotisations,
          totalCotisations,
          'DISTRIBUEE',
          dateReunion,
        ]
      );
      log(`   📤 Distribution à ${beneficiaire.prenom}: ${totalCotisations.toLocaleString()} FCFA`);

      // --- ÉPARGNES ---
      log(`\n   🏦 ÉPARGNES (${CONFIG.EPARGNE_MENSUELLE.toLocaleString()} FCFA/membre):`);

      for (const em of exerciceMembres) {
        const epargneId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO epargne_due_mensuelle (id, reunion_id, exercice_membre_id, montant_du, montant_paye, solde_restant, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            epargneId,
            reunionId,
            em.id,
            CONFIG.EPARGNE_MENSUELLE,
            CONFIG.EPARGNE_MENSUELLE,
            0,
            'PAYE',
          ]
        );
        epargnesParMembre[em.id] += CONFIG.EPARGNE_MENSUELLE;
        log(
          `      ✓ ${em.prenom}: ${CONFIG.EPARGNE_MENSUELLE.toLocaleString()} FCFA (total: ${epargnesParMembre[em.id].toLocaleString()} FCFA)`
        );
      }

      // --- POTS ---
      log(`\n   🍺 POT DU MENSUEL (${CONFIG.POT_MENSUEL.toLocaleString()} FCFA/membre):`);
      let totalPot = 0;

      for (const em of exerciceMembres) {
        const potId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO pot_du_mensuel (id, reunion_id, exercice_membre_id, montant_du, montant_paye, solde_restant, statut)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [potId, reunionId, em.id, CONFIG.POT_MENSUEL, CONFIG.POT_MENSUEL, 0, 'PAYE']
        );
        totalPot += CONFIG.POT_MENSUEL;
      }
      log(
        `      Total collecté: ${totalPot.toLocaleString()} FCFA (consommé pour rafraîchissements)`
      );

      // --- SECOURS (première réunion uniquement) ---
      if (mois === 1) {
        log(
          `\n   🆘 CONTRIBUTION SECOURS ANNUEL (${CONFIG.SECOURS_ANNUEL.toLocaleString()} FCFA/membre):`
        );
        for (const em of exerciceMembres) {
          const secoursId = uuidv4();
          await queryRunner.query(
            `
            INSERT INTO secours_du_annuel (id, exercice_membre_id, montant_du, montant_paye, solde_restant, statut)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
            [secoursId, em.id, CONFIG.SECOURS_ANNUEL, CONFIG.SECOURS_ANNUEL, 0, 'PAYE']
          );
          caisseSecours += CONFIG.SECOURS_ANNUEL;
          log(`      ✓ ${em.prenom}: ${CONFIG.SECOURS_ANNUEL.toLocaleString()} FCFA payé`);
        }
        log(`      💰 Caisse secours: ${caisseSecours.toLocaleString()} FCFA`);
      }

      // --- CAS SPÉCIAUX PAR RÉUNION ---

      // Réunion 2: Michel demande un prêt
      if (mois === 2) {
        log(`\n   📋 ÉVÉNEMENT SPÉCIAL: Demande de prêt`);
        const montantPret = 50000;
        pretMichelId = uuidv4();
        const michel = exerciceMembres.find((em) => em.prenom === 'Michel')!;
        const montantTotal = montantPret * (1 + CONFIG.TAUX_INTERET_PRET / 100);

        await queryRunner.query(
          `
          INSERT INTO pret (id, exercice_membre_id, montant_demande, montant_approuve, taux_interet, montant_interets, montant_total, montant_rembourse, solde_restant, statut, date_approbation, date_decaissement, date_echeance, approuve_par_exercice_membre_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            pretMichelId,
            michel.id,
            montantPret,
            montantPret,
            CONFIG.TAUX_INTERET_PRET,
            (montantPret * CONFIG.TAUX_INTERET_PRET) / 100,
            montantTotal,
            0,
            montantTotal,
            'APPROUVE',
            dateReunion,
            dateReunion,
            new Date(2026, 5, 15),
            exerciceMembres[0].id,
          ]
        );
        caissePrets -= montantPret;
        log(
          `      💸 Prêt accordé à Michel: ${montantPret.toLocaleString()} FCFA à ${CONFIG.TAUX_INTERET_PRET}%`
        );
        log(`      💰 À rembourser: ${montantTotal.toLocaleString()} FCFA`);
      }

      // Réunion 3: Événement secours pour Jeanne (décès parent)
      if (mois === 3) {
        log(`\n   📋 ÉVÉNEMENT SPÉCIAL: Demande de secours`);
        const jeanne = exerciceMembres.find((em) => em.prenom === 'Jeanne')!;
        const montantSecours = 30000;

        const evenementId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO evenement_secours (id, exercice_membre_id, type_evenement_secours_id, date_evenement, description, montant_demande, montant_approuve, statut, date_validation, valide_par_exercice_membre_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            evenementId,
            jeanne.id,
            typeSecoursDeces,
            new Date(2026, 3, 10),
            'Décès du père de Jeanne',
            montantSecours,
            montantSecours,
            'APPROUVE',
            dateReunion,
            exerciceMembres[0].id,
          ]
        );
        caisseSecours -= montantSecours;
        log(
          `      🕯️ Décès du père de Jeanne - Aide accordée: ${montantSecours.toLocaleString()} FCFA`
        );
        log(`      💰 Caisse secours restante: ${caisseSecours.toLocaleString()} FCFA`);
      }

      // Réunion 3: Pénalités (Sophie absente, Michel en retard)
      if (mois === 3) {
        log(`\n   📋 PÉNALITÉS:`);
        const sophie = exerciceMembres.find((em) => em.prenom === 'Sophie')!;
        const michel = exerciceMembres.find((em) => em.prenom === 'Michel')!;

        // Absence de Sophie
        const penaliteAbsenceId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO penalite (id, exercice_membre_id, type_penalite_id, reunion_id, montant, motif, statut, applique_le, applique_par_exercice_membre_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            penaliteAbsenceId,
            sophie.id,
            typePenaliteAbsence,
            reunionId,
            1000,
            'Absence non justifiée à la réunion #3',
            'EN_ATTENTE',
            dateReunion,
            exerciceMembres[0].id,
          ]
        );
        log(`      ⚠️ Sophie: Pénalité d'absence - 1,000 FCFA`);

        // Retard de Michel
        const penaliteRetardId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO penalite (id, exercice_membre_id, type_penalite_id, reunion_id, montant, motif, statut, applique_le, applique_par_exercice_membre_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            penaliteRetardId,
            michel.id,
            typePenaliteRetard,
            reunionId,
            500,
            'Retard de 45 minutes à la réunion #3',
            'EN_ATTENTE',
            dateReunion,
            exerciceMembres[0].id,
          ]
        );
        log(`      ⚠️ Michel: Pénalité de retard - 500 FCFA`);
      }

      // Réunion 4: Michel rembourse son prêt
      if (mois === 4 && pretMichelId) {
        log(`\n   📋 ÉVÉNEMENT SPÉCIAL: Remboursement de prêt`);
        const montantRemboursement = 52500; // 50000 + 5% intérêts

        const remboursementId = uuidv4();
        await queryRunner.query(
          `
          INSERT INTO remboursement_pret (id, pret_id, montant, date_remboursement, commentaire)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            remboursementId,
            pretMichelId,
            montantRemboursement,
            dateReunion,
            'Remboursement intégral',
          ]
        );

        await queryRunner.query(
          `
          UPDATE pret SET montant_rembourse = ?, solde_restant = 0, statut = 'REMBOURSE', date_solde = ?
          WHERE id = ?
        `,
          [montantRemboursement, dateReunion, pretMichelId]
        );

        caissePrets += montantRemboursement;
        log(`      ✅ Michel rembourse son prêt: ${montantRemboursement.toLocaleString()} FCFA`);
      }

      // Résumé de la réunion
      log(`\n   📊 RÉSUMÉ RÉUNION #${mois}:`);
      log(`      - Cotisations collectées: ${totalCotisations.toLocaleString()} FCFA`);
      log(`      - Épargnes collectées: ${(CONFIG.EPARGNE_MENSUELLE * 4).toLocaleString()} FCFA`);
      log(`      - Pot consommé: ${totalPot.toLocaleString()} FCFA`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 7: CASSATION - DISTRIBUTION DES ÉPARGNES
    // ═══════════════════════════════════════════════════════════════════
    separator('💰 PHASE 7: CASSATION - DISTRIBUTION DES ÉPARGNES');

    log(`Distribution de l'épargne accumulée à chaque membre:\n`);

    for (const em of exerciceMembres) {
      const montantEpargne = epargnesParMembre[em.id];
      const cassationId = uuidv4();

      await queryRunner.query(
        `
        INSERT INTO cassation (id, exercice_membre_id, montant_brut, montant_net, statut, distribuee_le, commentaire)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          cassationId,
          em.id,
          montantEpargne,
          montantEpargne,
          'DISTRIBUEE',
          new Date(),
          "Cassation fin d'exercice 2026",
        ]
      );

      log(`   💵 ${em.prenom} ${em.nom}: ${montantEpargne.toLocaleString()} FCFA`);
    }

    // Fermer l'exercice
    await queryRunner.query(
      `
      UPDATE exercice SET statut = 'FERME', ferme_le = ? WHERE id = ?
    `,
      [new Date(), exerciceId]
    );

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 8: BILAN FINAL DE L'EXERCICE
    // ═══════════════════════════════════════════════════════════════════
    separator("📊 BILAN FINAL DE L'EXERCICE 2026");

    const totalCotisationsAnnee = CONFIG.COTISATION_MENSUELLE * 4 * 4;
    const totalEpargnesAnnee = CONFIG.EPARGNE_MENSUELLE * 4 * 4;
    const totalPotsAnnee = CONFIG.POT_MENSUEL * 4 * 4;
    const totalSecoursCollecte = CONFIG.SECOURS_ANNUEL * 4;

    log(`📈 FLUX FINANCIERS DE L'EXERCICE:\n`);
    log(`   COTISATIONS:`);
    log(`      - Total collecté: ${totalCotisationsAnnee.toLocaleString()} FCFA`);
    log(`      - Total distribué: ${totalCotisationsAnnee.toLocaleString()} FCFA`);
    log(`      - Chaque membre a reçu: ${(totalCotisationsAnnee / 4).toLocaleString()} FCFA`);

    log(`\n   ÉPARGNES:`);
    log(`      - Total collecté: ${totalEpargnesAnnee.toLocaleString()} FCFA`);
    log(`      - Total cassation: ${totalEpargnesAnnee.toLocaleString()} FCFA`);
    log(`      - Chaque membre récupère: ${(totalEpargnesAnnee / 4).toLocaleString()} FCFA`);

    log(`\n   POTS:`);
    log(`      - Total collecté: ${totalPotsAnnee.toLocaleString()} FCFA`);
    log(`      - Total consommé: ${totalPotsAnnee.toLocaleString()} FCFA (rafraîchissements)`);

    log(`\n   SECOURS:`);
    log(`      - Total collecté: ${totalSecoursCollecte.toLocaleString()} FCFA`);
    log(`      - Total versé: 30,000 FCFA (décès père Jeanne)`);
    log(`      - Solde caisse secours: ${caisseSecours.toLocaleString()} FCFA`);

    log(`\n   PRÊTS:`);
    log(`      - Prêt accordé: 50,000 FCFA (Michel)`);
    log(`      - Intérêts perçus: 2,500 FCFA`);
    log(`      - Statut: Remboursé intégralement`);

    log(`\n   PÉNALITÉS:`);
    log(`      - Sophie (absence): 1,000 FCFA`);
    log(`      - Michel (retard): 500 FCFA`);
    log(`      - Total pénalités: 1,500 FCFA`);

    log(`\n` + '═'.repeat(70));
    log(`   ✅ EXERCICE TERMINÉ AVEC SUCCÈS`);
    log('═'.repeat(70));
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

main().catch(console.error);
