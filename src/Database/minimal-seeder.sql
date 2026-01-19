USE sigif_students_db;

-- ============================================
-- UTILISATEURS
-- ============================================

INSERT INTO Utilisateur (id, nom, prenom, email, password_hash, telephone, role)
VALUES
(1, 'Admin', 'Principal', 'admin@sigif.com', 'hash_admin', '690000001', 'ADMINISTRATEUR'),
(2, 'Ngono', 'Paul', 'paul.ngono@sigif.com', 'hash_ens1', '690000002', 'ENSEIGNANT'),
(3, 'Tchoua', 'Marie', 'marie.tchoua@sigif.com', 'hash_ens2', '690000003', 'ENSEIGNANT'),
(4, 'Doe', 'John', 'john.doe@student.com', 'hash_etud1', '690000004', 'ETUDIANT'),
(5, 'Mbarga', 'Alice', 'alice.mbarga@student.com', 'hash_etud2', '690000005', 'ETUDIANT');

-- ============================================
-- ADMINISTRATEUR
-- ============================================

INSERT INTO Administrateur (id, departement, fonction)
VALUES
(1, 'Scolarité', 'Responsable des inscriptions');

-- ============================================
-- ENSEIGNANTS
-- ============================================

INSERT INTO Enseignant (id, matricule, departement, bureau, specialite, grade)
VALUES
(2, 'ENS001', 'Informatique', 'B12', 'Génie logiciel', 'Maître-Assistant'),
(3, 'ENS002', 'Mathématiques', 'B14', 'Analyse', 'Chargé de cours');

-- ============================================
-- ETUDIANTS
-- ============================================

INSERT INTO Etudiant (
  id, numero_etudiant, date_naissance, lieu_naissance,
  genre, nationalite, filiere, niveau, statut_academique, date_inscription
)
VALUES
(4, 'ETU2024001', '2002-05-12', 'Yaoundé', 'm', 'Camerounaise', 'INFO', 'L3', 'inscrit', CURDATE()),
(5, 'ETU2024002', '2003-08-22', 'Douala', 'f', 'Camerounaise', 'INFO', 'L3', 'inscrit', CURDATE());

-- ============================================
-- ANNEE ACADEMIQUE
-- ============================================

INSERT INTO AnneeAcademique (code, date_debut, date_fin, statut)
VALUES
('2024-2025', '2024-10-01', '2025-07-31', 'en_cours');

-- ============================================
-- FILIERES
-- ============================================

INSERT INTO Filiere (code, nom, departement, niveaux_offerts, responsable_id)
VALUES
('INFO', 'Informatique', 'Sciences', JSON_ARRAY('L1','L2','L3','M1','M2'), 2);

-- ============================================
-- GROUPES DE COURS
-- ============================================

INSERT INTO GroupeCours (
  code, nom, filiere_code, niveau, semestre,
  annee_academique_code, credits_total, capacite_max
)
VALUES
('GC-INFO-L3-S1', 'Groupe INFO L3 Semestre 1', 'INFO', 'L3', 'S5', '2024-2025', 30, 40);

-- ============================================
-- UNITES D'ENSEIGNEMENT
-- ============================================

INSERT INTO UniteEnseignement (
  code, nom, type, credits, coefficient, volume_horaire_total, groupe_cours_code
)
VALUES
('UE-INF-501', 'Programmation Avancée', 'OBLIGATOIRE', 6, 1.5, 60, 'GC-INFO-L3-S1'),
('UE-INF-502', 'Bases de Données', 'OBLIGATOIRE', 5, 1.2, 50, 'GC-INFO-L3-S1');

-- ============================================
-- SALLES
-- ============================================

INSERT INTO Salle (code, nom, capacite, type, equipements)
VALUES
('SALLE-A1', 'Amphi A1', 100, 'AMPHI', JSON_ARRAY('Projecteur', 'Son')),
('LAB-INFO', 'Laboratoire Informatique', 40, 'LABO', JSON_ARRAY('PC', 'Réseau'));

-- ============================================
-- MATIERES
-- ============================================

INSERT INTO Matiere (
  code, nom, type_cours, credits, coefficient,
  volume_horaire, salle_code, jour, heure_debut, heure_fin,
  unite_enseignement_code, enseignant_id
)
VALUES
('MAT-INF-ADV', 'Java Avancé', 'CM', 3, 1.0, 30, 'SALLE-A1', 'LUNDI', '08:00', '10:00', 'UE-INF-501', 2),
('MAT-BDD', 'Bases de Données SQL', 'TP', 2, 1.0, 20, 'LAB-INFO', 'MERCREDI', '14:00', '16:00', 'UE-INF-502', 3);

-- ============================================
-- INSCRIPTIONS
-- ============================================

INSERT INTO InscriptionGroupe (
  numero_inscription, etudiant_id, groupe_cours_code,
  annee_academique, semestre, statut, date_inscription, valide_par_admin_id
)
VALUES
('INS-2024-001', 4, 'GC-INFO-L3-S1', '2024-2025', 'S5', 'VALIDE', CURDATE(), 1),
('INS-2024-002', 5, 'GC-INFO-L3-S1', '2024-2025', 'S5', 'VALIDE', CURDATE(), 1);

-- ============================================
-- PAIEMENTS
-- ============================================

INSERT INTO PaiementDroits (
  inscription_groupe_id, montant_total, montant_paye, statut_paiement, mode_paiement
)
VALUES
(1, 150000, 150000, 'PAYE', 'MOBILE'),
(2, 150000, 50000, 'PARTIEL', 'ESPECES');

-- ============================================
-- NOTES
-- ============================================

INSERT INTO Note (
  etudiant_id, matiere_code,
  note_cc, note_examen, note_finale,
  validee, saisie_par_enseignant_id
)
VALUES
(4, 'MAT-INF-ADV', 14, 16, 15.2, TRUE, 2),
(5, 'MAT-INF-ADV', 10, 12, 11.2, TRUE, 2);

-- ============================================
-- PRESENCES
-- ============================================

INSERT INTO Presence (
  etudiant_id, matiere_code, date_seance, type_seance, present, enregistre_par_enseignant_id
)
VALUES
(4, 'MAT-INF-ADV', '2024-10-15', 'CM', TRUE, 2),
(5, 'MAT-INF-ADV', '2024-10-15', 'CM', FALSE, 2);
