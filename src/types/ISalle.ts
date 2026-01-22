// ==========================================
// SALLE
// ==========================================

import { TypeSalle } from "./IGeneral";


export interface ISalle {
  code?: string;                    // PK - Ex: "AMPHI-A", "TD-B12", "LABO-INF1"
  nom?: string;                     // Ex: "Amphithéâtre A", "Salle TD B12"
  capacite?: number;                // Nombre de places
  type?: TypeSalle;                 // Type de salle
  equipements?: any;               // JSON - Ex: {"projecteur": true, "ordinateurs": 30}
}

export interface ISalleCreate extends ISalle {}

export interface ISalleUpdate extends Partial<Omit<ISalle, 'code'>> {}

export interface ISalleWithDetails extends ISalle {
  // Statistiques d'utilisation
  nombre_matieres?: number;        // Nombre de matières utilisant cette salle
  taux_occupation?: number;        // Pourcentage d'occupation (calculé)
}

// Filtres pour recherche
export interface ISalleFilters {
  type?: TypeSalle;
  capacite_min?: number;
  capacite_max?: number;
  equipement?: string;             // Recherche dans JSON equipements
  search?: string;                 // Recherche dans code ou nom
}

// ==========================================
// ÉQUIPEMENTS STANDARDS (pour JSON)
// ==========================================

export interface IEquipements {
  projecteur?: boolean;
  tableau_blanc?: boolean;
  tableau_interactif?: boolean;
  ordinateurs?: number;            // Nombre d'ordinateurs
  climatisation?: boolean;
  internet?: boolean;
  micro?: boolean;
  sono?: boolean;
  webcam?: boolean;
  imprimante?: boolean;
  scanner?: boolean;
  materiel_labo?: string[];        // Pour les labos
  logiciels?: string[];            // Pour les salles TP
}

// ==========================================
// CONSTANTES
// ==========================================

export const TYPES_SALLE: TypeSalle[] = [
  'AMPHI',
  'TD', 
  'TP',
  'LABO',
  'ATELIER'
];

export const DEPARTEMENTS = [
  'Sciences et Technologies',
  'Sciences Humaines et Sociales',
  'Droit et Sciences Politiques',
  'Sciences Économiques et de Gestion',
  'Lettres et Arts',
  'Santé',
  'Ingénierie'
] as const;

export const NIVEAUX = [
  'L1',
  'L2', 
  'L3',
  'M1',
  'M2',
  'Doctorat'
] as const;

// ==========================================
// HELPERS / UTILITAIRES
// ==========================================

/**
 * Vérifie si une salle a un équipement spécifique
 */
export function hasEquipement(
  salle: ISalle,
  equipement: keyof IEquipements
): boolean {
  if (!salle.equipements) return false;
  return salle.equipements[equipement] === true || 
         (typeof salle.equipements[equipement] === 'number' && salle.equipements[equipement] > 0);
}

/**
 * Obtient le nombre d'ordinateurs dans une salle
 */
export function getNombreOrdinateurs(salle: ISalle): number {
  if (!salle.equipements || !salle.equipements.ordinateurs) return 0;
  return salle.equipements.ordinateurs;
}

/**
 * Vérifie si une salle est adaptée pour un type de cours
 */
export function isAdapteeFor(salle: ISalle, typeCours: 'CM' | 'TD' | 'TP'): boolean {
  switch (typeCours) {
    case 'CM':
      return salle.type === 'AMPHI' || salle.capacite! >= 50;
    case 'TD':
      return salle.type === 'TD' || salle.type === 'AMPHI';
    case 'TP':
      return salle.type === 'TP' || salle.type === 'LABO';
    default:
      return true;
  }
}

/**
 * Obtient le libellé du type de salle
 */
export function getTypeSalleLabel(type: TypeSalle): string {
  const labels: Record<TypeSalle, string> = {
    'AMPHI': 'Amphithéâtre',
    'TD': 'Salle de TD',
    'TP': 'Salle de TP',
    'LABO': 'Laboratoire',
    'ATELIER': 'Atelier'
  };
  return labels[type];
}

/**
 * Génère un code de salle automatique
 */
export function genererCodeSalle(type: TypeSalle, numero: number): string {
  const prefixes: Record<TypeSalle, string> = {
    'AMPHI': 'AMPHI',
    'TD': 'TD',
    'TP': 'TP',
    'LABO': 'LABO',
    'ATELIER': 'ATELIER'
  };
  return `${prefixes[type]}-${numero}`;
}

/**
 * Parse les équipements depuis JSON
 */
export function parseEquipements(equipementsJSON: any): IEquipements {
  if (!equipementsJSON) return {};
  if (typeof equipementsJSON === 'string') {
    try {
      return JSON.parse(equipementsJSON);
    } catch {
      return {};
    }
  }
  return equipementsJSON;
}

/**
 * Formate les niveaux offerts d'une filière
 */
export function parseNiveauxOfferts(niveauxJSON: any): string[] {
  if (!niveauxJSON) return [];
  if (typeof niveauxJSON === 'string') {
    try {
      return JSON.parse(niveauxJSON);
    } catch {
      return [];
    }
  }
  if (Array.isArray(niveauxJSON)) {
    return niveauxJSON;
  }
  return [];
}