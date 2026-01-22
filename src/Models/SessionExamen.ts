import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ISessionExamen {
  id?: number;
  code?: string;
  nom?: string;
  type?: 'NORMAL' | 'RATTRAPAGE' | 'BLANC';
  annee_academique_code?: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  statut?: 'PROGRAMMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  created_at?: Date | string;
  updated_at?: Date | string;
}

class SessionExamen {
  protected static readonly SESSION_EXAMEN_TABLE = 'SessionExamen';
  protected static readonly ANNEE_ACADEMIQUE_TABLE = 'AnneeAcademique';

  // Créer une nouvelle session d'examen
  static async create(sessionData: Partial<ISessionExamen>): Promise<ISessionExamen | null> {
    console.log('Couche modèle - création session examen', sessionData);

    const {
      code,
      nom,
      type,
      annee_academique_code,
      date_debut,
      date_fin,
      statut
    } = sessionData;

    if (!code) {
      console.error('Code session requis');
      return null;
    }

    try {
      const query = `
        INSERT INTO ${this.SESSION_EXAMEN_TABLE}
        (code, nom, type, annee_academique_code, date_debut, date_fin, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.execute<ResultSetHeader>(query, [
        code || null,
        nom || null,
        type || 'NORMAL',
        annee_academique_code || null,
        date_debut || null,
        date_fin || null,
        statut || 'PROGRAMMEE'
      ]);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création session examen:', error);
      throw error;
    }
  }

  // Trouver une session par code
  static async findByCode(code?: string): Promise<ISessionExamen | null> {
    if (!code) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SESSION_EXAMEN_TABLE} WHERE code = ?`,
      [code]
    );

    return (rows[0] as ISessionExamen) || null;
  }

  // Trouver une session par ID
  static async findById(id?: number): Promise<ISessionExamen | null> {
    if (!id) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SESSION_EXAMEN_TABLE} WHERE id = ?`,
      [id]
    );

    return (rows[0] as ISessionExamen) || null;
  }

  // Trouver les sessions d'une année académique
  static async findByAnneeAcademique(anneeAcademiqueCode?: string) {
    if (!anneeAcademiqueCode) return [];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SESSION_EXAMEN_TABLE} WHERE annee_academique_code = ?`,
      [anneeAcademiqueCode]
    );

    return rows as ISessionExamen[];
  }

  // Récupérer toutes les sessions avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.SESSION_EXAMEN_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.annee_academique_code) {
      query += ' AND annee_academique_code = ?';
      params.push(filters.annee_academique_code);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY date_debut DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as ISessionExamen[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour une session
  static async update(id: number, sessionData: Partial<ISessionExamen>): Promise<ISessionExamen | null> {
    if (!id) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(sessionData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE ${this.SESSION_EXAMEN_TABLE} SET ${fields.join(', ')} WHERE id = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findById(id);
    } catch (error) {
      console.error('Erreur mise à jour session examen:', error);
      throw error;
    }
  }

  // Supprimer une session
  static async delete(id?: number): Promise<boolean> {
    if (!id) return false;

    try {
      const query = `DELETE FROM ${this.SESSION_EXAMEN_TABLE} WHERE id = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression session examen:', error);
      throw error;
    }
  }
}

export default SessionExamen;
