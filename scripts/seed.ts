// scripts/seed.ts
import mysql, { Connection } from 'mysql2/promise';
import * as bcrypt from 'bcrypt';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

class DatabaseSeeder {
  private connection: Connection | null = null;
  
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
    } catch (error) {
      console.error('❌ Erreur d\'exécution de requête:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async clearDatabase(): Promise<void> {
    console.log('🧹 Nettoyage de la base de données...');
    
    // Désactiver les contraintes de clés étrangères
    await this.executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    // Supprimer toutes les données dans l'ordre inverse des dépendances
    const tables = [
      'Presence', 'Note', 'PaiementDroits', 'InscriptionGroupe',
      'Matiere', 'UniteEnseignement', 'GroupeCours',
      'Salle', 'Filiere', 'AnneeAcademique',
      'Etudiant', 'Enseignant', 'Administrateur', 'Utilisateur'
    ];
    
    for (const table of tables) {
      try {
        await this.executeQuery(`DELETE FROM ${table}`);
        console.log(`   Supprimé ${table}`);
      } catch (error) {
        console.log(`   ${table} déjà vide`);
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
        INSERT INTO Utilisateur (nom, prenom, email, password_hash, telephone, role, statut)
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
      SELECT id FROM Utilisateur 
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
        INSERT INTO Enseignant (id, matricule, departement, bureau, specialite, grade)
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
      SELECT id FROM Utilisateur 
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
        INSERT INTO Administrateur (id, departement, fonction)
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

  async seedEtudiants(): Promise<number[]> {
    console.log('👨‍🎓 Création des étudiants...');
    
    // Récupérer les IDs des utilisateurs étudiants
    const query = `
      SELECT id FROM Utilisateur 
      WHERE role = 'ETUDIANT' 
      ORDER BY id
    `;
    const rows = await this.executeQuery(query);
    const etudiantIds = rows.map((row: any) => row.id);

    const filieres = ['Informatique', 'Mathématiques', 'Physique', 'Électronique'];
    const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const nationalites = ['Française', 'Canadienne', 'Belge', 'Suisse', 'Algérienne', 'Marocaine'];
    const regions = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie'];

    for (let i = 0; i < etudiantIds.length; i++) {
      const etudiantId = etudiantIds[i];
      const numeroEtudiant = `ETU-${(i + 1).toString().padStart(4, '0')}`;
      const dateNaissance = new Date(1995 + (i % 10), i % 12, (i % 28) + 1);
      const genre = i % 2 === 0 ? 'm' : 'f';
      const filiere = filieres[i % filieres.length];
      const niveau = niveaux[i % niveaux.length];
      const nationalite = nationalites[i % nationalites.length];
      const region = regions[i % regions.length];
      
      const query = `
        INSERT INTO Etudiant (
          id, numero_etudiant, date_naissance, lieu_naissance, genre, 
          nationalite, adresse_complete, region_origine, filiere, niveau, 
          statut_academique, date_inscription
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
        filiere,
        niveau,
        i < 15 ? 'inscrit' : 'non_inscrit', // 15 inscrits, 5 non-inscrits
        new Date(2023, 8, 1).toISOString().split('T')[0] // 1er septembre 2023
      ]);
    }

    console.log(`✅ ${etudiantIds.length} étudiants créés`);
    return etudiantIds;
  }

  async seedFilieres(): Promise<string[]> {
    console.log('📚 Création des filières...');
    
    // Récupérer un ID d'enseignant pour responsable
    const enseignantQuery = `SELECT id FROM Enseignant LIMIT 1`;
    const enseignantRows = await this.executeQuery(enseignantQuery);
    const responsableId = enseignantRows[0]?.id || 1;

    const filieres = [
      {
        code: 'INFO',
        nom: 'Informatique',
        departement: 'Informatique',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1', 'M2']),
        responsable_id: responsableId
      },
      {
        code: 'MATHS',
        nom: 'Mathématiques',
        departement: 'Mathématiques',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1', 'M2']),
        responsable_id: responsableId
      },
      {
        code: 'PHYS',
        nom: 'Physique',
        departement: 'Physique',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1', 'M2']),
        responsable_id: responsableId
      },
      {
        code: 'ELEC',
        nom: 'Électronique',
        departement: 'Électronique',
        niveaux_offerts: JSON.stringify(['L1', 'L2', 'L3', 'M1']),
        responsable_id: responsableId
      }
    ];

    for (const filiere of filieres) {
      const query = `
        INSERT INTO Filiere (code, nom, departement, niveaux_offerts, responsable_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        filiere.code,
        filiere.nom,
        filiere.departement,
        filiere.niveaux_offerts,
        filiere.responsable_id
      ]);
    }

    console.log(`✅ ${filieres.length} filières créées`);
    return filieres.map(f => f.code);
  }

  async seedAnneesAcademiques(): Promise<string[]> {
    console.log('📅 Création des années académiques...');
    
    const annees = [
      {
        code: '2023-2024',
        date_debut: '2023-09-01',
        date_fin: '2024-08-31',
        statut: 'en_cours'
      },
      {
        code: '2022-2023',
        date_debut: '2022-09-01',
        date_fin: '2023-08-31',
        statut: 'termine'
      },
      {
        code: '2024-2025',
        date_debut: '2024-09-01',
        date_fin: '2025-08-31',
        statut: 'planifie'
      }
    ];

    for (const annee of annees) {
      const query = `
        INSERT INTO AnneeAcademique (code, date_debut, date_fin, statut)
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

  async seedGroupesCours(): Promise<string[]> {
    console.log('📁 Création des groupes de cours...');
    
     // PAR CECI (récupérer les filières existantes) :
    const filiereQuery = `SELECT code FROM Filiere`;
    const filiereRows = await this.executeQuery(filiereQuery);
    const filiereCodes = filiereRows.map((row: any) => row.code);

    const anneeQuery = `SELECT code FROM AnneeAcademique`;
    const anneeRows = await this.executeQuery(anneeQuery);
    const anneeCodes = anneeRows.map((row: any) => row.code);
    
    const groupes = [
      {
        code: 'INFO-L1-S1-2023',
        nom: 'Informatique L1 - Semestre 1',
        filiere_code: 'INFO',
        niveau: 'L1',
        semestre: 'S1',
        annee_academique_code: '2023-2024',
        credits_total: 30,
        capacite_max: 40,
        statut: 'OUVERT'
      },
      {
        code: 'INFO-L2-S3-2023',
        nom: 'Informatique L2 - Semestre 3',
        filiere_code: 'INFO',
        niveau: 'L2',
        semestre: 'S3',
        annee_academique_code: '2023-2024',
        credits_total: 30,
        capacite_max: 35,
        statut: 'OUVERT'
      },
      {
        code: 'MATHS-L1-S1-2023',
        nom: 'Mathématiques L1 - Semestre 1',
        filiere_code: 'MATHS',
        niveau: 'L1',
        semestre: 'S1',
        annee_academique_code: '2023-2024',
        credits_total: 30,
        capacite_max: 30,
        statut: 'OUVERT'
      },
      {
        code: 'PHYS-M1-S9-2023',
        nom: 'Physique M1 - Semestre 9',
        filiere_code: 'PHYS',
        niveau: 'M1',
        semestre: 'S9',
        annee_academique_code: '2023-2024',
        credits_total: 30,
        capacite_max: 25,
        statut: 'COMPLET'
      }
    ];

    for (const groupe of groupes) {
        if (!anneeCodes.includes(groupe.annee_academique_code)) {
            console.warn(`⚠️  Année académique ${groupe.annee_academique_code} non trouvée`);
            continue;
        }
        
        if (!filiereCodes.includes(groupe.filiere_code)) {
            console.warn(`⚠️  Filière ${groupe.filiere_code} non trouvée`);
            continue;
        }
        
        // Insérer le groupe
      const query = `
        INSERT INTO GroupeCours (code, nom, filiere_code, niveau, semestre, annee_academique_code, credits_total, capacite_max, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        groupe.code,
        groupe.nom,
        groupe.filiere_code,
        groupe.niveau,
        groupe.semestre,
        groupe.annee_academique_code,
        groupe.credits_total,
        groupe.capacite_max,
        groupe.statut
      ]);
    }

    console.log(`✅ ${groupes.length} groupes de cours créés`);
    return groupes.map(g => g.code);
  }

  async seedUnitesEnseignement(): Promise<string[]> {
    console.log('📘 Création des unités d\'enseignement...');
    
     const groupeQuery = `SELECT code FROM GroupeCours`;
    const groupeRows = await this.executeQuery(groupeQuery);
    const groupeCodes = groupeRows.map((row: any) => row.code);
    
    const ues = [
      // Informatique L1 S1
      {
        code: 'INFO-L1-ALGO',
        nom: 'Algorithmique et Programmation',
        type: 'OBLIGATOIRE',
        credits: 6,
        coefficient: 1.5,
        volume_horaire_total: 60,
        description: 'Introduction à l\'algorithmique et à la programmation en C',
        groupe_cours_code: 'INFO-L1-S1-2023'
      },
      {
        code: 'INFO-L1-BDD',
        nom: 'Bases de Données',
        type: 'OBLIGATOIRE',
        credits: 5,
        coefficient: 1.2,
        volume_horaire_total: 50,
        description: 'Introduction aux bases de données relationnelles',
        groupe_cours_code: 'INFO-L1-S1-2023'
      },
      {
        code: 'INFO-L1-MATHS',
        nom: 'Mathématiques pour l\'Informatique',
        type: 'OBLIGATOIRE',
        credits: 4,
        coefficient: 1.0,
        volume_horaire_total: 40,
        description: 'Mathématiques discrètes et algèbre linéaire',
        groupe_cours_code: 'INFO-L1-S1-2023'
      },
      
      // Informatique L2 S3
      {
        code: 'INFO-L2-POO',
        nom: 'Programmation Orientée Objet',
        type: 'OBLIGATOIRE',
        credits: 6,
        coefficient: 1.5,
        volume_horaire_total: 60,
        description: 'Programmation orientée objet avec Java',
        groupe_cours_code: 'INFO-L2-S3-2023'
      },
      {
        code: 'INFO-L2-WEB',
        nom: 'Développement Web',
        type: 'OBLIGATOIRE',
        credits: 5,
        coefficient: 1.2,
        volume_horaire_total: 50,
        description: 'Développement front-end et back-end',
        groupe_cours_code: 'INFO-L2-S3-2023'
      },
      
      // Mathématiques L1 S1
      {
        code: 'MATHS-L1-ALGEBRE',
        nom: 'Algèbre Linéaire',
        type: 'OBLIGATOIRE',
        credits: 6,
        coefficient: 1.5,
        volume_horaire_total: 60,
        description: 'Espaces vectoriels, matrices, applications linéaires',
        groupe_cours_code: 'MATHS-L1-S1-2023'
      },
      {
        code: 'MATHS-L1-ANALYSE',
        nom: 'Analyse Réelle',
        type: 'OBLIGATOIRE',
        credits: 6,
        coefficient: 1.5,
        volume_horaire_total: 60,
        description: 'Fonctions réelles, limites, dérivées, intégrales',
        groupe_cours_code: 'MATHS-L1-S1-2023'
      }
    ];

    for (const ue of ues) {
      const query = `
        INSERT INTO UniteEnseignement (code, nom, type, credits, coefficient, 
                                      volume_horaire_total, description, groupe_cours_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        ue.code,
        ue.nom,
        ue.type,
        ue.credits,
        ue.coefficient,
        ue.volume_horaire_total,
        ue.description,
        ue.groupe_cours_code
      ]);
    }

    console.log(`✅ ${ues.length} unités d'enseignement créées`);
    return ues.map(ue => ue.code);
  }

  async seedMatieres(): Promise<string[]> {
    console.log('📖 Création des matières...');
    
    const ueQuery = `SELECT code FROM UniteEnseignement`;
    const ueRows = await this.executeQuery(ueQuery);
    const ueCodes = ueRows.map((row: any) => row.code);
    
    const salleQuery = `SELECT code FROM Salle`;
    const salleRows = await this.executeQuery(salleQuery);
    const salleCodes = salleRows.map((row: any) => row.code);

    const enseignantQuery = `SELECT id FROM Enseignant`;
    const enseignantRows = await this.executeQuery(enseignantQuery);
    const enseignantIds = enseignantRows.map((row: any) => row.id);
    
    const matieres = [
      // Algorithmique et Programmation
      {
        code: 'ALGO-CM',
        nom: 'Algorithmique - Cours Magistral',
        type_cours: 'CM',
        credits: 3,
        coefficient: 0.8,
        volume_horaire: 30,
        salle_code: 'A101',
        jour: 'LUNDI',
        heure_debut: '08:30',
        heure_fin: '10:30',
        unite_enseignement_code: 'INFO-L1-ALGO',
        enseignant_id: enseignantIds[0]
      },
      {
        code: 'ALGO-TD',
        nom: 'Algorithmique - Travaux Dirigés',
        type_cours: 'TD',
        credits: 2,
        coefficient: 0.4,
        volume_horaire: 20,
        salle_code: 'TD201',
        jour: 'MERCREDI',
        heure_debut: '14:00',
        heure_fin: '16:00',
        unite_enseignement_code: 'INFO-L1-ALGO',
        enseignant_id: enseignantIds[0]
      },
      {
        code: 'ALGO-TP',
        nom: 'Algorithmique - Travaux Pratiques',
        type_cours: 'TP',
        credits: 1,
        coefficient: 0.3,
        volume_horaire: 10,
        salle_code: 'TP301',
        jour: 'VENDREDI',
        heure_debut: '10:00',
        heure_fin: '12:00',
        unite_enseignement_code: 'INFO-L1-ALGO',
        enseignant_id: enseignantIds[0]
      },
      
      // Bases de Données
      {
        code: 'BDD-CM',
        nom: 'Bases de Données - Cours Magistral',
        type_cours: 'CM',
        credits: 3,
        coefficient: 0.8,
        volume_horaire: 25,
        salle_code: 'A102',
        jour: 'MARDI',
        heure_debut: '10:30',
        heure_fin: '12:30',
        unite_enseignement_code: 'INFO-L1-BDD',
        enseignant_id: enseignantIds[1]
      },
      {
        code: 'BDD-TD',
        nom: 'Bases de Données - Travaux Dirigés',
        type_cours: 'TD',
        credits: 1,
        coefficient: 0.3,
        volume_horaire: 15,
        salle_code: 'TD202',
        jour: 'JEUDI',
        heure_debut: '08:30',
        heure_fin: '10:30',
        unite_enseignement_code: 'INFO-L1-BDD',
        enseignant_id: enseignantIds[1]
      },
      {
        code: 'BDD-TP',
        nom: 'Bases de Données - Travaux Pratiques',
        type_cours: 'TP',
        credits: 1,
        coefficient: 0.2,
        volume_horaire: 10,
        salle_code: 'TP301',
        jour: 'VENDREDI',
        heure_debut: '14:00',
        heure_fin: '16:00',
        unite_enseignement_code: 'INFO-L1-BDD',
        enseignant_id: enseignantIds[1]
      },
      
      // Programmation Orientée Objet
      {
        code: 'POO-CM',
        nom: 'POO - Cours Magistral',
        type_cours: 'CM',
        credits: 3,
        coefficient: 0.8,
        volume_horaire: 30,
        salle_code: 'A101',
        jour: 'LUNDI',
        heure_debut: '14:00',
        heure_fin: '16:00',
        unite_enseignement_code: 'INFO-L2-POO',
        enseignant_id: enseignantIds[0]
      }
    ];

    for (const matiere of matieres) {
      const query = `
        INSERT INTO Matiere (code, nom, type_cours, credits, coefficient, volume_horaire,
                            salle_code, jour, heure_debut, heure_fin, unite_enseignement_code, enseignant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        matiere.code,
        matiere.nom,
        matiere.type_cours,
        matiere.credits,
        matiere.coefficient,
        matiere.volume_horaire,
        matiere.salle_code,
        matiere.jour,
        matiere.heure_debut,
        matiere.heure_fin,
        matiere.unite_enseignement_code,
        matiere.enseignant_id
      ]);
    }

    console.log(`✅ ${matieres.length} matières créées`);
    return matieres.map(m => m.code);
  }

  async seedInscriptions(): Promise<number[]> {
    console.log('📝 Création des inscriptions...');
    
    // Récupérer les étudiants inscrits
    const etudiantQuery = `
      SELECT id FROM Etudiant 
      WHERE statut_academique = 'inscrit' 
      LIMIT 15
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    // Récupérer les groupes ouverts
    const groupeQuery = `
      SELECT code FROM GroupeCours 
      WHERE statut = 'OUVERT' 
      LIMIT 2
    `;
    const groupes = await this.executeQuery(groupeQuery);
    
    const inscriptionIds: number[] = [];
    let inscriptionNum = 1;

    for (const etudiant of etudiants) {
      for (const groupe of groupes) {
        const numeroInscription = `INS-${inscriptionNum.toString().padStart(4, '0')}`;
        inscriptionNum++;
        
        const query = `
          INSERT INTO InscriptionGroupe (
            numero_inscription, etudiant_id, groupe_cours_code, 
            annee_academique, semestre, statut, date_inscription
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const groupeCode = groupe.code;
        const anneeAcademique = groupeCode.includes('2023') ? '2023-2024' : '2022-2023';
        const semestre = groupeCode.includes('S1') ? 'S1' : 
                        groupeCode.includes('S3') ? 'S3' : 'S1';
        
        const result = await this.executeQuery(query, [
          numeroInscription,
          etudiant.id,
          groupeCode,
          anneeAcademique,
          semestre,
          'VALIDE',
          new Date(2023, 8, (inscriptionNum % 20) + 1).toISOString().split('T')[0]
        ]);
        
        inscriptionIds.push((result as any).insertId);
      }
    }

    console.log(`✅ ${inscriptionIds.length} inscriptions créées`);
    return inscriptionIds;
  }

  async seedPaiements(): Promise<void> {
    console.log('💰 Création des paiements...');
    
    const inscriptionQuery = `SELECT id FROM InscriptionGroupe LIMIT 10`;
    const inscriptions = await this.executeQuery(inscriptionQuery);
    
    for (let i = 0; i < inscriptions.length; i++) {
      const inscription = inscriptions[i];
      const montantTotal = 500.00;
      const montantPaye = i < 7 ? montantTotal : (i === 7 ? 250.00 : 0);
      const statutPaiement = montantPaye >= montantTotal ? 'PAYE' : 
                            montantPaye > 0 ? 'PARTIEL' : 'IMPAYE';
      
      const query = `
        INSERT INTO PaiementDroits (
          inscription_groupe_id, montant_total, montant_paye, 
          statut_paiement, date_dernier_paiement, mode_paiement, reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.executeQuery(query, [
        inscription.id,
        montantTotal,
        montantPaye,
        statutPaiement,
        montantPaye > 0 ? new Date(2023, 8, (i % 30) + 1).toISOString().split('T')[0] : null,
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
      SELECT e.id FROM Etudiant e
      JOIN Utilisateur u ON e.id = u.id
      WHERE e.statut_academique = 'inscrit'
      LIMIT 5
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    const matiereQuery = `
      SELECT code FROM Matiere 
      WHERE type_cours IN ('CM', 'TD')
      LIMIT 3
    `;
    const matieres = await this.executeQuery(matiereQuery);
    
    const enseignantQuery = `SELECT id FROM Enseignant LIMIT 2`;
    const enseignants = await this.executeQuery(enseignantQuery);
    
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
          INSERT INTO Note (
            etudiant_id, matiere_code, note_cc, note_examen, note_tp, 
            note_finale, type_evaluation, validee, date_validation, 
            session, saisie_par_enseignant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.executeQuery(query, [
          etudiant.id,
          matiere.code,
          noteCC,
          noteExamen,
          noteTP,
          noteFinale.toFixed(2),
          'EXAMEN',
          true,
          new Date(2024, 0, (Math.random() * 30) + 1).toISOString().split('T')[0],
          'NORMALE',
          enseignants[Math.floor(Math.random() * enseignants.length)].id
        ]);
      }
    }

    console.log(`✅ ${etudiants.length * matieres.length} notes créées`);
  }

  async seedPresences(): Promise<void> {
    console.log('✅ Création des présences...');
    
    // Récupérer quelques étudiants et matières
    const etudiantQuery = `
      SELECT e.id FROM Etudiant e
      JOIN Utilisateur u ON e.id = u.id
      WHERE e.statut_academique = 'inscrit'
      LIMIT 3
    `;
    const etudiants = await this.executeQuery(etudiantQuery);
    
    const matiereQuery = `
      SELECT code, type_cours FROM Matiere 
      WHERE jour IS NOT NULL
      LIMIT 2
    `;
    const matieres = await this.executeQuery(matiereQuery);
    
    const enseignantQuery = `SELECT id FROM Enseignant LIMIT 2`;
    const enseignants = await this.executeQuery(enseignantQuery);
    
    // Créer des présences pour 4 séances sur 2 semaines
    for (const etudiant of etudiants) {
      for (const matiere of matieres) {
        for (let semaine = 1; semaine <= 2; semaine++) {
          for (let seance = 1; seance <= 2; seance++) {
            const dateSeance = new Date(2023, 9, (semaine * 7) + seance);
            const present = Math.random() > 0.2; // 80% de présence
            
            const query = `
              INSERT INTO Presence (
                etudiant_id, matiere_code, date_seance, type_seance,
                present, justification, enregistre_par_enseignant_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await this.executeQuery(query, [
              etudiant.id,
              matiere.code,
              dateSeance.toISOString().split('T')[0],
              matiere.type_cours,
              present,
              present ? null : 'Maladie',
              enseignants[Math.floor(Math.random() * enseignants.length)].id
            ]);
          }
        }
      }
    }

    console.log(`✅ ${etudiants.length * matieres.length * 4} présences créées`);
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
      await this.seedAnneesAcademiques();
      await this.seedSalles();
      await this.seedGroupesCours();
      await this.seedUnitesEnseignement();
      await this.seedMatieres();
      await this.seedInscriptions();
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
      
      console.log('\n🧪 Début du seeding de test...\n');
      
      // Seeder minimal pour les tests
        await this.seedUtilisateurs();
        await this.seedEnseignants();        // Une seule fois
        await this.seedEtudiants();
        await this.seedFilieres();           // Une seule fois
        await this.seedAnneesAcademiques();  // Une seule fois
        await this.seedSalles();             // Une seule fois (si nécessaire)
        await this.seedGroupesCours();       // Utilise SELECT pour récupérer filières et années
        await this.seedUnitesEnseignement(); // Utilise SELECT pour récupérer groupes
        await this.seedMatieres();           // Utilise SELECT pour récupérer UE, salles, enseignants
      
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
      
      // Seeders pour production (plus de données)
      await this.seedUtilisateurs();
      await this.seedEnseignants();
      await this.seedAdministrateurs();
      await this.seedEtudiants();
      await this.seedFilieres();
      await this.seedAnneesAcademiques();
      await this.seedSalles();
      await this.seedGroupesCours();
      await this.seedUnitesEnseignement();
      await this.seedMatieres();
      await this.seedInscriptions();
      await this.seedPaiements();
      
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