import express, { Router, Request, Response } from 'express';
import studentRoutes from './studentsRoutes';
import ueRoutes from './ueRoutes';
import matiereRoutes from './matiereRoutes';
import groupUeRoutes from './groupeCoursRoutes';
import salleRoutes from './salleRoutes';
import filiereRoute from './filiereRoutes'

import coursesRoutes from './coursesRoutes';

const router: Router = express.Router();

router.use('/students', studentRoutes);
router.use('/ues', ueRoutes);
router.use('/courses', matiereRoutes);
router.use('/group', groupUeRoutes);
router.use('/salle', salleRoutes);
router.use('/filiere', filiereRoute);



// router.use('/courses', coursesRoutes);


router.get('/about', (req: Request, res: Response) => {
  res.send('This is the about page.');
});

export default router;