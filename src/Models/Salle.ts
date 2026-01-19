import { ISalle, ISalleCreate, ISalleUpdate, TypeSalle } from '../types/ISalle';
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

console.log('DEBUG Salle - pool keys:', pool && Object.keys(pool));

class Salle {
  // Créer une nouvelle salle
  static async create(salleData: ISalleCreate): Promise<ISalle | null> {
    console.log('Couche modèle - données d\'entrée salle', salleData);
    
    const {
      code, nom, capacite, type, equipements
    } = salleData;

    // Convertir equipements en JSON string
    const equipementsJSON = equipements ? JSON.stringify(equipements) : null;

    const params = [
      code,
      nom,
      capacite,
      type,
      equipementsJSON
    ];

    const query = `INSERT INTO Salle 
      (code, nom, capacite, type, equipements)
      VALUES (?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création salle:', error);
      throw error;
    }
  }

  // Trouver une salle par code
  static async findByCode(code: string): Promise<ISalle | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Salle WHERE code = ?',
      [code]
    );

    const salle = (rows as RowDataPacket[])[0];
    if (!salle) return null;

    // Parser les équipements JSON
    if (salle.equipements && typeof salle.equipements === 'string') {
      try {
        salle.equipements = JSON.parse(salle.equipements);
      } catch {
        salle.equipements = {};
      }
    }

    return salle as ISalle;
  }

  // Récupérer toutes les salles avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM Salle WHERE 1=1';
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.capacite_min) {
      query += ' AND capacite >= ?';
      params.push(filters.capacite_min);
    }
    if (filters.capacite_max) {
      query += ' AND capacite <= ?';
      params.push(filters.capacite_max);
    }
    if (filters.search) {
      query += ' AND (nom LIKE ? OR code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY type, nom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Parser les équipements pour chaque salle
    const sallesWithParsedEquipements = (rows as RowDataPacket[]).map(salle => {
      if (salle.equipements && typeof salle.equipements === 'string') {
        try {
          salle.equipements = JSON.parse(salle.equipements);
        } catch {
          salle.equipements = {};
        }
      }
      return salle;
    });

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: sallesWithParsedEquipements,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total: (countRows as RowDataPacket[])[0]?.total ?? 0,
        totalPages: Math.ceil(((countRows as RowDataPacket[])[0]?.total ?? 0) / limit)
      }
    };
  }

  // Mettre à jour une salle
  static async update(code: string, salleData: Partial<ISalleUpdate>) {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(salleData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'code') {
        if (key === 'equipements') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return this.findByCode(code);

    values.push(code);
    const query = `UPDATE Salle SET ${fields.join(', ')} WHERE code = ?`;
    
    await pool.execute(query, values);
    return this.findByCode(code);
  }

  // Supprimer une salle
  static async delete(code: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM Salle WHERE code = ?',
        [code]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression salle:', error);
      throw error;
    }
  }

  // Trouver les salles par type
  static async findByType(type: TypeSalle) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM Salle WHERE type = ? ORDER BY nom',
      [type]
    );

    return (rows as RowDataPacket[]).map(salle => {
      if (salle.equipements && typeof salle.equipements === 'string') {
        try {
          salle.equipements = JSON.parse(salle.equipements);
        } catch {
          salle.equipements = {};
        }
      }
      return salle;
    });
  }

  // Obtenir l'emploi du temps d'une salle
  static async getSchedule(salleCode: string, jour?: string) {
    let query = `
      SELECT 
        m.*,
        ue.nom as ue_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM Matiere m
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      WHERE m.salle_code = ?
    `;

    const params: any[] = [salleCode];

    if (jour) {
      query += ' AND m.jour = ?';
      params.push(jour);
    }

    query += ' ORDER BY FIELD(m.jour, "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"), m.heure_debut';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as RowDataPacket[];
  }

  // Vérifier la disponibilité d'une salle
  static async checkAvailability(
    salleCode: string,
    jour: string,
    heure_debut: string,
    heure_fin: string
  ): Promise<{ disponible: boolean; message?: string; conflits?: any[] }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.code, m.nom, m.jour, m.heure_debut, m.heure_fin,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM Matiere m
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      WHERE m.salle_code = ?
        AND m.jour = ?
        AND (
          (m.heure_debut < ? AND m.heure_fin > ?) OR
          (m.heure_debut < ? AND m.heure_fin > ?) OR
          (m.heure_debut >= ? AND m.heure_fin <= ?)
        )`,
      [salleCode, jour, heure_fin, heure_debut, heure_fin, heure_fin, heure_debut, heure_fin]
    );

    if ((rows as RowDataPacket[]).length > 0) {
      return {
        disponible: false,
        message: `Salle occupée pour ce créneau (${rows.length} conflit(s))`,
        conflits: rows as RowDataPacket[]
      };
    }

    return {
      disponible: true,
      message: 'Salle disponible pour ce créneau'
    };
  }

  // Obtenir les matières dans une salle
  static async getMatieres(salleCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        ue.nom as ue_nom,
        ue.credits,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM Matiere m
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      LEFT JOIN Enseignant e ON m.enseignant_id = e.id
      LEFT JOIN Utilisateur u ON e.id = u.id
      WHERE m.salle_code = ?
      ORDER BY m.jour, m.heure_debut`,
      [salleCode]
    );
    return rows as RowDataPacket[];
  }

  // Vérifier si une salle a des matières
  static async hasMatieres(salleCode: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM Matiere WHERE salle_code = ?',
      [salleCode]
    );
    return ((rows as RowDataPacket[])[0]?.count ?? 0) > 0;
  }

  // Obtenir les statistiques d'une salle
  static async getStatistics(salleCode: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as nombre_matieres,
        COUNT(DISTINCT m.jour) as jours_utilises,
        COUNT(DISTINCT m.enseignant_id) as nombre_enseignants,
        COUNT(DISTINCT ue.groupe_cours_code) as nombre_groupes
      FROM Matiere m
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE m.salle_code = ?`,
      [salleCode]
    );

    return (rows as RowDataPacket[])[0] || {
      nombre_matieres: 0,
      jours_utilises: 0,
      nombre_enseignants: 0,
      nombre_groupes: 0
    };
  }

  // Obtenir les statistiques globales
  static async getGlobalStatistics() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        type,
        COUNT(*) as total,
        SUM(capacite) as capacite_totale,
        AVG(capacite) as capacite_moyenne
      FROM Salle
      GROUP BY type
      ORDER BY type`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM Salle'
    );

    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN type = 'AMPHI' THEN 1 END) as amphitheatres,
        COUNT(CASE WHEN type = 'TD' THEN 1 END) as salles_td,
        COUNT(CASE WHEN type = 'TP' THEN 1 END) as salles_tp,
        COUNT(CASE WHEN type = 'LABO' THEN 1 END) as laboratoires,
        COUNT(CASE WHEN type = 'ATELIER' THEN 1 END) as ateliers
      FROM Salle`
    );

    return {
      total: (totalRow as RowDataPacket[])[0]?.total ?? 0,
      amphitheatres: (statsRow as RowDataPacket[])[0]?.amphitheatres ?? 0,
      salles_td: (statsRow as RowDataPacket[])[0]?.salles_td ?? 0,
      salles_tp: (statsRow as RowDataPacket[])[0]?.salles_tp ?? 0,
      laboratoires: (statsRow as RowDataPacket[])[0]?.laboratoires ?? 0,
      ateliers: (statsRow as RowDataPacket[])[0]?.ateliers ?? 0,
      par_type: rows as RowDataPacket[]
    };
  }

  // Recherche avancée
  static async search(criteria: Partial<ISalle> & { capacite_min?: number; capacite_max?: number }) {
    let query = `SELECT * FROM Salle WHERE 1=1`;
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
    if (criteria.capacite_min) {
      query += ' AND capacite >= ?';
      params.push(criteria.capacite_min);
    }
    if (criteria.capacite_max) {
      query += ' AND capacite <= ?';
      params.push(criteria.capacite_max);
    }

    query += ' ORDER BY type, nom LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return (rows as RowDataPacket[]).map(salle => {
      if (salle.equipements && typeof salle.equipements === 'string') {
        try {
          salle.equipements = JSON.parse(salle.equipements);
        } catch {
          salle.equipements = {};
        }
      }
      return salle;
    });
  }

  // Trouver des salles disponibles
  static async findAvailable(
    jour: string,
    heure_debut: string,
    heure_fin: string,
    type?: TypeSalle,
    capacite_min?: number
  ) {
    let query = `
      SELECT s.*
      FROM Salle s
      WHERE s.code NOT IN (
        SELECT DISTINCT m.salle_code
        FROM Matiere m
        WHERE m.jour = ?
          AND m.salle_code IS NOT NULL
          AND (
            (m.heure_debut < ? AND m.heure_fin > ?) OR
            (m.heure_debut < ? AND m.heure_fin > ?) OR
            (m.heure_debut >= ? AND m.heure_fin <= ?)
          )
      )
    `;

    const params: any[] = [jour, heure_fin, heure_debut, heure_fin, heure_fin, heure_debut, heure_fin];

    if (type) {
      query += ' AND s.type = ?';
      params.push(type);
    }

    if (capacite_min) {
      query += ' AND s.capacite >= ?';
      params.push(capacite_min);
    }

    query += ' ORDER BY s.type, s.capacite, s.nom';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return (rows as RowDataPacket[]).map(salle => {
      if (salle.equipements && typeof salle.equipements === 'string') {
        try {
          salle.equipements = JSON.parse(salle.equipements);
        } catch {
          salle.equipements = {};
        }
      }
      return salle;
    });
  }
}

export default Salle;