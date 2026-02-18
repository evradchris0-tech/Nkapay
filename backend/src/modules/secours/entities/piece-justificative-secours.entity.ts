/**
 * Entite PieceJustificativeSecours
 * Documents joints a un evenement de secours (certificat de mariage, acte de deces, etc.)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { EvenementSecours } from './evenement-secours.entity';

export enum TypePieceJustificative {
    CERTIFICAT_MARIAGE = 'CERTIFICAT_MARIAGE',
    ACTE_DECES = 'ACTE_DECES',
    CERTIFICAT_NAISSANCE = 'CERTIFICAT_NAISSANCE',
    CERTIFICAT_MEDICAL = 'CERTIFICAT_MEDICAL',
    FACTURE = 'FACTURE',
    PHOTO = 'PHOTO',
    AUTRE = 'AUTRE',
}

@Entity('piece_justificative_secours')
export class PieceJustificativeSecours {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'evenement_secours_id', type: 'uuid' })
    evenementSecoursId: string;

    @ManyToOne(() => EvenementSecours, (es) => es.piecesJustificatives, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'evenement_secours_id' })
    evenementSecours: EvenementSecours;

    @Column({ name: 'type_piece', type: 'enum', enum: TypePieceJustificative, default: TypePieceJustificative.AUTRE })
    typePiece: TypePieceJustificative;

    @Column({ name: 'nom_fichier', type: 'varchar', length: 255 })
    nomFichier: string;

    @Column({ name: 'chemin_fichier', type: 'varchar', length: 500 })
    cheminFichier: string;

    @Column({ name: 'type_mime', type: 'varchar', length: 100, nullable: true })
    typeMime: string | null;

    @Column({ name: 'taille_octets', type: 'int', nullable: true })
    tailleOctets: number | null;

    @Column({ type: 'text', nullable: true })
    commentaire: string | null;

    @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
    creeLe: Date;
}
