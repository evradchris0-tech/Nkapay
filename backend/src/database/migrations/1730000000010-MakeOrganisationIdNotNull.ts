import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Après backfill (migration 009), rend organisation_id NOT NULL sur tontine.
 * Point de non-retour : toutes les tontines doivent avoir une organisation.
 */
export class MakeOrganisationIdNotNull1730000000010 implements MigrationInterface {
  name = 'MakeOrganisationIdNotNull1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérification de sécurité : aucune tontine sans organisation
    const [result] = await queryRunner.query(
      `SELECT COUNT(*) AS cnt FROM tontine WHERE organisation_id IS NULL`
    );
    if (parseInt(result.cnt, 10) > 0) {
      throw new Error(
        `${result.cnt} tontines sans organisation_id — exécuter la migration 009 d'abord`
      );
    }

    await queryRunner.changeColumn(
      'tontine',
      'organisation_id',
      new TableColumn({
        name: 'organisation_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'tontine',
      'organisation_id',
      new TableColumn({
        name: 'organisation_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );
  }
}
