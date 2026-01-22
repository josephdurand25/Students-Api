// scripts/seed.ts
import mysql, { Connection } from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import { IAnneeAcademiqueCreate } from '../src/types/IAnneeAcademic';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

class DatabaseSeeder {
  private connection: Connection | null = null;
  protected static user_table = 'Utilisateur';
  protected static salle_table = 'Salle';
  protected static enseignant_table = 'Enseignant';
  protected static administrateur_table = 'Administrateur';
  protected static etudiant_table = 'Etudiant';
  protected static filiere_table = 'Filiere';
  protected static specialite_table = 'Specialite';
  protected static annee_academique_table = 'AnneeAcademique';
  protected static matiere_table = 'Matiere';
  protected static unite_enseignement_table = 'UniteEnseignement';
  protected static inscription_groupeue_table = 'Inscription_GroupeUE';
  protected static inscription_table = 'Inscription';
  protected static paiement_droits_table = 'PaiementDroits';
  protected static session_examen_table = 'SessionExamen';
  protected static note_table = 'Note';
  protected static seance_table = 'Seance';
  protected static groupe_ue_table = 'GroupeUE';
  protected static presence_table = 'Presence';
  protected static matiere_session_examen_table = 'Matiere_SessionExamen';
  protected static dossier_candidature_table = 'DossierCandidature';
  
  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        port: this.config.port
      });
      console.log('✅ Connecté à la base de données');
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Déconnecté de la base de données');
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.connection) {
      throw new Error('Non connecté à la base de données');
    }
    
    try {
      const [rows] = await this.connection.execute(query, params);
      return rows;
    } catch (error: any) {
      // Pour les erreurs signalées par des triggers (SQLSTATE '45000', errno 1644),
      // éviter d'écrire la pile d'erreur dans la console afin que le seeder
      // puisse gérer proprement le cas (loggettage contrôlé au niveau appelant).
      if (error && (error.sqlState === '45000' || error.errno === 1644)) {
        // Rethrow sans log bruyant ; le caller (seed) gère et loggue proprement.
        throw error;
      }
      console.error('❌ Erreur d\'exécution de requête:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async clearDatabaseV1(): Promise<void> {
    console.log('🧹 Nettoyage de la base de données...');
    
    // Désactiver les contraintes de clés étrangères
    await this.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    // Supprimer toutes les données dans l'ordre inverse des dépendances
    const tables = [
      'Presence', 'Note', 'Matiere_SessionExamen', 'PaiementDroits',
      'Inscription_GroupeUE', 'Seance', 'Matiere', 'UniteEnseignement',
      'GroupeUE', 'Specialite', 'SessionExamen', 'AnneeAcademique',
      'DossierCandidature', 'Salle', 'Etudiant', 'Enseignant', 
      'Administrateur', 'Utilisateur'
    ];
    
    for (const table of tables) {
      try {
        await this.executeQuery(`DELETE FROM ${table}`);
        console.log(`   Supprimé ${table}`);
      } catch (error) {
        console.log(`   ${table} déjà vide ou n'existe pas`);
      }
    }
    
    // Réactiver les contraintes
    await this.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Base de données nettoyée');
  }

  async clearDatabase(): Promise<void> {
    console.log('🧹 Nettoyage de la base de données...');
    
    // Désactiver les contraintes de clés étrangères
    await this.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    // NOUVELLE LISTE AVEC FILIERE
    const tables = [
      'Presence', 'Note', 'Matiere_SessionExamen', 'PaiementDroits',
      'Inscription_GroupeUE', 'Seance', 'Matiere', 'UniteEnseignement',
      'GroupeUE', 'Specialite', 'Filiere', 'SessionExamen',  // Filiere ajouté
      'AnneeAcademique', 'DossierCandidature', 'Salle', 
      'Etudiant', 'Enseignant', 'Administrateur', 'Utilisateur', 'Inscription'
    ];
    
    for (const table of tables) {
      try {
        await this.executeQuery(`DELETE FROM ${table}`);
        console.log(`   Supprimé ${table}`);
      } catch (error) {
        console.log(`   ${table} déjà vide ou n'existe pas`);
      }
    }
    
    // Réactiver les contraintes
    await this.executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Base de données nettoyée');
  }

  async seedUtilisateurs(): Promise<void> {
    console.log('👥 Création des utilisateurs...');
    
    const utilisateurs = [
      // Administrateurs
      {
        nom: 'ADJI',
        prenom: 'Durand',
        email: 'super-sigif@univ.edu',
        password: 'admin123',
        telephone: '691799325',
        role: 'SUPER',
        statut: 'ACTIF'
      },
      {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'admin.dupont@univ.edu',
        password: 'admin123',
        telephone: '0123456789',
        role: 'ADMINISTRATEUR',
        statut: 'ACTIF'
      },
      {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'admin.martin@univ.edu',
        password: 'admin123',
        telephone: '0234567891',
        role: 'ADMINISTRATEUR',
        statut: 'ACTIF'
      },
      
      // Enseignants
      {
        nom: 'Dubois',
        prenom: 'Pierre',
        email: 'p.dubois@univ.edu',
        password: 'prof123',
        telephone: '0345678912',
        role: 'ENSEIGNANT',
        statut: 'ACTIF'
      },
      {
        nom: 'Leroy',
        prenom: 'Marie',
        email: 'm.leroy@univ.edu',
        password: 'prof123',
        telephone: '0456789123',
        role: 'ENSEIGNANT',
        statut: 'ACTIF'
      },
      {
        nom: 'Moreau',
        prenom: 'Thomas',
        email: 't.moreau@univ.edu',
        password: 'prof123',
        telephone: '0567891234',
        role: 'ENSEIGNANT',
        statut: 'ACTIF'
      },
      {
        nom: 'Simon',
        prenom: 'Julie',
        email: 'j.simon@univ.edu',
        password: 'prof123',
        telephone: '0678912345',
        role: 'ENSEIGNANT',
        statut: 'ACTIF'
      },
      
      // Étudiants (20 étudiants)
      ...Array.from({ length: 20 }, (_, i) => ({
        nom: `Étudiant${i + 1}`,
        prenom: ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul', 'Julie', 'Luc', 'Anne'][i % 8],
        email: `etudiant${i + 1}@univ.edu`,
        password: 'etudiant123',
        telephone: `0${(i + 1).toString().padStart(9, '0')}`,
        role: 'ETUDIANT',
        statut: 'ACTIF'
      }))
    ];

    const userIds: number[] = [];

    for (const user of utilisateurs) {
      const hashedPassword = await this.hashPassword(user.password);
      
      const query = `
        INSERT INTO ${DatabaseSeeder.user_table} (nom, prenom, email, password_hash, telephone, role, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await this.executeQuery(query, [
        user.nom,
        user.prenom,
        user.email,
        hashedPassword,
        user.telephone,
        user.role,
        user.statut
      ]);
      
      userIds.push((result as any).insertId);
    }

    console.log(`✅ ${utilisateurs.length} utilisateurs créés`);
    return userIds as any;
  }

  async seedEnseignants(): Promise<number[]> {
    console.log('👨‍🏫 Création des enseignants...');
    
    // Récupérer les IDs des utilisateurs enseignants
    const query = `
      SELECT id FROM ${DatabaseSeeder.user_table} 
      WHERE role = 'ENSEIGNANT' 
      ORDER BY id
    `;
    const rows = await this.executeQuery(query);
    const enseignantIds = rows.map((row: any) => row.id);

    const enseignants = [
      {
        id: enseignantIds[0],
        matricule: 'ENS-001',
        departement: 'Informatique',
        bureau: 'B101',
        specialite: 'Algorithmique et Programmation',
        grade: 'Professeur'
      },
      {
        id: enseignantIds[1],
        matricule: 'ENS-002',
        departement: 'Informatique',
        bureau: 'B102',
        specialite: 'Bases de Données',
        grade: 'Maître de Conférences'
      },
      {
        id: enseignantIds[2],
        matricule: 'ENS-003',
        departement: 'Mathématiques',
        bureau: 'M201',
        specialite: 'Mathématiques Appliquées',
        grade: 'Professeur'
      },
      {
        id: enseignantIds[3],
        matricule: 'ENS-004',
        departement: 'Physique',
        bureau: 'P301',
        specialite: 'Physique Quantique',
        grade: 'Maître de Conférences'
      }
    ];

    for (const enseignant of enseignants) {
      const query = `
        INSERT INTO ${DatabaseSeeder.enseignant_table} (id, matricule, departement, bureau, specialite, grade)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        enseignant.id,
        enseignant.matricule,
        enseignant.departement,
        enseignant.bureau,
        enseignant.specialite,
        enseignant.grade
      ]);
    }

    console.log(`✅ ${enseignants.length} enseignants créés`);
    return enseignantIds;
  }

  async seedAdministrateurs(): Promise<void> {
    console.log('👨‍💼 Création des administrateurs...');
    
    // Récupérer les IDs des utilisateurs administrateurs
    const query = `
      SELECT id FROM ${DatabaseSeeder.user_table} 
      WHERE role = 'ADMINISTRATEUR' 
      ORDER BY id
    `;
    const rows = await this.executeQuery(query);
    const adminIds = rows.map((row: any) => row.id);

    const administrateurs = [
      {
        id: adminIds[0],
        departement: 'Scolarité',
        fonction: 'Responsable de la scolarité'
      },
      {
        id: adminIds[1],
        departement: 'Informatique',
        fonction: 'Administrateur système'
      }
    ];

    for (const admin of administrateurs) {
      const query = `
        INSERT INTO ${DatabaseSeeder.administrateur_table} (id, departement, fonction)
        VALUES (?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        admin.id,
        admin.departement,
        admin.fonction
      ]);
    }

    console.log(`✅ ${administrateurs.length} administrateurs créés`);
  }

  async seedEtudiantsV1(): Promise<number[]> {
    console.log('👨‍🎓 Création des étudiants...');
    
    // Récupérer les IDs des utilisateurs étudiants
    const query = `
      SELECT id FROM ${DatabaseSeeder.user_table} 
      WHERE role = 'ETUDIANT' 
      ORDER BY id
    `;
    const rows = await this.executeQuery(query);
    const etudiantIds = rows.map((row: any) => row.id);

    const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const nationalites = ['Française', 'Canadienne', 'Belge', 'Suisse', 'Algérienne', 'Marocaine'];
    const regions = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie'];

    for (let i = 0; i < etudiantIds.length; i++) {
      const etudiantId = etudiantIds[i];
      const numeroEtudiant = `ETU${(i + 1).toString().padStart(3, '0')}`;
      const dateNaissance = new Date(1995 + (i % 10), i % 12, (i % 28) + 1);
      const genre = i % 2 === 0 ? 'M' : 'F';
      const niveau = niveaux[i % niveaux.length];
      const nationalite = nationalites[i % nationalites.length];
      const region = regions[i % regions.length];
      const statutAcademique = i < 15 ? 'ACTIF' : 'BLOQUE';
      
      // Récupérer une spécialité pour l'étudiant
      const specialiteQuery = `SELECT code FROM ${DatabaseSeeder.specialite_table} ORDER BY RAND() LIMIT 1`;
      const specialiteRows = await this.executeQuery(specialiteQuery);
      const specialiteCode = specialiteRows[0]?.code || 'INF-SI';
      
      const query = `
        INSERT INTO ${DatabaseSeeder.etudiant_table} (
          id, numero_etudiant, date_naissance, lieu_naissance, genre, 
          nationalite, adresse_complete, region_origine, niveau, 
          statut_academique, date_inscription, specialite_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        etudiantId,
        numeroEtudiant,
        dateNaissance.toISOString().split('T')[0],
        'Paris',
        genre,
        nationalite,
        `${i + 1} Rue de l'Université, 75000 Paris`,
        region,
        niveau,
        statutAcademique,
        new Date(2023, 8, 1).toISOString().split('T')[0],
        specialiteCode
      ]);
    }

    console.log(`✅ ${etudiantIds.length} étudiants créés`);
    return etudiantIds;
  }

  async seedEtudiants(): Promise<number[]> {
    console.log('👨‍🎓 Création des étudiants...');
    
    // Récupérer les IDs des utilisateurs étudiants
    const query = `
      SELECT id FROM ${DatabaseSeeder.user_table} 
      WHERE role = 'ETUDIANT' 
      ORDER BY id
    `;
    const rows = await this.executeQuery(query);
    const etudiantIds = rows.map((row: any) => row.id);

    // Récupérer les spécialités par filière
    const specialiteQuery = `
      SELECT s.code, s.nom, f.code as filiere_code 
      FROM ${DatabaseSeeder.specialite_table} s
      JOIN ${DatabaseSeeder.filiere_table} f ON s.filiere_code = f.code
      ORDER BY f.code, s.code
    `;
    const specialites = await this.executeQuery(specialiteQuery);
    
    // Grouper les spécialités par filière
    const specialitesParFiliere: {[key: string]: any[]} = {};
    specialites.forEach((spec: any) => {
      if (!spec.filiere_code) return; 
      if (!specialitesParFiliere[spec.filiere_code]) {
        specialitesParFiliere[spec.filiere_code] = [];
      }
      specialitesParFiliere[spec.filiere_code]!.push(spec);
    });

    const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const nationalites = ['Française', 'Canadienne', 'Belge', 'Suisse', 'Algérienne', 'Marocaine'];
    const regions = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie'];
    
    // Filères disponibles
    const filieres = Object.keys(specialitesParFiliere);

    for (let i = 0; i < etudiantIds.length; i++) {
      const etudiantId = etudiantIds[i];
      const numeroEtudiant = `ETU${(i + 1).toString().padStart(4, '0')}`;
      const dateNaissance = new Date(1995 + (i % 10), i % 12, (i % 28) + 1);
      const genre = i % 2 === 0 ? 'M' : 'F';
      const niveau = niveaux[i % niveaux.length];
      const nationalite = nationalites[i % nationalites.length];
      const region = regions[i % regions.length];
      const statutAcademique = i < 15 ? 'ACTIF' : 'BLOQUE';
      
      // Choisir une filière et une spécialité cohérente
      const filiereIndex = i % filieres.length;
      const filiereCode = filieres[filiereIndex];
      if (!filiereCode) continue;
      const specialitesFiliere = specialitesParFiliere[filiereCode];
      if (!specialitesFiliere || specialitesFiliere.length === 0) continue;
      const specialite = specialitesFiliere[i % specialitesFiliere.length];
      
      const query = `
        INSERT INTO ${DatabaseSeeder.etudiant_table} (
          id, numero_etudiant, date_naissance, lieu_naissance, genre, 
          nationalite, adresse_complete, region_origine, niveau, 
          statut_academique, date_inscription, specialite_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        etudiantId,
        numeroEtudiant,
        dateNaissance.toISOString().split('T')[0],
        'Paris',
        genre,
        nationalite,
        `${i + 1} Rue de l'Université, 75000 Paris`,
        region,
        niveau,
        statutAcademique,
        new Date(2023, 8, 1).toISOString().split('T')[0],
        specialite.code
      ]);
    }

    console.log(`✅ ${etudiantIds.length} étudiants créés`);
    return etudiantIds;
  }

  async seedSpecialites(): Promise<string[]> {
    console.log('📚 Création des spécialités...');
    
    // Récupérer les filières
    const filiereQuery = `SELECT code FROM ${DatabaseSeeder.filiere_table}`;
    const filiereRows = await this.executeQuery(filiereQuery);
    const filiereCodes = filiereRows.map((row: any) => row.code);

    const specialites = [
      // Informatique
      {
        code: 'INF-SI',
        nom: 'Systèmes d\'Information',
        filiere_code: 'INFO',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1', 'M2'])
      },
      {
        code: 'INF-RI',
        nom: 'Réseaux et Internet',
        filiere_code: 'INFO',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L3', 'M1', 'M2'])
      },
      {
        code: 'INF-IA',
        nom: 'Intelligence Artificielle',
        filiere_code: 'INFO',
        type: 'RECHERCHE',
        niveaux_offerts: JSON.stringify(['M1', 'M2'])
      },
      {
        code: 'INF-DEV',
        nom: 'Développement Logiciel',
        filiere_code: 'INFO',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L2', 'L3', 'M1'])
      },
      
      // Mathématiques
      {
        code: 'MATHS-APP',
        nom: 'Mathématiques Appliquées',
        filiere_code: 'MATHS',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1', 'M2'])
      },
      {
        code: 'MATHS-FOND',
        nom: 'Mathématiques Fondamentales',
        filiere_code: 'MATHS',
        type: 'RECHERCHE',
        niveaux_offerts: JSON.stringify(['M1', 'M2'])
      },
      
      // Physique
      {
        code: 'PHYS-QUANT',
        nom: 'Physique Quantique',
        filiere_code: 'PHYS',
        type: 'RECHERCHE',
        niveaux_offerts: JSON.stringify(['M1', 'M2'])
      },
      {
        code: 'PHYS-MAT',
        nom: 'Physique des Matériaux',
        filiere_code: 'PHYS',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L3', 'M1'])
      },
      
      // Économie
      {
        code: 'ECO-GEST',
        nom: 'Gestion d\'Entreprise',
        filiere_code: 'ECO',
        type: 'PROFESSIONNEL',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1'])
      }
    ];

    for (const specialite of specialites) {
      if (!filiereCodes.includes(specialite.filiere_code)) {
        console.warn(`⚠️  Filière ${specialite.filiere_code} non trouvée pour spécialité ${specialite.code}`);
        continue;
      }
      
      const query = `
        INSERT INTO ${DatabaseSeeder.specialite_table} (code, nom, filiere_code, niveaux_offerts)
        VALUES (?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        specialite.code,
        specialite.nom,
        specialite.filiere_code,
        specialite.niveaux_offerts
      ]);
    }

    console.log(`✅ ${specialites.length} spécialités créées`);
    return specialites.map(s => s.code);
  }

  async seedFilieres(): Promise<string[]> {
    console.log('🎓 Création des filières...');
    
    // Récupérer un enseignant pour responsable
    const enseignantQuery = `SELECT id FROM ${DatabaseSeeder.enseignant_table} LIMIT 1`;
    const enseignantRows = await this.executeQuery(enseignantQuery);
    const responsableId = enseignantRows[0]?.id || null;

    const filieres = [
      {
        code: 'INFO',
        nom: 'Informatique',
        departement: 'Département d\'Informatique',
        responsable_id: responsableId,
        description: 'Formation en informatique fondamentale et appliquée'
      },
      {
        code: 'MATHS',
        nom: 'Mathématiques',
        departement: 'Département de Mathématiques',
        responsable_id: responsableId,
        description: 'Formation en mathématiques pures et appliquées'
      },
      {
        code: 'PHYS',
        nom: 'Physique',
        departement: 'Département de Physique',
        responsable_id: responsableId,
        description: 'Formation en physique fondamentale et expérimentale'
      },
      {
        code: 'ECO',
        nom: 'Économie-Gestion',
        departement: 'Département d\'Économie',
        responsable_id: responsableId,
        description: 'Formation en économie, gestion et finance'
      }
    ];

    for (const filiere of filieres) {
      const query = `
        INSERT INTO ${DatabaseSeeder.filiere_table} (code, nom, departement, responsable_id, description)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        filiere.code,
        filiere.nom,
        filiere.departement,
        filiere.responsable_id,
        filiere.description
      ]);
    }

    console.log(`✅ ${filieres.length} filières créées`);
    return filieres.map(f => f.code);
  }

  async seedAnneesAcademiques(): Promise<string[]> {
    console.log('📅 Création des années académiques...');
    
    const annees: IAnneeAcademiqueCreate[] = [
      {
        code: '2023-2024',
        date_debut: '2023-09-01',
        date_fin: '2024-08-31',
        statut: 'EN_COURS'
      },
      {
        code: '2022-2023',
        date_debut: '2022-09-01',
        date_fin: '2023-08-31',
        statut: 'TERMINEE'
      },
      {
        code: '2024-2025',
        date_debut: '2024-09-01',
        date_fin: '2025-08-31',
        statut: 'PLANIFIEE'
      }
    ];

    for (const annee of annees) {
      const query = `
        INSERT INTO ${DatabaseSeeder.annee_academique_table} (annee, date_debut, date_fin, statut)
        VALUES (?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        annee.code,
        annee.date_debut,
        annee.date_fin,
        annee.statut
      ]);
    }

    console.log(`✅ ${annees.length} années académiques créées`);
    return annees.map(a => a.code);
  }

  async seedSessionExamen(): Promise<void> {
    console.log('📋 Création des sessions d\'examen...');
    
    // Récupérer l'année académique
    const anneeQuery = `SELECT annee FROM ${DatabaseSeeder.annee_academique_table} LIMIT 1`;
    const annees = await this.executeQuery(anneeQuery);
    const anneeAcademique = annees[0]?.annee || '2023-2024';
    
    const sessions = [
      {
        libelle: '01-2024',
        type: 'NORMALE',
        date_debut: '2024-01-08',
        date_fin: '2024-01-22',
        annee_academique: anneeAcademique,
        statut: 'TERMINEE'
      },
      {
        libelle: '06-2024',
        type: 'RATTRAPAGE',
        date_debut: '2024-06-10',
        date_fin: '2024-06-24',
        annee_academique: anneeAcademique,
        statut: 'EN_COURS'
      }
    ];

    for (const session of sessions) {
      const query = `
        INSERT INTO ${DatabaseSeeder.session_examen_table} (libelle, type, date_debut, date_fin, annee_academique, statut)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        session.libelle,
        session.type,
        session.date_debut,
        session.date_fin,
        session.annee_academique,
        session.statut
      ]);
    }

    console.log(`✅ ${sessions.length} sessions d'examen créées`);
  }

  async seedSalles(): Promise<string[]> {
    console.log('🏫 Création des salles...');
    
    const salles = [
      { code: 'A101', nom: 'Amphi 101', capacite: 200, type: 'AMPHI', equipements: JSON.stringify(['Vidéoprojecteur', 'Micro', 'Tableau numérique']) },
      { code: 'A102', nom: 'Amphi 102', capacite: 150, type: 'AMPHI', equipements: JSON.stringify(['Vidéoprojecteur', 'Tableau blanc']) },
      { code: 'TD201', nom: 'Salle TD 201', capacite: 40, type: 'TD', equipements: JSON.stringify(['Vidéoprojecteur', 'Tableau blanc']) },
      { code: 'TD202', nom: 'Salle TD 202', capacite: 35, type: 'TD', equipements: JSON.stringify(['Vidéoprojecteur']) },
      { code: 'TP301', nom: 'Labo Info 301', capacite: 25, type: 'TP', equipements: JSON.stringify(['Ordinateurs', 'Switch réseau', 'Imprimante']) },
      { code: 'TP302', nom: 'Labo Physique 302', capacite: 20, type: 'TP', equipements: JSON.stringify(['Oscilloscope', 'Générateur de fonctions', 'Multimètres']) },
      { code: 'LAB401', nom: 'Labo Recherche 401', capacite: 15, type: 'LABO', equipements: JSON.stringify(['Équipements spéciaux', 'Postes de travail']) }
    ];

    for (const salle of salles) {
      const query = `
        INSERT INTO Salle (code, nom, capacite, type, equipements)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        salle.code,
        salle.nom,
        salle.capacite,
        salle.type,
        salle.equipements
      ]);
    }

    console.log(`✅ ${salles.length} salles créées`);
    return salles.map(s => s.code);
  }

  async seedGroupeUEV1(): Promise<string[]> {
    console.log('📁 Création des groupes UE...');
    
    // Récupérer les spécialités existantes
    const specialiteQuery = `SELECT code FROM ${DatabaseSeeder.specialite_table}`;
    const specialiteRows = await this.executeQuery(specialiteQuery);
    const specialiteCodes = specialiteRows.map((row: any) => row.code);

    const groupes = [
      {
        code: 'INF-SI-L1-S1',
        nom: 'Informatique SI - L1 S1',
        niveau: 'L1',
        semestre: 'S1',
        credits_total: 30,
        capacite_max: 40,
        statut: 'ACTIF',
        specialite_code: 'INF-SI'
      },
      {
        code: 'INF-SI-L2-S3',
        nom: 'Informatique SI - L2 S3',
        niveau: 'L2',
        semestre: 'S3',
        credits_total: 30,
        capacite_max: 35,
        statut: 'ACTIF',
        specialite_code: 'INF-SI'
      },
      {
        code: 'MATHS-APP-L1-S1',
        nom: 'Mathématiques Appliquées - L1 S1',
        niveau: 'L1',
        semestre: 'S1',
        credits_total: 30,
        capacite_max: 30,
        statut: 'ACTIF',
        specialite_code: 'MATHS-APP'
      },
      {
        code: 'PHYS-QUANT-M1-S9',
        nom: 'Physique Quantique - M1 S9',
        niveau: 'M1',
        semestre: 'S9',
        credits_total: 30,
        capacite_max: 25,
        statut: 'ACTIF',
        specialite_code: 'PHYS-QUANT'
      }
    ];

    for (const groupe of groupes) {
      if (!specialiteCodes.includes(groupe.specialite_code)) {
        console.warn(`⚠️  Spécialité ${groupe.specialite_code} non trouvée`);
        continue;
      }
      
      const query = `
        INSERT INTO ${DatabaseSeeder.groupe_ue_table} (code, nom, niveau, semestre, credits_total, capacite_max, statut, specialite_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        groupe.code,
        groupe.nom,
        groupe.niveau,
        groupe.semestre,
        groupe.credits_total,
        groupe.capacite_max,
        groupe.statut,
        groupe.specialite_code
      ]);
    }

    console.log(`✅ ${groupes.length} groupes UE créés`);
    return groupes.map(g => g.code);
  }

  async seedGroupeUE(): Promise<string[]> {
    console.log('📁 Création des groupes UE...');
    
    // Récupérer les spécialités avec leurs filières
    const specialiteQuery = `
      SELECT s.code as specialite_code, s.nom as specialite_nom, 
            f.code as filiere_code, f.nom as filiere_nom
      FROM ${DatabaseSeeder.specialite_table} s
      JOIN ${DatabaseSeeder.filiere_table} f ON s.filiere_code = f.code
    `;
    const specialites = await this.executeQuery(specialiteQuery);

    const groupes = [
      // Informatique - SI
      {
        code: 'INF-SI-L1-S1',
        nom: 'Systèmes d\'Information - L1 S1',
        niveau: 'L1',
        semestre: 'S1',
        credits_total: 30,
        capacite_max: 40,
        statut: 'ACTIF',
        specialite_code: 'INF-SI'
      },
      {
        code: 'INF-SI-M1-S9',
        nom: 'Systèmes d\'Information - M1 S9',
        niveau: 'M1',
        semestre: 'S9',
        credits_total: 30,
        capacite_max: 25,
        statut: 'ACTIF',
        specialite_code: 'INF-SI'
      },
      
      // Informatique - RI
      {
        code: 'INF-RI-L3-S5',
        nom: 'Réseaux et Internet - L3 S5',
        niveau: 'L3',
        semestre: 'S5',
        credits_total: 30,
        capacite_max: 35,
        statut: 'ACTIF',
        specialite_code: 'INF-RI'
      },
      
      // Mathématiques Appliquées
      {
        code: 'MATHS-APP-L1-S1',
        nom: 'Mathématiques Appliquées - L1 S1',
        niveau: 'L1',
        semestre: 'S1',
        credits_total: 30,
        capacite_max: 30,
        statut: 'ACTIF',
        specialite_code: 'MATHS-APP'
      },
      {
        code: 'MATHS-APP-M2-S10',
        nom: 'Mathématiques Appliquées - M2 S10',
        niveau: 'M2',
        semestre: 'S10',
        credits_total: 30,
        capacite_max: 20,
        statut: 'ACTIF',
        specialite_code: 'MATHS-APP'
      },
      
      // Physique Quantique
      {
        code: 'PHYS-QUANT-M1-S9',
        nom: 'Physique Quantique - M1 S9',
        niveau: 'M1',
        semestre: 'S9',
        credits_total: 30,
        capacite_max: 15,
        statut: 'ACTIF',
        specialite_code: 'PHYS-QUANT'
      }
    ];

    for (const groupe of groupes) {
      // Vérifier que la spécialité existe
      const specialiteExists = specialites.some((s: any) => s.specialite_code === groupe.specialite_code);
      
      if (!specialiteExists) {
        console.warn(`⚠️  Spécialité ${groupe.specialite_code} non trouvée pour groupe ${groupe.code}`);
        continue;
      }
      
      const query = `
        INSERT INTO ${DatabaseSeeder.groupe_ue_table} (code, nom, niveau, semestre, credits_total, capacite_max, statut, specialite_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        groupe.code,
        groupe.nom,
        groupe.niveau,
        groupe.semestre,
        groupe.credits_total,
        groupe.capacite_max,
        groupe.statut,
        groupe.specialite_code
      ]);
    }

    console.log(`✅ ${groupes.length} groupes UE créés`);
    return groupes.map(g => g.code);
  }


  async seedUnitesEnseignement(): Promise<string[]> {
    console.log('📘 Création des unités d\'enseignement...');
    
    const ues = [
      {
        code: 'INF101',
        nom: 'Algorithmique et Programmation',
        type: 'OBLIGATOIRE',
        credits: 6,
        volume_horaire_total: 60,
        description: 'Introduction à l\'algorithmique et à la programmation en C'
      },
      {
        code: 'INF102',
        nom: 'Bases de Données',
        type: 'OBLIGATOIRE',
        credits: 5,
        volume_horaire_total: 50,
        description: 'Introduction aux bases de données relationnelles'
      },
      {
        code: 'INF103',
        nom: 'Mathématiques pour l\'Informatique',
        type: 'OBLIGATOIRE',
        credits: 4,
        volume_horaire_total: 40,
        description: 'Mathématiques discrètes et algèbre linéaire'
      },
      {
        code: 'INF201',
        nom: 'Programmation Orientée Objet',
        type: 'OBLIGATOIRE',
        credits: 6,
        volume_horaire_total: 60,
        description: 'Programmation orientée objet avec Java'
      },
      {
        code: 'INF202',
        nom: 'Développement Web',
        type: 'OBLIGATOIRE',
        credits: 5,
        volume_horaire_total: 50,
        description: 'Développement front-end et back-end'
      },
      {
        code: 'MAT101',
        nom: 'Algèbre Linéaire',
        type: 'OBLIGATOIRE',
        credits: 6,
        volume_horaire_total: 60,
        description: 'Espaces vectoriels, matrices, applications linéaires'
      }
    ];

    for (const ue of ues) {
      const query = `
        INSERT INTO ${DatabaseSeeder.unite_enseignement_table} (code, nom, type, credits, volume_horaire_total, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        ue.code,
        ue.nom,
        ue.type,
        ue.credits,
        ue.volume_horaire_total,
        ue.description
      ]);
    }

    console.log(`✅ ${ues.length} unités d'enseignement créées`);
    return ues.map(ue => ue.code);
  }

  async seedMatieres(): Promise<string[]> {
    console.log('📖 Création des matières...');
    
    const ueQuery = `SELECT code FROM ${DatabaseSeeder.unite_enseignement_table}`;
    const ueRows = await this.executeQuery(ueQuery);
    const ueCodes = ueRows.map((row: any) => row.code);
    
    const salleQuery = `SELECT code FROM ${DatabaseSeeder.salle_table}`;
    const salleRows = await this.executeQuery(salleQuery);
    const salleCodes = salleRows.map((row: any) => row.code);

    const enseignantQuery = `SELECT id FROM ${DatabaseSeeder.enseignant_table}`;
    const enseignantRows = await this.executeQuery(enseignantQuery);
    const enseignantIds = enseignantRows.map((row: any) => row.id);
    
    const matieres = [
      // Algorithmique et Programmation
      {
        code: 'INF101-CM',
        nom: 'Algorithmique - Cours Magistral',
        type_cours: 'CM',
        credits: 3,
        coefficient: 0.8,
        volume_horaire: 30,
        salle: 'A101',
        jour: 'LUNDI',
        heure_debut: '08:30',
        heure_fin: '10:30',
        ue_code: 'INF101',
        enseignant_id: enseignantIds[0]
      },
      {
        code: 'INF101-TD',
        nom: 'Algorithmique - Travaux Dirigés',
        type_cours: 'TD',
        credits: 2,
        coefficient: 0.4,
        volume_horaire: 20,
        salle: 'TD201',
        jour: 'MERCREDI',
        heure_debut: '14:00',
        heure_fin: '16:00',
        ue_code: 'INF101',
        enseignant_id: enseignantIds[0]
      },
      {
        code: 'INF101-TP',
        nom: 'Algorithmique - Travaux Pratiques',
        type_cours: 'TP',
        credits: 1,
        coefficient: 0.3,
        volume_horaire: 10,
        salle: 'TP301',
        jour: 'VENDREDI',
        heure_debut: '10:00',
        heure_fin: '12:00',
        ue_code: 'INF101',
        enseignant_id: enseignantIds[0]
      },
      
      // Bases de Données
      {
        code: 'INF102-CM',
        nom: 'Bases de Données - Cours Magistral',
        type_cours: 'CM',
        credits: 3,
        coefficient: 0.8,
        volume_horaire: 25,
        salle: 'A102',
        jour: 'MARDI',
        heure_debut: '10:30',
        heure_fin: '12:30',
        ue_code: 'INF102',
        enseignant_id: enseignantIds[1]
      },
      {
        code: 'INF102-TD',
        nom: 'Bases de Données - Travaux Dirigés',
        type_cours: 'TD',
        credits: 1,
        coefficient: 0.3,
        volume_horaire: 15,
        salle: 'TD202',
        jour: 'JEUDI',
        heure_debut: '08:30',
        heure_fin: '10:30',
        ue_code: 'INF102',
        enseignant_id: enseignantIds[1]
      }
    ];

    for (const matiere of matieres) {
      if (!ueCodes.includes(matiere.ue_code)) {
        console.warn(`⚠️  UE ${matiere.ue_code} non trouvée`);
        continue;
      }
      
      const query = `
        INSERT INTO ${DatabaseSeeder.matiere_table} (code, nom, type_cours, credits, coefficient, volume_horaire,
                            salle, jour, heure_debut, heure_fin, ue_code, enseignant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        matiere.code,
        matiere.nom,
        matiere.type_cours,
        matiere.credits,
        matiere.coefficient,
        matiere.volume_horaire,
        matiere.salle,
        matiere.jour,
        matiere.heure_debut,
        matiere.heure_fin,
        matiere.ue_code,
        matiere.enseignant_id
      ]);
    }

    console.log(`✅ ${matieres.length} matières créées`);
    return matieres.map(m => m.code);
  }

  async seedInscriptionsEtGroupes(): Promise<void> {
    console.log('📝 Création des inscriptions et groupes...');
    
    // Récupérer les étudiants actifs
    const etudiantQuery = `
      SELECT id FROM ${DatabaseSeeder.etudiant_table} 
      WHERE statut_academique = 'ACTIF' 
      LIMIT 10
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    // Récupérer l'année académique en cours
    const anneeQuery = `SELECT annee FROM ${DatabaseSeeder.annee_academique_table} WHERE statut = 'EN_COURS' LIMIT 1`;
    const annees = await this.executeQuery(anneeQuery);
    const anneeAcademique = annees[0]?.annee || '2023-2024';
    
    // Récupérer les groupes actifs (depuis la table GroupeUE)
    const groupeQuery = `SELECT code FROM ${DatabaseSeeder.groupe_ue_table} WHERE statut = 'ACTIF' LIMIT 2`;
    const groupes = await this.executeQuery(groupeQuery);

    for (const etudiant of etudiants) {
      // Créer l'inscription
      const numeroInscription = `INS-${etudiant.id.toString().padStart(6, '0')}`;
      
      const inscriptionQuery = `
        INSERT INTO ${DatabaseSeeder.inscription_table} (numero_inscription, etudiant_id, annee_academique, 
                                date_inscription, statut)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(inscriptionQuery, [
        numeroInscription,
        etudiant.id,
        anneeAcademique,
        new Date().toISOString().split('T')[0],
        'VALIDE'
      ]);
      
      // Lier l'étudiant à des groupes (max 2)
      for (let i = 0; i < Math.min(2, groupes.length); i++) {
        const groupe = groupes[i];
        
        const lienQuery = `
          INSERT INTO ${DatabaseSeeder.inscription_groupeue_table} (inscript_code, groupeue_code, statut)
          VALUES (?, ?, ?)
        `;
        
        await this.executeQuery(lienQuery, [
          numeroInscription,
          groupe.code,
          'VALIDEE'
        ]);
      }
    }

    console.log(`✅ ${etudiants.length} inscriptions créées avec groupes`);
  }

  async seedPaiements(): Promise<void> {
    console.log('💰 Création des paiements...');
    
    const inscriptionQuery = `SELECT numero_inscription FROM ${DatabaseSeeder.inscription_table} LIMIT 10`;
    const inscriptions = await this.executeQuery(inscriptionQuery);
    
    for (let i = 0; i < inscriptions.length; i++) {
      const inscription = inscriptions[i];
      const montantTotal = 500.00;
      const montantPaye = i < 7 ? montantTotal : (i === 7 ? 250.00 : 0);
      const statutPaiement = montantPaye >= montantTotal ? 'COMPLET' : 
                            montantPaye > 0 ? 'PARTIEL' : 'IMPAYE';
      
      const query = `
        INSERT INTO ${DatabaseSeeder.paiement_droits_table} (
          inscription_numero, montant_total, montant_paye, 
          statut_paiement, date_dernier_paiement, mode_paiement, reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        inscription.numero_inscription,
        montantTotal,
        montantPaye,
        statutPaiement,
        montantPaye > 0 ? new Date().toISOString().split('T')[0] : null,
        ['VIREMENT', 'CARTE', 'CHEQUE'][i % 3],
        `PAY-${(i + 1).toString().padStart(6, '0')}`
      ]);
    }

    console.log(`✅ ${inscriptions.length} paiements créés`);
  }

  async seedNotes(): Promise<void> {
    console.log('📊 Création des notes...');
    
    // Récupérer quelques étudiants et matières
    const etudiantQuery = `
      SELECT e.id FROM ${DatabaseSeeder.etudiant_table} e
      JOIN ${DatabaseSeeder.user_table} u ON e.id = u.id
      WHERE e.statut_academique = 'ACTIF'
      LIMIT 5
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    const matiereQuery = `
      SELECT code FROM ${DatabaseSeeder.matiere_table} 
      LIMIT 3
    `;
    const matieres = await this.executeQuery(matiereQuery);
    
    // Récupérer une session d'examen
    const sessionQuery = `SELECT id FROM ${DatabaseSeeder.session_examen_table} LIMIT 1`;
    const sessions = await this.executeQuery(sessionQuery);
    const sessionId = sessions[0]?.id || 1;
    
    for (const etudiant of etudiants) {
      for (const matiere of matieres) {
        // Générer des notes aléatoires mais réalistes
        const noteCC = Math.floor(Math.random() * 5) + 10; // 10-14
        const noteExamen = Math.floor(Math.random() * 8) + 8; // 8-15
        const noteTP = matiere.code.includes('TP') ? Math.floor(Math.random() * 5) + 12 : null;
        
        const noteFinale = noteTP 
          ? (noteCC * 0.3) + (noteExamen * 0.5) + (noteTP * 0.2)
          : (noteCC * 0.4) + (noteExamen * 0.6);
        
        const query = `
          INSERT INTO ${DatabaseSeeder.note_table} (
            etudiant_id, matiere_code, session_examen_id, note_cc, note_examen, note_tp, 
            note_finale, type_evaluation, validee, date_validation, commentaire
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.executeQuery(query, [
          etudiant.id,
          matiere.code,
          sessionId,
          noteCC,
          noteExamen,
          noteTP,
          noteFinale.toFixed(2),
          'EXAMEN_FINAL',
          noteFinale >= 10,
          new Date().toISOString().split('T')[0],
          noteFinale >= 10 ? 'Validé' : 'Non validé'
        ]);
      }
    }

    console.log(`✅ ${etudiants.length * matieres.length} notes créées`);
  }

  async seedSeances(): Promise<void> {
    console.log('🕒 Création des séances...');
    
    // Récupérer quelques matières
    const matiereQuery = `SELECT code FROM ${DatabaseSeeder.matiere_table} LIMIT 3`;
    const matieres = await this.executeQuery(matiereQuery);

    const salleQuery = `SELECT code FROM ${DatabaseSeeder.salle_table} LIMIT 3`;
    const salles = await this.executeQuery(salleQuery);
    
    const enseignantQuery = `SELECT id FROM ${DatabaseSeeder.enseignant_table} LIMIT 2`;
    const enseignants = await this.executeQuery(enseignantQuery);
    
    for (const matiere of matieres) {
      // Créer 2 séances par matière
      for (let i = 1; i <= 2; i++) {
        const dateSeance = new Date(2024, 0, i + 10); // Janvier
        
        const query = `
          INSERT INTO ${DatabaseSeeder.seance_table} (matiere_code, salle_code, date_seance, heure_debut, heure_fin, type_seance, enseignant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
          await this.executeQuery(query, [
            matiere.code,
            salles[i % salles.length].code,
            dateSeance.toISOString().split('T')[0],
            i === 1 ? '08:30' : '14:00',
            i === 1 ? '10:30' : '16:00',
            ['CM', 'TD'][i % 2],
            enseignants[i % enseignants.length].id
          ]);
        } catch (err: any) {
          // Si le trigger signale un conflit d'horaire, tenter d'autres salles/creneaux
          if (err && (err.sqlState === '45000' || err.errno === 1644)) {
            console.warn('⚠️ Trigger empêchant insertion de séance (créneau initial):', err.sqlMessage || err.message);

            // Construire liste de créneaux alternatifs (salles x plages horaires)
            const tried = new Set<string>();
            tried.add(`${salles[i % salles.length].code}@${i === 1 ? '08:30' : '14:00'}`);
            let inserted = false;

            const alternativeHours = [
              { hstart: '08:30', hend: '10:30' },
              { hstart: '10:30', hend: '12:30' },
              { hstart: '12:00', hend: '14:00' },
              { hstart: '14:00', hend: '16:00' }
            ];

            for (const salleRow of salles) {
              for (const slot of alternativeHours) {
                const key = `${salleRow.code}@${slot.hstart}`;
                if (tried.has(key)) continue;
                try {
                  await this.executeQuery(query, [
                    matiere.code,
                    salleRow.code,
                    dateSeance.toISOString().split('T')[0],
                    slot.hstart,
                    slot.hend,
                    ['CM', 'TD'][i % 2],
                    enseignants[i % enseignants.length].id
                  ]);
                  console.log(`ℹ️ Séance insérée avec créneau alternatif ${salleRow.code} ${slot.hstart}-${slot.hend}`);
                  inserted = true;
                  break;
                } catch (err2: any) {
                  if (err2 && (err2.sqlState === '45000' || err2.errno === 1644)) {
                    // conflit aussi sur cette alternative -> essayer la suivante
                    tried.add(key);
                    continue;
                  }
                  throw err2;
                }
              }
              if (inserted) break;
            }

            if (!inserted) {
              console.warn('⚠️ Impossible d\'insérer la séance : aucun créneau alternatif disponible, on passe.');
            }
            continue;
          }
          throw err;
        }
      }
    }

    console.log(`✅ ${matieres.length * 2} séances créées`);
  }

  async seedMatiereSessionExamen(): Promise<void> {
    console.log('🔗 Liaison matières - sessions d\'examen...');
    
    // Récupérer quelques matières
    const matiereQuery = `SELECT code FROM ${DatabaseSeeder.matiere_table} LIMIT 5`;
    const matieres = await this.executeQuery(matiereQuery);
    
    // Récupérer les sessions
    const sessionQuery = `SELECT id FROM ${DatabaseSeeder.session_examen_table}`;
    const sessions = await this.executeQuery(sessionQuery);
    
    for (const matiere of matieres) {
      for (const session of sessions) {
        const query = `
          INSERT INTO ${DatabaseSeeder.matiere_session_examen_table} (matiere_code, session_examen_id, date_examen, heure_debut, heure_fin)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        await this.executeQuery(query, [
          matiere.code,
          session.id,
          '2024-01-15',
          '09:00',
          '12:00'
        ]);
      }
    }

    console.log(`✅ ${matieres.length * sessions.length} liaisons créées`);
  }

  async seedPresences(): Promise<void> {
    console.log('✅ Création des présences...');
    
    // Récupérer quelques étudiants et séances
    const etudiantQuery = `
      SELECT e.id FROM ${DatabaseSeeder.etudiant_table} e
      WHERE e.statut_academique = 'ACTIF'
      LIMIT 3
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    const seanceQuery = `SELECT id, date_seance, type_seance FROM ${DatabaseSeeder.seance_table} LIMIT 4`;
    const seances = await this.executeQuery(seanceQuery);
    
    for (const etudiant of etudiants) {
      for (const seance of seances) {
        const present = Math.random() > 0.2; // 80% de présence
        
        const query = `
          INSERT INTO ${DatabaseSeeder.presence_table} (
            etudiant_id, seance_id, date_seance, type_seance,
            present, justification
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await this.executeQuery(query, [
          etudiant.id,
          seance.id,
          seance.date_seance,
          seance.type_seance,
          present,
          present ? null : 'Maladie'
        ]);
      }
    }

    console.log(`✅ ${etudiants.length * seances.length} présences créées`);
  }

  async seedDossierCandidature(): Promise<void> {
    console.log('📄 Création des dossiers de candidature...');
    
    // Récupérer tous les étudiants (pour certains créer des dossiers)
    const etudiantQuery = `
      SELECT id, numero_etudiant FROM ${DatabaseSeeder.etudiant_table} 
      ORDER BY id 
      LIMIT 10
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    const statuts = ['EN_ATTENTE', 'COMPLET', 'VALIDE', 'REJETE', 'ANNULE'];
    const specialites = ['INF-SI', 'INF-RI', 'MATHS-APP', 'PHYS-QUANT'];
    const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i];
      
      // Déterminer le statut aléatoirement mais avec logique
      let statut: string;
      let dateCandidature: Date;
      
      if (i < 3) {
        // 3 dossiers validés (anciens)
        statut = 'VALIDE';
        dateCandidature = new Date(2023, 5, 15 + i); // Juin 2023
      } else if (i < 6) {
        // 3 dossiers en attente (en cours)
        statut = 'EN_ATTENTE';
        dateCandidature = new Date(2024, 0, 10 + i); // Janvier 2024
      } else if (i < 8) {
        // 2 dossiers rejetés
        statut = 'REJETE';
        dateCandidature = new Date(2023, 7, 20 + i); // Août 2023
      } else if (i < 9) {
        // 1 dossier annulé
        statut = 'ANNULE';
        dateCandidature = new Date(2023, 9, 5); // Octobre 2023
      } else {
        // 1 dossier complet
        statut = 'COMPLET';
        dateCandidature = new Date(2024, 1, 15); // Février 2024
      }
      
      // Déterminer la spécialité demandée
      const specialiteDemandee = specialites[i % specialites.length];
      const niveauDemande = niveaux[i % niveaux.length];
      
      // Générer des documents fictifs
      const documents = [
        `https://bucket-univ.edu/documents/${etudiant.numero_etudiant}/cv.pdf`,
        `https://bucket-univ.edu/documents/${etudiant.numero_etudiant}/diplome.pdf`,
        `https://bucket-univ.edu/documents/${etudiant.numero_etudiant}/lettre_motivation.pdf`,
        `https://bucket-univ.edu/documents/${etudiant.numero_etudiant}/releve_notes.pdf`
      ];
      
      // Si dossier annulé, moins de documents
      if (statut === 'ANNULE') {
        documents.splice(2, 2); // Garde seulement 2 documents
      }
      
      const query = `
        INSERT INTO ${DatabaseSeeder.dossier_candidature_table} (
          etudiant_id, date_candidature, statut, 
          documents_url, specialite_demandee, niveau_demande,
          date_examen_entree, resultat_examen, date_entretien,
          commentaire_entretien, date_decision, motif_decision,
          frais_dossier, frais_payes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Dates conditionnelles
      const dateExamen = statut === 'VALIDE' || statut === 'REJETE' 
        ? new Date(dateCandidature.getFullYear(), dateCandidature.getMonth() + 1, 10)
        : null;
      
      const dateEntretien = statut === 'VALIDE' 
        ? new Date(dateCandidature.getFullYear(), dateCandidature.getMonth() + 2, 15)
        : null;
      
      const dateDecision = ['VALIDE', 'REJETE', 'ANNULE'].includes(statut)
        ? new Date(dateCandidature.getFullYear(), dateCandidature.getMonth() + 3, 1)
        : null;
      
      // Résultats conditionnels
      const resultatExamen = statut === 'VALIDE' ? Math.floor(Math.random() * 5) + 11 + i : null;
      const commentaireEntretien = statut === 'VALIDE' 
        ? 'Bon potentiel, motivation avérée.' 
        : statut === 'REJETE' 
          ? 'Profil ne correspondant pas aux attentes.' 
          : null;
      
      const motifDecision = statut === 'VALIDE' 
        ? 'Candidature retenue suite à examen et entretien.' 
        : statut === 'REJETE' 
          ? 'Notes insuffisantes en mathématiques.' 
          : statut === 'ANNULE' 
            ? 'Candidature retirée par l\'étudiant.' 
            : null;
      
      await this.executeQuery(query, [
        etudiant.id,
        dateCandidature.toISOString().split('T')[0],
        statut,
        JSON.stringify(documents),
        specialiteDemandee,
        niveauDemande,
        dateExamen ? dateExamen.toISOString().split('T')[0] : null,
        resultatExamen,
        dateEntretien ? dateEntretien.toISOString().split('T')[0] : null,
        commentaireEntretien,
        dateDecision ? dateDecision.toISOString().split('T')[0] : null,
        motifDecision,
        50.00, // Frais dossier
        ['VALIDE', 'REJETE', 'COMPLET'].includes(statut) ? 50.00 : 0.00 // Frais payés
      ]);
    }

    console.log(`✅ ${etudiants.length} dossiers de candidature créés`);
  }

  async seedCandidats(): Promise<number[]> {
    console.log('👤 Création de candidats (futurs étudiants)...');
    
    // D'abord créer les utilisateurs candidats
    const candidats = Array.from({ length: 5 }, (_, i) => ({
      nom: `Candidat${i + 1}`,
      prenom: ['Marc', 'Laura', 'Alex', 'Sarah', 'David'][i],
      email: `candidat${i + 1}@univ.edu`,
      password: 'candidat123',
      telephone: `0${(i + 100).toString().padStart(9, '0')}`,
      role: 'ETUDIANT', // Ils seront étudiants mais avec statut CANDIDAT
      statut: 'ACTIF'
    }));

    const userIds: number[] = [];

    for (const candidat of candidats) {
      const hashedPassword = await this.hashPassword(candidat.password);
      
      const query = `
        INSERT INTO ${DatabaseSeeder.user_table} (nom, prenom, email, password_hash, telephone, role, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await this.executeQuery(query, [
        candidat.nom,
        candidat.prenom,
        candidat.email,
        hashedPassword,
        candidat.telephone,
        candidat.role,
        candidat.statut
      ]);
      
      userIds.push((result as any).insertId);
    }

    console.log(`✅ ${candidats.length} utilisateurs candidats créés`);
    
    // Maintenant créer les étudiants avec statut CANDIDAT
    const niveaux = ['L1', 'L2', 'L3'];
    const nationalites = ['Française', 'Canadienne', 'Belge', 'Suisse'];
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const numeroEtudiant = `CAND-${(i + 1).toString().padStart(3, '0')}`;
      const dateNaissance = new Date(1998 + (i % 5), i % 12, (i % 28) + 1);
      const genre = i % 2 === 0 ? 'M' : 'F';
      const niveau = niveaux[i % niveaux.length];
      const nationalite = nationalites[i % nationalites.length];
      
      const query = `
        INSERT INTO ${DatabaseSeeder.etudiant_table} (
          id, numero_etudiant, date_naissance, lieu_naissance, genre, 
          nationalite, adresse_complete, region_origine, niveau, 
          statut_academique, date_inscription
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        userId,
        numeroEtudiant,
        dateNaissance.toISOString().split('T')[0],
        'Lyon',
        genre,
        nationalite,
        `${i + 1} Rue des Candidats, 69000 Lyon`,
        'Auvergne-Rhône-Alpes',
        niveau,
        'CANDIDAT', // Statut spécial pour les candidats
        new Date(2024, 2, 1).toISOString().split('T')[0]
      ]);
    }

    console.log(`✅ ${userIds.length} étudiants candidats créés`);
    return userIds;
  }

  async seedDossiersCandidatureAvances(): Promise<void> {
    console.log('📋 Création de dossiers de candidature avec étapes...');
    
    // Types de dossiers
    const typesDossiers = [
      {
        type: 'PREMIERE_INSCRIPTION',
        documentsRequis: ['cv', 'diplome', 'releve_notes', 'lettre_motivation', 'photo'],
        frais: 50.00
      },
      {
        type: 'REINSCRIPTION',
        documentsRequis: ['releve_notes', 'quittance', 'certificat_scolarite'],
        frais: 30.00
      },
      {
        type: 'CHANGEMENT_FILIERE',
        documentsRequis: ['cv', 'releve_notes', 'lettre_motivation', 'projet_professionnel'],
        frais: 40.00
      }
    ];
    
    // Récupérer les étudiants candidats
    const etudiantQuery = `
      SELECT id, numero_etudiant FROM ${DatabaseSeeder.etudiant_table} 
      WHERE statut_academique = 'CANDIDAT'
      LIMIT 5
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    if (etudiants.length === 0) {
      console.log('⚠️  Aucun étudiant candidat trouvé, création de quelques candidats...');
      await this.seedCandidats();
      // Relancer la requête
      const newQuery = await this.executeQuery(etudiantQuery);
      if (newQuery.length === 0) {
        console.log('❌ Impossible de créer des dossiers sans candidats');
        return;
      }
      etudiants.push(...newQuery);
    }
    
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i];
      const typeDossier = typesDossiers[i % typesDossiers.length];
      if (!typeDossier) continue;
      
      // Statut aléatoire mais avec progression logique
      const progression = Math.random();
      let statut: string;
      let etapeActuelle: string;
      
      if (progression < 0.3) {
        statut = 'EN_ATTENTE';
        etapeActuelle = 'DEPOT_DOCUMENTS';
      } else if (progression < 0.6) {
        statut = 'COMPLET';
        etapeActuelle = 'PAIEMENT_FRAIS';
      } else if (progression < 0.8) {
        statut = 'EN_EVALUATION';
        etapeActuelle = 'EXAMEN_ENTREE';
      } else if (progression < 0.95) {
        statut = 'VALIDE';
        etapeActuelle = 'ENTRETIEN';
      } else {
        statut = 'REJETE';
        etapeActuelle = 'DECISION';
      }
      
      // Dates
      const dateDepot = new Date(2024, 1, 15 + i);
      const dateLimite = new Date(dateDepot.getFullYear(), dateDepot.getMonth() + 1, 15);
      
      // Documents selon le type
      const documentsUrl = typeDossier.documentsRequis.map(doc => 
        `https://bucket-univ.edu/candidatures/${etudiant.numero_etudiant}/${doc}.pdf`
      );
      
      // Informations supplémentaires selon le type
      const infosSupplementaires = JSON.stringify({
        type_candidature: typeDossier.type,
        annee_demande: '2024-2025',
        specialite_premiere_voeu: 'INF-SI',
        specialite_deuxieme_voeu: 'INF-RI',
        motivation: `Je souhaite intégrer cette formation car ${['je suis passionné par l\'informatique', 'je veux me spécialiser en développement', 'je recherche une formation d\'excellence'][i % 3]}.`,
        experience: i > 2 ? 'Stage de 2 mois en entreprise' : 'Aucune expérience professionnelle',
        langue_parlee: ['Français', 'Anglais', i > 2 ? 'Espagnol' : null].filter(Boolean)
      });
      
      const query = `
        INSERT INTO ${DatabaseSeeder.dossier_candidature_table} (
          etudiant_id, date_candidature, statut, documents_url,
          type_candidature, frais_dossier, frais_payes, etape_actuelle,
          date_limite_complet, informations_supplementaires,
          specialite_demandee, niveau_demande
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        etudiant.id,
        dateDepot.toISOString().split('T')[0],
        statut,
        JSON.stringify(documentsUrl),
        typeDossier.type,
        typeDossier.frais,
        ['COMPLET', 'EN_EVALUATION', 'VALIDE', 'REJETE'].includes(statut) ? typeDossier.frais : 0.00,
        etapeActuelle,
        dateLimite.toISOString().split('T')[0],
        infosSupplementaires,
        'INF-SI',
        'L1'
      ]);
      
      // Si le dossier est en évaluation ou validé, ajouter des étapes
      if (['EN_EVALUATION', 'VALIDE', 'REJETE'].includes(statut)) {
        await this.seedEtapesCandidature(etudiant.id, dateDepot, statut);
      }
    }

    console.log(`✅ ${etudiants.length} dossiers de candidature avancés créés`);
  }

  async seedEtapesCandidature(etudiantId: number, dateDepot: Date, statutFinal: string): Promise<void> {
    const etapes = [
      {
        nom: 'DEPOT_DOCUMENTS',
        date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 1),
        statut: 'TERMINEE',
        responsable: 'SYSTEME',
        commentaire: 'Dossier déposé en ligne'
      },
      {
        nom: 'VERIFICATION_DOCUMENTS',
        date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 3),
        statut: 'TERMINEE',
        responsable: 'ADMIN_001',
        commentaire: 'Tous les documents sont valides et complets'
      },
      {
        nom: 'PAIEMENT_FRAIS',
        date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 5),
        statut: 'TERMINEE',
        responsable: 'FINANCES',
        commentaire: 'Paiement des frais de dossier confirmé'
      }
    ];
    
    // Ajouter l'étape examen si le dossier est allé assez loin
    if (['EN_EVALUATION', 'VALIDE', 'REJETE'].includes(statutFinal)) {
      etapes.push({
        nom: 'EXAMEN_ENTREE',
        date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 15),
        statut: 'TERMINEE',
        responsable: 'PEDAGOGIE',
        commentaire: `Examen passé - Note: ${Math.floor(Math.random() * 5) + 11}/20`
      });
    }
    
    // Ajouter l'étape entretien si le dossier est validé
    if (statutFinal === 'VALIDE') {
      etapes.push({
        nom: 'ENTRETIEN',
        date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 20),
        statut: 'TERMINEE',
        responsable: 'COMMISSION',
        commentaire: 'Entretien positif - Bonne motivation'
      });
    }
    
    // Toujours ajouter l'étape décision finale
    etapes.push({
      nom: 'DECISION',
      date: new Date(dateDepot.getFullYear(), dateDepot.getMonth(), dateDepot.getDate() + 25),
      statut: 'TERMINEE',
      responsable: 'COMMISSION',
      commentaire: statutFinal === 'VALIDE' 
        ? 'Candidature acceptée - Inscription à finaliser' 
        : 'Candidature refusée - Profil non retenu'
    });
    
    // Dans un système réel, on aurait une table EtapesCandidature
    // Pour l'exemple, on va stocker dans un champ JSON
    const etapesJSON = JSON.stringify(etapes);
    
    const query = `
      UPDATE ${DatabaseSeeder.dossier_candidature_table} 
      SET etapes = ?, date_derniere_modification = ?
      WHERE etudiant_id = ?
    `;
    
    await this.executeQuery(query, [
      etapesJSON,
      new Date().toISOString().split('T')[0],
      etudiantId
    ]);
  }


  async seedAll(): Promise<void> {
    try {
      await this.connect();
      await this.clearDatabase();
      
      console.log('\n🚀 Début du seeding...\n');
      
      // Exécuter les seeders dans l'ordre des dépendances
      await this.seedUtilisateurs();
      await this.seedEnseignants();
      await this.seedAdministrateurs();
      await this.seedEtudiants();
      await this.seedFilieres(); 
      await this.seedSpecialites();
      await this.seedAnneesAcademiques();
      await this.seedSessionExamen();
      await this.seedSalles();
      await this.seedGroupeUE();
      await this.seedUnitesEnseignement();
      await this.seedMatieres();
      await this.seedSeances();
      await this.seedMatiereSessionExamen();
      
      await this.seedCandidats(); 
      await this.seedDossiersCandidatureAvances();
      // await this.seedCommissionsCandidature(); 
      
      
      await this.seedInscriptionsEtGroupes();
      await this.seedPaiements();
      await this.seedNotes();
      await this.seedPresences();
      
      console.log('\n🎉 Seeding terminé avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur pendant le seeding:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async seedTestData(): Promise<void> {
    try {
      await this.connect();
      await this.clearDatabase();
      
      console.log('\n🧪 Début du seeding de test...\n');
      await this.seedUtilisateurs();
      await this.seedEnseignants();
      await this.seedFilieres();           
      await this.seedSpecialites();
      await this.seedEtudiants();
      await this.seedAnneesAcademiques();
      await this.seedSalles();
      
      // Seeders avancés (optionnels)
      // if (process.env.FULL_TEST === 'true') {
        await this.seedGroupeUE();
        await this.seedUnitesEnseignement();
        await this.seedMatieres();
        await this.seedInscriptionsEtGroupes();
      // }
      
      console.log('\n✅ Seeding de test terminé !');
      
    } catch (error) {
      console.error('❌ Erreur pendant le seeding de test:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async seedProductionData(): Promise<void> {
    try {
      await this.connect();
      await this.clearDatabase();
      console.log('\n🏢 Début du seeding production...\n');

      await this.seedUtilisateurs();
      await this.seedEnseignants();
      await this.seedAdministrateurs();
      await this.seedEtudiants();
      await this.seedSpecialites();
      await this.seedAnneesAcademiques();
      await this.seedSessionExamen();
      await this.seedSalles();
      await this.seedGroupeUE();
      await this.seedUnitesEnseignement();
      await this.seedMatieres();
      await this.seedSeances();
      await this.seedMatiereSessionExamen();
      
      // Candidatures production
      await this.seedCandidats();
      await this.seedDossiersCandidatureAvances();
      // await this.seedCommissionsCandidature();
      
      // Données académiques
      await this.seedInscriptionsEtGroupes();
      await this.seedPaiements();
      await this.seedNotes();
      
      console.log('\n🏢 Seeding production terminé !');
      
    } catch (error) {
      console.error('❌ Erreur pendant le seeding production:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

}

// Configuration
const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sigif_students_db',
  port: Number.parseInt(process.env.DB_PORT || '3306')
};

// Exécution principale
async function main() {
  const seeder = new DatabaseSeeder(config);
  
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  switch (command) {
    case 'all':
      await seeder.seedAll();
      break;
    case 'test':
      await seeder.seedTestData();
      break;
    case 'production':
      await seeder.seedProductionData();
      break;
    case 'clear':
      await seeder.connect();
      await seeder.clearDatabase();
      await seeder.disconnect();
      break;
    default:
      console.log('Commandes disponibles:');
      console.log('  npm run seed           - Seed toutes les données');
      console.log('  npm run seed:test      - Seed données de test');
      console.log('  npm run seed:production - Seed données production');
      console.log('  npm run seed:clear     - Nettoyer la base');
      break;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseSeeder };