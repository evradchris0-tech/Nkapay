import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInvitationOrganisation1730000000004 implements MigrationInterface {
  name = 'CreateInvitationOrganisation1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invitation_organisation',
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
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'role_propose',
            type: 'enum',
            enum: ['ORG_ADMIN', 'ORG_MEMBRE'],
            default: "'ORG_MEMBRE'",
          },
          {
            name: 'token',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'expire_le',
            type: 'timestamp',
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['EN_ATTENTE', 'ACCEPTEE', 'EXPIREE', 'REVOQUEE'],
            default: "'EN_ATTENTE'",
          },
          {
            name: 'cree_par_utilisateur_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'cree_le',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'invitation_organisation',
      new TableIndex({ name: 'IDX_invitation_organisation_token', columnNames: ['token'] })
    );

    await queryRunner.createIndex(
      'invitation_organisation',
      new TableIndex({ name: 'IDX_invitation_organisation_org', columnNames: ['organisation_id'] })
    );

    await queryRunner.createForeignKey(
      'invitation_organisation',
      new TableForeignKey({
        name: 'FK_invitation_organisation_organisation',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisation',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'invitation_organisation',
      new TableForeignKey({
        name: 'FK_invitation_organisation_createur',
        columnNames: ['cree_par_utilisateur_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'utilisateur',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invitation_organisation');
  }
}
