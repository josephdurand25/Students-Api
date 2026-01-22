import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IUtilisateur {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role?: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR';
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
  photo_profil?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

class User {
  protected static readonly UTILISATEUR_TABLE = 'Utilisateur';

  // Créer un nouvel utilisateur
  static async create(userData: Partial<IUtilisateur>): Promise<IUtilisateur | null> {
    console.log('Couche modèle - création utilisateur', userData);

    const { nom, prenom, email, telephone, role, statut, photo_profil } = userData;

    if (!email) {
      console.error('Email requis');
      return null;
    }

    try {
      const query = `
        INSERT INTO ${this.UTILISATEUR_TABLE}
        (nom, prenom, email, telephone, role, statut, photo_profil)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        nom || null,
        prenom || null,
        email || null,
        telephone || null,
        role || 'ETUDIANT',
        statut || 'ACTIF',
        photo_profil || null
      ]);

      return (result as any).insertId ? this.findById((result as any).insertId) : null;
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id?: number): Promise<IUtilisateur | null> {
    if (!id) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.UTILISATEUR_TABLE} WHERE id = ?`,
      [id]
    );

    return (rows[0] as IUtilisateur) || null;
  }

  // Trouver un utilisateur par email
  static async findByEmail(email?: string): Promise<IUtilisateur | null> {
    if (!email) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.UTILISATEUR_TABLE} WHERE email = ?`,
      [email]
    );

    return (rows[0] as IUtilisateur) || null;
  }

  // Récupérer tous les utilisateurs avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.UTILISATEUR_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }

    if (filters.search) {
      query += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as IUtilisateur[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour un utilisateur
  static async update(id: number, userData: Partial<IUtilisateur>): Promise<IUtilisateur | null> {
    if (!id) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE ${this.UTILISATEUR_TABLE} SET ${fields.join(', ')} WHERE id = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findById(id);
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  static async delete(id?: number): Promise<boolean> {
    if (!id) return false;

    try {
      const query = `DELETE FROM ${this.UTILISATEUR_TABLE} WHERE id = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      throw error;
    }
  }
}

export default User;
