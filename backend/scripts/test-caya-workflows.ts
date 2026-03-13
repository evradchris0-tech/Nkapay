/// <reference types="node" />

/**
 * 🧪 CAYA INTEGRATION TEST — Workflows complets
 */

import * as http from 'http';
import * as https from 'https';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';
const parsedBase = new URL(BASE_URL);

// ============================================================================
// HTTP Helper
// ============================================================================

let authToken = '';

async function httpRequest(method: string, path: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const fullPath = path.startsWith('/api/v1') ? path : `/api/v1${path}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const payload = body ? JSON.stringify(body) : undefined;
        if (payload) headers['Content-Length'] = Buffer.byteLength(payload).toString();

        const opts: http.RequestOptions = {
            hostname: parsedBase.hostname,
            port: parseInt(parsedBase.port || '3000'),
            path: fullPath,
            method,
            headers,
        };

        const transport = parsedBase.protocol === 'https:' ? https : http;

        const req = transport.request(opts, (res) => {
            let data = '';
            res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const ok = res.statusCode! >= 200 && res.statusCode! < 400;
                    if (!ok) {
                        console.error(`   🛑 ${method} ${fullPath} → ${res.statusCode} ${JSON.stringify(json)}`);
                    }
                    resolve({ error: !ok, status: res.statusCode, data: json });
                } catch {
                    if (res.statusCode! >= 400) {
                        console.error(`   🛑 ${method} ${fullPath} → ${res.statusCode} [Non-JSON Response]`);
                    }
                    resolve({ error: true, status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            console.error(`   🛑 Network Error: ${err.message}`);
            reject(err);
        });
        if (payload) req.write(payload);
        req.end();
    });
}

function getData(res: any) {
    if (res && res.data && res.data.success !== undefined) {
        return res.data.data;
    }
    return res.data;
}

// ============================================================================
// Logging & Assertions
// ============================================================================

function log(emoji: string, msg: string) {
    console.log(`${emoji}  ${msg}`);
}

function section(title: string) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(70)}`);
}

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`   ❌ ASSERTION FAILED: ${msg}`);
        process.exit(1);
    }
    log('✅', msg);
}

// ============================================================================
// State
// ============================================================================

const state: Record<string, any> = {};

// ============================================================================
// Test Steps
// ============================================================================

async function step0_auth() {
    section('ÉTAPE 0 — Authentification Super Admin');
    const creds = { identifiant: '+237699999999', motDePasse: 'SuperAdmin@2025!' };
    let res = await httpRequest('POST', '/auth/login', creds);

    if (res.error) {
        log('🔄', 'Tentative avec format court...');
        res = await httpRequest('POST', '/auth/login', { identifiant: '699999999', motDePasse: 'SuperAdmin@2025!' });
    }

    const data = getData(res);
    if (!res.error && data?.accessToken) {
        authToken = data.accessToken;
        log('✅', `Connecté en tant que ${data.utilisateur?.prenom} ${data.utilisateur?.nom}`);
    } else {
        console.error('❌ Authentification échouée');
        process.exit(1);
    }
}

async function step0_types() {
    section('ÉTAPE 0.5 — Types de Tontine');
    const res = await httpRequest('GET', '/tontines/types');
    const data = getData(res);
    state.tontineTypes = Array.isArray(data) ? data : [];
    if (state.tontineTypes.length === 0) {
        log('➕', 'Création du type Standard...');
        const createRes = await httpRequest('POST', '/tontines/types', { code: 'T-STD', libelle: 'Standard' });
        state.tontineTypes = [getData(createRes)];
    }
    assert(state.tontineTypes.length > 0, 'Types de tontine prêts');
}

async function step1_tontines() {
    section('ÉTAPE 1 — Tontines');
    const typeId = state.tontineTypes[0].id;
    const targets = [
        { nom: 'Club des Amis de Yaoundé', nomCourt: 'CAYA', tontineTypeId: typeId },
        { nom: 'Coopérative des Travailleurs', nomCourt: 'COTONAF', tontineTypeId: typeId },
        { nom: 'Solidarité Jeune', nomCourt: 'SJE', tontineTypeId: typeId },
    ];

    state.tontines = [];
    for (const t of targets) {
        const res = await httpRequest('POST', '/tontines', t);
        if (!res.error) {
            state.tontines.push(getData(res));
            log('✅', `Créée: ${t.nomCourt}`);
        } else {
            const listRes = await httpRequest('GET', '/tontines');
            const found = (getData(listRes) || []).find((x: any) => x.nomCourt === t.nomCourt);
            if (found) {
                state.tontines.push(found);
                log('🔄', `Récupérée: ${t.nomCourt}`);
            }
        }
    }
    assert(state.tontines.length >= 3, 'Tontines prêtes');
}

async function step2_utilisateurs() {
    section('ÉTAPE 2 — Utilisateurs');
    state.utilisateurs = [];
    for (let i = 1; i <= 10; i++) {
        const tel = `+2376700000${i.toString().padStart(2, '0')}`;
        const payload = {
            prenom: `User${i}`, nom: `Test`, telephone1: tel,
            password: 'User@1234'
        };
        const res = await httpRequest('POST', '/utilisateurs', payload);
        if (!res.error) {
            state.utilisateurs.push(getData(res));
            log('✅', `Créé: ${payload.prenom}`);
        } else {
            const listRes = await httpRequest('GET', '/utilisateurs?limit=100');
            // Paginated response: data is inside .data array
            const listData = getData(listRes);
            const usersArr = Array.isArray(listData) ? listData : (listData?.data || []);
            const found = usersArr.find((u: any) => u.telephone1 === tel);
            if (found) {
                state.utilisateurs.push(found);
                log('🔄', `Récupéré: ${payload.prenom}`);
            }
        }
    }
    assert(state.utilisateurs.length >= 10, '10 utilisateurs disponibles');
}

async function step3_exercice_et_adhesions() {
    section('ÉTAPE 3 — Exercice & Adhésions CAYA');
    const caya = state.tontines.find((t: any) => t.nomCourt === 'CAYA');

    // 1. Exercice
    const exPayload = {
        tontineId: caya.id, libelle: 'Exercice 2025-2026',
        anneeDebut: 2025, moisDebut: 10, anneeFin: 2026, moisFin: 9, dureeMois: 12
    };
    const exRes = await httpRequest('POST', '/exercices', exPayload);
    state.exercice = getData(exRes);
    if (exRes.error) {
        const listEx = await httpRequest('GET', `/exercices?tontineId=${caya.id}`);
        state.exercice = (getData(listEx) || []).find((e: any) => e.libelle === exPayload.libelle);
    }
    assert(!!state.exercice, 'Exercice CAYA prêt');
    log('📅', `Exercice actif: ${state.exercice.libelle} (ID: ${state.exercice.id})`);

    // 2. Adhésions
    state.exerciceMembres = [];
    for (let i = 0; i < state.utilisateurs.length; i++) {
        const u = state.utilisateurs[i];

        // Adhésion Globale
        const adhRes = await httpRequest('POST', '/tontines/adhesions', {
            tontineId: caya.id, utilisateurId: u.id, matricule: `MAT-CAYA-${u.id.substring(0, 6)}`, role: 'MEMBRE'
        });
        let adhData = getData(adhRes);
        if (adhRes.error) {
            const list = await httpRequest('GET', `/tontines/adhesions/tontine/${caya.id}`);
            const adhesions = getData(list) || [];
            // API may return flat utilisateurId OR nested utilisateur.id
            adhData = adhesions.find((a: any) =>
                a.utilisateurId === u.id || a.utilisateur?.id === u.id
            );
            if (adhData) log('🔄', `Adhesion existante trouvée pour ${u.prenom}`);
        }

        if (adhData) {
            // Inscription Exercice
            const emRes = await httpRequest('POST', '/exercices-membres', {
                exerciceId: state.exercice.id, adhesionTontineId: adhData.id, typeMembre: 'ANCIEN'
            });
            if (!emRes.error) {
                state.exerciceMembres.push(getData(emRes));
            } else {
                const list = await httpRequest('GET', `/exercices-membres/exercice/${state.exercice.id}`);
                const members = getData(list) || [];
                // API may return flat adhesionTontineId OR nested adhesionTontine.id
                const found = members.find((em: any) =>
                    em.adhesionTontineId === adhData.id || em.adhesionTontine?.id === adhData.id
                );
                if (found) state.exerciceMembres.push(found);
            }
        } else {
            log('⚠️', `Échec adhésion tontine pour ${u.prenom}`);
        }
    }
    log('📊', `${state.exerciceMembres.length} membres dans l'exercice CAYA`);
    assert(state.exerciceMembres.length > 0, 'Au moins un membre doit être inscrit');
}

async function step4_reunion() {
    section('ÉTAPE 4 — Réunion');
    const payload = {
        exerciceId: state.exercice.id, numeroReunion: 1, dateReunion: '2025-10-15', lieu: 'Bureau CAYA', heureDebut: '18:00'
    };
    const res = await httpRequest('POST', '/reunions', payload);
    state.reunion = getData(res);

    if (res.error) {
        log('🔄', 'Tentative de récupération de la réunion...');
        const list = await httpRequest('GET', `/reunions?exerciceId=${state.exercice.id}`);
        state.reunion = (getData(list) || []).find((r: any) => r.numeroReunion === 1);
    }

    assert(!!state.reunion, 'Réunion trouvée/créée');
    log('📅', `Réunion ID: ${state.reunion.id} Statut: ${state.reunion.statut}`);

    if (state.reunion.statut !== 'OUVERTE') {
        const openRes = await httpRequest('POST', `/reunions/${state.reunion.id}/ouvrir`);
        if (!openRes.error) log('🔓', 'Réunion ouverte');
    }
}

async function step5_transactions() {
    section('ÉTAPE 5 — Transactions');
    if (state.exerciceMembres.length < 2) { log('⚠️', 'Besoin de 2 membres pour Tx'); return; }
    const em = state.exerciceMembres[0];
    const validerPar = state.exerciceMembres[1];

    log('💰', `Cotisation pour ${em.adhesionTontine?.utilisateur?.prenom || 'Membre 1'}...`);
    const res = await httpRequest('POST', '/transactions/cotisation', {
        reunionId: state.reunion.id, exerciceMembreId: em.id,
        montant: 100000, description: 'Cotisation Initiale', autoSoumis: true
    });

    const tx = getData(res);
    if (!res.error && tx) {
        log('✅', `Transaction ${tx.id} créée`);
        const valRes = await httpRequest('POST', `/transactions/${tx.id}/valider`, {
            valideParExerciceMembreId: validerPar.id
        });
        if (!valRes.error) log('💎', 'Transaction validée !');
    }
}

async function main() {
    console.log('\n🚀 START CAYA INTEGRATION TEST (V2)');
    try {
        await step0_auth();
        await step0_types();
        await step1_tontines();
        await step2_utilisateurs();
        await step3_exercice_et_adhesions();
        await step4_reunion();
        await step5_transactions();
        console.log('\n🎉  TOUS LES TESTS SE SONT DÉROULÉS AVEC SUCCÈS !');
    } catch (err: any) {
        console.error('\n💥 CRASH FATAL:', err.message);
        process.exit(1);
    }
}

main();
