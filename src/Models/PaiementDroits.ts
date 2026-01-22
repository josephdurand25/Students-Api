import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IPaiementDroits {
  id?: number;
  inscription_numero?: string;
  montant_total?: number;
  montant_paye?: number;
  statut_paiement?: 'IMPAYE' | 'PARTIEL' | 'COMPLET' | 'EXONERE';
  date_dernier_paiement?: Date | string;
  mode_paiement?: 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE' | 'EN_LIGNE';
  reference?: string;
  created_at?: Date | string;
}

class PaiementDroits {
  protected static readonly PAIEMENT_TABLE = 'PaiementDroits';
  protected static readonly INSCRIPTION_TABLE = 'Inscription';

  // Créer un nouveau paiement
  static async create(paiementData: Partial<IPaiementDroits>): Promise<IPaiementDroits | null> {
    console.log('Couche modèle - création paiement', paiementData);

    const {
      inscription_numero,
      montant_total,
      montant_paye,
      mode_paiement,
      reference,
      statut_paiement
    } = paiementData;

    try {
      const query = `
        INSERT INTO ${this.PAIEMENT_TABLE}
        (inscription_numero, montant_total, montant_paye, statut_paiement, mode_paiement, reference)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        inscription_numero || null,
        montant_total || 0,
        montant_paye || 0,
        statut_paiement || 'IMPAYE',
        mode_paiement || null,
        reference || null
      ]);

      return (result as any).insertId ? this.findById((result as any).insertId) : null;
    } catch (error) {
      console.error('Erreur création paiement:', error);
      throw error;
    }
  }

  // Trouver un paiement par ID
  static async findById(id?: number): Promise<IPaiementDroits | null> {
    if (!id) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.PAIEMENT_TABLE} WHERE id = ?`,
      [id]
    );

    return (rows[0] as IPaiementDroits) || null;
  }

  // Trouver les paiements d'une inscription
  static async findByInscription(inscriptionNumero?: string) {
    if (!inscriptionNumero) return [];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.PAIEMENT_TABLE} WHERE inscription_numero = ?`,
      [inscriptionNumero]
    );

    return rows as IPaiementDroits[];
  }

  // Récupérer tous les paiements avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.PAIEMENT_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.statut_paiement) {
      query += ' AND statut_paiement = ?';
      params.push(filters.statut_paiement);
    }

    if (filters.inscription_numero) {
      query += ' AND inscription_numero = ?';
      params.push(filters.inscription_numero);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY date_dernier_paiement DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as IPaiementDroits[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour un paiement
  static async update(id: number, paiementData: Partial<IPaiementDroits>): Promise<IPaiementDroits | null> {
    if (!id) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(paiementData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE ${this.PAIEMENT_TABLE} SET ${fields.join(', ')} WHERE id = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findById(id);
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
      throw error;
    }
  }

  // Supprimer un paiement
  static async delete(id?: number): Promise<boolean> {
    if (!id) return false;

    try {
      const query = `DELETE FROM ${this.PAIEMENT_TABLE} WHERE id = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
      throw error;
    }
  }
}

export default PaiementDroits;
