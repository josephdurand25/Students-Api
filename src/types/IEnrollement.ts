// ==========================================
// INTERFACES INSCRIPTIONS - Version 2.0
// Basé sur database_v2.sql avec InscriptionGroupe
// ==========================================

export type StatutInscription = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'ANNULE';
export type Semestre = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10';

// ==========================================
// INSCRIPTION GROUPE
// ==========================================

export interface IInscriptionGroupe {
  id?: number;
  numero_inscription: string;
  etudiant_id: number;
  groupe_cours_code: string;
  annee_academique: string;
  semestre: Semestre;
  statut: StatutInscription;
  date_inscription: Date | string;
  date_validation?: Date | string;
  fiche_url?: string;
  valide_par_admin_id?: number;
  created_at?: Date | string;
}

// Interface pour la création d'une inscription
export interface IInscriptionGroupeCreate extends Omit<IInscriptionGroupe, 'id' | 'numero_inscription' | 'date_inscription' | 'created_at'> {
  // Le numero_inscription sera généré automatiquement
  // La date_inscription sera la date actuelle
}

// Interface pour la mise à jour d'une inscription
export interface IInscriptionGroupeUpdate extends Partial<Omit<IInscriptionGroupe, 'id' | 'numero_inscription' | 'etudiant_id' | 'groupe_cours_code' | 'created_at'>> {}

// Interface avec tous les détails (vue SQL)
export interface IInscriptionGroupeDetails extends IInscriptionGroupe {
  // Infos étudiant
  numero_etudiant: string;
  nom_etudiant: string;
  prenom_etudiant: string;
  
  // Infos groupe cours
  nom_groupe: string;
  filiere_code?: string;
  niveau?: string;
  
  // Infos administrateur validateur
  nom_admin?: string;
  prenom_admin?: string;
}

// ==========================================
// PAIEMENT DES DROITS
// ==========================================

export type StatutPaiement = 'IMPAYE' | 'PARTIEL' | 'PAYE';
export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHEQUE';

export interface IPaiementDroits {
  id?: number;
  inscription_groupe_id: number;
  montant_total: number;
  montant_paye: number;
  statut_paiement: StatutPaiement;  // Calculé automatiquement par trigger
  mode_paiement?: ModePaiement;
  reference_paiement?: string;
  date_echeance?: Date | string;
  date_dernier_paiement?: Date | string;  // Mis à jour automatiquement par trigger
  commentaire?: string;
}

export interface IPaiementDroitsCreate extends Omit<IPaiementDroits, 'id' | 'statut_paiement' | 'date_dernier_paiement'> {}

export interface IPaiementDroitsUpdate extends Partial<Omit<IPaiementDroits, 'id' | 'inscription_groupe_id'>> {}

export interface IPaiementDroitsDetails extends IPaiementDroits {
  // Infos inscription
  numero_inscription: string;
  numero_etudiant: string;
  nom_etudiant: string;
  prenom_etudiant: string;
  nom_groupe: string;
  
  // Montants calculés
  montant_restant: number;
  pourcentage_paye: number;
}

// ==========================================
// INSCRIPTION EN BATCH
// ==========================================

export interface IInscriptionBatch {
  groupe_cours_code: string;
  annee_academique: string;
  semestre: Semestre;
  etudiants_ids: number[];
}

export interface IInscriptionBatchResult {
  success_count: number;
  error_count: number;
  inscriptions: IInscriptionGroupe[];
  errors?: Array<{
    etudiant_id: number;
    error: string;
  }>;
}

// ==========================================
// VÉRIFICATIONS
// ==========================================

export interface ICapaciteCheck {
  groupe_cours_code: string;
  capacite_max: number;
  nombre_inscrits: number;
  places_disponibles: number;
  peut_inscrire: boolean;
  message?: string;
}

export interface IPrerequisCheck {
  etudiant_id: number;
  groupe_cours_code: string;
  prerequis_satisfaits: boolean;
  prerequis_manquants?: string[];
  message?: string;
}

export interface IConflitHoraire {
  etudiant_id: number;
  groupe_cours_code: string;
  a_conflit: boolean;
  matieres_en_conflit?: Array<{
    matiere_code: string;
    nom_matiere: string;
    jour: string;
    heure_debut: string;
    heure_fin: string;
  }>;
  message?: string;
}

// ==========================================
// FILTRES
// ==========================================

export interface IInscriptionGroupeFilters {
  etudiant_id?: number;
  groupe_cours_code?: string;
  annee_academique?: string;
  semestre?: Semestre;
  statut?: StatutInscription;
  filiere_code?: string;
  niveau?: string;
  valide_par_admin_id?: number;
  date_debut?: Date | string;
  date_fin?: Date | string;
}

export interface IPaiementDroitsFilters {
  inscription_groupe_id?: number;
  statut_paiement?: StatutPaiement;
  mode_paiement?: ModePaiement;
  date_debut?: Date | string;
  date_fin?: Date | string;
  montant_min?: number;
  montant_max?: number;
}

// ==========================================
// STATISTIQUES
// ==========================================

export interface IInscriptionStatistics {
  total_inscriptions: number;
  par_statut: {
    en_attente: number;
    validees: number;
    rejetees: number;
    annulees: number;
  };
  par_semestre: Record<Semestre, number>;
  par_filiere?: Record<string, number>;
  taux_validation: number;  // Pourcentage
}

export interface IPaiementStatistics {
  total_montant_attendu: number;
  total_montant_paye: number;
  total_montant_restant: number;
  par_statut: {
    impayes: number;
    partiels: number;
    payes: number;
  };
  taux_recouvrement: number;  // Pourcentage
}

// ==========================================
// VALIDATION
// ==========================================

export interface IValidationRequest {
  inscription_id: number;
  admin_id: number;
  action: 'valider' | 'rejeter';
  commentaire?: string;
}

export interface IValidationBatchRequest {
  inscriptions_ids: number[];
  admin_id: number;
  action: 'valider' | 'rejeter';
  commentaire?: string;
}

// ==========================================
// FICHE D'INSCRIPTION
// ==========================================

export interface IFicheInscription {
  inscription: IInscriptionGroupeDetails;
  etudiant: {
    numero_etudiant: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    date_naissance?: string;
    filiere?: string;
    niveau?: string;
  };
  groupe_cours: {
    code: string;
    nom: string;
    filiere_code?: string;
    niveau?: string;
    semestre: Semestre;
    credits_total: number;
  };
  paiement?: IPaiementDroits;
  date_generation: Date | string;
}

// ==========================================
// CONSTANTES
// ==========================================

export const STATUTS_INSCRIPTION: StatutInscription[] = [
  'EN_ATTENTE',
  'VALIDE',
  'REJETE',
  'ANNULE'
];

export const STATUTS_PAIEMENT: StatutPaiement[] = [
  'IMPAYE',
  'PARTIEL',
  'PAYE'
];

export const MODES_PAIEMENT: ModePaiement[] = [
  'ESPECES',
  'VIREMENT',
  'MOBILE_MONEY',
  'CHEQUE'
];

export const SEMESTRES: Semestre[] = [
  'S1', 'S2', 'S3', 'S4', 'S5', 
  'S6', 'S7', 'S8', 'S9', 'S10'
];

// ==========================================
// HELPERS
// ==========================================

/**
 * Génère un numéro d'inscription unique
 */
export function genererNumeroInscription(
  annee: string,
  semestre: Semestre,
  sequence: number
): string {
  const anneeCode = annee.substring(0, 4);
  const semestreNum = semestre.replace('S', '');
  const sequenceStr = sequence.toString().padStart(5, '0');
  return `INS${anneeCode}${semestreNum}${sequenceStr}`;
}

/**
 * Calcule le montant restant à payer
 */
export function calculerMontantRestant(
  montant_total: number,
  montant_paye: number
): number {
  return Math.max(0, montant_total - montant_paye);
}

/**
 * Calcule le pourcentage payé
 */
export function calculerPourcentagePaye(
  montant_total: number,
  montant_paye: number
): number {
  if (montant_total === 0) return 0;
  return Number(((montant_paye / montant_total) * 100).toFixed(2));
}

/**
 * Détermine le statut de paiement
 */
export function determinerStatutPaiement(
  montant_total: number,
  montant_paye: number
): StatutPaiement {
  if (montant_paye === 0) return 'IMPAYE';
  if (montant_paye >= montant_total) return 'PAYE';
  return 'PARTIEL';
}

/**
 * Vérifie si l'étudiant peut s'inscrire (paiement)
 */
export function peutSinscrire(paiement: IPaiementDroits): boolean {
  return paiement.statut_paiement === 'PAYE';
}