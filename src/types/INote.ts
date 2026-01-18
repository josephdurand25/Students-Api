// src/type/INote.ts
// ==========================================
// NOTES (Grades)
// ==========================================

export type TypeEvaluation = 'examen' | 'cc' | 'tp' | 'projet';
export type SessionExamen = 'normale' | 'rattrapage';
export interface INote {
  id?: number;
  etudiant_id: number;
  cours_id: number;
  note_examen?: number;
  note_tp?: number;
  note_cc?: number;
  note_finale?: number;
  appreciation?: string;
  type_evaluation?: 'Examen' | 'Contrôle Continu' | 'Projet' | 'Oral';
  date_evaluation?: Date | string;
  validee?: boolean;
  validee_par?: number;
  date_validation?: Date | string;
  remarques?: string;
  commentaire?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface INoteCreate extends Omit<INote, 'id' | 'note_finale' | 'created_at' | 'updated_at'> {}
export interface INoteUpdate extends Partial<Omit<INote, 'id' | 'created_at' | 'updated_at'>> {}

export interface IGradeEntry {
  etudiant_id: number;
  note_cc?: number;
  note_examen?: number;
  note_tp?: number;
  commentaire?: string;
}

export interface IGradeBatch {
  cours_id: number;
  session: SessionExamen;
  notes: IGradeEntry[];
}

// Statistiques des notes
export interface IGradeStatistics {
  cours_id: number;
  moyenne_classe: number;
  note_min: number;
  note_max: number;
  nb_admis: number;
  nb_ajournes: number;
  taux_reussite: number;            // Pourcentage
  repartition_mentions: {
    passable: number;
    assez_bien: number;
    bien: number;
    tres_bien: number;
  };
}

export interface INoteDetails extends INote {
  // Infos étudiant
  etudiant_nom: string;
  etudiant_prenom: string;
  etudiant_numero: string;
  
  // Infos cours
  cours_nom: string;
  cours_code: string;
  cours_credits: number;
  
  // Calculs
  admis: boolean;                   // note_finale >= 10
  mention?: string;                 // Passable, AB, B, TB
}