import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { INote } from '../types/INote';

console.log('DEBUG Note - pool keys:', pool && Object.keys(pool));

class Note {
  // Calculer la note finale selon les pondérations
  static calculerNoteFinal(note_cc?: number, note_examen?: number, note_tp?: number): number {
    const weights = {
      cc: 0.3,      // 30% CC
      examen: 0.6,  // 60% Examen
      tp: 0.1       // 10% TP
    };

    let total = 0;
    let weightSum = 0;

    if (note_cc !== undefined && note_cc !== null) {
      total += note_cc * weights.cc;
      weightSum += weights.cc;
    }

    if (note_examen !== undefined && note_examen !== null) {
      total += note_examen * weights.examen;
      weightSum += weights.examen;
    }

    if (note_tp !== undefined && note_tp !== null) {
      total += note_tp * weights.tp;
      weightSum += weights.tp;
    }

    return weightSum > 0 ? Math.round((total / weightSum) * 100) / 100 : 0;
  }

  // Obtenir la mention selon la note
  static obtenirMention(note: number): string {
    if (note < 10) return 'Ajourné';
    if (note < 12) return 'Passable';
    if (note < 14) return 'Assez Bien';
    if (note < 16) return 'Bien';
    return 'Très Bien';
  }

  // Créer une nouvelle note
  static async create(noteData: Partial<INote>): Promise<INote | null> {
    console.log('Couche modèle - données d\'entrée note', noteData);
    
    const {
      etudiant_id, cours_id, note_cc, note_examen, note_tp,
      type_evaluation, session, commentaire
    } = noteData;

    // Calculer la note finale
    const note_finale = this.calculerNoteFinal(note_cc, note_examen, note_tp);

    const params = [
      etudiant_id,
      cours_id,
      note_cc ?? null,
      note_examen ?? null,
      note_tp ?? null,
      note_finale,
      type_evaluation ?? 'examen',
      false, // validee
      session ?? 'normale',
      commentaire ?? null
    ];

    const query = `INSERT INTO notes 
      (etudiant_id, cours_id, note_cc, note_examen, note_tp, note_finale,
       type_evaluation, validee, session, commentaire)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findById(result.insertId);
    } catch (error) {
      console.error('Erreur création note:', error);
      throw error;
    }
  }

  // Créer plusieurs notes en batch (saisie de classe)
  static async createBatch(batch: IGradeBatch): Promise<boolean> {
    const { cours_id, session, notes } = batch;

    try {
      // Utiliser une transaction pour garantir l'atomicité
      await pool.query('START TRANSACTION');

      for (const noteEntry of notes) {
        const note_finale = this.calculerNoteFinal(
          noteEntry.note_cc,
          noteEntry.note_examen,
          noteEntry.note_tp
        );

        await pool.execute(
          `INSERT INTO notes 
           (etudiant_id, cours_id, note_cc, note_examen, note_tp, note_finale,
            type_evaluation, validee, session, commentaire)
           VALUES (?, ?, ?, ?, ?, ?, 'examen', false, ?, ?)`,
          [
            noteEntry.etudiant_id,
            cours_id,
            noteEntry.note_cc ?? null,
            noteEntry.note_examen ?? null,
            noteEntry.note_tp ?? null,
            note_finale,
            session,
            noteEntry.commentaire ?? null
          ]
        );
      }

      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Erreur création batch notes:', error);
      throw error;
    }
  }

  // Trouver une note par ID avec détails
  static async findById(id: number): Promise<INoteDetails | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM notes n
      INNER JOIN etudiants e ON n.etudiant_id = e.id
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE n.id = ?`,
      [id]
    );

    return (rows as RowDataPacket[])[0] || null;
  }

  // Récupérer toutes les notes avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        n.*,
        e.numero_etudiant,
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM notes n
      INNER JOIN etudiants e ON n.etudiant_id = e.id
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.cours_id) {
      query += ' AND n.cours_id = ?';
      params.push(filters.cours_id);
    }
    if (filters.etudiant_id) {
      query += ' AND n.etudiant_id = ?';
      params.push(filters.etudiant_id);
    }
    if (filters.session) {
      query += ' AND n.session = ?';
      params.push(filters.session);
    }
    if (filters.validee !== undefined) {
      query += ' AND n.validee = ?';
      params.push(filters.validee);
    }
    if (filters.admis !== undefined) {
      query += ' AND (n.note_finale >= 10) = ?';
      params.push(filters.admis);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY c.nom, e.nom, e.prenom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: rows as INoteDetails[],
      pagination: {
        page: isNaN(page) ? parseInt(page.toString()) : page ?? 1,
        limit: isNaN(limit) ? parseInt(limit.toString()) : limit ?? 10,
        total: (countRows as RowDataPacket[])[0]?.total ?? 0,
        totalPages: Math.ceil(((countRows as RowDataPacket[])[0]?.total ?? 0) / limit)
      }
    };
  }

  // Récupérer les notes d'un cours
  static async findByCours(coursId: number): Promise<INoteDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM notes n
      INNER JOIN etudiants e ON n.etudiant_id = e.id
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE n.cours_id = ?
      ORDER BY e.nom, e.prenom`,
      [coursId]
    );

    return rows as INoteDetails[];
  }

  // Récupérer les notes d'un étudiant
  static async findByEtudiant(etudiantId: number): Promise<INoteDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM notes n
      INNER JOIN etudiants e ON n.etudiant_id = e.id
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE n.etudiant_id = ?
      ORDER BY c.nom`,
      [etudiantId]
    );

    return rows as INoteDetails[];
  }

  // Mettre à jour une note
  static async update(id: number, noteData: Partial<INote>): Promise<INoteDetails | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // Si les notes sont modifiées, recalculer la note finale
    if (noteData.note_cc !== undefined || noteData.note_examen !== undefined || noteData.note_tp !== undefined) {
      // Récupérer la note actuelle
      const currentNote = await this.findById(id);
      if (!currentNote) return null;

      const note_finale = this.calculerNoteFinal(
        noteData.note_cc !== undefined ? noteData.note_cc : currentNote.note_cc,
        noteData.note_examen !== undefined ? noteData.note_examen : currentNote.note_examen,
        noteData.note_tp !== undefined ? noteData.note_tp : currentNote.note_tp
      );

      noteData.note_finale = note_finale;
    }

    Object.entries(noteData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const query = `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  // Supprimer une note
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM notes WHERE id = ?',
      [id]
    );
    return (result.affectedRows ?? 0) > 0;
  }

  // Valider une note
  static async validate(id: number, userId: number): Promise<INoteDetails | null> {
    await pool.execute(
      `UPDATE notes 
       SET validee = TRUE, 
           validee_par = ?, 
           date_validation = NOW() 
       WHERE id = ?`,
      [userId, id]
    );

    return this.findById(id);
  }

  // Invalider une note (retirer la validation)
  static async invalidate(id: number): Promise<INoteDetails | null> {
    await pool.execute(
      `UPDATE notes 
       SET validee = FALSE, 
           validee_par = NULL, 
           date_validation = NULL 
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  // Obtenir les statistiques d'un cours
  static async getStatistiques(coursId: number): Promise<IGradeStatistics> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(note_finale) as moyenne_classe,
        MIN(note_finale) as note_min,
        MAX(note_finale) as note_max,
        COUNT(CASE WHEN note_finale >= 10 THEN 1 END) as nb_admis,
        COUNT(CASE WHEN note_finale < 10 THEN 1 END) as nb_ajournes,
        COUNT(CASE WHEN note_finale >= 10 AND note_finale < 12 THEN 1 END) as passable,
        COUNT(CASE WHEN note_finale >= 12 AND note_finale < 14 THEN 1 END) as assez_bien,
        COUNT(CASE WHEN note_finale >= 14 AND note_finale < 16 THEN 1 END) as bien,
        COUNT(CASE WHEN note_finale >= 16 THEN 1 END) as tres_bien,
        COUNT(*) as total
      FROM notes
      WHERE cours_id = ? AND validee = TRUE`,
      [coursId]
    );

    const stats = (rows as RowDataPacket[])[0];

    if (!stats || stats.total === 0) {
      return {
        cours_id: coursId,
        moyenne_classe: 0,
        note_min: 0,
        note_max: 0,
        nb_admis: 0,
        nb_ajournes: 0,
        taux_reussite: 0,
        repartition_mentions: {
          passable: 0,
          assez_bien: 0,
          bien: 0,
          tres_bien: 0
        }
      };
    }

    return {
      cours_id: coursId,
      moyenne_classe: Math.round(stats.moyenne_classe * 100) / 100,
      note_min: stats.note_min,
      note_max: stats.note_max,
      nb_admis: stats.nb_admis,
      nb_ajournes: stats.nb_ajournes,
      taux_reussite: Math.round((stats.nb_admis / stats.total) * 100 * 100) / 100,
      repartition_mentions: {
        passable: stats.passable,
        assez_bien: stats.assez_bien,
        bien: stats.bien,
        tres_bien: stats.tres_bien
      }
    };
  }

  // Calculer la moyenne générale d'un étudiant
  static async getMoyenneEtudiant(etudiantId: number): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(n.note_finale) as moyenne_generale,
        COUNT(*) as nombre_cours,
        SUM(CASE WHEN n.note_finale >= 10 THEN c.credits ELSE 0 END) as credits_obtenus,
        SUM(c.credits) as credits_totaux
      FROM notes n
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE n.etudiant_id = ? AND n.validee = TRUE`,
      [etudiantId]
    );

    const result = (rows as RowDataPacket[])[0];

    return {
      moyenne_generale: result.moyenne_generale ? Math.round(result.moyenne_generale * 100) / 100 : 0,
      nombre_cours: result.nombre_cours || 0,
      credits_obtenus: result.credits_obtenus || 0,
      credits_totaux: result.credits_totaux || 0
    };
  }

  // Obtenir le relevé de notes d'un étudiant pour un semestre
  static async getReleveNotes(etudiantId: number, anneeAcademique: string, semestre: string): Promise<any> {
    const [notes] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits,
        CASE WHEN n.note_finale >= 10 THEN 'Admis' ELSE 'Ajourné' END as resultat
      FROM notes n
      INNER JOIN cours c ON n.cours_id = c.id
      INNER JOIN inscriptions i ON i.etudiant_id = n.etudiant_id AND i.cours_id = n.cours_id
      WHERE n.etudiant_id = ? 
        AND i.annee_academique = ?
        AND c.semestre = ?
        AND n.validee = TRUE
      ORDER BY c.code`,
      [etudiantId, anneeAcademique, semestre]
    );

    // Calculer les totaux
    const moyenne_generale = notes.length > 0
      ? notes.reduce((sum: number, n: any) => sum + n.note_finale, 0) / notes.length
      : 0;

    const credits_obtenus = notes.reduce((sum: number, n: any) => 
      n.note_finale >= 10 ? sum + n.credits : sum, 0
    );

    const credits_totaux = notes.reduce((sum: number, n: any) => sum + n.credits, 0);

    return {
      notes: notes as RowDataPacket[],
      moyenne_generale: Math.round(moyenne_generale * 100) / 100,
      credits_obtenus,
      credits_totaux
    };
  }

  // Recherche avancée
  static async search(criteria: any) {
    let query = `
      SELECT 
        n.*,
        e.numero_etudiant,
        e.nom as etudiant_nom,
        e.prenom as etudiant_prenom,
        c.code as cours_code,
        c.nom as cours_nom,
        c.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM notes n
      INNER JOIN etudiants e ON n.etudiant_id = e.id
      INNER JOIN cours c ON n.cours_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (criteria.cours_id) {
      query += ' AND n.cours_id = ?';
      params.push(criteria.cours_id);
    }
    if (criteria.etudiant_id) {
      query += ' AND n.etudiant_id = ?';
      params.push(criteria.etudiant_id);
    }
    if (criteria.session) {
      query += ' AND n.session = ?';
      params.push(criteria.session);
    }
    if (criteria.validee !== undefined) {
      query += ' AND n.validee = ?';
      params.push(criteria.validee);
    }
    if (criteria.note_min !== undefined) {
      query += ' AND n.note_finale >= ?';
      params.push(criteria.note_min);
    }
    if (criteria.note_max !== undefined) {
      query += ' AND n.note_finale <= ?';
      params.push(criteria.note_max);
    }

    query += ' ORDER BY c.nom, e.nom LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as INoteDetails[];
  }
}

export default Note;