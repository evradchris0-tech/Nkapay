import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class UpdateSecoursSchema1708226000000 implements MigrationInterface {
  name = 'UpdateSecoursSchema1708226000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create piece_justificative_secours table
    await queryRunner.createTable(
      new Table({
        name: 'piece_justificative_secours',
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
            name: 'evenement_secours_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'type_piece',
            type: 'enum',
            enum: [
              'CERTIFICAT_MARIAGE',
              'ACTE_DECES',
              'CERTIFICAT_NAISSANCE',
              'CERTIFICAT_MEDICAL',
              'FACTURE',
              'PHOTO',
              'AUTRE',
            ],
            default: "'AUTRE'",
          },
          {
            name: 'nom_fichier',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'chemin_fichier',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'type_mime',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'taille_octets',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'commentaire',
            type: 'text',
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

    // Add FK for piece_justificative_secours -> evenement_secours
    await queryRunner.createForeignKey(
      'piece_justificative_secours',
      new TableForeignKey({
        columnNames: ['evenement_secours_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'evenement_secours',
        onDelete: 'CASCADE',
      })
    );

    // 2. Add columns to evenement_secours table
    await queryRunner.addColumns('evenement_secours', [
      new TableColumn({
        name: 'reunion_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'montant_decaisse',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'date_decaissement',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Add FK for evenement_secours -> reunion
    await queryRunner.createForeignKey(
      'evenement_secours',
      new TableForeignKey({
        columnNames: ['reunion_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'reunion',
        onDelete: 'SET NULL',
      })
    );

    // Add Index for reunion_id
    // await queryRunner.query(`CREATE INDEX IDX_EVENEMENT_SECOURS_REUNION_ID ON evenement_secours(reunion_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK evenement_secours -> reunion
    const evenementTable = await queryRunner.getTable('evenement_secours');
    if (evenementTable) {
      const reunionFk = evenementTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('reunion_id') !== -1
      );
      if (reunionFk) await queryRunner.dropForeignKey('evenement_secours', reunionFk);
    }

    // Drop columns from evenement_secours
    await queryRunner.dropColumn('evenement_secours', 'date_decaissement');
    await queryRunner.dropColumn('evenement_secours', 'montant_decaisse');
    await queryRunner.dropColumn('evenement_secours', 'reunion_id');

    // Drop table piece_justificative_secours
    await queryRunner.dropTable('piece_justificative_secours');
  }
}
