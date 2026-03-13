import {
  RapportExerciceData,
  RapportMensuelData,
  ReleveCompteData,
  ListeMembresData,
  RapportOrganisationData,
  PortefeuillePretsData,
  PresencesAssiduiteData,
  CotisationsArrieresData,
  EvenementsSecoursData,
  BilanFinancierAnnuelData,
} from '../types/export-data.types';

export interface ExportStrategy {
  genererReleveCompte(data: ReleveCompteData): Promise<Buffer>;
  genererRapportExercice(data: RapportExerciceData): Promise<Buffer>;
  genererRapportMensuel(data: RapportMensuelData): Promise<Buffer>;
  genererListeMembres(data: ListeMembresData): Promise<Buffer>;
  genererRapportOrganisation(data: RapportOrganisationData): Promise<Buffer>;
  genererPortefeuillePrets(data: PortefeuillePretsData): Promise<Buffer>;
  genererPresencesAssiduite(data: PresencesAssiduiteData): Promise<Buffer>;
  genererCotisationsArrieres(data: CotisationsArrieresData): Promise<Buffer>;
  genererEvenementsSecours(data: EvenementsSecoursData): Promise<Buffer>;
  genererBilanFinancierAnnuel(data: BilanFinancierAnnuelData): Promise<Buffer>;
  getExtension(): string;
  getContentType(): string;
}
