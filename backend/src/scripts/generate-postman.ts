import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger.config';
// On utilise require pour les modules JS
const Converter = require('openapi-to-postmanv2');

/**
 * Script pour générer automatiquement la collection Postman complète 
 * à partir de la spécification OpenAPI/Swagger du projet Nkapay.
 */
async function generatePostmanCollection() {
    console.log('🔄 Chargement de la spécification OpenAPI...');

    // Option spécifique pour personnaliser la conversion
    const options = {
        folderStrategy: 'Tags',        // Regrouper par Tag (module métier dans notre cas)
        includeAuthInfoInExample: false,
        schemaFaker: true,             // Va tenter de combler les payloads vides avec des exemples
        keepImplicitHeaders: false
    };

    console.log('🔄 Conversion en Collection Postman V2.1...');
    Converter.convert(
        { type: 'json', data: JSON.parse(JSON.stringify(swaggerSpec)) },
        options,
        (err: any, conversionResult: any) => {
            if (err) {
                console.error('❌ Erreur lors de la conversion:', err);
                process.exit(1);
            }

            if (!conversionResult.result) {
                console.error('❌ Conversion échouée:', conversionResult.reason);
                process.exit(1);
            }

            const collection = conversionResult.output[0].data;

            // --- 🔧 POST-PROCESSING: Rendre la collection intelligente ---

            // 1. Ajouter l'autorisation Bearer globale
            collection.auth = {
                type: 'bearer',
                bearer: [
                    { key: 'token', value: '{{bearerToken}}', type: 'string' }
                ]
            };

            // 2. Ajouter les variables de collection
            collection.variable = [
                { key: 'baseUrl', value: 'http://localhost:3000/api/v1', type: 'string' },
                { key: 'bearerToken', value: '', type: 'string' },
                { key: 'login_identifiant', value: '237688888888', type: 'string' },
                { key: 'login_password', value: 'TestPass2025!', type: 'string' }
            ];

            // 3. Traiter récursivement toutes les requêtes
            function processItem(item: any) {
                if (item.item) {
                    item.item.forEach(processItem); // Dossier
                } else {
                    // C'est une requête

                    // A. Corriger les URLs avec variables (ex: /utilisateurs/:id -> utilise {{id}})
                    if (item.request && item.request.url && item.request.url.variable) {
                        item.request.url.variable.forEach((val: any) => {
                            val.value = `{{${val.key}}}`;
                        });
                    }

                    // B. Script de Test pour capter le Token (Login)
                    const isLogin = item.name.toLowerCase().includes('connexion') && item.name.toLowerCase().includes('utilisateur');
                    if (isLogin) {
                        item.event = item.event || [];
                        item.event.push({
                            listen: 'test',
                            script: {
                                type: 'text/javascript',
                                exec: [
                                    "var jsonData = pm.response.json();",
                                    "if(jsonData.data && jsonData.data.accessToken) {",
                                    "    pm.collectionVariables.set('bearerToken', jsonData.data.accessToken);",
                                    "    console.log('✅ Token capturé et sauvegardé !');",
                                    "}"
                                ]
                            }
                        });

                        // Pré-remplir la requête de login avec nos variables
                        if (item.request.body) {
                            item.request.body.raw = JSON.stringify({
                                identifiant: "{{login_identifiant}}",
                                motDePasse: "{{login_password}}"
                            }, null, 2);
                        }
                    } else if (item.request && item.request.body && item.request.body.raw) {
                        // C. Remplacer les données Swagger stupides (<string>, <uuid>) par des variables Faker de Postman
                        let raw = item.request.body.raw;
                        raw = raw.replace(/"<uuid>"/g, '"{{$randomUUID}}"');
                        raw = raw.replace(/"<string>"/g, '"{{$randomWord}}"');
                        raw = raw.replace(/"<date>"/g, '"{{$isoTimestamp}}"');
                        raw = raw.replace(/"<dateTime>"/g, '"{{$isoTimestamp}}"');
                        item.request.body.raw = raw;
                    }
                }
            }

            if (collection.item) {
                collection.item.forEach(processItem);
            }
            // ----------------------------------------------------------------

            // Dossier de sortie
            const outputDir = path.join(__dirname, '../../../postman');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, 'Nkapay_Complete_Collection.json');
            fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

            console.log(`✅ Succès ! La collection complète a été générée.`);
            console.log(`📂 Emplacement : ${outputPath}`);
            console.log(`💡 Vous pouvez maintenant l'importer dans Postman.`);
        }
    );
}

generatePostmanCollection();
