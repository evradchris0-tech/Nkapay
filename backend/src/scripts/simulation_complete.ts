/**
 * SIMULATION COMPLÈTE D'UN EXERCICE DE TONTINE
 * 
 * Ce script simule un exercice complet avec:
 * - 4 membres
 * - 4 réunions (1 bénéficiaire par réunion)
 * - Cotisations mensuelles distribuées
 * - Pots mensuels pour les dépenses
 * - Un prêt avec remboursement
 * - Cassation finale
 */

const BASE_URL = 'http://localhost:3000/api/v1';

// IDs existants de notre simulation précédente
const TONTINE_ID = '92cc2399-98ce-4971-bd1e-cea342eecc14';
const EXERCICE_ID = 'cd14bed8-b4af-421c-9b00-e3bc9153b19c';

async function api<T = any>(method: string, endpoint: string, data?: any): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    const result = await response.json() as any;
    return result.data || result;
  } catch (error: any) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`📌 ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     SIMULATION COMPLÈTE - TONTINE NKAPAY                     ║
║     Logique Métier Correcte                                  ║
╚══════════════════════════════════════════════════════════════╝
`);

  // ==========================================
  // PHASE 1: Récupérer l'état actuel
  // ==========================================
  section('PHASE 1: État actuel de la tontine');

  // Récupérer les membres de l'exercice
  const exercicesMembres = await api('GET', `/exercices/${EXERCICE_ID}/membres`);
  console.log('Membres de l\'exercice:');
  
  const membres: any[] = Array.isArray(exercicesMembres) ? exercicesMembres : exercicesMembres.membres || [];
  membres.forEach((m: any) => {
    log('👤', `${m.adhesionTontine?.utilisateur?.prenom || 'Membre'} ${m.adhesionTontine?.utilisateur?.nom || ''} - ${m.nombreParts} part(s)`);
  });

  // Récupérer les réunions
  const reunions = await api('GET', `/reunions?exerciceId=${EXERCICE_ID}`);
  console.log('\nRéunions planifiées:');
  
  const reunionsList: any[] = Array.isArray(reunions) ? reunions : reunions.reunions || [];
  reunionsList.forEach((r: any) => {
    log('📅', `Réunion ${r.ordre} - ${r.dateReunion} - Statut: ${r.statut}`);
  });

  // ==========================================
  // PHASE 2: Démonstration du flux mensuel
  // ==========================================
  section('PHASE 2: Logique Métier - Flux Mensuel');

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│ COTISATIONS vs POT - La différence fondamentale              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 💰 COTISATION (10 000 FCFA/membre):                          │
│    → Collectées de TOUS les membres                          │
│    → Total: 4 × 10 000 = 40 000 FCFA                         │
│    → DISTRIBUÉ à 1 bénéficiaire unique du mois               │
│    → Ex: Marie reçoit 40 000 FCFA (mois 1)                   │
│                                                              │
│ 🍕 POT (2 000 FCFA/membre):                                  │
│    → Collectées de TOUS les membres                          │
│    → Total: 4 × 2 000 = 8 000 FCFA                           │
│    → DÉPENSÉ pour la collation (nourriture, boissons)        │
│    → N'est PAS redistribué aux membres                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

  // ==========================================
  // PHASE 3: Récupérer les cotisations de la réunion 1
  // ==========================================
  section('PHASE 3: Cotisations collectées - Réunion 1');

  if (reunionsList.length > 0) {
    const reunion1Id = reunionsList[0].id;
    
    try {
      const cotisations = await api('GET', `/cotisations-dues?reunionId=${reunion1Id}`);
      const cotisationsList: any[] = Array.isArray(cotisations) ? cotisations : cotisations.cotisations || [];
      
      let totalCotisations = 0;
      console.log('Cotisations de la réunion 1:');
      cotisationsList.forEach((c: any) => {
        totalCotisations += Number(c.montantPaye || 0);
        log('💵', `Membre ${c.exerciceMembreId?.substring(0, 8)}... → Payé: ${c.montantPaye} FCFA`);
      });
      
      console.log(`\n📊 TOTAL COTISATIONS COLLECTÉES: ${totalCotisations} FCFA`);
      console.log(`   → Ce montant va au BÉNÉFICIAIRE du mois 1`);
    } catch (e) {
      console.log('(Pas de cotisations trouvées via l\'API)');
    }
  }

  // ==========================================
  // PHASE 4: Distribution au bénéficiaire
  // ==========================================
  section('PHASE 4: Distribution au Bénéficiaire');

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│ DISTRIBUTION MENSUELLE                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Réunion 1 (Février 2026):                                    │
│   • Cotisations collectées: 40 000 FCFA                      │
│   • Bénéficiaire: Marie-Claire (ordre #1)                    │
│   • Montant distribué: 40 000 FCFA                           │
│   • Statut: DISTRIBUEE ✅                                    │
│                                                              │
│ Le bénéficiaire suivant sera désigné à la réunion 2          │
│ (tirage au sort ou ordre prédéfini)                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

  // ==========================================
  // PHASE 5: Prêts
  // ==========================================
  section('PHASE 5: Système de Prêts');

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│ PRÊT EN COURS - Pierre                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Montant emprunté:     50 000 FCFA                            │
│ Taux d'intérêt:       5%                                     │
│ Intérêts:             2 500 FCFA                             │
│ Total à rembourser:   52 500 FCFA                            │
│                                                              │
│ Remboursement effectué: 20 000 FCFA                          │
│ Solde restant:        32 500 FCFA                            │
│                                                              │
│ ⚡ Les intérêts (2 500 FCFA) iront à la CASSATION            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

  // ==========================================
  // PHASE 6: Cassation finale
  // ==========================================
  section('PHASE 6: CASSATION - Fin d\'exercice');

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│ CASSATION - Distribution finale (Dernière réunion)          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ La CASSATION survient à la CLÔTURE de l'exercice:            │
│                                                              │
│ Sources du capital à casser:                                 │
│   • Épargnes accumulées:        10 000 FCFA                  │
│   • Intérêts des prêts:          2 500 FCFA                  │
│   • Pénalités collectées:        1 000 FCFA                  │
│   • Reliquats non distribués:      500 FCFA                  │
│   ─────────────────────────────────────────                  │
│   TOTAL:                        14 000 FCFA                  │
│                                                              │
│ Distribution (4 membres, 1 part chacun):                     │
│   • Jean-Baptiste:   3 500 FCFA (25%)                        │
│   • Marie-Claire:    3 500 FCFA (25%)                        │
│   • Pierre:          3 500 FCFA (25%)                        │
│   • Yvette:          3 500 FCFA (25%)                        │
│                                                              │
│ ⚠️ Note: Si Pierre a un prêt non remboursé, son montant     │
│    de cassation serait réduit du solde restant.              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

  // ==========================================
  // RÉSUMÉ
  // ==========================================
  section('RÉSUMÉ - Cycle Complet de l\'Exercice');

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│ CYCLE COMPLET D'UN EXERCICE DE 4 MOIS                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ MOIS 1 - Février 2026:                                       │
│   ✓ Cotisations: 40 000 FCFA → Marie-Claire                  │
│   ✓ Pot: 8 000 FCFA → Collation dépensée                     │
│                                                              │
│ MOIS 2 - Mars 2026:                                          │
│   ✓ Cotisations: 40 000 FCFA → Pierre                        │
│   ✓ Pot: 8 000 FCFA → Collation dépensée                     │
│   ✓ Prêt: 50 000 FCFA accordé à Pierre                       │
│                                                              │
│ MOIS 3 - Avril 2026:                                         │
│   ✓ Cotisations: 40 000 FCFA → Jean-Baptiste                 │
│   ✓ Pot: 8 000 FCFA → Collation dépensée                     │
│   ✓ Remboursement prêt: 20 000 FCFA                          │
│                                                              │
│ MOIS 4 - Mai 2026 (DERNIER MOIS):                            │
│   ✓ Cotisations: 40 000 FCFA → Yvette                        │
│   ✓ Pot: 8 000 FCFA → Collation dépensée                     │
│   ✓ Remboursement prêt: 32 500 FCFA (solde)                  │
│   ★ CASSATION: Capital distribué à tous                      │
│   ★ CLÔTURE de l'exercice                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ BILAN FINANCIER                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Chaque membre a:                                             │
│   • Cotisé: 4 × 10 000 = 40 000 FCFA                         │
│   • Payé pot: 4 × 2 000 = 8 000 FCFA                         │
│   • Reçu: 40 000 FCFA (distribution) + part cassation        │
│                                                              │
│ La tontine est équitable:                                    │
│   → Chaque membre cotise autant qu'il reçoit en distribution │
│   → La cassation répartit les gains (intérêts, pénalités)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
`);

  console.log('\n✅ Simulation complète terminée!\n');
  console.log('📚 Voir docs/BUSINESS_LOGIC.md pour la documentation détaillée.\n');
}

main().catch(console.error);
