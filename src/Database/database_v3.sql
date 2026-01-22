-- ============================================
-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES
-- SYSTÈME DE GESTION ACADÉMIQUE
-- ============================================

-- server/config/database_v3.sql
CREATE DATABASE IF NOT EXISTS sigif_students_db;
USE sigif_students_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Suppression des tables si elles existent (pour un fresh start)
DROP TABLE IF EXISTS Presence CASCADE;
DROP TABLE IF EXISTS Note CASCADE;
DROP TABLE IF EXISTS Seance CASCADE;
DROP TABLE IF EXISTS Matiere_SessionExamen CASCADE;
DROP TABLE IF EXISTS Inscription_GroupeUE CASCADE;
DROP TABLE IF EXISTS PaiementDroits CASCADE;
DROP TABLE IF EXISTS DossierCandidature CASCADE;
DROP TABLE IF EXISTS Matiere CASCADE;
DROP TABLE IF EXISTS UniteEnseignement CASCADE;
DROP TABLE IF EXISTS SessionExamen CASCADE;
DROP TABLE IF EXISTS GroupeUE CASCADE;
DROP TABLE IF EXISTS Specialite CASCADE;
DROP TABLE IF EXISTS Inscription CASCADE;
DROP TABLE IF EXISTS AnneeAcademique CASCADE;
DROP TABLE IF EXISTS Etudiant CASCADE;
DROP TABLE IF EXISTS Enseignant CASCADE;
DROP TABLE IF EXISTS Administrateur CASCADE;
DROP TABLE IF EXISTS Utilisateur CASCADE;
DROP TABLE IF EXISTS Salle CASCADE;

-- ============================================
-- CRÉATION DES TABLES
-- ============================================

-- Table de base Utilisateur (abstraite dans UML)
CREATE TABLE Utilisateur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('ETUDIANT', 'ENSEIGNANT', 'ADMINISTRATEUR', 'SUPER') NOT NULL,
    statut ENUM('ACTIF', 'INACTIF', 'SUSPENDU', 'BLOQUE') DEFAULT 'ACTIF',
    created_at TIMESTAMP ,
    updated_at TIMESTAMP  ON UPDATE CURRENT_TIMESTAMP
);

-- Table Salle
CREATE TABLE Salle (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    capacite INTEGER NOT NULL CHECK (capacite > 0),
    type VARCHAR(50) NOT NULL,
    equipements TEXT, -- Tableau de strings pour les équipements
    created_at TIMESTAMP 
);

CREATE TABLE Filiere (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    departement VARCHAR(100) NOT NULL,
    responsable_id INT,
    description TEXT,
    date_creation DATE DEFAULT (CURRENT_DATE),
    statut ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP ,
    updated_at TIMESTAMP  ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES Enseignant(id) ON DELETE SET NULL
);

-- Table Specialite
CREATE TABLE Specialite (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    filiere_code VARCHAR(20) NOT NULL,
    niveaux_offerts VARCHAR(255),
    responsable_id INT,
    created_at TIMESTAMP ,
    FOREIGN KEY (filiere_code) REFERENCES Filiere(code) ON DELETE CASCADE,
    FOREIGN KEY (responsable_id) REFERENCES Enseignant(id) ON DELETE SET NULL
);

-- Table UniteEnseignement (UE)
CREATE TABLE UniteEnseignement (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type ENUM('OBLIGATOIRE', 'OPTIONNELLE', 'TRANSVERSALE', 'PROJET') NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    volume_horaire_total INTEGER NOT NULL CHECK (volume_horaire_total > 0),
    description TEXT,
    created_at TIMESTAMP 
);

-- Table GroupeUE
CREATE TABLE GroupeUE (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    semestre ENUM('S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10') NOT NULL,
    credits_total INTEGER NOT NULL CHECK (credits_total > 0),
    capacite_max INTEGER NOT NULL CHECK (capacite_max > 0),
    statut ENUM('ACTIF', 'COMPLET', 'INACTIF') DEFAULT 'ACTIF',
    specialite_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP ,
    FOREIGN KEY (specialite_code) REFERENCES Specialite(code) ON DELETE RESTRICT
);

-- Table AnneeAcademique
CREATE TABLE AnneeAcademique (
    annee VARCHAR(9) PRIMARY KEY, -- Format: 2023-2024
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut ENUM('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'CLOTUREE') DEFAULT 'PLANIFIEE',
    created_at TIMESTAMP ,
    CONSTRAINT check_dates CHECK (date_fin > date_debut)
);


-- Table SessionExamen
CREATE TABLE SessionExamen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL, -- Ex: 06-2026
    type ENUM('NORMALE', 'RATTRAPAGE', 'SPECIALE') NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    annee_academique VARCHAR(9) NOT NULL,
    statut ENUM('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'CLOTUREE') DEFAULT 'PLANIFIEE',
    created_at TIMESTAMP ,
    FOREIGN KEY (annee_academique) REFERENCES AnneeAcademique(annee) ON DELETE CASCADE,
    CONSTRAINT check_session_dates CHECK (date_fin >= date_debut)
);

-- ============================================
-- TABLES SPÉCIALISÉES D'UTILISATEURS
-- ============================================

-- Table Etudiant (hérite de Utilisateur)
CREATE TABLE Etudiant (
    id INTEGER PRIMARY KEY,
    numero_etudiant VARCHAR(50) UNIQUE NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    genre enum ('M', 'F', 'AUTRE'),
    nationalite VARCHAR(100),
    adresse_complete TEXT,
    region_origine VARCHAR(100),
    niveau VARCHAR(50) NOT NULL,
    statut_academique enum ('CANDIDAT', 'INSCRIT', 'ACTIF', 'BLOQUE', 'ABANDON', 'DIPLOME', 'EXCLU') DEFAULT 'INSCRIT' ,
    photo_profil VARCHAR(255),
    date_inscription DATE ,
    specialite_code VARCHAR(20),
    created_at TIMESTAMP ,
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (specialite_code) REFERENCES Specialite(code) ON DELETE SET NULL
);

-- Table Enseignant (hérite de Utilisateur)
CREATE TABLE Enseignant (
    id INTEGER PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    departement VARCHAR(100) NOT NULL,
    bureau VARCHAR(50),
    specialite VARCHAR(200),
    grade VARCHAR(100) NOT NULL,
    created_at TIMESTAMP ,
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE
);

-- Table Administrateur (hérite de Utilisateur)
CREATE TABLE Administrateur (
    id INTEGER PRIMARY KEY,
    departement VARCHAR(100) NOT NULL,
    fonction VARCHAR(100) NOT NULL,
    created_at TIMESTAMP ,
    FOREIGN KEY (id) REFERENCES Utilisateur(id) ON DELETE CASCADE
);

-- Table Inscription (classe d'association)
CREATE TABLE Inscription (
    numero_inscription VARCHAR(50) PRIMARY KEY,
    etudiant_id INTEGER NOT NULL,
    annee_academique VARCHAR(9) NOT NULL,
    date_inscription DATE ,
    date_validation DATE,
    dossier_inscription_url VARCHAR(255),
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'REJETEE', 'ANNULEE')),
    created_at TIMESTAMP ,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (annee_academique) REFERENCES AnneeAcademique(annee) ON DELETE CASCADE,
    UNIQUE(etudiant_id, annee_academique) -- Un étudiant ne peut s'inscrire qu'une fois par année
);

-- Table de liaison Inscription - GroupeUE (N-N)
CREATE TABLE Inscription_GroupeUE (
    id INT PRIMARY KEY Auto_increment,
    inscript_code VARCHAR(50) NOT NULL,
    groupeue_code VARCHAR(20) NOT NULL,
    date_inscription DATE ,
    statut VARCHAR(50) DEFAULT 'INSCRIT' CHECK (statut IN ('INSCRIT', 'VALIDEE', 'ANNULEE')),
    created_at TIMESTAMP ,
    FOREIGN KEY (inscript_code) REFERENCES Inscription(numero_inscription) ON DELETE CASCADE,
    FOREIGN KEY (groupeue_code) REFERENCES GroupeUE(code) ON DELETE CASCADE,
    UNIQUE(inscript_code, groupeue_code)
);

-- Table Matiere
CREATE TABLE Matiere (
    code VARCHAR(20) PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type_cours VARCHAR(50) NOT NULL CHECK (type_cours IN ('CM', 'TD', 'TP', 'PROJET', 'STAGE')),
    credits INTEGER NOT NULL CHECK (credits > 0),
    coefficient DECIMAL(3,2) NOT NULL CHECK (coefficient > 0 AND coefficient <= 1),
    volume_horaire INTEGER NOT NULL CHECK (volume_horaire > 0),
    salle VARCHAR(20),
    jour VARCHAR(10),
    heure_debut TIME,
    heure_fin TIME,
    ue_code VARCHAR(20) NOT NULL,
    enseignant_id INTEGER,
    created_at TIMESTAMP ,
    FOREIGN KEY (ue_code) REFERENCES UniteEnseignement(code) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    FOREIGN KEY (salle) REFERENCES Salle(code) ON DELETE SET NULL
);

-- Table Seance
CREATE TABLE Seance (
    id INT PRIMARY KEY Auto_increment,
    matiere_code VARCHAR(20) NOT NULL,
    salle_code VARCHAR(20) NOT NULL,
    date_seance DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    type_seance enum ('CM', 'TD', 'TP', 'EXAMEN', 'RATTRAPAGE') NOT NULL,
    enseignant_id INTEGER,
    created_at TIMESTAMP ,
    FOREIGN KEY (matiere_code) REFERENCES Matiere(code) ON DELETE CASCADE,
    FOREIGN KEY (salle_code) REFERENCES Salle(code) ON DELETE RESTRICT,
    FOREIGN KEY (enseignant_id) REFERENCES Enseignant(id) ON DELETE SET NULL,
    CONSTRAINT check_heure CHECK (heure_fin > heure_debut)
);

-- Table de liaison Matiere - SessionExamen (N-N)
CREATE TABLE Matiere_SessionExamen (
    id INT PRIMARY KEY Auto_increment,
    matiere_code VARCHAR(20) NOT NULL,
    session_examen_id INTEGER NOT NULL,
    date_examen DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    salle_code VARCHAR(20),
    created_at TIMESTAMP ,
    FOREIGN KEY (matiere_code) REFERENCES Matiere(code) ON DELETE CASCADE,
    FOREIGN KEY (session_examen_id) REFERENCES SessionExamen(id) ON DELETE CASCADE,
    FOREIGN KEY (salle_code) REFERENCES Salle(code) ON DELETE SET NULL,
    UNIQUE(matiere_code, session_examen_id)
);

-- Table Note
CREATE TABLE Note (
    id INT PRIMARY KEY Auto_increment,
    etudiant_id INTEGER NOT NULL,
    matiere_code VARCHAR(20) NOT NULL,
    session_examen_id INTEGER NOT NULL,
    note_cc DECIMAL(4,2) CHECK (note_cc >= 0 AND note_cc <= 20),
    note_examen DECIMAL(4,2) CHECK (note_examen >= 0 AND note_examen <= 20),
    note_tp DECIMAL(4,2) CHECK (note_tp >= 0 AND note_tp <= 20),
    note_finale DECIMAL(4,2) CHECK (note_finale >= 0 AND note_finale <= 20),
    type_evaluation enum ('CONTROLE_CONTINU', 'EXAMEN_FINAL', 'PROJET', 'ORAL') NOT NULL,
    validee BOOLEAN DEFAULT FALSE,
    date_validation DATE,
    commentaire TEXT,
    created_at TIMESTAMP ,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_code) REFERENCES Matiere(code) ON DELETE CASCADE,
    FOREIGN KEY (session_examen_id) REFERENCES SessionExamen(id) ON DELETE CASCADE,
    UNIQUE(etudiant_id, matiere_code, session_examen_id) -- Une note unique par triplet
);

-- Table Presence
CREATE TABLE Presence (
    id INT PRIMARY KEY Auto_increment,
    etudiant_id INTEGER NOT NULL,
    seance_id INTEGER NOT NULL,
    date_seance DATE NOT NULL,
    type_seance VARCHAR(50) NOT NULL,
    present BOOLEAN DEFAULT FALSE,
    justification VARCHAR(255),
    signature VARCHAR(100),
    created_at TIMESTAMP ,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (seance_id) REFERENCES Seance(id) ON DELETE CASCADE,
    UNIQUE(etudiant_id, seance_id) -- Une présence unique par étudiant par séance
);

-- Table PaiementDroits
CREATE TABLE PaiementDroits (
    id INT PRIMARY KEY Auto_increment,
    inscription_numero VARCHAR(50) NOT NULL,
    montant_total DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
    montant_paye DECIMAL(10,2) DEFAULT 0 CHECK (montant_paye >= 0),
    statut_paiement ENUM('IMPAYE', 'PARTIEL', 'COMPLET', 'EXONERE') DEFAULT 'IMPAYE',
    date_dernier_paiement DATE,
    mode_paiement ENUM('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'EN_LIGNE'),
    reference VARCHAR(100) UNIQUE,
    created_at TIMESTAMP ,
    FOREIGN KEY (inscription_numero) REFERENCES Inscription(numero_inscription) ON DELETE CASCADE,
    CONSTRAINT check_montant CHECK (montant_paye <= montant_total)
);

-- Table DossierCandidature (étendue pour étapes, paiements et métadonnées)
CREATE TABLE DossierCandidature (
    id INT PRIMARY KEY Auto_increment,
    etudiant_id INTEGER UNIQUE NOT NULL, -- Un étudiant a un seul dossier
    date_candidature DATE,
    statut ENUM('EN_ATTENTE', 'EN_EVALUATION', 'COMPLET', 'VALIDE', 'REJETE', 'ANNULE') DEFAULT 'EN_ATTENTE',
    documents_url TEXT, -- Tableau d'URLs de documents
    type_candidature VARCHAR(50), -- ex: PREMIERE_INSCRIPTION, REINSCRIPTION, CHANGEMENT_FILIERE
    frais_dossier DECIMAL(10,2) DEFAULT 0.00,
    frais_payes DECIMAL(10,2) DEFAULT 0.00,
    etape_actuelle VARCHAR(100),
    date_limite_complet DATE,
    informations_supplementaires TEXT,
    specialite_demandee VARCHAR(20),
    niveau_demande VARCHAR(20),
    etapes TEXT, -- JSON des étapes
    date_derniere_modification DATE,
    created_at TIMESTAMP ,
    FOREIGN KEY (etudiant_id) REFERENCES Etudiant(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES POUR LES PERFORMANCES
-- ============================================

-- Indexes sur les clés étrangères
CREATE INDEX idx_etudiant_specialite ON Etudiant(specialite_code);
CREATE INDEX idx_enseignant_departement ON Enseignant(departement);
CREATE INDEX idx_matiere_ue ON Matiere(ue_code);
CREATE INDEX idx_matiere_enseignant ON Matiere(enseignant_id);
CREATE INDEX idx_seance_matiere ON Seance(matiere_code);
CREATE INDEX idx_seance_salle ON Seance(salle_code);
CREATE INDEX idx_note_etudiant ON Note(etudiant_id);
CREATE INDEX idx_note_matiere ON Note(matiere_code);
CREATE INDEX idx_note_session ON Note(session_examen_id);
CREATE INDEX idx_presence_etudiant ON Presence(etudiant_id);
CREATE INDEX idx_presence_seance ON Presence(seance_id);
CREATE INDEX idx_paiement_inscription ON PaiementDroits(inscription_numero);
CREATE INDEX idx_inscription_etudiant ON Inscription(etudiant_id);
CREATE INDEX idx_inscription_annee ON Inscription(annee_academique);
CREATE INDEX idx_inscription_groupeue_insc ON Inscription_GroupeUE(inscript_code);
CREATE INDEX idx_inscription_groupeue_groupe ON Inscription_GroupeUE(groupeue_code);
CREATE INDEX idx_matiere_session_matiere ON Matiere_SessionExamen(matiere_code);
CREATE INDEX idx_matiere_session_session ON Matiere_SessionExamen(session_examen_id);

-- Indexes sur les champs de recherche fréquents
CREATE INDEX idx_utilisateur_email ON Utilisateur(email);
CREATE INDEX idx_utilisateur_role ON Utilisateur(role);
CREATE INDEX idx_etudiant_numero ON Etudiant(numero_etudiant);
CREATE INDEX idx_enseignant_matricule ON Enseignant(matricule);
CREATE INDEX idx_matiere_nom ON Matiere(nom);
CREATE INDEX idx_ue_nom ON UniteEnseignement(nom);
CREATE INDEX idx_session_libelle ON SessionExamen(libelle);

-- ============================================
-- CONTRAINTES ET TRIGGERS
-- ============================================

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour les relevés de notes des étudiants
CREATE VIEW ReleveNotes AS
SELECT 
    e.numero_etudiant,
    CONCAT(u.nom ,' ', u.prenom) AS etudiant,
    m.code AS code_matiere,
    m.nom AS matiere,
    ue.nom AS ue,
    n.note_cc,
    n.note_examen,
    n.note_tp,
    n.note_finale,
    n.validee,
    se.libelle AS session,
    se.type AS type_session
FROM Note n
JOIN Etudiant e ON n.etudiant_id = e.id
JOIN Utilisateur u ON e.id = u.id
JOIN Matiere m ON n.matiere_code = m.code
JOIN UniteEnseignement ue ON m.ue_code = ue.code
JOIN SessionExamen se ON n.session_examen_id = se.id
ORDER BY e.numero_etudiant, ue.nom, m.code;

-- Vue pour l'emploi du temps
CREATE VIEW EmploiDuTemps AS
SELECT 
    s.date_seance,
    s.heure_debut,
    s.heure_fin,
    m.code AS code_matiere,
    m.nom AS matiere,
    ue.nom AS ue,
    sa.code AS salle_code,
    sa.nom AS salle,
    CONCAT(u.nom,' ', u.prenom) AS enseignant,
    s.type_seance
FROM Seance s
JOIN Matiere m ON s.matiere_code = m.code
JOIN UniteEnseignement ue ON m.ue_code = ue.code
JOIN Salle sa ON s.salle_code = sa.code
LEFT JOIN Enseignant ens ON s.enseignant_id = ens.id
JOIN Utilisateur u ON ens.id = u.id
ORDER BY s.date_seance, s.heure_debut;

-- Vue pour les statistiques de présence
CREATE VIEW StatistiquesPresence AS
SELECT 
    e.numero_etudiant,
    CONCAT(u.nom,' ', u.prenom) AS etudiant,
    m.code AS code_matiere,
    m.nom AS matiere,
    COUNT(p.id) AS total_seances,
    COUNT(CASE WHEN p.present THEN 1 END) AS seances_presentes,
    ROUND(
        COUNT(CASE WHEN p.present THEN 1 END) * 100.0 / NULLIF(COUNT(p.id), 0),
        2
    ) AS taux_presence
FROM Presence p
JOIN Etudiant e ON p.etudiant_id = e.id
JOIN Utilisateur u ON e.id = u.id
JOIN Seance s ON p.seance_id = s.id
JOIN Matiere m ON s.matiere_code = m.code
GROUP BY e.id, e.numero_etudiant, u.nom, u.prenom, m.code, m.nom
ORDER BY e.numero_etudiant, m.code;

-- Vue pour les paiements en attente
CREATE VIEW PaiementsEnAttente AS
SELECT 
    e.numero_etudiant,
    CONCAT(u.nom,' ', u.prenom) AS etudiant,
    i.numero_inscription,
    pd.montant_total,
    pd.montant_paye,
    pd.montant_total - pd.montant_paye AS reste_a_payer,
    pd.statut_paiement,
    pd.date_dernier_paiement,
    aa.annee
FROM PaiementDroits pd
JOIN Inscription i ON pd.inscription_numero = i.numero_inscription
JOIN Etudiant e ON i.etudiant_id = e.id
JOIN Utilisateur u ON e.id = u.id
JOIN AnneeAcademique aa ON i.annee_academique = aa.annee
WHERE pd.statut_paiement IN ('IMPAYE', 'PARTIEL')
ORDER BY pd.date_dernier_paiement DESC;

-- ============================================
-- Triggers pour la gestion des mises à jour des vues matérialisées (si utilisées)
-- ============================================
DELIMITER $$

CREATE TRIGGER trigger_check_filiere
BEFORE INSERT ON Inscription_GroupeUE
FOR EACH ROW
BEGIN
    DECLARE etudiant_filiere_code VARCHAR(20);
    DECLARE specialite_filiere_code VARCHAR(20);
    DECLARE error_message VARCHAR(255);
    
    -- Récupérer la filière de l'étudiant via sa spécialité
    SELECT s.filiere_code INTO etudiant_filiere_code
    FROM Etudiant e
    JOIN Specialite s ON e.specialite_code = s.code
    WHERE e.id = (
        SELECT etudiant_id FROM Inscription WHERE numero_inscription = NEW.inscript_code
    );
    
    -- Récupérer la filière de la spécialité du groupe
    SELECT s.filiere_code INTO specialite_filiere_code
    FROM GroupeUE g
    JOIN Specialite s ON g.specialite_code = s.code
    WHERE g.code = NEW.groupeue_code;
    
    IF etudiant_filiere_code != specialite_filiere_code THEN
        SET error_message = CONCAT('L''étudiant doit s''inscrire dans un groupe de sa filière. Filière étudiant: ', 
                       COALESCE(etudiant_filiere_code, 'NULL'), 
                       ', Filière groupe: ', 
                       COALESCE(specialite_filiere_code, 'NULL'));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trigger_check_capacity
BEFORE INSERT ON Inscription_GroupeUE
FOR EACH ROW
BEGIN
    DECLARE current_count INT;
    DECLARE max_capacity INT;
    DECLARE error_message VARCHAR(255);
    
    -- Compter le nombre d'inscriptions actuelles
    SELECT COUNT(*) INTO current_count
    FROM Inscription_GroupeUE
    WHERE groupeue_code = NEW.groupeue_code AND statut = 'INSCRIT';
    
    -- Récupérer la capacité maximale
    SELECT capacite_max INTO max_capacity
    FROM GroupeUE WHERE code = NEW.groupeue_code;
    
    IF current_count >= max_capacity THEN
        -- Mettre à jour le statut du groupe
        UPDATE GroupeUE SET statut = 'COMPLET' WHERE code = NEW.groupeue_code;
        
        SET error_message = CONCAT('Le groupe UE est complet (capacité maximale atteinte: ', max_capacity, ')');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trigger_check_seance_conflict
BEFORE INSERT ON Seance
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    DECLARE error_message VARCHAR(255);
    
    SELECT COUNT(*) INTO conflict_count
    FROM Seance s
    WHERE s.salle_code = NEW.salle_code
      AND s.date_seance = NEW.date_seance
      AND (
        (NEW.heure_debut BETWEEN s.heure_debut AND s.heure_fin) OR
        (NEW.heure_fin BETWEEN s.heure_debut AND s.heure_fin) OR
        (s.heure_debut BETWEEN NEW.heure_debut AND NEW.heure_fin)
      );
    
    IF conflict_count > 0 THEN
        SET error_message = CONCAT('Conflit d''horaire dans la salle ', NEW.salle_code, ' à cette date/heure');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER update_utilisateur_updated_at 
BEFORE UPDATE ON Utilisateur
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

DELIMITER ;

-- Appliquer à d'autres tables si besoin
DELIMITER $$

CREATE TRIGGER update_filiere_updated_at 
BEFORE UPDATE ON Filiere
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$

DELIMITER ;

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================


-- ============================================
-- COMMENTAIRES SUR LES TABLES (Syntaxe MySQL)
-- ============================================

ALTER TABLE Utilisateur COMMENT 'Table de base pour tous les utilisateurs du système';
ALTER TABLE Etudiant COMMENT 'Étudiants inscrits dans l''établissement';
ALTER TABLE Enseignant COMMENT 'Enseignants et personnels pédagogiques';
ALTER TABLE Administrateur COMMENT 'Personnels administratifs avec droits étendus';
ALTER TABLE Salle COMMENT 'Salles de cours, amphis, et laboratoires';
ALTER TABLE Filiere COMMENT 'Filières académiques';
ALTER TABLE Specialite COMMENT 'Spécialités pédagogiques';
ALTER TABLE UniteEnseignement COMMENT 'Unités d''Enseignement (UE)';
ALTER TABLE GroupeUE COMMENT 'Groupes d''UE (classes pédagogiques)';
ALTER TABLE AnneeAcademique COMMENT 'Années académiques';
ALTER TABLE SessionExamen COMMENT 'Sessions d''examen (normales, rattrapage)';
ALTER TABLE Inscription COMMENT 'Inscriptions annuelles des étudiants';
ALTER TABLE Inscription_GroupeUE COMMENT 'Lien entre inscriptions et groupes UE';
ALTER TABLE Matiere COMMENT 'Matières individuelles composant les UE';
ALTER TABLE Seance COMMENT 'Séances de cours (horaires précis)';
ALTER TABLE Matiere_SessionExamen COMMENT 'Lien entre matières et sessions d''examen';
ALTER TABLE Note COMMENT 'Notes des étudiants par matière et session';
ALTER TABLE Presence COMMENT 'Présences aux séances de cours';
ALTER TABLE PaiementDroits COMMENT 'Paiements des droits universitaires';
ALTER TABLE DossierCandidature COMMENT 'Dossiers de candidature des futurs étudiants';
-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

SELECT 'Base de données créée avec succes' AS message;
SELECT COUNT(*) AS nombre_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Lister toutes les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;