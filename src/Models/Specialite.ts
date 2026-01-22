import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ISpecialite {
  code?: string;
  nom?: string;
  description?: string;
  filiere_code?: string;
  niveau?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

class Specialite {
  protected static readonly SPECIALITE_TABLE = 'Specialite';
  protected static readonly FILIERE_TABLE = 'Filiere';

  // Créer une nouvelle spécialité
  static async create(specialiteData: Partial<ISpecialite>): Promise<ISpecialite | null> {
    console.log('Couche modèle - création spécialité', specialiteData);

    const { code, nom, description, filiere_code, niveau } = specialiteData;

    if (!code) return null;

    try {
      const query = `
        INSERT INTO ${this.SPECIALITE_TABLE}
        (code, nom, description, filiere_code, niveau)
        VALUES (?, ?, ?, ?, ?)
      `;

      await pool.execute<ResultSetHeader>(query, [
        code || null,
        nom || null,
        description || null,
        filiere_code || null,
        niveau || null
      ]);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création spécialité:', error);
      throw error;
    }
  }

  // Trouver une spécialité par code
  static async findByCode(code?: string): Promise<ISpecialite | null> {
    if (!code) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SPECIALITE_TABLE} WHERE code = ?`,
      [code]
    );

    return (rows[0] as ISpecialite) || null;
  }

  // Trouver les spécialités d'une filière
  static async findByFiliere(filiereCode?: string) {
    if (!filiereCode) return [];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SPECIALITE_TABLE} WHERE filiere_code = ?`,
      [filiereCode]
    );

    return rows as ISpecialite[];
  }

  // Récupérer toutes les spécialités avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.SPECIALITE_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.filiere_code) {
      query += ' AND filiere_code = ?';
      params.push(filters.filiere_code);
    }

    if (filters.niveau) {
      query += ' AND niveau = ?';
      params.push(filters.niveau);
    }

    if (filters.search) {
      query += ' AND (nom LIKE ? OR code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY code LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as ISpecialite[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour une spécialité
  static async update(code: string, specialiteData: Partial<ISpecialite>): Promise<ISpecialite | null> {
    if (!code) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(specialiteData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'code') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findByCode(code);

      values.push(code);
      const query = `UPDATE ${this.SPECIALITE_TABLE} SET ${fields.join(', ')} WHERE code = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur mise à jour spécialité:', error);
      throw error;
    }
  }

  // Supprimer une spécialité
  static async delete(code?: string): Promise<boolean> {
    if (!code) return false;

    try {
      const query = `DELETE FROM ${this.SPECIALITE_TABLE} WHERE code = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [code]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression spécialité:', error);
      throw error;
    }
  }
}

export default Specialite;
