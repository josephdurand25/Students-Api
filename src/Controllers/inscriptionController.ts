import type { Request, Response } from 'express';
import Inscription from '../Models/Inscription';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface IInscriptionRequest {
  etudiant_id?: number;
  filiere_code?: string;
  date_inscription?: string;
  statut?: 'EN_ATTENTE' | 'VALIDE' | 'REJETEE' | 'ANNULEE';
}

// Créer une nouvelle inscription
export const createInscription = async (req: Request, res: Response) => {
  try {
    const inscriptionData = req.body as IInscriptionRequest;
    const required = ['etudiant_id', 'filiere_code'];
    const missing = required.filter((k) => !(inscriptionData as any)[k]);
    
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
    
    const inscription = await Inscription.create(inscriptionData);
    
    if (!inscription) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création de l\'inscription.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Inscription créée avec succès',
      data: inscription
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de l\'inscription.',
      error: JSON.stringify(error)
    };
    console.error('createInscription:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une inscription par ID
export const getInscriptionById = async (req: Request, res: Response) => {
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
    
    const inscription = await Inscription.findByNumero(idStr);
    
    if (!inscription) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Inscription non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: inscription
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de l\'inscription.',
      error: JSON.stringify(error)
    };
    console.error('getInscriptionById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les inscriptions
export const getAllInscriptions = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const etudiant_id = req.query.etudiant_id ? Number(req.query.etudiant_id) : undefined;
    const filiere_code = typeof req.query.filiere_code === 'string' ? req.query.filiere_code : undefined;
    
    let filters = {};
    if (etudiant_id) filters = { ...filters, etudiant_id };
    if (filiere_code) filters = { ...filters, filiere_code };
    
    const result = await Inscription.findAll(page, limit, filters);
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: result.data
    };
    
    if (result.pagination) {
      response_api.pagination = result.pagination;
    }
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des inscriptions.',
      error: JSON.stringify(error)
    };
    console.error('getAllInscriptions:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une inscription
export const updateInscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const inscriptionData = req.body as Partial<IInscriptionRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const inscription = await Inscription.update(idStr, inscriptionData);
    
    if (!inscription) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Inscription non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Inscription mise à jour avec succès',
      data: inscription
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de l\'inscription.',
      error: JSON.stringify(error)
    };
    console.error('updateInscription:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une inscription
export const deleteInscription = async (req: Request, res: Response) => {
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
    
    const success = await Inscription.delete(idStr);
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Inscription non trouvée ou déjà supprimée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Inscription supprimée avec succès',
      data: { id }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de l\'inscription.',
      error: JSON.stringify(error)
    };
    console.error('deleteInscription:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createInscription,
  getInscriptionById,
  getAllInscriptions,
  updateInscription,
  deleteInscription
};
