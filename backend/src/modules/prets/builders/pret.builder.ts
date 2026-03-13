/**
 * PretBuilder — Design Pattern: Builder
 *
 * Construit des objets Prêt avec calcul automatique des intérêts
 * et du montant total dû.
 *
 * Usage:
 *   const pret = new PretBuilder()
 *     .forMembre(exerciceMembreId)
 *     .atReunion(reunionId)
 *     .withCapital(500000)
 *     .withTaux(0.05)
 *     .withDuree(6)
 *     .withCommentaire('Prêt pour commerce')
 *     .build();
 */

import { StatutPret } from '../entities/pret.entity';

export class PretBuilder {
  private data: Record<string, any> = {};

  constructor() {
    this.data.statut = StatutPret.DEMANDE;
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

  withCapital(montant: number): this {
    if (montant <= 0) throw new Error('Le capital doit être positif');
    this.data.montantCapital = montant;
    return this;
  }

  withTaux(taux: number): this {
    if (taux < 0) throw new Error("Le taux d'intérêt ne peut être négatif");
    this.data.tauxInteret = taux;
    return this;
  }

  withDuree(mois: number): this {
    if (mois < 1) throw new Error("La durée doit être d'au moins 1 mois");
    this.data.dureeMois = mois;
    return this;
  }

  withCommentaire(commentaire: string): this {
    this.data.commentaire = commentaire;
    return this;
  }

  // =========================================================================
  // Construction finale — calculs automatiques des intérêts
  // =========================================================================

  build(): Record<string, any> {
    // Validations obligatoires
    if (!this.data.exerciceMembreId) {
      throw new Error('PretBuilder: exerciceMembreId requis');
    }
    if (!this.data.reunionId) {
      throw new Error('PretBuilder: reunionId requis');
    }
    if (this.data.montantCapital === undefined) {
      throw new Error('PretBuilder: montantCapital requis');
    }
    if (this.data.tauxInteret === undefined) {
      throw new Error('PretBuilder: tauxInteret requis (utiliser withTaux())');
    }
    if (this.data.dureeMois === undefined) {
      throw new Error('PretBuilder: dureeMois requis');
    }

    // Calculs automatiques (intérêt flat)
    const montantInteret =
      (this.data.montantCapital * this.data.tauxInteret * this.data.dureeMois) / 12;
    const montantTotalDu = this.data.montantCapital + montantInteret;

    return {
      reunionId: this.data.reunionId,
      exerciceMembreId: this.data.exerciceMembreId,
      montantCapital: this.data.montantCapital,
      tauxInteret: this.data.tauxInteret,
      montantInteret,
      montantTotalDu,
      dureeMois: this.data.dureeMois,
      capitalRestant: this.data.montantCapital,
      statut: this.data.statut,
      commentaire: this.data.commentaire || null,
    };
  }
}
