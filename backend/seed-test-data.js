/**
 * seed-test-data.js
 * 
 * S'assure que toutes les données de référence nécessaires aux tests existent.
 * Exécuté AVANT chaque run Newman pour restaurer ce que les tests DELETE détruisent.
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

const TEST_PHONE = '237688888888';

async function seedTestData() {
    let db;
    try {
        db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'nkapay' });

        async function first(sql, params = []) {
            try {
                const [rows] = await db.execute(sql, params);
                return rows[0] || null;
            } catch (e) {
                console.log(`  ⚠️  SQL ignore: ${e.message.substring(0, 60)}`);
                return null;
            }
        }

        async function exec(sql, params = []) {
            try {
                await db.execute(sql, params);
                return true;
            } catch (e) {
                console.log(`  ⚠️  SQL exec ignore: ${e.message.substring(0, 80)}`);
                return false;
            }
        }

        // 1. Utilisateur test
        const user = await first('SELECT id FROM utilisateur WHERE telephone1 = ?', [TEST_PHONE]);
        if (!user) {
            console.log('  ℹ️  Utilisateur test non trouvé. Fin.');
            return;
        }
        const userId = user.id;

        // 2. Tontine
        const tontine = await first('SELECT id FROM tontine LIMIT 1');
        if (!tontine) { console.log('  ℹ️  Aucune tontine trouvée.'); return; }
        const tontineId = tontine.id;

        // 3. Adhésion (tontine_tontine)
        let adhesion = await first('SELECT id FROM adhesion_tontine WHERE utilisateur_id = ? AND tontine_id = ? AND supprime_le IS NULL', [userId, tontineId]);
        if (!adhesion) {
            const aid = crypto.randomUUID();
            await exec(
                `INSERT INTO adhesion_tontine (id, tontine_id, utilisateur_id, matricule, role, statut, date_adhesion_tontine) VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
                [aid, tontineId, userId, `TST-${Math.floor(Math.random() * 9000) + 1000}`, 'MEMBRE', 'ACTIVE']
            );
            adhesion = { id: aid };
            console.log('  🌱 Adhésion créée pour le user test.');
        }
        const adhesionId = adhesion.id;

        // 4. Exercice
        const exercice = await first('SELECT id FROM exercice ORDER BY date_debut DESC LIMIT 1');
        if (!exercice) return;
        const exerciceId = exercice.id;

        // 5. Exercice membre
        let exMembre = await first('SELECT id FROM exercice_membre WHERE adhesion_id = ? AND exercice_id = ?', [adhesionId, exerciceId]);
        if (!exMembre) {
            const eid = crypto.randomUUID();
            await exec(
                `INSERT INTO exercice_membre (id, adhesion_id, exercice_id, solde_cotisation, num_ordre, compte_actif, statut_participation) VALUES (?, ?, ?, 0, 999, 1, 'PARTICIPE')`,
                [eid, adhesionId, exerciceId]
            );
            exMembre = { id: eid };
            console.log('  🌱 Exercice membre créé.');
        }

        // 6. Réunion + Présence
        const reunion = await first('SELECT id FROM reunion ORDER BY date_reunion DESC LIMIT 1');
        if (reunion) {
            const presence = await first('SELECT id FROM presence_reunion WHERE reunion_id = ? AND exercice_membre_id = ?', [reunion.id, exMembre.id]);
            if (!presence) {
                const pid = crypto.randomUUID();
                await exec(
                    `INSERT INTO presence_reunion (id, reunion_id, exercice_membre_id, statut, mode_paiement) VALUES (?, ?, ?, 'PRESENT', 'MOMO')`,
                    [pid, reunion.id, exMembre.id]
                );
                console.log('  🌱 Présence créée pour le user test.');
            }
        }

        // 7. Opérateur de paiement (peut être supprimé par les tests)
        const operateur = await first('SELECT id FROM operateur_paiement LIMIT 1');
        if (!operateur) {
            const oid = crypto.randomUUID();
            await exec(
                `INSERT INTO operateur_paiement (id, nom, code, numero_court, est_actif) VALUES (?, ?, ?, ?, ?)`,
                [oid, 'MTN MoMo', 'MTN', '237', 1]
            );
            console.log('  🌱 Opérateur paiement (MTN) recréé.');
        }

        // 8. Langue (peut être vide)
        const langue = await first('SELECT id FROM langue LIMIT 1');
        if (!langue) {
            const lid = crypto.randomUUID();
            await exec(
                `INSERT INTO langue (id, code, nom, est_defaut) VALUES (?, ?, ?, ?)`,
                [lid, 'fr', 'Français', 1]
            );
            console.log('  🌱 Langue FR créée.');
        }

        console.log('  ✅ Données de test vérifiées/restaurées.');
    } catch (error) {
        console.error(`  ❌ Seed erreur: ${error.message}`);
    } finally {
        if (db) await db.end();
    }
}

seedTestData();
