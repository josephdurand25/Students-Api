// ==========================================
// FILIÈRE
// ==========================================

export interface IFiliere {
  code?: string;                    // PK - Ex: "INF", "GC", "ELEC"
  nom?: string;                     // Ex: "Informatique", "Génie Civil"
  description?: string;            
  departement?: string;             // Ex: "Sciences et Technologies"
  niveaux_offerts?: any;           // JSON - Ex: ["L1", "L2", "L3", "M1", "M2"]
  responsable_id?: number;         // FK vers Enseignant
  statut?: 'actif' | 'inactif';
}

export interface IFiliereCreate extends IFiliere {}

export interface IFiliereUpdate extends Partial<Omit<IFiliere, 'code'>> {}

export interface IFiliereWithDetails extends IFiliere {
  // Infos responsable
  responsable_nom?: string;
  responsable_prenom?: string;
  responsable_email?: string;
  
  // Statistiques
  nombre_groupes?: number;
  nombre_etudiants?: number;
  nombre_enseignants?: number;
}

// Filtres pour recherche
export interface IFiliereFilters {
  departement?: string;
  responsable_id?: number;
  search?: string;              // Recherche dans code ou nom
}