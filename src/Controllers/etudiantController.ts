import type { Request, Response } from 'express';
import { IEtudiant, IEtudiantFormRequest, IPaginationResult } from '../types/Istudents';
import Etudiant from '../Models/Etudiant';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk } from '../types/api';
import { ICours } from '../types/ICours';

export const createEtudiant = async (req: Request, res: Response) => {
  try {
    const newEtudiant = req.body as IEtudiantFormRequest;
    const required = ['prenom', 'nom', 'date_naissance', 'email', 'date_inscription', 'filiere', 'niveau'];
    const missing = required.filter((k) => !(newEtudiant as any)[k]);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 201,
      data: {} as IEtudiant
    };
    let response_validation_errors : ApiErrorValidationResponse = {
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
      }
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
    if (!etudiant) {
      response_not_found = {
        ...response_not_found , 
        error: 'ID invalide.' 
      }
      return res.status(response_not_found.status_code).json(response_not_found)
    }else{
      response_api = {
        ...response_api , 
        message: 'Etudiant trouvé', 
        data: etudiant
      }

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
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: any = {};
    if (req.query.filiere) filters.filiere = String(req.query.filiere);
    if (req.query.niveau) filters.niveau = String(req.query.niveau);
    if (req.query.statut) filters.statut = String(req.query.statut);
    if (req.query.search) filters.search = String(req.query.search);
    let response_api : ApiResponseOk<IPaginationResult<IEtudiant[]>> = {
      success: true,
      status_code: 200,
      data: {} as IPaginationResult<IEtudiant[]>
    };
    const result = await Etudiant.findAll(page, limit, filters);
    response_api = {
      ...response_api,
      message: 'Liste des étudiants récupérées',
      data: result as IPaginationResult<IEtudiant[]>
    };
    // console.log(response_api);
    
    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
     const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des étudiants.',
      error: JSON.stringify(error)
    };
    console.error('getEtudiants - error :', response_api_error);
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
        status_code: 404,
        error: 'ID invalide.' 
      }
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
      status_code: 404,
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
        response_api={
          ...response_api,
          status_code: 404
        }
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

export const getCours = async (req: Request, res: Response) => {
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
