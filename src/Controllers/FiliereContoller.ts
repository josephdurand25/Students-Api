// filiereController.ts
import type { Request, Response } from 'express';
import { 
  ApiErrorResponse, 
  ApiErrorValidationResponse, 
  ApiResponseOk 
} from '../types/api';
import Filiere from '../Models/Filiere';
import {
  IFiliere,
  IFiliereCreate,
  IFiliereUpdate,
  IFiliereWithDetails,
  IFiliereFilters
} from '../types/IFiliere';

// Créer une nouvelle filière
export const createFiliere = async (req: Request, res: Response) => {
  try {
    const filiereData = req.body as Partial<IFiliereCreate>;
    const required = ['code', 'nom'];
    const missing = required.filter((k) => !(filiereData as any)[k]);
    
    let response_api: ApiResponseOk<IFiliere> = {
      success: true,
      status_code: 201,
      data: {} as IFiliere
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: 400,
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
    
    // Valider niveaux_offerts s'il est présent
    if (filiereData.niveaux_offerts && !Array.isArray(filiereData.niveaux_offerts)) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Le champ niveaux_offerts doit être un tableau.',
        errors: { niveaux_offerts: 'Doit être un tableau de niveaux (ex: ["L1", "L2"])' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    // Définir statut par défaut
    const filiereToCreate = {
      ...filiereData,
      statut: filiereData.statut ?? 'actif'
    };
    
    const filiere = await Filiere.create(filiereToCreate);
    
    response_api = {
      ...response_api,
      message: 'Filière créée avec succès',
      data: filiere as IFiliere
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la filière.',
      error: error.message || JSON.stringify(error)
    };
    
    // Gestion des erreurs spécifiques
    if (error.message && error.message.includes('existe déjà')) {
      response_api_error.status_code = 409;
      response_api_error.message = error.message;
    }
    
    console.error('createFiliere:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une filière par son code
export const getFiliereByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    let response_api: ApiResponseOk<IFiliereWithDetails> = {
      success: true,
      status_code: 200,
      data: {} as IFiliereWithDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Filière non trouvée.'
    };
    
    if (!code || String(code).trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de filière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const filiere = await Filiere.findByCode(String(code));
    
    if (!filiere) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    response_api = {
      ...response_api,
      message: 'Filière trouvée',
      data: filiere as IFiliereWithDetails
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la filière.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getFiliereByCode - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les filières avec filtres et pagination
export const getFilieres = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    // Construire les filtres
    const filters: IFiliereFilters = {};
    
    if (req.query.departement) {
      filters.departement = String(req.query.departement);
    }
    
    if (req.query.responsable_id) {
      const responsableId = Number(req.query.responsable_id);
      if (!Number.isNaN(responsableId)) {
        filters.responsable_id = responsableId;
      }
    }
    
    if (req.query.search) {
      filters.search = String(req.query.search);
    }
    
    // Filtre pour statut actif/inactif
    const statut = req.query.statut;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    const result = await Filiere.findAll(page, limit, { ...filters, statut });
    
    response_api = {
      ...response_api,
      message: 'Liste des filières récupérée',
      data: result
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des filières.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getFilieres - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une filière
export const updateFiliere = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const updateData = req.body as IFiliereUpdate;
    
    let response_api: ApiResponseOk<IFiliere> = {
      success: true,
      status_code: 200,
      data: {} as IFiliere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Filière non trouvée.'
    };
    
    if (!code || String(code).trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de filière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Valider niveaux_offerts s'il est présent
    if (updateData.niveaux_offerts && !Array.isArray(updateData.niveaux_offerts)) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: 400,
        message: 'Le champ niveaux_offerts doit être un tableau.',
        errors: { niveaux_offerts: 'Doit être un tableau de niveaux (ex: ["L1", "L2"])' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    const updated = await Filiere.update(String(code), updateData);
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    response_api = {
      ...response_api,
      message: 'Filière mise à jour avec succès',
      data: updated
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la filière.',
      error: error.message || JSON.stringify(error)
    };
    console.error('updateFiliere error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une filière
export const deleteFiliere = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Filière non trouvée.'
    };
    
    if (!code || String(code).trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de filière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const deleted = await Filiere.delete(String(code));
    
    if (!deleted) {
      response_api = {
        ...response_api,
        status_code: 404,
        message: 'Filière non trouvée.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Filière supprimée avec succès.'
      };
    }
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la filière.',
      error: error.message || JSON.stringify(error)
    };
    
    // Gestion des erreurs spécifiques
    if (error.message && (
      error.message.includes('étudiants inscrits') || 
      error.message.includes('UEs associées')
    )) {
      response_api_error.status_code = 409;
      response_api_error.message = error.message;
    }
    
    console.error('deleteFiliere - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les UEs d'une filière
export const getFiliereUEs = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { semestre } = req.query;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 400,
      message: 'Code de filière invalide.'
    };
    
    if (!code || String(code).trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const semestreNumber = semestre ? Number(semestre) : undefined;
    const ues = await Filiere.getUEs(String(code), semestreNumber);
    
    response_api = {
      ...response_api,
      message: 'UEs récupérées avec succès',
      data: ues
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des UEs.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getFiliereUEs error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les étudiants d'une filière
export const getFiliereStudents = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { statut, niveau } = req.query;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 400,
      message: 'Code de filière invalide.'
    };
    
    if (!code || String(code).trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const students = await Filiere.getStudents(
      String(code), 
      statut as string, 
      niveau as string
    );
    
    response_api = {
      ...response_api,
      message: 'Étudiants récupérés avec succès',
      data: students
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des étudiants.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getFiliereStudents error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les statistiques d'une filière
export const getFiliereStats = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 400,
      message: 'Code de filière invalide.'
    };
    
    if (!code || String(code).trim() === '') {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const stats = await Filiere.getStats(String(code));
    
    response_api = {
      ...response_api,
      message: 'Statistiques récupérées avec succès',
      data: stats
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des statistiques.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getFiliereStats error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Changer le statut d'une filière (actif/inactif)
export const toggleStatutFiliere = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { statut } = req.body;
    
    let response_api: ApiResponseOk<IFiliere> = {
      success: true,
      status_code: 200,
      data: {} as IFiliere
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Filière non trouvée.'
    };
    
    if (!code || String(code).trim() === '') {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de filière invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Valider le statut
    const newStatut = statut ?? 'actif';
    
    const updated = await Filiere.update(String(code), { statut: newStatut });
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    const statusText = updated.statut ? 'activée' : 'désactivée';
    response_api = {
      ...response_api,
      message: `Filière ${statusText} avec succès`,
      data: updated
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors du changement de statut.',
      error: error.message || JSON.stringify(error)
    };
    console.error('toggleStatutFiliere error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Recherche avancée de filières
export const searchFilieres = async (req: Request, res: Response) => {
  try {
    const criteria: IFiliereFilters = req.body || {};
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    const filieres = await Filiere.search(criteria);
    
    response_api = {
      ...response_api,
      message: 'Recherche effectuée avec succès',
      data: filieres
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la recherche des filières.',
      error: error.message || JSON.stringify(error)
    };
    console.error('searchFilieres error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les statistiques générales des filières
export const getStatistiquesFilieres = async (_req: Request, res: Response) => {
  try {
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    const stats = await Filiere.getStatistiquesGenerales();
    
    response_api = {
      ...response_api,
      message: 'Statistiques générales récupérées avec succès',
      data: stats
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des statistiques.',
      error: error.message || JSON.stringify(error)
    };
    console.error('getStatistiquesFilieres error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};