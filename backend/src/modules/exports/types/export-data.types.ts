
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
