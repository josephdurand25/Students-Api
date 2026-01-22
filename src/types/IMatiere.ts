// ==========================================
// MATIÈRE
// ==========================================

import { JourSemaine, Semestre, TypeCours } from "./IGeneral";

// types/ICours.ts
export interface IMatiere {
  code?: string;
  nom?: string;
  type_cours?: string;
  credits?: number;
  coefficient?: number;
  volume_horaire?: number;
  salle?: string;  // Changé de salle_code
  jour?: string;
  heure_debut?: string;
  heure_fin?: string;
  ue_code?: string;  // Changé de unite_enseignement_code
  enseignant_id?: number;
}

export interface IMatiereCreate extends Omit<IMatiere, 'ue_code'> {
  ue_code: string;
}

export interface IMatiereUpdate extends Partial<IMatiereCreate> {}
export interface IMatiereWithDetails extends IMatiere {
  salle_nom?: string;
  salle_capacite?: number;
  enseignant_matricule?: string;
  enseignant_nom?: string;
  enseignant_prenom?: string;
  ue_nom?: string;
}

export interface IMatiereStatistics {
  total_matieres: number;
  par_type: {
    CM: number;
    TD: number;
    TP: number;
  };
  volume_horaire_total: number;
  credits_total: number;
  par_ue: Array<{
    ue_code: string;
    ue_nom: string;
    nombre_matieres: number;
    volume_horaire: number;
    credits: number;
  }>;
  par_enseignant: Array<{
    enseignant_id: number;
    enseignant_nom: string;
    enseignant_prenom: string;
    nombre_matieres: number;
    volume_horaire: number;
  }>;
}
export interface IMatiereFilters {
  ue_code ?: string;
  type_cours?: TypeCours;
  enseignant_id?: number;
  jour?: JourSemaine;
  search?: string;
  avec_notes?: boolean; 
  avec_presences?: boolean;  
  credits_min?: number;
  credits_max?: number;
  volume_horaire_min?: number;
  volume_horaire_max?: number;
  salle_code?: string;
  specialite_code?: string;
  filiere_code?: string;
  groupe_cours_code?: string;
  annee_academique_code?: string; 
  semestre?: Semestre;  
}
