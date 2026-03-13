#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Nkapay — Newman Test Runner
 * ═══════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node run-tests.js                     → Run ALL folders in a single run
 *   node run-tests.js health              → Run only "Health" folder
 *   node run-tests.js auth users tontines → Run specific folders (single run)
 *   node run-tests.js --html              → Generate HTML report
 *   node run-tests.js --list              → List all available folders
 *
 * All selected folders run in a SINGLE Newman run so variables
 * (token, IDs) are shared between folders.
 *
 * Folder names are matched case-insensitively, partial match, emoji-stripped.
 */

const newman = require('newman');
const path = require('path');
const fs = require('fs');
const http = require('http');
const cp = require('child_process');

const COLLECTION = path.join(__dirname, 'doc.json');
const REPORT_DIR = path.join(__dirname, 'reports');

// ── Credentials de l'utilisateur test dédié ──
const TEST_PHONE = '237688888888';
const TEST_PASS = 'TestPass2025!';

// ── Reset le mot de passe du user test en DB avant chaque run ──
async function resetTestUserPassword() {
    try {
        const bcrypt = require('bcrypt');
        const mysql = require('mysql2/promise');
        const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'nkapay' });
        const hash = await bcrypt.hash(TEST_PASS, 10);
        const [r] = await db.execute(
            'UPDATE utilisateur SET password_hash=?, doit_changer_mot_de_passe=0, supprime_le=NULL WHERE telephone1=?',
            [hash, TEST_PHONE]
        );
        await db.end();
        if (r.affectedRows > 0) {
            console.log(`  🔑 Mot de passe de ${TEST_PHONE} réinitialisé à TestPass2025!`);
        } else {
            console.log(`  ⚠️  Utilisateur test ${TEST_PHONE} introuvable en DB`);
        }
    } catch (e) {
        console.log(`  ⚠️  Reset mot de passe ignoré: ${e.message}`);
    }
}

// ── Pre-load real IDs from DB so Newman can use them as collection variables ──
async function loadRealIds() {
    // 0. Reset le mot de passe du user test & vérifier les associations (Adhésion, etc.)
    await resetTestUserPassword();

    try {
        console.log('  ⏳ Configuration des données minimales pour le test...');
        cp.execSync('node seed-test-data.js', { stdio: 'pipe' });
    } catch (e) {
        console.log(`  ⚠️  Seed-test-data échoué: ${e.message}`);
    }

    // 1. Login to get token + userId
    const loginBody = JSON.stringify({ identifiant: TEST_PHONE, motDePasse: TEST_PASS });
    const loginRes = await new Promise(r => {
        const q = http.request(
            {
                hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
            },
            res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { r(JSON.parse(d)); } catch { r({}); } }); }
        );
        q.on('error', () => r({})); q.write(loginBody); q.end();
    });

    const token = loginRes?.data?.accessToken;
    const userId = loginRes?.data?.utilisateur?.id;
    if (!token) { console.log('  ⚠️  Could not pre-load IDs (server not ready or wrong credentials)'); return {}; }

    function get(p) {
        return new Promise(r => {
            http.request(
                {
                    hostname: 'localhost', port: 3000, path: p, method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + token }
                },
                res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { r(JSON.parse(d)); } catch { r({}); } }); }
            ).on('error', () => r({})).end();
        });
    }

    // 2. Fetch via API: general lists (pas user-spécifique)
    const [tontinesR, tonTypesR, exercicesR, reunionsR, adhesionsR] = await Promise.all([
        get('/api/v1/tontines?limit=1'),
        get('/api/v1/tontines/types?limit=1'),
        get('/api/v1/exercices?limit=1'),
        get('/api/v1/reunions?limit=1'),
        get('/api/v1/tontines/adhesions?limit=1'),  // liste générale
    ]);

    const tontineId = tontinesR?.data?.[0]?.id || tontinesR?.data?.items?.[0]?.id;
    const nomCourt = tontinesR?.data?.[0]?.nomCourt || tontinesR?.data?.items?.[0]?.nomCourt;
    const tontineTypeId = tonTypesR?.data?.[0]?.id || tonTypesR?.data?.items?.[0]?.id;
    const exerciceId = exercicesR?.data?.[0]?.id || exercicesR?.data?.items?.[0]?.id;
    const reunionId = reunionsR?.data?.[0]?.id || reunionsR?.data?.items?.[0]?.id;
    const adhesionId = adhesionsR?.data?.[0]?.id || adhesionsR?.data?.items?.[0]?.id;

    const [emR, projetsR, transR, presR, pretsR] = await Promise.all([
        exerciceId ? get('/api/v1/exercices-membres/exercice/' + exerciceId + '?limit=1') : Promise.resolve({}),
        get('/api/v1/projets?limit=1'),
        get('/api/v1/transactions?limit=1'),
        reunionId ? get('/api/v1/presences/reunion/' + reunionId + '?limit=1') : Promise.resolve({}),
        get('/api/v1/prets?limit=1'),
    ]);

    const exerciceMembreId = emR?.data?.[0]?.id || emR?.data?.items?.[0]?.id;
    const projetId = projetsR?.data?.[0]?.id || projetsR?.data?.items?.[0]?.id;
    const transactionId = transR?.data?.[0]?.id || transR?.data?.items?.[0]?.id;
    const transactionRef = transR?.data?.[0]?.reference || transR?.data?.items?.[0]?.reference;
    const presenceId = presR?.data?.[0]?.id || presR?.data?.items?.[0]?.id;
    const pretId = pretsR?.data?.[0]?.id || pretsR?.data?.items?.[0]?.id;

    // 3. Charger TOUS les IDs manquants directement depuis MySQL
    let ids = {
        userId, tontineId, nomCourt, tontineTypeId, adhesionId,
        exerciceId, reunionId, exerciceMembreId, projetId,
        transactionId, transactionRef, presenceId, pretId,
    };

    try {
        const mysql = require('mysql2/promise');
        const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'nkapay' });

        async function first(sql) {
            try {
                const [rows] = await db.execute(sql);
                return rows[0] || null;
            } catch (e) {
                console.log(`  ⚠️  SQL ignore: ${e.message.substring(0, 60)}...`);
                return null;
            }
        }

        const rd = await first('SELECT id, cle FROM rule_definition ORDER BY ordre_affichage LIMIT 1');
        const op = await first('SELECT id, code FROM operateur_paiement LIMIT 1');
        const tp = await first('SELECT id FROM type_penalite LIMIT 1');
        const tes = await first('SELECT id FROM type_evenement_secours LIMIT 1');
        const pen = await first('SELECT id FROM penalite  LIMIT 1');
        const dist = await first('SELECT id FROM distribution LIMIT 1');
        const rem = await first('SELECT id FROM remboursement_pret LIMIT 1');
        const es = await first('SELECT id FROM evenement_secours LIMIT 1');
        const da = await first('SELECT id FROM demande_adhesion LIMIT 1');
        const cas = await first('SELECT id FROM cassation LIMIT 1');
        const bsd = await first('SELECT id FROM bilan_secours_du_exercice LIMIT 1') || await first('SELECT id FROM bilan_secours_du LIMIT 1');
        const ton = !tontineId ? await first('SELECT id, nom_court FROM tontine WHERE supprime_le IS NULL LIMIT 1') : null;

        // IDs complémentaires
        const cot = await first('SELECT id FROM cotisation_due_mensuelle LIMIT 1');
        const epa = await first('SELECT id FROM epargne_due_mensuelle LIMIT 1');
        const pot = await first('SELECT id FROM pot_du_mensuel LIMIT 1');
        const insc = await first('SELECT id FROM inscription_due_exercice LIMIT 1');
        const lang = await first('SELECT id FROM langue LIMIT 1');
        const regT = await first('SELECT id FROM regle_tontine LIMIT 1');
        const regE = await first('SELECT id FROM regle_exercice LIMIT 1');
        const sda = await first('SELECT id FROM secours_du_annuel LIMIT 1');
        // Fallbacks directs DB (avec filtre soft-delete)
        const adh = await first('SELECT id FROM adhesion_tontine WHERE supprime_le IS NULL LIMIT 1');
        const pres = await first('SELECT id FROM presence_reunion LIMIT 1');
        const pret = await first('SELECT id FROM pret LIMIT 1');

        ids = {
            ...ids,
            ruleDefId: rd?.id,
            ruleKey: rd?.cle,
            operateurId: op?.id,
            operateurCode: op?.code,
            typePenaliteId: tp?.id,
            typeSecoursId: tes?.id,
            penaliteId: pen?.id,
            distributionId: dist?.id,
            remboursementId: rem?.id,
            evenementSecoursId: es?.id,
            demandeAdhesionId: da?.id,
            cassationId: cas?.id,
            bilanId: bsd?.id,
            secoursDuId: sda?.id || bsd?.id,
            cotisationId: cot?.id,
            epargneId: epa?.id,
            potId: pot?.id,
            inscriptionId: insc?.id,
            langueId: lang?.id,
            regleTontineId: regT?.id,
            regleExerciceId: regE?.id,
            // Fallbacks DB pour IDs non obtenus via API
            adhesionId: ids.adhesionId || adh?.id,
            presenceId: ids.presenceId || pres?.id,
            pretId: ids.pretId || pret?.id,
            // Fallback tontine depuis DB
            tontineId: ids.tontineId || ton?.id,
            nomCourt: ids.nomCourt || ton?.nom_court,
        };


        await db.end();
    } catch (e) {
        console.log('  ⚠️  DB direct query error:', e.message);
    }

    const loaded = Object.entries(ids).filter(([, v]) => v).map(([k]) => k);
    console.log(`  🔗 Variables pré-chargées (${loaded.length}): ${loaded.join(', ')}`);
    return ids;
}




// ── Parse args ──
const args = process.argv.slice(2);
const wantHtml = args.includes('--html');
const wantList = args.includes('--list');
const folderArgs = args.filter(a => !a.startsWith('--'));

// ── Load collection ──
const collection = JSON.parse(fs.readFileSync(COLLECTION, 'utf8'));
const allFolders = collection.item.map(f => f.name);

// Strip emojis for matching
function stripEmoji(s) {
    return s.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u200D\uFE0F\u20E3]/gu, '').trim();
}

if (wantList) {
    console.log('\n📋 Dossiers disponibles:\n');
    allFolders.forEach((f, i) => {
        const count = collection.item[i].item?.length || 0;
        console.log(`  ${String(i + 1).padStart(2)}. ${f} (${count} requêtes)`);
    });
    console.log(`\n  Total: ${allFolders.length} dossiers\n`);
    process.exit(0);
}

// ── Match requested folders ──
function findFolder(query) {
    const q = query.toLowerCase();
    let match = allFolders.find(f => stripEmoji(f).toLowerCase() === q);
    if (match) return match;
    match = allFolders.find(f => stripEmoji(f).toLowerCase().includes(q));
    if (match) return match;
    const idx = parseInt(q) - 1;
    if (idx >= 0 && idx < allFolders.length) return allFolders[idx];
    return null;
}

let foldersToRun;
if (folderArgs.length > 0) {
    foldersToRun = [];
    for (const arg of folderArgs) {
        const found = findFolder(arg);
        if (!found) {
            console.error(`❌ Dossier introuvable: "${arg}"`);
            console.error(`   Essayez: node run-tests.js --list`);
            process.exit(1);
        }
        foldersToRun.push(found);
    }
} else {
    foldersToRun = [...allFolders];
}

// ── Build a filtered collection containing only selected folders ──
function buildFilteredCollection(folders) {
    const filtered = JSON.parse(JSON.stringify(collection));
    filtered.item = filtered.item.filter(f => folders.includes(f.name));
    return filtered;
}

// ── Run a single Newman execution with all selected folders ──
async function runAll(folders) {
    // Pre-load real IDs from the live server
    console.log('\n  🔍 Chargement des IDs réels...');
    const realIds = await loadRealIds();

    const filteredCollection = buildFilteredCollection(folders);
    let totalRequests = 0;
    filteredCollection.item.forEach(f => { totalRequests += f.item?.length || 0; });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🧪 Nkapay API — Newman Test Runner');
    console.log(`  📂 ${folders.length} dossier(s) — ${totalRequests} requêtes`);
    console.log('  🔗 Single-run mode (variables partagées entre dossiers)');
    if (wantHtml) console.log(`  📄 Rapports HTML → ${REPORT_DIR}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Dossiers:');
    folders.forEach((f, i) => { console.log(`    ${i + 1}. ${f}`); });
    console.log('');

    // Build Newman envVar from pre-loaded IDs
    const envVar = Object.entries(realIds)
        .filter(([, v]) => v)
        .map(([key, value]) => ({ key, value: String(value), enabled: true }));

    // Also inject as globals (highest priority in Newman)
    const globalVar = envVar.map(v => ({ ...v }));

    const opts = {
        collection: filteredCollection,
        envVar,
        globalVar,
        delayRequest: 100,
        timeoutRequest: 10000,
        reporters: ['cli'],
    };

    if (wantHtml) {
        if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        opts.reporters.push('htmlextra');
        opts.reporter = {
            htmlextra: {
                export: path.join(REPORT_DIR, `api-test-report_${timestamp}.html`),
                title: 'Nkapay API — Test Report',
                darkTheme: true,
                showOnlyFails: false,
                noSyntaxHighlighting: false,
                showEnvironmentData: true,
                showGlobalData: true,
                omitRequestBodies: false,
                omitResponseBodies: false,
            },
        };
    }

    return new Promise((resolve) => {
        const startTime = Date.now();

        newman.run(opts, (err, summary) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            if (err) {
                console.error(`\n❌ Newman fatal error: ${err.message}`);
                resolve(1);
                return;
            }

            const stats = summary.run.stats;
            const totalAssertions = stats.assertions.total;
            const totalFailed = stats.assertions.failed;
            const totalPassed = totalAssertions - totalFailed;

            console.log('\n');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('  📊 RÉSUMÉ');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`  📊 Requêtes     : ${stats.requests.total}`);
            console.log(`  🧪 Assertions   : ${totalPassed}/${totalAssertions} passed`);
            console.log(`  ⏱️  Temps        : ${elapsed}s`);
            console.log(`  ${totalFailed === 0 ? '✅ ALL PASSED!' : `❌ ${totalFailed} FAILED`}`);
            console.log('═══════════════════════════════════════════════════════════\n');

            if (wantHtml && opts.reporter?.htmlextra?.export) {
                console.log(`📄 Rapport HTML: ${opts.reporter.htmlextra.export}\n`);
            }

            resolve(totalFailed > 0 ? 1 : 0);
        });
    });
}

runAll(foldersToRun).then(code => {
    process.exit(code);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});