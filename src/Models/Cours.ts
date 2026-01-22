import { CapacityCheckResult, ICours, ICoursCreate, ICoursUpdate, ICoursWithNiveaux } from "../types/ICours";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

console.log('DEBUG Cours - pool keys:', pool && Object.keys(pool));

class Cours {
  // Créer un nouveau cours
  static async create(coursData: Partial<ICoursCreate>): Promise<ICours | null> {
    console.log('Couche modèle - données d\'entrée', coursData);
    
    if (!coursData || !coursData.code) {
      console.error('Code cours requis');
      return null;
    }
    
    const {
      code, nom, description_cours, professeur, filiere, credits, semestre,
      capacite_max, jour, heure_debut, heure_fin, salle, prerequis,
      statut, niveaux
    } = coursData;

    // IMPORTANT: Convertir undefined en null pour MySQL
    const params = [
      code || null,
      nom || null,
      description_cours || null,
      professeur || null,
      filiere || null,
      credits || null,
      semestre || null,
      capacite_max || 30,
      jour || null,
      heure_debut || null,
      heure_fin || null,
      salle || null,
      prerequis || null,
      statut || 'actif'
    ];

    const query = `INSERT INTO cours 
      (code, nom, description_cours, professeur, filiere, credits, semestre,
       capacite_max, jour, heure_debut, heure_fin, salle,
       prerequis, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      const coursId = result.insertId;

      // Insérer les niveaux autorisés
      if (niveaux && niveaux.length > 0) {
        await this.insertNiveaux(coursId, niveaux);
      }

      return this.findById(coursId) as Promise<ICours | null>;
    } catch (error) {
      console.error('Erreur création cours:', error);
      throw error;
    }
  }

  // Insérer les niveaux autorisés pour un cours
  static async insertNiveaux(coursId: number, niveaux: string[]): Promise<void> {
    if (!niveaux || niveaux.length === 0) return;

    const values = niveaux.map(niveau => [coursId, niveau]);
    const query = `INSERT INTO cours_niveaux (cours_id, niveau) VALUES ?`;

    try {
      // MySQL2 nécessite un format spécial pour les bulk inserts
      const placeholders = values.map(() => '(?, ?)').join(', ');
      const flatValues = values.flat();
      
      await pool.execute(
        `INSERT INTO cours_niveaux (cours_id, niveau) VALUES ${placeholders}`,
        flatValues
      );
    } catch (error) {
      console.error('Erreur insertion niveaux:', error);
      throw error;
    }
  }

  // Supprimer les niveaux d'un cours
  static async deleteNiveaux(coursId: number): Promise<void> {
    await pool.execute('DELETE FROM cours_niveaux WHERE cours_id = ?', [coursId]);
  }

  // Récupérer les niveaux d'un cours
  static async getNiveaux(coursId: number): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT niveau FROM cours_niveaux WHERE cours_id = ?',
      [coursId]
    );
    return (rows as RowDataPacket[]).map(row => row.niveau);
  }

  // Trouver un cours par ID
  static async findById(id: number): Promise<ICours | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM cours WHERE id = ?`,
      [id]
    );

    if ((rows as RowDataPacket[]).length === 0) return null;

    const cours = (rows as RowDataPacket[])[0];
    
    // Récupérer les niveaux autorisés
    const niveaux = await this.getNiveaux(id);
    
    return {
      ...cours as Partial<ICours>,
      niveaux
    } as ICours;
  }

  // Trouver par code
  static async findByCode(code: string): Promise<ICours | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM cours WHERE code = ?',
        [code]
    );

    const rowArray = rows as RowDataPacket[];
    if (rowArray.length === 0) return null;

    const coursRow = rowArray[0];
    if (!coursRow) return null; // Vérification explicite

    const niveaux = await this.getNiveaux(coursRow.id);

    return this.mapRowToCours(coursRow, niveaux);
    }

  // Récupérer tous les cours avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM cours WHERE 1=1';
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.filiere) {
      query += ' AND filiere = ?';
      params.push(filters.filiere);
    }
    if (filters.semestre) {
      query += ' AND semestre = ?';
      params.push(filters.semestre);
    }
    if (filters.professeur) {
      query += ' AND professeur LIKE ?';
      params.push(`%${filters.professeur}%`);
    }
    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }
    if (filters.niveau) {
      query += ` AND id IN (
        SELECT cours_id FROM cours_niveaux WHERE niveau = ?
      )`;
      params.push(filters.niveau);
    }
    if (filters.search) {
      query += ' AND (nom LIKE ? OR code LIKE ? OR professeur LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY code LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Ajouter les niveaux pour chaque cours
    const coursesWithNiveaux = await Promise.all(
      (rows as RowDataPacket[]).map(async (cours) => {
        const niveaux = await this.getNiveaux(cours.id);
        return { ...cours, niveaux };
      })
    );

    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: coursesWithNiveaux,
      pagination: {
        page: isNaN(page) ? parseInt(page.toString()) : page ?? 1,
        limit: isNaN(limit) ? parseInt(limit.toString()) : limit ?? 10,
        total: (countRows as RowDataPacket[])[0]?.total ?? 0,
        totalPages: Math.ceil(((countRows as RowDataPacket[])[0]?.total ?? 0) / limit)
      }
    };
  }

  // Mettre à jour un cours
  static async update(id: number, coursData: Partial<ICoursUpdate>) {
    const { niveaux, ...courseFields } = coursData;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(courseFields).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0 && !niveaux) return this.findById(id);

    // Mettre à jour les champs du cours
    if (fields.length > 0) {
      values.push(id);
      const query = `UPDATE cours SET ${fields.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);
    }

    // Mettre à jour les niveaux si fournis
    if (niveaux && Array.isArray(niveaux)) {
      await this.deleteNiveaux(id);
      if (niveaux.length > 0) {
        await this.insertNiveaux(id, niveaux);
      }
    }

    return this.findById(id);
  }

  // Supprimer un cours
  static async delete(id: number): Promise<boolean> {
    try {
      // Les niveaux seront supprimés automatiquement grâce à ON DELETE CASCADE
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM cours WHERE id = ?',
        [id]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression cours:', error);
      throw error;
    }
  }

  // Obtenir les cours avec statistiques d'inscriptions
  static async getCoursesWithStats() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        c.*,
        COUNT(i.id) as nombre_inscrits,
        (c.capacite_max - COUNT(i.id)) as places_disponibles,
        ROUND((COUNT(i.id) / c.capacite_max) * 100, 2) as taux_remplissage
      FROM cours c
      LEFT JOIN inscriptions i ON c.id = i.cours_id AND i.statut = 'inscrit'
      GROUP BY c.id
      ORDER BY c.code`
    );

    // Ajouter les niveaux pour chaque cours
    const coursesWithNiveaux = await Promise.all(
      (rows as RowDataPacket[]).map(async (cours) => {
        const niveaux = await this.getNiveaux(cours.id);
        return { ...cours, niveaux };
      })
    );

    return coursesWithNiveaux;
  }

  // Obtenir les étudiants inscrits à un cours
  static async getEtudiantsInscrits(coursId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.*,
        i.date_inscription,
        i.statut as statut_inscription,
        i.semestre,
        i.annee_academique
      FROM etudiants e
      INNER JOIN inscriptions i ON e.id = i.etudiant_id
      WHERE i.cours_id = ?
      ORDER BY e.nom, e.prenom`,
      [coursId]
    );
    return rows as RowDataPacket[];
  }

  // Vérifier la capacité du cours
  static async checkCapacity(coursId: number): Promise<{ available: boolean; message?: string }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        capacite_max,
        COUNT(i.id) as nombre_inscrits
      FROM cours c
      LEFT JOIN inscriptions i ON c.id = i.cours_id AND i.statut = 'inscrit'
      WHERE c.id = ?
      GROUP BY c.id, c.capacite_max`,
      [coursId]
    );

    const typedRows = rows as RowDataPacket[];
    if (typedRows.length === 0) {
      return { available: false, message: 'Cours non trouvé' };
    }

    // Définir le type du résultat
    const result = typedRows[0] as RowDataPacket & {
      capacite_max: number;
      nombre_inscrits: number;
    };

    const capacite_max = result.capacite_max;
    const nombre_inscrits = result.nombre_inscrits;

    if (nombre_inscrits >= capacite_max) {
      return {
        available: false,
        message: `Le cours est complet (${nombre_inscrits}/${capacite_max})`
      };
    }

    return { available: true };
  }

  // Vérifier les conflits d'horaires pour un étudiant
  static async checkConflicts(etudiantId: number, coursId: number): Promise<{ hasConflict: boolean; message?: string; conflictingCourses?: any[] }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c2.code, c2.nom, c2.jour, c2.heure_debut, c2.heure_fin
      FROM inscriptions i
      INNER JOIN cours c2 ON i.cours_id = c2.id
      INNER JOIN cours c1 ON c1.id = ?
      WHERE i.etudiant_id = ?
        AND i.statut = 'inscrit'
        AND c1.jour IS NOT NULL
        AND c2.jour IS NOT NULL
        AND c1.jour = c2.jour
        AND (
          (c1.heure_debut < c2.heure_fin AND c1.heure_fin > c2.heure_debut)
        )`,
      [coursId, etudiantId]
    );

    if ((rows as RowDataPacket[]).length > 0) {
      const conflictingCourses = rows as RowDataPacket[];
      return {
        hasConflict: true,
        message: `Conflit d'horaires avec ${conflictingCourses.length} cours`,
        conflictingCourses
      };
    }

    return { hasConflict: false };
  }

  // Obtenir les statistiques des cours
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        filiere,
        semestre,
        COUNT(*) as total_cours,
        AVG(credits) as credits_moyen,
        SUM(capacite_max) as capacite_totale,
        COUNT(DISTINCT professeur) as nb_professeurs
      FROM cours
      WHERE statut = 'actif'
      GROUP BY filiere, semestre
      ORDER BY filiere, semestre`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM cours WHERE statut = \'actif\''
    );

    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
        COUNT(CASE WHEN statut = 'brouillon' THEN 1 END) as brouillons,
        COUNT(CASE WHEN statut = 'archive' THEN 1 END) as archives
      FROM cours`
    );

    return {
      total: (totalRow as RowDataPacket[])[0]?.total ?? 0,
      actifs: (statsRow as RowDataPacket[])[0]?.actifs ?? 0,
      brouillons: (statsRow as RowDataPacket[])[0]?.brouillons ?? 0,
      archives: (statsRow as RowDataPacket[])[0]?.archives ?? 0,
      parFiliere: rows as RowDataPacket[]
    };
  }

  // Recherche avancée de cours
  static async search(criteria: Partial<ICours> & { niveau?: string }) {
    let query = `SELECT * FROM cours WHERE 1=1`;
    const params: any[] = [];

    if (criteria.code) {
      query += ' AND code LIKE ?';
      params.push(`%${criteria.code}%`);
    }
    if (criteria.nom) {
      query += ' AND nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.filiere) {
      query += ' AND filiere = ?';
      params.push(criteria.filiere);
    }
    if (criteria.semestre) {
      query += ' AND semestre = ?';
      params.push(criteria.semestre);
    }
    if (criteria.professeur) {
      query += ' AND professeur LIKE ?';
      params.push(`%${criteria.professeur}%`);
    }
    if (criteria.statut) {
      query += ' AND statut = ?';
      params.push(criteria.statut);
    }
    if (criteria.niveau) {
      query += ` AND id IN (
        SELECT cours_id FROM cours_niveaux WHERE niveau = ?
      )`;
      params.push(criteria.niveau);
    }

    query += ' ORDER BY code LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // Ajouter les niveaux pour chaque cours
    const coursesWithNiveaux = await Promise.all(
      (rows as RowDataPacket[]).map(async (cours) => {
        const niveaux = await this.getNiveaux(cours.id);
        return { ...cours, niveaux };
      })
    );

    return coursesWithNiveaux;
  }

  // Mettre à jour la capacité actuelle
  static async updateCapaciteActuelle(coursId: number): Promise<void> {
    await pool.execute(
      `UPDATE cours c
      SET capacite_actuelle = (
        SELECT COUNT(*)
        FROM inscriptions i
        WHERE i.cours_id = c.id AND i.statut = 'inscrit'
      )
      WHERE c.id = ?`,
      [coursId]
    );
  }

  // Fonction utilitaire pour mapper RowDataPacket vers ICours
private static mapRowToCours(row: RowDataPacket, niveaux?: string[]): ICoursWithNiveaux {
  return {
    id: row.id,
    code: row.code,
    nom: row.nom,
    description_cours: row.description_cours,
    professeur: row.professeur,
    filiere: row.filiere,
    credits: row.credits,
    semestre: row.semestre as 'S1' | 'S2' | 'Annuel',
    capacite_max: row.capacite_max,
    jour: row.jour as 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi',
    heure_debut: row.heure_debut,
    heure_fin: row.heure_fin,
    salle: row.salle,
    prerequis: row.prerequis,
    date_debut: row.date_debut,
    date_fin: row.date_fin,
    statut: row.statut as 'Actif' | 'Inactif' | 'Terminé',
    coefficient_examen: row.coefficient_examen,
    coefficient_cc: row.coefficient_cc,
    created_at: row.created_at,
    updated_at: row.updated_at,
    niveaux: niveaux as ('L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'Doctorat')[]
  };
}


}

export default Cours;