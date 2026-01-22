// server/types/IAnneeAcademique.ts

export type StatutAnneeAcademique = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'CLOTUREE';

export interface IAnneeAcademique {
  annee?: string; // Format: 2023-2024
  date_debut?: Date | string;
  date_fin?: Date | string;
  statut?: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'CLOTUREE';
  description?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface IAnneeAcademiqueCreate {
  code: string;
  date_debut: Date | string;
  date_fin: Date | string;
  statut?: StatutAnneeAcademique;
  description?: string;
}

export interface IAnneeAcademiqueUpdate {
  date_debut?: Date | string;
  date_fin?: Date | string;
  statut?: StatutAnneeAcademique;
  description?: string;
}

export interface IAnneeAcademiqueWithDetails extends IAnneeAcademique {
  inscriptions_count?: number;
  sessions_count?: number;
  groupes_count?: number;
  etudiants_actifs_count?: number;
  statistiques?: {
    total_inscriptions: number;
    inscriptions_validees: number;
    inscriptions_en_attente: number;
    paiements_complets: number;
    paiements_partiels: number;
    paiements_impayes: number;
    taux_reussite_moyen?: number;
  };
}

export interface IAnneeAcademiqueStats {
  annee: string;
  total_etudiants: number;
  total_enseignants: number;
  total_matieres: number;
  total_seances: number;
  total_notes: number;
  taux_reussite: number;
  taux_presence: number;
  revenus_total?: number;
  depenses_total?: number;
  par_specialite: Array<{
    specialite_code: string;
    specialite_nom: string;
    etudiants_count: number;
    taux_reussite: number;
  }>;
  par_niveau: Array<{
    niveau: string;
    etudiants_count: number;
    taux_reussite: number;
  }>;
}

export interface IAnneeAcademiqueSearchParams {
  statut?: StatutAnneeAcademique;
  annee_min?: string; // Ex: 2020-2021
  annee_max?: string; // Ex: 2025-2026
  search?: string;
  page?: number;
  limit?: number;
}

export interface IChangementAnneeAcademique {
  annee_source: string;
  annee_destination: string;
  type_operation: 'PROMOTION' | 'REINSCRIPTION' | 'CHANGEMENT';
  options: {
    conserver_notes?: boolean;
    conserver_inscriptions?: boolean;
    transferer_paiements?: boolean;
    recalculer_moyennes?: boolean;
  };
  etudiants_ids?: number[];
  commentaire?: string;
}

export interface ICalendrierAcademique {
  id?: number;
  annee_academique: string;
  evenement: string;
  type_evenement: 'RENTREE' | 'VACANCES' | 'EXAMEN' | 'FERIE' | 'REUNION' | 'AUTRE';
  date_debut: Date | string;
  date_fin: Date | string;
  description?: string;
  public?: boolean; // Visible par les étudiants
  created_at?: Date | string;
}

export interface IPeriodeAcademique {
  id?: number;
  annee_academique: string;
  nom: string; // Ex: "Semestre 1", "Session normale", "Session rattrapage"
  type: 'SEMESTRE' | 'SESSION' | 'VACANCES' | 'STAGE' | 'PROJET';
  date_debut: Date | string;
  date_fin: Date | string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
  description?: string;
  couleur_calendrier?: string; // Pour l'affichage dans un calendrier
}

// Interface pour les statistiques comparatives entre années
export interface IComparaisonAnneeAcademique {
  annee_courante: IAnneeAcademiqueStats;
  annee_precedente: IAnneeAcademiqueStats;
  evolution: {
    etudiants: number; // Pourcentage
    taux_reussite: number;
    taux_presence: number;
    revenus: number;
  };
  points_forts: string[];
  points_amelioration: string[];
}

// Interface pour la planification d'une nouvelle année
export interface IPlanificationAnneeAcademique {
  nouvelle_annee: string; // Ex: 2024-2025
  date_debut_proposee: Date | string;
  date_fin_proposee: Date | string;
  based_on?: string; // Année à copier comme modèle
  options_copie: {
    structure_filieres?: boolean;
    programmes_cours?: boolean;
    enseignants?: boolean;
    salles?: boolean;
    calendrier?: boolean;
  };
  estimation_etudiants: number;
  budget_previsionnel?: number;
  commentaire?: string;
}

// Interface pour le rapport d'activité annuel
export interface IRapportAnnuel {
  annee_academique: string;
  date_generation: Date | string;
  resume_executif: string;
  statistiques_principales: {
    effectif_total: number;
    taux_reussite_general: number;
    taux_abandon: number;
    satisfaction_etudiants?: number;
    satisfaction_enseignants?: number;
  };
  performances_par_filiere: Array<{
    filiere_code: string;
    filiere_nom: string;
    effectif: number;
    taux_reussite: number;
    meilleure_matiere: string;
    pire_matiere: string;
  }>;
  finances: {
    recettes_total: number;
    depenses_total: number;
    solde: number;
    detail_recettes: Array<{
      type: string;
      montant: number;
      pourcentage: number;
    }>;
    detail_depenses: Array<{
      type: string;
      montant: number;
      pourcentage: number;
    }>;
  };
  evenements_marquants: string[];
  defis_rencontres: string[];
  recommandations: string[];
  perspectives: string[];
}

export interface IAnneeAcademiqueEnCours extends IAnneeAcademique {
  jours_restants: number;
  pourcentage_ecoule: number;
  prochains_evenements: ICalendrierAcademique[];
  alertes: Array<{
    type: 'INSCRIPTION' | 'PAIEMENT' | 'EXAMEN' | 'AUTRE';
    message: string;
    urgence: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  }>;
}