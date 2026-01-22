// ==========================================
// INTERFACES ÉTUDIANTS - Version 2.0
// Basé sur database_v2.sql avec héritage Utilisateur → Etudiant
// ==========================================

export type StatutUtilisateur = 'ACTIF' | 'INACTIF' | 'SUSPENDU';
export type StatutAcademique = 'inscrit' | 'non_inscrit' | 'diplome' | 'abandon' | 'exclu';
export type Genre = 'm' | 'f' | 'autre';
export type RoleUtilisateur = 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR';

// Interface complète pour un étudiant (jointure Utilisateur + Etudiant)
export interface IEtudiant {
  // Champs de Utilisateur
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  password_hash?: string;
  telephone?: string;
  role?: RoleUtilisateur;
  statut?: StatutUtilisateur;
  numero_etudiant?: string;
  date_naissance?: Date | string;
  lieu_naissance?: string;
  genre?: Genre;
  nationalite?: string;
  adresse_complete?: string;
  region_origine?: string;
  specialite_code?: string; 
  specialite_nom?: string;
  filiere_code?: string;
  filiere_nom?: string;
  // filiere?: string;
  niveau?: string;
  statut_academique?: StatutAcademique;
  photo_profil?: string;
  date_inscription?: Date | string;
  
  // Champs calculés
  age?: number;
  nom_complet?: string;
  
  // Timestamps
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Interface pour la création d'un étudiant
export interface IEtudiantFormRequest {
  // Champs Utilisateur requis
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  telephone?: string;
  numero_etudiant?: string;  
  date_naissance?: Date | string;
  lieu_naissance?: string;
  genre?: Genre;
  nationalite?: string;
  adresse_complete?: string;
  region_origine?: string;
  specialite_code: string;
  niveau?: string;
  photo_profil?: string;
  date_inscription?: Date | string;
  
}

// Interface pour la mise à jour d'un étudiant
export interface IEtudiantUpdateRequest extends Partial<Omit<IEtudiantFormRequest, 'numero_etudiant'>> {
  statut?: StatutUtilisateur;
  statut_academique?: StatutAcademique;
}

// Interface pour les filtres de recherche
export interface IEtudiantFilters {
  filiere?: string;
  niveau?: string;
  statut?: StatutUtilisateur;
  statut_academique?: StatutAcademique;
  search?: string;  // Recherche dans nom, prenom, numero_etudiant
}

// Interface pour les critères de recherche avancée
export interface IEtudiantSearchCriteria {
  nom?: string;
  prenom?: string;
  email?: string;
  numero_etudiant?: string;
  filiere?: string;
  niveau?: string;
  statut?: StatutUtilisateur;
  statut_academique?: StatutAcademique;
  nationalite?: string;
  region_origine?: string;
  minAge?: number;
  maxAge?: number;
}

// Interface pour les statistiques d'étudiants
export interface IEtudiantStatistics {
  total: number;
  inscrits: number;
  non_inscrits: number;
  diplomes: number;
  abandons: number;
  exclus: number;
  parFiliere: Array<{
    filiere: string;
    total: number;
    inscrits: number;
    diplomes: number;
    abandons: number;
    age_moyen: number;
  }>;
}

// Interface simplifiée pour l'affichage en liste
export interface IEtudiantListItem {
  id: number;
  numero_etudiant: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  filiere?: string;
  niveau?: string;
  statut: StatutUtilisateur;
  statut_academique: StatutAcademique;
  photo_profil?: string;
}

// Interface pour les cours d'un étudiant
export interface IEtudiantCours {
  code: string;
  nom: string;
  filiere_code?: string;
  niveau?: string;
  semestre: string;
  date_inscription: Date | string;
  statut_inscription: string;
}

// Interface pour les notes d'un étudiant
export interface IEtudiantNote {
  id: number;
  matiere_nom: string;
  matiere_code: string;
  credits: number;
  note_cc?: number;
  note_examen?: number;
  note_tp?: number;
  note_finale?: number;
  validee: boolean;
  session: string;
  commentaire?: string;
}

// Interface pour la moyenne générale d'un étudiant
export interface IEtudiantMoyenne {
  moyenne: number;
  nombre_matieres: number;
  credits_obtenus: number;
  credits_totaux: number;
}

// Type pour les exports
export type StatutEtudiant = StatutAcademique;  // Alias pour compatibilité
export type IEtudiantUpdaterequest = IEtudiantUpdateRequest;  // Alias pour compatibilité