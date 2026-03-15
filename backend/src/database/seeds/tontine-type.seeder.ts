import { AppDataSource } from '../../config';
import { TontineType } from '../../modules/tontines/entities/tontine-type.entity';
import { logger } from '../../shared/utils/logger.util';

export const seedTontineTypes = async (): Promise<void> => {
    const repo = AppDataSource.getRepository(TontineType);

    const types = [
        {
            code: 'STANDARD',
            libelle: 'Standard',
            description: 'Tontine classique avec cotisations mensuelles et distribution tournante.',
            estActif: true,
        },
        {
            code: 'EPARGNE',
            libelle: 'Épargne',
            description: 'Axée sur l\'épargne collective avec un fonds géré par le bureau.',
            estActif: true,
        },
        {
            code: 'SOLIDARITE',
            libelle: 'Solidarité',
            description: 'Priorité à l\'entraide : secours, santé, funérailles, naissances.',
            estActif: true,
        },
        {
            code: 'INVESTISSEMENT',
            libelle: 'Investissement',
            description: 'Fonds mis en commun pour des projets d\'investissement collectif.',
            estActif: true,
        },
        {
            code: 'MIXTE',
            libelle: 'Mixte',
            description: 'Combinaison épargne, prêts, secours et distribution selon les règles définies.',
            estActif: true,
        },
    ];

    let count = 0;
    for (const t of types) {
        const existing = await repo.findOne({ where: { code: t.code } });
        if (!existing) {
            await repo.save(repo.create(t));
            count++;
        }
    }

    logger.info(`${count} types de tontines créés.`);
};
