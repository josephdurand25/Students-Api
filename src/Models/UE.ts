import { IUniteEnseignement, IUniteEnseignementCreate, IUniteEnseignementUpdate, IUniteEnseignementWithDetails } from "../types/ICours";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

console.log('DEBUG UniteEnseignement - pool keys:', pool && Object.keys(pool));

class UniteEnseignement {
  // Créer une nouvelle UE
  static async create(ueData: Partial<IUniteEnseignementCreate>): Promise<IUniteEnseignement | null> {
    console.log('Couche modèle - données d\'entrée UE', ueData);
    
    if (!ueData || !ueData.code) {
      console.error('Code UE requis');
      return null;
    }
    
    const {
      code, nom, type, credits, coefficient, volume_horaire_total,
      description, groupe_cours_code
    } = ueData;

    const params = [
      code || null,
      nom || null,
      type || null,
      credits || null,
      coefficient || 1.00,
      volume_horaire_total || null,
      description || null,
      groupe_cours_code || null
    ];

    const query = `INSERT INTO UniteEnseignement 
      (code, nom, type, credits, coefficient, volume_horaire_total,
       description, groupe_cours_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création UE:', error);
      throw error;
    }
  }

  // Trouver une UE par code
  static async findByCode(code?: string): Promise<IUniteEnseignement | null> {
    if (!code) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM UniteEnseignement WHERE code = ?',
      [code]
    );
    const row = rows[0];
    return row as IUniteEnseignement || null;
  }

  // Trouver avec détails (avec matières)
  static async findByCodeWithMatieres(code: string) {
    const ue = await this.findByCode(code);
    if (!ue) return null;

    const [matieres] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Matiere WHERE unite_enseignement_code = ? ORDER BY type_cours, code',
      [code]
    );

    return {
      ...ue,
      matieres: matieres
    };
  }

  // Récupérer toutes les UE avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM UniteEnseignement WHERE 1=1';
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.groupe_cours_code) {
      query += ' AND groupe_cours_code = ?';
      params.push(filters.groupe_cours_code);
    }
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.search) {
      query += ' AND (nom LIKE ? OR code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY code LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: rows as IUniteEnseignementWithDetails[],
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total: countRows[0]?.total ?? 0,
        totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit)
      }
    };
  }

  // Mettre à jour une UE
  static async update(code: string, ueData: Partial<IUniteEnseignementUpdate>) {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(ueData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'code') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findByCode(code);

    values.push(code);
    const query = `UPDATE UniteEnseignement SET ${fields.join(', ')} WHERE code = ?`;
    
    await pool.execute(query, values);
    return this.findByCode(code);
  }

  // Supprimer une UE
  static async delete(code: string): Promise<boolean> {
    try {
      // Les matières seront supprimées automatiquement grâce à ON DELETE CASCADE
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM UniteEnseignement WHERE code = ?',
        [code]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression UE:', error);
      throw error;
    }
  }

  // Obtenir les UE d'un groupe de cours
  static async findByGroupeCours(groupeCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM UniteEnseignement WHERE groupe_cours_code = ? ORDER BY code',
      [groupeCode]
    );
    return rows;
  }

  // Obtenir les matières d'une UE
  static async getMatieres(ueCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM Matiere m
      LEFT JOIN Salle s ON m.salle_code = s.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      WHERE m.unite_enseignement_code = ?
      ORDER BY m.type_cours, m.code`,
      [ueCode]
    );
    return rows;
  }

  // Calculer le volume horaire total d'une UE (somme des matières)
  static async calculateVolumeHoraire(ueCode: string): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(volume_horaire), 0) as total
       FROM Matiere
       WHERE unite_enseignement_code = ?`,
      [ueCode]
    );

    return rows[0]?.total ?? 0;
  }

  // Mettre à jour le volume horaire total automatiquement
  static async updateVolumeHoraire(ueCode: string): Promise<void> {
    const total = await this.calculateVolumeHoraire(ueCode);
    
    await pool.execute(
      'UPDATE UniteEnseignement SET volume_horaire_total = ? WHERE code = ?',
      [total, ueCode]
    );
  }

  // Obtenir les statistiques des UE
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        type,
        COUNT(*) as total,
        AVG(credits) as credits_moyen,
        AVG(volume_horaire_total) as volume_horaire_moyen
      FROM UniteEnseignement
      GROUP BY type
      ORDER BY type`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM UniteEnseignement'
    );

    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN type = 'OBLIGATOIRE' THEN 1 END) as obligatoires,
        COUNT(CASE WHEN type = 'OPTIONNEL' THEN 1 END) as optionnels,
        COUNT(CASE WHEN type = 'TRANSVERSAL' THEN 1 END) as transversaux
      FROM UniteEnseignement`
    );

    return {
      total: totalRow[0]?.total ?? 0,
      obligatoires: statsRow[0]?.obligatoires ?? 0,
      optionnels: statsRow[0]?.optionnels ?? 0,
      transversaux: statsRow[0]?.transversaux ?? 0,
      par_type: rows
    };
  }

  // Recherche avancée
  static async search(criteria: Partial<IUniteEnseignement>) {
    let query = `SELECT * FROM UniteEnseignement WHERE 1=1`;
    const params: any[] = [];

    if (criteria.code) {
      query += ' AND code LIKE ?';
      params.push(`%${criteria.code}%`);
    }
    if (criteria.nom) {
      query += ' AND nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.type) {
      query += ' AND type = ?';
      params.push(criteria.type);
    }
    if (criteria.groupe_cours_code) {
      query += ' AND groupe_cours_code = ?';
      params.push(criteria.groupe_cours_code);
    }

    query += ' ORDER BY code LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }

  // Obtenir toutes les UE avec leurs matières
  static async getAllWithMatieres() {
    const [ues] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM UniteEnseignement ORDER BY code'
    );

    const result = await Promise.all(
      ues.map(async (ue) => {
        const matieres = await this.getMatieres(ue.code);
        return {
          ...ue,
          matieres
        };
      })
    );

    return result;
  }

  // Vérifier si une UE a des étudiants inscrits
  static async hasEtudiants(ueCode: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM UniteEnseignement ue
       INNER JOIN InscriptionGroupe ig ON ue.groupe_cours_code = ig.groupe_cours_code
       WHERE ue.code = ? AND ig.statut = 'VALIDE'`,
      [ueCode]
    );

    return (rows[0]?.count ?? 0) > 0;
  }

  /**
   * Trouver les UE disponibles pour un étudiant
   * (UE auxquelles l'étudiant n'est pas encore inscrit)
   */
  static async findDisponiblesPourEtudiant(etudiantId: number): Promise<IUniteEnseignement[]> {
    try {
      const query = `
        SELECT DISTINCT ue.*
        FROM UniteEnseignement ue
        JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
        WHERE ue.code NOT IN (
          SELECT DISTINCT m.unite_enseignement_code
          FROM Matiere m
          JOIN Note n ON m.code = n.matiere_code
          WHERE n.etudiant_id = ?
        )
        AND ue.code NOT IN (
          SELECT DISTINCT m.unite_enseignement_code
          FROM Matiere m
          JOIN Presence p ON m.code = p.matiere_code
          WHERE p.etudiant_id = ?
        )
        AND gc.statut = 'OUVERT'
        ORDER BY ue.nom
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId, etudiantId]);
      
      return rows.map(row => this.mapToIUniteEnseignement(row));
    } catch (error) {
      console.error('Erreur dans findDisponiblesPourEtudiant:', error);
      throw error;
    }
  }

  /**
   * Version alternative avec vérification via InscriptionGroupe
   */
  static async findDisponiblesPourEtudiantV2(etudiantId: number, anneeAcademique?: string): Promise<IUniteEnseignement[]> {
    try {
      const anneeCondition = anneeAcademique 
        ? `AND gc.annee_academique_code = '${anneeAcademique}'` 
        : 'AND gc.annee_academique_code = (SELECT code FROM AnneeAcademique WHERE statut = "EN_COURS" LIMIT 1)';

      const query = `
        SELECT DISTINCT ue.*, 
               gc.nom AS groupe_nom,
               gc.semestre,
               gc.annee_academique_code
        FROM UniteEnseignement ue
        JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
        LEFT JOIN (
          SELECT DISTINCT m.unite_enseignement_code
          FROM InscriptionGroupe ig
          JOIN Matiere m ON ig.groupe_cours_code = m.unite_enseignement_code
          WHERE ig.etudiant_id = ?
          AND ig.statut = 'VALIDE'
        ) AS ue_inscrites ON ue.code = ue_inscrites.unite_enseignement_code
        WHERE ue_inscrites.unite_enseignement_code IS NULL
        AND gc.statut = 'OUVERT'
        ${anneeCondition}
        ORDER BY gc.annee_academique_code DESC, gc.semestre, ue.nom
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId]);
      
      return rows.map(row => this.mapToIUniteEnseignement(row));
    } catch (error) {
      console.error('Erreur dans findDisponiblesPourEtudiantV2:', error);
      throw error;
    }
  }

  /**
   * Trouver les UE disponibles pour un étudiant dans un groupe spécifique
   */
  static async findDisponiblesPourEtudiantDansGroupe(etudiantId: number, groupeCode: string): Promise<IUniteEnseignement[]> {
    try {
      const query = `
        SELECT ue.*
        FROM UniteEnseignement ue
        WHERE ue.groupe_cours_code = ?
        AND ue.code NOT IN (
          SELECT DISTINCT m.unite_enseignement_code
          FROM Matiere m
          JOIN Note n ON m.code = n.matiere_code
          WHERE n.etudiant_id = ?
          AND m.unite_enseignement_code IS NOT NULL
        )
        AND EXISTS (
          SELECT 1 FROM GroupeCours gc 
          WHERE gc.code = ue.groupe_cours_code 
          AND gc.statut = 'OUVERT'
        )
        ORDER BY ue.type, ue.nom
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [groupeCode, etudiantId]);
      
      return rows.map(row => this.mapToIUniteEnseignement(row));
    } catch (error) {
      console.error('Erreur dans findDisponiblesPourEtudiantDansGroupe:', error);
      throw error;
    }
  }

  /**
   * Calculer la moyenne d'une UE pour un étudiant
   * Moyenne pondérée par les coefficients des matières
   */
  static async calculateMoyenneUE(etudiantId: number, ueCode: string): Promise<number> {
    try {
      const query = `
        SELECT 
          m.code AS matiere_code,
          m.nom AS matiere_nom,
          m.coefficient AS matiere_coefficient,
          n.note_finale,
          n.validee
        FROM Matiere m
        LEFT JOIN Note n ON m.code = n.matiere_code AND n.etudiant_id = ?
        WHERE m.unite_enseignement_code = ?
        AND n.validee = TRUE
        AND n.note_finale IS NOT NULL
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId, ueCode]);
      
      if (rows.length === 0) {
        return 0;
      }

      let totalPoints = 0;
      let totalCoefficients = 0;
      let matieresAvecNotes = 0;

      for (const row of rows) {
        if (row.note_finale !== null && row.validee) {
          const note = Number(row.note_finale);
          const coefficient = Number(row.matiere_coefficient) || 1;
          
          totalPoints += note * coefficient;
          totalCoefficients += coefficient;
          matieresAvecNotes++;
        }
      }

      if (totalCoefficients === 0 || matieresAvecNotes === 0) {
        return 0;
      }

      const moyenne = totalPoints / totalCoefficients;
      return Number(moyenne.toFixed(2));
    } catch (error) {
      console.error('Erreur dans calculateMoyenneUE:', error);
      throw error;
    }
  }

  /**
   * Version alternative avec calcul détaillé et statistiques
   */
  static async calculateMoyenneUEDetails(etudiantId: number, ueCode: string): Promise<{
    moyenne: number;
    total_points: number;
    total_coefficients: number;
    matieres_evaluees: number;
    matieres_total: number;
    details: Array<{
      matiere_code: string;
      matiere_nom: string;
      coefficient: number;
      note_finale: number;
      points: number;
    }>;
  }> {
    try {
      const query = `
        SELECT 
          m.code AS matiere_code,
          m.nom AS matiere_nom,
          m.coefficient,
          n.note_finale,
          n.validee,
          n.session,
          n.date_validation
        FROM Matiere m
        LEFT JOIN Note n ON m.code = n.matiere_code AND n.etudiant_id = ?
        WHERE m.unite_enseignement_code = ?
        ORDER BY m.code
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId, ueCode]);
      
      const details = [];
      let totalPoints = 0;
      let totalCoefficients = 0;
      let matieresAvecNotes = 0;
      const matieresTotal = rows.length;

      for (const row of rows) {
        const coefficient = Number(row.coefficient) || 1;
        const noteFinale = row.note_finale !== null ? Number(row.note_finale) : null;
        const validee = row.validee === 1 || row.validee === true;

        if (noteFinale !== null && validee) {
          const points = noteFinale * coefficient;
          totalPoints += points;
          totalCoefficients += coefficient;
          matieresAvecNotes++;

          details.push({
            matiere_code: row.matiere_code,
            matiere_nom: row.matiere_nom,
            coefficient: coefficient,
            note_finale: noteFinale,
            points: points,
            validee: true,
            session: row.session,
            date_validation: row.date_validation
          });
        } else {
          details.push({
            matiere_code: row.matiere_code,
            matiere_nom: row.matiere_nom,
            coefficient: coefficient,
            note_finale: null,
            points: null,
            validee: false,
            session: null,
            date_validation: null
          });
        }
      }

      const moyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

      return {
        moyenne: Number(moyenne.toFixed(2)),
        total_points: Number(totalPoints.toFixed(2)),
        total_coefficients: Number(totalCoefficients.toFixed(2)),
        matieres_evaluees: matieresAvecNotes,
        matieres_total: matieresTotal,
        details: details as any
      };
    } catch (error) {
      console.error('Erreur dans calculateMoyenneUEDetails:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un étudiant a validé une UE (moyenne >= 10)
   */
  static async isUEValidee(etudiantId: number, ueCode: string): Promise<{
    validee: boolean;
    moyenne: number;
    seuil: number;
  }> {
    try {
      const moyenne = await this.calculateMoyenneUE(etudiantId, ueCode);
      
      // Récupérer le seuil de validation de l'UE (par défaut 10)
      const querySeuil = `
        SELECT coefficient
        FROM UniteEnseignement
        WHERE code = ?
      `;
      const [seuilRows] = await pool.execute<RowDataPacket[]>(querySeuil, [ueCode]);
      const seuilMinimum = 10; // Peut être ajusté selon les règles de l'établissement

      return {
        validee: moyenne >= seuilMinimum,
        moyenne: moyenne,
        seuil: seuilMinimum
      };
    } catch (error) {
      console.error('Erreur dans isUEValidee:', error);
      throw error;
    }
  }

  /**
   * Calculer la moyenne de plusieurs UE pour un étudiant
   */
  static async calculateMoyennesUEs(etudiantId: number, ueCodes?: string[]): Promise<
    Array<{
      ue_code: string;
      ue_nom: string;
      moyenne: number;
      validee: boolean;
      credits: number;
    }>
  > {
    try {
      let condition = '';
      let params: any[] = [etudiantId];

      if (ueCodes && ueCodes.length > 0) {
        condition = `AND ue.code IN (${ueCodes.map(() => '?').join(',')})`;
        params = [etudiantId, ...ueCodes];
      }

      const query = `
        SELECT 
          ue.code AS ue_code,
          ue.nom AS ue_nom,
          ue.credits,
          m.code AS matiere_code,
          m.coefficient AS matiere_coefficient,
          n.note_finale,
          n.validee
        FROM UniteEnseignement ue
        JOIN Matiere m ON ue.code = m.unite_enseignement_code
        LEFT JOIN Note n ON m.code = n.matiere_code AND n.etudiant_id = ?
        WHERE 1=1 ${condition}
        ORDER BY ue.code, m.code
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      // Regrouper par UE
      const uesMap = new Map();

      for (const row of rows) {
        const ueCode = row.ue_code;
        if (!uesMap.has(ueCode)) {
          uesMap.set(ueCode, {
            ue_code: ueCode,
            ue_nom: row.ue_nom,
            credits: row.credits,
            total_points: 0,
            total_coefficients: 0,
            matieres_evaluees: 0
          });
        }

        const ueData = uesMap.get(ueCode);

        if (row.note_finale !== null && row.validee) {
          const note = Number(row.note_finale);
          const coefficient = Number(row.matiere_coefficient) || 1;
          
          ueData.total_points += note * coefficient;
          ueData.total_coefficients += coefficient;
          ueData.matieres_evaluees++;
        }
      }

      // Calculer les moyennes
      const result = [];
      for (const [ueCode, ueData] of uesMap) {
        const moyenne = ueData.total_coefficients > 0 
          ? ueData.total_points / ueData.total_coefficients 
          : 0;

        result.push({
          ue_code: ueCode,
          ue_nom: ueData.ue_nom,
          moyenne: Number(moyenne.toFixed(2)),
          validee: moyenne >= 10,
          credits: ueData.credits,
          matieres_evaluees: ueData.matieres_evaluees
        });
      }

      return result;
    } catch (error) {
      console.error('Erreur dans calculateMoyennesUEs:', error);
      throw error;
    }
  }

  /**
   * Helper: Mapper RowDataPacket vers IUniteEnseignement
   */
  private static mapToIUniteEnseignement(row: RowDataPacket): IUniteEnseignement {
    return {
      code: String(row.code),
      nom: String(row.nom),
      type: row.type as any,
      credits: Number(row.credits),
      coefficient: row.coefficient ? Number(row.coefficient) : 1,
      volume_horaire_total: row.volume_horaire_total ? Number(row.volume_horaire_total) : 0,
      description: row.description,
      groupe_cours_code: String(row.groupe_cours_code)
    };
  }

  /**
   * Helper: Mapper RowDataPacket vers IUniteEnseignementWithDetails
   */
  private static mapToIUniteEnseignementWithDetails(row: RowDataPacket): IUniteEnseignementWithDetails {
    return {
      code: String(row.code),
      nom: String(row.nom),
      type: row.type as any,
      credits: Number(row.credits),
      coefficient: row.coefficient ? Number(row.coefficient) : 1,
      volume_horaire_total: row.volume_horaire_total ? Number(row.volume_horaire_total) : 0,
      description: row.description,
      groupe_cours_code: String(row.groupe_cours_code),
      matieres: row.matieres ? JSON.parse(row.matieres) : []
    };
  }
}

export default UniteEnseignement;