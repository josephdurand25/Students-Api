import { IEtudiant, IEtudiantFormRequest, IEtudiantUpdaterequest, StatutEtudiant } from "../types/Istudents";
import pool from '../Config/db.config';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Debug: inspect pool methods at import time
console.log('DEBUG Etudiant - pool keys:', pool && Object.keys(pool));

// server/models/etudiantModel.ts

class Etudiant {
  // Créer un nouvel étudiant
  
  
  static async create(etudiantData: IEtudiantFormRequest): Promise<IEtudiant | null> {
  console.log('couche modèle -donnée d\'entrée', etudiantData);
    let {
        numero_etudiant, prenom, nom, date_naissance, genre, email,
        telephone, adresse_rue, adresse_ville, adresse_code_postal,
        adresse_pays, date_inscription, filiere, niveau, photo_profil,
        created_by
    } = etudiantData;
    if (!numero_etudiant || numero_etudiant === '' || numero_etudiant !== null) {
        const matricule = await this.generateNumeroEtudiantDatabase();
        console.log('matricule généré',matricule);
        numero_etudiant = matricule
    }
    created_by = 1
    console.log('couche modèle - matricule de soumission', numero_etudiant);
    // console.log('couche modèle - donnée de soumission', etudiantData);
    // IMPORTANT: Convertir undefined en null pour MySQL
    const params = [
      numero_etudiant,
      prenom,
      nom,
      date_naissance,
      genre,
      email,
      telephone ?? null,           // Si undefined, utiliser null
      adresse_rue ?? null,
      adresse_ville ?? null,
      adresse_code_postal ?? null,
      adresse_pays ?? null,
      date_inscription,
      filiere,
      niveau,
      photo_profil ?? null,        // Si undefined, utiliser null
      created_by ?? null         // Si undefined, utiliser null
    ];

    const query = `INSERT INTO etudiants 
         (numero_etudiant, prenom, nom, date_naissance, genre, email,
            telephone, adresse_rue, adresse_ville, adresse_code_postal,
            adresse_pays, date_inscription, filiere, niveau, photo_profil,
            created_by, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')`;
    console.log('Paramètres SQL:', params);

    const [result] = await pool.execute<ResultSetHeader>(query,params);
    console.log('result insert sql', result);
    

    return this.findById((result.insertId)) as Promise<IEtudiant | null>;
}

  // Trouver un étudiant par ID
  static async findById(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT *, 
        TIMESTAMPDIFF(YEAR, date_naissance, CURDATE()) as age,
        CONCAT(prenom, ' ', nom) as nom_complet
       FROM etudiants 
       WHERE id = ?`,
      [id]
    );
    return (rows as RowDataPacket[])[0] || null;
  }

  // Trouver par numéro étudiant
  static async findByNumero(numeroEtudiant: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM etudiants WHERE numero_etudiant = ?',
      [numeroEtudiant]
    );
    return (rows as RowDataPacket[])[0] || null;
  }

  static async generateNumeroEtudiantDatabase(): Promise<string> {
    // Récupérer l'année courante (2 derniers chiffres)
    const currentYear = new Date().getFullYear();
    const yearPart = currentYear.toString().slice(-2);

    // Générer une lettre majuscule aléatoire (A-Z)
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    // Chercher le dernier numéro avec ce pattern en utilisant une requête SQL brute
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT numero_etudiant 
        FROM etudiants 
        WHERE numero_etudiant LIKE ?
        ORDER BY numero_etudiant DESC 
        LIMIT 1`,
        [`${yearPart}${randomLetter}%`]
      );
    let sequenceNumber: number;

    // Vérification plus stricte
    if (Array.isArray(rows) && rows.length > 0) {
      const firstRow = rows[0] as RowDataPacket;
      if (firstRow && firstRow.numero_etudiant) {
        const lastNumero = firstRow.numero_etudiant as string;
        const lastSequence = parseInt(lastNumero.slice(3), 10);
        
        // Vérifier que le parsing a réussi
        if (!isNaN(lastSequence)) {
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
      'SELECT * FROM etudiants WHERE email = ?',
      [email]
    );
    return (rows as RowDataPacket[])[0] || null;
  }

  // Récupérer tous les étudiants avec pagination
  static async findAll(page = 1, limit = 10, filters = {} as any) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM etudiants WHERE 1=1';
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
      data: rows as RowDataPacket[],
      pagination: {
        page: isNaN(page) ? parseInt(page.toString()) : page ?? 1,
        limit: isNaN(limit) ? parseInt(limit.toString()) : limit ?? 10,
        total: (countRows as RowDataPacket[])[0]?.total,
        totalPages: Math.ceil((countRows as RowDataPacket[])[0]?.total / limit)
      }
    };
  }

  // Mettre à jour un étudiant
  static async update(id: number, etudiantData: Partial<IEtudiantUpdaterequest>) {
    const fields: string[] = [];
    const values = [];

    Object.entries(etudiantData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const query = `UPDATE etudiants SET ${fields.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  // Supprimer un étudiant
  static async delete(id: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM etudiants WHERE id = ?',
      [id]
    );
    return (result.affectedRows ?? 0) > 0;
  }

  // Changer le statut d'un étudiant
  static async toggleStatut(id: number, statut?: StatutEtudiant) {
    const etudiant = await this.findById(id);
    if (!etudiant) return null;

    const nouveauxStatuts = {
      'actif': 'inactif',
      'inactif': 'actif',
      'diplome': 'diplome',
      'abandon': 'abandon'
    };

    const nouveauStatut = statut || 'actif';
    
    await pool.execute(
      'UPDATE etudiants SET statut = ? WHERE id = ?',
      [nouveauStatut, id]
    );

    return this.findById(id);
  }

  // Obtenir les cours d'un étudiant
  static async getCours(id: number) {
    const [rows] = await pool.execute(
      `SELECT c.*, i.date_inscription, i.statut as statut_inscription
       FROM cours c
       INNER JOIN inscriptions i ON c.id = i.cours_id
       WHERE i.etudiant_id = ?
       ORDER BY c.semestre, c.nom`,
      [id]
    );
    return rows;
  }

  // Obtenir les notes d'un étudiant
  static async getNotes(id: number) {
    const [rows] = await pool.execute<RowDataPacket[] | any>(
      `SELECT n.*, c.nom as cours_nom, c.code as cours_code, c.credits
       FROM notes n
       INNER JOIN cours c ON n.cours_id = c.id
       WHERE n.etudiant_id = ?
       ORDER BY c.nom`,
      [id]
    );
    return rows as RowDataPacket[];
  }

  // Calculer la moyenne générale d'un étudiant
  static async getMoyenneGenerale(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        AVG(note_finale) as moyenne,
        COUNT(*) as nombre_cours,
        SUM(CASE WHEN note_finale >= 10 THEN credits ELSE 0 END) as credits_obtenus,
        SUM(credits) as credits_totaux
       FROM notes n
       INNER JOIN cours c ON n.cours_id = c.id
       WHERE n.etudiant_id = ? AND n.validee = TRUE`,
      [id]
    );
    return (rows as RowDataPacket[])[0];
  }

  // Obtenir les statistiques des étudiants
  static async getStatistiques() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        filiere,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN statut = 'diplome' THEN 1 ELSE 0 END) as diplomes,
        SUM(CASE WHEN statut = 'abandon' THEN 1 ELSE 0 END) as abandons,
        AVG(TIMESTAMPDIFF(YEAR, date_naissance, CURDATE())) as age_moyen
       FROM etudiants
       GROUP BY filiere
       ORDER BY total DESC`
    );

    const [totalRow] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM etudiants');
    // IMPORTANT : Calculer les totaux globaux
    const [statsRow] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN statut = 'diplome' THEN 1 ELSE 0 END) as diplomes,
        SUM(CASE WHEN statut = 'inactif' THEN 1 ELSE 0 END) as inactifs
      FROM etudiants`
    );
    return {
      total: (totalRow as RowDataPacket[])[0]?.total,
      actifs: (statsRow as RowDataPacket[])[0]?.actifs ?? 0,
      diplomes: (statsRow as RowDataPacket[])[0]?.diplomes ?? 0,
      inactifs: (statsRow as RowDataPacket[])[0]?.inactifs ?? 0,
      parFiliere: rows as RowDataPacket[],
      
    };
  }

  // Recherche avancée d'étudiants
  static async search(criteria: Partial<IEtudiant> & { minAge?: number; maxAge?: number }) {
    let query = `
      SELECT *, 
        TIMESTAMPDIFF(YEAR, date_naissance, CURDATE()) as age,
        CONCAT(prenom, ' ', nom) as nom_complet
      FROM etudiants 
      WHERE 1=1
    `;
    const params = [];

    if (criteria.nom) {
      query += ' AND nom LIKE ?';
      params.push(`%${criteria.nom}%`);
    }
    if (criteria.prenom) {
      query += ' AND prenom LIKE ?';
      params.push(`%${criteria.prenom}%`);
    }
    if (criteria.filiere) {
      query += ' AND filiere = ?';
      params.push(criteria.filiere);
    }
    if (criteria.niveau) {
      query += ' AND niveau = ?';
      params.push(criteria.niveau);
    }
    if (criteria.statut) {
      query += ' AND statut = ?';
      params.push(criteria.statut);
    }
    if (criteria.minAge) {
      query += ' AND TIMESTAMPDIFF(YEAR, date_naissance, CURDATE()) >= ?';
      params.push(criteria.minAge);
    }
    if (criteria.maxAge) {
      query += ' AND TIMESTAMPDIFF(YEAR, date_naissance, CURDATE()) <= ?';
      params.push(criteria.maxAge);
    }

    query += ' ORDER BY nom, prenom LIMIT 100';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as RowDataPacket[];
  }
}

export default Etudiant;