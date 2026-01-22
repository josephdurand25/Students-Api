import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes';
import path from 'path';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: [(process.env.FRONTEND_ORIGIN && process.env.FRONTEND_ORIGIN.startsWith('http') ? process.env.FRONTEND_ORIGIN : `http://${process.env.FRONTEND_ORIGIN || 'localhost:3001'}`) , `http://sigif-cm.com`], 
  credentials: true })
);
// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../images'))); 
app.use('/public', express.static(path.join(__dirname, '../public'))); // Si vous avez un dossier public
// Simple request logger (helps debugging network issues)
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript and Express for my student management app!');
});
  
export default app;