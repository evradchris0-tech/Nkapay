import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration de backfill :
 * Crée une organisation "Principale" pour toutes les tontines existantes
 * et assigne les super-admins comme ORG_ADMIN de cette organisation.
 */
export class BackfillDefaultOrganisation1730000000009 implements MigrationInterface {
  name = 'BackfillDefaultOrganisation1730000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Récupérer le plan LEGACY
    const [legacyPlan] = await queryRunner.query(
      `SELECT id FROM plan_abonnement WHERE code = 'LEGACY' LIMIT 1`
    );
    if (!legacyPlan) throw new Error('Plan LEGACY non trouvé — migration 001 manquante');

    const planId = legacyPlan.id;

    // 2. Créer l'organisation principale si elle n'existe pas encore
    const [existing] = await queryRunner.query(
      `SELECT id FROM organisation WHERE slug = 'organisation-principale' LIMIT 1`
    );

    let orgId: string;
    if (existing) {
      orgId = existing.id;
    } else {
      const newId = await queryRunner.query(`SELECT UUID() AS id`);
      orgId = newId[0].id;
      await queryRunner.query(
        `INSERT INTO organisation (id, nom, slug, email_contact, statut, plan_abonnement_id, abonnement_debut_le)
         VALUES (?, 'Organisation Principale', 'organisation-principale', 'admin@nkapay.local', 'ACTIVE', ?, CURDATE())`,
        [orgId, planId]
      );
    }

    // 3. Assigner toutes les tontines sans organisation à l'org principale
    await queryRunner.query(
      `UPDATE tontine SET organisation_id = ? WHERE organisation_id IS NULL`,
      [orgId]
    );

    // 4. Créer les membres ORG_ADMIN pour les super-admins existants
    const superAdmins = await queryRunner.query(
      `SELECT id FROM utilisateur WHERE est_super_admin = true`
    );

    for (const admin of superAdmins) {
      const [alreadyMembre] = await queryRunner.query(
        `SELECT id FROM membre_organisation WHERE organisation_id = ? AND utilisateur_id = ? LIMIT 1`,
        [orgId, admin.id]
      );
      if (!alreadyMembre) {
        await queryRunner.query(
          `INSERT INTO membre_organisation (id, organisation_id, utilisateur_id, role, statut)
           VALUES (UUID(), ?, ?, 'ORG_ADMIN', 'ACTIVE')`,
          [orgId, admin.id]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Retirer l'organisation_id des tontines migrées
    await queryRunner.query(
      `UPDATE tontine t
       INNER JOIN organisation o ON t.organisation_id = o.id
       SET t.organisation_id = NULL
       WHERE o.slug = 'organisation-principale'`
    );

    // Supprimer les membres de l'org principale
    await queryRunner.query(
      `DELETE mo FROM membre_organisation mo
       INNER JOIN organisation o ON mo.organisation_id = o.id
       WHERE o.slug = 'organisation-principale'`
    );

    // Supprimer l'organisation principale
    await queryRunner.query(
      `DELETE FROM organisation WHERE slug = 'organisation-principale'`
    );
  }
}
