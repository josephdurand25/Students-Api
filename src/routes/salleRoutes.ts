// salleRoutes.ts
import express, { Router } from 'express';
import {
  createSalle,
  getSalleByCode,
  getSalles,
  updateSalle,
  deleteSalle,
  getSalleSchedule,
  getSalleAvailability,
  searchSalles
} from '../Controllers/salleController';

const router: Router = express.Router();

// CRUD Salles
router.get('/', getSalles);
router.post('/', createSalle);
router.get('/search', searchSalles);

// Single Salle operations
router.get('/:code', getSalleByCode);
router.put('/:code', updateSalle);
router.delete('/:code', deleteSalle);

// Related resources
router.get('/:code/schedule', getSalleSchedule);
router.get('/:code/availability', getSalleAvailability);

export default router;