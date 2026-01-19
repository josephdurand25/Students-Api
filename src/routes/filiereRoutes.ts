// filiereRoutes.ts
import express, { Router } from 'express';
import {
  createFiliere,
  getFiliereByCode,
  getFilieres,
  updateFiliere,
  deleteFiliere,
  getFiliereUEs,
  getFiliereStudents,
  getFiliereStats
} from '../Controllers/FiliereContoller';

const router: Router = express.Router();

// CRUD Filières
router.get('/', getFilieres);
router.post('/', createFiliere);

// Single Filière operations
router.get('/:code', getFiliereByCode);
router.put('/:code', updateFiliere);
router.delete('/:code', deleteFiliere);

// Related resources
router.get('/:code/ues', getFiliereUEs);
router.get('/:code/students', getFiliereStudents);
router.get('/:code/stats', getFiliereStats);

export default router;