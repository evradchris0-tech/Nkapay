export interface PdfTableColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface PdfReportHeader {
  tontineName: string;
  reportTitle: string;
  subtitle?: string;
  periode?: string;
  genereLe: Date;
}

export interface ReleveCompteData {
  header: PdfReportHeader;
  membre: {
    nom: string;
    role: string;
    parts: number;
    matricule?: string;
  };
  solde: {
    totalCotise: number;
    totalDettes: number;
    totalEpargne: number;
    totalSecours: number;
  };
  transactions: {
    date: string;
    reference: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    solde: number;
  }[];
  pret?: {
    montantCapital: number;
    capitalRestant: number;
    tauxInteret: number;
    dateDecaissement: string;
    dateEcheance: string;
    statut: string;
  } | null;
}

export interface RapportExerciceData {
  header: PdfReportHeader;
  resume: {
    totalMembres: number;
    totalCotisations: number;
    totalDistributions: number;
    totalPrets: number;
    totalPenalites: number;
    totalSecours: number;
    soldeEpargne: number;
  };
  membresDetail: {
    nom: string;
    role: string;
    parts: number;
    cotise: number;
    recu: number;
    dettes: number;
    statut: string;
  }[];
  reunions: {
    numero: number;
    date: string;
    lieu: string;
    beneficiaire: string;
    montantDistribue: number;
    statut: string;
  }[];
}

export interface RapportMensuelData {
  header: PdfReportHeader;
  reunion: {
    numero: number;
    date: string;
    lieu: string;
    beneficiaire: string;
    montantDistribue: number;
  };
  cotisations: {
    membre: string;
    montantDu: number;
    montantPaye: number;
    soldeRestant: number;
    statut: string;
  }[];
  prets: {
    membre: string;
    montantRembourse: number;
    capitalRestant: number;
  }[];
  penalites: {
    membre: string;
    motif: string;
    montant: number;
    statut: string;
  }[];
  totaux: {
    totalCotisations: number;
    totalRemboursements: number;
    totalPenalites: number;
    totalReunion: number;
  };
}

// ─── Rapport 4 — Liste des membres ───────────────────────────────────────────

export interface ListeMembresData {
  header: PdfReportHeader;
  tontine: {
    id: string;
    nom: string;
    nomCourt?: string;
    type?: string;
  };
  membres: {
    matricule: string;
    nom: string;
    prenom: string;
    telephone: string;
    role: string;
    statut: string;
    dateAdhesion: string;
    nombreParts: number;
  }[];
  totaux: {
    totalActifs: number;
    totalInactifs: number;
    totalMembres: number;
  };
}

// ─── Rapport 5 — Rapport organisation ────────────────────────────────────────

export interface RapportOrganisationData {
  header: PdfReportHeader;
  organisation: {
    id: string;
    nom: string;
    slug: string;
    plan: string;
    pays: string;
    devise: string;
    dateCreation: string;
    nbTontines: number;
    nbMembresTotal: number;
  };
  tontines: {
    id: string;
    nom: string;
    type: string;
    statut: string;
    nbMembres: number;
    exerciceActif: string | null;
  }[];
  consolidation: {
    totalCotise: number;
    totalDistribue: number;
    pretsEnCours: number;
    pretsEnCoursMontant: number;
  };
}

// ─── Rapport 6 — Portefeuille prêts ──────────────────────────────────────────

export interface PortefeuillePretsData {
  header: PdfReportHeader;
  exercice: { id: string; annee: number; statut: string };
  pretsActifs: {
    membre: string;
    montantCapital: number;
    tauxInteret: number;
    capitalRestant: number;
    dateEcheance: string;
    statut: string;
  }[];
  pretsSoldes: {
    membre: string;
    montantCapital: number;
    interetsPaies: number;
    dateSolde: string;
  }[];
  kpis: {
    totalDecaisse: number;
    totalRembourse: number;
    interetsCollectes: number;
    tauxRecouvrement: number;
    nbPretsActifs: number;
    nbPretsSoldes: number;
  };
}

// ─── Rapport 7 — Présences & assiduité ───────────────────────────────────────

export interface PresencesAssiduiteData {
  header: PdfReportHeader;
  exercice: { id: string; annee: number };
  parMembre: {
    nom: string;
    nbPresences: number;
    nbAbsences: number;
    nbReunionsTotal: number;
    tauxPresence: number;
  }[];
  parReunion: {
    numero: number;
    date: string;
    nbPresents: number;
    nbAbsents: number;
    tauxPresence: number;
  }[];
}

// ─── Rapport 8 — Cotisations & arriérés ──────────────────────────────────────

export interface CotisationsArrieresData {
  header: PdfReportHeader;
  exercice: { id: string; annee: number };
  membres: {
    nom: string;
    totalDu: number;
    totalPaye: number;
    arriere: number;
    tauxRecouvrement: number;
    enDefaut: boolean;
  }[];
  totaux: {
    totalDu: number;
    totalPaye: number;
    totalArriere: number;
    tauxRecouvrementGlobal: number;
    nbMembresEnDefaut: number;
  };
}

// ─── Rapport 9 — Événements secours ──────────────────────────────────────────

export interface EvenementsSecoursData {
  header: PdfReportHeader;
  exercice: { id: string; annee: number };
  evenements: {
    membre: string;
    typeEvenement: string;
    date: string;
    montantApprouve: number;
    statut: string;
    nbPiecesJustificatives: number;
  }[];
  kpis: {
    nbEvenements: number;
    montantTotalDistribue: number;
    montantEnAttente: number;
    nbEnAttente: number;
  };
}

// ─── Rapport 10 — Bilan financier annuel ─────────────────────────────────────

export interface BilanFinancierAnnuelData {
  header: PdfReportHeader;
  tontine: { id: string; nom: string };
  annee: number;
  parExercice: {
    annee: number;
    exerciceId: string;
    statut: string;
    cotisations: number;
    distributions: number;
    pretsDecaisses: number;
    pretsRembourses: number;
    penalites: number;
    secours: number;
    soldeNet: number;
  }[];
  totaux: {
    cotisations: number;
    distributions: number;
    pretsDecaisses: number;
    pretsRembourses: number;
    penalites: number;
    secours: number;
  };
}
