// src/interfaces/ICours.ts
export interface ICours {
  id?: number;
  code: string;
  nom: string;
  description_cours?: string;
  professeur: string;
  filiere: string;
  credits: number;
  semestre: 'S1' | 'S2' | 'Annuel';
  capacite_max?: number;
  jour?: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  heure_debut?: string;
  heure_fin?: string;
  salle?: string;
  prerequis?: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  statut?: 'Actif' | 'Inactif' | 'Terminé';
  coefficient_examen?: number;
  coefficient_cc?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICoursCreate extends Omit<ICours, 'id' | 'created_at' | 'updated_at'> {
  niveaux: ('L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'Doctorat')[];
}

// Interface étendue avec niveaux
export interface ICoursWithNiveaux extends ICours {
  niveaux: ('L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'Doctorat')[];
}

export interface ICoursUpdate extends Partial<Omit<ICours, 'id' | 'created_at' | 'updated_at'>> {
  niveaux?: ('L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'Doctorat')[];
}

export interface ICoursFilters {
  filiere?: string;
  semestre?: string;
  professeur?: string;
  statut?: string;
  niveau?: string;
}

// Définir une interface pour le résultat
export interface CapacityCheckResult {
  capacite_max: number;
  nombre_inscrits: number;
} 