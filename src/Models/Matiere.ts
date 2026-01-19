import { IMatiere, IMatiereCreate, IMatiereUpdate } from "../types/ICours";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

console.log('DEBUG Matiere - pool keys:', pool && Object.keys(pool));

class Matiere {
  // Créer une nouvelle matière
  static async create(matiereData: IMatiereCreate): Promise<IMatiere | null> {
    console.log('Couche modèle - données d\'entrée matière', matiereData);
    
    const {
      code, nom, type_cours, credits, coefficient, volume_horaire,
      salle_code, jour, heure_debut, heure_fin, unite_enseignement_code,
      enseignant_id
    } = matiereData;

    const params = [
      code,
      nom,
      type_cours,
      credits,
      coefficient,
      volume_horaire ?? null,
      salle_code ?? null,
      jour ?? null,
      heure_debut ?? null,
      heure_fin ?? null,
      unite_enseignement_code,
      enseignant_id ?? null
    ];

    const query = `INSERT INTO Matiere 
      (code, nom, type_cours, credits, coefficient, volume_horaire,
       salle_code, jour, heure_debut, heure_fin, unite_enseignement_code, enseignant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création matière:', error);
      throw error;
    }
  }

  // Trouver une matière par code
  static async findByCode(code: string): Promise<IMatiere | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Matiere WHERE code = ?',
      [code]
    );
    const row = rows[0];
    return row ? (row as IMatiere): null;
  }

  // Trouver avec détails (jointures)
  static async findByCodeWithDetails(code: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        s.nom as salle_nom,
        s.capacite as salle_capacite,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom
      FROM Matiere m
      LEFT JOIN Salle s ON m.salle_code = s.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      LEFT JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE m.code = ?`,
      [code]
    );

    return (rows)[0] || null;
  }

  // Récupérer toutes les matières avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM Matiere WHERE 1=1';
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.unite_enseignement_code) {
      query += ' AND unite_enseignement_code = ?';
      params.push(filters.unite_enseignement_code);
    }
    if (filters.type_cours) {
      query += ' AND type_cours = ?';
      params.push(filters.type_cours);
    }
    if (filters.enseignant_id) {
      query += ' AND enseignant_id = ?';
      params.push(filters.enseignant_id);
    }
    if (filters.jour) {
      query += ' AND jour = ?';
      params.push(filters.jour);
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
      data: rows,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total: (countRows)[0]?.total ?? 0,
        totalPages: Math.ceil(((countRows)[0]?.total ?? 0) / limit)
      }
    };
  }

  // Mettre à jour une matière
  static async update(code: string, matiereData: Partial<IMatiereUpdate>) {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(matiereData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'code') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findByCode(code);

    values.push(code);
    const query = `UPDATE Matiere SET ${fields.join(', ')} WHERE code = ?`;
    
    await pool.execute(query, values);
    return this.findByCode(code);
  }

  // Supprimer une matière
  static async delete(code: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM Matiere WHERE code = ?',
        [code]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression matière:', error);
      throw error;
    }
  }

  // Obtenir les matières d'une UE
  static async findByUE(ueCode: string) {
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

  // Obtenir les matières d'un enseignant
  static async findByEnseignant(enseignantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        ue.nom as ue_nom,
        ue.credits as ue_credits,
        gc.nom as groupe_nom,
        gc.filiere_code,
        gc.niveau
      FROM Matiere m
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      INNER JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
      WHERE m.enseignant_id = ?
      ORDER BY gc.code, m.code`,
      [enseignantId]
    );
    return rows;
  }

  // Vérifier les conflits d'horaires pour un étudiant
  static async checkConflicts(etudiantId: number, matiereCode: string): Promise<{ hasConflict: boolean; message?: string; conflictingMatieres?: any[] }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m2.code, m2.nom, m2.jour, m2.heure_debut, m2.heure_fin
      FROM InscriptionGroupe ig
      INNER JOIN UniteEnseignement ue ON ig.groupe_cours_code = ue.groupe_cours_code
      INNER JOIN Matiere m2 ON ue.code = m2.unite_enseignement_code
      INNER JOIN Matiere m1 ON m1.code = ?
      WHERE ig.etudiant_id = ?
        AND ig.statut = 'VALIDE'
        AND m1.jour IS NOT NULL
        AND m2.jour IS NOT NULL
        AND m1.jour = m2.jour
        AND m2.code != m1.code
        AND (
          (m1.heure_debut < m2.heure_fin AND m1.heure_fin > m2.heure_debut)
        )`,
      [matiereCode, etudiantId]
    );

    if ((rows).length > 0) {
      const conflictingMatieres = rows;
      return {
        hasConflict: true,
        message: `Conflit d'horaires avec ${conflictingMatieres.length} matière(s)`,
        conflictingMatieres
      };
    }

    return { hasConflict: false };
  }

  // Obtenir l'emploi du temps d'un étudiant
  static async getEmploiDuTemps(etudiantId: number, groupeCode?: string) {
    let query = `
      SELECT 
        m.code, m.nom, m.type_cours, m.jour, m.heure_debut, m.heure_fin,
        m.salle_code,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom,
        gc.nom as groupe_nom
      FROM InscriptionGroupe ig
      INNER JOIN GroupeCours gc ON ig.groupe_cours_code = gc.code
      INNER JOIN UniteEnseignement ue ON gc.code = ue.groupe_cours_code
      INNER JOIN Matiere m ON ue.code = m.unite_enseignement_code
      LEFT JOIN Salle s ON m.salle_code = s.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      WHERE ig.etudiant_id = ?
        AND ig.statut = 'VALIDE'
        AND m.jour IS NOT NULL
    `;

    const params: any[] = [etudiantId];

    if (groupeCode) {
      query += ' AND gc.code = ?';
      params.push(groupeCode);
    }

    query += ' ORDER BY FIELD(m.jour, "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"), m.heure_debut';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows ;
  }

  // Obtenir les statistiques des matières
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        type_cours,
        COUNT(*) as total,
        SUM(volume_horaire) as volume_horaire_total,
        AVG(credits) as credits_moyen
      FROM Matiere
      GROUP BY type_cours
      ORDER BY type_cours`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM Matiere'
    );

    return {
      total_matieres: (totalRow)[0]?.total ?? 0,
      par_type: rows
    };
  }

  // Recherche avancée
  static async search(criteria: Partial<IMatiere>) {
    let query = `
      SELECT 
        m.*,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom
      FROM Matiere m
      LEFT JOIN Salle s ON m.salle_code = s.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      LEFT JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (criteria.code) {
      query += ' AND m.code LIKE ?';
      params.push(`%${criteria.code}%`);
    }
    if (criteria.nom) {
      query += ' AND m.nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.type_cours) {
      query += ' AND m.type_cours = ?';
      params.push(criteria.type_cours);
    }
    if (criteria.unite_enseignement_code) {
      query += ' AND m.unite_enseignement_code = ?';
      params.push(criteria.unite_enseignement_code);
    }
    if (criteria.enseignant_id) {
      query += ' AND m.enseignant_id = ?';
      params.push(criteria.enseignant_id);
    }
    if (criteria.jour) {
      query += ' AND m.jour = ?';
      params.push(criteria.jour);
    }

    query += ' ORDER BY m.code LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }

  // Obtenir les étudiants d'une matière
  static async getEtudiants(matiereCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        u.id, u.nom, u.prenom, u.email,
        e.numero_etudiant, e.filiere, e.niveau
      FROM Matiere m
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      INNER JOIN InscriptionGroupe ig ON ue.groupe_cours_code = ig.groupe_cours_code
      INNER JOIN Etudiant e ON ig.etudiant_id = e.id
      INNER JOIN Utilisateur u ON e.id = u.id
      WHERE m.code = ? AND ig.statut = 'VALIDE'
      ORDER BY u.nom, u.prenom`,
      [matiereCode]
    );
    return rows;
  }

   // Version alternative plus simple (si pas de table PrerequisMatiere)
  static async findDisponiblesPourInscriptionSimple(
    etudiantId: number, 
    groupeCode?: string
  ): Promise<IMatiere[]> {
    try {
      let query = `
        SELECT DISTINCT
          m.code, m.nom, m.type_cours, m.credits, m.coefficient,
          m.volume_horaire, m.salle_code, m.jour, m.heure_debut, 
          m.heure_fin, m.unite_enseignement_code, m.enseignant_id,
          ue.nom AS nom_ue,
          gc.code AS groupe_cours_code,
          gc.nom AS nom_groupe,
          s.nom AS salle_nom,
          s.capacite AS salle_capacite,
          CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom_complet,
          -- Compter le nombre d'étudiants inscrits
          (
            SELECT COUNT(DISTINCT n.etudiant_id)
            FROM Note n
            WHERE n.matiere_code = m.code
          ) AS nombre_inscrits
        FROM Matiere m
        INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
        INNER JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
        LEFT JOIN Salle s ON m.salle_code = s.code
        LEFT JOIN Enseignant e ON m.enseignant_id = e.id
        LEFT JOIN Utilisateur u ON e.id = u.id
        -- Vérifier que l'étudiant est inscrit au groupe de cours
        INNER JOIN InscriptionGroupe ig ON ig.groupe_cours_code = gc.code
          AND ig.etudiant_id = ?
          AND ig.statut = 'VALIDE'
        WHERE gc.statut = 'OUVERT'
          -- Vérifier que l'étudiant n'est pas déjà inscrit
          AND NOT EXISTS(
            SELECT 1 FROM Note n2
            WHERE n2.etudiant_id = ?
              AND n2.matiere_code = m.code
              AND n2.session IN ('NORMALE', 'RATTRAPAGE')
          )
      `;

      const params: any[] = [etudiantId, etudiantId];

      if (groupeCode) {
        query += ` AND gc.code = ?`;
        params.push(groupeCode);
      }

      query += ` ORDER BY ue.code, m.nom`;

      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      if (!rows || rows.length === 0) {
        return [];
      }

      // Filtrer par capacité de salle
      const matieresDisponibles = rows.filter(row => {
        if (row.salle_capacite && row.nombre_inscrits >= row.salle_capacite) {
          return false;
        }
        return true;
      });

      return matieresDisponibles.map(row => ({
        code: row.code,
        nom: row.nom,
        type_cours: row.type_cours,
        credits: row.credits,
        coefficient: row.coefficient,
        volume_horaire: row.volume_horaire,
        salle_code: row.salle_code,
        jour: row.jour,
        heure_debut: row.heure_debut,
        heure_fin: row.heure_fin,
        unite_enseignement_code: row.unite_enseignement_code,
        enseignant_id: row.enseignant_id,
        salle_nom: row.salle_nom,
        salle_capacite: row.salle_capacite,
        enseignant_nom: row.enseignant_nom_complet,
        ue_nom: row.nom_ue,
        groupe_cours_code: row.groupe_cours_code,
        nom_groupe: row.nom_groupe,
        places_disponibles: row.salle_capacite ? row.salle_capacite - row.nombre_inscrits : null,
        nombre_inscrits: row.nombre_inscrits
      })) as IMatiere[];

    } catch (error) {
      console.error('Erreur dans findDisponiblesPourInscriptionSimple:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une matière est disponible pour inscription
   * @param etudiantId ID de l'étudiant
   * @param matiereCode Code de la matière
   * @returns Objet avec disponibilité et raisons
   */
  static async checkDisponibilitePourInscription(
    etudiantId: number, 
    matiereCode: string
  ): Promise<{
    disponible: boolean;
    raisons?: string[];
    details?: any;
  }> {
    try {
      const query = `
        SELECT 
          m.code,
          m.nom,
          gc.statut AS statut_groupe,
          ig.statut AS statut_inscription,
          -- Vérifier si déjà inscrit
          EXISTS(
            SELECT 1 FROM Note n
            WHERE n.etudiant_id = ? 
              AND n.matiere_code = m.code
              AND n.session IN ('NORMALE', 'RATTRAPAGE')
          ) AS deja_inscrit,
          -- Vérifier capacité salle
          s.capacite AS salle_capacite,
          (
            SELECT COUNT(DISTINCT n2.etudiant_id)
            FROM Note n2
            WHERE n2.matiere_code = m.code
          ) AS nombre_inscrits
        FROM Matiere m
        INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
        INNER JOIN GroupeCours gc ON ue.groupe_cours_code = gc.code
        LEFT JOIN Salle s ON m.salle_code = s.code
        LEFT JOIN InscriptionGroupe ig ON ig.groupe_cours_code = gc.code 
          AND ig.etudiant_id = ?
        WHERE m.code = ?
        LIMIT 1
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId, etudiantId, matiereCode]);
      
      if (!rows || rows.length === 0) {
        return {
          disponible: false,
          raisons: ['Matière non trouvée']
        };
      }

      const row = rows[0];
      const raisons: string[] = [];

      // Vérifications
      if (!row?.statut_inscription || row?.statut_inscription !== 'VALIDE') {
        raisons.push('Étudiant non inscrit au groupe de cours');
      }
      
      if (row?.statut_groupe !== 'OUVERT') {
        raisons.push(`Le groupe de cours est ${row?.statut_groupe.toLowerCase()}`);
      }
      
      if (row?.deja_inscrit) {
        raisons.push('Étudiant déjà inscrit à cette matière');
      }
      
      if (row?.salle_capacite && row?.nombre_inscrits >= row.salle_capacite) {
        raisons.push('Capacité maximale de la salle atteinte');
      }

      return {
        disponible: raisons.length === 0,
        raisons: raisons.length > 0 ? raisons : [],
        details: {
          matiere_nom: row?.nom,
          statut_groupe: row?.statut_groupe,
          statut_inscription: row?.statut_inscription,
          deja_inscrit: row?.deja_inscrit,
          capacite_salle: row?.salle_capacite,
          inscrits_actuels: row?.nombre_inscrits,
          places_disponibles: row?.salle_capacite ? row?.salle_capacite - row?.nombre_inscrits : null
        }
      };

    } catch (error) {
      console.error('Erreur dans checkDisponibilitePourInscription:', error);
      throw error;
    }
  }
}

export default Matiere;