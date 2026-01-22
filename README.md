# Student-Api-SIGIF

### totottoottootttoo

| Méthode | Endpoint                           | Description                    |
| ------- | ---------------------------------- | ------------------------------ |
| GET     | `/api/etudiants`                   | Liste des étudiants            |
| POST    | `/api/etudiants`                   | Création d’un étudiant         |
| GET     | `/api/etudiants/stats`             | Statistiques des étudiants     |
| POST    | `/api/etudiants/search/advanced`   | Recherche avancée              |
| GET     | `/api/etudiants/:id`               | Détails d’un étudiant          |
| PUT     | `/api/etudiants/:id`               | Mise à jour d’un étudiant      |
| DELETE  | `/api/etudiants/:id`               | Suppression d’un étudiant      |
| POST    | `/api/etudiants/:id/toggle-statut` | Activation / désactivation     |
| GET     | `/api/etudiants/:id/courses`       | Cours suivis par l’étudiant    |
| GET     | `/api/etudiants/:id/notes`         | Notes de l’étudiant            |
| GET     | `/api/etudiants/:id/moyenne`       | Moyenne générale de l’étudiant |


### Salle
| Méthode | Endpoint                         | Description                      |
| ------- | -------------------------------- | -------------------------------- |
| GET     | `/api/salles`                    | Liste paginée avec filtres       |
| POST    | `/api/salles`                    | Création d'une salle             |
| GET     | `/api/salles/:code`              | Détails d'une salle              |
| PUT     | `/api/salles/:code`              | Mise à jour                      |
| DELETE  | `/api/salles/:code`              | Suppression                      |
| GET     | `/api/salles/:code/schedule`     | Emploi du temps                  |
| GET     | `/api/salles/:code/availability` | Vérification de la disponibilité |
| POST    | `/api/salles/search`             | Recherche avancée                |

### les Filières

| Méthode | Endpoint                            | Description                |
| ------- | ----------------------------------- | -------------------------- |
| GET     | `/api/filieres`                     | Liste paginée avec filtres |
| POST    | `/api/filieres`                     | Création d'une filière     |
| GET     | `/api/filieres/:code`               | Détails avec statistiques  |
| PUT     | `/api/filieres/:code`               | Mise à jour                |
| DELETE  | `/api/filieres/:code`               | Suppression                |
| GET     | `/api/filieres/:code/ues`           | UEs de la filière          |
| GET     | `/api/filieres/:code/students`      | Étudiants de la filière    |
| GET     | `/api/filieres/:code/stats`         | Statistiques               |
| PATCH   | `/api/filieres/:code/toggle-statut` | Activation / désactivation |
| POST    | `/api/filieres/search`              | Recherche avancée          |
| GET     | `/api/filieres/stats/general`       | Statistiques générales     |

### Matieres

| Méthode | Endpoint                        | Description                          |
| ------- | ------------------------------- | ------------------------------------ |
| GET     | `/api/matieres`                 | Liste des matières                   |
| POST    | `/api/matieres`                 | Création d’une matière               |
| GET     | `/api/matieres/:code`           | Détails d’une matière (simple)       |
| PUT     | `/api/matieres/:id`             | Mise à jour d’une matière            |
| DELETE  | `/api/matieres/:id`             | Suppression d’une matière            |
| GET     | `/api/matieres/:id/teachers`    | Enseignants associés à la matière    |
| GET     | `/api/matieres/:id/courses`     | Cours associés à la matière          |
| GET     | `/api/matieres/:id/notes-stats` | Statistiques des notes de la matière |

### Groupe de cours

| Méthode | Endpoint                          | Description                   |
| ------- | --------------------------------- | ----------------------------- |
| GET     | `/api/groupes-cours`              | Liste des groupes de cours    |
| POST    | `/api/groupes-cours`              | Création d’un groupe de cours |
| GET     | `/api/groupes-cours/:code`        | Détails d’un groupe de cours  |
| PUT     | `/api/groupes-cours/:code`        | Mise à jour du groupe         |
| DELETE  | `/api/groupes-cours/:code`        | Suppression du groupe         |
| GET     | `/api/groupes-cours/:id/students` | Étudiants inscrits au groupe  |


## Résultat des test

### Etudiants:
![alt text](./uploads/tests/image.png)

# **📋 RÈGLES DE GESTION À JOUR - SYSTÈME ACADÉMIQUE**

## **👥 RELATIONS FONDAMENTALES**
- Un **Utilisateur** peut être un **Etudiant**, **Enseignant** OU **Administrateur** (héritage exclusif)
- Un **Etudiant** s'inscrit à une **Inscription** annuelle (0 ou 1 par an)
- Une **Inscription** concerne un ou plusieurs **GroupeUE** (maximum 2 par règle métier)
- Un **GroupeUE** correspond à une **Specialite**
- Un **Etudiant** obtient plusieurs **Note** (une par **Matière** par **SessionExamen**)
- Un **Etudiant** a plusieurs **Presence** (une par **Seance**)
- Une **UniteEnseignement** se compose d'une ou plusieurs **Matière** (composition)
- Une **Matière** est enseignée par un et un seul **Enseignant**
- Un **Enseignant** peut enseigner plusieurs **Matière**
- Une **Matière** est évaluée dans une ou plusieurs **SessionExamen**
- Une **SessionExamen** contient plusieurs **Note**
- Une **Matière** a plusieurs **Seance** (horaires réguliers)
- Une **Seance** se déroule dans une et une seule **Salle**
- Une **Inscription** est associée à un ou plusieurs **PaiementDroits** (composition)
- Une **Inscription** appartient à une et une seule **AnneeAcademique**
- Une **AnneeAcademique** a une à quatre **SessionExamen**
- Un **Etudiant** possède un et un seul **DossierCandidature**
- Un **Administrateur** gère plusieurs **GroupeUE**

## **🎓 RÈGLES D'INSCRIPTION**
- Un **Etudiant** ne peut s'inscrire que si **statut_academique = "ACTIF"**
- Un **Etudiant** ne peut avoir qu'une **Inscription** par **AnneeAcademique**
- Une **Inscription** doit être validée par un **Administrateur** avant activation
- Le nombre d'inscriptions par **GroupeUE** ne peut dépasser **capacite_max**
- Un **Etudiant** ne peut s'inscrire qu'à maximum 2 **GroupeUE** par année
- Les **GroupeUE** doivent correspondre à la **Specialite** de l'étudiant
- **Date_inscription** doit être avant la date limite définie par l'administration
- **Workflow inscription** : DEMANDE → VALIDATION ADMIN → PAYEMENT → ACTIVE

## **📊 RÈGLES D'ÉVALUATION**
- Une **Note** est toujours associée à un triplet unique : **(Etudiant + Matière + SessionExamen)**
- **note_finale** = (note_cc×coeff_cc + note_examen×coeff_ex + note_tp×coeff_tp) ÷ somme_coefficients
- **Note.validee = TRUE** SEULEMENT SI note_finale ≥ 10/20
- Une **Matière** est validée SI note_finale ≥ 10/20 ET taux_présence ≥ 70%
- Une **UE** est validée SI moyenne_UE ≥ 10/20 (moyenne pondérée des matières)
- **Mention par matière** : ≥16 TB, ≥14 B, ≥12 AB, ≥10 P, <10 Ajourné
- **Saisie des notes** limitée à 15 jours après la **SessionExamen**
- **Réclamation** possible pendant 7 jours après publication des notes
- **Workflow note** : SAISIE ENSEIGNANT → VALIDATION RESPONSABLE → PUBLICATION → ARCHIVAGE

## **💰 RÈGLES FINANCIÈRES**
- Paiement des droits OBLIGATOIRE avant participation aux **SessionExamen**
- **Statut paiement** : IMPAYE → PARTIEL → COMPLET → EXONERE
- SI **statut_paiement = "IMPAYE" +30j** ALORS Etudiant.statut_academique = "BLOQUE"
- **Boursiers** automatiquement "EXONERE" après validation administrative
- **Quittance** générée automatiquement à chaque paiement
- **Reste à payer** = montant_total - montant_paye
- **Pénalité retard** >30j : majoration de 10% du montant dû
- **Paiement minimum** de 50% requis pour valider l'inscription

## **📅 RÈGLES D'ASSIDUITÉ**
- **Taux présence requis** ≥70% pour être admissible aux examens d'une **Matière**
- **Présence** enregistrée par **Seance** par **Etudiant**
- **Absence justifiée** nécessite pièce justificative déposée sous 48h
- **Enseignant** valide les présences à chaque **Seance**
- **Présences** signées électroniquement par l'Enseignant
- **Calcul taux présence** = (nombre_seances_presentes / nombre_seances_total) × 100
- SI **taux_presence < 70%** ALORS interdiction de passer l'examen final

## **🏢 RÈGLES DES RESSOURCES**
- Une **Salle** ne peut pas accueillir deux **Seance** au même horaire
- **Salle.capacite** doit être ≥ nombre d'étudiants inscrits à la **Matière**
- **GroupeUE** ne peut avoir > **capacite_max** étudiants
- **Enseignant** ne peut enseigner que dans sa **specialite**
- **Équipements Salle** doivent correspondre aux besoins du **type_cours**
- Réservation de **Salle** obligatoire pour chaque **Seance**
- **Vérification conflit horaire** automatique pour chaque nouvel horaire

## **📅 CALENDRIER ACADÉMIQUE**
- **AnneeAcademique** = deux semestres maximum
- **Inscriptions** ouvertes seulement pendant périodes définies
- **SessionExamen** organisées pendant sessions officielles (normale, rattrapage)
- **Matière** doit respecter son **volume_horaire_total** sur le semestre
- **Vacances académiques** = pas de **Seance** programmée
- **SessionExamen** ne peuvent chevaucher des périodes de cours
- Maximum 4 **SessionExamen** par **AnneeAcademique**

## **⚡ CONTRAINTES SYSTÈME**
- **Capacite_max** GroupeUE = 50 étudiants maximum
- **Nombre d'UE/semestre** = 6 maximum par étudiant
- **Volume_horaire hebdomadaire** = 30 heures maximum par étudiant
- **Retard paiement toléré** = 30 jours maximum
- **Absences injustifiées** = 30% maximum par matière
- **Note finale** stockée avec 2 décimales
- **Crédits ECTS** entiers uniquement

## **📈 CALCULS ACADÉMIQUES**
- **moyenne_UE** = Σ(Matiere.note_finale × Matiere.coefficient) ÷ Σ(Matiere.coefficient)
- **moyenne_semestre** = Σ(UE.moyenne × UE.credits) ÷ Σ(UE.credits)
- **taux_presence_matiere** = (présences_matière ÷ séances_total_matière) × 100
- **rattrapage possible** SI 8 ≤ moyenne_UE < 10 ET moyenne_semestre ≥ 10
- **passage conditionnel** SI moyenne_semestre ≥ 10 avec UE en échec compensables
- **crédits acquis** = Σ(UE.credits) où UE.moyenne ≥ 10

## **🔄 PROCESSUS MÉTIER**

### **PROCESSUS D'INSCRIPTION**
1. Etudiant soumet **DossierCandidature**
2. Validation dossier par Administration
3. Etudiant crée **Inscription** pour l'année
4. Choix des **GroupeUE** (maximum 2)
5. Vérification prérequis et capacités
6. Génération **PaiementDroits**
7. Paiement (minimum 50%)
8. Validation finale par **Administrateur**
9. Activation inscription et génération emploi du temps

### **PROCESSUS D'ÉVALUATION**
1. **SessionExamen** programmée par Administration
2. **Enseignant** prépare les épreuves
3. Épreuves passées par les étudiants
4. **Enseignant** saisit notes dans le système
5. Calcul automatique des notes finales
6. Validation par responsable de l'UE
7. Publication officielle des notes
8. Calcul des moyennes UE et semestre
9. Délibération du jury
10. Génération et envoi des relevés

### **PROCESSUS DE PAIEMENT**
1. Génération facture selon spécialité et niveau
2. Notification à l'étudiant
3. Paiement en ligne ou guichet
4. Mise à jour **statut_paiement**
5. Si COMPLET → Déblocage examens
6. Si IMPAYE >30j → Blocage compte et notifications
7. Génération quittance et reçu fiscal

### **PROCESSUS DE PRÉSENCE**
1. **Enseignant** programme les **Seance**
2. Attribution des **Salle**
3. Enregistrement des **Presence** à chaque séance
4. Justification des absences sous 48h
5. Calcul hebdomadaire des taux de présence
6. Alerte si taux < 70%
7. Bilan mensuel envoyé à l'administration

## **⚠️ DÉROGATIONS EXCEPTIONNELLES**
- **Dépassement capacité GroupeUE** : possible avec moyenne ≥15/20 et accord commission pédagogique
- **Exonération totale paiement** : boursiers nationaux, sportifs haut niveau, situations sociales particulières
- **Report SessionExamen** : avec certificat médical officiel déposé avant l'examen
- **Rattrapage spécial** : pour étudiants avec justificatif médical pendant session normale
- **Changement Specialite** : possible en cours d'année avec accord pédagogique et places disponibles
- **Validation UE sans toutes les matières** : cas exceptionnel avec accord du jury

## **🚨 SANCTIONS**
- **Retard paiement >30j** : blocage accès examens + pénalité 10% du solde
- **Absence injustifiée examen** : note 0/20 sans possibilité de rattrapage
- **Fraude détectée pendant examen** : exclusion de la session + conseil de discipline
- **Fausse déclaration administrative** : radiation temporaire ou définitive
- **Taux présence < 50%** : interdiction de passer l'examen + redoublement obligatoire
- **Non-respect délais** : perte de droits pour la session concernée

## **🔐 SÉCURITÉ ET AUDIT**
- **Etudiant** accède uniquement à SES données (notes, présences, paiements)
- **Enseignant** accède à SES matières et SES étudiants
- **Administrateur** accède à TOUTES les données de son département
- **Modification de Note** : journalisée avec timestamp, ancienne valeur, auteur
- **Connexions** : loggées (IP, heure, durée, actions)
- **Validations administratives** : signées électroniquement avec certificat
- **Paiements** : traçabilité complète avec preuve cryptographique
- **Délibérations jury** : archivées sécurisément pendant 10 ans
- **Données personnelles** : conservation limitée à 5 ans après fin des études

## **🔗 CONTRAINTES D'INTÉGRITÉ**
- Un **Etudiant** ne peut avoir deux **Note** pour même **Matière** et **SessionExamen**
- Une **Matière** ne peut appartenir à deux **UE** différentes simultanément
- Un **Enseignant** ne peut être examinateur de sa propre famille proche
- **Administrateur** ne peut modifier **Note** après publication officielle
- **Total coefficients** dans une UE doit être égal à 1.0
- **SOMME(Matiere.credits)** doit égaler **UE.credits**
- **Total volume_horaire UE** = SOMME(Matiere.volume_horaire)
- **Etudiant.niveau** doit être dans **Specialite.niveaux_offerts**
- **Date_validation Note** doit être postérieure à **date SessionExamen**

## **📋 RÈGLES DE CALCUL DES CRÉDITS**
- **Crédits acquis** = Σ(UE.credits) où UE validée (moyenne ≥ 10/20)
- **Crédits capitalisables** = crédits acquis conservés même en cas de redoublement partiel
- **Crédits compensables** : maximum 30% des crédits du semestre
- **Validation semestre** : ≥30 crédits ECTS acquis (sur 60 possibles)
- **Validation année** : ≥60 crédits ECTS acquis (sur 120 possibles)
- **Progression normale** : acquisition d'au moins 45 crédits par an

## **🎯 RÈGLES DE PASSAGE ET DIPLÔMATION**
- **Passage en année supérieure** : ≥45 crédits acquis ET moyenne générale ≥ 10/20
- **Redoublement** : <45 crédits acquis OU moyenne générale < 8/20
- **Réorientation** : proposition si <30 crédits acquis et accord commission
- **Obtention diplôme** : tous les crédits du programme acquis + moyenne générale ≥ 10/20
- **Mention diplôme** : ≥16 TB, ≥14 B, ≥12 AB, ≥10 Passable
- **Session de rattrapage** : ouverte aux étudiants avec 8 ≤ moyenne < 10
- **Jury de délibération** : se réunit après chaque session pour statuer

## **🔄 RÈGLES DE RECOURS**
- **Consultation copies** : possible sous 15 jours après publication
- **Recours notation** : dépôt sous 7 jours avec justification écrite
- **Commission de recours** : se réunit mensuellement pour examiner les demandes
- **Décision recours** : rendue sous 30 jours, sans appel possible
- **Rectification administrative** : possible en cas d'erreur matérielle

## **📊 RÈGLES STATISTIQUES ET RAPPORTS**
- **Taux de réussite** : calculé par matière, UE, spécialité, niveau
- **Taux de remplissage** : par GroupeUE, Salle, Enseignant
- **Statistiques financières** : encaissements, impayés, exonérations
- **Indicateurs qualité** : satisfaction étudiants, adéquation moyens/résultats
- **Rapport annuel** : obligatoire pour chaque formation
- **Audit pédagogique** : tous les 3 ans pour chaque spécialité

---

**RÈGLE GÉNÉRALE** : Ces règles constituent le cadre contractuel du système. Toute modification doit être validée par la commission pédagogique, notifiée aux utilisateurs, et intégrée selon un processus de changement contrôlé. En cas de conflit entre règles, la décision du directeur des études prévaut.