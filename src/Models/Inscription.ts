import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IInscription {
  numero_inscription?: string;
  etudiant_id?: number;
  annee_academique?: string;
  date_inscription?: Date | string;
  date_validation?: Date | string;
  dossier_inscription_url?: string;
  statut?: 'EN_ATTENTE' | 'VALIDE' | 'REJETEE' | 'ANNULEE';
  created_at?: Date | string;
}

class Inscription {
  protected static readonly INSCRIPTION_TABLE = 'Inscription';
  protected static readonly ETUDIANT_TABLE = 'Etudiant';
  protected static readonly UTILISATEUR_TABLE = 'Utilisateur';
  protected static readonly ANNEE_ACADEMIQUE_TABLE = 'AnneeAcademique';

  // Créer une nouvelle inscription
  static async create(inscriptionData: Partial<IInscription>): Promise<IInscription | null> {
    console.log('Couche modèle - création inscription', inscriptionData);

    const {
      numero_inscription,
      etudiant_id,
      annee_academique,
      date_inscription,
      statut,
      dossier_inscription_url
    } = inscriptionData;

    try {
      const query = `
        INSERT INTO ${this.INSCRIPTION_TABLE}
        (numero_inscription, etudiant_id, annee_academique, date_inscription, statut, dossier_inscription_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await pool.execute<ResultSetHeader>(query, [
        numero_inscription || null,
        etudiant_id || null,
        annee_academique || null,
        date_inscription || new Date().toISOString().split('T')[0],
        statut || 'EN_ATTENTE',
        dossier_inscription_url || null
      ]);

      return numero_inscription ? this.findByNumero(numero_inscription) : null;
    } catch (error) {
      console.error('Erreur création inscription:', error);
      throw error;
    }
  }

  // Trouver une inscription par numéro
  static async findByNumero(numero?: string): Promise<IInscription | null> {
    if (!numero) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.INSCRIPTION_TABLE} WHERE numero_inscription = ?`,
      [numero]
    );

    return (rows[0] as IInscription) || null;
  }

  // Trouver les inscriptions d'un étudiant
  static async findByEtudiant(etudiantId?: number, anneeAcademique?: string) {
    if (!etudiantId) return [];

    let query = `SELECT * FROM ${this.INSCRIPTION_TABLE} WHERE etudiant_id = ?`;
    const params: any[] = [etudiantId];

    if (anneeAcademique) {
      query += ' AND annee_academique = ?';
      params.push(anneeAcademique);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as IInscription[];
  }

  // Récupérer toutes les inscriptions avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.INSCRIPTION_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }

    if (filters.annee_academique) {
      query += ' AND annee_academique = ?';
      params.push(filters.annee_academique);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY date_inscription DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as IInscription[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour une inscription
  static async update(numero: string, inscriptionData: Partial<IInscription>): Promise<IInscription | null> {
    if (!numero) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(inscriptionData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'numero_inscription') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findByNumero(numero);

      values.push(numero);
      const query = `UPDATE ${this.INSCRIPTION_TABLE} SET ${fields.join(', ')} WHERE numero_inscription = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findByNumero(numero);
    } catch (error) {
      console.error('Erreur mise à jour inscription:', error);
      throw error;
    }
  }

  // Supprimer une inscription
  static async delete(numero?: string): Promise<boolean> {
    if (!numero) return false;

    try {
      const query = `DELETE FROM ${this.INSCRIPTION_TABLE} WHERE numero_inscription = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [numero]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression inscription:', error);
      throw error;
    }
  }
}

export default Inscription;
