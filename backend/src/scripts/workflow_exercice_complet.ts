/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIMULATION COMPLÈTE D'UN EXERCICE DE TONTINE - NKAPAY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ce script simule un exercice complet de 4 mois avec:
 * - 4 membres avec différents profils
 * - Cotisations, épargnes, pots mensuels
 * - 1 distribution par mois (bénéficiaire tournant)
 * - 1 prêt avec remboursements
 * - 1 événement de secours (décès parent)
 * - Des pénalités pour retard
 * - Cassation finale avec retour des épargnes
 */

const BASE_URL = 'http://localhost:3000/api/v1';

// Configuration de l'exercice
const CONFIG = {
  COTISATION_MENSUELLE: 10000,  // 10 000 FCFA par membre
  EPARGNE_MENSUELLE: 5000,      // 5 000 FCFA par membre
  POT_MENSUEL: 2000,            // 2 000 FCFA par membre
  SECOURS_ANNUEL: 10000,        // 10 000 FCFA par an
  INSCRIPTION: 5000,            // 5 000 FCFA une fois
  TAUX_INTERET_PRET: 5,         // 5%
  DUREE_EXERCICE: 4,            // 4 mois (pour la démo)
};

// Couleurs pour la console
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color: string, emoji: string, message: string) {
  console.log(`${color}${emoji} ${message}${COLORS.reset}`);
}

function section(title: string) {
  console.log('\n' + COLORS.bright + '═'.repeat(70) + COLORS.reset);
  console.log(COLORS.bright + COLORS.cyan + `   ${title}` + COLORS.reset);
  console.log(COLORS.bright + '═'.repeat(70) + COLORS.reset + '\n');
}

function subsection(title: string) {
  console.log('\n' + COLORS.yellow + '   ─── ' + title + ' ───' + COLORS.reset + '\n');
}

async function api(method: string, endpoint: string, data?: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    const result = await response.json() as any;
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
    return result.data || result;
  } catch (error: any) {
    console.error(`${COLORS.red}❌ ${method} ${endpoint}: ${error.message}${COLORS.reset}`);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DE SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

interface SimulationState {
  tontineId: string;
  exerciceId: string;
  membres: {
    id: string;
    exerciceMembreId: string;
    nom: string;
    prenom: string;
    role: string;
    adhesionId: string;
  }[];
  reunions: { id: string; ordre: number; date: string }[];
  distributions: { reunionId: string; beneficiaireId: string; montant: number }[];
  prets: { id: string; emprunteurId: string; montant: number; solde: number }[];
  evenementsSecours: { id: string; membreId: string; type: string; montant: number }[];
  epargnes: { membreId: string; total: number }[];
}

const state: SimulationState = {
  tontineId: '',
  exerciceId: '',
  membres: [],
  reunions: [],
  distributions: [],
  prets: [],
  evenementsSecours: [],
  epargnes: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS DE SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

async function creerTontineEtMembres() {
  section('📋 PHASE 1: CRÉATION DE LA TONTINE ET DES MEMBRES');

  // Récupérer le type de tontine
  const types = await api('GET', '/tontine-types');
  const typeStandard = types?.find((t: any) => t.code === 'STANDARD') || types?.[0];
  
  if (!typeStandard) {
    log(COLORS.red, '❌', 'Aucun type de tontine trouvé');
    return false;
  }

  // Créer la tontine
  const tontine = await api('POST', '/tontines', {
    nom: 'Tontine Solidarité 2026',
    nomCourt: 'TS26',
    description: 'Tontine de solidarité et d\'entraide pour l\'année 2026',
    tontineTypeId: typeStandard.id,
    devise: 'XAF',
    periodicite: 'MENSUELLE',
    joursReunion: [15], // 15 de chaque mois
    cotisationMinimale: CONFIG.COTISATION_MENSUELLE,
    maxMembres: 12
  });

  if (!tontine) return false;
  state.tontineId = tontine.id;
  log(COLORS.green, '✅', `Tontine créée: "${tontine.nom}" (${tontine.nomCourt})`);

  // Créer les 4 membres
  const membresData = [
    { prenom: 'Paul', nom: 'KAMGA', email: 'paul.kamga@email.cm', telephone: '+237690001111', role: 'PRESIDENT' },
    { prenom: 'Jeanne', nom: 'FOTSO', email: 'jeanne.fotso@email.cm', telephone: '+237690002222', role: 'TRESORIER' },
    { prenom: 'Michel', nom: 'TAGNE', email: 'michel.tagne@email.cm', telephone: '+237690003333', role: 'MEMBRE' },
    { prenom: 'Sophie', nom: 'NGOUE', email: 'sophie.ngoue@email.cm', telephone: '+237690004444', role: 'MEMBRE' },
  ];

  subsection('Création des utilisateurs et adhésions');

  for (const m of membresData) {
    // Créer l'utilisateur
    const user = await api('POST', '/utilisateurs', {
      prenom: m.prenom,
      nom: m.nom,
      email: m.email,
      telephone: m.telephone,
      motDePasse: 'Password123!',
      dateNaissance: '1985-05-15'
    });

    if (!user) continue;

    // Créer l'adhésion
    const adhesion = await api('POST', '/adhesions-tontine', {
      tontineId: state.tontineId,
      utilisateurId: user.id,
      role: m.role,
      dateAdhesion: '2026-01-15'
    });

    if (adhesion) {
      state.membres.push({
        id: user.id,
        exerciceMembreId: '', // sera rempli plus tard
        nom: m.nom,
        prenom: m.prenom,
        role: m.role,
        adhesionId: adhesion.id
      });
      log(COLORS.green, '👤', `${m.prenom} ${m.nom} - ${m.role}`);
    }
  }

  log(COLORS.cyan, '📊', `${state.membres.length} membres créés et adhérés à la tontine`);
  return true;
}

async function ouvrirExercice() {
  section('📅 PHASE 2: OUVERTURE DE L\'EXERCICE 2026');

  const exercice = await api('POST', '/exercices', {
    tontineId: state.tontineId,
    nom: 'Exercice 2026',
    dateDebut: '2026-02-01',
    dateFin: '2026-05-31',
    dureeEnMois: CONFIG.DUREE_EXERCICE,
    cotisationMensuelle: CONFIG.COTISATION_MENSUELLE,
    epargneMensuelle: CONFIG.EPARGNE_MENSUELLE,
    potMensuel: CONFIG.POT_MENSUEL,
    secoursAnnuel: CONFIG.SECOURS_ANNUEL,
    inscriptionExercice: CONFIG.INSCRIPTION,
    tauxInteretPret: CONFIG.TAUX_INTERET_PRET
  });

  if (!exercice) return false;
  state.exerciceId = exercice.id;
  log(COLORS.green, '✅', `Exercice créé: ${exercice.nom}`);
  log(COLORS.blue, '📆', `Période: ${exercice.dateDebut} → ${exercice.dateFin}`);

  // Inscrire les membres à l'exercice
  subsection('Inscription des membres à l\'exercice');
  
  for (const membre of state.membres) {
    const em = await api('POST', `/exercices/${state.exerciceId}/membres`, {
      adhesionTontineId: membre.adhesionId,
      nombreParts: 1,
      typeMembre: 'NOUVEAU',
      dateEntreeExercice: '2026-02-01'
    });

    if (em) {
      membre.exerciceMembreId = em.id;
      log(COLORS.green, '✓', `${membre.prenom} ${membre.nom} inscrit à l'exercice`);
      
      // Initialiser son épargne à 0
      state.epargnes.push({ membreId: em.id, total: 0 });
    }
  }

  // Ouvrir l'exercice
  await api('PATCH', `/exercices/${state.exerciceId}/ouvrir`, {});
  log(COLORS.green, '🚀', 'Exercice ouvert!');

  return true;
}

async function simulerReunion(numeroReunion: number) {
  const mois = ['', 'Février', 'Mars', 'Avril', 'Mai'];
  const dates = ['', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15'];
  
  section(`📍 RÉUNION ${numeroReunion} - ${mois[numeroReunion]} 2026`);

  // 1. Planifier la réunion
  const reunion = await api('POST', '/reunions', {
    exerciceId: state.exerciceId,
    ordre: numeroReunion,
    dateReunion: dates[numeroReunion],
    heureDebut: '15:00',
    lieu: 'Domicile de Paul KAMGA',
    adresse: 'Yaoundé, Quartier Bastos'
  });

  if (!reunion) return false;
  state.reunions.push({ id: reunion.id, ordre: numeroReunion, date: dates[numeroReunion] });
  log(COLORS.green, '📅', `Réunion planifiée pour le ${dates[numeroReunion]}`);

  // 2. Ouvrir la réunion
  await api('PATCH', `/reunions/${reunion.id}/ouvrir`, {});
  log(COLORS.green, '🔓', 'Réunion ouverte');

  // 3. Enregistrer les présences
  subsection('Présences');
  for (const membre of state.membres) {
    // Sophie est absente à la réunion 2 (elle paiera une pénalité)
    const estPresent = !(numeroReunion === 2 && membre.prenom === 'Sophie');
    
    await api('POST', `/reunions/${reunion.id}/presences`, {
      exerciceMembreId: membre.exerciceMembreId,
      estPresent,
      motifAbsence: estPresent ? null : 'Voyage professionnel'
    });
    
    const status = estPresent ? '✓ Présent' : '✗ Absent';
    log(estPresent ? COLORS.green : COLORS.red, '', `   ${membre.prenom} ${membre.nom}: ${status}`);
  }

  // 4. Générer et payer les cotisations
  subsection('Cotisations (10 000 FCFA/membre)');
  await api('POST', `/cotisations-dues/generer/${reunion.id}`, { montantDu: CONFIG.COTISATION_MENSUELLE });
  
  let totalCotisations = 0;
  for (const membre of state.membres) {
    // Récupérer la cotisation du membre
    const cotisations = await api('GET', `/cotisations-dues?reunionId=${reunion.id}&exerciceMembreId=${membre.exerciceMembreId}`);
    if (cotisations && cotisations.length > 0) {
      const cotisation = cotisations[0];
      // Michel paie en retard à la réunion 3 (pénalité)
      const paye = !(numeroReunion === 3 && membre.prenom === 'Michel');
      
      if (paye) {
        await api('PATCH', `/cotisations-dues/${cotisation.id}/paiement`, { montantPaye: CONFIG.COTISATION_MENSUELLE });
        totalCotisations += CONFIG.COTISATION_MENSUELLE;
        log(COLORS.green, '💵', `${membre.prenom}: ${CONFIG.COTISATION_MENSUELLE.toLocaleString()} FCFA ✓`);
      } else {
        log(COLORS.red, '⚠️', `${membre.prenom}: EN RETARD (pénalité à venir)`);
      }
    }
  }
  log(COLORS.cyan, '📊', `Total cotisations: ${totalCotisations.toLocaleString()} FCFA`);

  // 5. Générer et payer les épargnes
  subsection('Épargnes (5 000 FCFA/membre)');
  let totalEpargnes = 0;
  for (const membre of state.membres) {
    // Simuler le paiement de l'épargne
    totalEpargnes += CONFIG.EPARGNE_MENSUELLE;
    
    // Mettre à jour le cumul d'épargne
    const epargne = state.epargnes.find(e => e.membreId === membre.exerciceMembreId);
    if (epargne) {
      epargne.total += CONFIG.EPARGNE_MENSUELLE;
    }
    log(COLORS.green, '🏦', `${membre.prenom}: ${CONFIG.EPARGNE_MENSUELLE.toLocaleString()} FCFA (cumul: ${epargne?.total.toLocaleString()} FCFA)`);
  }
  log(COLORS.cyan, '📊', `Total épargnes du mois: ${totalEpargnes.toLocaleString()} FCFA`);

  // 6. Générer et payer les pots
  subsection('Pot (2 000 FCFA/membre) → Collation');
  await api('POST', `/pots-dus/generer/${reunion.id}`, { montantDu: CONFIG.POT_MENSUEL });
  
  let totalPot = 0;
  for (const membre of state.membres) {
    const pots = await api('GET', `/pots-dus?reunionId=${reunion.id}&exerciceMembreId=${membre.exerciceMembreId}`);
    if (pots && pots.length > 0) {
      await api('PATCH', `/pots-dus/${pots[0].id}/paiement`, { montantPaye: CONFIG.POT_MENSUEL });
      totalPot += CONFIG.POT_MENSUEL;
    }
  }
  log(COLORS.yellow, '🍕', `Total pot: ${totalPot.toLocaleString()} FCFA → Dépensé pour la collation`);

  // 7. Distribution au bénéficiaire du mois
  subsection('Distribution des cotisations');
  const beneficiaire = state.membres[numeroReunion - 1]; // Chaque membre bénéficie à son tour
  
  const distribution = await api('POST', '/distributions', {
    reunionId: reunion.id,
    exerciceMembreBeneficiaireId: beneficiaire.exerciceMembreId,
    ordre: numeroReunion,
    montantBrut: totalCotisations,
    montantRetenu: 0,
    montantNet: totalCotisations
  });

  if (distribution) {
    await api('PATCH', `/distributions/${distribution.id}/distribuer`, {});
    state.distributions.push({
      reunionId: reunion.id,
      beneficiaireId: beneficiaire.exerciceMembreId,
      montant: totalCotisations
    });
    log(COLORS.magenta, '🎉', `${beneficiaire.prenom} ${beneficiaire.nom} reçoit ${totalCotisations.toLocaleString()} FCFA!`);
  }

  // 8. Événements spéciaux selon la réunion
  await traiterEvenementsSpeciaux(numeroReunion, reunion.id);

  // 9. Clôturer la réunion
  await api('PATCH', `/reunions/${reunion.id}/cloturer`, {});
  log(COLORS.green, '🔒', 'Réunion clôturée');

  return true;
}

async function traiterEvenementsSpeciaux(numeroReunion: number, reunionId: string) {
  
  // RÉUNION 2: Prêt accordé à Michel
  if (numeroReunion === 2) {
    subsection('💰 Demande de Prêt');
    const michel = state.membres.find(m => m.prenom === 'Michel')!;
    
    log(COLORS.yellow, '📝', 'Michel demande un prêt de 50 000 FCFA pour une urgence familiale');
    
    const pret = await api('POST', '/prets', {
      exerciceMembreId: michel.exerciceMembreId,
      montant: 50000,
      motif: 'Urgence familiale - frais médicaux',
      dureeRemboursementMois: 3,
      tauxInteret: CONFIG.TAUX_INTERET_PRET
    });

    if (pret) {
      // Approuver le prêt
      await api('PATCH', `/prets/${pret.id}/approuver`, {});
      log(COLORS.green, '✅', 'Prêt approuvé par le bureau');
      
      // Décaisser le prêt
      await api('PATCH', `/prets/${pret.id}/decaisser`, {});
      log(COLORS.green, '💵', 'Prêt décaissé: 50 000 FCFA');
      
      const interets = 50000 * CONFIG.TAUX_INTERET_PRET / 100;
      log(COLORS.blue, '📈', `Intérêts (${CONFIG.TAUX_INTERET_PRET}%): ${interets.toLocaleString()} FCFA`);
      log(COLORS.cyan, '💳', `Total à rembourser: ${(50000 + interets).toLocaleString()} FCFA`);
      
      state.prets.push({
        id: pret.id,
        emprunteurId: michel.exerciceMembreId,
        montant: 50000,
        solde: 50000 + interets
      });
    }
  }

  // RÉUNION 2: Pénalité pour Sophie (absence)
  if (numeroReunion === 2) {
    subsection('⚠️ Pénalités');
    const sophie = state.membres.find(m => m.prenom === 'Sophie')!;
    
    const penalite = await api('POST', '/penalites', {
      exerciceMembreId: sophie.exerciceMembreId,
      reunionId: reunionId,
      motif: 'Absence non justifiée à la réunion',
      montant: 1000
    });

    if (penalite) {
      log(COLORS.red, '📛', `Sophie: Pénalité de 1 000 FCFA pour absence`);
    }
  }

  // RÉUNION 3: Événement de secours - Décès du père de Jeanne
  if (numeroReunion === 3) {
    subsection('🆘 Événement de Secours');
    const jeanne = state.membres.find(m => m.prenom === 'Jeanne')!;
    
    log(COLORS.red, '💔', 'Décès du père de Jeanne FOTSO');
    
    // Récupérer les types d'événements de secours
    const typesSecours = await api('GET', '/types-evenements-secours');
    const typeDeces = typesSecours?.find((t: any) => t.code === 'DECES_PARENT') || typesSecours?.[0];

    if (typeDeces) {
      const evenement = await api('POST', '/evenements-secours', {
        exerciceMembreId: jeanne.exerciceMembreId,
        typeEvenementSecoursId: typeDeces.id,
        dateEvenement: '2026-04-10',
        description: 'Décès du père de Jeanne survenu le 10 avril 2026',
        montantDemande: 30000
      });

      if (evenement) {
        // Valider l'événement
        const president = state.membres.find(m => m.role === 'PRESIDENT')!;
        await api('PATCH', `/evenements-secours/${evenement.id}/valider`, {
          valideParExerciceMembreId: president.exerciceMembreId,
          montantApprouve: 30000
        });
        log(COLORS.green, '✅', 'Événement validé par le Président');

        // Payer le secours
        await api('PATCH', `/evenements-secours/${evenement.id}/payer`, {});
        log(COLORS.green, '💵', `Jeanne reçoit 30 000 FCFA du fonds de secours`);

        state.evenementsSecours.push({
          id: evenement.id,
          membreId: jeanne.exerciceMembreId,
          type: 'DECES_PARENT',
          montant: 30000
        });
      }
    }
  }

  // RÉUNION 3: Remboursement partiel du prêt de Michel
  if (numeroReunion === 3 && state.prets.length > 0) {
    subsection('💳 Remboursement de Prêt');
    const pret = state.prets[0];
    const montantRemboursement = 20000;

    const remboursement = await api('POST', `/prets/${pret.id}/remboursements`, {
      montant: montantRemboursement,
      commentaire: 'Remboursement partiel - 1ère échéance'
    });

    if (remboursement) {
      pret.solde -= montantRemboursement;
      log(COLORS.green, '💵', `Michel rembourse ${montantRemboursement.toLocaleString()} FCFA`);
      log(COLORS.blue, '📊', `Solde restant: ${pret.solde.toLocaleString()} FCFA`);
    }
  }

  // RÉUNION 3: Pénalité pour Michel (cotisation en retard)
  if (numeroReunion === 3) {
    const michel = state.membres.find(m => m.prenom === 'Michel')!;
    
    const penalite = await api('POST', '/penalites', {
      exerciceMembreId: michel.exerciceMembreId,
      reunionId: reunionId,
      motif: 'Cotisation payée en retard',
      montant: 500
    });

    if (penalite) {
      log(COLORS.red, '📛', `Michel: Pénalité de 500 FCFA pour retard de cotisation`);
    }
  }

  // RÉUNION 4: Remboursement final du prêt
  if (numeroReunion === 4 && state.prets.length > 0) {
    subsection('💳 Solde du Prêt');
    const pret = state.prets[0];
    
    const remboursement = await api('POST', `/prets/${pret.id}/remboursements`, {
      montant: pret.solde,
      commentaire: 'Remboursement final avant cassation'
    });

    if (remboursement) {
      log(COLORS.green, '✅', `Michel solde son prêt: ${pret.solde.toLocaleString()} FCFA`);
      pret.solde = 0;
    }
  }
}

async function effectuerCassation() {
  section('🏁 CASSATION - FIN D\'EXERCICE');

  log(COLORS.yellow, '📋', 'Calcul des épargnes à restituer à chaque membre:');
  console.log('');

  let totalCassation = 0;

  for (const membre of state.membres) {
    const epargne = state.epargnes.find(e => e.membreId === membre.exerciceMembreId);
    const montantEpargne = epargne?.total || 0;
    
    // Vérifier s'il y a des déductions (prêts non remboursés)
    let deductions = 0;
    const pret = state.prets.find(p => p.emprunteurId === membre.exerciceMembreId);
    if (pret && pret.solde > 0) {
      deductions = pret.solde;
    }

    const montantNet = montantEpargne - deductions;
    totalCassation += montantNet;

    console.log(`   ${COLORS.cyan}┌─────────────────────────────────────────┐${COLORS.reset}`);
    console.log(`   ${COLORS.cyan}│${COLORS.reset} ${COLORS.bright}${membre.prenom} ${membre.nom}${COLORS.reset}`);
    console.log(`   ${COLORS.cyan}│${COLORS.reset} Épargne accumulée: ${COLORS.green}${montantEpargne.toLocaleString()} FCFA${COLORS.reset}`);
    if (deductions > 0) {
      console.log(`   ${COLORS.cyan}│${COLORS.reset} Déductions (prêt): ${COLORS.red}-${deductions.toLocaleString()} FCFA${COLORS.reset}`);
    }
    console.log(`   ${COLORS.cyan}│${COLORS.reset} ${COLORS.bright}MONTANT NET: ${COLORS.magenta}${montantNet.toLocaleString()} FCFA${COLORS.reset}`);
    console.log(`   ${COLORS.cyan}└─────────────────────────────────────────┘${COLORS.reset}`);
    console.log('');

    // Créer l'enregistrement de cassation
    await api('POST', '/cassations', {
      exerciceId: state.exerciceId,
      exerciceMembreId: membre.exerciceMembreId,
      nombreParts: 1,
      montantBrut: montantEpargne,
      deductions,
      montantNet
    });
  }

  log(COLORS.magenta, '💰', `TOTAL CASSATION: ${totalCassation.toLocaleString()} FCFA`);
}

async function afficherBilanFinal() {
  section('📊 BILAN FINAL DE L\'EXERCICE');

  // Bilan des distributions
  subsection('Distributions mensuelles (Cotisations)');
  let totalDistributions = 0;
  for (const dist of state.distributions) {
    const membre = state.membres.find(m => m.exerciceMembreId === dist.beneficiaireId);
    if (membre) {
      log(COLORS.green, '💵', `${membre.prenom} ${membre.nom}: ${dist.montant.toLocaleString()} FCFA`);
      totalDistributions += dist.montant;
    }
  }
  log(COLORS.cyan, '📊', `Total distribué: ${totalDistributions.toLocaleString()} FCFA`);

  // Bilan des épargnes
  subsection('Épargnes restituées (Cassation)');
  let totalEpargnes = 0;
  for (const membre of state.membres) {
    const epargne = state.epargnes.find(e => e.membreId === membre.exerciceMembreId);
    if (epargne) {
      log(COLORS.green, '🏦', `${membre.prenom} ${membre.nom}: ${epargne.total.toLocaleString()} FCFA`);
      totalEpargnes += epargne.total;
    }
  }
  log(COLORS.cyan, '📊', `Total épargnes: ${totalEpargnes.toLocaleString()} FCFA`);

  // Bilan des secours
  if (state.evenementsSecours.length > 0) {
    subsection('Secours versés');
    let totalSecours = 0;
    for (const evt of state.evenementsSecours) {
      const membre = state.membres.find(m => m.exerciceMembreId === evt.membreId);
      if (membre) {
        log(COLORS.red, '🆘', `${membre.prenom} ${membre.nom} (${evt.type}): ${evt.montant.toLocaleString()} FCFA`);
        totalSecours += evt.montant;
      }
    }
    log(COLORS.cyan, '📊', `Total secours: ${totalSecours.toLocaleString()} FCFA`);
  }

  // Bilan des prêts
  if (state.prets.length > 0) {
    subsection('Prêts');
    for (const pret of state.prets) {
      const michel = state.membres.find(m => m.exerciceMembreId === pret.emprunteurId);
      const status = pret.solde === 0 ? '✓ Remboursé' : `Solde: ${pret.solde.toLocaleString()} FCFA`;
      log(COLORS.blue, '💳', `${michel?.prenom} ${michel?.nom}: ${pret.montant.toLocaleString()} FCFA - ${status}`);
    }
  }

  // Résumé final
  subsection('Résumé par Membre');
  console.log('');
  console.log(`   ${COLORS.bright}┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐${COLORS.reset}`);
  console.log(`   ${COLORS.bright}│ Membre          │ Cotisé       │ Reçu (Dist.) │ Épargné      │ Récupéré     │${COLORS.reset}`);
  console.log(`   ${COLORS.bright}├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤${COLORS.reset}`);
  
  for (const membre of state.membres) {
    const cotise = CONFIG.COTISATION_MENSUELLE * CONFIG.DUREE_EXERCICE;
    const dist = state.distributions.find(d => d.beneficiaireId === membre.exerciceMembreId);
    const recu = dist?.montant || 0;
    const epargne = state.epargnes.find(e => e.membreId === membre.exerciceMembreId)?.total || 0;
    
    const nom = `${membre.prenom}`.padEnd(15);
    console.log(`   ${COLORS.cyan}│${COLORS.reset} ${nom} ${COLORS.cyan}│${COLORS.reset} ${cotise.toLocaleString().padStart(10)} ${COLORS.cyan}│${COLORS.reset} ${recu.toLocaleString().padStart(10)} ${COLORS.cyan}│${COLORS.reset} ${epargne.toLocaleString().padStart(10)} ${COLORS.cyan}│${COLORS.reset} ${epargne.toLocaleString().padStart(10)} ${COLORS.cyan}│${COLORS.reset}`);
  }
  
  console.log(`   ${COLORS.bright}└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘${COLORS.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.clear();
  console.log(`
${COLORS.bright}${COLORS.cyan}
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
${COLORS.reset}`);

  console.log(`${COLORS.yellow}
   Configuration de l'exercice:
   ─────────────────────────────
   • Durée: ${CONFIG.DUREE_EXERCICE} mois
   • Cotisation mensuelle: ${CONFIG.COTISATION_MENSUELLE.toLocaleString()} FCFA
   • Épargne mensuelle: ${CONFIG.EPARGNE_MENSUELLE.toLocaleString()} FCFA  
   • Pot mensuel: ${CONFIG.POT_MENSUEL.toLocaleString()} FCFA
   • Secours annuel: ${CONFIG.SECOURS_ANNUEL.toLocaleString()} FCFA
   • Taux d'intérêt prêt: ${CONFIG.TAUX_INTERET_PRET}%
${COLORS.reset}`);

  await sleep(1000);

  // Phase 1: Création
  if (!await creerTontineEtMembres()) {
    log(COLORS.red, '❌', 'Échec de création de la tontine');
    return;
  }
  await sleep(500);

  // Phase 2: Ouverture exercice
  if (!await ouvrirExercice()) {
    log(COLORS.red, '❌', 'Échec d\'ouverture de l\'exercice');
    return;
  }
  await sleep(500);

  // Phases 3-6: Les 4 réunions mensuelles
  for (let i = 1; i <= CONFIG.DUREE_EXERCICE; i++) {
    await simulerReunion(i);
    await sleep(300);
  }

  // Phase 7: Cassation
  await effectuerCassation();
  await sleep(500);

  // Phase 8: Bilan final
  await afficherBilanFinal();

  console.log(`
${COLORS.green}${COLORS.bright}
   ✅ SIMULATION TERMINÉE AVEC SUCCÈS!
   
   L'exercice 2026 de la Tontine Solidarité est clôturé.
   Tous les membres ont récupéré leur épargne.
${COLORS.reset}`);
}

main().catch(console.error);
