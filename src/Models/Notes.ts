import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { INote, INoteDetails, IGradeBatch, IGradeStatistics } from '../types/INote';

console.log('DEBUG Note - pool keys:', pool && Object.keys(pool));

class Note {
  // Calculer la note finale selon la formule du trigger SQL
  // IMPORTANT: Cette méthode est pour référence côté backend
  // La note_finale est calculée AUTOMATIQUEMENT par le trigger SQL
  static calculerNoteFinal(note_cc?: number, note_examen?: number, note_tp?: number): number {
    // Si CC et Examen uniquement: CC (40%) + Examen (60%)
    if (note_cc !== undefined && note_cc !== null && 
        note_examen !== undefined && note_examen !== null && 
        !note_tp) {
      return Number(((note_cc * 0.4) + (note_examen * 0.6)).toFixed(2));
    }
    
    // Si CC, Examen et TP: CC (30%) + Examen (50%) + TP (20%)
    if (note_cc !== undefined && note_cc !== null && 
        note_examen !== undefined && note_examen !== null && 
        note_tp !== undefined && note_tp !== null) {
      return Number(((note_cc * 0.3) + (note_examen * 0.5) + (note_tp * 0.2)).toFixed(2));
    }

    // Calcul partiel si seulement certaines notes sont présentes
    let total = 0;
    let weightSum = 0;

    if (note_cc !== undefined && note_cc !== null) {
      total += note_cc * (note_tp ? 0.3 : 0.4);
      weightSum += (note_tp ? 0.3 : 0.4);
    }

    if (note_examen !== undefined && note_examen !== null) {
      total += note_examen * (note_tp ? 0.5 : 0.6);
      weightSum += (note_tp ? 0.5 : 0.6);
    }

    if (note_tp !== undefined && note_tp !== null) {
      total += note_tp * 0.2;
      weightSum += 0.2;
    }

    return weightSum > 0 ? Number((total / weightSum).toFixed(2)) : 0;
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
    
    if (!noteData || !noteData.etudiant_id || !noteData.matiere_code) {
      console.error('etudiant_id et matiere_code requis');
      return null;
    }
    
    const {
      etudiant_id, matiere_code, note_cc, note_examen, note_tp,
      type_evaluation, session, commentaire, saisie_par_enseignant_id
    } = noteData;

    // NOTE: note_finale sera calculée automatiquement par le trigger SQL
    // Pas besoin de la calculer ici

    const params = [
      etudiant_id || null,
      matiere_code || null,
      note_cc || null,
      note_examen || null,
      note_tp || null,
      null, // note_finale sera calculée par le trigger
      type_evaluation || 'EXAMEN',
      false, // validee
      null, // date_validation
      commentaire || null,
      session || 'NORMALE',
      saisie_par_enseignant_id || null
    ];

    const query = `INSERT INTO Note 
      (etudiant_id, matiere_code, note_cc, note_examen, note_tp, note_finale,
       type_evaluation, validee, date_validation, commentaire, session, saisie_par_enseignant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
    const { matiere_code, session, notes } = batch;

    try {
      // Utiliser une transaction pour garantir l'atomicité
      await pool.query('START TRANSACTION');

      for (const noteEntry of notes) {
        // Le trigger calculera automatiquement note_finale
        await pool.execute(
          `INSERT INTO Note 
           (etudiant_id, matiere_code, note_cc, note_examen, note_tp, note_finale,
            type_evaluation, validee, session, commentaire, saisie_par_enseignant_id)
           VALUES (?, ?, ?, ?, ?, NULL, 'EXAMEN', false, ?, ?, ?)`,
          [
            noteEntry.etudiant_id,
            matiere_code,
            noteEntry.note_cc ?? null,
            noteEntry.note_examen ?? null,
            noteEntry.note_tp ?? null,
            session,
            noteEntry.commentaire ?? null,
            null // saisie_par_enseignant_id à fournir si nécessaire
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

  // Trouver une note par ID avec détails (utilise la vue SQL)
  static async findById(id: number): Promise<INoteDetails | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.nom as nom_matiere,
        m.unite_enseignement_code,
        ue.nom as nom_ue,
        ue.coefficient as coefficient_ue,
        ens_user.nom as nom_enseignant,
        ens_user.prenom as prenom_enseignant,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      LEFT JOIN Enseignant ens ON n.saisie_par_enseignant_id = ens.id
      LEFT JOIN Utilisateur ens_user ON ens.id = ens_user.id
      WHERE n.id = ?`,
      [id]
    );
    const row = rows[0];
    return row as INoteDetails || null;
  }

  // Récupérer toutes les notes avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        n.*,
        e.numero_etudiant,
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.code as matiere_code,
        m.nom as nom_matiere,
        ue.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE 1=1
    `;
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.matiere_code) {
      query += ' AND n.matiere_code = ?';
      params.push(filters.matiere_code);
    }
    if (filters.unite_enseignement_code) {
      query += ' AND m.unite_enseignement_code = ?';
      params.push(filters.unite_enseignement_code);
    }
    if (filters.etudiant_id) {
      query += ' AND n.etudiant_id = ?';
      params.push(filters.etudiant_id);
    }
    if (filters.session) {
      query += ' AND n.session = ?';
      params.push(filters.session);
    }
    if (filters.type_evaluation) {
      query += ' AND n.type_evaluation = ?';
      params.push(filters.type_evaluation);
    }
    if (filters.validee !== undefined) {
      query += ' AND n.validee = ?';
      params.push(filters.validee);
    }
    if (filters.admis !== undefined) {
      query += ' AND (n.note_finale >= 10) = ?';
      params.push(filters.admis);
    }
    if (filters.saisie_par_enseignant_id) {
      query += ' AND n.saisie_par_enseignant_id = ?';
      params.push(filters.saisie_par_enseignant_id);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY m.nom, u.nom, u.prenom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: rows as INoteDetails[],
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total: countRows[0]?.total ?? 0,
        totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit)
      }
    };
  }

  // Récupérer les notes d'une matière
  static async findByMatiere(matiereCode: string): Promise<INoteDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.nom as nom_matiere,
        ue.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE n.matiere_code = ?
      ORDER BY u.nom, u.prenom`,
      [matiereCode]
    );

    return rows as INoteDetails[];
  }

  // Récupérer les notes d'un étudiant
  static async findByEtudiant(etudiantId: number): Promise<INoteDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.code as matiere_code,
        m.nom as nom_matiere,
        ue.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE n.etudiant_id = ?
      ORDER BY m.nom`,
      [etudiantId]
    );

    return rows as INoteDetails[];
  }

  // Mettre à jour une note
  static async update(id: number, noteData: Partial<INote>): Promise<INoteDetails | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // NOTE: Si note_cc, note_examen ou note_tp sont modifiés,
    // le trigger SQL recalculera automatiquement note_finale
    // Donc on ne calcule PAS note_finale ici

    Object.entries(noteData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'note_finale') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const query = `UPDATE Note SET ${fields.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  // Supprimer une note
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM Note WHERE id = ?',
      [id]
    );
    return (result.affectedRows ?? 0) > 0;
  }

  // Valider une note
  static async validate(id: number, enseignantId: number): Promise<INoteDetails | null> {
    await pool.execute(
      `UPDATE Note 
       SET validee = TRUE, 
           date_validation = CURDATE()
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  // Invalider une note (retirer la validation)
  static async invalidate(id: number): Promise<INoteDetails | null> {
    await pool.execute(
      `UPDATE Note 
       SET validee = FALSE, 
           date_validation = NULL 
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  // Obtenir les statistiques d'une matière
  static async getStatistiques(matiereCode: string): Promise<IGradeStatistics> {
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
      FROM Note
      WHERE matiere_code = ? AND validee = TRUE`,
      [matiereCode]
    );

    const stats = rows[0];

    if (!stats || stats.total === 0) {
      return {
        matiere_code: matiereCode,
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
        },
        nombre_notes: 0
      };
    }

    return {
      matiere_code: matiereCode,
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
      },
      nombre_notes: stats.total
    };
  }

  // Calculer la moyenne générale d'un étudiant
  static async getMoyenneEtudiant(etudiantId: number): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(n.note_finale) as moyenne,
        COUNT(*) as nombre_matieres,
        SUM(CASE WHEN n.note_finale >= 10 THEN ue.credits ELSE 0 END) as credits_obtenus,
        SUM(ue.credits) as credits_totaux,
        COUNT(CASE WHEN n.validee = TRUE THEN 1 END) as nombre_notes_validees
      FROM Note n
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE n.etudiant_id = ? AND n.validee = TRUE`,
      [etudiantId]
    );

    const result = rows[0];

    return {
      moyenne: result?.moyenne ? Math.round(result?.moyenne * 100) / 100 : 0,
      nombre_matieres: result?.nombre_matieres || 0,
      credits_obtenus: result?.credits_obtenus || 0,
      credits_totaux: result?.credits_totaux || 0,
      nombre_notes_validees: result?.nombre_notes_validees || 0
    };
  }

  // Obtenir le relevé de notes d'un étudiant pour un semestre
  static async getReleveNotes(etudiantId: number, anneeAcademique: string, semestre: string): Promise<any> {
    const [notes] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        m.code as matiere_code,
        m.nom as nom_matiere,
        ue.credits,
        CASE WHEN n.note_finale >= 10 THEN 'Admis' ELSE 'Ajourné' END as resultat
      FROM Note n
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      INNER JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
      INNER JOIN InscriptionGroupe ig ON gc.code = ig.groupe_cours_code AND ig.etudiant_id = n.etudiant_id
      WHERE n.etudiant_id = ? 
        AND ig.annee_academique = ?
        AND gc.semestre = ?
        AND n.validee = TRUE
        AND ig.statut = 'VALIDE'
      ORDER BY m.code`,
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
      notes: notes,
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
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.code as matiere_code,
        m.nom as nom_matiere,
        ue.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis,
        CASE
          WHEN n.note_finale < 10 THEN 'Ajourné'
          WHEN n.note_finale < 12 THEN 'Passable'
          WHEN n.note_finale < 14 THEN 'Assez Bien'
          WHEN n.note_finale < 16 THEN 'Bien'
          ELSE 'Très Bien'
        END as mention
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (criteria.matiere_code) {
      query += ' AND n.matiere_code = ?';
      params.push(criteria.matiere_code);
    }
    if (criteria.etudiant_id) {
      query += ' AND n.etudiant_id = ?';
      params.push(criteria.etudiant_id);
    }
    if (criteria.session) {
      query += ' AND n.session = ?';
      params.push(criteria.session);
    }
    if (criteria.type_evaluation) {
      query += ' AND n.type_evaluation = ?';
      params.push(criteria.type_evaluation);
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

    query += ' ORDER BY m.nom, u.nom LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as INoteDetails[];
  }

  // Obtenir les notes par enseignant (pour ses matières)
  static async findByEnseignant(enseignantId: number): Promise<INoteDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*,
        e.numero_etudiant,
        u.nom as nom_etudiant,
        u.prenom as prenom_etudiant,
        m.code as matiere_code,
        m.nom as nom_matiere,
        ue.credits as cours_credits,
        CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END as admis
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE m.enseignant_id = ?
      ORDER BY m.nom, u.nom`,
      [enseignantId]
    );

    return rows as INoteDetails[];
  }
}

export default Note;