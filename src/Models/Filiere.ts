import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { IFiliere, IFiliereCreate, IFiliereUpdate } from '../types/IFiliere';



// Classe Filiere
class Filiere {
  // Créer une nouvelle filière
  static async create(filiereData: IFiliereCreate): Promise<IFiliere | null> {
    console.log('couche modèle - création filière', filiereData);
    
    const { code, nom, description, responsable_id } = filiereData;
    
    // Vérifier si le code existe déjà (si fourni)
    if (code) {
      try {
        const existing = await this.findByCode(code);
        if (existing) {
          throw new Error('Une filière avec ce code existe déjà');
        }
      } catch (error) {
        if ((error as any).message?.includes('existe déjà')) throw error;
      }
    }
    
    try {
      const query = `
        INSERT INTO Filiere (code, nom, description, responsable_id, statut)
        VALUES (?, ?, ?, ?, 'ACTIVE')
      `;
      
      const [result] = await pool.execute<ResultSetHeader>(query, [
        code || null,
        nom || null,
        description || null,
        responsable_id || null
      ]);
      
      return code ? this.findByCode(code) : null;
    } catch (error) {
      console.error('Erreur création filière:', error);
      throw error;
    }
  }
  
  // Trouver une filière par son code
  static async findByCode(code?: string): Promise<IFiliere | null> {
    if (!code) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        f.code, f.nom, f.description, f.responsable_id, f.statut,
        u.nom as responsable_nom,
        u.prenom as responsable_prenom
      FROM Filiere f
      LEFT JOIN Utilisateur u ON f.responsable_id = u.id
      WHERE f.code = ?`,
      [code]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    return this.mapToIFiliere(row);
  }
  
  // Mapper RowDataPacket vers IFiliere
  private static mapToIFiliere(row: RowDataPacket): IFiliere {
    return {
      code: row.code,
      nom: row.nom,
      description: row.description_filiere,
      responsable_id: row.responsable_id,
      statut: row.statut
    } as IFiliere;
  }
  
  // Trouver par nom
  static async findByNom(nom?: string): Promise<IFiliere | null> {
    if (!nom) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT code, nom, description, responsable_id, statut
       FROM Filiere 
       WHERE nom = ?`,
      [nom]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    return this.mapToIFiliere(row);
  }
  
  // Récupérer toutes les filières avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        f.code, f.nom, f.description, f.responsable_id, f.statut,
        u.nom as responsable_nom,
        u.prenom as responsable_prenom
      FROM Filiere f
      LEFT JOIN Utilisateur u ON f.responsable_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // Appliquer les filtres
    if (filters.statut !== undefined) {
      query += ' AND f.statut = ?';
      params.push(filters.statut);
    }
    
    if (filters.search) {
      query += ' AND (f.nom LIKE ? OR f.code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Construire la requête finale
    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY f.nom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    
    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    
    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    
    return {
      data: rows.map(row => this.mapToIFiliere(row)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countRows[0]?.total || 0,
        totalPages: Math.ceil((countRows[0]?.total || 0) / limit)
      }
    };
  }
  
  // Mettre à jour une filière
  static async update(code: string, filiereData: Partial<IFiliereUpdate>): Promise<IFiliere | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(filiereData).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) {
        return this.findByCode(code);
      }
      
      values.push(code);
      const query = `UPDATE Filiere SET ${fields.join(', ')} WHERE code = ?`;
      
      await pool.execute(query, values);
      
      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur mise à jour filière:', error);
      throw error;
    }
  }
  
  // Supprimer une filière
  static async delete(code: string): Promise<boolean> {
    try {
      // Vérifier si la filière a des étudiants
      const [etudiantsRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM Etudiant WHERE filiere = ?',
        [code]
      );
      
      if (etudiantsRows[0]?.count > 0) {
        throw new Error('Impossible de supprimer la filière car elle a des étudiants inscrits');
      }
      
      // Vérifier si la filière a des UEs
      const [uesRows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM UniteEnseignement WHERE filiere_code = ?',
        [code]
      );
      
      if (uesRows[0]?.count > 0) {
        throw new Error('Impossible de supprimer la filière car elle a des UEs associées');
      }
      
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM Filiere WHERE code = ?',
        [code]
      );
      
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression filière:', error);
      throw error;
    }
  }
  
  // Obtenir les UEs d'une filière
  static async getUEs(code: string, semestre?: number) {
    let query = `
      SELECT 
        ue.code, ue.nom, ue.credits, ue.semestre, ue.obligatoire,
        COUNT(m.code) as nombre_matieres
      FROM UniteEnseignement ue
      LEFT JOIN Matiere m ON ue.code = m.unite_enseignement_code
      WHERE ue.filiere_code = ?
    `;
    
    const params: any[] = [code];
    
    if (semestre !== undefined) {
      query += ' AND ue.semestre = ?';
      params.push(semestre);
    }
    
    query += ' GROUP BY ue.code, ue.nom, ue.credits, ue.semestre, ue.obligatoire ORDER BY ue.semestre, ue.code';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }
  
  // Obtenir les étudiants d'une filière
  static async getStudents(code: string, statut?: string, niveau?: string) {
    let query = `
      SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.statut,
        e.numero_etudiant, e.date_naissance, e.niveau, e.statut_academique
      FROM Utilisateur u
      INNER JOIN Etudiant e ON u.id = e.id
      WHERE e.filiere = ?
    `;
    
    const params: any[] = [code];
    
    if (statut) {
      query += ' AND u.statut = ?';
      params.push(statut);
    }
    
    if (niveau) {
      query += ' AND e.niveau = ?';
      params.push(niveau);
    }
    
    query += ' ORDER BY u.nom, u.prenom';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }
  
  // Obtenir les statistiques d'une filière
  static async getStats(code: string) {
    // Statistiques des étudiants
    const [etudiantsStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_etudiants,
        SUM(CASE WHEN u.statut = 'actif' THEN 1 ELSE 0 END) as etudiants_actifs,
        SUM(CASE WHEN u.statut = 'inactif' THEN 1 ELSE 0 END) as etudiants_inactifs,
        AVG(TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE())) as age_moyen,
        COUNT(DISTINCT e.niveau) as niveaux_distincts
      FROM Utilisateur u
      INNER JOIN Etudiant e ON u.id = e.id
      WHERE e.filiere = ?`,
      [code]
    );
    
    // Statistiques des UEs
    const [uesStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_ues,
        SUM(CASE WHEN obligatoire = 1 THEN 1 ELSE 0 END) as ues_obligatoires,
        SUM(CASE WHEN obligatoire = 0 THEN 1 ELSE 0 END) as ues_optionnelles,
        COUNT(DISTINCT semestre) as semestres_distincts,
        SUM(credits) as credits_totaux
      FROM UniteEnseignement
      WHERE filiere_code = ?`,
      [code]
    );
    
    // Statistiques de réussite
    const [reussiteStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT n.etudiant_id) as etudiants_evalues,
        AVG(n.note_finale) as moyenne_generale,
        SUM(CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END) as reussites,
        SUM(CASE WHEN n.note_finale < 10 THEN 1 ELSE 0 END) as echecs
      FROM Note n
      INNER JOIN Etudiant e ON n.etudiant_id = e.id
      WHERE e.filiere = ? AND n.validee = 1`,
      [code]
    );
    
    return {
      etudiants: etudiantsStats[0] || {},
      ues: uesStats[0] || {},
      reussite: reussiteStats[0] || {}
    };
  }
  
  // Recherche avancée de filières
  static async search(criteria: {
    statut?: boolean;
    duree_min?: number;
    duree_max?: number;
    search?: string;
  }) {
    let query = `
      SELECT code, nom, description_filiere, , responsable_id, statut
      FROM Filiere 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (criteria.statut !== undefined) {
      query += ' AND statut = ?';
      params.push(criteria.statut ? 1 : 0);
    }
    
    // if (criteria.duree_min !== undefined) {
    //   query += ' AND duree_etudes >= ?';
    //   params.push(criteria.duree_min);
    // }
    
    // if (criteria.duree_max !== undefined) {
    //   query += ' AND duree_etudes <= ?';
    //   params.push(criteria.duree_max);
    // }
    
    if (criteria.search) {
      query += ' AND (nom LIKE ? OR code LIKE ? OR description_filiere LIKE ?)';
      const searchTerm = `%${criteria.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY nom LIMIT 100';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapToIFiliere(row));
  }
  
  // Obtenir toutes les statistiques des filières
  static async getStatistiquesGenerales() {
    const [filiereStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        f.code,
        f.nom,
        COUNT(e.id) as nombre_etudiants,
        AVG(TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE())) as age_moyen,
        COUNT(DISTINCT e.niveau) as niveaux
      FROM Filiere f
      LEFT JOIN Etudiant e ON f.code = e.filiere
      WHERE f.statut = 1
      GROUP BY f.code, f.nom
      ORDER BY nombre_etudiants DESC`
    );
    
    const [totalRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_filieres,
        SUM(CASE WHEN statut = 1 THEN 1 ELSE 0 END) as filieres_actives,
        AVG(duree_etudes) as duree_moyenne
      FROM Filiere`
    );
    
    return {
      total: totalRow[0] || {},
      par_filiere: filiereStats
    };
  }
}

export default Filiere;