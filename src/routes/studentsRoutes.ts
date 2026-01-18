import express, { Router } from 'express';
import {
  createEtudiant,
  getEtudiantById,
  getEtudiants,
  updateEtudiant,
  deleteEtudiant,
  toggleStatut,
  getCours,
  getNotes,
  getMoyenneGenerale,
  getStatistiques,
  searchEtudiants
} from '../Controllers/etudiantController';

const router: Router = express.Router();

// CRUD
router.get('/', getEtudiants);
router.post('/', createEtudiant);
router.get('/stats', getStatistiques);
router.post('/search/advanced', searchEtudiants);

router.get('/:id', getEtudiantById);
router.put('/:id', updateEtudiant);
router.delete('/:id', deleteEtudiant);
router.post('/:id/toggle-statut', toggleStatut);

// Related resources
router.get('/:id/courses', getCours);
router.get('/:id/notes', getNotes);
router.get('/:id/moyenne', getMoyenneGenerale);

export default router;
