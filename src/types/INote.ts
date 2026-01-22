// ==========================================
// INTERFACES NOTES - Version 2.0
// Basé sur database_v2.sql avec Note liée à Matiere
// ==========================================

export type TypeEvaluation = 'CONTINUE' | 'EXAMEN' | 'RATTRAPAGE';
export type SessionExamen = 'NORMALE' | 'RATTRAPAGE' | 'SPECIALE';

// ==========================================
// NOTE
// ==========================================

export interface INote {
  id?: number;
  etudiant_id?: number;
  matiere_code?: string;  // Lié à Matiere au lieu de cours_id
  note_cc?: number;      // DECIMAL(4,2)
  note_examen?: number;  // DECIMAL(4,2)
  note_tp?: number;      // DECIMAL(4,2)
  note_finale?: number;  // DECIMAL(4,2) - Calculée automatiquement par trigger
  type_evaluation?: TypeEvaluation;
  validee?: boolean;
  date_validation?: Date | string;
  commentaire?: string;
  session?: SessionExamen;
  saisie_par_enseignant_id?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// Interface pour la création d'une note
export interface INoteCreate extends Omit<INote, 'id' | 'note_finale' | 'validee' | 'created_at' | 'updated_at'> {
  // note_finale sera calculée automatiquement par le trigger SQL
}

// Interface pour la mise à jour d'une note
export interface INoteUpdate extends Partial<Omit<INote, 'id' | 'etudiant_id' | 'matiere_code' | 'created_at' | 'updated_at'>> {}

// Interface avec tous les détails (vue SQL)
export interface INoteDetails extends INote {
  // Infos étudiant
  numero_etudiant: string;
  nom_etudiant: string;
  prenom_etudiant: string;
  
  // Infos matière
  nom_matiere: string;
  unite_enseignement_code: string;
  
  // Infos UE
  nom_ue: string;
  coefficient_ue: number;
  
  // Infos enseignant
  nom_enseignant?: string;
  prenom_enseignant?: string;
  
  // Calculs
  admis?: boolean;     // note_finale >= 10
  mention?: string;    // Passable, AB, B, TB
}

// ==========================================
// SAISIE EN BATCH
// ==========================================

export interface IGradeEntry {
  etudiant_id: number;
  note_cc?: number;
  note_examen?: number;
  note_tp?: number;
  commentaire?: string;
}

export interface IGradeBatch {
  matiere_code: string;  // Au lieu de cours_id
  session: SessionExamen;
  notes: IGradeEntry[];
}

// ==========================================
// STATISTIQUES
// ==========================================

export interface IGradeStatistics {
  matiere_code: string;
  moyenne_classe: number;
  note_min: number;
  note_max: number;
  nb_admis: number;
  nb_ajournes: number;
  taux_reussite: number;  // Pourcentage
  repartition_mentions: {
    passable: number;
    assez_bien: number;
    bien: number;
    tres_bien: number;
  };
  nombre_notes: number;
}

// ==========================================
// FILTRES
// ==========================================

export interface INoteFilters {
  etudiant_id?: number;
  matiere_code?: string;
  unite_enseignement_code?: string;
  session?: SessionExamen;
  type_evaluation?: TypeEvaluation;
  validee?: boolean;
  admis?: boolean;  // note_finale >= 10
  note_min?: number;
  note_max?: number;
  saisie_par_enseignant_id?: number;
}

// ==========================================
// RELEVÉ DE NOTES
// ==========================================

export interface IReleveNote {
  matiere_code: string;
  nom_matiere: string;
  credits: number;
  note_cc?: number;
  note_examen?: number;
  note_tp?: number;
  note_finale: number;
  resultat: 'Admis' | 'Ajourne';
  mention?: string;
  session: SessionExamen;
}

export interface IReleveData {
  etudiant: {
    numero_etudiant: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    filiere?: string;
    niveau?: string;
  };
  annee_academique: string;
  semestre: string;
  date_edition: Date | string;
  notes: IReleveNote[];
  moyenne_generale: number;
  credits_obtenus: number;
  credits_totaux: number;
  rang_classe?: number;
  effectif_classe?: number;
}

// ==========================================
// MOYENNE GÉNÉRALE
// ==========================================

export interface IMoyenneEtudiant {
  moyenne: number;
  nombre_matieres: number;
  credits_obtenus: number;
  credits_totaux: number;
  nombre_notes_validees: number;
}

// ==========================================
// PROCÈS-VERBAL (PV)
// ==========================================

export interface IPVNote {
  matiere_code: string;
  nom_matiere: string;
  credits: number;
  note_finale: number;
  validation: 'admis' | 'ajourne';
}

export interface IPVData {
  etudiant: {
    numero_etudiant: string;
    nom: string;
    prenom: string;
    filiere?: string;
    niveau?: string;
  };
  annee_academique: string;
  semestre: string;
  date_deliberation: Date | string;
  notes: IPVNote[];
  credits_obtenus: number;
  credits_totaux: number;
  moyenne_generale: number;
  decision: 'admis' | 'ajourne' | 'redouble';
  mention?: string;
  observations?: string;
  signature_president?: string;
  signature_secretaire?: string;
}

// ==========================================
// CALCULS ET UTILITAIRES
// ==========================================

/**
 * Calcule la note finale selon la formule du trigger SQL:
 * - Si CC et Examen: CC (40%) + Examen (60%)
 * - Si CC, Examen et TP: CC (30%) + Examen (50%) + TP (20%)
 */
// export const calculerNoteFinalv1 = (
//   note_cc?: number,
//   note_examen?: number,
//   note_tp?: number
// ): number => {
//   if (!note_cc && !note_examen) return 0;
  
//   if (note_cc && note_examen && !note_tp) {
//     // CC (40%) + Examen (60%)
//     return Number(((note_cc * 0.4) + (note_examen * 0.6)).toFixed(2));
//   }
  
//   if (note_cc && note_examen && note_tp) {
//     // CC (30%) + Examen (50%) + TP (20%)
//     return Number(((note_cc * 0.3) + (note_examen * 0.5) + (note_tp * 0.2)).toFixed(2));
//   }
  
//   // Si seulement certaines notes sont présentes
//   const notes: number[] = [];
//   const weights: number[] = [];
  
//   if (note_cc) {
//     notes.push(note_cc);
//     weights.push(note_tp ? 0.3 : 0.4);
//   }
//   if (note_examen) {
//     notes.push(note_examen);
//     weights.push(note_tp ? 0.5 : 0.6);
//   }
//   if (note_tp) {
//     notes.push(note_tp);
//     weights.push(0.2);
//   }

//   const total = notes.reduce((sum, note, i) => sum + (note * weights[i]), 0);
//   return Number(total.toFixed(2));
// };

export const calculerNoteFinal = (
  note_cc?: number,
  note_examen?: number,
  note_tp?: number
): number => {
  try {
    const cc = note_cc || 0;
    const exam = note_examen || 0;
    const tp = note_tp || 0;
    
    let total = 0;
    let weightSum = 0;
    
    if (note_cc !== undefined) {
      const weight = (note_tp !== undefined) ? 0.3 : 0.4;
      total += cc * weight;
      weightSum += weight;
    }
    
    if (note_examen !== undefined) {
      const weight = (note_tp !== undefined) ? 0.5 : 0.6;
      total += exam * weight;
      weightSum += weight;
    }
    
    if (note_tp !== undefined) {
      const weight = 0.2;
      total += tp * weight;
      weightSum += weight;
    }
    
    // Si aucune note valide
    if (weightSum === 0) return 0;
    
    // Normaliser si nécessaire (pour les cas où certaines notes manquent)
    const finalNote = weightSum === 1 ? total : total / weightSum;
    
    return Number(finalNote.toFixed(2));
  } catch (error) {
    console.error('Erreur dans calculerNoteFinal:', error);
    return 0;
  }
};

/**
 * Détermine la mention selon la note finale
 */
export const obtenirMention = (note: number): string => {
  if (note < 10) return 'Ajourné';
  if (note < 12) return 'Passable';
  if (note < 14) return 'Assez Bien';
  if (note < 16) return 'Bien';
  return 'Très Bien';
};

/**
 * Calcule la moyenne générale d'un ensemble de notes
 */
export const calculerMoyenneGenerale = (notes: INote[]): number => {
  if (notes.length === 0) return 0;
  
  const total = notes.reduce((sum, note) => sum + (note.note_finale || 0), 0);
  return Number((total / notes.length).toFixed(2));
};

/**
 * Calcule le nombre de crédits obtenus (notes >= 10)
 */
export const calculerCreditsObtenus = (notes: INoteDetails[]): number => {
  return notes
    .filter(note => note.note_finale && note.note_finale >= 10)
    .reduce((sum, note) => sum + (note.coefficient_ue || 0), 0);
};

/**
 * Valide une note (entre 0 et 20)
 */
export const validerNote = (note: number): boolean => {
  return note >= 0 && note <= 20;
};

// ==========================================
// CONSTANTES
// ==========================================

export const TYPES_EVALUATION: TypeEvaluation[] = ['CONTINUE', 'EXAMEN', 'RATTRAPAGE'];
export const SESSIONS_EXAMEN: SessionExamen[] = ['NORMALE', 'RATTRAPAGE', 'SPECIALE'];

export const MENTIONS = [
  'Ajourné',
  'Passable',
  'Assez Bien',
  'Bien',
  'Très Bien'
] as const;

export const POIDS_NOTES = {
  AVEC_TP: {
    CC: 0.3,
    EXAMEN: 0.5,
    TP: 0.2
  },
  SANS_TP: {
    CC: 0.4,
    EXAMEN: 0.6
  }
} as const;

// ==========================================
// COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME
// ==========================================

// Alias pour compatibilité
export type { INote as INoteV1 };

// Mapping des anciennes interfaces vers les nouvelles
export interface INoteCompat {
  id?: number;
  etudiant_id: number;
  cours_id: number;  // Ancien système
  matiere_code?: string;  // Nouveau système
  note_examen?: number;
  note_tp?: number;
  note_cc?: number;
  note_finale?: number;
  appreciation?: string;
  type_evaluation?: string;
  date_evaluation?: Date | string;
  validee?: boolean;
  validee_par?: number;
  date_validation?: Date | string;
  remarques?: string;
  commentaire?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}