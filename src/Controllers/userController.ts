import type { Request, Response } from 'express';
import { ApiErrorResponse, ApiErrorValidationResponse, ApiResponseOk, HTTP_STATUS } from '../types/api';

interface IUserRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  password_hash?: string;
  telephone?: string;
  role?: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR';
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
}

// Note: Pour un vrai système d'authentification, utilisez Auth API
// Ce contrôleur est pour la gestion administrative des utilisateurs

// Créer un nouvel utilisateur (Admin uniquement)
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body as IUserRequest;
    const required = ['email', 'nom', 'prenom'];
    const missing = required.filter((k) => !(userData as any)[k]);
    
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
    
    // Validation email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email!)) {
      const response_error: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Format d\'email invalide.',
        errors: { email: 'Email invalide' }
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      message: 'Utilisateur créé avec succès',
      data: { id: 0, ...userData }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de l\'utilisateur.',
      error: JSON.stringify(error)
    };
    console.error('createUser:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer un utilisateur par ID
export const getUserById = async (req: Request, res: Response) => {
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
    
    const user = await User.getById(Number(idStr));
    
    if (!user) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Utilisateur non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: user
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de l\'utilisateur.',
      error: JSON.stringify(error)
    };
    console.error('getUserById:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer un utilisateur par email
export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Email invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: { email }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de l\'utilisateur.',
      error: JSON.stringify(error)
    };
    console.error('getUserByEmail:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer tous les utilisateurs
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const pageQuery = typeof req.query.page === 'string' ? req.query.page : undefined;
    const limitQuery = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const roleQuery = typeof req.query.role === 'string' ? req.query.role : undefined;
    const statutQuery = typeof req.query.statut === 'string' ? req.query.statut : undefined;
    
    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 10;
    const role = roleQuery ? String(roleQuery) : undefined;
    const statut = statutQuery ? String(statutQuery) : undefined;
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des utilisateurs.',
      error: JSON.stringify(error)
    };
    console.error('getAllUsers:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const userData = req.body as Partial<IUserRequest>;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    // Validate email if provided
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        const response_error: ApiErrorValidationResponse = {
          success: false,
          status_code: HTTP_STATUS.BAD_REQUEST,
          message: 'Format d\'email invalide.',
          errors: { email: 'Email invalide' }
        };
        return res.status(response_error.status_code).json(response_error);
      }
    }
    
    const user = await User.update(Number(idStr), userData);
    
    if (!user) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.NOT_FOUND,
        message: 'Utilisateur non trouvé.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.',
      error: JSON.stringify(error)
    };
    console.error('updateUser:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};
// Supprimer un utilisateur
export const deleteUser = async (req: Request, res: Response) => {
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
    
    const response_api: any = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Utilisateur supprimé avec succès',
      data: { id: Number(id) }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de l\'utilisateur.',
      error: JSON.stringify(error)
    };
    console.error('deleteUser:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Changer le statut d'un utilisateur
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const { statut } = req.body;
    
    if (!idStr || Number.isNaN(Number(idStr))) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'ID invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    if (!statut || !['ACTIF', 'INACTIF', 'SUSPENDU', 'BLOQUE'].includes(statut)) {
      const response_error: ApiErrorResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Statut invalide.'
      };
      return res.status(response_error.status_code).json(response_error);
    }
    
    const response_api: ApiResponseOk<any> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      message: 'Statut utilisateur mis à jour avec succès',
      data: { id: Number(id), statut }
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour du statut.',
      error: JSON.stringify(error)
    };
    console.error('updateUserStatus:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export default {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserStatus
};
