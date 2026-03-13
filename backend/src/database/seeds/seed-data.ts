/**
 * Données de référence pour le seeding de développement
 * Noms camerounais réalistes, montants en XAF
 */

// ============================================================================
// UTILISATEURS — Noms camerounais réalistes
// ============================================================================
export const SUPER_ADMIN = {
  prenom: 'Admin',
  nom: 'Chris',
  telephone1: '237600000000',
  password: 'password123',
  estSuperAdmin: true,
  doitChangerMotDePasse: false,
};

export const UTILISATEURS_DATA = [
  {
    prenom: 'Jean-Pierre',
    nom: 'OMGBA',
    telephone1: '237690010001',
    telephone2: '237670010001',
    adresseResidence: 'Bastos, Yaoundé',
    numeroMobileMoney: '237690010001',
    numeroOrangeMoney: '237670010001',
  },
  {
    prenom: 'Marie-Claire',
    nom: 'NKOULOU',
    telephone1: '237690010002',
    adresseResidence: 'Messa, Yaoundé',
    numeroMobileMoney: '237690010002',
  },
  {
    prenom: 'Paul',
    nom: 'ATANGANA',
    telephone1: '237690010003',
    adresseResidence: 'Nlongkak, Yaoundé',
    numeroOrangeMoney: '237670010003',
  },
  {
    prenom: 'Isabelle',
    nom: 'FOUDA',
    telephone1: '237690010004',
    adresseResidence: 'Essos, Yaoundé',
    numeroMobileMoney: '237690010004',
  },
  {
    prenom: 'François',
    nom: 'MBARGA',
    telephone1: '237690010005',
    adresseResidence: 'Biyem Assi, Yaoundé',
    numeroMobileMoney: '237690010005',
  },
  {
    prenom: 'Hélène',
    nom: 'MVONDO',
    telephone1: '237690010006',
    adresseResidence: 'Nkolbisson, Yaoundé',
    numeroOrangeMoney: '237670010006',
  },
  {
    prenom: 'Charles',
    nom: 'ESSOMBA',
    telephone1: '237690010007',
    adresseResidence: 'Emana, Yaoundé',
    numeroMobileMoney: '237690010007',
  },
  {
    prenom: 'Brigitte',
    nom: 'ABENA',
    telephone1: '237690010008',
    adresseResidence: 'Ekounou, Yaoundé',
    numeroMobileMoney: '237690010008',
  },
  {
    prenom: 'Samuel',
    nom: 'MESSI',
    telephone1: '237690010009',
    adresseResidence: 'Mvog Ada, Yaoundé',
    numeroMobileMoney: '237690010009',
  },
  {
    prenom: 'Thérèse',
    nom: 'AKOK',
    telephone1: '237690010010',
    adresseResidence: 'Tsinga, Yaoundé',
    numeroOrangeMoney: '237670010010',
  },
  {
    prenom: 'André',
    nom: 'BILOA',
    telephone1: '237690010011',
    adresseResidence: 'Akwa, Douala',
    numeroMobileMoney: '237690010011',
    numeroOrangeMoney: '237670010011',
  },
  {
    prenom: 'Solange',
    nom: 'EWANE',
    telephone1: '237690010012',
    adresseResidence: 'Bonabéri, Douala',
    numeroMobileMoney: '237690010012',
  },
  {
    prenom: 'Emmanuel',
    nom: 'TAMBA',
    telephone1: '237690010013',
    adresseResidence: 'Deido, Douala',
    numeroMobileMoney: '237690010013',
  },
  {
    prenom: 'Patricia',
    nom: 'NGALLE',
    telephone1: '237690010014',
    adresseResidence: 'Bonamoussadi, Douala',
    numeroOrangeMoney: '237670010014',
  },
  {
    prenom: 'Didier',
    nom: 'EKOTTO',
    telephone1: '237690010015',
    adresseResidence: 'Makepe, Douala',
    numeroMobileMoney: '237690010015',
  },
  {
    prenom: 'Albertine',
    nom: 'NDONGO',
    telephone1: '237690010016',
    adresseResidence: 'Logpom, Douala',
    numeroMobileMoney: '237690010016',
  },
  {
    prenom: 'Pierre',
    nom: 'ZAMBO',
    telephone1: '237690010017',
    adresseResidence: 'Ngousso, Yaoundé',
    numeroOrangeMoney: '237670010017',
  },
  {
    prenom: 'Martine',
    nom: 'MBIDA',
    telephone1: '237690010018',
    adresseResidence: 'Mimboman, Yaoundé',
    numeroMobileMoney: '237690010018',
  },
  {
    prenom: 'Cyprien',
    nom: 'ONANA',
    telephone1: '237690010019',
    adresseResidence: 'Tongolo, Yaoundé',
    numeroMobileMoney: '237690010019',
  },
  {
    prenom: 'Valentine',
    nom: 'ZING',
    telephone1: '237690010020',
    adresseResidence: 'Mvan, Yaoundé',
    numeroOrangeMoney: '237670010020',
  },
];

// ============================================================================
// LANGUES
// ============================================================================
export const LANGUES_DATA = [
  {
    code: 'fr',
    nom: 'Français',
    nomNatif: 'Français',
    estActive: true,
    estDefaut: true,
    ordreAffichage: 1,
  },
  {
    code: 'en',
    nom: 'Anglais',
    nomNatif: 'English',
    estActive: true,
    estDefaut: false,
    ordreAffichage: 2,
  },
];

// ============================================================================
// TONTINE TYPES
// ============================================================================
export const TONTINE_TYPES_DATA = [
  {
    code: 'STANDARD',
    libelle: 'Tontine Standard',
    description:
      'Tontine classique avec cotisation mensuelle et distribution rotative au bénéficiaire du mois.',
  },
  {
    code: 'COMPLET',
    libelle: 'Tontine Complète',
    description:
      'Tontine avec cotisation, pot, épargne, secours et prêts. Modèle complet pour les associations.',
  },
  {
    code: 'EPARGNE',
    libelle: 'Tontine Épargne',
    description:
      "Tontine axée sur l'épargne individuelle, redistribuée en fin d'exercice (cassation).",
  },
  {
    code: 'SOLIDARITE',
    libelle: 'Tontine Solidarité',
    description: "Tontine orientée vers l'entraide mutuelle, avec un fonds de secours renforcé.",
  },
];

// ============================================================================
// TONTINES
// ============================================================================
export const TONTINES_DATA = [
  {
    nom: 'Tontine CAYA de Yaoundé',
    nomCourt: 'CAYA',
    anneeFondation: 2018,
    motto: "L'union fait la force",
    estOfficiellementDeclaree: true,
    numeroEnregistrement: 'PREFET/YDE/2018/0456',
    tontineTypeCode: 'COMPLET', // sera résolu en ID
  },
  {
    nom: 'Grande Famille OMGBA',
    nomCourt: 'FAM-OMGBA',
    anneeFondation: 2020,
    motto: 'Ensemble pour demain',
    estOfficiellementDeclaree: false,
    tontineTypeCode: 'STANDARD',
  },
  {
    nom: 'Solidarité Active de Douala',
    nomCourt: 'SOLID-DLA',
    anneeFondation: 2022,
    motto: 'Main dans la main',
    estOfficiellementDeclaree: true,
    numeroEnregistrement: 'PREFET/DLA/2022/0112',
    tontineTypeCode: 'SOLIDARITE',
  },
];

// ============================================================================
// OPÉRATEURS DE PAIEMENT
// ============================================================================
export const OPERATEURS_PAIEMENT_DATA = [
  { code: 'MTN_MOMO', nom: 'MTN Mobile Money', fraisFixe: 0, fraisPourcentage: 0.015 },
  { code: 'ORANGE_MONEY', nom: 'Orange Money', fraisFixe: 0, fraisPourcentage: 0.02 },
  { code: 'WAVE', nom: 'Wave', fraisFixe: 0, fraisPourcentage: 0.01 },
];

// ============================================================================
// TYPES DE PÉNALITÉS
// ============================================================================
export const TYPES_PENALITE_DATA = [
  {
    code: 'RETARD_REUNION',
    libelle: 'Retard à la réunion',
    description: 'Amende pour arrivée tardive à une réunion',
    modeCalcul: 'MONTANT_FIXE' as const,
    valeurDefaut: 500,
  },
  {
    code: 'ABSENCE_REUNION',
    libelle: 'Absence à la réunion',
    description: 'Amende pour absence non justifiée',
    modeCalcul: 'MONTANT_FIXE' as const,
    valeurDefaut: 1000,
  },
  {
    code: 'RETARD_PAIEMENT',
    libelle: 'Retard de paiement',
    description: 'Pénalité par jour de retard sur les cotisations',
    modeCalcul: 'MONTANT_PAR_JOUR' as const,
    valeurDefaut: 100,
  },
  {
    code: 'TROUBLE_REUNION',
    libelle: "Trouble à l'ordre",
    description: "Amende pour comportement perturbateur lors d'une réunion",
    modeCalcul: 'MONTANT_FIXE' as const,
    valeurDefaut: 2000,
  },
];

// ============================================================================
// EXERCICES (un exercice OUVERT par tontine : 2025-2026)
// ============================================================================
export const EXERCICES_DATA = [
  {
    tontineNomCourt: 'CAYA',
    libelle: 'Exercice 2025-2026',
    anneeDebut: 2025,
    moisDebut: 3,
    anneeFin: 2026,
    moisFin: 2,
    dureeMois: 12,
  },
  {
    tontineNomCourt: 'FAM-OMGBA',
    libelle: 'Exercice 2025-2026',
    anneeDebut: 2025,
    moisDebut: 6,
    anneeFin: 2026,
    moisFin: 5,
    dureeMois: 12,
  },
  {
    tontineNomCourt: 'SOLID-DLA',
    libelle: 'Exercice 2025-2026',
    anneeDebut: 2025,
    moisDebut: 9,
    anneeFin: 2026,
    moisFin: 8,
    dureeMois: 12,
  },
];

// ============================================================================
// MONTANTS & CONSTANTES FINANCIÈRES (XAF)
// ============================================================================
export const MONTANTS = {
  COTISATION_CAYA: 10000,
  COTISATION_OMGBA: 5000,
  COTISATION_SOLID: 15000,
  POT_CAYA: 2000,
  POT_OMGBA: 1000,
  POT_SOLID: 3000,
  EPARGNE_CAYA: 5000,
  INSCRIPTION_CAYA: 5000,
  INSCRIPTION_OMGBA: 3000,
  INSCRIPTION_SOLID: 10000,
  SECOURS_ANNUEL: 10000,
};
