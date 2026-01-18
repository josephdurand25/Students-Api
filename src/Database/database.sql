-- server/config/database.sql
CREATE DATABASE IF NOT EXISTS sigif_students_db;
USE sigif_students_db;

-- Table des utilisateurs (administrateurs, professeurs)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'professeur', 'secretaire', 'etudiant') DEFAULT 'professeur',
  statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
  departement VARCHAR(100),
  telephone VARCHAR(20),
  bureau VARCHAR(50),
  etudiant_id INT NULL,
  reset_password_token VARCHAR(255),
  reset_password_expire DATETIME,
  derniere_connexion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE SET NULL
);

-- Table des étudiants
CREATE TABLE IF NOT EXISTS etudiants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  numero_etudiant VARCHAR(12) UNIQUE NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  date_naissance DATE NOT NULL,
  genre ENUM('homme', 'femme', 'autre') DEFAULT 'autre',
  email VARCHAR(100) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  adresse_rue VARCHAR(255),
  adresse_ville VARCHAR(100) NOT NULL,
  adresse_code_postal VARCHAR(10),
  adresse_pays VARCHAR(50) DEFAULT 'France',
  date_inscription DATE NOT NULL,
  filiere VARCHAR(50) NOT NULL,
  niveau ENUM('L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat') NOT NULL,
  statut ENUM('actif', 'inactif', 'diplome', 'abandon') DEFAULT 'actif',
  photo_profil VARCHAR(255) DEFAULT 'default-avatar.png',
  user_id INT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT null default null,
  modified_by INT,
  INDEX idx_nom_prenom (nom, prenom),
  INDEX idx_filiere_niveau (filiere, niveau),
  INDEX idx_statut (statut),
  INDEX idx_numero_etudiant (numero_etudiant),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des cours
CREATE TABLE IF NOT EXISTS cours (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  professeur VARCHAR(100) NOT NULL,
  filiere VARCHAR(50) NOT NULL,
  credits INT NOT NULL CHECK (credits BETWEEN 1 AND 12),
  semestre ENUM('S1', 'S2', 'Annuel') NOT NULL,
  capacite_max INT DEFAULT 30,
  jour ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'),
  heure_debut TIME,
  heure_fin TIME,
  salle VARCHAR(50),
  prerequis TEXT,
  date_debut DATE,
  date_fin DATE,
  statut ENUM('actif', 'inactif', 'terminé') DEFAULT 'actif',
  coefficient_examen DECIMAL(3,2) DEFAULT 0.60,
  coefficient_cc DECIMAL(3,2) DEFAULT 0.40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_filiere (filiere),
  INDEX idx_professeur (professeur),
  INDEX idx_statut (statut)
);

-- Table de relation entre cours et niveaux (Many-to-Many)
CREATE TABLE IF NOT EXISTS cours_niveaux (
  cours_id INT NOT NULL,
  niveau ENUM('L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cours_id, niveau),
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

-- Table des inscriptions (étudiants aux cours)
CREATE TABLE IF NOT EXISTS inscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  etudiant_id INT NOT NULL,
  cours_id INT NOT NULL,
  date_inscription DATE DEFAULT (CURRENT_DATE),
  statut ENUM('inscrit', 'abandon', 'terminé') DEFAULT 'inscrit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_inscription (etudiant_id, cours_id),
  INDEX idx_etudiant (etudiant_id),
  INDEX idx_cours (cours_id),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

-- Table des notes
CREATE TABLE IF NOT EXISTS notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  etudiant_id INT NOT NULL,
  cours_id INT NOT NULL,
  note_examen DECIMAL(4,2) CHECK (note_examen BETWEEN 0 AND 20),
  note_cc DECIMAL(4,2) CHECK (note_cc BETWEEN 0 AND 20),
  note_tp DECIMAL(4,2) CHECK (note_cc BETWEEN 0 AND 20),
  note_finale DECIMAL(4,2) CHECK (note_finale BETWEEN 0 AND 20),
  appreciation TEXT,
  type_evaluation ENUM('examen', 'controle continu', 'tp', 'oral') DEFAULT 'examen',
  date_evaluation DATE DEFAULT (CURRENT_DATE),
  validee BOOLEAN DEFAULT FALSE,
  validee_par INT,
  date_validation DATE,
  commentaire VARCHAR(50),
  remarques TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_evaluation (etudiant_id, cours_id),
  INDEX idx_etudiant_cours (etudiant_id, cours_id),
  INDEX idx_note_finale (note_finale),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
  FOREIGN KEY (validee_par) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des documents étudiants
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  etudiant_id INT NOT NULL,
  nom VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(50),
  taille BIGINT,
  date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_etudiant (etudiant_id),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

-- Table des absences
CREATE TABLE IF NOT EXISTS absences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  etudiant_id INT NOT NULL,
  cours_id INT NOT NULL,
  date_absence DATE NOT NULL,
  justifiee BOOLEAN DEFAULT FALSE,
  motif TEXT,
  piece_justificative VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_etudiant_date (etudiant_id, date_absence),
  INDEX idx_cours_date (cours_id, date_absence),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

-- Vue pour la moyenne générale des étudiants
CREATE OR REPLACE VIEW vue_moyennes_etudiants AS
SELECT 
  e.id,
  e.numero_etudiant,
  e.nom,
  e.prenom,
  e.filiere,
  e.niveau,
  COUNT(n.id) as nombre_notes,
  AVG(n.note_finale) as moyenne_generale,
  SUM(CASE WHEN n.note_finale >= 10 THEN 1 ELSE 0 END) as cours_reussis,
  SUM(CASE WHEN n.note_finale < 10 THEN 1 ELSE 0 END) as cours_echoues
FROM etudiants e
LEFT JOIN notes n ON e.id = n.etudiant_id
WHERE n.validee = TRUE
GROUP BY e.id;

-- Vue pour les statistiques par filière
CREATE OR REPLACE VIEW vue_statistiques_filieres AS
SELECT 
  filiere,
  COUNT(*) as total_etudiants,
  SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as etudiants_actifs,
  SUM(CASE WHEN statut = 'diplome' THEN 1 ELSE 0 END) as etudiants_diplomes,
  AVG(TIMESTAMPDIFF(YEAR, date_naissance, CURDATE())) as age_moyen
FROM etudiants
GROUP BY filiere;

-- Triggers
-- Trigger pour calculer automatiquement la note finale
DELIMITER $$
CREATE TRIGGER before_note_insert
BEFORE INSERT ON notes
FOR EACH ROW
BEGIN
  IF NEW.note_examen IS NOT NULL AND NEW.note_cc IS NOT NULL THEN
    SET NEW.note_finale = (NEW.note_examen * 0.6) + (NEW.note_cc * 0.4);
  ELSEIF NEW.note_examen IS NOT NULL THEN
    SET NEW.note_finale = NEW.note_examen;
  ELSEIF NEW.note_cc IS NOT NULL THEN
    SET NEW.note_finale = NEW.note_cc;
  END IF;
END$$
DELIMITER ;

-- Trigger pour mettre à jour la note finale
DELIMITER $$
CREATE TRIGGER before_note_update
BEFORE UPDATE ON notes
FOR EACH ROW
BEGIN
  IF NEW.note_examen IS NOT NULL AND NEW.note_cc IS NOT NULL THEN
    SET NEW.note_finale = (NEW.note_examen * 0.6) + (NEW.note_cc * 0.4);
  ELSEIF NEW.note_examen IS NOT NULL THEN
    SET NEW.note_finale = NEW.note_examen;
  ELSEIF NEW.note_cc IS NOT NULL THEN
    SET NEW.note_finale = NEW.note_cc;
  END IF;
END$$
DELIMITER ;

-- Procédure stockée pour archiver les anciens étudiants
DELIMITER $$
CREATE PROCEDURE archiver_anciens_etudiants(IN annee_limite INT)
BEGIN
  UPDATE etudiants 
  SET statut = 'inactif'
  WHERE statut = 'actif' 
    AND YEAR(date_inscription) < annee_limite
    AND id NOT IN (
      SELECT DISTINCT etudiant_id 
      FROM inscriptions 
      WHERE YEAR(date_inscription) >= annee_limite - 1
    );
END$$
DELIMITER ;