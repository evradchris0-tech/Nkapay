import { AppDataSource } from '../../config';
import { RuleDefinition, CategorieRegle, TypeValeurRegle } from '../../modules/tontines/entities/rule-definition.entity';
import { logger } from '../../shared/utils/logger.util';

export const seedRuleDefinitions = async (): Promise<void> => {
    const repo = AppDataSource.getRepository(RuleDefinition);

    const rules = [
        // --- Prêts ---
        {
            cle: 'PRET_TAUX_INTERET',
            libelle: 'Taux d\'intérêt par défaut (Mensuel)',
            categorie: CategorieRegle.PRET,
            typeValeur: TypeValeurRegle.POURCENTAGE,
            valeurDefaut: '0.05', // 5%
            valeurMin: '0',
            valeurMax: '1',
            unite: '%',
            description: 'Taux d\'intérêt appliqué mensuellement sur le capital restant dû.',
            estObligatoire: true,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 10,
        },
        {
            cle: 'PRET_DUREE_MAX',
            libelle: 'Durée maximale de remboursement',
            categorie: CategorieRegle.PRET,
            typeValeur: TypeValeurRegle.ENTIER,
            valeurDefaut: '12',
            valeurMin: '1',
            valeurMax: '24',
            unite: 'mois',
            description: 'Nombre maximum de mois pour rembourser un prêt.',
            estObligatoire: true,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 20,
        },
        {
            cle: 'PRET_PLAFOND_MONTANT',
            libelle: 'Plafond individuel de prêt',
            categorie: CategorieRegle.PRET,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '500000',
            valeurMin: '0',
            unite: 'XAF', // Ou devise locale
            description: 'Montant maximum qu\'un membre peut emprunter.',
            estObligatoire: false,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 30,
        },

        // --- Pénalités ---
        {
            cle: 'PENALITE_RETARD_REUNION',
            libelle: 'Pénalité retard réunion',
            categorie: CategorieRegle.PENALITE,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '500',
            valeurMin: '0',
            unite: 'XAF',
            description: 'Montant de l\'amende pour retard à une réunion.',
            estObligatoire: false,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 10,
        },
        {
            cle: 'PENALITE_ABSENCE_REUNION',
            libelle: 'Pénalité absence réunion',
            categorie: CategorieRegle.PENALITE,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '1000',
            valeurMin: '0',
            unite: 'XAF',
            description: 'Montant de l\'amende pour absence non justifiée à une réunion.',
            estObligatoire: false,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 20,
        },

        // --- Cotisations & Fonds ---
        {
            cle: 'COTISATION_MENSUELLE_MIN',
            libelle: 'Cotisation mensuelle minimale',
            categorie: CategorieRegle.COTISATION,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '10000',
            valeurMin: '0',
            unite: 'XAF',
            description: 'Montant minimum à cotiser chaque mois.',
            estObligatoire: true,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 10,
        },
        {
            cle: 'POT_MENSUEL_MONTANT',
            libelle: 'Montant du Pot Mensuel',
            categorie: CategorieRegle.COTISATION,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '5000',
            valeurMin: '0',
            unite: 'XAF',
            description: 'Montant fixe du pot (bouffe) à payer chaque mois.',
            estObligatoire: true,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 20,
        },
        {
            cle: 'EPARGNE_MENSUELLE_MIN',
            libelle: 'Épargne mensuelle minimale',
            categorie: CategorieRegle.COTISATION,
            typeValeur: TypeValeurRegle.MONTANT,
            valeurDefaut: '0',
            valeurMin: '0',
            unite: 'XAF',
            description: 'Montant minimum à épargner chaque mois (facultatif si 0).',
            estObligatoire: true,
            estModifiableParTontine: true,
            estModifiableParExercice: true,
            ordreAffichage: 30,
        },
        // Ajout d'une règle "SECURITE" 
        {
            cle: 'DELAI_AVANT_DEMISSION',
            libelle: 'Délai de préavis démission',
            categorie: CategorieRegle.SECURITE,
            typeValeur: TypeValeurRegle.ENTIER,
            valeurDefaut: '30',
            valeurMin: '0',
            unite: 'jours',
            description: 'Nombre de jours de préavis avant de valider une démission.',
            estObligatoire: false,
            estModifiableParTontine: true,
            estModifiableParExercice: false,
            ordreAffichage: 50,
        }
    ];

    let count = 0;
    for (const rule of rules) {
        const existing = await repo.findOne({ where: { cle: rule.cle } });
        if (!existing) {
            await repo.save(repo.create(rule));
            count++;
        }
    }

    logger.info(`${count} règles par défaut créées.`);
};
