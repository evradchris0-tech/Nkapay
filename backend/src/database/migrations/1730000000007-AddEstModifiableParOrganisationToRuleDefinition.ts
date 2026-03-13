import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEstModifiableParOrganisationToRuleDefinition1730000000007
  implements MigrationInterface
{
  name = 'AddEstModifiableParOrganisationToRuleDefinition1730000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'rule_definition',
      new TableColumn({
        name: 'est_modifiable_par_organisation',
        type: 'boolean',
        default: true,
        comment: "Si true, chaque organisation peut définir sa propre valeur par défaut",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('rule_definition', 'est_modifiable_par_organisation');
  }
}
