import type { Request, Response } from 'express';
import { 
  IGroupeCours, 
  IGroupeCoursCreate, 
  IGroupeCoursUpdate, 
  IGroupeCoursWithDetails,
  IGroupeCoursFilters,
  IGroupeCoursStatistics,
  IUniteEnseignement
} from '../types/ICours';
import GroupeCours from '../Models/Groupe_cours';
import { 
  ApiErrorResponse, 
  ApiErrorValidationResponse, 
  ApiResponseOk,
  HTTP_STATUS, 
  IPaginationResult
} from '../types/api';

// Créer un nouveau groupe de cours
export const createGroupeCours = async (req: Request, res: Response) => {
  try {
    const newGroupe = req.body as Partial<IGroupeCoursCreate>;
    
    // Validation des champs requis
    const required = ['code', 'nom'];
    const missing = required.filter((field) => !(newGroupe as any)[field]);
    
    let response_api: ApiResponseOk<IGroupeCours> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IGroupeCours
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
    
    if (newGroupe.capacite_max && newGroupe.capacite_max <= 0) {
      validationErrors.capacite_max = 'La capacité maximale doit être supérieure à 0';
    }
    
    if (newGroupe.credits_total && newGroupe.credits_total <= 0) {
      validationErrors.credits_total = 'Le nombre de crédits doit être supérieur à 0';
    }

    if (Object.keys(validationErrors).length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Erreur de validation des données',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const groupe = await GroupeCours.create(newGroupe);
    
    response_api = {
      ...response_api,
      message: 'Groupe de cours créé avec succès',
      data: groupe as IGroupeCours
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la création du groupe de cours.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('createGroupeCours:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer un groupe par code
export const getGroupeCoursByCode = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IGroupeCoursWithDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGroupeCoursWithDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Groupe de cours non trouvé.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code de groupe invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const groupe = await GroupeCours.findByCode(code);
    
    if (!groupe) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Récupérer les détails supplémentaires
    const unitesEnseignement = await GroupeCours.getUnitesEnseignement(code);
    const etudiantsInscrits = await GroupeCours.getEtudiantsInscrits(code);
    const capacityInfo = await GroupeCours.checkCapacity(code);
    
    const groupeWithDetails: IGroupeCoursWithDetails = {
      ...groupe,
      nombre_inscrits: etudiantsInscrits.length,
      places_disponibles: capacityInfo.capacite_max ? (capacityInfo.capacite_max - etudiantsInscrits.length) : 0,
      taux_occupation: (capacityInfo.capacite_max && capacityInfo.capacite_max > 0)  ? 
        (etudiantsInscrits.length / capacityInfo.capacite_max) * 100 : 0,
      unites_enseignement: unitesEnseignement as IUniteEnseignement[]
    };

    response_api = {
      ...response_api,
      message: 'Groupe de cours trouvé avec succès',
      data: groupeWithDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération du groupe.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getGroupeCoursByCode - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer tous les groupes avec pagination
export const getGroupesCours = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: IGroupeCoursFilters = {};
    
    if (req.query.filiere_code) filters.filiere_code = String(req.query.filiere_code);
    if (req.query.niveau) filters.niveau = String(req.query.niveau);
    if (req.query.semestre) filters.semestre = String(req.query.semestre) as any;
    if (req.query.annee_academique_code) filters.annee_academique_code = String(req.query.annee_academique_code);
    if (req.query.statut) filters.statut = String(req.query.statut) as any;
    if (req.query.search) filters.search = String(req.query.search);

    let response_api: ApiResponseOk<IPaginationResult<IGroupeCoursWithDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IGroupeCoursWithDetails[]>
    };

    const result = await GroupeCours.findAll(page, limit, filters);
    
    response_api = {
      ...response_api,
      message: 'Liste des groupes de cours récupérée avec succès',
      data: result as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des groupes.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getGroupesCours - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour un groupe
export const updateGroupeCours = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const updateData = req.body as IGroupeCoursUpdate;
    
    let response_api: ApiResponseOk<IGroupeCours> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGroupeCours
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Groupe de cours non trouvé.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code de groupe invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation des données de mise à jour
    const validationErrors: Record<string, string> = {};
    
    if (updateData.capacite_max !== undefined && updateData.capacite_max <= 0) {
      validationErrors.capacite_max = 'La capacité maximale doit être supérieure à 0';
    }
    
    if (updateData.credits_total !== undefined && updateData.credits_total <= 0) {
      validationErrors.credits_total = 'Le nombre de crédits doit être supérieur à 0';
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

    const updated = await GroupeCours.update(code, updateData);
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Groupe de cours mis à jour avec succès',
      data: updated as IGroupeCours
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour du groupe.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateGroupeCours error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer un groupe
export const deleteGroupeCours = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IGroupeCours> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGroupeCours
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Groupe de cours non trouvé.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code de groupe invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const deleted = await GroupeCours.delete(code);
    
    if (!deleted) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Groupe de cours supprimé avec succès.',
      data: deleted as any
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la suppression du groupe.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('deleteGroupeCours - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les groupes avec statistiques
export const getGroupesWithStats = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    const filters: IGroupeCoursFilters = {};
    if (req.query.filiere_code) filters.filiere_code = String(req.query.filiere_code);
    if (req.query.statut) filters.statut = String(req.query.statut) as any;
    
    let response_api: ApiResponseOk<IPaginationResult<IGroupeCoursWithDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IGroupeCoursWithDetails[]>
    };

    // const groupes = await GroupeCours.getGroupesWithStats(page, limit, filters);
    const groupes = await GroupeCours.getGroupesWithStats();
    
    response_api = {
      ...response_api,
      message: 'Groupes avec statistiques récupérés avec succès',
      data: groupes as any
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des groupes avec statistiques.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getGroupesWithStats error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les étudiants inscrits à un groupe
export const getEtudiantsInscrits = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code de groupe invalide.'
    };

    if (!code || code.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que le groupe existe
    const groupe = await GroupeCours.findByCode(code);
    if (!groupe) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Groupe de cours non trouvé.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const etudiants = await GroupeCours.getEtudiantsInscrits(code);
    
    response_api = {
      ...response_api,
      message: 'Étudiants inscrits récupérés avec succès',
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
    console.error('getEtudiantsInscrits error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Vérifier la capacité
export const checkCapacity = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code de groupe invalide.'
    };

    if (!code || code.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que le groupe existe
    const groupe = await GroupeCours.findByCode(code);
    if (!groupe) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Groupe de cours non trouvé.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const capacityInfo = await GroupeCours.checkCapacity(code);
    
    const capaciteMax = capacityInfo.capacite_max ?? 0;
    const nombreInscrits = capacityInfo.nombre_inscrits ?? 0;

    // Ajouter des informations calculées
    const capacityWithCalculations = {
        ...capacityInfo,
        places_disponibles: capaciteMax - nombreInscrits,
        taux_occupation: capaciteMax > 0
            ? (nombreInscrits / capaciteMax) * 100
            : 0,
        est_plein: nombreInscrits >= capaciteMax
    };

    response_api = {
      ...response_api,
      message: 'Capacité vérifiée avec succès',
      data: capacityWithCalculations
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la vérification de la capacité.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('checkCapacity error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les unités d'enseignement
export const getUnitesEnseignement = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    
    let response_api: ApiResponseOk<IUniteEnseignement[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code de groupe invalide.'
    };

    if (!code || code.trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Vérifier que le groupe existe
    const groupe = await GroupeCours.findByCode(code);
    if (!groupe) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Groupe de cours non trouvé.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    const ues = await GroupeCours.getUnitesEnseignement(code);
    
    response_api = {
      ...response_api,
      message: 'Unités d\'enseignement récupérées avec succès',
      data: ues as IUniteEnseignement[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des UE.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getUnitesEnseignement error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les statistiques générales
export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    let response_api: ApiResponseOk<IGroupeCoursStatistics> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGroupeCoursStatistics
    };

    const stats = await GroupeCours.getStatistiques();
    
    response_api = {
      ...response_api,
      message: 'Statistiques des groupes de cours récupérées avec succès',
      data: stats as any
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
export const searchGroupesCours = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    
    let response_api: ApiResponseOk<IGroupeCours[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: []
    };

    const groupes = await GroupeCours.search(criteria);
    
    response_api = {
      ...response_api,
      message: 'Recherche de groupes de cours effectuée avec succès',
      data: groupes as IGroupeCours[]
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la recherche.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('searchGroupesCours error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Activer/désactiver un groupe
export const toggleStatutGroupe = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code);
    const { statut } = req.body;
    
    let response_api: ApiResponseOk<IGroupeCours> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGroupeCours
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Groupe de cours non trouvé.'
    };

    // Validation du code
    if (!code || code.trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'Code de groupe invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation du statut
    if (!statut || !['OUVERT', 'COMPLET', 'FERME', 'ANNULE'].includes(statut)) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Statut invalide.',
        errors: { statut: 'Le statut doit être OUVERT, COMPLET, FERME ou ANNULE' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    const updated = await GroupeCours.update(code, { statut });
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: `Statut du groupe mis à jour en "${statut}" avec succès`,
      data: updated as IGroupeCours
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors du changement de statut du groupe.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('toggleStatutGroupe error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};