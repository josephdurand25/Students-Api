import express, { Router } from 'express';
import {
  createCours,
  getCoursById,
  getCours,
  updateCours,
  deleteCours,
  getCoursWithStats,
  getEtudiantsInscrits,
  checkCapacity,
  checkConflicts,
  getStatistiques,
  searchCours
} from '../Controllers/coursController';

const router: Router = express.Router();

// CRUD
router.get('/', getCours);
router.post('/', createCours);
router.get('/stats', getStatistiques);
router.get('/with-stats', getCoursWithStats);
router.post('/search/advanced', searchCours);

router.get('/:id', getCoursById);
router.put('/:id', updateCours);
router.delete('/:id', deleteCours);

// Related resources
router.get('/:id/etudiants', getEtudiantsInscrits);

// Vérifications
router.get('/:id/check-capacity', checkCapacity);
router.post('/check-conflicts', checkConflicts);

export default router;