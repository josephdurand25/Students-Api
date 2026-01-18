import type { Request, Response } from 'express';
import { ApiErrorResponse, ApiResponseOk } from '../types/api';
import { IGradeBatch, INote, INoteDetails } from '../types/INote';
import Note from '../Models/Notes';

// Créer une nouvelle note
export const createNote = async (req: Request, res: Response) => {
  try {
    const newNote = req.body as Partial<INote>;
    const required = ['etudiant_id', 'cours_id'];
    const missing = required.filter((k) => !(newNote as any)[k]);
    
    let response_api: ApiResponseOk<INote> = {
      success: true,
      status_code: 201,
    };

    if (missing.length > 0) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: `Champs requis manquants: ${missing.join(', ')}`,
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Vérifier qu'au moins une note est fournie
    if (!newNote.note_cc && !newNote.note_examen && !newNote.note_tp) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: 'Au moins une note (CC, Examen ou TP) doit être fournie',
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Valider les notes (entre 0 et 20)
    const validateNote = (note: number | undefined, type: string) => {
      if (note !== undefined && (note < 0 || note > 20)) {
        throw new Error(`La note ${type} doit être entre 0 et 20`);
      }
    };

    try {
      validateNote(newNote.note_cc, 'CC');
      validateNote(newNote.note_examen, 'Examen');
      validateNote(newNote.note_tp, 'TP');
    } catch (error: any) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: error.message,
      };
      return res.status(response_api.status_code).json(response_api);
    }

    const note = await Note.create(newNote);
    response_api = {
      ...response_api,
      message: 'Note créée avec succès',
      data: note as INote
    };
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création de la note.',
      error: JSON.stringify(error)
    };
    console.error('createNote:', response_api);
    res.status(response_api.status_code).json(response_api);
  }
};

// Créer plusieurs notes en batch
export const createNoteBatch = async (req: Request, res: Response) => {
  try {
    const batch = req.body as IGradeBatch;
    let response_api: ApiResponseOk<IGradeBatch> = {
      success: true,
      status_code: 201,
    };
    let response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
    };
    
    if (!batch.cours_id || !batch.notes || batch.notes.length === 0) {

        response_api_error = {
            ...response_api_error,
            success: false,
            status_code: 400,
            message: 'cours_id et notes[] sont requis',
        };
      return res.status(response_api_error.status_code).json(response_api_error);
    }

    // Valider toutes les notes
    for (const noteEntry of batch.notes) {
      if (!noteEntry.etudiant_id) {
        response_api_error = {
          ...response_api_error,
          status_code: 400,
          message: 'Chaque note doit avoir un etudiant_id'
        }
        return res.status(response_api_error.status_code).json(response_api_error);
      }

      const validateNote = (note: number | undefined, type: string) => {
        if (note !== undefined && (note < 0 || note > 20)) {
          throw new Error(`La note ${type === 'Examen' ? 'de l\'' : 'du'} pour l'étudiant ${noteEntry.etudiant_id} doit être entre 0 et 20`);
        }
      };

      try {
        validateNote(noteEntry.note_cc, 'CC');
        validateNote(noteEntry.note_examen, 'Examen');
        validateNote(noteEntry.note_tp, 'TP');
      } catch (error: any) {
        response_api_error = {
            ...response_api_error,
          message: error.message,
        }
        return res.status(response_api_error.status_code).json(response_api_error);
      }
    }

    await Note.createBatch(batch);

    response_api = {
        ...response_api,
        message: `${batch.notes.length} notes créées avec succès`,
        data: batch
    }
    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error : ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la création des notes.',
      error: JSON.stringify(error)
    };
    console.error('createNoteBatch:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer une note par ID
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api: ApiResponseOk<INoteDetails> = {
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

    const note = await Note.findById(id);
    if (!note) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Note non trouvée.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    response_api = {
      ...response_api,
      message: 'Note trouvée',
      data: note as INoteDetails
    };

    res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération de la note.',
      error: JSON.stringify(error)
    };
    console.error('getNoteById - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer toutes les notes avec pagination et filtres
export const getNotes = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const filters: any = {};
    if (req.query.cours_id) filters.cours_id = Number(req.query.cours_id);
    if (req.query.etudiant_id) filters.etudiant_id = Number(req.query.etudiant_id);
    if (req.query.session) filters.session = String(req.query.session);
    if (req.query.validee !== undefined) filters.validee = req.query.validee === 'true';
    if (req.query.admis !== undefined) filters.admis = req.query.admis === 'true';

    let response_api: ApiResponseOk<any> = {
      success: true,
      status_code: 200,
    };

    const result = await Note.findAll(page, limit, filters);
    response_api = {
      ...response_api,
      message: 'Liste des notes récupérée',
      data: result
    };

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la récupération des notes.',
      error: JSON.stringify(error)
    };
    console.error('getNotes - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Récupérer les notes d'un cours
export const getNotesByCours = async (req: Request, res: Response) => {
  try {
    const coursId = Number(req.params.coursId);
    
    if (isNaN(coursId)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    const notes = await Note.findByCours(coursId);
    res.json(notes);
  } catch (error) {
    console.error('getNotesByCours error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notes.' });
  }
};

// Récupérer les notes d'un étudiant
export const getNotesByEtudiant = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    
    if (isNaN(etudiantId)) {
      return res.status(400).json({ message: 'ID d\'étudiant invalide.' });
    }

    const notes = await Note.findByEtudiant(etudiantId);
    res.json(notes);
  } catch (error) {
    console.error('getNotesByEtudiant error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notes.' });
  }
};

// Mettre à jour une note
export const updateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    let response_api: ApiResponseOk<INoteDetails> = {
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

    // Vérifier que la note existe
    const existingNote = await Note.findById(id);
    if (!existingNote) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Note non trouvée.'
      };
      return res.status(response_api.status_code).json(response_api);
    }

    // Valider les notes si elles sont fournies
    const validateNote = (note: number | undefined, type: string) => {
      if (note !== undefined && (note < 0 || note > 20)) {
        throw new Error(`La note ${type} doit être entre 0 et 20`);
      }
    };

    try {
      validateNote(req.body.note_cc, 'CC');
      validateNote(req.body.note_examen, 'Examen');
      validateNote(req.body.note_tp, 'TP');
    } catch (error: any) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 400,
        message: error.message,
      };
      return res.status(response_api.status_code).json(response_api);
    }

    const updated = await Note.update(id, req.body);
    if (!updated) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Note non trouvée.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Note mise à jour avec succès',
        data: updated as INoteDetails
      };
    }

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la mise à jour de la note.',
      error: JSON.stringify(error)
    };
    console.error('updateNote error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Supprimer une note
export const deleteNote = async (req: Request, res: Response) => {
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

    const deleted = await Note.delete(id);
    if (!deleted) {
      response_api = {
        ...response_api,
        success: false,
        status_code: 404,
        message: 'Note non trouvée.'
      };
    } else {
      response_api = {
        ...response_api,
        message: 'Note supprimée avec succès.',
      };
    }

    return res.status(response_api.status_code).json(response_api);
  } catch (error) {
    const response_api_error: ApiErrorResponse = {
      success: false,
      status_code: 500,
      message: 'Erreur serveur lors de la suppression de la note.',
      error: JSON.stringify(error)
    };
    console.error('deleteNote - error:', response_api_error);
    res.status(response_api_error.status_code).json(response_api_error);
  }
};

// Valider une note
export const validateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { user_id } = req.body; // ID de l'utilisateur qui valide

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    if (!user_id) {
      return res.status(400).json({ message: 'user_id requis pour la validation.' });
    }

    const validated = await Note.validate(id, user_id);
    if (!validated) {
      return res.status(404).json({ message: 'Note non trouvée.' });
    }

    res.json({
      success: true,
      message: 'Note validée avec succès',
      data: validated
    });
  } catch (error) {
    console.error('validateNote error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la validation.' });
  }
};

// Invalider une note
export const invalidateNote = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    const invalidated = await Note.invalidate(id);
    if (!invalidated) {
      return res.status(404).json({ message: 'Note non trouvée.' });
    }

    res.json({
      success: true,
      message: 'Validation retirée avec succès',
      data: invalidated
    });
  } catch (error) {
    console.error('invalidateNote error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'invalidation.' });
  }
};

// Obtenir les statistiques d'un cours
export const getStatistiques = async (req: Request, res: Response) => {
  try {
    const coursId = Number(req.params.coursId);

    if (isNaN(coursId)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    const stats = await Note.getStatistiques(coursId);
    res.json(stats);
  } catch (error) {
    console.error('getStatistiques error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
};

// Obtenir la moyenne générale d'un étudiant
export const getMoyenneEtudiant = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);

    if (isNaN(etudiantId)) {
      return res.status(400).json({ message: 'ID d\'étudiant invalide.' });
    }

    const moyenne = await Note.getMoyenneEtudiant(etudiantId);
    res.json(moyenne);
  } catch (error) {
    console.error('getMoyenneEtudiant error:', error);
    res.status(500).json({ message: 'Erreur serveur lors du calcul de la moyenne.' });
  }
};

// Obtenir le relevé de notes
export const getReleveNotes = async (req: Request, res: Response) => {
  try {
    const etudiantId = Number(req.params.etudiantId);
    const { annee_academique, semestre } = req.query;

    if (isNaN(etudiantId)) {
      return res.status(400).json({ message: 'ID d\'étudiant invalide.' });
    }

    if (!annee_academique || !semestre) {
      return res.status(400).json({ 
        message: 'annee_academique et semestre sont requis' 
      });
    }

    const releve = await Note.getReleveNotes(
      etudiantId, 
      String(annee_academique), 
      String(semestre)
    );
    
    res.json(releve);
  } catch (error) {
    console.error('getReleveNotes error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la génération du relevé.' });
  }
};

// Recherche avancée
export const searchNotes = async (req: Request, res: Response) => {
  try {
    const criteria = req.body || {};
    const notes = await Note.search(criteria);
    res.json(notes);
  } catch (error) {
    console.error('searchNotes error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la recherche.' });
  }
};