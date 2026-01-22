import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IDossierCandidature {
  id?: number;
  etudiant_id?: number;
  filiere_code?: string;
  statut?: 'EN_ATTENTE' | 'EN_EVALUATION' | 'ACCEPTE' | 'REFUSE' | 'CLOTURER' | 'ANNULE';
  type_candidature?: string;
  frais_dossier?: number;
  frais_payes?: number;
  etape_actuelle?: string;
  date_limite_complet?: Date | string;
  informations_supplementaires?: string;
  specialite_demandee?: string;
  niveau_demande?: string;
  etapes?: string;
  date_derniere_modification?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

class DossierCandidature {
  protected static readonly DOSSIER_TABLE = 'DossierCandidature';
  protected static readonly ETUDIANT_TABLE = 'Etudiant';
  protected static readonly FILIERE_TABLE = 'Filiere';

  // Créer un nouveau dossier
  static async create(dossierData: Partial<IDossierCandidature>): Promise<IDossierCandidature | null> {
    console.log('Couche modèle - création dossier candidature', dossierData);

    const {
      etudiant_id,
      filiere_code,
      statut,
      type_candidature,
      frais_dossier,
      frais_payes,
      etape_actuelle,
      date_limite_complet,
      informations_supplementaires,
      specialite_demandee,
      niveau_demande,
      etapes
    } = dossierData;

    try {
      const query = `
        INSERT INTO ${this.DOSSIER_TABLE}
        (etudiant_id, filiere_code, statut, type_candidature, frais_dossier, frais_payes,
         etape_actuelle, date_limite_complet, informations_supplementaires, specialite_demandee,
         niveau_demande, etapes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<ResultSetHeader>(query, [
        etudiant_id || null,
        filiere_code || null,
        statut || 'EN_ATTENTE',
        type_candidature || null,
        frais_dossier || 0,
        frais_payes || 0,
        etape_actuelle || null,
        date_limite_complet || null,
        informations_supplementaires || null,
        specialite_demandee || null,
        niveau_demande || null,
        etapes || null
      ]);

      return (result as any).insertId ? this.findById((result as any).insertId) : null;
    } catch (error) {
      console.error('Erreur création dossier candidature:', error);
      throw error;
    }
  }

  // Trouver un dossier par ID
  static async findById(id?: number): Promise<IDossierCandidature | null> {
    if (!id) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.DOSSIER_TABLE} WHERE id = ?`,
      [id]
    );

    return (rows[0] as IDossierCandidature) || null;
  }

  // Trouver les dossiers d'un étudiant
  static async findByEtudiant(etudiantId?: number) {
    if (!etudiantId) return [];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.DOSSIER_TABLE} WHERE etudiant_id = ?`,
      [etudiantId]
    );

    return rows as IDossierCandidature[];
  }

  // Trouver les dossiers d'une filière
  static async findByFiliere(filiereCode?: string) {
    if (!filiereCode) return [];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.DOSSIER_TABLE} WHERE filiere_code = ?`,
      [filiereCode]
    );

    return rows as IDossierCandidature[];
  }

  // Récupérer tous les dossiers avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${this.DOSSIER_TABLE} WHERE 1=1`;
    const params: any[] = [];

    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }

    if (filters.filiere_code) {
      query += ' AND filiere_code = ?';
      params.push(filters.filiere_code);
    }

    if (filters.etudiant_id) {
      query += ' AND etudiant_id = ?';
      params.push(filters.etudiant_id);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`, params);

    return {
      data: rows as IDossierCandidature[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: (countRows[0] as any)?.total || 0,
        totalPages: Math.ceil(((countRows[0] as any)?.total || 0) / limit)
      }
    };
  }

  // Mettre à jour un dossier
  static async update(id: number, dossierData: Partial<IDossierCandidature>): Promise<IDossierCandidature | null> {
    if (!id) return null;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(dossierData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) return this.findById(id);

      values.push(id);
      const query = `UPDATE ${this.DOSSIER_TABLE} SET ${fields.join(', ')} WHERE id = ?`;

      await pool.execute<ResultSetHeader>(query, values);
      return this.findById(id);
    } catch (error) {
      console.error('Erreur mise à jour dossier candidature:', error);
      throw error;
    }
  }

  // Supprimer un dossier
  static async delete(id?: number): Promise<boolean> {
    if (!id) return false;

    try {
      const query = `DELETE FROM ${this.DOSSIER_TABLE} WHERE id = ?`;
      const [result] = await pool.execute<ResultSetHeader>(query, [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Erreur suppression dossier candidature:', error);
      throw error;
    }
  }
}

export default DossierCandidature;
