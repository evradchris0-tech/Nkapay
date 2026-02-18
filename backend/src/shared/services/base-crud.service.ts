import { Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { NotFoundError } from '../errors/app-error';
import { PaginatedResult, PaginationQuery, paginate } from '../utils/pagination.util';

export abstract class BaseCrudService<
    Entity extends ObjectLiteral,
    CreateDto,
    UpdateDto,
    ResponseDto,
    FiltersDto = any
> {
    protected abstract get repository(): Repository<Entity>;
    protected abstract toResponseDto(entity: Entity): ResponseDto;

    /**
     * Retourne les relations à charger par défaut
     */
    protected getRelations(): string[] {
        return [];
    }

    /**
     * Applique les filtres à la requête
     */
    protected applyFilters(query: SelectQueryBuilder<Entity>, filters?: FiltersDto): void {
        // À implémenter dans les sous-classes
    }

    /**
     * Trouver par ID
     */
    async findById(id: string): Promise<ResponseDto> {
        const entity = await this.repository.findOne({
            where: { id } as any,
            relations: this.getRelations(),
        });

        if (!entity) {
            throw new NotFoundError(`${this.repository.metadata.name} non trouvé: ${id}`);
        }

        return this.toResponseDto(entity);
    }

    /**
     * Récupérer tous avec pagination
     */
    async findAll(pagination: PaginationQuery, filters?: FiltersDto): Promise<PaginatedResult<ResponseDto>> {
        const queryBuilder = this.repository.createQueryBuilder('e');

        // Appliquer les relations
        this.getRelations().forEach(relation => {
            queryBuilder.leftJoinAndSelect(`e.${relation}`, relation);
        });

        // Appliquer les filtres
        this.applyFilters(queryBuilder, filters);

        const result = await paginate(queryBuilder, pagination);

        return {
            ...result,
            data: result.data.map(e => this.toResponseDto(e)),
        };
    }

    /**
     * Supprimer par ID
     */
    async delete(id: string): Promise<void> {
        const entity = await this.repository.findOne({ where: { id } as any });
        if (!entity) {
            throw new NotFoundError(`${this.repository.metadata.name} non trouvé: ${id}`);
        }
        await this.repository.remove(entity);
    }
}
