import type { Request, Response } from 'express';
import SessionExamen from '../Models/SessionExamen';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface ISessionExamenRequest {
  code?: string;
  nom?: string;
  type?: 'NORMAL' | 'RATTRAPAGE' | 'BLANC';
  annee_academique_code?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: 'PROGRAMMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
}

// Créer une nouvelle session d'examen
export const createSessionExamen = async (req: Request, res: Response) => {
  try {
    const sessionData = req.body as ISessionExamenRequest;
    const required = ['code', 'nom'];
    const missing = required.filter((k) => !(sessionData as any)[k]);
    
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
    
    const session = await SessionExamen.create(sessionData);
    
    if (!session) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création de la session d\'examen.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Session d\'examen créée avec succès',
      data: session
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la session d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('createSessionExamen:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une session par code
export const getSessionByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const codeStr = Array.isArray(code) ? code[0] : code;
    
    if (!codeStr || typeof codeStr !== 'string') {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Code invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const session = await SessionExamen.getByCode(codeStr);
    
    if (!session) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Session d\'examen non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: session
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la session d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('getSessionByCode:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une session par ID
export const getSessionById = async (req: Request, res: Response) => {
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
    
    const session = await SessionExamen.getById(Number(idStr));
    
    if (!session) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Session d\'examen non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: session
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la session d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('getSessionById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les sessions d'une année académique
export const getSessionsByAnneeAcademique = async (req: Request, res: Response) => {
  try {
    const { anneeAcademiqueCode } = req.params;
    const anneeCodeStr = Array.isArray(anneeAcademiqueCode) ? anneeAcademiqueCode[0] : anneeAcademiqueCode;
    
    if (!anneeCodeStr || typeof anneeCodeStr !== 'string') {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Code année académique invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const sessions = await SessionExamen.findByAnneeAcademique(anneeCodeStr);
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: sessions
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des sessions d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('getSessionsByAnneeAcademique:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les sessions
export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const anneeCodeQuery = typeof req.query.annee_academique_code === 'string' ? req.query.annee_academique_code : undefined;
    const typeQuery = typeof req.query.type === 'string' ? req.query.type : undefined;
    const statutQuery = typeof req.query.statut === 'string' ? req.query.statut : undefined;
    
    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 10;
    const annee_academique_code = anneeCodeQuery ? String(anneeCodeQuery) : undefined;
    const type = typeQuery ? String(typeQuery) : undefined;
    const statut = statutQuery ? String(statutQuery) : undefined;
    
    let filters = {};
    if (annee_academique_code) filters = { ...filters, annee_academique_code };
    if (type) filters = { ...filters, type };
    if (statut) filters = { ...filters, statut };
    
    const result = await SessionExamen.findAll(page, limit, filters);
    
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
      message: 'Erreur serveur lors de la récupération des sessions d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('getAllSessions:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const sessionData = req.body as Partial<ISessionExamenRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const session = await SessionExamen.update(Number(idStr), sessionData);
    
    if (!session) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Session d\'examen non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Session d\'examen mise à jour avec succès',
      data: session
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la session d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('updateSession:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une session
export const deleteSession = async (req: Request, res: Response) => {
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
    
    await SessionExamen.delete(Number(idStr));
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Session d\'examen non trouvée ou déjà supprimée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Session d\'examen supprimée avec succès',
      data: { id }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la session d\'examen.',
      error: JSON.stringify(error)
    };
    console.error('deleteSession:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createSessionExamen,
  getSessionByCode,
  getSessionById,
  getSessionsByAnneeAcademique,
  getAllSessions,
  updateSession,
  deleteSession
};
