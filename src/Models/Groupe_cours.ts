import { IGroupeCours, IGroupeCoursCreate, IGroupeCoursUpdate } from "../types/ICours";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

console.log('DEBUG GroupeCours - pool keys:', pool && Object.keys(pool));

class GroupeCours {
  // Créer un nouveau groupe de cours
  static async create(groupeData: Partial<IGroupeCoursCreate>): Promise<IGroupeCours | null> {
    console.log('Couche modèle - données d\'entrée groupe', groupeData);
    
    if (!groupeData || !groupeData.code) {
      console.error('Code groupe requis');
      return null;
    }
    
    const {
      code, nom, filiere_code, niveau, semestre, annee_academique_code,
      credits_total, capacite_max, statut
    } = groupeData;

    const params = [
      code || null,
      nom || null,
      filiere_code || null,
      niveau || null,
      semestre || null,
      annee_academique_code || null,
      credits_total || 0,
      capacite_max || 30,
      statut || 'OUVERT'
    ];

    const query = `INSERT INTO GroupeCours 
      (code, nom, filiere_code, niveau, semestre, annee_academique_code,
       credits_total, capacite_max, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création groupe cours:', error);
      throw error;
    }
  }

  // Trouver un groupe par code
  static async findByCode(code?: string): Promise<IGroupeCours | null> {
    if (!code) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM GroupeCours WHERE code = ?',
      [code]
    );

    const row = rows[0];
    return row ? (row as IGroupeCours) : null;
  }

  // Récupérer tous les groupes avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM GroupeCours WHERE 1=1';
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.filiere_code) {
      query += ' AND filiere_code = ?';
      params.push(filters.filiere_code);
    }
    if (filters.niveau) {
      query += ' AND niveau = ?';
      params.push(filters.niveau);
    }
    if (filters.semestre) {
      query += ' AND semestre = ?';
      params.push(filters.semestre);
    }
    if (filters.annee_academique_code) {
      query += ' AND annee_academique_code = ?';
      params.push(filters.annee_academique_code);
    }
    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
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
      data: rows ,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total: countRows[0]?.total ?? 0,
        totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit)
      }
    };
  }

  // Mettre à jour un groupe
  static async update(code: string, groupeData: Partial<IGroupeCoursUpdate>) {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(groupeData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'code') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findByCode(code);

    values.push(code);
    const query = `UPDATE GroupeCours SET ${fields.join(', ')} WHERE code = ?`;
    
    await pool.execute(query, values);
    return this.findByCode(code);
  }

  // Supprimer un groupe
  static async delete(code: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM GroupeCours WHERE code = ?',
        [code]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression groupe cours:', error);
      throw error;
    }
  }

  // Obtenir les groupes avec statistiques d'inscriptions
  static async getGroupesWithStats() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        gc.*,
        COUNT(ig.id) as nombre_inscrits,
        (gc.capacite_max - COUNT(ig.id)) as places_disponibles,
        ROUND((COUNT(ig.id) / gc.capacite_max) * 100, 2) as taux_remplissage
      FROM GroupeCours gc
      LEFT JOIN InscriptionGroupe ig ON gc.code = ig.groupe_cours_code AND ig.statut = 'VALIDE'
      GROUP BY gc.code
      ORDER BY gc.code`
    );

    return rows;
  }

  // Obtenir les étudiants inscrits à un groupe
  static async getEtudiantsInscrits(groupeCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email,
        e.numero_etudiant, e.filiere, e.niveau,
        ig.numero_inscription, ig.date_inscription, ig.statut as statut_inscription
      FROM Etudiant e
      INNER JOIN Utilisateur u ON e.id = u.id
      INNER JOIN InscriptionGroupe ig ON e.id = ig.etudiant_id
      WHERE ig.groupe_cours_code = ?
      ORDER BY u.nom, u.prenom`,
      [groupeCode]
    );
    return rows;
  }

  // Vérifier la capacité du groupe (comme trigger)
  static async checkCapacity(groupeCode: string): Promise<{ available: boolean; message?: string, capacite_max?: number, nombre_inscrits?: number }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        gc.capacite_max,
        COUNT(ig.id) as nombre_inscrits
      FROM GroupeCours gc
      LEFT JOIN InscriptionGroupe ig ON gc.code = ig.groupe_cours_code AND ig.statut = 'VALIDE'
      WHERE gc.code = ?
      GROUP BY gc.code, gc.capacite_max`,
      [groupeCode]
    );

    const typedRows = rows;
    if (typedRows.length === 0) {
      return { available: false, message: 'Groupe non trouvé',  };
    }

    const result = typedRows[0];
    const capacite_max = result?.capacite_max;
    const nombre_inscrits = result?.nombre_inscrits;

    if (nombre_inscrits >= capacite_max) {
      return {
        available: false,
        message: `Le groupe est complet (${nombre_inscrits}/${capacite_max})`
      };
    }

    return { 
      available: true,
      message: '',
      capacite_max,
      nombre_inscrits
    };
  }

  // Obtenir les unités d'enseignement d'un groupe
  static async getUnitesEnseignement(groupeCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM UniteEnseignement 
       WHERE groupe_cours_code = ?
       ORDER BY code`,
      [groupeCode]
    );
    return rows;
  }

  // Obtenir les statistiques des groupes
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        filiere_code,
        niveau,
        semestre,
        COUNT(*) as total_groupes,
        AVG(credits_total) as credits_moyen,
        SUM(capacite_max) as capacite_totale
      FROM GroupeCours
      WHERE statut = 'OUVERT'
      GROUP BY filiere_code, niveau, semestre
      ORDER BY filiere_code, niveau, semestre`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM GroupeCours WHERE statut = \'OUVERT\''
    );

    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN statut = 'OUVERT' THEN 1 END) as ouverts,
        COUNT(CASE WHEN statut = 'COMPLET' THEN 1 END) as complets,
        COUNT(CASE WHEN statut = 'FERME' THEN 1 END) as fermes
      FROM GroupeCours`
    );

    return {
      total: totalRow [0]?.total ?? 0,
      ouverts: statsRow [0]?.ouverts ?? 0,
      complets: statsRow [0]?.complets ?? 0,
      fermes: statsRow [0]?.fermes ?? 0,
      parFiliere: rows
    };
  }

  // Recherche avancée
  static async search(criteria: Partial<IGroupeCours>) {
    let query = `SELECT * FROM GroupeCours WHERE 1=1`;
    const params: any[] = [];

    if (criteria.code) {
      query += ' AND code LIKE ?';
      params.push(`%${criteria.code}%`);
    }
    if (criteria.nom) {
      query += ' AND nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.filiere_code) {
      query += ' AND filiere_code = ?';
      params.push(criteria.filiere_code);
    }
    if (criteria.niveau) {
      query += ' AND niveau = ?';
      params.push(criteria.niveau);
    }
    if (criteria.semestre) {
      query += ' AND semestre = ?';
      params.push(criteria.semestre);
    }
    if (criteria.statut) {
      query += ' AND statut = ?';
      params.push(criteria.statut);
    }

    query += ' ORDER BY code LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }
}

export default GroupeCours;