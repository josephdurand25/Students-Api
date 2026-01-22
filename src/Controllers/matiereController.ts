import type { Request, Response } from 'express';
import { 
  IMatiere, 
  IMatiereCreate, 
  IMatiereFilters, 
  IMatiereStatistics, 
  IMatiereUpdate,
  IMatiereWithDetails, 
} from '../types/IMatiere';
import Matiere from '../Models/Matiere';
import { 
  ApiErrorResponse, 
  ApiErrorValidationResponse, 
  ApiResponseOk,
  HTTP_STATUS, 
  IPaginationResult
} from '../types/api';
import { JourSemaine, TypeCours } from '../types/IGeneral';

// Créer une nouvelle matière
export const createMatiereV1 = async (req: Request, res: Response) => {
  try {
    const newMatiere = req.body as Partial<IMatiereCreate>;
    
    // Validation des champs requis (minimum)
    const required = ['code', 'nom'];
    const missing = required.filter((field) => !(newMatiere as any)[field]);
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IMatiere
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Erreur de validation des données.',
      errors: {}
    };

    if (missing.length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: `Champs requis manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le champ ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Validation supplémentaire
    const validationErrors: Record<string, string> = {};
    
    if (newMatiere.credits && newMatiere.credits <= 0) {
      validationErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }
    
    if (newMatiere.coefficient && newMatiere.coefficient <= 0) {
      validationErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }
    
    if (newMatiere.volume_horaire && newMatiere.volume_horaire <= 0) {
      validationErrors.volume_horaire = 'Le volume horaire doit être supérieur à 0';
    }
    
    if (newMatiere.type_cours && !['CM', 'TD', 'TP'].includes(newMatiere.type_cours)) {
      validationErrors.type_cours = 'Le type de cours doit être CM, TD ou TP';
    }
    
    if (newMatiere.jour && !['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].includes(newMatiere.jour)) {
      validationErrors.jour = 'Jour invalide';
    }

    if (Object.keys(validationErrors).length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const matiere = await Matiere.create(newMatiere);
    
    response_api = {
      ...response_api,
      message: 'Matière créée avec succès',
      data: matiere as IMatiere
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la création de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('createMatiere:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const createMatiere = async (req: Request, res: Response) => {
  try {
    const newMatiere = req.body as IMatiereCreate;
    
    // Validation des champs requis - AJOUTER 'ue_code' (était 'unite_enseignement_code')
    const required = ['code', 'nom', 'type_cours', 'credits', 'ue_code']; 
    const missing = required.filter((field) => !(newMatiere as any)[field]);
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IMatiere
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Erreur de validation des données.',
      errors: {}
    };

    if (missing.length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: `Champs requis manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le champ ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Validation supplémentaire - AJOUTER 'PROJET', 'STAGE' comme types valides
    const validationErrors: Record<string, string> = {};
    
    if (newMatiere.credits && newMatiere.credits <= 0) {
      validationErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }
    
    if (newMatiere.coefficient && newMatiere.coefficient <= 0) {
      validationErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }
    
    if (newMatiere.volume_horaire && newMatiere.volume_horaire <= 0) {
      validationErrors.volume_horaire = 'Le volume horaire doit être supérieur à 0';
    }
    
    // Mettre à jour les types de cours valides
    const validTypes = ['CM', 'TD', 'TP', 'PROJET', 'STAGE']; // CHANGEMENT ICI
    if (newMatiere.type_cours && !validTypes.includes(newMatiere.type_cours)) {
      validationErrors.type_cours = `Le type de cours doit être: ${validTypes.join(', ')}`;
    }
    
    if (newMatiere.jour && !['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].includes(newMatiere.jour)) {
      validationErrors.jour = 'Jour invalide';
    }

    if (Object.keys(validationErrors).length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const matiere = await Matiere.create(newMatiere);
    
    if (!matiere) {
      const response_api_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Échec de la création de la matière.',
        error: 'Échec de la création dans la base de données'
      };
      return res.status(response_api_error.status_code).json(response_api_error);
    }
    
    response_api = {
      ...response_api,
      message: 'Matière créée avec succès',
      data: matiere
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: error.code === 'ER_DUP_ENTRY' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Une matière avec ce code existe déjà.' 
        : 'Erreur serveur lors de la création de la matière.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    console.error('createMatiere:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une matière par code
export const getMatiereByCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IMatiereWithDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiereWithDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matiere = await Matiere.findByCodeWithDetails(code);
    
    if (!matiere) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Matière trouvée avec succès',
      data: matiere as IMatiereWithDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatiereByCode - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une matière simple par code
export const getMatiereSimpleByCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matiere = await Matiere.findByCode(code);
    
    if (!matiere) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Matière trouvée avec succès',
      data: matiere
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatiereSimpleByCode error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les matières avec pagination
export const getMatieresV1 = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: IMatiereFilters = {};
    
    if (req.query.ue_code) filters.ue_code = String(req.query.ue_code);
    if (req.query.type_cours) filters.type_cours = String(req.query.type_cours) as TypeCours;
    if (req.query.enseignant_id) filters.enseignant_id = Number(req.query.enseignant_id);
    if (req.query.jour) filters.jour = String(req.query.jour) as JourSemaine;
    if (req.query.search) filters.search = String(req.query.search);

    let response_api: ApiResponseOk<IPaginationResult<IMatiereWithDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IMatiereWithDetails[]>
    };

    const result = await Matiere.findAll(page, limit, filters);
    
    response_api = {
      ...response_api,
      message: 'Liste des matières récupérée avec succès',
      data: result as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieres - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getMatieres = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Math.min(Math.max(1, Number(req.query.limit)), 100) : 10;

    const filters: IMatiereFilters = {};
    
    // CHANGEMENT: utiliser 'ue_code' au lieu de 'unite_enseignement_code'
    if (req.query.ue_code) filters.ue_code = String(req.query.ue_code);
    
    // Support pour l'ancien paramètre (compatibilité)
    if (req.query.unite_enseignement_code && !req.query.ue_code) {
      console.warn('Paramètre "unite_enseignement_code" déprécié, utilisez "ue_code"');
      filters.ue_code = String(req.query.unite_enseignement_code);
    }
    
    if (req.query.type_cours) filters.type_cours = String(req.query.type_cours) as TypeCours;
    if (req.query.enseignant_id) filters.enseignant_id = Number(req.query.enseignant_id);
    if (req.query.jour) filters.jour = String(req.query.jour) as JourSemaine;
    if (req.query.search) filters.search = String(req.query.search);
    
    // NOUVEAU: filtres pour spécialité et filière
    if (req.query.specialite_code) filters.specialite_code = String(req.query.specialite_code);
    if (req.query.filiere_code) filters.filiere_code = String(req.query.filiere_code);

    let response_api: ApiResponseOk<IPaginationResult<IMatiereWithDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IMatiereWithDetails[]>
    };

    const result = await Matiere.findAll(page, limit, filters);
    
    response_api = {
      ...response_api,
      message: 'Liste des matières récupérée avec succès',
      data: result as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getMatieres error'
    };
    console.error('getMatieres - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une matière
export const updateMatiereV1 = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const updateData = req.body as IMatiereUpdate;
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation des données de mise à jour
    const validationErrors: Record<string, string> = {};
    
    if (updateData.credits !== undefined && updateData.credits <= 0) {
      validationErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }
    
    if (updateData.coefficient !== undefined && updateData.coefficient <= 0) {
      validationErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }
    
    if (updateData.volume_horaire !== undefined && updateData.volume_horaire <= 0) {
      validationErrors.volume_horaire = 'Le volume horaire doit être supérieur à 0';
    }
    
    if (updateData.type_cours && !['CM', 'TD', 'TP'].includes(updateData.type_cours)) {
      validationErrors.type_cours = 'Le type de cours doit être CM, TD ou TP';
    }

    if (Object.keys(validationErrors).length > 0) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const updated = await Matiere.update(code, updateData);
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Matière mise à jour avec succès',
      data: updated
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateMatiere error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const updateMatiere = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const updateData = req.body as IMatiereUpdate;
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation des données de mise à jour
    const validationErrors: Record<string, string> = {};
    
    if (updateData.credits !== undefined && updateData.credits <= 0) {
      validationErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }
    
    if (updateData.coefficient !== undefined && updateData.coefficient <= 0) {
      validationErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }
    
    if (updateData.volume_horaire !== undefined && updateData.volume_horaire <= 0) {
      validationErrors.volume_horaire = 'Le volume horaire doit être supérieur à 0';
    }
    
    // Mettre à jour les types de cours valides
    const validTypes = ['CM', 'TD', 'TP', 'PROJET', 'STAGE']; // CHANGEMENT ICI
    if (updateData.type_cours && !validTypes.includes(updateData.type_cours)) {
      validationErrors.type_cours = `Le type de cours doit être: ${validTypes.join(', ')}`;
    }

    if (Object.keys(validationErrors).length > 0) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const updated = await Matiere.update(code, updateData);
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Matière mise à jour avec succès',
      data: updated
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateMatiere error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une matière
export const deleteMatiere = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const deleted = await Matiere.delete(code);
    
    if (!deleted) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Matière supprimée avec succès.',
      data: deleted as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la suppression de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('deleteMatiere - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les matières d'une UE
export const getMatieresByUE = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.ueCode);
    
    let response_api: ApiResponseOk<IMatiere[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code UE invalide.'
    };

    if (!ueCode || ueCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieres = await Matiere.findByUE(ueCode);
    
    response_api = {
      ...response_api,
      message: 'Matières de l\'UE récupérées avec succès',
      data: matieres as IMatiere[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieresByUE error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Nouvelle fonction: Obtenir les matières d'une spécialité
export const getMatieresBySpecialite = async (req: Request, res: Response) => {
  try {
    const specialiteCode = String(req.params.specialiteCode);
    
    let response_api: ApiResponseOk<IMatiere[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code spécialité invalide.'
    };

    if (!specialiteCode || specialiteCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieres = await Matiere.findBySpecialite(specialiteCode);
    
    response_api = {
      ...response_api,
      message: 'Matières de la spécialité récupérées avec succès',
      data: matieres as IMatiere[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières de la spécialité.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieresBySpecialite error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Nouvelle fonction: Obtenir les matières d'une filière
export const getMatieresByFiliere = async (req: Request, res: Response) => {
  try {
    const filiereCode = String(req.params.filiereCode);
    
    let response_api: ApiResponseOk<IMatiere[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code filière invalide.'
    };

    if (!filiereCode || filiereCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieres = await Matiere.findByFiliere(filiereCode);
    
    response_api = {
      ...response_api,
      message: 'Matières de la filière récupérées avec succès',
      data: matieres as IMatiere[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières de la filière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieresByFiliere error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Nouvelle fonction: Obtenir les salles disponibles
export const getSallesDisponibles = async (req: Request, res: Response) => {
  try {
    const { date, heure_debut, heure_fin } = req.query;
    
    let response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Paramètres requis manquants.',
      errors: {}
    };

    // Validation des paramètres
    if (!date || !heure_debut || !heure_fin) {
      const missing: string[] = [];
      if (!date) missing.push('date');
      if (!heure_debut) missing.push('heure_debut');
      if (!heure_fin) missing.push('heure_fin');
      
      response_validation_errors = {
        ...response_validation_errors,
        message: `Paramètres requis manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le paramètre ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const sallesDisponibles = await Matiere.getSallesDisponibles(
      String(date),
      String(heure_debut),
      String(heure_fin)
    );
    
    response_api = {
      ...response_api,
      message: 'Salles disponibles récupérées avec succès',
      data: sallesDisponibles
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des salles disponibles.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getSallesDisponibles error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les matières d'un enseignant
export const getMatieresByEnseignant = async (req: Request, res: Response) => {
  try {
    const enseignantId = Number(req.params.enseignantId);
    
    let response_api: ApiResponseOk<IMatiereWithDetails[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'ID enseignant invalide.'
    };

    if (Number.isNaN(enseignantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieres = await Matiere.findByEnseignant(enseignantId);
    
    response_api = {
      ...response_api,
      message: 'Matières de l\'enseignant récupérées avec succès',
      data: matieres as IMatiereWithDetails[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières de l\'enseignant.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieresByEnseignant error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Vérifier les conflits d'horaires
export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const { etudiant_id, matiere_code } = req.body;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {}
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Paramètres requis manquants.',
      errors: {}
    };

    // Validation des paramètres
    if (!etudiant_id || !matiere_code) {
      const missing: string[] = [];
      if (!etudiant_id) missing.push('etudiant_id');
      if (!matiere_code) missing.push('matiere_code');
      
      response_validation_errors = {
        ...response_validation_errors,
        message: `Paramètres requis manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le paramètre ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const result = await Matiere.checkConflicts(etudiant_id, matiere_code);
    
    response_api = {
      ...response_api,
      message: 'Vérification des conflits effectuée avec succès',
      data: result
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la vérification des conflits.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('checkConflicts error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir l'emploi du temps d'un étudiant
export const getEmploiDuTemps = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    const groupeCode = req.query.groupeCode ? String(req.query.groupeCode) : undefined;
    
    let response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'ID étudiant invalide.'
    };

    if (Number.isNaN(etudiantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const emploi = await Matiere.getEmploiDuTemps(etudiantId, groupeCode);
    
    response_api = {
      ...response_api,
      message: 'Emploi du temps récupéré avec succès',
      data: emploi
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de l\'emploi du temps.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getEmploiDuTemps error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les statistiques générales
export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    let response_api: ApiResponseOk<IMatiereStatistics> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiereStatistics
    };

    const stats = await Matiere.getStatistiques();
    
    response_api = {
      ...response_api,
      message: 'Statistiques des matières récupérées avec succès',
      data: stats
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des statistiques.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getStatistiques error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Recherche avancée
export const searchMatieres = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    
    let response_api: ApiResponseOk<IMatiere[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };

    const matieres = await Matiere.search(criteria);
    
    response_api = {
      ...response_api,
      message: 'Recherche de matières effectuée avec succès',
      data: matieres as IMatiere[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la recherche.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('searchMatieres error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les étudiants d'une matière
export const getEtudiants = async (req: Request, res: Response) => {
  try {
    const matiereCode = String(req.params.code);
    
    let response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code matière invalide.'
    };

    if (!matiereCode || matiereCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que la matière existe
    const matiere = await Matiere.findByCode(matiereCode);
    if (!matiere) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Matière non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const etudiants = await Matiere.getEtudiants(matiereCode);
    
    response_api = {
      ...response_api,
      message: 'Étudiants de la matière récupérés avec succès',
      data: etudiants
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des étudiants.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getEtudiants error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les matières disponibles pour inscription
export const getMatieresDisponibles = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    const groupeCode = req.query.groupeCode ? String(req.query.groupeCode) : undefined;
    
    let response_api: ApiResponseOk<IMatiere[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'ID étudiant invalide.'
    };

    if (Number.isNaN(etudiantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieresDisponibles = await Matiere.findDisponiblesPourInscriptionSimple(etudiantId, groupeCode);
    
    response_api = {
      ...response_api,
      message: 'Matières disponibles pour inscription récupérées avec succès',
      data: matieresDisponibles
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières disponibles.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieresDisponibles error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Assigner un enseignant à une matière
export const assignerEnseignant = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const { enseignant_id } = req.body;
    
    let response_api: ApiResponseOk<IMatiere> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMatiere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Matière non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code matière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation de l'ID enseignant
    if (!enseignant_id || Number.isNaN(Number(enseignant_id))) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID enseignant invalide.',
        errors: { enseignant_id: 'L\'ID enseignant est requis et doit être un nombre valide' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const updated = await Matiere.update(code, { enseignant_id: Number(enseignant_id) });
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Enseignant assigné à la matière avec succès',
      data: updated
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de l\'assignation de l\'enseignant.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('assignerEnseignant error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};