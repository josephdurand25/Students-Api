-- ============================================
-- SCRIPT SQL - GESTION SCOLAIRE
-- ============================================

-- server/config/database_v2.sql
CREATE DATABASE IF NOT EXISTS sigif_students_db;
USE sigif_students_db;


-- Suppression des tables si elles existent (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS Presence;
DROP TABLE IF EXISTS Note;
DROP TABLE IF EXISTS PaiementDroits;
DROP TABLE IF EXISTS InscriptionGroupe;
DROP TABLE IF EXISTS Matiere;
DROP TABLE IF EXISTS UniteEnseignement;
DROP TABLE IF EXISTS GroupeCours;
DROP TABLE IF EXISTS Salle;
DROP TABLE IF EXISTS Filiere;
DROP TABLE IF EXISTS AnneeAcademique;
DROP TABLE IF EXISTS Etudiant;
DROP TABLE IF EXISTS Enseignant;
DROP TABLE IF EXISTS Administrateur;
DROP TABLE IF EXISTS Utilisateur;

-- ============================================
-- TABLES DE BASE
-- ============================================

-- Table Utilisateur (abstraite)
CREATE TABLE Utilisateur (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('ETUDIANT', 'ENSEIGNANT', 'ADMINISTRATEUR') NOT NULL,
    statut ENUM('ACTIF', 'INACTIF', 'SUSPENDU') DEFAULT 'ACTIF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table Etudiant (hérite de Utilisateur)
CREATE TABLE Etudiant (
    id INT PRIMARY KEY,
    numero_etudiant VARCHAR(50) UNIQUE NOT NULL,
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    genre ENUM('m', 'f', 'autre') ,
    nationalite VARCHAR(50),
    adresse_complete TEXT,
    adresse_postale VARCHAR(20),
    pays_origine VARCHAR(100),
    departement_origine VARCHAR(100),
    region_origine VARCHAR(100),
    ville VARCHAR(100),
    filiere VARCHAR(100),
    niveau VARCHAR(50),
    statut_academique ENUM('inscrit', 'non_inscrit', 'diplome', 'abandon', 'exclu') DEFAULT 'non_inscrit',
    photo_profil VARCHAR(255),
    date_inscription DATE,
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE,
    INDEX idx_numero_etudiant (numero_etudiant),
    INDEX idx_filiere (filiere),
    INDEX idx_niveau (niveau)
);

-- Table Enseignant (hérite de Utilisateur)
CREATE TABLE Enseignant (
    id INT PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    departement VARCHAR(100),
    bureau VARCHAR(50),
    specialite VARCHAR(200),
    grade VARCHAR(50),
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE,
    INDEX idx_matricule (matricule),
    INDEX idx_departement (departement)
);

-- Table Administrateur (hérite de Utilisateur)
CREATE TABLE Administrateur (
    id INT PRIMARY KEY,
    departement VARCHAR(100),
    fonction VARCHAR(100),
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE,
    INDEX idx_departement (departement)
);

-- ============================================
-- TABLES ACADÉMIQUES
-- ============================================

-- Table Filiere
CREATE TABLE Filiere (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    description_filiere VARCHAR(200) DEFAULT null,
    departement VARCHAR(100) NOT NULL,
    niveaux_offerts JSON,
    responsable_id INT,
    statut enum ('actif', 'inactif') default 'actif',
    FOREIGN KEY (responsable_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    INDEX idx_departement (departement)
);

-- Table AnneeAcademique
CREATE TABLE AnneeAcademique (
    code VARCHAR(20) PRIMARY KEY,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('planifie', 'en_cours', 'termine', 'archive') DEFAULT 'planifie',
    INDEX idx_statut (statut)
);

-- Table GroupeCours
CREATE TABLE GroupeCours (
    code VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    filiere_code VARCHAR(20),
    niveau VARCHAR(50),
    semestre ENUM('S1', 'S2', 'S3', 'S4', 'S5', 'S6','S7','S8','S9','S10') NOT NULL,
    annee_academique_code VARCHAR(20) NOT NULL, -- cette colonne doit être retire, c'est une information redondante
    credits_total INT DEFAULT 0,
    capacite_max INT DEFAULT 30,
    statut ENUM('OUVERT', 'COMPLET', 'FERME', 'ANNULE') DEFAULT 'OUVERT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_code) REFERENCES Filiere(code) ON DELETE SET NULL,
    FOREIGN KEY (annee_academique_code) REFERENCES AnneeAcademique(code) ON DELETE CASCADE,
    INDEX idx_filiere_niveau (filiere_code, niveau),
    INDEX idx_annee_semestre (annee_academique_code, semestre)
);

-- Table UniteEnseignement
CREATE TABLE UniteEnseignement (
    code VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type ENUM('OBLIGATOIRE', 'OPTIONNEL', 'TRANSVERSAL') NOT NULL,
    credits INT NOT NULL,
    coefficient DECIMAL(3,2) DEFAULT 1.00,
    volume_horaire_total INT,
    description TEXT,
    groupe_cours_code VARCHAR(50) NOT NULL,
    FOREIGN KEY (groupe_cours_code) REFERENCES GroupeCours(code) ON DELETE CASCADE,
    INDEX idx_groupe_cours (groupe_cours_code),
    INDEX idx_type (type)
);

-- Table Salle
CREATE TABLE Salle (
    code VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    type ENUM('AMPHI', 'TD', 'TP', 'LABO', 'ATELIER') NOT NULL,
    equipements JSON,
    INDEX idx_type (type),
    INDEX idx_capacite (capacite)
);

-- Table Matiere
CREATE TABLE Matiere (
    code VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type_cours ENUM('CM', 'TD', 'TP') NOT NULL,
    credits INT NOT NULL,
    coefficient DECIMAL(3,2) DEFAULT 1.00,
    volume_horaire INT,
    salle_code VARCHAR(50),
    jour ENUM('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'),
    heure_debut TIME,
    heure_fin TIME,
    unite_enseignement_code VARCHAR(50) NOT NULL,
    enseignant_id INT,
    FOREIGN KEY (salle_code) REFERENCES Salle(code) ON DELETE SET NULL,
    FOREIGN KEY (unite_enseignement_code) REFERENCES UniteEnseignement(code) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    INDEX idx_ue (unite_enseignement_code),
    INDEX idx_enseignant (enseignant_id),
    INDEX idx_jour_heure (jour, heure_debut, heure_fin)
);

-- ============================================
-- TABLES DE GESTION
-- ============================================

-- Table InscriptionGroupe
CREATE TABLE InscriptionGroupe (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_inscription VARCHAR(100) UNIQUE NOT NULL,
    etudiant_id INT NOT NULL,
    groupe_cours_code VARCHAR(50) NOT NULL,
    annee_academique VARCHAR(20) NOT NULL,
    semestre ENUM('S1', 'S2', 'S3', 'S4', 'S5', 'S6','S7','S8','S9','S10') NOT NULL, -- cette colonne doit être retiré. la table groupeCours a déjà un champ pour le semestre
    statut ENUM('EN_ATTENTE', 'VALIDE', 'REJETE', 'ANNULE') DEFAULT 'EN_ATTENTE',
    date_inscription DATE NOT NULL,
    date_validation DATE,
    fiche_url VARCHAR(255),
    valide_par_admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_cours_code) REFERENCES GroupeCours(code) ON DELETE CASCADE,
    FOREIGN KEY (valide_par_admin_id) REFERENCES Administrateur(id) ON DELETE SET NULL,
    UNIQUE KEY unique_inscription (etudiant_id, groupe_cours_code, annee_academique, semestre),
    INDEX idx_etudiant (etudiant_id),
    INDEX idx_groupe_cours (groupe_cours_code),
    INDEX idx_statut (statut)
);

-- Table PaiementDroits
CREATE TABLE PaiementDroits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_groupe_id INT NOT NULL,
    montant_total DECIMAL(10,2) NOT NULL,
    montant_paye DECIMAL(10,2) DEFAULT 0.00,
    statut_paiement ENUM('IMPAYE', 'PARTIEL', 'PAYE', 'EXONERE') DEFAULT 'IMPAYE',
    date_dernier_paiement DATE,
    mode_paiement ENUM('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE'),
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_groupe_id) REFERENCES InscriptionGroupe(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscription_paiement (inscription_groupe_id),
    INDEX idx_statut_paiement (statut_paiement),
    INDEX idx_date_paiement (date_dernier_paiement)
);

-- Table Note
CREATE TABLE Note (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    matiere_code VARCHAR(50) NOT NULL,
    note_cc DECIMAL(4,2),
    note_examen DECIMAL(4,2),
    note_tp DECIMAL(4,2),
    note_finale DECIMAL(4,2),
    type_evaluation ENUM('CONTINUE', 'EXAMEN', 'RATTRAPAGE') DEFAULT 'EXAMEN',
    validee BOOLEAN DEFAULT FALSE,
    date_validation DATE,
    commentaire TEXT,
    session ENUM('NORMALE', 'RATTRAPAGE', 'SPECIALE') DEFAULT 'NORMALE',
    saisie_par_enseignant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_code) REFERENCES Matiere(code) ON DELETE CASCADE,
    FOREIGN KEY (saisie_par_enseignant_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    UNIQUE KEY unique_note_etudiant_matiere (etudiant_id, matiere_code, session),
    INDEX idx_etudiant_matiere (etudiant_id, matiere_code),
    INDEX idx_session (session),
    INDEX idx_validee (validee)
);

-- Table Presence
CREATE TABLE Presence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    matiere_code VARCHAR(50) NOT NULL,
    date_seance DATE NOT NULL,
    type_seance ENUM('CM', 'TD', 'TP') NOT NULL,
    present BOOLEAN DEFAULT FALSE,
    justification TEXT,
    signature VARCHAR(255),
    enregistre_par_enseignant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_code) REFERENCES Matiere(code) ON DELETE CASCADE,
    FOREIGN KEY (enregistre_par_enseignant_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    UNIQUE KEY unique_presence (etudiant_id, matiere_code, date_seance, type_seance),
    INDEX idx_etudiant_date (etudiant_id, date_seance),
    INDEX idx_matiere_date (matiere_code, date_seance)
);

-- ============================================
-- VUES POUR FACILITER LES REQUÊTES
-- ============================================

-- Vue pour les étudiants avec leurs informations complètes
CREATE OR REPLACE VIEW Vue_Etudiants_Complets AS
SELECT 
    u.id, u.nom, u.prenom, u.email, u.telephone, u.statut,
    e.numero_etudiant, e.date_naissance, e.lieu_naissance, e.genre,
    e.nationalite, e.adresse_complete, e.region_origine,
    e.filiere, e.niveau, e.statut_academique, e.date_inscription
FROM Utilisateur u
JOIN Etudiant e ON u.id = e.id;

-- Vue pour les inscriptions avec détails
CREATE OR REPLACE VIEW Vue_Inscriptions_Details AS
SELECT 
    ig.*,
    e.numero_etudiant, ue.nom AS nom_etudiant, ue.prenom AS prenom_etudiant,  -- CORRECTION: utiliser ue au lieu de e
    gc.nom AS nom_groupe, gc.filiere_code, gc.niveau,
    a.nom AS nom_admin, a.prenom AS prenom_admin
FROM InscriptionGroupe ig
JOIN Etudiant e ON ig.etudiant_id = e.id
JOIN Utilisateur ue ON e.id = ue.id  -- AJOUT: jointure avec Utilisateur pour avoir nom/prenom
JOIN GroupeCours gc ON ig.groupe_cours_code = gc.code
LEFT JOIN Administrateur admin ON ig.valide_par_admin_id = admin.id
LEFT JOIN Utilisateur a ON admin.id = a.id;

-- Vue pour les notes avec détails
CREATE OR REPLACE VIEW Vue_Notes_Details AS
SELECT 
    n.*,
    e.numero_etudiant, 
    u.nom AS nom_etudiant, 
    u.prenom AS prenom_etudiant,
    m.nom AS nom_matiere, 
    m.unite_enseignement_code,
    ue.nom AS nom_ue, 
    ue.coefficient AS coefficient_ue,
    ens.nom AS nom_enseignant, 
    ens.prenom AS prenom_enseignant
FROM Note n
JOIN Etudiant e ON n.etudiant_id = e.id
JOIN Utilisateur u ON e.id = u.id
JOIN Matiere m ON n.matiere_code = m.code
JOIN UniteEnseignement ue ON m.unite_enseignement_code = ue.code
LEFT JOIN Enseignant en ON n.saisie_par_enseignant_id = en.id
LEFT JOIN Utilisateur ens ON en.id = ens.id;

-- Vue pour la présence
CREATE OR REPLACE VIEW Vue_Presence_Details AS
SELECT 
    p.*,
    e.numero_etudiant, 
    u.nom AS nom_etudiant, 
    u.prenom AS prenom_etudiant,
    m.nom AS nom_matiere, 
    m.jour, 
    m.heure_debut, 
    m.heure_fin,
    ens.nom AS nom_enseignant, 
    ens.prenom AS prenom_enseignant
FROM Presence p
JOIN Etudiant e ON p.etudiant_id = e.id
JOIN Utilisateur u ON e.id = u.id
JOIN Matiere m ON p.matiere_code = m.code
LEFT JOIN Enseignant en ON p.enregistre_par_enseignant_id = en.id
LEFT JOIN Utilisateur ens ON en.id = ens.id;

-- ============================================
-- TRIGGERS POUR LA GESTION AUTOMATIQUE
-- ============================================

-- Trigger pour mettre à jour la note finale
DELIMITER $$
CREATE TRIGGER Calculer_Note_Finale
BEFORE UPDATE ON Note
FOR EACH ROW
BEGIN
    -- Calcul basique de la note finale (peut être adapté selon la logique métier)
    IF NEW.note_cc IS NOT NULL AND NEW.note_examen IS NOT NULL THEN
        -- Exemple: CC (40%) + Examen (60%)
        SET NEW.note_finale = (COALESCE(NEW.note_cc, 0) * 0.4) + (COALESCE(NEW.note_examen, 0) * 0.6);
        IF NEW.note_tp IS NOT NULL THEN
            -- Si TP existe, ajuster la formule
            SET NEW.note_finale = (COALESCE(NEW.note_cc, 0) * 0.3) + 
                                  (COALESCE(NEW.note_examen, 0) * 0.5) + 
                                  (COALESCE(NEW.note_tp, 0) * 0.2);
        END IF;
    END IF;
END$$
DELIMITER ;

-- Trigger pour vérifier la capacité du groupe
CREATE TRIGGER Verifier_Capacite_Groupe
BEFORE INSERT ON InscriptionGroupe
FOR EACH ROW
BEGIN
    DECLARE capacite_actuelle INT;
    DECLARE capacite_max INT;
    
    -- Récupérer le nombre d'inscriptions actuelles
    SELECT COUNT(*) INTO capacite_actuelle
    FROM InscriptionGroupe ig
    WHERE ig.groupe_cours_code = NEW.groupe_cours_code
    AND ig.statut = 'VALIDE';
    
    -- Récupérer la capacité max du groupe
    SELECT capacite_max INTO capacite_max
    FROM GroupeCours gc
    WHERE gc.code = NEW.groupe_cours_code;
    
    IF capacite_actuelle >= capacite_max THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La capacité maximale du groupe est atteinte';
    END IF;
END$$
DELIMITER ;

-- Trigger pour mettre à jour le statut de paiement
DELIMITER $$
CREATE TRIGGER Mettre_A_Jour_Statut_Paiement
BEFORE UPDATE ON PaiementDroits
FOR EACH ROW
BEGIN
    -- Mettre à jour le statut en fonction du montant payé
    IF NEW.montant_paye >= NEW.montant_total THEN
        SET NEW.statut_paiement = 'PAYE';
    ELSEIF NEW.montant_paye > 0 AND NEW.montant_paye < NEW.montant_total THEN
        SET NEW.statut_paiement = 'PARTIEL';
    ELSE
        SET NEW.statut_paiement = 'IMPAYE';
    END IF;
    
    -- Mettre à jour la date du dernier paiement si le montant a changé
    IF NEW.montant_paye <> OLD.montant_paye THEN
        SET NEW.date_dernier_paiement = CURDATE();
    END IF;
END$$
DELIMITER ;

-- ============================================
-- INDEX SUPPLEMENTAIRES POUR LES PERFORMANCES
-- ============================================

-- Index pour les recherches fréquentes
CREATE INDEX idx_utilisateur_nom_prenom ON Utilisateur(nom, prenom);
CREATE INDEX idx_etudiant_filiere_niveau ON Etudiant(filiere, niveau);
CREATE INDEX idx_inscription_annee_semestre ON InscriptionGroupe(annee_academique, semestre);
CREATE INDEX idx_note_finale ON Note(note_finale);
CREATE INDEX idx_presence_etudiant_matiere ON Presence(etudiant_id, matiere_code);
CREATE INDEX idx_matiere_enseignant ON Matiere(enseignant_id);

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================

-- Utiliser ALTER TABLE pour ajouter des commentaires en MySQL
ALTER TABLE Utilisateur COMMENT = 'Table de base pour tous les utilisateurs du système';
ALTER TABLE Etudiant COMMENT = 'Table des étudiants, hérite de Utilisateur';
ALTER TABLE Enseignant COMMENT = 'Table des enseignants, hérite de Utilisateur';
ALTER TABLE Administrateur COMMENT = 'Table des administrateurs, hérite de Utilisateur';
ALTER TABLE Filiere COMMENT = 'Filières académiques disponibles';
ALTER TABLE AnneeAcademique COMMENT = 'Années académiques';
ALTER TABLE GroupeCours COMMENT = 'Groupes de cours pour l''inscription des étudiants';
ALTER TABLE UniteEnseignement COMMENT = 'Unités d''enseignement composant les groupes de cours';
ALTER TABLE Salle COMMENT = 'Salles de cours';
ALTER TABLE Matiere COMMENT = 'Matières individuelles avec horaires et salles';
ALTER TABLE InscriptionGroupe COMMENT = 'Inscriptions des étudiants aux groupes de cours';
ALTER TABLE Note COMMENT = 'Notes des étudiants par matière';
ALTER TABLE Presence COMMENT = 'Présence des étudiants aux séances';
ALTER TABLE PaiementDroits COMMENT = 'Informations de paiement des droits d''inscription';