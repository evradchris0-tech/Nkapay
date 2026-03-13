import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddEmailToUtilisateur1730000000006 implements MigrationInterface {
  name = 'AddEmailToUtilisateur1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'utilisateur',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
        comment: 'Email pour invitations et notifications',
      })
    );

    await queryRunner.createIndex(
      'utilisateur',
      new TableIndex({ name: 'IDX_utilisateur_email', columnNames: ['email'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('utilisateur', 'IDX_utilisateur_email');
    await queryRunner.dropColumn('utilisateur', 'email');
  }
}
