export type Semestre = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10';
export type StatutGroupe = 'OUVERT' | 'COMPLET' | 'FERME' | 'ANNULE';
export type TypeUE = 'OBLIGATOIRE' | 'OPTIONNEL' | 'TRANSVERSAL';
export type TypeCours = 'CM' | 'TD' | 'TP';
export type JourSemaine = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI';
export type StatutInscription = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'ANNULE';
export type TypeSalle = 'AMPHI' | 'TD' | 'TP' | 'LABO' | 'ATELIER';

export const SEMESTRES: Semestre[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];
export const JOURS_SEMAINE: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
export const TYPES_COURS: TypeCours[] = ['CM', 'TD', 'TP'];
export const TYPES_UE: TypeUE[] = ['OBLIGATOIRE', 'OPTIONNEL', 'TRANSVERSAL'];
export const TYPES_SALLE: TypeSalle[] = ['AMPHI', 'TD', 'TP', 'LABO', 'ATELIER'];

// server/types/IUtilisateur.ts

export interface IUtilisateur {
  id?: number;
  nom?: string;
  prenom?: string;
  email?: string;
  password_hash?: string;
  telephone?: string;
  role?: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR';
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
  created_at?: Date | string;
  updated_at?: Date | string;
  last_login?: Date | string;
  photo_url?: string;
}

export interface IUtilisateurCreate {
  nom?: string;
  prenom?: string;
  email?: string;
  password_hash?: string;
  telephone?: string;
  role?: 'ETUDIANT' | 'ENSEIGNANT' | 'ADMINISTRATEUR';
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
  photo_url?: string;
}

export interface IUtilisateurUpdate {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  password_hash?: string;
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
  photo_url?: string;
  last_login?: Date | string;
}