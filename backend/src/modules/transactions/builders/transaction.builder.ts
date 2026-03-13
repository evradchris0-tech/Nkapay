/**
 * TransactionBuilder — Design Pattern: Builder
 *
 * Construit des objets Transaction étape par étape, avec :
 * - Valeurs par défaut intelligentes
 * - Génération automatique de la référence
 * - Gestion du statut selon le mode de soumission
 *
 * Usage:
 *   const transaction = new TransactionBuilder(TypeTransaction.COTISATION)
 *     .forMembre(exerciceMembreId)
 *     .atReunion(reunionId)
 *     .withMontant(25000)
 *     .withDescription('Cotisation mensuelle')
 *     .autoSoumettre()
 *     .build();
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TypeTransaction,
  StatutTransaction,
  ModeCreationTransaction,
} from '../entities/transaction.entity';

export class TransactionBuilder {
  private data: Record<string, any> = {};

  constructor(type: TypeTransaction) {
    this.data.typeTransaction = type;
    this.data.reference = this.generateReference(type);
    this.data.statut = StatutTransaction.BROUILLON;
    this.data.modeCreation = ModeCreationTransaction.MANUEL;
    this.data.autoSoumis = false;
  }

  // =========================================================================
  // Chaînage fluide
  // =========================================================================

  forMembre(exerciceMembreId: string): this {
    this.data.exerciceMembreId = exerciceMembreId;
    return this;
  }

  atReunion(reunionId: string): this {
    this.data.reunionId = reunionId;
    return this;
  }

  withMontant(montant: number): this {
    if (montant <= 0) throw new Error('Le montant doit être positif');
    this.data.montant = montant;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  forProjet(projetId: string): this {
    this.data.projetId = projetId;
    return this;
  }

  creePar(utilisateurId?: string, exerciceMembreId?: string): this {
    if (utilisateurId) this.data.creeParUtilisateurId = utilisateurId;
    if (exerciceMembreId) this.data.creeParExerciceMembreId = exerciceMembreId;
    return this;
  }

  withModeCreation(mode: ModeCreationTransaction): this {
    this.data.modeCreation = mode;
    return this;
  }

  autoSoumettre(auto: boolean = true): this {
    this.data.autoSoumis = auto;
    if (auto) {
      this.data.statut = StatutTransaction.SOUMIS;
      this.data.soumisLe = new Date();
    }
    return this;
  }

  // =========================================================================
  // Construction finale
  // =========================================================================

  build(): Record<string, any> {
    // Validation obligatoire
    if (!this.data.typeTransaction) {
      throw new Error('TransactionBuilder: typeTransaction requis');
    }
    if (this.data.montant === undefined || this.data.montant === null) {
      throw new Error('TransactionBuilder: montant requis');
    }

    // Nullifier les optionnels absents
    return {
      reunionId: this.data.reunionId || null,
      typeTransaction: this.data.typeTransaction,
      exerciceMembreId: this.data.exerciceMembreId || null,
      projetId: this.data.projetId || null,
      montant: this.data.montant,
      reference: this.data.reference,
      description: this.data.description || null,
      statut: this.data.statut,
      modeCreation: this.data.modeCreation,
      creeParUtilisateurId: this.data.creeParUtilisateurId || null,
      creeParExerciceMembreId: this.data.creeParExerciceMembreId || null,
      autoSoumis: this.data.autoSoumis,
      soumisLe: this.data.soumisLe || null,
    };
  }

  // =========================================================================
  // Privé
  // =========================================================================

  private generateReference(type: TypeTransaction): string {
    const prefix: Record<string, string> = {
      [TypeTransaction.INSCRIPTION]: 'INS',
      [TypeTransaction.COTISATION]: 'COT',
      [TypeTransaction.EPARGNE]: 'EPG',
      [TypeTransaction.POT]: 'POT',
      [TypeTransaction.SECOURS]: 'SEC',
      [TypeTransaction.DECAISSEMENT_PRET]: 'DPR',
      [TypeTransaction.REMBOURSEMENT_PRET]: 'RPR',
      [TypeTransaction.DEPENSE_SECOURS]: 'DSC',
      [TypeTransaction.PENALITE]: 'PEN',
      [TypeTransaction.PROJET]: 'PRJ',
      [TypeTransaction.AUTRE]: 'AUT',
    };
    const pfx = prefix[type] || 'TRX';
    const ts = Date.now().toString(36).toUpperCase();
    const uid = uuidv4().substring(0, 4).toUpperCase();
    return `${pfx}-${ts}-${uid}`;
  }
}
