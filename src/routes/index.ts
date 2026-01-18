import express, { Router, Request, Response } from 'express';
import studentRoutes from './studentsRoutes';
import coursesRoutes from './coursesRoutes';

const router: Router = express.Router();

router.use('/students', studentRoutes);
router.use('/courses', coursesRoutes);


router.get('/about', (req: Request, res: Response) => {
  res.send('This is the about page.');
});

export default router;