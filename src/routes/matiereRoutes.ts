// matiereRoutes.ts
import express, { Router } from 'express';
import {
  createMatiere,
  getMatiereSimpleByCode,
  updateMatiere,
  deleteMatiere,
  getMatieresByEnseignant,
  getMatieres,
  getStatistiques
} from '../Controllers/matiereController';

const router: Router = express.Router();

// CRUD Matières
router.get('/', getMatieres);
router.post('/', createMatiere);

// Single Matière operations
router.get('/:code', getMatiereSimpleByCode);
router.put('/:id', updateMatiere);
router.delete('/:id', deleteMatiere);

// Related resources
router.get('/:id/teachers', getMatieresByEnseignant);
router.get('/:id/courses', getMatieres);
router.get('/:id/notes-stats', getStatistiques);

export default router;