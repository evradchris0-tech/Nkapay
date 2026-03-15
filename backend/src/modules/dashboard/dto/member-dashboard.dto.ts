/**
 * DTOs pour le Dashboard Membre
 */

import { RoleMembre } from '../../tontines/entities/adhesion-tontine.entity';

export interface MemberDashboardResponseDto {
    exerciceMembreId: string;
    membre: {
        nomComplet: string;
        role: RoleMembre;
        parts: number;
        statut: string;
    };
    tontine: {
        id: string;
        nom: string;
        type: string;
        devise: string;
    };
    exercice: {
        id: string;
        annee: number;
        dateDebut: string;
        dateFin: string;
        statut: string;
    };
    solde: {
        totalCotise: number;
        totalDettes: number;
        totalEpargne: number;
        totalSecoursPaye: number;
    };
    prochaineReunion: {
        id: string;
        date: string;
        lieu: string;
        montantAttendu: number;
        estBeneficiaire: boolean;
    } | null;
    prets: {
        enCours: boolean;
        capitalRestant: number;
        interetsPayes: number;
        prochaineEcheance: string | null;
        montantProchaineEcheance: number;
    } | null;
    secours: {
        evenementEnCours: string | null;
        totalRecu: number;
    } | null;
    activiteRecente: {
        id: string;
        date: string;
        type: string;
        montant: number;
        sens: 'DEBIT' | 'CREDIT';
        description: string;
        statut: string;
    }[];
}
