import type { Request, Response } from 'express';
import { IEtudiant, IEtudiantFormRequest, IPaginationResult } from '../types/Istudents';
import Etudiant from '../Models/Etudiant';
import { ApiErrorResponse, ApiResponseOk } from '../types/api';

export const createEtudiant = async (req: Request, res: Response) => {
  try {
    const newEtudiant = req.body as IEtudiantFormRequest;
    const required = ['prenom', 'nom', 'date_naissance', 'email', 'date_inscription', 'filiere', 'niveau', 'created_by'];
    const missing = required.filter((k) => !(newEtudiant as any)[k]);
    let response_api : ApiResponseOk<IEtudiant> = {
      success: true,
      status_code: 201,
    };
    if (missing.length > 0) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: `Champs requis manquants: ${missing.join(', ')}`,
      }
      return res.status(response_api.status_code).json(response_api);
    }
    const etudiant = await Etudiant.create(newEtudiant);
    response_api = {
      ...response_api,
      message: 'Création réussi',
      data: etudiant
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
      status_code: 201,
    };
    if (isNaN(id)){
       response_api = {
        ...response_api , 
        status_code: 404,
        message: 'ID invalide.' 
      }
       return res.status(response_api.status_code).json(response_api)};

    const etudiant = await Etudiant.findById(id);
    if (!etudiant) {
      response_api = {
        ...response_api , 
        status_code: 404,
        message: 'Étudiant non trouvé.'
      }
      return res.status(response_api.status_code).json(response_api)
    }else{
      response_api = {
        ...response_api , 
        message: 'Etudiant trouvé', 
        data: etudiant as IEtudiant
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
      status_code: 201,
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
      status_code: 201,
    };
    if (isNaN(id)){
       response_api = {
        ...response_api , 
        status_code: 404,
        message: 'ID invalide.' 
      }
      return res.status(response_api.status_code).json(response_api)
    };

    const updated = await Etudiant.update(id, req.body);
    if (!updated) {
      response_api = {
        ...response_api , 
        status_code: 404,
        message: 'Étudiant non trouvé.'
      }
    }else{
      response_api = {
        ...response_api , 
        message: 'Mise à jour réussi', 
        data: updated as IEtudiant
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
      status_code: 201,
    };
    if (isNaN(id)){
      response_api = {
        ...response_api , 
        status_code: 400,
        message: 'ID invalide.' 
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
      status_code: 201,
    };
    if (isNaN(id)){
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
          status_code: 400,
          message: 'Étudiant non trouvé.'
        }
      }else{
        response_api ={
          ...response_api,
          message: `Statut ${statut} appliqué avec succès`,
          data: updated as IEtudiant
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
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const cours = await Etudiant.getCours(id);
    res.json(cours);
  } catch (error) {
    console.error('getCours error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des cours.' });
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const notes = await Etudiant.getNotes(id);
    res.json(notes);
  } catch (error) {
    console.error('getNotes error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notes.' });
  }
};

export const getMoyenneGenerale = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide.' });

    const moyenne = await Etudiant.getMoyenneGenerale(id);
    res.json(moyenne);
  } catch (error) {
    console.error('getMoyenneGenerale error:', error);
    res.status(500).json({ message: 'Erreur serveur lors du calcul de la moyenne.' });
  }
};

export const getStatistiques = async (_req: Request, res: Response) => {
  try {
    const stats = await Etudiant.getStatistiques();
    res.json(stats);
  } catch (error) {
    console.error('getStatistiques error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
};

export const searchEtudiants = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    const rows = await Etudiant.search(criteria);
    res.json(rows);
  } catch (error) {
    console.error('searchEtudiants error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche.' });
  }
};
