import type { Request, Response } from 'express';
import Presence from '../Models/Presence';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface IPresenceRequest {
  etudiant_id?: number;
  seance_id?: number;
  statut_presence?: 'PRESENT' | 'ABSENT' | 'RETARD' | 'JUSTIFIE';
  justification?: string;
  note_enseignant?: string;
}

// Créer une nouvelle présence
export const createPresence = async (req: Request, res: Response) => {
  try {
    const presenceData = req.body as IPresenceRequest;
    const required = ['etudiant_id', 'seance_id'];
    const missing = required.filter((k) => !(presenceData as any)[k]);
    
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
    
    const presence = await Presence.create(presenceData);
    
    if (!presence) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création de la présence.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Présence créée avec succès',
      data: presence
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la présence.',
      error: JSON.stringify(error)
    };
    console.error('createPresence:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une présence par ID
export const getPresenceById = async (req: Request, res: Response) => {
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
    
    const presence = await Presence.getById(Number(idStr));
    
    if (!presence) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Présence non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: presence
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la présence.',
      error: JSON.stringify(error)
    };
    console.error('getPresenceById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les présences
export const getAllPresences = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const etudiantIdQuery = typeof req.query.etudiant_id === 'string' ? req.query.etudiant_id : undefined;
    const seanceIdQuery = typeof req.query.seance_id === 'string' ? req.query.seance_id : undefined;
    const statutQuery = typeof req.query.statut_presence === 'string' ? req.query.statut_presence : undefined;
    
    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 10;
    const etudiant_id = etudiantIdQuery ? Number(etudiantIdQuery) : undefined;
    const seance_id = seanceIdQuery ? Number(seanceIdQuery) : undefined;
    const statut_presence = statutQuery ? String(statutQuery) : undefined;
    
    let filters = {};
    if (etudiant_id && !Number.isNaN(etudiant_id)) filters = { ...filters, etudiant_id };
    if (seance_id && !Number.isNaN(seance_id)) filters = { ...filters, seance_id };
    if (statut_presence) filters = { ...filters, statut_presence };
    
    const result = await Presence.findAll(page, limit, filters);
    
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
      message: 'Erreur serveur lors de la récupération des présences.',
      error: JSON.stringify(error)
    };
    console.error('getAllPresences:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une présence
export const updatePresence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const presenceData = req.body as Partial<IPresenceRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const presence = await Presence.update(Number(idStr), presenceData);
    
    if (!presence) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Présence non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Présence mise à jour avec succès',
      data: presence
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la présence.',
      error: JSON.stringify(error)
    };
    console.error('updatePresence:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une présence
export const deletePresence = async (req: Request, res: Response) => {
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
    
    await Presence.delete(Number(idStr));
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Présence non trouvée ou déjà supprimée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Présence supprimée avec succès',
      data: { id }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la présence.',
      error: JSON.stringify(error)
    };
    console.error('deletePresence:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createPresence,
  getPresenceById,
  getAllPresences,
  updatePresence,
  deletePresence
};
