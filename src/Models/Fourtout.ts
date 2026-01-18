Je vais vous implémenter la méthode `findOne` pour votre contrôleur d'étudiants. Voici les différentes versions selon votre besoin :

## Version 1: Recherche par ID (version basique)

```typescript
export const getEtudiantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validation de l'ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const etudiant = await Etudiant.findOne({
      where: { id: parseInt(id) }
    });

    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    res.status(200).json(etudiant);
  } catch (error) {
    console.error('getEtudiantById error:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'étudiant.' });
  }
};
```

## Version 2: Recherche avec critères multiples

```typescript
export const findEtudiant = async (req: Request, res: Response) => {
  try {
    const { numero_etudiant, email, nom, prenom } = req.query;
    
    // Vérifier qu'au moins un critère est fourni
    if (!numero_etudiant && !email && !nom && !prenom) {
      return res.status(400).json({ 
        message: 'Au moins un critère de recherche est requis: numero_etudiant, email, nom ou prenom' 
      });
    }

    // Construire les conditions de recherche
    const whereClause: any = {};
    
    if (numero_etudiant) {
      whereClause.numero_etudiant = numero_etudiant;
    }
    
    if (email) {
      whereClause.email = email;
    }
    
    if (nom) {
      whereClause.nom = {
        [Op.iLike]: `%${nom}%` // Recherche insensible à la casse
      };
    }
    
    if (prenom) {
      whereClause.prenom = {
        [Op.iLike]: `%${prenom}%`
      };
    }

    const etudiant = await Etudiant.findOne({
      where: whereClause,
      // Vous pouvez inclure des associations si nécessaire
      // include: [Cours, Notes]
    });

    if (!etudiant) {
      return res.status(404).json({ 
        message: 'Aucun étudiant trouvé avec ces critères',
        criteria: whereClause
      });
    }

    res.status(200).json({
      message: 'Étudiant trouvé avec succès',
      data: etudiant
    });
    
  } catch (error) {
    console.error('findEtudiant error:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la recherche de l\'étudiant.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

## Version 3: Recherche avancée avec options

```typescript
export const findOneEtudiant = async (req: Request, res: Response) => {
  try {
    const { 
      id,
      numero_etudiant,
      email,
      withCourses = false,
      withNotes = false,
      withMoyenne = false
    } = req.query;

    // Validation: au moins un identifiant doit être fourni
    if (!id && !numero_etudiant && !email) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez fournir au moins un identifiant: id, numero_etudiant ou email'
      });
    }

    // Construire la clause WHERE
    const whereClause: any = {};
    
    if (id) {
      whereClause.id = parseInt(id as string);
    }
    
    if (numero_etudiant) {
      whereClause.numero_etudiant = numero_etudiant;
    }
    
    if (email) {
      whereClause.email = email;
    }

    // Options d'inclusion
    const includeOptions: any[] = [];
    
    if (withCourses === 'true') {
      includeOptions.push({
        model: Cours,
        as: 'cours',
        attributes: ['id', 'code', 'nom', 'credits', 'semestre'],
        through: { attributes: [] } // Pour les relations many-to-many
      });
    }
    
    if (withNotes === 'true') {
      includeOptions.push({
        model: Note,
        as: 'notes',
        attributes: ['id', 'note', 'coefficient', 'appreciation', 'cours_id'],
        include: [{
          model: Cours,
          as: 'cours',
          attributes: ['code', 'nom']
        }]
      });
    }

    const etudiant = await Etudiant.findOne({
      where: whereClause,
      include: includeOptions.length > 0 ? includeOptions : undefined,
      attributes: {
        exclude: ['created_by', 'modified_by'] // Exclure les champs sensibles si nécessaire
      }
    });

    if (!etudiant) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé',
        criteria: whereClause
      });
    }

    // Calculer la moyenne si demandé
    let moyenne = null;
    if (withMoyenne === 'true') {
      moyenne = await calculerMoyenneEtudiant(etudiant.id);
    }

    const response: any = {
      success: true,
      data: etudiant
    };

    if (moyenne !== null) {
      response.moyenne = moyenne;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('findOneEtudiant error:', error);
    
    // Gestion des erreurs spécifiques
    if (error instanceof Sequelize.DatabaseError) {
      return res.status(500).json({
        success: false,
        message: 'Erreur de base de données',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche de l\'étudiant'
    });
  }
};

// Fonction helper pour calculer la moyenne
async function calculerMoyenneEtudiant(etudiantId: number): Promise<number | null> {
  try {
    const notes = await Note.findAll({
      where: { etudiant_id: etudiantId },
      include: [{
        model: Cours,
        attributes: ['credits']
      }]
    });

    if (notes.length === 0) {
      return null;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (const note of notes) {
      const credit = note.cours?.credits || 1;
      totalPoints += note.note * credit;
      totalCredits += credit;
    }

    return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  } catch (error) {
    console.error('Erreur calcul moyenne:', error);
    return null;
  }
}
```

## Version 4: Recherche par numéro étudiant (spécifique)

```typescript
export const getEtudiantByNumero = async (req: Request, res: Response) => {
  try {
    const { numero } = req.params;
    
    if (!numero || typeof numero !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Numéro étudiant invalide'
      });
    }

    // Vérifier le format du numéro étudiant
    const numeroRegex = /^\d{2}[A-Z]\d{4}$/;
    if (!numeroRegex.test(numero)) {
      return res.status(400).json({
        success: false,
        message: 'Format de numéro étudiant invalide. Format attendu: XXYXXXX'
      });
    }

    const etudiant = await Etudiant.findOne({
      where: { numero_etudiant: numero.toUpperCase() },
      attributes: [
        'id', 'numero_etudiant', 'prenom', 'nom', 
        'date_naissance', 'genre', 'email', 'telephone',
        'filiere', 'niveau', 'statut', 'date_inscription'
      ]
    });

    if (!etudiant) {
      return res.status(404).json({
        success: false,
        message: `Aucun étudiant trouvé avec le numéro: ${numero}`
      });
    }

    res.status(200).json({
      success: true,
      data: etudiant
    });

  } catch (error) {
    console.error('getEtudiantByNumero error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche par numéro étudiant'
    });
  }
};
```

## Version 5: Recherche avec transactions (pour la cohérence)

```typescript
export const findEtudiantWithTransaction = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id, numero_etudiant } = req.body;
    
    if (!id && !numero_etudiant) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID ou numéro étudiant requis'
      });
    }

    const whereClause: any = {};
    if (id) whereClause.id = id;
    if (numero_etudiant) whereClause.numero_etudiant = numero_etudiant;

    // Verrouillage de la ligne pour éviter les lectures sales
    const etudiant = await Etudiant.findOne({
      where: whereClause,
      transaction,
      lock: transaction.LOCK.UPDATE // Verrou pour mise à jour
    });

    if (!etudiant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }

    // Vous pouvez effectuer d'autres opérations ici avant de commit
    // Exemple: mettre à jour un compteur de consultations
    await etudiant.increment('consultation_count', { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: etudiant
    });

  } catch (error) {
    await transaction.rollback();
    
    console.error('findEtudiantWithTransaction error:', error);
    
    if (error instanceof Sequelize.TimeoutError) {
      return res.status(408).json({
        success: false,
        message: 'Timeout de la base de données'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de l\'étudiant'
    });
  }
};
```

## Configuration des routes pour chaque version :

```typescript
// Dans votre fichier de routes
import {
  getEtudiantById,
  findEtudiant,
  findOneEtudiant,
  getEtudiantByNumero,
  findEtudiantWithTransaction
} from '../controllers/etudiantController';

router.get('/etudiants/:id', getEtudiantById);
router.get('/etudiants/numero/:numero', getEtudiantByNumero);
router.get('/etudiants/search/find', findEtudiant); // GET avec query params
router.post('/etudiants/search/one', findOneEtudiant); // POST pour plus de flexibilité
router.post('/etudiants/search/transaction', findEtudiantWithTransaction);
```

## Points importants à considérer :

1. **Validation** : Toujours valider les entrées
2. **Gestion d'erreurs** : Différencier les erreurs 404 (non trouvé) des erreurs 500 (serveur)
3. **Sécurité** : Exclure les champs sensibles si nécessaire
4. **Performance** : N'inclure que les associations nécessaires
5. **Pagination** : Pour `findAll`, pensez à ajouter la pagination

La **Version 3** est la plus complète car elle permet :
- Recherche par différents critères
- Inclusion optionnelle des relations
- Calcul de moyenne sur demande
- Structure de réponse standardisée

N'oubliez pas d'importer les modèles nécessaires :
```typescript
import { Etudiant, Cours, Note } from '../models';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from '../config/database';
```