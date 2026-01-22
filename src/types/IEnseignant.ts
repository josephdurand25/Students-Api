import { IUtilisateur } from "./IGeneral";

export interface IEnseignant extends IUtilisateur {
  id?: number;
  matricule?: string;
  departement?: string;
  bureau?: string;
  specialite?: string;
  grade?: string;
  date_embauche?: Date | string;
  date_depart?: Date | string;
  statut_contrat?: 'PERMANENT' | 'VACATAIRE' | 'CONTRACTUEL' | 'EMERITE';
  charge_horaire_semaine?: number;
  heures_complementaires?: number;
  type_enseignant?: 'PROFESSEUR' | 'MAITRE_CONFERENCES' | 'PROFESSEUR_AGREGE' | 'ASSISTANT' | 'VACATAIRE';
  qualification?: string;
  domaine_recherche?: string;
  publications_url?: string;
  cours_autorises?: string[]; // Types de cours autorisés à enseigner
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface IEnseignantCreate {
  nom?: string;
  prenom?: string;
  email?: string;
  password_hash?: string;
  telephone?: string;
  matricule?: string;
  departement?: string;
  bureau?: string;
  specialite?: string;
  grade?: string;
  date_embauche?: Date | string;
  statut_contrat?: 'PERMANENT' | 'VACATAIRE' | 'CONTRACTUEL' | 'EMERITE';
  charge_horaire_semaine?: number;
  type_enseignant?: 'PROFESSEUR' | 'MAITRE_CONFERENCES' | 'PROFESSEUR_AGREGE' | 'ASSISTANT' | 'VACATAIRE';
  qualification?: string;
  domaine_recherche?: string;
  publications_url?: string;
  cours_autorises?: string[];
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
}

export interface IEnseignantUpdate {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  matricule?: string;
  departement?: string;
  bureau?: string;
  specialite?: string;
  grade?: string;
  date_depart?: Date | string;
  statut_contrat?: 'PERMANENT' | 'VACATAIRE' | 'CONTRACTUEL' | 'EMERITE';
  charge_horaire_semaine?: number;
  heures_complementaires?: number;
  type_enseignant?: 'PROFESSEUR' | 'MAITRE_CONFERENCES' | 'PROFESSEUR_AGREGE' | 'ASSISTANT' | 'VACATAIRE';
  qualification?: string;
  domaine_recherche?: string;
  publications_url?: string;
  cours_autorises?: string[];
  statut?: 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'BLOQUE';
}

export interface IEnseignantWithDetails extends IEnseignant {
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  utilisateur_telephone?: string;
  matieres_count?: number;
  seances_count?: number;
  groupes_count?: number;
  matieres?: Array<{
    code: string;
    nom: string;
    type_cours: string;
    ue_code: string;
    ue_nom: string;
  }>;
  groupes?: Array<{
    code: string;
    nom: string;
    niveau: string;
    specialite_code: string;
    specialite_nom: string;
  }>;
}

export interface IEnseignantStats {
  enseignant_id: number;
  nom_complet: string;
  total_matieres: number;
  total_seances: number;
  heures_total: number;
  heures_complementaires: number;
  taux_remplissage: number; // Pourcentage de charge horaire utilisée
  moyenne_evaluation?: number; // Si vous avez un système d'évaluation
  dernier_cours?: Date | string;
}

export interface IEnseignantEmploiTemps {
  enseignant_id: number;
  nom_complet: string;
  seances: Array<{
    id: number;
    matiere_code: string;
    matiere_nom: string;
    salle_code: string;
    salle_nom: string;
    date_seance: Date | string;
    heure_debut: string;
    heure_fin: string;
    type_seance: string;
    groupe_nom?: string;
    ue_nom: string;
  }>;
  heures_par_jour: {
    [key: string]: number; // Ex: { "LUNDI": 4, "MARDI": 6, ... }
  };
  heures_semaine: number;
}

// Interface pour la recherche avancée des enseignants
export interface IEnseignantSearchParams {
  departement?: string;
  grade?: string;
  type_enseignant?: string;
  statut_contrat?: string;
  specialite?: string;
  disponible_jour?: string; // Pour recherche par disponibilité
  disponible_heure?: string;
  search?: string; // Recherche globale
  statut?: string;
  page?: number;
  limit?: number;
}

// Interface pour les statistiques départementales
export interface IDepartementStats {
  departement: string;
  total_enseignants: number;
  par_grade: {
    [grade: string]: number;
  };
  par_statut_contrat: {
    [statut: string]: number;
  };
  heures_total: number;
  matieres_total: number;
}

// Interface pour l'affectation d'un enseignant à une matière
export interface IAffectationMatiere {
  matiere_code: string;
  enseignant_id: number;
  date_debut: Date | string;
  date_fin?: Date | string;
  type_affectation: 'PRINCIPAL' | 'SECONDAIRE' | 'REMPLACANT';
  commentaire?: string;
}

// Interface pour la charge horaire
export interface IChargeHoraire {
  enseignant_id: number;
  annee_academique: string;
  semestre: string;
  charge_prevue: number; // Heures prévues
  charge_reelle: number; // Heures effectuées
  charge_complementaire: number; // Heures supplémentaires
  taux_realisation: number; // Pourcentage
  commentaire?: string;
}

// Interface pour les disponibilités
export interface IDisponibiliteEnseignant {
  enseignant_id: number;
  jour: 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';
  heure_debut: string;
  heure_fin: string;
  type_disponibilite: 'ENSEIGNEMENT' | 'RECHERCHE' | 'ADMINISTRATIF' | 'CONSULTATION' | 'INDISPONIBLE';
  periodicite?: 'HEBDOMADAIRE' | 'BIHEBDOMADAIRE' | 'MENSUEL' | 'PONCTUEL';
  date_debut?: Date | string;
  date_fin?: Date | string;
  commentaire?: string;
}