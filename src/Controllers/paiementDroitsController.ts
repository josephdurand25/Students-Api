import type { Request, Response } from 'express';
import PaiementDroits from '../Models/PaiementDroits';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface IPaiementRequest {
  inscription_numero?: string;
  montant_total?: number;
  montant_paye?: number;
  statut_paiement?: 'IMPAYE' | 'PARTIEL' | 'COMPLET' | 'EXONERE';
  mode_paiement?: 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE' | 'EN_LIGNE';
  reference?: string;
}

// Créer un nouveau paiement
export const createPaiement = async (req: Request, res: Response) => {
  try {
    const paiementData = req.body as IPaiementRequest;
    const required = ['inscription_numero'];
    const missing = required.filter((k) => !(paiementData as any)[k]);
    
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
    
    const paiement = await PaiementDroits.create(paiementData);
    
    if (!paiement) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: 400,
        message: 'Erreur lors de la création du paiement.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Paiement créé avec succès',
      data: paiement
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création du paiement.',
      error: JSON.stringify(error)
    };
    console.error('createPaiement:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer un paiement par ID
export const getPaiementById = async (req: Request, res: Response) => {
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
    
    const paiement = await PaiementDroits.findById(Number(idStr));
    
    if (!paiement) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Paiement non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: paiement
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération du paiement.',
      error: JSON.stringify(error)
    };
    console.error('getPaiementById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les paiements d'une inscription
export const getPaiementsByInscription = async (req: Request, res: Response) => {
  try {
    const { inscriptionNumero } = req.params;
    const numStr = Array.isArray(inscriptionNumero) ? inscriptionNumero[0] : inscriptionNumero;
    
    if (!numStr) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Numéro d\'inscription invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const paiements = await PaiementDroits.findByInscription(numStr);
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: paiements
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des paiements.',
      error: JSON.stringify(error)
    };
    console.error('getPaiementsByInscription:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer tous les paiements
export const getAllPaiements = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const statut_paiement = typeof req.query.statut_paiement === 'string' ? req.query.statut_paiement : undefined;
    const inscription_numero = typeof req.query.inscription_numero === 'string' ? req.query.inscription_numero : undefined;
    
    let filters = {};
    if (statut_paiement) filters = { ...filters, statut_paiement };
    if (inscription_numero) filters = { ...filters, inscription_numero };
    
    const result = await PaiementDroits.findAll(page, limit, filters);
    
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
      message: 'Erreur serveur lors de la récupération des paiements.',
      error: JSON.stringify(error)
    };
    console.error('getAllPaiements:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour un paiement
export const updatePaiement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const paiementData = req.body as Partial<IPaiementRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const paiement = await PaiementDroits.update(Number(idStr), paiementData);
    
    if (!paiement) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Paiement non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Paiement mis à jour avec succès',
      data: paiement
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour du paiement.',
      error: JSON.stringify(error)
    };
    console.error('updatePaiement:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer un paiement
export const deletePaiement = async (req: Request, res: Response) => {
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
    
    await PaiementDroits.delete(Number(idStr));
    
    if (!success) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Paiement non trouvé ou déjà supprimé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Paiement supprimé avec succès',
      data: { id }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression du paiement.',
      error: JSON.stringify(error)
    };
    console.error('deletePaiement:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createPaiement,
  getPaiementById,
  getPaiementsByInscription,
  getAllPaiements,
  updatePaiement,
  deletePaiement
};
