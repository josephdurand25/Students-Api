
export interface IEtudiant {
    id: number;
    numero_etudiant: string;
    prenom: string;
    nom: string;
    date_naissance: string;
    genre: string;
    email: string;
    telephone: string;
    adresse_rue: string;
    adresse_ville: string;
    adresse_code_postal: string;
    adresse_pays: string;
    date_inscription: string;
    filiere: string;
    niveau: string;
    photo_profil?: string;
    statut: StatutEtudiant;
    age?: number;
    nom_complet?: string;
    created_by?: number;
    modified_by?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IEtudiantFormRequest extends Omit<IEtudiant, 'id' | 'created_at' | 'updated_at'> {}
export interface IEtudiantUpdaterequest extends Partial<Omit<IEtudiant, 'id' | 'created_at' | 'updated_at'>> {}


export type StatutEtudiant = 'actif' | 'inactif' | 'suspendu' | 'diplome';

export interface IEtudiantFilters {
  filiere?: string;
  niveau?: string;
  statut?: string;
  search?: string;
}

export interface IEtudiantSearchCriteria {
  nom?: string;
  prenom?: string;
  filiere?: string;
  niveau?: string;
  statut?: string;
  minAge?: number;
  maxAge?: number;
}

export interface IPaginationResult<T> {
  data: T[]; 
  pagination: IPagination;
}
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};