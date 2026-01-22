import type { Request, Response } from 'express';
import { ICours, ICoursCreate, ICoursUpdate } from '../types/ICours';
import Cours from '../Models/Cours';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

// Créer un nouveau cours
export const createCours = async (req: Request, res: Response) => {
  try {
    const newCours = req.body as Partial<ICoursCreate>;
    const required = ['code', 'nom'];
    const missing = required.filter((k) => !(newCours as any)[k]);
    
    let response_api: ApiResponseOk<ICours> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as ICours
    };
    let response_validation_errors : ApiErrorValidationResponse = {
      success: false,
      status_code: 400,
      message: 'Erreur de validation des données.',
      errors: {}
    };
    let response_error_api : ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.CONFLICT,
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
      }
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    // Vérifier si le code existe déjà
    const existingCours = await Cours.findByCode(newCours.code);
    if (existingCours) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 409,
        message: `Un cours avec le code ${newCours.code} existe déjà`,
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Vérifier que les niveaux sont fournis
    if (!newCours.niveaux || newCours.niveaux.length === 0) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: 'Au moins un niveau doit être sélectionné',
      };
      return res.status(response_api.status_code).json(response_api);
    }

    const cours = await Cours.create(newCours);
    response_api = {
      ...response_api,
      message: 'Cours créé avec succès',
      data: cours as ICours
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création du cours.',
      error: JSON.stringify(error)
    };
    console.error('createCours:', response_api);
    res.status(500).json(response_api);
  }
};

// Récupérer un cours par ID
export const getCoursById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api: ApiResponseOk<ICours> = {
      success: true,
      status_code: 200,
    };

    if (isNaN(id)) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: 'ID invalide.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    const cours = await Cours.findById(id);
    if (!cours) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Cours non trouvé.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    response_api = {
      ...response_api,
      message: 'Cours trouvé',
      data: cours as ICours
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération du cours.',
      error: JSON.stringify(error)
    };
    console.error('getCoursById - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer tous les cours avec pagination et filtres
export const getCours = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: any = {};
    if (req.query.filiere) filters.filiere = String(req.query.filiere);
    if (req.query.niveau) filters.niveau = String(req.query.niveau);
    if (req.query.semestre) filters.semestre = String(req.query.semestre);
    if (req.query.professeur) filters.professeur = String(req.query.professeur);
    if (req.query.statut) filters.statut = String(req.query.statut);
    if (req.query.search) filters.search = String(req.query.search);

    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
    };

    const result = await Cours.findAll(page, limit, filters);
    response_api = {
      ...response_api,
      message: 'Liste des cours récupérée',
      data: result
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des cours.',
      error: JSON.stringify(error)
    };
    console.error('getCours - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour un cours
export const updateCours = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api: ApiResponseOk<ICours> = {
      success: true,
      status_code: 200,
    };

    if (isNaN(id)) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: 'ID invalide.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Vérifier si le cours existe
    const existingCours = await Cours.findById(id);
    if (!existingCours) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Cours non trouvé.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.code && req.body.code !== existingCours.code) {
      const codeExists = await Cours.findByCode(req.body.code);
      if (codeExists) {
        response_api = {
          ...response_api,
          success: false,
          status_code: 409,
          message: `Un cours avec le code ${req.body.code} existe déjà`
        };
        return res.status(response_api.status_code).json(response_api);
      }
    }

    const updated = await Cours.update(id, req.body);
    if (!updated) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Cours non trouvé.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Cours mis à jour avec succès',
        data: updated as ICours
      };
    }

    console.log('updated', updated);
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour du cours.',
      error: JSON.stringify(error)
    };
    console.error('updateCours error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer un cours
export const deleteCours = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
    };

    if (isNaN(id)) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: 'ID invalide.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    const deleted = await Cours.delete(id);
    if (!deleted) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Cours non trouvé.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Cours supprimé avec succès.',
      };
    }

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression du cours.',
      error: JSON.stringify(error)
    };
    console.error('deleteCours - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Obtenir les cours avec statistiques
export const getCoursWithStats = async (_req: Request, res: Response) => {
  try {
    const courses = await Cours.getCoursesWithStats();
    res.json(courses);
  } catch (error) {
    console.error('getCoursWithStats error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
};

// Obtenir les étudiants inscrits à un cours
export const getEtudiantsInscrits = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    const etudiants = await Cours.getEtudiantsInscrits(id);
    res.json(etudiants);
  } catch (error) {
    console.error('getEtudiantsInscrits error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des étudiants.' });
  }
};

// Vérifier la capacité d'un cours
export const checkCapacity = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    const result = await Cours.checkCapacity(id);
    res.json(result);
  } catch (error) {
    console.error('checkCapacity error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification de capacité.' });
  }
};

// Vérifier les conflits d'horaires
export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const { etudiant_id, cours_id } = req.body;

    if (!etudiant_id || !cours_id) {
      return res.status(400).json({ 
        message: 'etudiant_id et cours_id sont requis.' 
      });
    }

    const result = await Cours.checkConflicts(
      Number(etudiant_id),
      Number(cours_id)
    );
    res.json(result);
  } catch (error) {
    console.error('checkConflicts error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification des conflits.' });
  }
};

// Obtenir les statistiques des cours
export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    const stats = await Cours.getStatistiques();
    res.json(stats);
  } catch (error) {
    console.error('getStatistiques error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
};

// Recherche avancée de cours
export const searchCours = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    const rows = await Cours.search(criteria);
    res.json(rows);
  } catch (error) {
    console.error('searchCours error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche.' });
  }
};