// tests/students.test.ts
import request from 'supertest';
import app from '../src/index'; // ton app Express
import { IEtudiant, IEtudiantFormRequest } from '../src/types/Istudents';
import { log } from 'node:console';

describe('API Etudiants', () => {
  let createdStudentId: number;

  // GET /api/students
  it('should list all students', async () => {
    const res = await request(app).get('/api/students');
    console.log('resultat / des tests',res.body);
    expect(res.status).toBe(200);

    // Vérifier qu'on a un objet data avec data et pagination
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('pagination');

    // Vérifier que data.data est un array
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // POST /api/students
  it('should create a new student', async () => {
    const newStudent = {
      nom: 'Test',
      prenom: 'Student',
      email: 'test.student@example.com',
      password: 'test123',           
      departement: 'Informatique',   
      date_naissance: '2000-04-12',
      lieu_naissance: 'Yaoundé',     
      genre: 'f',                     
      nationalite: 'Camerounaise',    
      adresse_complete: 'Rue Exemple, Yaoundé', 
      region_origine: 'Centre',       
      filiere: 'Informatique',
      niveau: 'L1',
      photo_profil: '',             
      date_inscription: '2025-11-12',
      numero_etudiant: ''             
    } as IEtudiantFormRequest;

    const res = await request(app)
      .post('/api/students')
      .send(newStudent);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    createdStudentId = res.body.data.id; // sauvegarde pour les tests suivants
  });

  // GET /api/students/:id
  it('should return details of a student', async () => {
    const res = await request(app).get(`/api/students/${createdStudentId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test.student@example.com');
  });

  // PUT /api/students/:id
  it('should update a student', async () => {
    const res = await request(app)
      .put(`/api/students/${createdStudentId}`)
      .send({ nom: 'UpdatedTest' });
    expect(res.status).toBe(200);
    expect(res.body.data.nom).toBe('UpdatedTest');
  });

  // POST /api/students/:id/toggle-statut
  it('should toggle student status', async () => {
    const res = await request(app)
      .post(`/api/students/${createdStudentId}/toggle-statut`);
    expect(res.status).toBe(200);
    expect(res.body.data.statut).toBeDefined();
  });

  // DELETE /api/students/:id
  it('should delete a student', async () => {
    const res = await request(app).delete(`/api/students/${createdStudentId}`);
    expect(res.status).toBe(200);
  });

  // Statistique GET /api/etudiants/stats
  it("must display the student's performance statistics", async () =>{
  });
});
