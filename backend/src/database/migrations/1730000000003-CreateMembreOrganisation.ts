import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMembreOrganisation1730000000003 implements MigrationInterface {
  name = 'CreateMembreOrganisation1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'membre_organisation',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'organisation_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'utilisateur_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ORG_ADMIN', 'ORG_MEMBRE', 'ORG_VIEWER'],
            default: "'ORG_MEMBRE'",
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE'],
            default: "'ACTIVE'",
          },
          {
            name: 'invite_par_utilisateur_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'cree_le',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'modifie_le',
            type: 'timestamp',
            isNullable: true,
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          { name: 'UQ_membre_organisation_user', columnNames: ['organisation_id', 'utilisateur_id'] },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'membre_organisation',
      new TableIndex({ name: 'IDX_membre_organisation_org_id', columnNames: ['organisation_id'] })
    );

    await queryRunner.createIndex(
      'membre_organisation',
      new TableIndex({ name: 'IDX_membre_organisation_user_id', columnNames: ['utilisateur_id'] })
    );

    await queryRunner.createForeignKey(
      'membre_organisation',
      new TableForeignKey({
        name: 'FK_membre_organisation_organisation',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisation',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'membre_organisation',
      new TableForeignKey({
        name: 'FK_membre_organisation_utilisateur',
        columnNames: ['utilisateur_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'utilisateur',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'membre_organisation',
      new TableForeignKey({
        name: 'FK_membre_organisation_invite_par',
        columnNames: ['invite_par_utilisateur_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'utilisateur',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('membre_organisation');
  }
}
