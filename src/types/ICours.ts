// ==========================================
// INTERFACES matiere - Version 2.0
// 
// ==========================================

import { Semestre, StatutGroupe, TypeSalle, TypeUE } from "./IGeneral";
import { IMatiere } from "./IMatiere";


// ==========================================
// GROUPE DE COURS
// ==========================================

export interface IGroupeCours {
  code?: string;
  nom?: string;
  filiere_code?: string;
  niveau?: string;
  semestre?: Semestre;
  annee_academique_code?: string;
  credits_total?: number;
  capacite_max?: number;
  statut?: StatutGroupe;
  created_at?: Date | string;
}

export interface IGroupeCoursCreate extends Omit<IGroupeCours, 'created_at'> {}

export interface IGroupeCoursUpdate extends Partial<Omit<IGroupeCours, 'code' | 'created_at'>> {}

export interface IGroupeCoursWithDetails extends IGroupeCours {
  filiere_nom?: string;
  nombre_inscrits?: number;
  places_disponibles?: number;
  taux_occupation?: number;
  unites_enseignement?: IUniteEnseignement[];
}

// ==========================================
// UNITÉ D'ENSEIGNEMENT (UE)
// ==========================================

export interface IUniteEnseignement {
  code?: string;
  nom?: string;
  type?: TypeUE;
  credits?: number;
  coefficient?: number;
  volume_horaire_total?: number;
  description?: string;
  groupe_cours_code: string;
}

export interface IUniteEnseignementCreate extends IUniteEnseignement {}

export interface IUniteEnseignementUpdate extends Partial<Omit<IUniteEnseignement, 'code'>> {}

export interface IUniteEnseignementWithDetails extends IUniteEnseignement {
  matieres?: IMatiere[];
}



// ==========================================
// SALLE
// ==========================================

export interface ISalle {
  code: string;
  nom: string;
  capacite: number;
  type: TypeSalle;
  equipements?: any;  // JSON
}

export interface ISalleCreate extends ISalle {}

export interface ISalleUpdate extends Partial<Omit<ISalle, 'code'>> {}

// ==========================================
// FILIÈRE
// ==========================================

export interface IFiliere {
  code: string;
  nom: string;
  departement: string;
  niveaux_offerts?: any;  // JSON
  responsable_id?: number;
  statut: 'actif' | 'inactif'
}

export interface IFiliereCreate extends IFiliere {}

export interface IFiliereUpdate extends Partial<Omit<IFiliere, 'code'>> {}

export interface IFiliereWithDetails extends IFiliere {
  responsable_nom?: string;
  responsable_prenom?: string;
  nombre_groupes?: number;
}

// ==========================================
// ANNÉE ACADÉMIQUE
// ==========================================

export type StatutAnnee = 'planifie' | 'en_cours' | 'termine' | 'archive';

export interface IAnneeAcademique {
  code: string;
  date_debut: Date | string;
  date_fin: Date | string;
  statut: StatutAnnee;
}

export interface IAnneeAcademiqueCreate extends IAnneeAcademique {}

export interface IAnneeAcademiqueUpdate extends Partial<Omit<IAnneeAcademique, 'code'>> {}

// ==========================================
// FILTRES
// ==========================================
// ==========================================
// FILTRES
// ==========================================

export interface IUniteEnseignementFilters {
  groupe_cours_code?: string;
  type?: TypeUE;
  annee_academique_code?: string;
  semestre?: Semestre;
  filiere_code?: string;
  niveau?: string;
  credits_min?: number;
  credits_max?: number;
  volume_horaire_min?: number;
  volume_horaire_max?: number;
  search?: string;  // Recherche dans nom, code, description
  avec_matieres?: boolean;  // Inclure les matières dans les résultats
  statut_groupe?: StatutGroupe;  // Statut du groupe parent
  avec_etudiants?: boolean;  // UE avec des étudiants inscrits
  enseignants_ids?: number[];  // Filtrer par enseignants
}

export interface IGroupeCoursFilters {
  filiere_code?: string;
  niveau?: string;
  semestre?: Semestre;
  annee_academique_code?: string;
  statut?: StatutGroupe;
  search?: string;
  avec_ues?: boolean;  // Inclure les UE dans les résultats
  avec_etudiants?: boolean;  // Groupe avec des étudiants inscrits
  capacite_min?: number;
  capacite_max?: number;
  credits_min?: number;
  credits_max?: number;
}


export interface IFiliereFilters {
  departement?: string;
  responsable_id?: number;
  search?: string;
}

// ==========================================
// STATISTIQUES
// ==========================================
export interface IUniteEnseignementStatistics {
  total_ues: number;
  par_type: {
    OBLIGATOIRE: number;
    OPTIONNEL: number;
    TRANSVERSAL: number;
  };
  credits_total: number;
  volume_horaire_total: number;
  ues_avec_matieres: number;
  ues_sans_matieres: number;
  taux_remplissage: number;  // UE avec matières / total
  par_groupe: Array<{
    groupe_code: string;
    groupe_nom: string;
    nombre_ues: number;
    credits_total: number;
  }>;
  par_filiere: Array<{
    filiere_code: string;
    filiere_nom: string;
    nombre_ues: number;
  }>;
}

export interface IGroupeCoursStatistics {
  total_groupes: number;
  groupes_ouverts: number;
  groupes_complets: number;
  groupes_fermes: number;
  capacite_totale: number;
  nombre_inscrits_total: number;
  taux_occupation: number;
  par_filiere: Array<{
    filiere_code: string;
    filiere_nom: string;
    nombre_groupes: number;
    capacite_totale: number;
    nombre_inscrits: number;
  }>;
  par_annee_academique: Array<{
    annee_code: string;
    nombre_groupes: number;
    nombre_inscrits: number;
  }>;
}



// ==========================================
// COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME
// ==========================================

// Alias pour compatibilité avec l'ancien code
export interface ICours extends IMatiere {
  // Anciens champs mappés sur les nouveaux
  professeur?: string;  // enseignant_id → nom complet
  filiere?: string;     // via groupe_cours
  description_cours?: string;  // description de l'UE
  capacite_max?: number;  // du groupe_cours
  prerequis?: string;   // À gérer dans la logique métier
  date_debut?: Date | string;  // de l'année académique
  date_fin?: Date | string;    // de l'année académique
  statut?: string;      // du groupe_cours
  coefficient_examen?: number;
  coefficient_cc?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ICoursCreate extends Omit<ICours, 'code' | 'created_at' | 'updated_at'> {
  niveaux?: string[];
}

export interface ICoursWithNiveaux extends ICours {
  niveaux?: string[];
}

export interface ICoursUpdate extends Partial<Omit<ICours, 'code' | 'created_at' | 'updated_at'>> {
  niveaux?: string[];
}

export interface ICoursFilters {
  filiere?: string;
  semestre?: string;
  professeur?: string;
  statut?: string;
  niveau?: string;
  search?: string;
}

export interface CapacityCheckResult {
  capacite_max: number;
  nombre_inscrits: number;
}

