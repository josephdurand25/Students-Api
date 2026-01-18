-- Seed data for gestion_etudiants
-- This file populates the database with test data

-- Configuration de l'encodage
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- ============================================
-- INSERTION DES UTILISATEURS
-- ============================================

INSERT INTO users (id, nom, prenom, email, password, role, statut, departement, telephone, bureau, created_at, updated_at) VALUES
(1, 'Admin', 'Système', 'admin@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'admin', 'actif', 'Administration', '+237 690 000 001', 'Bureau A101', NOW(), NOW()),
(2, 'Mbarga', 'Paul', 'paul.mbarga@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'professeur', 'actif', 'Informatique', '+237 691 234 567', 'Bureau B205', NOW(), NOW()),
(3, 'Ngono', 'Claire', 'claire.ngono@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'professeur', 'actif', 'Mathématiques', '+237 692 345 678', 'Bureau B210', NOW(), NOW()),
(4, 'Fotso', 'Albert', 'albert.fotso@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'professeur', 'actif', 'Physique', '+237 693 456 789', 'Bureau B215', NOW(), NOW()),
(5, 'Kouam', 'Élodie', 'elodie.kouam@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'professeur', 'actif', 'Chimie', '+237 694 567 890', 'Bureau B220', NOW(), NOW()),
(6, 'Ndjock', 'Marc', 'marc.ndjock@gestion-etudiants.com', '$2a$10$YourHashedPasswordHere', 'professeur', 'actif', 'Biologie', '+237 695 678 901', 'Bureau B225', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nom = VALUES(nom),
  prenom = VALUES(prenom),
  email = VALUES(email),
  updated_at = NOW();

-- ============================================
-- INSERTION DES ÉTUDIANTS
-- ============================================

INSERT INTO etudiants (
  numero_etudiant, prenom, nom, date_naissance, genre, email, telephone,
  adresse_rue, adresse_ville, adresse_code_postal, adresse_pays,
  date_inscription, filiere, niveau, statut, photo_profil, created_by, created_at, updated_at
) VALUES
-- Informatique - Tous les niveaux
('26A0001', 'Marie', 'NGUEMA', '2003-05-15', 'femme', 'marie.nguema@etudiant.com', '+237 690 123 456', 'Quartier Bastos, Rue 1234', 'Yaoundé', '12345', 'Cameroun', '2024-09-01', 'Informatique', 'L1', 'actif', 'default.png', 1, NOW(), NOW()),
('26A0002', 'David', 'ESSOMBA', '2003-08-22', 'homme', 'david.essomba@etudiant.com', '+237 691 123 457', 'Mendong, Carrefour Total', 'Yaoundé', '12346', 'Cameroun', '2024-09-01', 'Informatique', 'L2', 'actif', 'default.png', 1, NOW(), NOW()),
('26A0003', 'Aminata', 'DIALLO', '2002-11-10', 'femme', 'aminata.diallo@etudiant.com', '+237 692 123 458', 'Emana, Rue principale', 'Yaoundé', '12347', 'Cameroun', '2023-09-01', 'Informatique', 'L3', 'actif', 'default.png', 2, NOW(), NOW()),
('26A0004', 'Samuel', 'NDOUMBE', '2001-04-05', 'homme', 'samuel.ndoumbe@etudiant.com', '+237 693 123 459', 'Nkolbisson, Avenue', 'Yaoundé', '12348', 'Cameroun', '2022-09-01', 'Informatique', 'M1', 'actif', 'default.png', 2, NOW(), NOW()),
('26A0005', 'Chantal', 'MBALLA', '2000-12-20', 'femme', 'chantal.mballa@etudiant.com', '+237 694 123 460', 'Mvog-Ada, Carrefour', 'Yaoundé', '12349', 'Cameroun', '2021-09-01', 'Informatique', 'M2', 'actif', 'default.png', 2, NOW(), NOW()),
('26A0006', 'Jacques', 'FOKOU', '1998-03-15', 'homme', 'jacques.fokou@etudiant.com', '+237 695 123 461', 'Ngousso, Rue des Écoles', 'Yaoundé', '12350', 'Cameroun', '2020-09-01', 'Informatique', 'Doctorat', 'actif', 'default.png', 2, NOW(), NOW()),

-- Mathématiques - Tous les niveaux
('26B0001', 'Jean', 'KAMENI', '2002-08-20', 'homme', 'jean.kameni@etudiant.com', '+237 691 234 567', 'Odza, Borne 10', 'Yaoundé', '23456', 'Cameroun', '2024-09-01', 'Mathématiques', 'L1', 'actif', 'default.png', 1, NOW(), NOW()),
('26B0002', 'Patricia', 'FOTSO', '2003-03-18', 'femme', 'patricia.fotso@etudiant.com', '+237 692 234 568', 'Nkolbisson, Avenue principale', 'Yaoundé', '23457', 'Cameroun', '2024-09-01', 'Mathématiques', 'L2', 'actif', 'default.png', 3, NOW(), NOW()),
('26B0003', 'Ibrahim', 'MAHAMAT', '2001-06-25', 'homme', 'ibrahim.mahamat@etudiant.com', '+237 693 234 569', 'Tsinga, Carrefour', 'Yaoundé', '23458', 'Cameroun', '2022-09-01', 'Mathématiques', 'L3', 'actif', 'default.png', 3, NOW(), NOW()),
('26B0004', 'Émilie', 'TSANGA', '2000-09-12', 'femme', 'emilie.tsanga@etudiant.com', '+237 694 234 570', 'Mokolo, Marché', 'Yaoundé', '23459', 'Cameroun', '2021-09-01', 'Mathématiques', 'M1', 'actif', 'default.png', 3, NOW(), NOW()),
('26B0005', 'Roger', 'MBALLA', '1999-11-30', 'homme', 'roger.mballa@etudiant.com', '+237 695 234 571', 'Essos, Avenue Kennedy', 'Yaoundé', '23460', 'Cameroun', '2020-09-01', 'Mathématiques', 'M2', 'actif', 'default.png', 3, NOW(), NOW()),
('26B0006', 'Fatoumata', 'BAH', '1997-02-14', 'femme', 'fatoumata.bah@etudiant.com', '+237 696 234 572', 'Ngoa-Ekellé, Rue 3015', 'Yaoundé', '23461', 'Cameroun', '2019-09-01', 'Mathématiques', 'Doctorat', 'actif', 'default.png', 3, NOW(), NOW()),

-- Physique - Tous les niveaux
('26C0001', 'Sophie', 'EKOTTO', '2001-12-10', 'femme', 'sophie.ekotto@etudiant.com', '+237 692 345 678', 'Mvan, Carrefour', 'Yaoundé', '34567', 'Cameroun', '2023-09-01', 'Physique', 'L1', 'actif', 'default.png', 4, NOW(), NOW()),
('26C0002', 'Marc', 'ONANA', '2002-04-15', 'homme', 'marc.onana@etudiant.com', '+237 693 345 679', 'Damas, Rond-point', 'Yaoundé', '34568', 'Cameroun', '2023-09-01', 'Physique', 'L2', 'actif', 'default.png', 4, NOW(), NOW()),
('26C0003', 'Christian', 'DONGMO', '2001-07-22', 'homme', 'christian.dongmo@etudiant.com', '+237 694 345 680', 'Biyem-Assi, Rue 1001', 'Yaoundé', '34569', 'Cameroun', '2022-09-01', 'Physique', 'L3', 'actif', 'default.png', 4, NOW(), NOW()),
('26C0004', 'Mireille', 'NKWETI', '2000-05-08', 'femme', 'mireille.nkweti@etudiant.com', '+237 695 345 681', 'Etoa-Meki, Carrefour', 'Yaoundé', '34570', 'Cameroun', '2021-09-01', 'Physique', 'M1', 'actif', 'default.png', 4, NOW(), NOW()),
('26C0005', 'Gilles', 'TCHINDA', '1999-03-25', 'homme', 'gilles.tchinda@etudiant.com', '+237 696 345 682', 'Nkolbisson, Avenue des Facultés', 'Yaoundé', '34571', 'Cameroun', '2020-09-01', 'Physique', 'M2', 'actif', 'default.png', 4, NOW(), NOW()),

-- Chimie - Tous les niveaux
('26D0001', 'Fatima', 'ABOUBAKAR', '2003-07-08', 'femme', 'fatima.aboubakar@etudiant.com', '+237 694 456 789', 'Mokolo, Marché', 'Yaoundé', '45678', 'Cameroun', '2024-09-01', 'Chimie', 'L1', 'actif', 'default.png', 5, NOW(), NOW()),
('26D0002', 'Kevin', 'TCHOUA', '2002-09-30', 'homme', 'kevin.tchoua@etudiant.com', '+237 695 456 790', 'Essos, Avenue Kennedy', 'Yaoundé', '45679', 'Cameroun', '2023-09-01', 'Chimie', 'L2', 'actif', 'default.png', 5, NOW(), NOW()),
('26D0003', 'Brigitte', 'MENGUE', '2001-01-15', 'femme', 'brigitte.mengue@etudiant.com', '+237 696 456 791', 'Ngoa-Ekellé, Cité U', 'Yaoundé', '45680', 'Cameroun', '2022-09-01', 'Chimie', 'L3', 'actif', 'default.png', 5, NOW(), NOW()),
('26D0004', 'Alain', 'NTONGA', '2000-08-20', 'homme', 'alain.ntonga@etudiant.com', '+237 697 456 792', 'Mvolyé, Rue 2000', 'Yaoundé', '45681', 'Cameroun', '2021-09-01', 'Chimie', 'M1', 'actif', 'default.png', 5, NOW(), NOW()),
('26D0005', 'Dorothée', 'BELINGA', '1999-04-10', 'femme', 'dorothee.belinga@etudiant.com', '+237 698 456 793', 'Bastos, Rue Joseph', 'Yaoundé', '45682', 'Cameroun', '2020-09-01', 'Chimie', 'M2', 'actif', 'default.png', 5, NOW(), NOW()),

-- Biologie - Tous les niveaux
('26E0001', 'Sandrine', 'MOUKOKO', '2001-01-20', 'femme', 'sandrine.moukoko@etudiant.com', '+237 696 567 890', 'Ngoa-Ekellé, Rue 3015', 'Yaoundé', '56789', 'Cameroun', '2022-09-01', 'Biologie', 'L1', 'actif', 'default.png', 6, NOW(), NOW()),
('26E0002', 'Eric', 'NKOLO', '2003-02-14', 'homme', 'eric.nkolo@etudiant.com', '+237 697 567 891', 'Nkomkana, Carrefour Nkomkana', 'Yaoundé', '56790', 'Cameroun', '2024-09-01', 'Biologie', 'L2', 'actif', 'default.png', 6, NOW(), NOW()),
('26E0003', 'Laurent', 'MBOUMBA', '2002-05-30', 'homme', 'laurent.mboumba@etudiant.com', '+237 698 567 892', 'Mimboman, Marché', 'Yaoundé', '56791', 'Cameroun', '2023-09-01', 'Biologie', 'L3', 'actif', 'default.png', 6, NOW(), NOW()),
('26E0004', 'Véronique', 'MVOGO', '2000-11-08', 'femme', 'veronique.mvogo@etudiant.com', '+237 699 567 893', 'Ngousso, Rue des Écoles', 'Yaoundé', '56792', 'Cameroun', '2021-09-01', 'Biologie', 'M1', 'actif', 'default.png', 6, NOW(), NOW()),
('26E0005', 'Pascal', 'NDJOCK', '1999-06-17', 'homme', 'pascal.ndjock@etudiant.com', '+237 670 567 894', 'Mvog-Ada, Carrefour', 'Yaoundé', '56793', 'Cameroun', '2020-09-01', 'Biologie', 'M2', 'actif', 'default.png', 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  prenom = VALUES(prenom),
  nom = VALUES(nom),
  email = VALUES(email),
  updated_at = NOW();

-- ============================================
-- INSERTION DES COURS (MISE À JOUR COMPLÈTE)
-- ============================================

INSERT INTO cours (code, nom, description, professeur, filiere, credits, semestre, capacite_max, jour, heure_debut, heure_fin, salle, prerequis, date_debut, date_fin, statut, coefficient_examen, coefficient_cc, created_at, updated_at) VALUES
-- Informatique - Cours pour tous les niveaux
('INF101', 'Algorithmique I', 'Introduction aux algorithmes et structures de données', 'Paul Mbarga', 'Informatique', 6, 'S1', 40, 'Lundi', '08:00:00', '10:00:00', 'Salle B201', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('INF102', 'Programmation Python', 'Programmation orientée objet en Python', 'Paul Mbarga', 'Informatique', 6, 'S1', 35, 'Mardi', '10:00:00', '12:00:00', 'Salle B202', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('INF103', 'Bases de données I', 'Introduction aux SGBD et SQL', 'Paul Mbarga', 'Informatique', 6, 'S2', 30, 'Mercredi', '08:00:00', '10:00:00', 'Salle B203', 'INF101', '2025-01-20', '2025-05-20', 'actif', 0.7, 0.3, NOW(), NOW()),
('INF201', 'Algorithmes Avancés', 'Structures de données avancées et complexité', 'Paul Mbarga', 'Informatique', 8, 'S1', 25, 'Jeudi', '14:00:00', '16:00:00', 'Salle B205', 'INF101', '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('INF202', 'Architecture des Ordinateurs', 'Fonctionnement interne des ordinateurs', 'Paul Mbarga', 'Informatique', 6, 'S2', 30, 'Vendredi', '10:00:00', '12:00:00', 'Salle B206', 'INF101', '2025-01-20', '2025-05-20', 'actif', 0.7, 0.3, NOW(), NOW()),
('INF301', 'Intelligence Artificielle', "Introduction à l'IA et machine learning", 'Paul Mbarga', 'Informatique', 8, 'S1', 20, 'Lundi', '14:00:00', '16:00:00', 'Salle B301', 'INF201', '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),

-- Mathématiques - Cours pour tous les niveaux
('MAT101', 'Analyse I', 'Calcul différentiel et intégral', 'Claire Ngono', 'Mathématiques', 6, 'S1', 50, 'Lundi', '10:00:00', '12:00:00', 'Salle A101', NULL, '2024-09-15', '2025-01-15', 'actif', 0.7, 0.3, NOW(), NOW()),
('MAT102', 'Algèbre Linéaire I', 'Espaces vectoriels et matrices', 'Claire Ngono', 'Mathématiques', 6, 'S1', 45, 'Mardi', '08:00:00', '10:00:00', 'Salle A102', NULL, '2024-09-15', '2025-01-15', 'actif', 0.7, 0.3, NOW(), NOW()),
('MAT201', 'Analyse II', 'Suites, séries et fonctions complexes', 'Claire Ngono', 'Mathématiques', 6, 'S2', 40, 'Mercredi', '14:00:00', '16:00:00', 'Salle A201', 'MAT101', '2025-01-20', '2025-05-20', 'actif', 0.7, 0.3, NOW(), NOW()),
('MAT202', 'Algèbre Linéaire II', 'Déterminants, valeurs propres', 'Claire Ngono', 'Mathématiques', 6, 'S2', 40, 'Jeudi', '10:00:00', '12:00:00', 'Salle A202', 'MAT102', '2025-01-20', '2025-05-20', 'actif', 0.7, 0.3, NOW(), NOW()),
('MAT301', 'Probabilités', 'Théorie des probabilités', 'Claire Ngono', 'Mathématiques', 8, 'S1', 35, 'Vendredi', '08:00:00', '10:00:00', 'Salle A301', 'MAT201', '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('MAT302', 'Statistiques', 'Statistiques inférentielles', 'Claire Ngono', 'Mathématiques', 8, 'S2', 35, 'Lundi', '16:00:00', '18:00:00', 'Salle A302', 'MAT301', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),

-- Physique - Cours pour tous les niveaux
('PHY101', 'Mécanique du Point', 'Cinématique et dynamique du point matériel', 'Albert Fotso', 'Physique', 6, 'S1', 40, 'Lundi', '14:00:00', '16:00:00', 'Labo P101', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('PHY102', 'Électricité I', 'Électrostatique et circuits électriques', 'Albert Fotso', 'Physique', 6, 'S1', 40, 'Mardi', '14:00:00', '16:00:00', 'Labo P102', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('PHY201', 'Mécanique des Solides', 'Dynamique des systèmes de points', 'Albert Fotso', 'Physique', 6, 'S2', 35, 'Mercredi', '10:00:00', '12:00:00', 'Labo P201', 'PHY101', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('PHY202', 'Électromagnétisme', 'Champs électriques et magnétiques', 'Albert Fotso', 'Physique', 8, 'S2', 35, 'Jeudi', '14:00:00', '16:00:00', 'Labo P202', 'PHY102', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('PHY301', 'Mécanique Quantique', 'Introduction à la mécanique quantique', 'Albert Fotso', 'Physique', 8, 'S1', 25, 'Vendredi', '14:00:00', '16:00:00', 'Labo P301', 'PHY202', '2024-09-15', '2025-01-15', 'actif', 0.7, 0.3, NOW(), NOW()),
('PHY302', 'Thermodynamique', 'Principes de la thermodynamique', 'Albert Fotso', 'Physique', 8, 'S2', 30, 'Lundi', '10:00:00', '12:00:00', 'Labo P302', 'PHY201', '2025-01-20', '2025-05-20', 'actif', 0.7, 0.3, NOW(), NOW()),

-- Chimie - Cours pour tous les niveaux
('CHI101', 'Chimie Générale', 'Structure atomique et liaisons chimiques', 'Élodie Kouam', 'Chimie', 6, 'S1', 40, 'Lundi', '08:00:00', '10:00:00', 'Labo C101', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('CHI102', 'Chimie des Solutions', 'Équilibres chimiques en solution', 'Élodie Kouam', 'Chimie', 6, 'S1', 40, 'Mardi', '10:00:00', '12:00:00', 'Labo C102', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('CHI201', 'Chimie Organique I', 'Fonctionnalités organiques de base', 'Élodie Kouam', 'Chimie', 8, 'S2', 35, 'Mercredi', '08:00:00', '10:00:00', 'Labo C201', 'CHI101', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('CHI202', 'Chimie Minérale', 'Éléments et composés minéraux', 'Élodie Kouam', 'Chimie', 6, 'S2', 35, 'Jeudi', '14:00:00', '16:00:00', 'Labo C202', 'CHI101', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('CHI301', 'Chimie Analytique', "Méthodes d'analyse chimique", 'Élodie Kouam', 'Chimie', 8, 'S1', 30, 'Vendredi', '10:00:00', '12:00:00', 'Labo C301', 'CHI201', '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('CHI302', 'Chimie des Matériaux', 'Structure et propriétés des matériaux', 'Élodie Kouam', 'Chimie', 8, 'S2', 25, 'Lundi', '16:00:00', '18:00:00', 'Labo C302', 'CHI202', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),

-- Biologie - Cours pour tous les niveaux
('BIO101', 'Biologie Cellulaire', 'Structure et fonction des cellules', 'Marc Ndjock', 'Biologie', 6, 'S1', 40, 'Lundi', '10:00:00', '12:00:00', 'Labo B101', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('BIO102', 'Biologie Moléculaire', 'ADN, ARN et synthèse des protéines', 'Marc Ndjock', 'Biologie', 6, 'S1', 40, 'Mardi', '14:00:00', '16:00:00', 'Labo B102', NULL, '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('BIO201', 'Génétique', 'Mendélienne et moléculaire', 'Marc Ndjock', 'Biologie', 8, 'S2', 35, 'Mercredi', '08:00:00', '10:00:00', 'Labo B201', 'BIO101', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('BIO202', 'Microbiologie', 'Microorganismes et leurs applications', 'Marc Ndjock', 'Biologie', 6, 'S2', 35, 'Jeudi', '10:00:00', '12:00:00', 'Labo B202', 'BIO102', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW()),
('BIO301', 'Biochimie', 'Métabolisme cellulaire', 'Marc Ndjock', 'Biologie', 8, 'S1', 30, 'Vendredi', '14:00:00', '16:00:00', 'Labo B301', 'BIO201', '2024-09-15', '2025-01-15', 'actif', 0.6, 0.4, NOW(), NOW()),
('BIO302', 'Écologie', 'Écosystèmes et biodiversité', 'Marc Ndjock', 'Biologie', 8, 'S2', 30, 'Lundi', '08:00:00', '10:00:00', 'Labo B302', 'BIO202', '2025-01-20', '2025-05-20', 'actif', 0.6, 0.4, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nom = VALUES(nom),
  description = VALUES(description),
  updated_at = NOW();

-- ============================================
-- ASSOCIATION COURS-NIVEAUX (COMPLÈTE POUR TOUS LES NIVEAUX)
-- ============================================

INSERT INTO cours_niveaux (cours_id, niveau) VALUES
-- Informatique
-- Cours pour L1-L2
(1, 'L1'), (1, 'L2'),
(2, 'L1'), (2, 'L2'),
-- Cours pour L2-L3
(3, 'L2'), (3, 'L3'),
(4, 'L2'), (4, 'L3'),
-- Cours pour L3-M1
(5, 'L3'), (5, 'M1'),
(6, 'L3'), (6, 'M1'),

-- Mathématiques
-- Cours pour L1-L2
(7, 'L1'), (7, 'L2'),
(8, 'L1'), (8, 'L2'),
-- Cours pour L2-L3
(9, 'L2'), (9, 'L3'),
(10, 'L2'), (10, 'L3'),
-- Cours pour L3-M1-M2
(11, 'L3'), (11, 'M1'), (11, 'M2'),
(12, 'L3'), (12, 'M1'), (12, 'M2'),

-- Physique
-- Cours pour L1-L2
(13, 'L1'), (13, 'L2'),
(14, 'L1'), (14, 'L2'),
-- Cours pour L2-L3
(15, 'L2'), (15, 'L3'),
(16, 'L2'), (16, 'L3'),
-- Cours pour L3-M1-M2
(17, 'L3'), (17, 'M1'), (17, 'M2'),
(18, 'L3'), (18, 'M1'), (18, 'M2'),

-- Chimie
-- Cours pour L1-L2
(19, 'L1'), (19, 'L2'),
(20, 'L1'), (20, 'L2'),
-- Cours pour L2-L3
(21, 'L2'), (21, 'L3'),
(22, 'L2'), (22, 'L3'),
-- Cours pour L3-M1-M2
(23, 'L3'), (23, 'M1'), (23, 'M2'),
(24, 'L3'), (24, 'M1'), (24, 'M2'),

-- Biologie
-- Cours pour L1-L2
(25, 'L1'), (25, 'L2'),
(26, 'L1'), (26, 'L2'),
-- Cours pour L2-L3
(27, 'L2'), (27, 'L3'),
(28, 'L2'), (28, 'L3'),
-- Cours pour L3-M1-M2
(29, 'L3'), (29, 'M1'), (29, 'M2'),
(30, 'L3'), (30, 'M1'), (30, 'M2')
ON DUPLICATE KEY UPDATE niveau = VALUES(niveau);

-- ============================================
-- INSCRIPTIONS DES ÉTUDIANTS AUX COURS (COMPLÈTE)
-- ============================================

-- Pour éviter les erreurs de clé étrangère, on utilise des sous-requêtes
INSERT INTO inscriptions (etudiant_id, cours_id, statut, date_inscription) 
SELECT e.id, c.id, 'inscrit', NOW()
FROM etudiants e
CROSS JOIN cours c
INNER JOIN cours_niveaux cn ON c.id = cn.cours_id
WHERE e.niveau = cn.niveau
  AND e.filiere = c.filiere
  AND e.statut = 'actif'
  AND c.statut = 'actif'
  AND NOT EXISTS (
    SELECT 1 FROM inscriptions i 
    WHERE i.etudiant_id = e.id AND i.cours_id = c.id
  )
LIMIT 150; -- Limite pour éviter trop d'inscriptions

-- ============================================
-- NOTES DES ÉTUDIANTS (COMPLÈTE)
-- ============================================

-- Génération de notes aléatoires pour toutes les inscriptions
INSERT INTO notes (etudiant_id, cours_id, note_examen, note_cc, type_evaluation, validee, validee_par, created_at) 
SELECT 
  i.etudiant_id, 
  i.cours_id,
  -- Notes d'examen entre 8 et 19 (arrondies à 0.5)
  ROUND((8 + RAND() * 11) * 2) / 2,
  -- Notes de CC entre 10 et 20 (arrondies à 0.5)
  ROUND((10 + RAND() * 10) * 2) / 2,
  'examen',
  TRUE,
  CASE 
    WHEN e.filiere = 'Informatique' THEN 2
    WHEN e.filiere = 'Mathématiques' THEN 3
    WHEN e.filiere = 'Physique' THEN 4
    WHEN e.filiere = 'Chimie' THEN 5
    WHEN e.filiere = 'Biologie' THEN 6
    ELSE 1
  END,
  NOW()
FROM inscriptions i
INNER JOIN etudiants e ON i.etudiant_id = e.id
INNER JOIN cours c ON i.cours_id = c.id
WHERE i.statut = 'inscrit'
  AND NOT EXISTS (
    SELECT 1 FROM notes n 
    WHERE n.etudiant_id = i.etudiant_id AND n.cours_id = i.cours_id
  );

-- ============================================
-- MISE À JOUR DES STATISTIQUES
-- ============================================

-- Calcul des notes finales
UPDATE notes n
INNER JOIN cours c ON n.cours_id = c.id
SET n.note_finale = 
  ROUND(
    (n.note_examen * COALESCE(c.coefficient_examen, 0.6) + 
     n.note_cc * COALESCE(c.coefficient_cc, 0.4)) * 100
  ) / 100
WHERE n.note_finale IS NULL;

-- ============================================
-- DONNÉES SUPPLÉMENTAIRES
-- ============================================

-- Insertion de quelques cours terminés pour tester les statistiques
UPDATE cours 
SET statut = 'termine', date_fin = '2024-06-30'
WHERE id IN (1, 7, 13, 19, 25);

-- Insertion de quelques étudiants inactifs
UPDATE etudiants 
SET statut = 'inactif'
WHERE id IN (6, 12, 17, 22, 27);

-- Insertion d'un étudiant diplômé
UPDATE etudiants 
SET statut = 'diplome'
WHERE id = 30;

-- ============================================
-- CONFIRMATION DES DONNÉES INSÉRÉES
-- ============================================

SELECT 'Données insérées avec succès!' as Message;

SELECT 
  (SELECT COUNT(*) FROM users) as Total_Users,
  (SELECT COUNT(*) FROM etudiants) as Total_Etudiants,
  (SELECT COUNT(*) FROM cours) as Total_Cours,
  (SELECT COUNT(*) FROM cours_niveaux) as Total_Cours_Niveaux,
  (SELECT COUNT(*) FROM inscriptions) as Total_Inscriptions,
  (SELECT COUNT(*) FROM notes) as Total_Notes,
  (SELECT COUNT(*) FROM messages) as Total_Messages;