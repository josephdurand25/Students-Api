// groupeCoursRoutes.ts
import express, { Router } from 'express';
import {
  createGroupeCours,
  getGroupesCours,
  updateGroupeCours,
  deleteGroupeCours,
  getGroupeCoursByCode,
  getEtudiantsInscrits
} from '../Controllers/groupeCoursController';

const router: Router = express.Router();

// CRUD Groupes de Cours
router.get('/', getGroupesCours);
router.post('/', createGroupeCours);

// Single Groupe operations
router.get('/:code', getGroupeCoursByCode);
router.put('/:code', updateGroupeCours);
router.delete('/:code', deleteGroupeCours);

// Groupe management
router.get('/:id/students', getEtudiantsInscrits);
// router.get('/:id/schedule', getGroupeSchedule);
// router.post('/:id/students/:studentId', addStudentToGroupe);
// router.delete('/:id/students/:studentId', removeStudentFromGroupe);

export default router;