import type { Request, Response } from 'express';
import DossierCandidature from '../Models/DossierCandidature';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface IDossierRequest {
  etudiant_id?: number;
  filiere_code?: string;
  statut?: 'EN_ATTENTE' | 'EN_EVALUATION' | 'ACCEPTE' | 'REFUSE' | 'CLOTURER' | 'ANNULE';
  type_candidature?: string;
  frais_dossier?: number;
  frais_payes?: number;
  etape_actuelle?: string;
  date_limite_complet?: string;
  informations_supplementaires?: string;
  specialite_demandee?: string;
  niveau_demande?: string;
  etapes?: string;
}

// Créer un nouveau dossier
export const createDossier = async (req: Request, res: Response) => {
  try {
    const dossierData = req.body as IDossierRequest;
    const required = ['etudiant_id', 'filiere_code'];
    const missing = required.filter((k) => !(dossierData as any)[k]);
    
    if (missing.length > 0) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: `Champs requis manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le champ ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    const dossier = await DossierCandidature.create(dossierData);
    
    if (!dossier) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création du dossier.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Dossier créé avec succès',
      data: dossier
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création du dossier.',
      error: JSON.stringify(error)
    };
    console.error('createDossier:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer un dossier par ID
export const getDossierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const dossier = await DossierCandidature.getById(Number(idStr));
    
    if (!dossier) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Dossier non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: dossier
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération du dossier.',
      error: JSON.stringify(error)
    };
    console.error('getDossierById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les dossiers d'un étudiant
export const getDossiersByEtudiant = async (req: Request, res: Response) => {
  try {
    const { etudiantId } = req.params;
    const etudiantIdStr = Array.isArray(etudiantId) ? etudiantId[0] : etudiantId;
    
    if (!etudiantIdStr || Number.isNaN(Number(etudiantIdStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID étudiant invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const dossiers = await DossierCandidature.findByEtudiant(Number(etudiantIdStr));
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: dossiers
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des dossiers.',
      error: JSON.stringify(error)
    };
    console.error('getDossiersByEtudiant:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer tous les dossiers
export const getAllDossiers = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const statutQuery = typeof req.query.statut === 'string' ? req.query.statut : undefined;
    const filiereCodeQuery = typeof req.query.filiere_code === 'string' ? req.query.filiere_code : undefined;
    const etudiantIdQuery = typeof req.query.etudiant_id === 'string' ? req.query.etudiant_id : undefined;
    
    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 10;
    const statut = statutQuery ? String(statutQuery) : undefined;
    const filiere_code = filiereCodeQuery ? String(filiereCodeQuery) : undefined;
    const etudiant_id = etudiantIdQuery ? Number(etudiantIdQuery) : undefined;
    
    let filters = {};
    if (statut) filters = { ...filters, statut };
    if (filiere_code) filters = { ...filters, filiere_code };
    if (etudiant_id && !Number.isNaN(etudiant_id)) filters = { ...filters, etudiant_id };
    
    const result = await DossierCandidature.findAll(page, limit, filters);
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: result.data
    };
    if (result.pagination) response_api.pagination = result.pagination;
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des dossiers.',
      error: JSON.stringify(error)
    };
    console.error('getAllDossiers:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour un dossier
export const updateDossier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const dossierData = req.body as Partial<IDossierRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const dossier = await DossierCandidature.update(Number(idStr), dossierData);
    
    if (!dossier) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Dossier non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Dossier mis à jour avec succès',
      data: dossier
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour du dossier.',
      error: JSON.stringify(error)
    };
    console.error('updateDossier:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer un dossier
export const deleteDossier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    await DossierCandidature.delete(Number(idStr));
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Dossier non trouvé ou déjà supprimé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Dossier supprimé avec succès',
      data: { id }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression du dossier.',
      error: JSON.stringify(error)
    };
    console.error('deleteDossier:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createDossier,
  getDossierById,
  getDossiersByEtudiant,
  getAllDossiers,
  updateDossier,
  deleteDossier
};
