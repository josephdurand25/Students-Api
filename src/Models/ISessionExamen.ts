// server/types/ISessionExamen.ts
export interface ISessionExamen {
  id?: number;
  libelle: string; // Ex: 06-2026
  type: 'NORMALE' | 'RATTRAPAGE' | 'SPECIALE';
  date_debut: Date | string;
  date_fin: Date | string;
  annee_academique: string;
  statut?: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'CLOTUREE';
  created_at?: Date | string;
}

export interface ISessionExamenCreate {
  libelle: string;
  type: 'NORMALE' | 'RATTRAPAGE' | 'SPECIALE';
  date_debut: Date | string;
  date_fin: Date | string;
  annee_academique: string;
  statut?: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'CLOTUREE';
}

export interface ISessionExamenUpdate {
  libelle?: string;
  type?: 'NORMALE' | 'RATTRAPAGE' | 'SPECIALE';
  date_debut?: Date | string;
  date_fin?: Date | string;
  annee_academique?: string;
  statut?: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'CLOTUREE';
}

export interface ISessionExamenWithDetails extends ISessionExamen {
  nombre_matieres?: number;
  nombre_examens?: number;
  annee_academique_details?: any;
}