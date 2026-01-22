import { IEtudiant, IEtudiantFormRequest, IEtudiantUpdaterequest } from "../types/Istudents";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Debug: inspect pool methods at import time
console.log('DEBUG Etudiant - pool keys:', pool && Object.keys(pool));

// server/models/etudiantModel.ts

class Etudiant {
  // Créer un nouvel étudiant
  protected static students_table = 'etudiant';
  protected static users_table = 'utilisateur';
  
  static async create(etudiantData: IEtudiantFormRequest): Promise<IEtudiant | null> {
    console.log('couche modèle - donnée d\'entrée', etudiantData);
    
    let {
      numero_etudiant, prenom, nom, date_naissance, lieu_naissance,nationalite, genre, email,
      telephone, date_inscription, filiere, niveau, photo_profil,
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
        INSERT INTO ${Etudiant.users_table} (nom, prenom, email, password_hash, telephone, role, statut)
        VALUES (?, ?, ?, ?, ?, 'ETUDIANT', 'ACTIF')
      `;
      
      console.log('requête d\'insertion etu', userQuery);
      const [userResult] = await pool.execute<ResultSetHeader>(userQuery, [
        nom,
        prenom,
        email,
        'default_password_hash', // À remplacer par un vrai hash
        telephone ?? null
      ]);
      console.log('resultat insertion users',userResult);
      
      const userId = userResult.insertId;

      // 2. Insérer dans Etudiant
      const etudiantQuery = `
        INSERT INTO ${Etudiant.students_table} 
          (id, numero_etudiant, date_naissance, lieu_naissance, genre, nationalite, 
          adresse_complete, region_origine, filiere, niveau, statut_academique, 
          photo_profil, date_inscription)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'non_inscrit', ?, ?)
      `;
      
      
      console.log('requête d\'insertion etu', etudiantQuery);
      await pool.execute(etudiantQuery, [
        userId,
        numero_etudiant,
        date_naissance,
        lieu_naissance, 
        genre ,
        nationalite, 
        adresse_complete, 
        region_origine, 
        filiere,
        niveau,
        photo_profil ,
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
  // Méthode findById corrigée avec typage approprié
  static async findById(id: number): Promise<IEtudiant | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.filiere, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription,
        TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) as age,
        CONCAT(u.prenom, ' ', u.nom) as nom_complet
      FROM Utilisateur u
      INNER JOIN ${Etudiant.students_table} e ON u.id = e.id
      WHERE u.id = ?`,
      [id]
    );
    
    const row = rows[0];
    if (!row) return null;
    
    // Convertir RowDataPacket en IEtudiant
    return this.mapToIEtudiant(row);
  }

  // Ajoutez cette méthode helper pour mapper les données
  private static mapToIEtudiant(row: RowDataPacket): IEtudiant {
    return {
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      telephone: row.telephone,
      role: row.role,
      statut: row.statut,
      numero_etudiant: row.numero_etudiant,
      date_naissance: row.date_naissance,
      lieu_naissance: row.lieu_naissance,
      genre: row.genre,
      nationalite: row.nationalite,
      adresse_complete: row.adresse_complete,
      region_origine: row.region_origine,
      filiere: row.filiere,
      niveau: row.niveau,
      statut_academique: row.statut_academique,
      photo_profil: row.photo_profil,
      date_inscription: row.date_inscription,
      age: row.age,
      nom_complet: row.nom_complet
    } as IEtudiant;
  }

  // Trouver par numéro étudiant
  static async findByNumero(numeroEtudiant: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.filiere, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription
      FROM Utilisateur u
      INNER JOIN ${Etudiant.students_table} e ON u.id = e.id
      WHERE e.numero_etudiant = ?`,
      [numeroEtudiant]
    );
    return rows[0] || null;
  }

  static async generateNumeroEtudiantDatabase(): Promise<string> {
    // Récupérer l'année courante (2 derniers chiffres)
    const currentYear = new Date().getFullYear();
    const yearPart = currentYear.toString().slice(-2);

    // Générer une lettre majuscule aléatoire (A-Z)
    const randomLetter = String.fromCodePoint(65 + Math.floor(Math.random() * 26));
    
    // Chercher le dernier numéro avec ce pattern en utilisant une requête SQL brute
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT numero_etudiant 
        FROM ${Etudiant.students_table}
        WHERE numero_etudiant LIKE ?
        ORDER BY numero_etudiant DESC 
        LIMIT 1`,
        [`${yearPart}${randomLetter}%`]
      );
    let sequenceNumber: number;

    // Vérification plus stricte
    if (Array.isArray(rows) && rows.length > 0) {
      const firstRow = rows[0] as RowDataPacket;
      if (firstRow?.numero_etudiant) {
        const lastNumero = firstRow.numero_etudiant as string;
        const lastSequence = Number.parseInt(lastNumero.slice(3), 10);
        
        // Vérifier que le parsing a réussi
        if (!Number.isNaN(lastSequence)) {
          sequenceNumber = lastSequence + 1;
        } else {
          sequenceNumber = 1;
        }
      } else {
        sequenceNumber = 1;
      }
    } else {
      sequenceNumber = 1;
    }

    // Formater le numéro séquentiel sur 4 chiffres
    const sequencePart = sequenceNumber.toString().padStart(4, '0');

    return `${yearPart}${randomLetter}${sequencePart}`;
  }

  // Trouver par email
  static async findByEmail(email: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.statut,
        e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
        e.nationalite, e.adresse_complete, e.region_origine,
        e.filiere, e.niveau, e.statut_academique, e.photo_profil, e.date_inscription
      FROM Utilisateur u
      INNER JOIN ${Etudiant.students_table} e ON u.id = e.id
      WHERE u.email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  // Récupérer tous les étudiants avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.statut,
        e.numero_etudiant, e.date_naissance, e.genre,
        e.filiere, e.niveau, e.statut_academique
      FROM Utilisateur u
      INNER JOIN ${Etudiant.students_table} e ON u.id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Appliquer les filtres
    if (filters.filiere) {
      query += ' AND filiere = ?';
      params.push(filters.filiere);
    }
    if (filters.niveau) {
      query += ' AND niveau = ?';
      params.push(filters.niveau);
    }
    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }
    if (filters.search) {
      query += ' AND (nom LIKE ? OR prenom LIKE ? OR numero_etudiant LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build final query with pagination (interpolate integers to avoid prepared-statement LIMIT issues)
    const baseQuery = query; // without ORDER/LIMIT
    const finalQuery = `${baseQuery} ORDER BY nom, prenom LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Execute the main query
    const [rows] = await pool.execute<RowDataPacket[]>(finalQuery, params);

    // Count total using a subquery to avoid modifying params
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as tmp`;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);

    return {
      data: rows,
      pagination: {
        page: Number.isNaN(page) ? Number.parseInt(page.toString()) : page ?? 1,
        limit: Number.isNaN(limit) ? Number.parseInt(limit.toString()) : limit ?? 10,
        total: countRows[0]?.total,
        totalPages: Math.ceil(countRows[0]?.total / limit)
      }
    };
  }

  // Mettre à jour un étudiant
  static async update(id: number, etudiantData: Partial<IEtudiantUpdaterequest>) {
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
        'genre', 'nationalite', 'adresse_complete', 'region_origine', 'filiere', 
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
        const userQuery = `UPDATE Utilisateur SET ${userFields.join(', ')} WHERE id = ?`;
        await pool.execute(userQuery, userValues);
      }

      // Mettre à jour Etudiant si nécessaire
      if (etudiantFields.length > 0) {
        etudiantValues.push(id);
        const etudiantQuery = `UPDATE ${Etudiant.students_table} SET ${etudiantFields.join(', ')} WHERE id = ?`;
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

  // Supprimer un étudiant
  static async delete(id: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM ${Etudiant.students_table} WHERE id = ?`,
      [id]
    );
    return (result.affectedRows ?? 0) > 0;
  }

  // Changer le statut d'un étudiant
  static async toggleStatut(id: number, statut?: string) {
    const etudiant = await this.findById(id);
    if (!etudiant) return null;

    const nouveauStatut = statut || 'actif';
    
    // Mettre à jour le statut dans Utilisateur
    await pool.execute(
      'UPDATE Utilisateur SET statut = ? WHERE id = ?',
      [nouveauStatut, id]
    );

    return this.findById(id);
  }

  // Obtenir les cours d'un étudiant
  static async getCours(id: number) {
    const [rows] = await pool.execute(
      `SELECT 
        gc.code, gc.nom, gc.filiere_code, gc.niveau, gc.semestre,
        ig.date_inscription, ig.statut as statut_inscription
      FROM GroupeCours gc
      INNER JOIN InscriptionGroupe ig ON gc.code = ig.groupe_cours_code
      WHERE ig.etudiant_id = ?
      ORDER BY gc.semestre, gc.nom`,
      [id]
    );
    return rows;
  }

  // Obtenir les notes d'un étudiant
  static async getNotes(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        n.*, 
        m.nom as matiere_nom, 
        m.code as matiere_code,
        ue.credits
      FROM Note n
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE n.etudiant_id = ?
      ORDER BY m.nom`,
      [id]
    );
    return rows;
  }

  // Calculer la moyenne générale d'un étudiant
  static async getMoyenneGenerale(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(n.note_finale) as moyenne,
        COUNT(*) as nombre_matieres,
        SUM(CASE WHEN n.note_finale >= 10 THEN ue.credits ELSE 0 END) as credits_obtenus,
        SUM(ue.credits) as credits_totaux
      FROM Note n
      INNER JOIN Matiere m ON n.matiere_code = m.code
      INNER JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
      WHERE n.etudiant_id = ? AND n.validee = TRUE`,
      [id]
    );
    return rows[0];
  }

  // Obtenir les statistiques des étudiants
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.filiere,
        COUNT(*) as total,
        SUM(CASE WHEN e.statut_academique = 'inscrit' THEN 1 ELSE 0 END) as inscrits,
        SUM(CASE WHEN e.statut_academique = 'diplome' THEN 1 ELSE 0 END) as diplomes,
        SUM(CASE WHEN e.statut_academique = 'abandon' THEN 1 ELSE 0 END) as abandons,
        AVG(TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE())) as age_moyen
      FROM ${Etudiant.students_table} e
      GROUP BY e.filiere
      ORDER BY total DESC`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM ${Etudiant.students_table}'
    );
    
    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN statut_academique = 'inscrit' THEN 1 ELSE 0 END) as inscrits,
        SUM(CASE WHEN statut_academique = 'diplome' THEN 1 ELSE 0 END) as diplomes,
        SUM(CASE WHEN statut_academique = 'non_inscrit' THEN 1 ELSE 0 END) as non_inscrits
      FROM ${Etudiant.students_table}`
    );
    
    return {
      total: totalRow [0]?.total,
      inscrits: statsRow [0]?.inscrits ?? 0,
      diplomes: statsRow [0]?.diplomes ?? 0,
      non_inscrits: statsRow [0]?.non_inscrits ?? 0,
      parFiliere: rows,
    };
  }

  // Recherche avancée d'étudiants
  static async search(criteria: Partial<IEtudiant> & { minAge?: number; maxAge?: number }) {
    let query = `
      SELECT 
        u.id, u.nom, u.prenom, u.email, u.telephone, u.statut,
        e.numero_etudiant, e.date_naissance, e.filiere, e.niveau, e.statut_academique,
        TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) as age,
        CONCAT(u.prenom, ' ', u.nom) as nom_complet
      FROM Utilisateur u
      INNER JOIN ${Etudiant.students_table} e ON u.id = e.id
      WHERE 1=1
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
    if (criteria.filiere) {
      query += ' AND e.filiere = ?';
      params.push(criteria.filiere);
    }
    if (criteria.niveau) {
      query += ' AND e.niveau = ?';
      params.push(criteria.niveau);
    }
    if (criteria.statut) {
      query += ' AND u.statut = ?';
      params.push(criteria.statut);
    }
    if (criteria.minAge) {
      query += ' AND TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) >= ?';
      params.push(criteria.minAge);
    }
    if (criteria.maxAge) {
      query += ' AND TIMESTAMPDIFF(YEAR, e.date_naissance, CURDATE()) <= ?';
      params.push(criteria.maxAge);
    }

    query += ' ORDER BY u.nom, u.prenom LIMIT 100';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows;
  }
}

export default Etudiant;