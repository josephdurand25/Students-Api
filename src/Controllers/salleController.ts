import type { Request, Response } from 'express';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk } from '../types/api';
import Salle from '../Models/Salle';
import { ISalle, ISalleCreate, TypeSalle } from '../types/ISalle';


// Créer une nouvelle salle
export const createSalle = async (req: Request, res: Response) => {
  try {
    const salleData = req.body as ISalleCreate;
    const required = ['nom', 'capacite', 'type'];
    const missing = required.filter((k) => !(salleData as any)[k]);
    
    let response_api: ApiResponseOk<ISalle> = {
      success: true,
      status_code: 201,
      data: {} as ISalle
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
    
    // Valider le type de salle
    const validTypes: TypeSalle[] = ['AMPHI', 'TD', 'TP', 'LABO', 'ATELIER'];
    if (!validTypes.includes(salleData.type)) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Type de salle invalide.',
        errors: { type: 'Le type doit être l\'un des suivants: AMPHI, TD, TP, LABO, ATELIER' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    // Ici vous appelleriez votre modèle Salle
    const salle = await Salle.create(salleData);
    
    response_api = {
      ...response_api,
      message: 'Salle créée avec succès',
      data: salle as ISalle
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la salle.',
      error: JSON.stringify(error)
    };
    console.error('createSalle:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une salle par son code
export const getSalleByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const code_sale = String(code);
    
    let response_api: ApiResponseOk<ISalle> = {
      success: true,
      status_code: 200,
      data: {} as ISalle
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Salle non trouvée.'
    };
    
    if (!code_sale) {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de salle invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Ici vous appelleriez votre modèle Salle
    const salle = await Salle.findByCode(code_sale);
    if (!salle) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    response_api = {
      ...response_api,
      message: 'Salle trouvée',
      data: salle
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la salle.',
      error: JSON.stringify(error)
    };
    console.error('getSalleByCode - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les salles avec filtres
export const getSalles = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    const filters: any = {};
    if (req.query.type) filters.type = String(req.query.type);
    if (req.query.capacite_min) filters.capacite_min = Number(req.query.capacite_min);
    if (req.query.capacite_max) filters.capacite_max = Number(req.query.capacite_max);
    if (req.query.search) filters.search = String(req.query.search);
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    // Ici vous appelleriez votre modèle Salle
    const result = await Salle.findAll(page, limit, filters);

    response_api = {
      ...response_api,
      message: 'Liste des salles récupérée',
      data: result
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des salles.',
      error: JSON.stringify(error)
    };
    console.error('getSalles - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour une salle
export const updateSalle = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const code_sale = String(code);
    const updateData = req.body;
    
    let response_api: ApiResponseOk<ISalle> = {
      success: true,
      status_code: 200,
      data: {} as ISalle
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Salle non trouvée.'
    };
    
    if (!code_sale) {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de salle invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Ici vous appelleriez votre modèle Salle
    // const updated = await Salle.update(code, updateData);
    const updated: ISalle = {
      code: code_sale,
      nom: updateData.nom || 'Salle mise à jour',
      capacite: updateData.capacite || 50,
      type: updateData.type || 'TD',
      equipements: updateData.equipements || {}
    }; // Simulation
    
    if (!updated) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    response_api = {
      ...response_api,
      message: 'Salle mise à jour avec succès',
      data: updated
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la salle.',
      error: JSON.stringify(error)
    };
    console.error('updateSalle error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une salle
export const deleteSalle = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const code_sale = String(code)
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 404,
      message: 'Salle non trouvée.'
    };
    
    if (!code_sale) {
      response_not_found = {
        ...response_not_found,
        status_code: 400,
        error: 'Code de salle invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Ici vous appelleriez votre modèle Salle
    const deleted = await Salle.delete(code_sale);
    
    if (!deleted) {
      response_api = {
        ...response_api,
        status_code: 404,
        message: 'Salle non trouvée.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Salle supprimée avec succès.'
      };
    }
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la salle.',
      error: JSON.stringify(error)
    };
    console.error('deleteSalle - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir l'emploi du temps d'une salle
export const getSalleSchedule = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const code_sale = String(code); 
    
    const { jour } = req.query;
    const jour_choisi =  typeof jour === 'string' ? jour : '';
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: 400,
      message: 'Code de salle invalide.'
    };
    
    if (!code_sale) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }
    
    // Ici vous appelleriez votre modèle Salle
    const schedule = await Salle.getSchedule(code_sale, jour_choisi);

    response_api = {
      ...response_api,
      message: 'Emploi du temps récupéré avec succès',
      data: schedule
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de l\'emploi du temps.',
      error: JSON.stringify(error)
    };
    console.error('getSalleSchedule error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Vérifier la disponibilité d'une salle
export const getSalleAvailability = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const code_sale = String(code); 
    const { date, heure_debut, heure_fin } = req.query;
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: 400,
      message: 'Paramètres manquants.',
      errors: {}
    };
    
    if (!code_sale || !date || !heure_debut || !heure_fin) {
      const missing = [];
      if (!code) missing.push('code');
      if (!date) missing.push('date');
      if (!heure_debut) missing.push('heure_debut');
      if (!heure_fin) missing.push('heure_fin');
      
      response_validation_errors = {
        ...response_validation_errors,
        message: `Paramètres manquants: ${missing.join(', ')}`,
        errors: missing.reduce((acc, field) => {
          acc[field] = `Le paramètre ${field} est requis.`;
          return acc;
        }, {} as Record<string, string>)
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    // Ici vous appelleriez votre modèle Salle
    const disponible = await Salle.checkAvailability(code_sale, String(date), String(heure_debut), String(heure_fin));

    
    response_api = {
      ...response_api,
      message: disponible ? 'Salle disponible pour ce créneau' : 'Salle occupée pour ce créneau',
      data: { disponible }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la vérification de la disponibilité.',
      error: JSON.stringify(error)
    };
    console.error('getSalleAvailability error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Rechercher des salles
export const searchSalles = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
      data: {}
    };
    
    // Ici vous appelleriez votre modèle Salle
    const salles = await Salle.search(criteria);
    
    response_api = {
      ...response_api,
      message: 'Recherche effectuée avec succès',
      data: salles
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la recherche des salles.',
      error: JSON.stringify(error)
    };
    console.error('searchSalles error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};