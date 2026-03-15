import { DataSource } from 'typeorm';
import { TypeEvenementSecours } from '../../modules/secours/entities/type-evenement-secours.entity';

export const seedTypeEvenementSecours = async (dataSource: DataSource) => {
    const repository = dataSource.getRepository(TypeEvenementSecours);

    const types = [
        {
            code: 'MARIAGE',
            libelle: 'Mariage',
            description: 'Secours pour le mariage d\'un membre',
            montantParDefaut: 200000,
            ordreAffichage: 1,
            estActif: true
        },
        {
            code: 'DECES_PARENT',
            libelle: 'Décès Parent/Conjoint/Enfant',
            description: 'Secours suite au décès d\'un proche (Père, Mère, Conjoint, Enfant)',
            montantParDefaut: 100000,
            ordreAffichage: 2,
            estActif: true
        },
        {
            code: 'NAISSANCE',
            libelle: 'Naissance',
            description: 'Secours pour la naissance d\'un enfant',
            montantParDefaut: 50000,
            ordreAffichage: 3,
            estActif: true
        },
        {
            code: 'MALADIE',
            libelle: 'Maldie / Hospitalisation',
            description: 'Aide pour frais médicaux ou hospitalisation',
            montantParDefaut: 75000,
            ordreAffichage: 4,
            estActif: true
        },
        {
            code: 'PROMOTION',
            libelle: 'Promotion / Grade',
            description: 'Célébration d\'une promotion professionnelle ou académique',
            montantParDefaut: 50000,
            ordreAffichage: 5,
            estActif: true
        },
        {
            code: 'AUTRE',
            libelle: 'Autre événement',
            description: 'Autre motif de secours (montant à définir)',
            montantParDefaut: 0,
            ordreAffichage: 99,
            estActif: true
        }
    ];

    for (const type of types) {
        const existing = await repository.findOne({ where: { code: type.code } });
        if (!existing) {
            await repository.save(repository.create(type));
            console.log(`Type d'événement créé : ${type.libelle}`);
        } else {
            // Mettre à jour si nécessaire (optionnel, ici on ne touche pas si existe déjà)
            console.log(`Type d'événement existant : ${type.libelle}`);
        }
    }
};
