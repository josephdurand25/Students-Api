import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IPresence {
  id?: number;
  etudiant_id?: number;
  seance_id?: number;
  statut_presence?: 'PRESENT' | 'ABSENT' | 'RETARD' | 'JUSTIFIE';
  justification?: string;
  date_enregistrement?: Date | string;
  note_enseignant?: string;
  created_at?: Date | string;
}

class Presence {
  protected static readonly PRESENCE_TABLE = 'Presence';
  protected static readonly ETUDIANT_TABLE = 'Etudiant';
  protected static readonly SEANCE_TABLE = 'Seance';

  // Créer une nouvelle présence
  static async create(presenceData: Partial<IPresence>): Promise<IPresence | null> {
    console.log('Couche modèle - création présence', presenceData);

    const {
      etudiant_id,
      seance_id,
      statut_presence,
      justification,
      note_enseignant
    } = presenceData;

    try {
      const query = `
        INSERT INTO ${this.PRESENCE_TABLE}
        (etudiant_id, seance_id, statut_presence, justification, note_enseignant)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        etudiant_id || null,
        seance_id || null,
        statut_presence || 'PRESENT',
        justification || null,
        note_enseignant || null
      ]);

      return (result as any).insertId ? this.findById((result as any).insertId) : null;
    } catch (error) {
      console.error('Erreur création présence:', error);
      throw error;
    }
  }

  // Trouver une présence par ID
  static async findById(id?: number): Promise<IPresence | null> {
    if (!id) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.PRESENCE_TABLE} WHERE id = ?`,
      [id]
    );

    return (rows[0] as IPresence) || null;
  }

  // Trouver les présences d'un étudiant pour une séance
  static async findByEtudiantAndSeance(etudiantId?: number, seanceId?: number) {
    if (!etudiantId || !seanceId) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.PRESENCE_TABLE} WHERE etudiant_id = ? AND seance_id = ?`,
      [etudiantId, seanceId]
    );

    return (rows[0] as IPresence) || null;
  }

  // Récupérer toutes les présences avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.PRESENCE_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.etudiant_id) {
      query += ' AND etudiant_id = ?';
      params.push(filters.etudiant_id);
    }

    if (filters.seance_id) {
      query += ' AND seance_id = ?';
      params.push(filters.seance_id);
    }

    if (filters.statut_presence) {
      query += ' AND statut_presence = ?';
      params.push(filters.statut_presence);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY date_enregistrement DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as IPresence[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour une présence
  static async update(id: number, presenceData: Partial<IPresence>): Promise<IPresence | null> {
    if (!id) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(presenceData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE ${this.PRESENCE_TABLE} SET ${fields.join(', ')} WHERE id = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findById(id);
    } catch (error) {
      console.error('Erreur mise à jour présence:', error);
      throw error;
    }
  }

  // Supprimer une présence
  static async delete(id?: number): Promise<boolean> {
    if (!id) return false;

    try {
      const query = `DELETE FROM ${this.PRESENCE_TABLE} WHERE id = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression présence:', error);
      throw error;
    }
  }
}

export default Presence;
