
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { IMatiere, IMatiereCreate, IMatiereUpdate } from '../types/IMatiere';

console.log('DEBUG Matiere - pool keys:', pool && Object.keys(pool));

class Matiere {
  // Tables protégées pour une meilleure maintenabilité
  protected static readonly MATIERE_TABLE = 'Matiere';
  protected static readonly SALLE_TABLE = 'Salle';
  protected static readonly ENSEIGNANT_TABLE = 'Enseignant';
  protected static readonly UTILISATEUR_TABLE = 'Utilisateur';
  protected static readonly UNITE_ENSEIGNEMENT_TABLE = 'UniteEnseignement';
  protected static readonly GROUPE_UE_TABLE = 'GroupeUE';
  protected static readonly SPECIALITE_TABLE = 'Specialite';
  protected static readonly FILIERE_TABLE = 'Filiere';
  protected static readonly INSCRIPTION_TABLE = 'Inscription';
  protected static readonly INSCRIPTION_GROUPE_TABLE = 'Inscription_GroupeUE';
  protected static readonly NOTE_TABLE = 'Note';
  protected static readonly SEANCE_TABLE = 'Seance';
  protected static readonly MATIERE_SESSIONEXAMEN_TABLE = 'Matiere_SessionExamen';
  protected static readonly SESSIONEXAMEN_TABLE = 'SessionExamen';
  
  // Constantes pour les types de cours
  protected static readonly TYPE_COURS = {
    CM: 'CM',
    TD: 'TD', 
    TP: 'TP',
    PROJET: 'PROJET',
    STAGE: 'STAGE'
  } as const;
  
  // Constantes pour les jours
  protected static readonly JOURS = {
    LUNDI: 'LUNDI',
    MARDI: 'MARDI',
    MERCREDI: 'MERCREDI',
    JEUDI: 'JEUDI',
    VENDREDI: 'VENDREDI',
    SAMEDI: 'SAMEDI',
    DIMANCHE: 'DIMANCHE'
  } as const;

  // Constantes pour les statuts
  protected static readonly STATUT_GROUPE = {
    OUVERT: 'OUVERT',
    ACTIF: 'ACTIF',
    COMPLET: 'COMPLET',
    INACTIF: 'INACTIF'
  } as const;

  // Créer une nouvelle matière
  static async create(matiereData: Partial<IMatiereCreate>): Promise<IMatiere | null> {
    console.log('Couche modèle - données d\'entrée matière', matiereData);
    
    if (!matiereData || !matiereData.code) {
      console.error('Code matière requis');
      return null;
    }
    
    const {
      code, nom, type_cours, credits, coefficient, volume_horaire,
      salle, jour, heure_debut, heure_fin, ue_code,
      enseignant_id
    } = matiereData;

    const params = [
      code || null,
      nom || null,
      type_cours || null,
      credits || null,
      coefficient || null,
      volume_horaire || null,
      salle || null,
      jour || null,
      heure_debut || null,
      heure_fin || null,
      ue_code || null,
      enseignant_id || null
    ];

    const query = `INSERT INTO ${this.MATIERE_TABLE} 
      (code, nom, type_cours, credits, coefficient, volume_horaire,
       salle, jour, heure_debut, heure_fin, ue_code, enseignant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log('Paramètres SQL:', params);

    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      console.log('Result insert SQL', result);

      return this.findByCode(code);
    } catch (error) {
      console.error('Erreur création matière:', error);
      throw error;
    }
  }

  // Trouver une matière par code
  static async findByCode(code?: string): Promise<IMatiere | null> {
    if (!code) return null;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.MATIERE_TABLE} WHERE code = ?`,
      [code]
    );
    const row = rows[0];
    return row ? this.mapToIMatiere(row) : null;
  }

  // Méthode helper pour mapper les données
  private static mapToIMatiere(row: RowDataPacket): IMatiere {
    return {
      code: row.code,
      nom: row.nom,
      type_cours: row.type_cours,
      credits: row.credits,
      coefficient: row.coefficient,
      volume_horaire: row.volume_horaire,
      salle: row.salle,
      jour: row.jour,
      heure_debut: row.heure_debut,
      heure_fin: row.heure_fin,
      ue_code: row.ue_code,
      enseignant_id: row.enseignant_id
    } as IMatiere;
  }

  // Trouver avec détails (jointures)
  static async findByCodeWithDetails(code: string): Promise<any | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        s.nom as salle_nom,
        s.capacite as salle_capacite,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom,
        ue.credits as ue_credits,
        g.nom as groupe_nom,
        g.specialite_code,
        sp.nom as specialite_nom,
        f.nom as filiere_nom
      FROM ${this.MATIERE_TABLE} m
      LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      LEFT JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      LEFT JOIN ${this.GROUPE_UE_TABLE} g ON (
        SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
        INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue2 ON ue2.code = m.ue_code
        LIMIT 1
      )
      LEFT JOIN ${this.SPECIALITE_TABLE} sp ON g.specialite_code = sp.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON sp.filiere_code = f.code
      WHERE m.code = ?`,
      [code]
    );

    return rows[0] || null;
  }

  // Récupérer toutes les matières avec pagination
  static async findAll(
    page = 1, 
    limit = 10, 
    filters: {
      ue_code?: string;
      type_cours?: string;
      enseignant_id?: number;
      jour?: string;
      specialite_code?: string;
      filiere_code?: string;
      search?: string;
    } = {}
  ) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        m.*,
        s.nom as salle_nom,
        CONCAT(u.nom, ' ', u.prenom) as enseignant_nom, e.matricule as enseignant_matricule,
        ue.nom as ue_nom
      FROM ${this.MATIERE_TABLE} m
      LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      LEFT JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // Appliquer les filtres
    if (filters.ue_code) {
      query += ' AND m.ue_code = ?';
      params.push(filters.ue_code);
    }
    if (filters.type_cours) {
      query += ' AND m.type_cours = ?';
      params.push(filters.type_cours);
    }
    if (filters.enseignant_id) {
      query += ' AND m.enseignant_id = ?';
      params.push(filters.enseignant_id);
    }
    if (filters.jour) {
      query += ' AND m.jour = ?';
      params.push(filters.jour);
    }
    if (filters.specialite_code) {
      query += ' AND ue.code IN (SELECT ue2.code FROM UniteEnseignement ue2)';
      // Note: Vous aurez besoin d'une relation UE ↔ GroupeUE ↔ Specialite
    }
    if (filters.filiere_code) {
      query += ' AND ue.code IN (SELECT ue2.code FROM UniteEnseignement ue2)';
      // Note: Relation indirecte via Specialite
    }
    if (filters.search) {
      query += ' AND (m.nom LIKE ? OR m.code LIKE ? OR ue.nom LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const baseQuery = query;
    const finalQuery = `${baseQuery} ORDER BY m.code LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    
    const finalParams = [...params, limit, offset];

    // Exécuter la requête principale
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, finalParams);
    console.log('Model fetch matiere', rows);
    
    // Compter le total
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countRows[0]?.total) || 0,
        totalPages: Math.ceil((Number(countRows[0]?.total) || 0) / limit)
      }
    };
  }

  // Mettre à jour une matière
  static async update(code: string, matiereData: Partial<IMatiereUpdate>): Promise<IMatiere | null> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(matiereData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'code') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findByCode(code);

    values.push(code);
    const query = `UPDATE ${this.MATIERE_TABLE} SET ${fields.join(', ')} WHERE code = ?`;
    
    await pool.execute(query, values);
    return this.findByCode(code);
  }

  // Supprimer une matière
  static async delete(code: string): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${this.MATIERE_TABLE} WHERE code = ?`,
        [code]
      );
      return (result.affectedRows ?? 0) > 0;
    } catch (error) {
      console.error('Erreur suppression matière:', error);
      throw error;
    }
  }

  // Obtenir les matières d'une UE
  static async findByUE(ueCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom
      FROM ${this.MATIERE_TABLE} m
      LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      WHERE m.ue_code = ?
      ORDER BY m.type_cours, m.code`,
      [ueCode]
    );
    return rows;
  }

  // Obtenir les matières d'un enseignant
  static async findByEnseignant(enseignantId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        ue.nom as ue_nom,
        ue.credits as ue_credits,
        g.nom as groupe_nom,
        g.specialite_code,
        g.niveau
      FROM ${this.MATIERE_TABLE} m
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      LEFT JOIN ${this.GROUPE_UE_TABLE} g ON (
        SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
        LIMIT 1
      )
      WHERE m.enseignant_id = ?
      ORDER BY ue.code, m.code`,
      [enseignantId]
    );
    return rows;
  }

  // Vérifier les conflits d'horaires pour un étudiant
  static async checkConflicts(etudiantId: number, matiereCode: string): Promise<{
    hasConflict: boolean;
    message?: string;
    conflictingMatieres?: any[];}> {
    // Récupérer les horaires de la matière
    const matiere = await this.findByCode(matiereCode);
    if (!matiere?.jour || !matiere?.heure_debut || !matiere?.heure_fin) {
      return { hasConflict: false };
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m2.code, m2.nom, m2.jour, m2.heure_debut, m2.heure_fin
      FROM ${this.INSCRIPTION_GROUPE_TABLE} ig
      INNER JOIN ${this.GROUPE_UE_TABLE} g ON ig.groupeue_code = g.code
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON (
        SELECT ue2.code FROM ${this.UNITE_ENSEIGNEMENT_TABLE} ue2
        LIMIT 1
      )
      INNER JOIN ${this.MATIERE_TABLE} m2 ON ue.code = m2.ue_code
      INNER JOIN ${this.MATIERE_TABLE} m1 ON m1.code = ?
      WHERE ig.inscription_numero IN (
        SELECT numero_inscription FROM ${this.INSCRIPTION_TABLE} 
        WHERE etudiant_id = ?
      )
        AND ig.statut = 'VALIDEE'
        AND m1.jour IS NOT NULL
        AND m2.jour IS NOT NULL
        AND m1.jour = m2.jour
        AND m2.code != m1.code
        AND (
          (m1.heure_debut < m2.heure_fin AND m1.heure_fin > m2.heure_debut)
        )`,
      [matiereCode, etudiantId]
    );

    if (rows.length > 0) {
      return {
        hasConflict: true,
        message: `Conflit d'horaires avec ${rows.length} matière(s)`,
        conflictingMatieres: rows
      };
    }

    return { hasConflict: false };
  }

  // Obtenir l'emploi du temps d'un étudiant
  static async getEmploiDuTemps(etudiantId: number, groupeCode?: string): Promise<any[]> {
    let query = `
      SELECT 
        m.code, m.nom, m.type_cours, m.jour, m.heure_debut, m.heure_fin,
        m.salle,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom,
        g.nom as groupe_nom
      FROM ${this.INSCRIPTION_TABLE} i
      INNER JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON i.numero_inscription = ig.inscription_numero
      INNER JOIN ${this.GROUPE_UE_TABLE} g ON ig.groupeue_code = g.code
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON (
        SELECT ue2.code FROM ${this.UNITE_ENSEIGNEMENT_TABLE} ue2
        LIMIT 1
      )
      INNER JOIN ${this.MATIERE_TABLE} m ON ue.code = m.ue_code
      LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      WHERE i.etudiant_id = ?
        AND ig.statut = 'VALIDEE'
        AND m.jour IS NOT NULL
    `;

    const params: any[] = [etudiantId];

    if (groupeCode) {
      query += ' AND g.code = ?';
      params.push(groupeCode);
    }

    query += ` ORDER BY FIELD(m.jour, 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'), m.heure_debut`;

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }

  // Obtenir les statistiques des matières
  static async getStatistiques(): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        type_cours,
        COUNT(*) as total,
        SUM(volume_horaire) as volume_horaire_total,
        AVG(credits) as credits_moyen
      FROM ${this.MATIERE_TABLE}
      GROUP BY type_cours
      ORDER BY type_cours`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ${this.MATIERE_TABLE}`
    );

    return {
      total_matieres: totalRow[0]?.total ?? 0,
      par_type: rows
    };
  }

  // Recherche avancée
  static async search(criteria: Partial<IMatiere>): Promise<any[]> {
    let query = `
      SELECT 
        m.*,
        s.nom as salle_nom,
        u.nom as enseignant_nom,
        u.prenom as enseignant_prenom,
        ue.nom as ue_nom
      FROM ${this.MATIERE_TABLE} m
      LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      LEFT JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (criteria.code) {
      query += ' AND m.code LIKE ?';
      params.push(`%${criteria.code}%`);
    }
    if (criteria.nom) {
      query += ' AND m.nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.type_cours) {
      query += ' AND m.type_cours = ?';
      params.push(criteria.type_cours);
    }
    if (criteria.ue_code) {
      query += ' AND m.ue_code = ?';
      params.push(criteria.ue_code);
    }
    if (criteria.enseignant_id) {
      query += ' AND m.enseignant_id = ?';
      params.push(criteria.enseignant_id);
    }
    if (criteria.jour) {
      query += ' AND m.jour = ?';
      params.push(criteria.jour);
    }

    query += ' ORDER BY m.code LIMIT 100';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }

  // Obtenir les étudiants d'une matière
  static async getEtudiants(matiereCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        u.id, u.nom, u.prenom, u.email,
        e.numero_etudiant, e.specialite_code, e.niveau,
        sp.nom as specialite_nom,
        f.nom as filiere_nom
      FROM ${this.MATIERE_TABLE} m
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      INNER JOIN ${this.GROUPE_UE_TABLE} g ON (
        SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
        LIMIT 1
      )
      INNER JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON g.code = ig.groupeue_code
      INNER JOIN ${this.INSCRIPTION_TABLE} i ON ig.inscription_numero = i.numero_inscription
      INNER JOIN ${this.UTILISATEUR_TABLE} u ON i.etudiant_id = u.id
      INNER JOIN Etudiant e ON u.id = e.id
      LEFT JOIN ${this.SPECIALITE_TABLE} sp ON e.specialite_code = sp.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON sp.filiere_code = f.code
      WHERE m.code = ? AND ig.statut = 'VALIDEE'
      ORDER BY u.nom, u.prenom`,
      [matiereCode]
    );
    return rows;
  }

  // Version alternative plus simple pour matières disponibles
  static async findDisponiblesPourInscriptionSimple(
    etudiantId: number, 
    groupeCode?: string
  ): Promise<IMatiere[]> {
    try {
      let query = `
        SELECT DISTINCT
          m.code, m.nom, m.type_cours, m.credits, m.coefficient,
          m.volume_horaire, m.salle, m.jour, m.heure_debut, 
          m.heure_fin, m.ue_code, m.enseignant_id,
          ue.nom AS nom_ue,
          g.code AS groupe_code,
          g.nom AS nom_groupe,
          s.nom AS salle_nom,
          s.capacite AS salle_capacite,
          CONCAT(u.nom, ' ', u.prenom) AS enseignant_nom_complet
        FROM ${this.MATIERE_TABLE} m
        INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
        LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
        LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON m.enseignant_id = e.id
        LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
        -- Vérifier que l'étudiant est inscrit au groupe de cours
        INNER JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON ig.groupeue_code = g.code
        INNER JOIN ${this.INSCRIPTION_TABLE} i ON ig.inscription_numero = i.numero_inscription
        WHERE i.etudiant_id = ?
          AND ig.statut = 'VALIDEE'
          AND g.statut = 'ACTIF'
          -- Vérifier que l'étudiant n'est pas déjà inscrit
          AND NOT EXISTS(
            SELECT 1 FROM ${this.NOTE_TABLE} n2
            WHERE n2.etudiant_id = ?
              AND n2.matiere_code = m.code
          )
      `;

      const params: any[] = [etudiantId, etudiantId];

      if (groupeCode) {
        query += ` AND g.code = ?`;
        params.push(groupeCode);
      }

      query += ` ORDER BY ue.code, m.nom`;

      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map(row => ({
        code: row.code,
        nom: row.nom,
        type_cours: row.type_cours,
        credits: row.credits,
        coefficient: row.coefficient,
        volume_horaire: row.volume_horaire,
        salle: row.salle,
        jour: row.jour,
        heure_debut: row.heure_debut,
        heure_fin: row.heure_fin,
        ue_code: row.ue_code,
        enseignant_id: row.enseignant_id,
        salle_nom: row.salle_nom,
        salle_capacite: row.salle_capacite,
        enseignant_nom: row.enseignant_nom_complet,
        ue_nom: row.nom_ue,
        groupe_code: row.groupe_code,
        nom_groupe: row.nom_groupe
      })) as IMatiere[];

    } catch (error) {
      console.error('Erreur dans findDisponiblesPourInscriptionSimple:', error);
      throw error;
    }
  }

  // Vérifier si une matière est disponible pour inscription
  static async checkDisponibilitePourInscription(
    etudiantId: number, 
    matiereCode: string
  ): Promise<{
    disponible: boolean;
    raisons?: string[];
    details?: any;
  }> {
    try {
      const query = `
        SELECT 
          m.code,
          m.nom,
          g.statut AS statut_groupe,
          ig.statut AS statut_inscription,
          -- Vérifier si déjà inscrit
          EXISTS(
            SELECT 1 FROM ${this.NOTE_TABLE} n
            WHERE n.etudiant_id = ? 
              AND n.matiere_code = m.code
          ) AS deja_inscrit,
          -- Vérifier capacité salle
          s.capacite AS salle_capacite
        FROM ${this.MATIERE_TABLE} m
        LEFT JOIN ${this.SALLE_TABLE} s ON m.salle = s.code
        LEFT JOIN ${this.GROUPE_UE_TABLE} g ON (
          SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
          LIMIT 1
        )
        LEFT JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON ig.groupeue_code = g.code 
          AND ig.inscription_numero IN (
            SELECT numero_inscription FROM ${this.INSCRIPTION_TABLE} 
            WHERE etudiant_id = ?
          )
        WHERE m.code = ?
        LIMIT 1
      `;

      const [rows] = await pool.execute<RowDataPacket[]>(query, [etudiantId, etudiantId, matiereCode]);
      
      if (!rows || rows.length === 0) {
        return {
          disponible: false,
          raisons: ['Matière non trouvée']
        };
      }

      const row = rows[0];
      const raisons: string[] = [];

      // Vérifications
      if (!row?.statut_inscription || row?.statut_inscription !== 'VALIDEE') {
        raisons.push('Étudiant non inscrit au groupe de cours');
      }
      
      if (row?.statut_groupe !== 'ACTIF') {
        raisons.push(`Le groupe de cours est ${row?.statut_groupe?.toLowerCase() || 'inactif'}`);
      }
      
      if (row?.deja_inscrit) {
        raisons.push('Étudiant déjà inscrit à cette matière');
      }
      
      if (row?.salle_capacite) {
        // Vérifier le nombre d'inscriptions actuelles
        const [countRows] = await pool.execute<RowDataPacket[]>(
          `SELECT COUNT(*) as count FROM ${this.NOTE_TABLE} WHERE matiere_code = ?`,
          [matiereCode]
        );
        const inscrits = countRows[0]?.count || 0;
        
        if (inscrits >= row.salle_capacite) {
          raisons.push('Capacité maximale de la salle atteinte');
        }
      }

      return {
        disponible: raisons.length === 0,
        raisons: raisons.length > 0 ? raisons : [],
        details: {
          matiere_nom: row?.nom,
          statut_groupe: row?.statut_groupe,
          statut_inscription: row?.statut_inscription,
          deja_inscrit: row?.deja_inscrit,
          capacite_salle: row?.salle_capacite
        }
      };

    } catch (error) {
      console.error('Erreur dans checkDisponibilitePourInscription:', error);
      throw error;
    }
  }

  // Nouvelle méthode: Obtenir les séances d'une matière
  static async getSeances(matiereCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        s.*,
        sa.nom as salle_nom,
        sa.capacite as salle_capacite,
        CONCAT(u.nom, ' ', u.prenom) as enseignant_nom
      FROM ${this.SEANCE_TABLE} s
      INNER JOIN ${this.MATIERE_TABLE} m ON s.matiere_code = m.code
      LEFT JOIN ${this.SALLE_TABLE} sa ON s.salle_code = sa.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON s.enseignant_id = e.id
      LEFT JOIN ${this.UTILISATEUR_TABLE} u ON e.id = u.id
      WHERE s.matiere_code = ?
      ORDER BY s.date_seance, s.heure_debut`,
      [matiereCode]
    );
    return rows;
  }

  // Nouvelle méthode: Obtenir les matières par filière
  static async findByFiliere(filiereCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        m.*,
        ue.nom as ue_nom,
        g.nom as groupe_nom,
        sp.nom as specialite_nom
      FROM ${this.MATIERE_TABLE} m
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      LEFT JOIN ${this.GROUPE_UE_TABLE} g ON (
        SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
        LIMIT 1
      )
      LEFT JOIN ${this.SPECIALITE_TABLE} sp ON g.specialite_code = sp.code
      WHERE sp.filiere_code = ?
      ORDER BY m.code`,
      [filiereCode]
    );
    return rows;
  }

  // Nouvelle méthode: Obtenir les matières par spécialité
  static async findBySpecialite(specialiteCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        m.*,
        ue.nom as ue_nom,
        g.nom as groupe_nom
      FROM ${this.MATIERE_TABLE} m
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      LEFT JOIN ${this.GROUPE_UE_TABLE} g ON (
        SELECT g2.code FROM ${this.GROUPE_UE_TABLE} g2
        LIMIT 1
      )
      WHERE g.specialite_code = ?
      ORDER BY m.code`,
      [specialiteCode]
    );
    return rows;
  }

  // Ajoutez cette méthode dans la classe Matiere

/**
 * Récupère les salles disponibles selon les critères spécifiés
 * @param date Date de la séance
 * @param heureDebut Heure de début
 * @param heureFin Heure de fin
 * @param typeSalle Type de salle souhaité (optionnel)
 * @param capaciteMin Capacité minimale requise (optionnel)
 * @param equipements Équipements requis (optionnel)
 * @param exclureSalle Salle à exclure (optionnel - pour les modifications)
 */
static async getSallesDisponibles(
  date: string | Date,
  heureDebut: string,
  heureFin: string,
  options: {
    typeSalle?: string;
    capaciteMin?: number;
    equipements?: string[];
    exclureSalle?: string;
    matiereCode?: string; // Pour exclure la salle actuelle de la matière
  } = {}
): Promise<any[]> {
  try {
    const {
      typeSalle,
      capaciteMin,
      equipements = [],
      exclureSalle,
      matiereCode
    } = options;

    // Convertir la date en format approprié
    const dateSeance = date instanceof Date ? date.toISOString().split('T')[0] :  String(date);

    // 1. D'abord, trouver les salles occupées à cette date/heure
    let sallesOccupeesQuery = `
      SELECT DISTINCT s.code as salle_code
      FROM ${this.SEANCE_TABLE} s
      WHERE s.date_seance = ?
        AND (
          (s.heure_debut < ? AND s.heure_fin > ?) OR  -- Chevauchement partiel début
          (s.heure_debut < ? AND s.heure_fin > ?) OR  -- Chevauchement partiel fin
          (s.heure_debut >= ? AND s.heure_fin <= ?) OR -- Contenu dans
          (s.heure_debut <= ? AND s.heure_fin >= ?)    -- Contient
        )
    `;

    const paramsSallesOccupees: any[] = [
      dateSeance, heureFin, heureDebut,
      dateSeance, heureFin, heureFin,
      dateSeance, heureDebut, heureFin,
      dateSeance, heureDebut, heureFin
    ];

    // 2. Si une salle est exclue (pour modification), l'exclure
    let exclureCondition = '';
    if (exclureSalle) {
      exclureCondition = ' AND s.code != ?';
      paramsSallesOccupees.push(exclureSalle);
    }

    // 3. Si on fournit un code matière, exclure également la salle de la matière actuelle
    let salleMatiereCondition = '';
    if (matiereCode) {
      // Récupérer la salle actuelle de la matière
      const [salleRows] = await pool.execute<RowDataPacket[]>(
        `SELECT salle FROM ${this.MATIERE_TABLE} WHERE code = ?`,
        [matiereCode]
      );
      
      if (salleRows[0]?.salle) {
        // Exclure la salle actuelle de la liste des salles occupées
        // pour permettre de la garder comme option
        // Mais on l'ajoutera à la condition d'exclusion
        exclureCondition += ' AND s.code != ?';
        paramsSallesOccupees.push(salleRows[0].salle);
      }
    }

    sallesOccupeesQuery += exclureCondition;

    const [sallesOccupeesRows] = await pool.execute<RowDataPacket[]>(
      sallesOccupeesQuery,
      paramsSallesOccupees
    );

    const sallesOccupees = sallesOccupeesRows.map(row => row.salle_code);

    // 4. Requête pour récupérer les salles disponibles
    let query = `
      SELECT 
        s.code,
        s.nom,
        s.capacite,
        s.type,
        s.equipements,
        -- Calculer le nombre de séances ce jour-là
        (
          SELECT COUNT(*) 
          FROM ${this.SEANCE_TABLE} se 
          WHERE se.salle_code = s.code 
            AND se.date_seance = ?
        ) as seances_ce_jour,
        -- Vérifier si la salle a les équipements requis
        CASE 
          WHEN ?::text IS NOT NULL AND ?::text != '' THEN
            (SELECT s.equipements @> string_to_array(?, ',')::text[])
          ELSE true
        END as a_equipements_requis
      FROM ${this.SALLE_TABLE} s
      WHERE s.code NOT IN (?)
        AND s.statut = 'ACTIVE' -- Assurez-vous que votre table Salle a un champ statut
    `;

    const params: any[] = [
      dateSeance,
      equipements.length > 0 ? equipements.join(',') : '',
      equipements.length > 0 ? equipements.join(',') : '',
      equipements.length > 0 ? equipements.join(',') : '',
      sallesOccupees.length > 0 ? sallesOccupees : [''] // Éviter les listes vides
    ];

    // Filtres optionnels
    if (typeSalle) {
      query += ' AND s.type = ?';
      params.push(typeSalle);
    }

    if (capaciteMin && capaciteMin > 0) {
      query += ' AND s.capacite >= ?';
      params.push(capaciteMin);
    }

    // Ajouter une condition pour les équipements si spécifiés
    if (equipements && equipements.length > 0) {
      // Pour PostgreSQL avec le type array
      query += ' AND s.equipements @> ?';
      params.push(equipements);
    }

    query += ' ORDER BY s.capacite, s.nom';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    // 5. Ajouter une vérification supplémentaire pour les conflits d'examens
    const sallesAvecConflitsExamen = await this.checkConflitsExamens(
      dateSeance!,
      heureDebut,
      heureFin,
      sallesOccupees
    );

    // Filtrer les salles qui ont des conflits d'examen
    const sallesDisponibles = rows.filter(salle => 
      !sallesAvecConflitsExamen.includes(salle.code)
    );

    // 6. Formater les résultats
    return sallesDisponibles.map(salle => ({
      code: salle.code,
      nom: salle.nom,
      capacite: salle.capacite,
      type: salle.type,
      equipements: salle.equipements || [],
      seances_ce_jour: salle.seances_ce_jour || 0,
      a_equipements_requis: salle.a_equipements_requis || true,
      // Ajouter une disponibilité horaire détaillée
      disponibilite: {
        date: dateSeance,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        disponible: true
      }
    }));

  } catch (error) {
    console.error('Erreur dans getSallesDisponibles:', error);
    throw error;
  }
}

/**
 * Méthode auxiliaire pour vérifier les conflits avec les examens
 */
private static async checkConflitsExamens(
  date: string,
  heureDebut: string,
  heureFin: string,
  sallesOccupees: string[]
): Promise<string[]> {
  try {
    const query = `
      SELECT DISTINCT ms.salle_code
      FROM ${this.MATIERE_SESSIONEXAMEN_TABLE} ms
      WHERE ms.date_examen = ?
        AND (
          (ms.heure_debut < ? AND ms.heure_fin > ?) OR
          (ms.heure_debut < ? AND ms.heure_fin > ?) OR
          (ms.heure_debut >= ? AND ms.heure_fin <= ?)
        )
        AND ms.salle_code IS NOT NULL
    `;

    const params = [
      date, heureFin, heureDebut,
      date, heureFin, heureFin,
      date, heureDebut, heureFin
    ];

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    const sallesEnExamen = rows.map(row => row.salle_code);
    
    // Ajouter les salles occupées par les examens aux salles occupées
    return [...new Set([...sallesOccupees, ...sallesEnExamen])];

  } catch (error) {
    console.error('Erreur dans checkConflitsExamens:', error);
    return sallesOccupees; // En cas d'erreur, retourner les salles occupées actuelles
  }
}

/**
 * Méthode pour vérifier la disponibilité d'une salle spécifique
 */
static async verifierDisponibiliteSalle(
  salleCode: string,
  date: string | Date,
  heureDebut: string,
  heureFin: string,
  options: {
    exclureSeanceId?: number;
    matiereCode?: string;
  } = {}
): Promise<{
  disponible: boolean;
  conflits?: any[];
  details?: any;
}> {
  try {
    const { exclureSeanceId, matiereCode } = options;
    const dateSeance = date instanceof Date ? date.toISOString().split('T')[0] : date;

    // 1. Vérifier les conflits avec les séances
    let querySeances = `
      SELECT 
        s.id as seance_id,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        m.code as matiere_code,
        m.nom as matiere_nom,
        ue.nom as ue_nom,
        e.nom as enseignant_nom,
        e.prenom as enseignant_prenom
      FROM ${this.SEANCE_TABLE} s
      JOIN ${this.MATIERE_TABLE} m ON s.matiere_code = m.code
      JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      LEFT JOIN ${this.ENSEIGNANT_TABLE} e ON s.enseignant_id = e.id
      WHERE s.salle_code = ?
        AND s.date_seance = ?
        AND (
          (s.heure_debut < ? AND s.heure_fin > ?) OR
          (s.heure_debut < ? AND s.heure_fin > ?) OR
          (s.heure_debut >= ? AND s.heure_fin <= ?)
        )
    `;

    const paramsSeances: any[] = [
      salleCode,
      dateSeance, heureFin, heureDebut,
      dateSeance, heureFin, heureFin,
      dateSeance, heureDebut, heureFin
    ];

    if (exclureSeanceId) {
      querySeances += ' AND s.id != ?';
      paramsSeances.push(exclureSeanceId);
    }

    // 2. Vérifier les conflits avec les examens
    const queryExamens = `
      SELECT 
        ms.id,
        ms.date_examen,
        ms.heure_debut,
        ms.heure_fin,
        m.code as matiere_code,
        m.nom as matiere_nom,
        se.libelle as session_examen
      FROM ${this.MATIERE_SESSIONEXAMEN_TABLE} ms
      JOIN ${this.MATIERE_TABLE} m ON ms.matiere_code = m.code
      JOIN ${this.SESSIONEXAMEN_TABLE} se ON ms.session_examen_id = se.id
      WHERE ms.salle_code = ?
        AND ms.date_examen = ?
        AND (
          (ms.heure_debut < ? AND ms.heure_fin > ?) OR
          (ms.heure_debut < ? AND ms.heure_fin > ?) OR
          (ms.heure_debut >= ? AND ms.heure_fin <= ?)
        )
    `;

    const paramsExamens = [
      salleCode,
      dateSeance, heureFin, heureDebut,
      dateSeance, heureFin, heureFin,
      dateSeance, heureDebut, heureFin
    ];

    const [seancesConflits] = await pool.execute<RowDataPacket[]>(querySeances, paramsSeances);
    const [examensConflits] = await pool.execute<RowDataPacket[]>(queryExamens, paramsExamens);

    const conflits = [...seancesConflits, ...examensConflits];

    // 3. Récupérer les informations de la salle
    const [salleInfo] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${this.SALLE_TABLE} WHERE code = ?`,
      [salleCode]
    );

    // 4. Si une matière est fournie, vérifier si c'est la salle actuelle de la matière
    let salleActuelle = false;
    if (matiereCode) {
      const [matiereInfo] = await pool.execute<RowDataPacket[]>(
        `SELECT salle FROM ${this.MATIERE_TABLE} WHERE code = ?`,
        [matiereCode]
      );
      salleActuelle = matiereInfo[0]?.salle === salleCode;
    }

    return {
      disponible: conflits.length === 0,
      conflits: conflits.length > 0 ? conflits : [],
      details: {
        salle: salleInfo[0],
        date: dateSeance,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        salle_actuelle: salleActuelle,
        nombre_conflits: conflits.length
      }
    };

  } catch (error) {
    console.error('Erreur dans verifierDisponibiliteSalle:', error);
    throw error;
  }
}

/**
 * Méthode pour obtenir les créneaux disponibles d'une salle pour une journée
 */
static async getCreneauxDisponiblesSalle(
  salleCode: string,
  date: string | Date
): Promise<{
  creneaux: Array<{heure_debut: string, heure_fin: string, disponible: boolean}>;
  seances: any[];
}> {
  try {
    const dateSeance = date instanceof Date ? date.toISOString().split('T')[0] : date;

    // Récupérer toutes les séances de la journée
    const [seances] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        heure_debut, 
        heure_fin,
        matiere_code,
        m.nom as matiere_nom
      FROM ${this.SEANCE_TABLE} s
      JOIN ${this.MATIERE_TABLE} m ON s.matiere_code = m.code
      WHERE salle_code = ? AND date_seance = ?
      ORDER BY heure_debut`,
      [salleCode, dateSeance]
    );

    // Récupérer aussi les examens
    const [examens] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        heure_debut, 
        heure_fin,
        matiere_code,
        m.nom as matiere_nom
      FROM ${this.MATIERE_SESSIONEXAMEN_TABLE} ms
      JOIN ${this.MATIERE_TABLE} m ON ms.matiere_code = m.code
      WHERE salle_code = ? AND date_examen = ?
      ORDER BY heure_debut`,
      [salleCode, dateSeance]
    );

    const tousLesCreneauxOccupees = [...seances, ...examens];

    // Définir les heures d'ouverture (par défaut: 8h-18h)
    const heuresOuverture = [
      { heure_debut: '08:00', heure_fin: '10:00' },
      { heure_debut: '10:00', heure_fin: '12:00' },
      { heure_debut: '14:00', heure_fin: '16:00' },
      { heure_debut: '16:00', heure_fin: '18:00' }
    ];

    // Vérifier chaque créneau
    const creneaux = heuresOuverture.map(creneau => {
      const conflit = tousLesCreneauxOccupees.some(occupation => {
        return (
          (creneau.heure_debut < occupation.heure_fin && creneau.heure_fin > occupation.heure_debut) ||
          (creneau.heure_debut >= occupation.heure_debut && creneau.heure_fin <= occupation.heure_fin)
        );
      });

      return {
        ...creneau,
        disponible: !conflit
      };
    });

    return {
      creneaux,
      seances: tousLesCreneauxOccupees
    };

  } catch (error) {
    console.error('Erreur dans getCreneauxDisponiblesSalle:', error);
    throw error;
  }
}
}

export default Matiere;