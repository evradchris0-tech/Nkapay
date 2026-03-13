import { Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { AppDataSource } from '../../config';

/**
 * Factory pour les repositories TypeORM.
 * Permet de centraliser et de gérer le cycle de vie des repositories.
 */
export class RepositoryFactory {
  private static repositories: Map<string, Repository<any>> = new Map();

  /**
   * Récupère un repository pour une entité donnée
   */
  public static getRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>
  ): Repository<Entity> {
    const entityName = typeof entity === 'function' ? entity.name : (entity as any).name;

    if (!this.repositories.has(entityName)) {
      this.repositories.set(entityName, AppDataSource.getRepository(entity));
    }

    return this.repositories.get(entityName) as Repository<Entity>;
  }

  /**
   * Version "lazy getter" pour utilisation dans les classes
   */
  public static createLazyGetter<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>
  ): () => Repository<Entity> {
    let repo: Repository<Entity>;
    return () => {
      if (!repo) {
        repo = this.getRepository(entity);
      }
      return repo;
    };
  }
}
