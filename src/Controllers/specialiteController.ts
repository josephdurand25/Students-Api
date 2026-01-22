import type { Request, Response } from 'express';
import Specialite from '../Models/Specialite';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface ISpecialiteRequest {
  code?: string;
  nom?: string;
  description?: string;
  filiere_code?: string;
  niveau?: string;
}

// Créer une nouvelle spécialité
export const createSpecialite = async (req: Request, res: Response) => {
  try {
    const specialiteData = req.body as ISpecialiteRequest;
    const required = ['code', 'nom'];
    const missing = required.filter((k) => !(specialiteData as any)[k]);
    
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
    
    const specialite = await Specialite.create(specialiteData);
    
    if (!specialite) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création de la spécialité.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Spécialité créée avec succès',
      data: specialite
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la spécialité.',
      error: JSON.stringify(error)
    };
    console.error('createSpecialite:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une spécialité par code
export const getSpecialiteByCode = async (req: Request, res: Response) => {
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
    
    const specialite = await Specialite.getByCode(codeStr);
    
    if (!specialite) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Spécialité non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: specialite
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la spécialité.',
      error: JSON.stringify(error)
    };
    console.error('getSpecialiteByCode:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les spécialités d'une filière
export const getSpecialitesByFiliere = async (req: Request, res: Response) => {
  try {
    const { filiereCode } = req.params;
    const filiereCodeStr = Array.isArray(filiereCode) ? filiereCode[0] : filiereCode;
    
    if (!filiereCodeStr || typeof filiereCodeStr !== 'string') {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Code filière invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const specialites = await Specialite.findByFiliere(filiereCodeStr);
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: specialites
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des spécialités.',
      error: JSON.stringify(error)
    };
    console.error('getSpecialitesByFiliere:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les spécialités
export const getAllSpecialites = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const filiereCodeQuery = typeof req.query.filiere_code === 'string' ? req.query.filiere_code : undefined;
    const niveauQuery = typeof req.query.niveau === 'string' ? req.query.niveau : undefined;
    const searchQuery = typeof req.query.search === 'string' ? req.query.search : undefined;
    
    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 10;
    const filiere_code = filiereCodeQuery ? String(filiereCodeQuery) : undefined;
    const niveau = niveauQuery ? String(niveauQuery) : undefined;
    const search = searchQuery ? String(searchQuery) : undefined;
    
    let filters = {};
    if (filiere_code) filters = { ...filters, filiere_code };
    if (niveau) filters = { ...filters, niveau };
    if (search) filters = { ...filters, search };
    
    const result = await Specialite.findAll(page, limit, filters);
    
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
      message: 'Erreur serveur lors de la récupération des spécialités.',
      error: JSON.stringify(error)
    };
    console.error('getAllSpecialites:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une spécialité
export const updateSpecialite = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const codeStr = Array.isArray(code) ? code[0] : code;
    const specialiteData = req.body as Partial<ISpecialiteRequest>;
    
    if (!codeStr || typeof codeStr !== 'string') {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Code invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const specialite = await Specialite.update(codeStr, specialiteData);
    
    if (!specialite) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Spécialité non trouvée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Spécialité mise à jour avec succès',
      data: specialite
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la spécialité.',
      error: JSON.stringify(error)
    };
    console.error('updateSpecialite:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une spécialité
export const deleteSpecialite = async (req: Request, res: Response) => {
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
    
    await Specialite.delete(codeStr);
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Spécialité non trouvée ou déjà supprimée.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Spécialité supprimée avec succès',
      data: { code }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la spécialité.',
      error: JSON.stringify(error)
    };
    console.error('deleteSpecialite:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createSpecialite,
  getSpecialiteByCode,
  getSpecialitesByFiliere,
  getAllSpecialites,
  updateSpecialite,
  deleteSpecialite
};
