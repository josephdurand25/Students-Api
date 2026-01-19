// ueRoutes.ts
import express, { Router } from 'express';
import {
    createUniteEnseignement,
    getUniteEnseignementByCode,
    getUniteEnseignementSimpleByCode,
    getUnitesEnseignement,
    updateUniteEnseignement,
    deleteUniteEnseignement,
    getMatieres,
    searchUnitesEnseignement,
    hasEtudiants,
} from '../Controllers/ueController';

const router: Router = express.Router();

// CRUD UEs
router.get('/', getUnitesEnseignement);
router.post('/', createUniteEnseignement);
router.put('/:code', updateUniteEnseignement);
router.delete('/:code', deleteUniteEnseignement);

// Single UE operations
router.get('/search', searchUnitesEnseignement);
router.get('/:code', getUniteEnseignementSimpleByCode);

// Related resources
router.get('/:code/details', getUniteEnseignementByCode);
router.get('/:code/courses', getMatieres);
router.get('/:id/students', hasEtudiants);

export default router;