import { Request, Response, NextFunction } from 'express';
import { UtilisateurService } from '../services/utilisateur.service';
import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
  ChangePasswordDto,
  UtilisateurFiltersDto,
} from '../dtos/utilisateur.dto';
import { ApiResponse, PaginationQuery } from '../../../shared';

const utilisateurService = new UtilisateurService();

/**
 * GET /utilisateurs
 * Liste des utilisateurs avec pagination et filtres
 */
export async function getAllUtilisateurs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination: PaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
    };

    const filters: UtilisateurFiltersDto = {
      search: req.query.search as string | undefined,
      telephone: req.query.telephone as string | undefined,
      estSuperAdmin: req.query.estSuperAdmin !== undefined
        ? req.query.estSuperAdmin === 'true'
        : undefined,
      organisationId: req.query.organisationId as string | undefined,
    };

    const result = await utilisateurService.findAll(pagination, filters);

    res.json(ApiResponse.paginated(result.data, result.meta));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /utilisateurs/:id
 * Detail d'un utilisateur
 */
export async function getUtilisateurById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const utilisateur = await utilisateurService.findById(id);

    res.json(ApiResponse.success(utilisateur));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /utilisateurs
 * Creation d'un nouvel utilisateur
 */
export async function createUtilisateur(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: CreateUtilisateurDto = req.body;

    const utilisateur = await utilisateurService.create(dto);

    res.status(201).json(ApiResponse.success(utilisateur, 'Utilisateur cree avec succes'));
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /utilisateurs/:id
 * Mise a jour d'un utilisateur
 */
export async function updateUtilisateur(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const dto: UpdateUtilisateurDto = req.body;

    const utilisateur = await utilisateurService.update(id, dto);

    res.json(ApiResponse.success(utilisateur, 'Utilisateur mis a jour'));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /utilisateurs/:id/password
 * Changement de mot de passe
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const dto: ChangePasswordDto = req.body;

    await utilisateurService.changePassword(id, dto.ancienMotDePasse, dto.nouveauMotDePasse);

    res.json(ApiResponse.success(null, 'Mot de passe modifie avec succes'));
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /utilisateurs/:id
 * Suppression logique d'un utilisateur
 */
export async function deleteUtilisateur(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await utilisateurService.softDelete(id);

    res.json(ApiResponse.success(null, 'Utilisateur supprime'));
  } catch (error) {
    next(error);
  }
}
