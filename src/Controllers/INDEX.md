/**
 * CONTRÔLEURS - INDEX DES ENDPOINTS
 * 
 * Tous les contrôleurs ont été mis à jour pour supporter les paramètres optionnels
 * et accepter les opérations d'API flexibles.
 */

// ============================================
// CONTRÔLEURS EXISTANTS (MIS À JOUR)
// ============================================

/**
 * etudiantController.ts
 * - createEtudiant: POST /api/students
 * - createEtudiantV1: POST /api/students/v1
 * - getEtudiantById: GET /api/students/:id
 * - getAllEtudiants: GET /api/students
 * - updateEtudiant: PUT /api/students/:id
 * - deleteEtudiant: DELETE /api/students/:id
 * - searchEtudiants: GET /api/students/search
 */

/**
 * matiereController.ts
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createMatiereV1: POST /api/matieres
 * - getMatiereByCode: GET /api/matieres/:code
 * - getAllMatieres: GET /api/matieres
 * - updateMatiere: PUT /api/matieres/:code
 * - deleteMatiere: DELETE /api/matieres/:code
 */

/**
 * noteController.ts
 * Mis à jour: etudiant_id et matiere_code obligatoires, notes optionnelles
 * - createNote: POST /api/notes
 * - getNoteById: GET /api/notes/:id
 * - getAllNotes: GET /api/notes
 * - updateNote: PUT /api/notes/:id
 * - deleteNote: DELETE /api/notes/:id
 */

/**
 * ueController.ts (UniteEnseignement)
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createUniteEnseignement: POST /api/ue
 * - getUEByCode: GET /api/ue/:code
 * - getAllUE: GET /api/ue
 * - updateUE: PUT /api/ue/:code
 * - deleteUE: DELETE /api/ue/:code
 */

/**
 * coursController.ts
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createCours: POST /api/cours
 * - getCoursById: GET /api/cours/:id
 * - getAllCours: GET /api/cours
 * - updateCours: PUT /api/cours/:id
 * - deleteCours: DELETE /api/cours/:id
 */

/**
 * groupeCoursController.ts
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createGroupeCours: POST /api/groupes-cours
 * - getGroupeByCode: GET /api/groupes-cours/:code
 * - getAllGroupes: GET /api/groupes-cours
 * - updateGroupe: PUT /api/groupes-cours/:code
 * - deleteGroupe: DELETE /api/groupes-cours/:code
 */

/**
 * salleController.ts
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createSalle: POST /api/salles
 * - getSalleByCode: GET /api/salles/:code
 * - getAllSalles: GET /api/salles
 * - updateSalle: PUT /api/salles/:code
 * - deleteSalle: DELETE /api/salles/:code
 */

/**
 * FiliereContoller.ts
 * Mis à jour: code et nom obligatoires, autres optionnels
 * - createFiliere: POST /api/filieres
 * - getFiliereByCode: GET /api/filieres/:code
 * - getAllFilieres: GET /api/filieres
 * - updateFiliere: PUT /api/filieres/:code
 * - deleteFiliere: DELETE /api/filieres/:code
 */

// ============================================
// CONTRÔLEURS NOUVELLEMENT CRÉÉS
// ============================================

/**
 * inscriptionController.ts
 * Gère les inscriptions des étudiants
 * - createInscription: POST /api/inscriptions
 * - getInscriptionById: GET /api/inscriptions/:id
 * - getAllInscriptions: GET /api/inscriptions
 * - updateInscription: PUT /api/inscriptions/:id
 * - deleteInscription: DELETE /api/inscriptions/:id
 */

/**
 * paiementDroitsController.ts
 * Gère les paiements des droits d'inscription
 * - createPaiement: POST /api/paiements
 * - getPaiementById: GET /api/paiements/:id
 * - getPaiementsByInscription: GET /api/paiements/inscription/:inscriptionNumero
 * - getAllPaiements: GET /api/paiements
 * - updatePaiement: PUT /api/paiements/:id
 * - deletePaiement: DELETE /api/paiements/:id
 */

/**
 * presenceController.ts
 * Gère les présences des étudiants en séance
 * - createPresence: POST /api/presences
 * - getPresenceById: GET /api/presences/:id
 * - getAllPresences: GET /api/presences
 * - updatePresence: PUT /api/presences/:id
 * - deletePresence: DELETE /api/presences/:id
 */

/**
 * dossierCandidatureController.ts
 * Gère les dossiers de candidature
 * - createDossier: POST /api/dossiers-candidature
 * - getDossierById: GET /api/dossiers-candidature/:id
 * - getDossiersByEtudiant: GET /api/dossiers-candidature/etudiant/:etudiantId
 * - getAllDossiers: GET /api/dossiers-candidature
 * - updateDossier: PUT /api/dossiers-candidature/:id
 * - deleteDossier: DELETE /api/dossiers-candidature/:id
 */

/**
 * specialiteController.ts
 * Gère les spécialités/programmes
 * - createSpecialite: POST /api/specialites
 * - getSpecialiteByCode: GET /api/specialites/:code
 * - getSpecialitesByFiliere: GET /api/specialites/filiere/:filiereCode
 * - getAllSpecialites: GET /api/specialites
 * - updateSpecialite: PUT /api/specialites/:code
 * - deleteSpecialite: DELETE /api/specialites/:code
 */

/**
 * sessionExamenController.ts
 * Gère les sessions d'examen
 * - createSessionExamen: POST /api/sessions-examen
 * - getSessionByCode: GET /api/sessions-examen/:code
 * - getSessionById: GET /api/sessions-examen/id/:id
 * - getSessionsByAnneeAcademique: GET /api/sessions-examen/annee/:anneeAcademiqueCode
 * - getAllSessions: GET /api/sessions-examen
 * - updateSession: PUT /api/sessions-examen/:id
 * - deleteSession: DELETE /api/sessions-examen/:id
 */

/**
 * userController.ts
 * Gère les utilisateurs génériques (Admin uniquement)
 * - createUser: POST /api/users
 * - getUserById: GET /api/users/:id
 * - getUserByEmail: GET /api/users/email/:email
 * - getAllUsers: GET /api/users
 * - updateUser: PUT /api/users/:id
 * - deleteUser: DELETE /api/users/:id
 * - updateUserStatus: PATCH /api/users/:id/status
 */

// ============================================
// PARAMÈTRES OPTIONNELS
// ============================================

/**
 * Tous les contrôleurs supportent maintenant:
 * 
 * 1. Paramètres optionnels dans les create()
 *    - Seuls les champs essentiels (code/id) sont obligatoires
 *    - Les autres champs peuvent être null/undefined
 * 
 * 2. Filtrage flexible dans les findAll()
 *    - Pagination: page, limit (par défaut 10)
 *    - Filtres: appliqués dynamiquement selon les query params
 *    - Exemple: GET /api/students?page=1&limit=20&specialite_code=INFO
 * 
 * 3. Validations réduites
 *    - Focus sur les champs clés
 *    - Messages d'erreur clairs
 *    - Codes de statut HTTP cohérents
 */

// ============================================
// CODES DE STATUT UTILISÉS
// ============================================

/**
 * 200 OK - Récupération réussie
 * 201 CREATED - Création réussie
 * 204 NO CONTENT - Suppression réussie (optionnel)
 * 400 BAD_REQUEST - Données invalides
 * 404 NOT_FOUND - Ressource non trouvée
 * 409 CONFLICT - Conflit (ex: code déjà existant)
 * 500 INTERNAL_SERVER_ERROR - Erreur serveur
 */

// ============================================
// FORMAT DE RÉPONSE
// ============================================

/**
 * Succès:
 * {
 *   success: true,
 *   status_code: 200,
 *   message: "Message optionnel",
 *   data: {...},
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     total: 100,
 *     totalPages: 10
 *   }
 * }
 * 
 * Erreur:
 * {
 *   success: false,
 *   status_code: 400,
 *   message: "Description de l'erreur",
 *   errors: {
 *     field: "Message d'erreur du champ"
 *   }
 * }
 */

export {};
