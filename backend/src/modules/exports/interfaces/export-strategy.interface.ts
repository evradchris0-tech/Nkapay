import { RapportExerciceData, RapportMensuelData, ReleveCompteData } from '../types/export-data.types';

export interface ExportStrategy {
    genererReleveCompte(data: ReleveCompteData): Promise<Buffer>;
    genererRapportExercice(data: RapportExerciceData): Promise<Buffer>;
    genererRapportMensuel(data: RapportMensuelData): Promise<Buffer>;
    getExtension(): string;
    getContentType(): string;
}
