import type { Request, Response } from 'express';
import { 
  ApiErrorResponse, 
  ApiErrorValidationResponse, 
  ApiResponseOk,
  ApiResponseOptional,
  HTTP_STATUS 
} from '../types/api';
import { 
  IGradeBatch, 
  INote, 
  INoteDetails, 
  INoteCreate,
  INoteUpdate,
  INoteFilters,
  IGradeStatistics,
  IReleveData,
  IMoyenneEtudiant,
  calculerNoteFinal,
  obtenirMention,
  validerNote
} from '../types/INote';
import Note from '../Models/Notes';
import { IPaginationResult } from '../types/Istudents';

export const createNote = async (req: Request, res: Response) => {
  try {
    const newNote = req.body as INoteCreate;
    
    // Validation des champs requis
    const required = ['etudiant_id', 'matiere_code'];
    const missing = required.filter((field) => !(newNote as any)[field]);
    
    let response_api: ApiResponseOk<INote> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: {} as INote
    };
    
    let response_validation_errors: ApiErrorValidationResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Erreur de validation des données.',
      errors: {}
    };

    // Vérification des champs manquants
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

    // Vérifier qu'au moins une note est fournie
    if (!newNote.note_cc && !newNote.note_examen && !newNote.note_tp) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Au moins une note (CC, Examen ou TP) doit être fournie',
        errors: {
          notes: 'Au moins une note doit être renseignée (CC, Examen ou TP)'
        }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Valider les notes (entre 0 et 20)
    const validationErrors: Record<string, string> = {};
    
    if (newNote.note_cc !== undefined && !validerNote(newNote.note_cc)) {
      validationErrors.note_cc = 'La note CC doit être entre 0 et 20';
    }
    
    if (newNote.note_examen !== undefined && !validerNote(newNote.note_examen)) {
      validationErrors.note_examen = 'La note d\'examen doit être entre 0 et 20';
    }
    
    if (newNote.note_tp !== undefined && !validerNote(newNote.note_tp)) {
      validationErrors.note_tp = 'La note TP doit être entre 0 et 20';
    }

    if (Object.keys(validationErrors).length > 0) {
      response_validation_errors = {
        ...response_validation_errors,
        message: 'Erreur de validation des notes',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Créer la note
    const note = await Note.create(newNote);
    
    response_api = {
      ...response_api,
      message: 'Note créée avec succès',
      data: note as INote
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la création de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('createNote:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const createNoteBatch = async (req: Request, res: Response) => {
  try {
    const batch = req.body as IGradeBatch;
    
    let response_api: ApiResponseOptional<IGradeBatch> = {
      success: true,
      status_code: HTTP_STATUS.CREATED,
      data: batch
    };
    
    let response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: ''
    };

    // Validation des données de base
    if (!batch.matiere_code || !batch.notes || batch.notes.length === 0) {
      response_api_error = {
        ...response_api_error,
        message: 'matiere_code et notes[] sont requis',
      };
      return res.status(response_api_error.status_code).json(response_api_error);
    }

    // Valider chaque note
    const validationErrors: Array<{ etudiant_id: number; errors: string[] }> = [];
    
    for (const noteEntry of batch.notes) {
      const errors: string[] = [];
      
      if (!noteEntry.etudiant_id) {
        errors.push('etudiant_id est requis');
      }
      
      if (noteEntry.note_cc !== undefined && !validerNote(noteEntry.note_cc)) {
        errors.push('note_cc doit être entre 0 et 20');
      }
      
      if (noteEntry.note_examen !== undefined && !validerNote(noteEntry.note_examen)) {
        errors.push('note_examen doit être entre 0 et 20');
      }
      
      if (noteEntry.note_tp !== undefined && !validerNote(noteEntry.note_tp)) {
        errors.push('note_tp doit être entre 0 et 20');
      }
      
      if (errors.length > 0) {
        validationErrors.push({
          etudiant_id: noteEntry.etudiant_id,
          errors
        });
      }
    }

    if (validationErrors.length > 0) {
      response_api_error = {
        ...response_api_error,
        message: 'Erreurs de validation dans les notes',
        error: JSON.stringify(validationErrors)
      };
      return res.status(response_api_error.status_code).json(response_api_error);
    }

    // Créer les notes en batch
    const result = await Note.createBatch(batch);

    response_api = {
      ...response_api,
      message: `${batch.notes.length} notes créées avec succès`,
    };
    
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la création des notes en batch.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('createNoteBatch:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    let response_api: ApiResponseOk<INoteDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as INoteDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Note non trouvée.'
    };

    // Validation de l'ID
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'ID invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Recherche de la note
    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Ajouter des informations calculées
    const noteWithCalculations = {
      ...note,
      admis: note.note_finale ? note.note_finale >= 10 : false,
      mention: note.note_finale ? obtenirMention(note.note_finale) : undefined
    };

    response_api = {
      ...response_api,
      message: 'Note trouvée avec succès',
      data: noteWithCalculations as INoteDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getNoteById - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: INoteFilters = {};
    
    if (req.query.etudiant_id) filters.etudiant_id = Number(req.query.etudiant_id);
    if (req.query.matiere_code) filters.matiere_code = String(req.query.matiere_code);
    if (req.query.unite_enseignement_code) filters.unite_enseignement_code = String(req.query.unite_enseignement_code);
    if (req.query.session) filters.session = String(req.query.session) as any;
    if (req.query.type_evaluation) filters.type_evaluation = String(req.query.type_evaluation) as any;
    if (req.query.validee !== undefined) filters.validee = req.query.validee === 'true';
    if (req.query.admis !== undefined) filters.admis = req.query.admis === 'true';
    if (req.query.note_min) filters.note_min = Number(req.query.note_min);
    if (req.query.note_max) filters.note_max = Number(req.query.note_max);
    if (req.query.saisie_par_enseignant_id) filters.saisie_par_enseignant_id = Number(req.query.saisie_par_enseignant_id);

    let response_api: ApiResponseOk<IPaginationResult<INoteDetails[]>> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IPaginationResult<INoteDetails[]>
    };

    const result = await Note.findAll(page, limit, filters);
    
    // Ajouter les informations calculées pour chaque note
    const notesWithCalculations = result.data.map(note => ({
      ...note,
      admis: note.note_finale ? note.note_finale >= 10 : false,
      mention: note.note_finale ? obtenirMention(note.note_finale) : undefined
    }));

    response_api = {
      ...response_api,
      message: 'Liste des notes récupérée avec succès',
      data: {
        ...result,
        data: notesWithCalculations as any
      }
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des notes.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getNotes - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updateData = req.body as INoteUpdate;
    
    let response_api: ApiResponseOk<INoteDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as INoteDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Note non trouvée.'
    };

    // Validation de l'ID
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'ID invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Validation des notes si fournies
    const validationErrors: Record<string, string> = {};
    
    if (updateData.note_cc !== undefined && !validerNote(updateData.note_cc)) {
      validationErrors.note_cc = 'La note CC doit être entre 0 et 20';
    }
    
    if (updateData.note_examen !== undefined && !validerNote(updateData.note_examen)) {
      validationErrors.note_examen = 'La note d\'examen doit être entre 0 et 20';
    }
    
    if (updateData.note_tp !== undefined && !validerNote(updateData.note_tp)) {
      validationErrors.note_tp = 'La note TP doit être entre 0 et 20';
    }

    if (Object.keys(validationErrors).length > 0) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Erreur de validation des notes',
        errors: validationErrors
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Mettre à jour la note
    const updatedNote = await Note.update(id, updateData);
    
    if (!updatedNote) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Ajouter des informations calculées
    const noteWithCalculations = {
      ...updatedNote,
      admis: updatedNote.note_finale ? updatedNote.note_finale >= 10 : false,
      mention: updatedNote.note_finale ? obtenirMention(updatedNote.note_finale) : undefined
    };

    response_api = {
      ...response_api,
      message: 'Note mise à jour avec succès',
      data: noteWithCalculations as INoteDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la mise à jour de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('updateNote error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    let response_api: ApiResponseOptional<INote> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as INote
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Note non trouvée.'
    };

    // Validation de l'ID
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'ID invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Suppression de la note
    const deletedNote = await Note.delete(id);
    
    if (!deletedNote) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Note supprimée avec succès.',
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la suppression de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('deleteNote - error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const validateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { user_id } = req.body; // ID de l'utilisateur qui valide
    
    let response_api: ApiResponseOk<INoteDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as INoteDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Note non trouvée.'
    };

    // Validation des paramètres
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'ID invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    if (!user_id) {
      const response_validation_errors: ApiErrorValidationResponse = {
        success: false,
        status_code: HTTP_STATUS.BAD_REQUEST,
        message: 'Champ requis manquant',
        errors: { user_id: 'user_id est requis pour la validation' }
      };
      return res.status(response_validation_errors.status_code).json(response_validation_errors);
    }

    // Validation de la note
    const validatedNote = await Note.validate(id, user_id);
    
    if (!validatedNote) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Ajouter des informations calculées
    const noteWithCalculations = {
      ...validatedNote,
      admis: validatedNote.note_finale ? validatedNote.note_finale >= 10 : false,
      mention: validatedNote.note_finale ? obtenirMention(validatedNote.note_finale) : undefined
    };

    response_api = {
      ...response_api,
      message: 'Note validée avec succès',
      data: noteWithCalculations as INoteDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la validation de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('validateNote error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const invalidateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    let response_api: ApiResponseOk<INoteDetails> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as INoteDetails
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.NOT_FOUND,
      message: 'Note non trouvée.'
    };

    // Validation de l'ID
    if (Number.isNaN(id)) {
      response_not_found = {
        ...response_not_found,
        status_code: HTTP_STATUS.BAD_REQUEST,
        error: 'ID invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Invalidation de la note
    const invalidatedNote = await Note.invalidate(id);
    
    if (!invalidatedNote) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    response_api = {
      ...response_api,
      message: 'Validation retirée avec succès',
      data: invalidatedNote as INoteDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de l\'invalidation de la note.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('invalidateNote error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const matiereCodeParam = req.params.matiereCode;
  const matiereCodeQuery = req.query.matiere_code;

  let matiereCode: string | undefined;

  if (typeof matiereCodeParam === 'string') {
    matiereCode = matiereCodeParam;
  } else if (typeof matiereCodeQuery === 'string') {
    matiereCode = matiereCodeQuery;
  }
      
    let response_api: ApiResponseOk<IGradeStatistics> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IGradeStatistics
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code matière invalide.'
    };

    // Validation du code matière
    if (!matiereCode) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Récupération des statistiques
    const stats = await Note.getStatistiques(matiereCode);
    
    response_api = {
      ...response_api,
      message: 'Statistiques récupérées avec succès',
      data: stats as IGradeStatistics
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des statistiques.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getStatistiques error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getMoyenneEtudiant = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    
    let response_api: ApiResponseOk<IMoyenneEtudiant> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IMoyenneEtudiant
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'ID étudiant invalide.'
    };

    // Validation de l'ID étudiant
    if (Number.isNaN(etudiantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Calcul de la moyenne
    const moyenne = await Note.getMoyenneEtudiant(etudiantId);
    
    response_api = {
      ...response_api,
      message: 'Moyenne calculée avec succès',
      data: moyenne as IMoyenneEtudiant
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors du calcul de la moyenne.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getMoyenneEtudiant error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getReleveNotes = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    const { annee_academique, semestre } = req.query;
    
    let response_api: ApiResponseOk<IReleveData> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: {} as IReleveData
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Paramètres invalides.'
    };

    // Validation des paramètres
    if (Number.isNaN(etudiantId)) {
      response_not_found = {
        ...response_not_found,
        message: 'ID étudiant invalide.'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    if (!annee_academique || !semestre) {
      response_not_found = {
        ...response_not_found,
        message: 'annee_academique et semestre sont requis'
      };
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Génération du relevé
    const releve = await Note.getReleveNotes(
      etudiantId, 
      String(annee_academique), 
      String(semestre)
    );
    
    response_api = {
      ...response_api,
      message: 'Relevé de notes généré avec succès',
      data: releve as IReleveData
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la génération du relevé.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getReleveNotes error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const searchNotes = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    
    let response_api: ApiResponseOk<INoteDetails[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: [] as INoteDetails[]
    };

    // Recherche des notes
    const notes = await Note.search(criteria);
    
    // Ajouter les informations calculées
    const notesWithCalculations = notes.map(note => ({
      ...note,
      admis: note.note_finale ? note.note_finale >= 10 : false,
      mention: note.note_finale ? obtenirMention(note.note_finale) : undefined
    }));

    response_api = {
      ...response_api,
      message: 'Recherche effectuée avec succès',
      data: notesWithCalculations as any
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la recherche.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('searchNotes error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getNotesByEtudiant = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    
    let response_api: ApiResponseOk<INoteDetails[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: [] as INoteDetails[]
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'ID étudiant invalide.'
    };

    // Validation de l'ID étudiant
    if (Number.isNaN(etudiantId)) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Récupération des notes de l'étudiant
    const notes = await Note.findByEtudiant(etudiantId);
    
    // Ajouter les informations calculées
    const notesWithCalculations = notes.map(note => ({
      ...note,
      admis: note.note_finale ? note.note_finale >= 10 : false,
      mention: note.note_finale ? obtenirMention(note.note_finale) : undefined
    }));

    response_api = {
      ...response_api,
      message: 'Notes de l\'étudiant récupérées avec succès',
      data: notesWithCalculations as any
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des notes de l\'étudiant.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getNotesByEtudiant error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

export const getNotesByMatiere = async (req: Request, res: Response) => {
  try {
    const matiereCodeParam = req.params.matiereCode;
    const matiereCodeQuery = req.query.matiere_code;

    let matiereCode: string | undefined;

    if (typeof matiereCodeParam === 'string') {
      matiereCode = matiereCodeParam;
    } else if (typeof matiereCodeQuery === 'string') {
      matiereCode = matiereCodeQuery;
    }
    
    let response_api: ApiResponseOk<INoteDetails[]> = {
      success: true,
      status_code: HTTP_STATUS.OK,
      data: [] as INoteDetails[]
    };
    
    let response_not_found: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.BAD_REQUEST,
      message: 'Code matière invalide.'
    };

    // Validation du code matière
    if (!matiereCode) {
      return res.status(response_not_found.status_code).json(response_not_found);
    }

    // Récupération des notes par matière
    const notes = await Note.findByMatiere(matiereCode);
    
    // Ajouter les informations calculées
    const notesWithCalculations = notes.map(note => ({
      ...note,
      admis: note.note_finale ? note.note_finale >= 10 : false,
      mention: note.note_finale ? obtenirMention(note.note_finale) : undefined
    }));

    response_api = {
      ...response_api,
      message: 'Notes de la matière récupérées avec succès',
      data: notesWithCalculations as any
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Erreur serveur lors de la récupération des notes de la matière.',
      error: error instanceof Error ? error.message : JSON.stringify(error)
    };
    console.error('getNotesByMatiere error:', error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};