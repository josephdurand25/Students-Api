import type { Request, Response } from 'express';
import { 
  IUniteEnseignement, 
  IUniteEnseignementCreate, 
  IUniteEnseignementUpdate, 
  IUniteEnseignementWithDetails,
  IUniteEnseignementFilters,
} from '../types/ICours';
import UniteEnseignement from '../Models/UE';
import { 
  ApiErrorResponse, 
  ApiErrorValidationResponse, 
  ApiResponseOk,
  HTTP_STATUS, 
  IPaginationResult
} from '../types/api';
import { TypeUE } from '../types/IGeneral';

// Créer une nouvelle UE
export const createUniteEnseignement = async (req: Request, res: Response) => {
  try {
    const newUE = req.body as Partial<IUniteEnseignementCreate>;
    
    // Validation des champs requis (minimum)
    const required = ['code', 'nom'];
    const missing = required.filter((field) => !(newUE as any)[field]);
    
    let response_api: ApiResponseOk<IUniteEnseignement> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IUniteEnseignement
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
    
    if (newUE.credits && newUE.credits <= 0) {
      validationErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }
    
    if (newUE.coefficient && newUE.coefficient <= 0) {
      validationErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }
    
    if (newUE.volume_horaire_total && newUE.volume_horaire_total <= 0) {
      validationErrors.volume_horaire_total = 'Le volume horaire total doit être supérieur à 0';
    }
    
    if (newUE.type && !['OBLIGATOIRE', 'OPTIONNEL', 'TRANSVERSAL'].includes(newUE.type)) {
      validationErrors.type = 'Le type doit être OBLIGATOIRE, OPTIONNEL ou TRANSVERSAL';
    }

    if (Object.keys(validationErrors).length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const ue = await UniteEnseignement.create(newUE);
    
    response_api = {
      ...response_api,
      message: 'Unité d\'enseignement créée avec succès',
      data: ue as IUniteEnseignement
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la création de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('createUniteEnseignement:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une UE par code
export const getUniteEnseignementByCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IUniteEnseignementWithDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IUniteEnseignementWithDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Unité d\'enseignement non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code UE invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const ue = await UniteEnseignement.findByCodeWithMatieres(code);
    
    if (!ue) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Unité d\'enseignement trouvée avec succès',
      data: ue as IUniteEnseignementWithDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUniteEnseignementByCode - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une UE simple par code
export const getUniteEnseignementSimpleByCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IUniteEnseignement> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IUniteEnseignement
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Unité d\'enseignement non trouvée.'
    };

    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code UE invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const ue = await UniteEnseignement.findByCode(code);
    
    if (!ue) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Unité d\'enseignement trouvée avec succès',
      data: ue
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUniteEnseignementSimpleByCode error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les UE avec pagination
export const getUnitesEnseignement = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: IUniteEnseignementFilters = {};
    
    if (req.query.groupe_cours_code) filters.groupe_cours_code = String(req.query.groupe_cours_code);
    if (req.query.type) filters.type = String(req.query.type) as TypeUE;
    if (req.query.search) filters.search = String(req.query.search);

    let response_api: ApiResponseOk<IPaginationResult<IUniteEnseignementWithDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IUniteEnseignementWithDetails[]>
    };

    const result = await UniteEnseignement.findAll(page, limit, filters);
    
    response_api = {
      ...response_api,
      message: 'Liste des unités d\'enseignement récupérée avec succès',
      data: result as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUnitesEnseignement - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une UE
export const updateUniteEnseignement = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const updateData = req.body as IUniteEnseignementUpdate;
    
    let response_api: ApiResponseOk<IUniteEnseignement> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IUniteEnseignement
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Unité d\'enseignement non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code UE invalide.'
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
    
    if (updateData.volume_horaire_total !== undefined && updateData.volume_horaire_total <= 0) {
      validationErrors.volume_horaire_total = 'Le volume horaire total doit être supérieur à 0';
    }
    
    if (updateData.type && !['OBLIGATOIRE', 'OPTIONNEL', 'TRANSVERSAL'].includes(updateData.type)) {
      validationErrors.type = 'Le type doit être OBLIGATOIRE, OPTIONNEL ou TRANSVERSAL';
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

    const updated = await UniteEnseignement.update(code, updateData);
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Unité d\'enseignement mise à jour avec succès',
      data: updated
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateUniteEnseignement error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une UE
export const deleteUniteEnseignement = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IUniteEnseignement> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IUniteEnseignement
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Unité d\'enseignement non trouvée.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code UE invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier si l'UE a des matières avant suppression
    const ueWithMatieres = await UniteEnseignement.findByCodeWithMatieres(code);
    if (ueWithMatieres?.matieres && ueWithMatieres.matieres.length > 0) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Impossible de supprimer l\'unité d\'enseignement',
        errors: {
          contraint: 'Cette unité d\'enseignement contient des matières. Veuillez d\'abord supprimer les matières associées.'
        }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const deleted = await UniteEnseignement.delete(code);
    
    if (!deleted) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Unité d\'enseignement supprimée avec succès.',
      data: deleted as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la suppression de l\'UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('deleteUniteEnseignement - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les UE d'un groupe de cours
export const getUEByGroupeCours = async (req: Request, res: Response) => {
  try {
    const groupeCode = String(req.params.groupeCode);
    
    let response_api: ApiResponseOk<IUniteEnseignement[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code groupe invalide.'
    };

    if (!groupeCode || groupeCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const ues = await UniteEnseignement.findByGroupeCours(groupeCode);
    
    response_api = {
      ...response_api,
      message: 'Unités d\'enseignement du groupe récupérées avec succès',
      data: ues as IUniteEnseignement[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des UE du groupe.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUEByGroupeCours error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les matières d'une UE
export const getMatieres = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.code);
    
    let response_api: ApiResponseOk<any[]> = {
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

    // Vérifier que l'UE existe
    const ue = await UniteEnseignement.findByCode(ueCode);
    if (!ue) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Unité d\'enseignement non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const matieres = await UniteEnseignement.getMatieres(ueCode);
    
    response_api = {
      ...response_api,
      message: 'Matières de l\'UE récupérées avec succès',
      data: matieres
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des matières.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMatieres error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Calculer le volume horaire
export const calculateVolumeHoraire = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.code);
    
    let response_api: ApiResponseOk<{ volume_horaire_total: number }> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: { volume_horaire_total: 0 }
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code UE invalide.'
    };

    if (!ueCode || ueCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que l'UE existe
    const ue = await UniteEnseignement.findByCode(ueCode);
    if (!ue) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Unité d\'enseignement non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const total = await UniteEnseignement.calculateVolumeHoraire(ueCode);
    
    response_api = {
      ...response_api,
      message: 'Volume horaire calculé avec succès',
      data: { volume_horaire_total: total }
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors du calcul du volume horaire.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('calculateVolumeHoraire error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour le volume horaire
export const updateVolumeHoraire = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.code);
    
    let response_api: ApiResponseOk<{ volume_horaire_total: number }> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: { volume_horaire_total: 0 }
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code UE invalide.'
    };

    if (!ueCode || ueCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que l'UE existe
    const ue = await UniteEnseignement.findByCode(ueCode);
    if (!ue) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Unité d\'enseignement non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    await UniteEnseignement.updateVolumeHoraire(ueCode);
    const total = await UniteEnseignement.calculateVolumeHoraire(ueCode);
    
    response_api = {
      ...response_api,
      message: 'Volume horaire mis à jour avec succès',
      data: { volume_horaire_total: total }
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour du volume horaire.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateVolumeHoraire error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les statistiques
export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {}
    };

    const stats = await UniteEnseignement.getStatistiques();
    
    response_api = {
      ...response_api,
      message: 'Statistiques des unités d\'enseignement récupérées avec succès',
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
export const searchUnitesEnseignement = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    
    let response_api: ApiResponseOk<IUniteEnseignement[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };

    const ues = await UniteEnseignement.search(criteria);
    
    response_api = {
      ...response_api,
      message: 'Recherche d\'unités d\'enseignement effectuée avec succès',
      data: ues as IUniteEnseignement[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la recherche.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('searchUnitesEnseignement error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir toutes les UE avec leurs matières
export const getAllWithMatieres = async (req: Request, res: Response) => {
  try {
    let response_api: ApiResponseOk<IUniteEnseignementWithDetails[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };

    const ues = await UniteEnseignement.getAllWithMatieres();
    
    response_api = {
      ...response_api,
      message: 'Unités d\'enseignement avec leurs matières récupérées avec succès',
      data: ues as IUniteEnseignementWithDetails[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des UE avec matières.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getAllWithMatieres error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Vérifier si une UE a des étudiants
export const hasEtudiants = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.code);
    
    let response_api: ApiResponseOk<{ has_etudiants: boolean }> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: { has_etudiants: false }
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code UE invalide.'
    };

    if (!ueCode || ueCode.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que l'UE existe
    const ue = await UniteEnseignement.findByCode(ueCode);
    if (!ue) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Unité d\'enseignement non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const result = await UniteEnseignement.hasEtudiants(ueCode);
    
    response_api = {
      ...response_api,
      message: 'Vérification effectuée avec succès',
      data: { has_etudiants: result }
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la vérification des étudiants.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('hasEtudiants error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les UE disponibles pour un étudiant
export const getUEDisponiblesPourEtudiant = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    
    let response_api: ApiResponseOk<IUniteEnseignement[]> = {
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

    const uesDisponibles = await UniteEnseignement.findDisponiblesPourEtudiant(etudiantId);
    
    response_api = {
      ...response_api,
      message: 'Unités d\'enseignement disponibles récupérées avec succès',
      data: uesDisponibles as IUniteEnseignement[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des UE disponibles.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUEDisponiblesPourEtudiant error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Calculer la moyenne d'une UE pour un étudiant
export const calculateMoyenneUE = async (req: Request, res: Response) => {
  try {
    const ueCode = String(req.params.code);
    const etudiantId = Number(req.params.etudiantId);
    
    let response_api: ApiResponseOk<{ moyenne: number }> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: { moyenne: 0 }
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Paramètres invalides.'
    };

    if (!ueCode || ueCode.trim() === '' || Number.isNaN(etudiantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que l'UE existe
    const ue = await UniteEnseignement.findByCode(ueCode);
    if (!ue) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Unité d\'enseignement non trouvée.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const moyenne = await UniteEnseignement.calculateMoyenneUE(etudiantId, ueCode);
    
    response_api = {
      ...response_api,
      message: 'Moyenne de l\'UE calculée avec succès',
      data: { moyenne }
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors du calcul de la moyenne.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('calculateMoyenneUE error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};