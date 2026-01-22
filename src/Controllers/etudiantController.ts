import type { Request, Response } from 'express';
import { IEtudiant, IEtudiantFormRequest } from '../types/Istudents';
import Etudiant from '../Models/Etudiant';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS, IPaginationResult } from '../types/api';


export const createEtudiantV1 = async (req: Request, res: Response) => {
  try {
    const newEtudiant = req.body as IEtudiantFormRequest;
    const required = ['prenom', 'nom', 'date_naissance', 'email', 'date_inscription', 'filiere', 'niveau'];
    const missing = required.filter((k) => !(newEtudiant as any)[k]);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IEtudiant
    };
    let response_validation_errors : ApiErrorValidationResponse = {
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
      }
      console.log(response_validation_errors);
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    const etudiant = await Etudiant.create(newEtudiant);
    response_api = {
      ...response_api,
      message: 'Création réussi',
      data: etudiant as IEtudiant
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de l\'étudiant.',
      error: JSON.stringify(error)
    };
    console.error('createEtudiant:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const createEtudiant = async (req: Request, res: Response) => {
  try {
    const newEtudiant = req.body as Partial<IEtudiantFormRequest>;
    
    // Changement: 'specialite_code' au lieu de 'filiere', mais optionnel maintenant
    const required = ['prenom', 'nom', 'email'];
    const missing = required.filter((k) => !(newEtudiant as any)[k]);
    
    let response_api: ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as IEtudiant
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
      console.log(response_validation_errors);
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }
    
    // Vérification supplémentaire pour la spécialité
    if (newEtudiant.specialite_code) {
      // Optionnel: Vérifier si la spécialité existe dans la base
      // const specialiteExiste = await Etudiant.verifierSpecialite(newEtudiant.specialite_code);
      // if (!specialiteExiste) {
      //   response_validation_errors.errors.specialite_code = 'Spécialité invalide';
      //   return res.status(HTTP_STATUS.BAD_REQUEST).json(response_validation_errors);
      // }
    }
    
    const etudiant = await Etudiant.create(newEtudiant);
    
    if (!etudiant) {
      const response_api_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Échec de la création de l\'étudiant.',
        error: 'Échec de la création dans la base de données'
      };
      return res.status(response_api_error.status_code).json(response_api_error);
    }
    
    response_api = {
      ...response_api,
      message: 'Création réussie',
      data: etudiant
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error: any) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: error.code === 'ER_DUP_ENTRY' ? HTTP_STATUS.CONFLICT : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Un étudiant avec cet email ou numéro existe déjà.' 
        : 'Erreur serveur lors de la création de l\'étudiant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    console.error('createEtudiant:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getEtudiantById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 200,
      data: {} as IEtudiant
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 404,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)){
       response_not_found = {
        ...response_not_found , 
        status_code: 400,
        error: 'ID invalide.' 
      }
      return res.status(response_not_found.status_code).json(response_not_found)};
      
      const etudiant = await Etudiant.findById(id);
    if (etudiant) {
      response_api = {
        ...response_api , 
        message: 'Etudiant trouvé', 
        data: etudiant
      }
    } else {
      response_not_found = {
        ...response_not_found , 
        error: 'ID invalide.' 
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    }
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de l\'étudiant.',
      error: JSON.stringify(error)
    };
    console.error('getEtudiantById - error :', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getEtudiants = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const filiereCodeQuery = typeof req.query.filiere_code === 'string' ? req.query.filiere_code : undefined;
    const specialiteCodeQuery = typeof req.query.specialite_code === 'string' ? req.query.specialite_code : undefined;
    const niveauQuery = typeof req.query.niveau === 'string' ? req.query.niveau : undefined;
    const statutQuery = typeof req.query.statut === 'string' ? req.query.statut : undefined;
    const searchQuery = typeof req.query.search === 'string' ? req.query.search : undefined;
    const filiereQuery = typeof req.query.filiere === 'string' ? req.query.filiere : undefined;
    
    const page = pageQuery ? Math.max(1, Number(pageQuery)) : 1;
    const limit = limitQuery ? Math.min(Math.max(1, Number(limitQuery)), 100) : 10;

    // Nouveaux filtres pour filière et spécialité
    const filters: {
      filiere_code?: string;
      specialite_code?: string;
      niveau?: string;
      statut?: string;
      search?: string;
    } = {};
    
    if (filiereCodeQuery) filters.filiere_code = filiereCodeQuery;
    if (specialiteCodeQuery) filters.specialite_code = specialiteCodeQuery;
    if (niveauQuery) filters.niveau = niveauQuery;
    if (statutQuery) filters.statut = statutQuery;
    if (searchQuery) filters.search = searchQuery;
    
    // Support pour l'ancien paramètre 'filiere' (compatibilité)
    if (filiereQuery && !filiereCodeQuery) {
      console.warn('Paramètre "filiere" déprécié, utilisez "filiere_code"');
      filters.filiere_code = filiereQuery;
    }
    
    let response_api: ApiResponseOk<IPaginationResult<IEtudiant>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<IEtudiant>
    };
    
    const result = await Etudiant.findAll(page, limit, filters);
    
    response_api = {
      ...response_api,
      message: 'Liste des étudiants récupérée avec succès',
      data: {data: result.data, pagination: result.pagination}
    };
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des étudiants.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getEtudiants errors'
    };
    console.error('getEtudiants - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const updateEtudiant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 200,
      data: {} as IEtudiant
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 400,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)){
       response_not_found = {
        ...response_not_found , 
        error: 'ID invalide.' 
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    };
    
    const updated = await Etudiant.update(id, req.body);
    if (!updated) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.NOT_FOUND,
        error: 'updated method returned no results' 
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    }else{
      response_api = {
        ...response_api , 
        message: 'Mise à jour réussi', 
        data: updated
      }
    };
    console.log('updated', updated);
    return res.status(response_api.status_code).json(response_api)
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de l\'étudiant.',
      error: JSON.stringify(error)
    };
    console.error('updateEtudiant error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const deleteEtudiant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 200,
      data: {} as IEtudiant
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 404,
      message: 'Étudiant non trouvé.'
    };
    if (Number.isNaN(id)){
      response_not_found = {
        ...response_not_found , 
        status_code: 400,
        error: 'ID invalide.' 
      }
    }else{
      const deleted = await Etudiant.delete(id);
      if (!deleted) {
        response_api = {
          ...response_api , 
          status_code: 404,
          message: 'Étudiant non trouvé.'
        }
      }else{
        response_api = {
          ...response_api , 
          message: 'Étudiant supprimé avec succès.',
        }
        
      };
    };
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
     const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de l\'étudiant.',
      error: JSON.stringify(error)
    };
    console.error('deleteEtudiant - error :', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const toggleStatut = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 200,
      data: {} as IEtudiant
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)){
      response_api = {
        ...response_api , 
        status_code: 400,
        message: 'ID invalide.' 
      }
    }else{
      const { statut } = req.body || {};
      const updated = await Etudiant.toggleStatut(id, statut);
      if (!updated){
        response_not_found={
          ...response_not_found,
          error: 'toggleStatut method returned no results'
        }
        return res.status(response_not_found.status_code).json(response_not_found);
      }else{
        response_api ={
          ...response_api,
          message: `Statut ${statut} appliqué avec succès`,
          data: updated
        }
      }
    }

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
     const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors du changement de statut.',
      error: JSON.stringify(error)
    };
    console.error('toggleStatut - error :', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getCoursV1 = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<unknown> = {
      success: true,
      status_code: 200,
      data: {} as unknown
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 400,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        message: 'ID invalide'
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    };

    const cours = await Etudiant.getCours(id);
    response_api = {
      ...response_api,
      message: 'Cours récupérées avec success',
      data: cours as unknown
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des cours.',
      error: JSON.stringify(error)
    };
    console.error('getCours error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<unknown> = {
      success: true,
      status_code: 200,
      data: {} as unknown
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 400,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        message: 'ID invalide'
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    };

    const notes = await Etudiant.getNotes(id);
    response_api = {
      ...response_api,
      message: 'Notes récupérées avec success',
      data: notes as unknown
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des notes.',
      error: JSON.stringify(error)
    };
    console.error('getNotes error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
   
  }
};

export const getMoyenneGenerale = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api : ApiResponseOk<unknown> = {
      success: true,
      status_code: 200,
      data: {} as unknown
    };
    let response_not_found : ApiErrorResponse ={
      success: false,
      status_code: 400,
      message: 'Étudiant non trouvé.'
    }
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        message: 'ID invalide'
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    };

    const moyenne = await Etudiant.getMoyenneGenerale(id);
    response_api = {
      ...response_api,
      message: 'Notes récupérées avec success',
      data: moyenne as unknown
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors du calcul de la moyenne.',
      error: JSON.stringify(error)
    };
    console.error('getMoyenneGenerale error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    const stats = await Etudiant.getStatistiques();
    res.json(stats);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des statistiques.', 
      error: JSON.stringify(error)
    };
    console.error('getStatistiques error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const searchEtudiants = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    const rows = await Etudiant.search(criteria);
    res.json(rows);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la recherche.',
      error: JSON.stringify(error)
    };
    console.error('searchEtudiants error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);

  }
};


export const getFilieres = async (_req: Request, res: Response) => {
  try {
    const filieres = await Etudiant.getFilieres();
    
    const response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Liste des filières récupérée',
      data: filieres
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des filières.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getFilieres error'
    };
    console.error('getFilieres error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getSpecialitesByFiliere = async (req: Request, res: Response) => {
  try {
    const { filiere_code } = req.params;
    
    if (!filiere_code) {
      const response_validation: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Le paramètre filiere_code est requis.'
      };
      return res.status(response_validation.status_code).json(response_validation);
    }
    
    const specialites = await Etudiant.getSpecialitesByFiliere(String(filiere_code));
    
    const response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Liste des spécialités récupérée',
      data: specialites
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des spécialités.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getSpecialitesByFiliere error'
    };
    console.error('getSpecialitesByFiliere error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getGroupesUE = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    if (Number.isNaN(id)) {
      const response_validation: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_validation.status_code).json(response_validation);
    }
    
    const groupes = await Etudiant.getGroupesUE(id);
    
    const response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Groupes UE de l\'étudiant récupérés',
      data: groupes
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des groupes UE.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getGroupesUE error'
    };
    console.error('getGroupesUE error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour getCours pour utiliser getGroupesUE
export const getCours = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    if (Number.isNaN(id)) {
      const response_validation: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_validation.status_code).json(response_validation);
    }
    
    // Utiliser la nouvelle méthode getGroupesUE
    const groupes = await Etudiant.getGroupesUE(id);
    
    const response_api: ApiResponseOk<any[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Groupes UE (cours) récupérés avec succès',
      data: groupes
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des cours.',
      error: process.env.NODE_ENV === 'development' ? JSON.stringify(error) : 'getCours error'
    };
    console.error('getCours error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};


