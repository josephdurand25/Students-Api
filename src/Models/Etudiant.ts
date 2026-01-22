// server/models/etudiantModel.ts
import { IEtudiant, IEtudiantFormRequest, IEtudiantUpdaterequest } from "../types/Istudents";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Debug: inspect pool methods at import time
console.log('DEBUG Etudiant - pool keys:', pool && Object.keys(pool));

class Etudiant {
  // Tables protégées pour une meilleure maintenabilité
  protected static readonly STUDENTS_TABLE = 'Etudiant';
  protected static readonly USERS_TABLE = 'Utilisateur';
  protected static readonly SPECIALITE_TABLE = 'Specialite';
  protected static readonly FILIERE_TABLE = 'Filiere';
  protected static readonly INSCRIPTION_TABLE = 'Inscription';
  protected static readonly INSCRIPTION_GROUPE_TABLE = 'Inscription_GroupeUE';
  protected static readonly GROUPE_UE_TABLE = 'GroupeUE';
  protected static readonly NOTE_TABLE = 'Note';
  protected static readonly MATIERE_TABLE = 'Matiere';
  protected static readonly UNITE_ENSEIGNEMENT_TABLE = 'UniteEnseignement';
  
  // Constantes pour les statuts
  protected static readonly STATUT_ACADEMIQUE = {
    CANDIDAT: 'CANDIDAT',
    INSCRIT: 'INSCRIT',
    ACTIF: 'ACTIF',
    BLOQUE: 'BLOQUE',
    ABANDON: 'ABANDON',
    DIPLOME: 'DIPLOME',
    EXCLU: 'EXCLU'
  } as const;
  
  protected static readonly STATUT_UTILISATEUR = {
    ACTIF: 'ACTIF',
    INACTIF: 'INACTIF',
    SUSPENDU: 'SUSPENDU',
    BLOQUE: 'BLOQUE'
  } as const;
  
  protected static readonly ROLES = {
    ETUDIANT: 'ETUDIANT',
    ENSEIGNANT: 'ENSEIGNANT',
    ADMINISTRATEUR: 'ADMINISTRATEUR'
  } as const;

  // Créer un nouvel étudiant
  static async create(etudiantData: Partial<IEtudiantFormRequest>): Promise<IEtudiant | null> {
    console.log('couche modèle - donnée d\'entrée', etudiantData);
    
    if (!etudiantData || !etudiantData.email) {
      console.error('Email requis');
      return null;
    }
    
    let {
      numero_etudiant, prenom, nom, date_naissance, lieu_naissance, nationalite, genre, email,
      telephone, date_inscription, specialite_code, niveau, photo_profil,
      region_origine, adresse_complete, 
    } = etudiantData;

    // Générer le numéro étudiant si non fourni
    if (!numero_etudiant || numero_etudiant === '') {
      numero_etudiant = await this.generateNumeroEtudiantDatabase();
      console.log('matricule généré', numero_etudiant);
    }

    try {
      // Commencer une transaction
      await pool.query('START TRANSACTION');

      // 1. Insérer dans Utilisateur
      const userQuery = `
        INSERT INTO ${this.USERS_TABLE} (nom, prenom, email, password_hash, telephone, role, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const passwordHash = await this.generateDefaultPasswordHash(email);
      
      console.log('requête d\'insertion user', userQuery);
      const [userResult] = await pool.execute<ResultSetHeader>(userQuery, [
        nom,
        prenom,
        email,
        passwordHash,
        telephone ?? null,
        this.ROLES.ETUDIANT,
        this.STATUT_UTILISATEUR.ACTIF
      ]);
      
      console.log('resultat insertion users', userResult);
      
      const userId = userResult.insertId;

      // 2. Insérer dans Etudiant
      const etudiantQuery = `
        INSERT INTO ${this.STUDENTS_TABLE} 
          (id, numero_etudiant, date_naissance, lieu_naissance, genre, nationalite, 
          adresse_complete, region_origine, specialite_code, niveau, statut_academique, 
          photo_profil, date_inscription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      console.log('requête d\'insertion etudiant', etudiantQuery);
      await pool.execute(etudiantQuery, [
        userId,
        numero_etudiant,
        date_naissance,
        lieu_naissance, 
        genre,
        nationalite, 
        adresse_complete, 
        region_origine, 
        specialite_code,
        niveau,
        this.STATUT_ACADEMIQUE.INSCRIT,
        photo_profil,
        date_inscription 
      ]);
      
      // Valider la transaction
      await pool.query('COMMIT');
      
      console.log('transaction validé');

      return this.findById(userId);
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await pool.query('ROLLBACK');
      console.error('Erreur création étudiant:', error);
      throw error;
    }
  }

  // Trouver un étudiant par ID
  static async findById(id: number): Promise<IEtudiant | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut as statut_utilisateur,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.specialite_code, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription,
        s.nom as specialite_nom, s.filiere_code,
        f.nom as filiere_nom,
        TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) as age,
        CONCAT(u.prenom, ' ', u.nom) as nom_complet
      FROM ${this.USERS_TABLE} u
      INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
      LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
      WHERE u.id = ?`,
      [id]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    return this.mapToIEtudiant(row);
  }

  // Méthode helper pour mapper les données
  private static mapToIEtudiant(row: RowDataPacket): IEtudiant {
    return {
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      telephone: row.telephone,
      role: row.role,
      statut: row.statut_utilisateur,
      numero_etudiant: row.numero_etudiant,
      date_naissance: row.date_naissance,
      lieu_naissance: row.lieu_naissance,
      genre: row.genre,
      nationalite: row.nationalite,
      adresse_complete: row.adresse_complete,
      region_origine: row.region_origine,
      specialite_code: row.specialite_code,
      specialite_nom: row.specialite_nom,
      filiere_code: row.filiere_code,
      filiere_nom: row.filiere_nom,
      niveau: row.niveau,
      statut_academique: row.statut_academique,
      photo_profil: row.photo_profil,
      date_inscription: row.date_inscription,
      age: row.age,
      nom_complet: row.nom_complet
    } as IEtudiant;
  }

  // Trouver par numéro étudiant
  static async findByNumero(numeroEtudiant: string): Promise<IEtudiant | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut as statut_utilisateur,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.specialite_code, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription,
        s.nom as specialite_nom, s.filiere_code,
        f.nom as filiere_nom
      FROM ${this.USERS_TABLE} u
      INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
      LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
      WHERE e.numero_etudiant = ?`,
      [numeroEtudiant]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    return this.mapToIEtudiant(row);
  }

  // Générer un hash de mot de passe par défaut
  private static async generateDefaultPasswordHash(email: string): Promise<string> {
    // Dans un vrai système, utilisez bcrypt ou argon2
    // Pour le moment, on génère un hash simple
    const defaultPassword = "Etudiant123";
    // Simuler un hash (dans la réalité: await bcrypt.hash(defaultPassword, 10))
    return `hashed_${defaultPassword}_${email.substring(0, 5)}`;
  }

  static async generateNumeroEtudiantDatabase(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPart = currentYear.toString().slice(-2);
    const randomLetter = String.fromCodePoint(65 + Math.floor(Math.random() * 26));
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT numero_etudiant 
      FROM ${this.STUDENTS_TABLE}
      WHERE numero_etudiant LIKE ?
      ORDER BY numero_etudiant DESC 
      LIMIT 1`,
      [`${yearPart}${randomLetter}%`]
    );
    
    let sequenceNumber: number;
    
    if (Array.isArray(rows) && rows.length > 0) {
      const firstRow = rows[0] as RowDataPacket;
      if (firstRow?.numero_etudiant) {
        const lastNumero = firstRow.numero_etudiant as string;
        const lastSequence = Number.parseInt(lastNumero.slice(3), 10);
        
        sequenceNumber = !Number.isNaN(lastSequence) ? lastSequence + 1 : 1;
      } else {
        sequenceNumber = 1;
      }
    } else {
      sequenceNumber = 1;
    }

    const sequencePart = sequenceNumber.toString().padStart(4, '0');
    return `${yearPart}${randomLetter}${sequencePart}`;
  }

  // Trouver par email
  static async findByEmail(email: string): Promise<IEtudiant | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut as statut_utilisateur,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.specialite_code, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription,
        s.nom as specialite_nom, s.filiere_code,
        f.nom as filiere_nom
      FROM ${this.USERS_TABLE} u
      INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
      LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
      WHERE u.email = ?`,
      [email]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    return this.mapToIEtudiant(row);
  }

  // Récupérer tous les étudiants avec pagination
    static async findAllV1(
      page = 1, 
      limit = 10, 
      filters: {
        filiere_code?: string;
        specialite_code?: string;
        niveau?: string;
        statut?: string;
        search?: string;
      } = {}
    ) {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          u.id, u.nom, u.prenom, u.email, u.telephone, u.statut as statut_utilisateur,
          e.numero_etudiant, e.date_naissance, e.genre,
          e.specialite_code, e.niveau, e.statut_academique,
          s.nom as specialite_nom, s.filiere_code,
          f.nom as filiere_nom,
          CONCAT(u.prenom, ' ', u.nom) as nom_complet
        FROM ${this.USERS_TABLE} u
        INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
        LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
        LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
        WHERE u.role = '${this.ROLES.ETUDIANT}'
      `;
      
      const params: any[] = [];

      // Appliquer les filtres
      if (filters.filiere_code) {
        query += ' AND s.filiere_code = ?';
        params.push(filters.filiere_code);
      }
      if (filters.specialite_code) {
        query += ' AND e.specialite_code = ?';
        params.push(filters.specialite_code);
      }
      if (filters.niveau) {
        query += ' AND e.niveau = ?';
        params.push(filters.niveau);
      }
      if (filters.statut) {
        query += ' AND u.statut = ?';
        params.push(filters.statut);
      }
      if (filters.search) {
        query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR e.numero_etudiant LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const baseQuery = query;
      const finalQuery = `${baseQuery} ORDER BY u.nom, u.prenom LIMIT ? OFFSET ?`;
      
      const finalParams = [...params, limit, offset];

      console.log('final query',finalQuery);
      

      // Exécuter la requête principale
      const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, finalParams);

      // Compter le total
      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
      const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

      return {
        data: rows.map(row => this.mapToIEtudiant(row)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(countRows[0]?.total) || 0,
          totalPages: Math.ceil((Number(countRows[0]?.total) || 0) / limit)
        }
      };
    }
    static async findAll(
      page = 1, 
      limit = 10, 
      filters: {
        filiere_code?: string;
        specialite_code?: string;
        niveau?: string;
        statut?: string;
        search?: string;
      } = {}
    ) {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          u.id, u.nom, u.prenom, u.email, u.telephone, u.statut as statut_utilisateur,
          e.numero_etudiant, e.date_naissance, e.genre,
          e.specialite_code, e.niveau, e.statut_academique,
          s.nom as specialite_nom, s.filiere_code,
          f.nom as filiere_nom,
          CONCAT(u.prenom, ' ', u.nom) as nom_complet
        FROM ${this.USERS_TABLE} u
        INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
        LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
        LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
        WHERE u.role = '${this.ROLES.ETUDIANT}'
      `;
      
      const params: any[] = [];

      // Appliquer les filtres
      if (filters.filiere_code) {
        query += ' AND s.filiere_code = ?';
        params.push(filters.filiere_code);
      }
      if (filters.specialite_code) {
        query += ' AND e.specialite_code = ?';
        params.push(filters.specialite_code);
      }
      if (filters.niveau) {
        query += ' AND e.niveau = ?';
        params.push(filters.niveau);
      }
      if (filters.statut) {
        query += ' AND u.statut = ?';
        params.push(filters.statut);
      }
      if (filters.search) {
        query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR e.numero_etudiant LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const baseQuery = query;      
      const finalParams = [...params, Number(limit), Number(offset)];
      const finalQuery = `${baseQuery} ORDER BY u.nom, u.prenom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

      try {
        // Exécuter la requête principale
        const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, finalParams);
        // Pour compter le total, utiliser seulement les paramètres de filtrage
        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
        
        const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

        return {
          data: rows.map(row => this.mapToIEtudiant(row)),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: Number(countRows[0]?.total) || 0,
            totalPages: Math.ceil((Number(countRows[0]?.total) || 0) / limit)
          }
        };
      } catch (error) {
        console.error('Erreur SQL détaillée:', error);
        console.error('Requête:', finalQuery);
        console.error('Paramètres:', finalParams);
        throw error;
      }
    }

  // Mettre à jour un étudiant
  static async update(id: number, etudiantData: Partial<IEtudiantUpdaterequest>): Promise<IEtudiant | null> {
    try {
      await pool.query('START TRANSACTION');

      // Séparer les champs Utilisateur et Etudiant
      const userFields: string[] = [];
      const etudiantFields: string[] = [];
      const userValues: any[] = [];
      const etudiantValues: any[] = [];

      // Champs de Utilisateur
      const userFieldNames = ['nom', 'prenom', 'email', 'telephone', 'statut'];
      // Champs de Etudiant
      const etudiantFieldNames = ['numero_etudiant', 'date_naissance', 'lieu_naissance', 
        'genre', 'nationalite', 'adresse_complete', 'region_origine', 'specialite_code', 
        'niveau', 'statut_academique', 'photo_profil', 'date_inscription'];

      Object.entries(etudiantData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (userFieldNames.includes(key)) {
            userFields.push(`${key} = ?`);
            userValues.push(value);
          } else if (etudiantFieldNames.includes(key)) {
            etudiantFields.push(`${key} = ?`);
            etudiantValues.push(value);
          }
        }
      });

      // Mettre à jour Utilisateur si nécessaire
      if (userFields.length > 0) {
        userValues.push(id);
        const userQuery = `UPDATE ${this.USERS_TABLE} SET ${userFields.join(', ')} WHERE id = ?`;
        await pool.execute(userQuery, userValues);
      }

      // Mettre à jour Etudiant si nécessaire
      if (etudiantFields.length > 0) {
        etudiantValues.push(id);
        const etudiantQuery = `UPDATE ${this.STUDENTS_TABLE} SET ${etudiantFields.join(', ')} WHERE id = ?`;
        await pool.execute(etudiantQuery, etudiantValues);
      }

      await pool.query('COMMIT');
      return this.findById(id);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Erreur mise à jour étudiant:', error);
      throw error;
    }
  }

  // Supprimer un étudiant (soft delete)
  static async delete(id: number): Promise<boolean> {
    try {
      await pool.query('START TRANSACTION');
      
      // Soft delete: mettre le statut à INACTIF
      await pool.execute(
        `UPDATE ${this.USERS_TABLE} SET statut = ? WHERE id = ?`,
        [this.STATUT_UTILISATEUR.INACTIF, id]
      );
      
      await pool.execute(
        `UPDATE ${this.STUDENTS_TABLE} SET statut_academique = ? WHERE id = ?`,
        [this.STATUT_ACADEMIQUE.EXCLU, id]
      );
      
      await pool.query('COMMIT');
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Erreur suppression étudiant:', error);
      return false;
    }
  }

  // Changer le statut d'un étudiant
  static async toggleStatut(id: number, statut?: string): Promise<IEtudiant | null> {
    const etudiant = await this.findById(id);
    if (!etudiant) return null;

    const nouveauStatut = statut || 
      (etudiant.statut === this.STATUT_UTILISATEUR.ACTIF 
        ? this.STATUT_UTILISATEUR.INACTIF 
        : this.STATUT_UTILISATEUR.ACTIF);
    
    await pool.execute(
      `UPDATE ${this.USERS_TABLE} SET statut = ? WHERE id = ?`,
      [nouveauStatut, id]
    );

    return this.findById(id);
  }

  // Obtenir les groupes UE d'un étudiant
  static async getGroupesUE(id: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        g.code, g.nom, g.niveau, g.semestre,
        ig.date_inscription, ig.statut as statut_inscription,
        s.nom as specialite_nom,
        f.nom as filiere_nom
      FROM ${this.GROUPE_UE_TABLE} g
      INNER JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON g.code = ig.groupeue_code
      INNER JOIN ${this.SPECIALITE_TABLE} s ON g.specialite_code = s.code
      INNER JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
      INNER JOIN ${this.INSCRIPTION_TABLE} i ON ig.inscript_code = i.numero_inscription
      WHERE i.etudiant_id = ?
      ORDER BY g.semestre, g.nom`,
      [id]
    );
    return rows;
  }

  // Obtenir les notes d'un étudiant
  static async getNotes(id: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*, 
        m.nom as matiere_nom, 
        m.code as matiere_code,
        ue.code as ue_code,
        ue.nom as ue_nom,
        ue.credits,
        se.libelle as session_libelle,
        se.type as session_type
      FROM ${this.NOTE_TABLE} n
      INNER JOIN ${this.MATIERE_TABLE} m ON n.matiere_code = m.code
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      INNER JOIN SessionExamen se ON n.session_examen_id = se.id
      WHERE n.etudiant_id = ?
      ORDER BY se.libelle DESC, m.nom`,
      [id]
    );
    return rows;
  }

  // Calculer la moyenne générale d'un étudiant
  static async getMoyenneGenerale(id: number): Promise<any> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(n.note_finale) as moyenne,
        COUNT(*) as nombre_matieres,
        SUM(CASE WHEN n.note_finale >= 10 THEN ue.credits ELSE 0 END) as credits_obtenus,
        SUM(ue.credits) as credits_totaux,
        MIN(n.note_finale) as note_min,
        MAX(n.note_finale) as note_max
      FROM ${this.NOTE_TABLE} n
      INNER JOIN ${this.MATIERE_TABLE} m ON n.matiere_code = m.code
      INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON m.ue_code = ue.code
      WHERE n.etudiant_id = ? AND n.validee = TRUE`,
      [id]
    );
    return rows[0] || null;
  }

  // Obtenir les statistiques des étudiants
  static async getStatistiques(): Promise<any> {
    // Statistiques par filière
    const [filiereStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        f.code as filiere_code,
        f.nom as filiere_nom,
        COUNT(DISTINCT e.id) as total_etudiants,
        COUNT(DISTINCT CASE WHEN e.statut_academique = '${this.STATUT_ACADEMIQUE.ACTIF}' THEN e.id END) as etudiants_actifs,
        COUNT(DISTINCT CASE WHEN e.statut_academique = '${this.STATUT_ACADEMIQUE.DIPLOME}' THEN e.id END) as diplomes,
        COUNT(DISTINCT s.code) as nombre_specialites,
        AVG(TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE())) as age_moyen
      FROM ${this.FILIERE_TABLE} f
      LEFT JOIN ${this.SPECIALITE_TABLE} s ON f.code = s.filiere_code
      LEFT JOIN ${this.STUDENTS_TABLE} e ON s.code = e.specialite_code
      GROUP BY f.code, f.nom
      ORDER BY total_etudiants DESC`
    );

    // Statistiques générales
    const [totalStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_etudiants,
        COUNT(CASE WHEN u.statut = '${this.STATUT_UTILISATEUR.ACTIF}' THEN 1 END) as actifs,
        COUNT(CASE WHEN u.statut = '${this.STATUT_UTILISATEUR.INACTIF}' THEN 1 END) as inactifs,
        COUNT(CASE WHEN e.statut_academique = '${this.STATUT_ACADEMIQUE.CANDIDAT}' THEN 1 END) as candidats,
        COUNT(CASE WHEN e.statut_academique = '${this.STATUT_ACADEMIQUE.DIPLOME}' THEN 1 END) as diplomes,
        COUNT(CASE WHEN e.genre = 'M' THEN 1 END) as hommes,
        COUNT(CASE WHEN e.genre = 'F' THEN 1 END) as femmes,
        AVG(TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE())) as age_moyen
      FROM ${this.STUDENTS_TABLE} e
      INNER JOIN ${this.USERS_TABLE} u ON e.id = u.id
      WHERE u.role = '${this.ROLES.ETUDIANT}'`
    );

    // Distribution par niveau
    const [niveauStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.niveau,
        COUNT(*) as nombre,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${this.STUDENTS_TABLE}), 2) as pourcentage
      FROM ${this.STUDENTS_TABLE} e
      GROUP BY e.niveau
      ORDER BY 
        CASE e.niveau
          WHEN 'L1' THEN 1
          WHEN 'L2' THEN 2
          WHEN 'L3' THEN 3
          WHEN 'M1' THEN 4
          WHEN 'M2' THEN 5
          ELSE 6
        END`
    );

    return {
      total: totalStats[0],
      parFiliere: filiereStats,
      parNiveau: niveauStats
    };
  }

  // Recherche avancée d'étudiants
  static async search(criteria: {
    nom?: string;
    prenom?: string;
    filiere_code?: string;
    specialite_code?: string;
    niveau?: string;
    statut?: string;
    minAge?: number;
    maxAge?: number;
    search?: string;
  } = {}): Promise<IEtudiant[]> {
    let query = `
      SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.statut as statut_utilisateur,
        e.numero_etudiant, e.date_naissance, e.filiere_code, e.specialite_code, e.niveau, e.statut_academique,
        s.nom as specialite_nom,
        f.nom as filiere_nom,
        TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) as age,
        CONCAT(u.prenom, ' ', u.nom) as nom_complet
      FROM ${this.USERS_TABLE} u
      INNER JOIN ${this.STUDENTS_TABLE} e ON u.id = e.id
      LEFT JOIN ${this.SPECIALITE_TABLE} s ON e.specialite_code = s.code
      LEFT JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
      WHERE u.role = '${this.ROLES.ETUDIANT}'
    `;
    
    const params: any[] = [];

    if (criteria.nom) {
      query += ' AND u.nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.prenom) {
      query += ' AND u.prenom LIKE ?';
      params.push(`%${criteria.prenom}%`);
    }
    if (criteria.filiere_code) {
      query += ' AND s.filiere_code = ?';
      params.push(criteria.filiere_code);
    }
    if (criteria.specialite_code) {
      query += ' AND e.specialite_code = ?';
      params.push(criteria.specialite_code);
    }
    if (criteria.niveau) {
      query += ' AND e.niveau = ?';
      params.push(criteria.niveau);
    }
    if (criteria.statut) {
      query += ' AND u.statut = ?';
      params.push(criteria.statut);
    }
    if (criteria.minAge !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) >= ?';
      params.push(criteria.minAge);
    }
    if (criteria.maxAge !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) <= ?';
      params.push(criteria.maxAge);
    }
    if (criteria.search) {
      query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR e.numero_etudiant LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${criteria.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY u.nom, u.prenom LIMIT 100';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapToIEtudiant(row));
  }

  // Méthode pour obtenir les filières disponibles
  static async getFilieres(): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT code, nom, departement FROM ${this.FILIERE_TABLE} 
       WHERE statut = 'ACTIVE' 
       ORDER BY nom`
    );
    return rows;
  }

  // Méthode pour obtenir les spécialités d'une filière
  static async getSpecialitesByFiliere(filiereCode: string): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT code, nom, type, niveaux_offerts 
       FROM ${this.SPECIALITE_TABLE} 
       WHERE filiere_code = ? AND niveaux_offerts IS NOT NULL
       ORDER BY nom`,
      [filiereCode]
    );
    return rows;
  }

  // Méthode pour vérifier si un étudiant est inscrit à une année académique
  static async estInscritAnnee(etudiantId: number, anneeAcademique: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM ${this.INSCRIPTION_TABLE} 
       WHERE etudiant_id = ? AND annee_academique = ? AND statut = 'VALIDE'`,
      [etudiantId, anneeAcademique]
    );
    return rows.length > 0;
  }

  static async getCours(id: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          g.code as groupe_code,
          g.nom as groupe_nom,
          g.niveau,
          g.semestre,
          g.credits_total,
          s.nom as specialite_nom,
          f.nom as filiere_nom,
          ig.date_inscription,
          ig.statut as statut_inscription,
          COUNT(DISTINCT m.code) as nombre_matieres,
          GROUP_CONCAT(DISTINCT CONCAT(m.code, ': ', m.nom) SEPARATOR '; ') as matieres_liste
        FROM ${this.GROUPE_UE_TABLE} g
        INNER JOIN ${this.INSCRIPTION_GROUPE_TABLE} ig ON g.code = ig.groupeue_code
        INNER JOIN ${this.SPECIALITE_TABLE} s ON g.specialite_code = s.code
        INNER JOIN ${this.FILIERE_TABLE} f ON s.filiere_code = f.code
        INNER JOIN ${this.UNITE_ENSEIGNEMENT_TABLE} ue ON (
          SELECT ue2.code 
          FROM ${this.UNITE_ENSEIGNEMENT_TABLE} ue2
          LIMIT 1
        )
        LEFT JOIN ${this.MATIERE_TABLE} m ON ue.code = m.ue_code
        INNER JOIN ${this.INSCRIPTION_TABLE} i ON ig.inscription_numero = i.numero_inscription
        WHERE i.etudiant_id = ?
        GROUP BY g.code, g.nom, g.niveau, g.semestre, s.nom, f.nom, ig.date_inscription, ig.statut
        ORDER BY g.semestre, g.nom`,
        [id]
      );
      
      // Formater les données pour le retour
      const result = rows.map(row => ({
        code: row.groupe_code,
        nom: row.groupe_nom,
        niveau: row.niveau,
        semestre: row.semestre,
        credits_total: row.credits_total,
        specialite: row.specialite_nom,
        filiere: row.filiere_nom,
        date_inscription: row.date_inscription,
        statut_inscription: row.statut_inscription,
        nombre_matieres: row.nombre_matieres,
        matieres: row.matieres_liste ? row.matieres_liste.split('; ').map((m: string) => {
          const [code, nom] = m.split(': ');
          return { code, nom: nom || code };
        }) : []
      }));
      
      return result;
    } catch (error) {
      console.error('Erreur dans getCours:', error);
      throw error;
    }
  }
}

export default Etudiant;