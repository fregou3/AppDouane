// Charger le polyfill pour ReadableStream
require('./polyfill');

// Charger les variables d'environnement
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
// Initialisation de l'API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const pdfParse = require('pdf-parse');
const pdf = pdfParse; // Alias pour la compatibilité avec la fonction extractTextFromPDF
const { addCorrection } = require('./utils/correctionUtils');

// Note: La configuration de multer est définie plus bas dans le fichier

// Charger les fonctions d'utilité
const { cleanSpecialCharacters } = require('./utils/stringUtils');
const { normalizeCustomsCode } = require('./utils/customsCodeUtils');

// Importer les routes personnalisées
const customsCodeRoutes = require('./routes/customs-code');
const gptRoutes = require('./routes/gpt'); 
const pdfRoutes = require('./routes/pdf');
const pdfAnalysisRoutes = require('./routes/pdf-analysis');
const gptTransformationsRoutes = require('./routes/gpt-transformations');
const transformationsRoutes = require('./routes/transformations');
const emailRoutes = require('./routes/email');
const cnCodeLookupRoutes = require('./routes/cn-code-lookup');
// Route pour l'analyse de documents
const analyseDocumentRoutes = require('./routes/analyse-document');
// Route pour l'analyse d'images avec ChatGPT
const imageAnalysisRoutes = require('./routes/image-analysis');

const app = express();
global.app = app; // Exposer l'application Express globalement

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS détaillée pour l'environnement de production
const corsOptions = {
  origin: [
    'http://app1.communify.solutions:3004',
    'http://localhost:3000',
    'http://localhost:3004'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Appliquer la configuration CORS
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enregistrement prioritaire de la route d'analyse de documents
console.log('Enregistrement prioritaire de la route /api/analyse-document');
app.use('/api', analyseDocumentRoutes);

// Route de test simple
app.get('/test', (req, res) => {
  console.log('Route /test appelée');
  res.json({ message: 'Test réussi' });
});

// Note: Les routes pour l'analyse de documents sont définies dans les fichiers de routes

// Middleware pour logger toutes les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware pour nettoyer les entrées
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = cleanSpecialCharacters(req.body[key]);
      }
    }
  }
  next();
});

// Configuration pour gérer correctement les caractères spéciaux
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware pour servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));

// La route pour l'analyse de documents est maintenant gérée par le fichier routes/analyse-document.js

// Route de test pour vérifier si le problème vient de la configuration
app.post('/api/test-analyse', upload.single('file'), (req, res) => {
  console.log('Route /api/test-analyse appelée');
  console.log('Fichier reçu:', req.file);
  res.json({ message: 'Test réussi' });
});

// Aucune route ici - supprimée pour éviter la duplication

// Routes pour les matières premières
app.get('/api/matieres-premieres', async (req, res) => {
  console.log('Requête reçue pour /api/matieres-premieres');
  
  try {
    // Récupérer les paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Requête pour récupérer les matières premières avec pagination
    const query = `
      SELECT mp.*, f.nom as fournisseur 
      FROM matieres_premieres mp 
      LEFT JOIN fournisseurs f ON mp.fournisseur_id = f.id 
      ORDER BY mp.id ASC
      LIMIT $1 OFFSET $2
    `;
    
    // Requête pour compter le nombre total de matières premières
    const countQuery = `
      SELECT COUNT(*) as total
      FROM matieres_premieres
    `;
    
    console.log('Exécution de la requête SQL...');
    const result = await pool.query(query, [limit, offset]);
    const countResult = await pool.query(countQuery);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    console.log('Résultat de la requête:', result.rows);
    
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matières premières:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matières premières' });
  }
});

app.get('/api/matieres-premieres/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT mp.*, f.nom as fournisseur 
      FROM matieres_premieres mp 
      JOIN fournisseurs f ON mp.fournisseur_id = f.id 
      WHERE mp.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Matière première non trouvée' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/matieres-premieres', async (req, res) => {
  console.log('Requête reçue pour créer une matière première:', req.body);
  const { nom, type, lot, fournisseur, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine } = req.body;
  const client = await pool.connect();

  try {
    // Vérification des champs obligatoires
    if (!nom) {
      return res.status(400).json({ error: 'Le nom est obligatoire' });
    }
    
    // Vérification du type (contrainte check)
    const typeValue = type || 'extrait'; // Valeur par défaut si non fournie
    
    // Vérifier si le fournisseur existe déjà
    let fournisseurId = null;
    if (fournisseur) {
      try {
        const fournisseurResult = await client.query('SELECT id FROM fournisseurs WHERE nom = $1', [fournisseur]);
        if (fournisseurResult.rows.length > 0) {
          fournisseurId = fournisseurResult.rows[0].id;
        } else {
          const newFournisseurResult = await client.query('INSERT INTO fournisseurs (nom) VALUES ($1) RETURNING id', [fournisseur]);
          fournisseurId = newFournisseurResult.rows[0].id;
        }
      } catch (error) {
        console.error('Erreur lors de la gestion du fournisseur:', error);
        // Continuer sans fournisseur si erreur
      }
    }

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;
    console.log('Code douanier normalisé:', normalizedCode);

    // Normaliser la valeur
    let normalizedValue = null;
    if (valeur) {
      try {
        // Supprimer tous les caractères non numériques sauf le point décimal
        const cleanedValue = String(valeur).replace(/[^\d.]/g, '');
        normalizedValue = parseFloat(cleanedValue) || 0; // Utiliser 0 comme valeur par défaut
      } catch (error) {
        console.error('Erreur lors de la normalisation de la valeur:', error);
        normalizedValue = 0; // Valeur par défaut en cas d'erreur
      }
    } else {
      normalizedValue = 0; // Valeur par défaut si non fournie
    }

    console.log('Valeurs à insérer:', {
      nom, 
      type: typeValue, 
      lot, 
      fournisseurId, 
      pays_origine, 
      valeur: normalizedValue, 
      code_douanier: normalizedCode, 
      matiere_premiere_source, 
      regle_origine
    });

    const result = await client.query(
      'INSERT INTO matieres_premieres (nom, type, lot, fournisseur_id, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [nom, typeValue, lot, fournisseurId, pays_origine, normalizedValue, normalizedCode, matiere_premiere_source, regle_origine]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la matière première:', error);
    
    // Gestion spécifique des erreurs de contrainte
    if (error.code === '23514') { // Violation de contrainte check
      return res.status(400).json({ 
        error: 'Violation de contrainte de type',
        details: 'Le type doit être une valeur valide (extrait, huile, etc.)',
        constraint: error.constraint
      });
    } else if (error.code === '23505') { // Violation de contrainte unique
      return res.status(400).json({ 
        error: 'Cette matière première existe déjà',
        details: error.detail,
        constraint: error.constraint
      });
    } else if (error.code === '23502') { // Violation de contrainte not null
      return res.status(400).json({ 
        error: 'Champ obligatoire manquant',
        details: error.column ? `Le champ ${error.column} est obligatoire` : error.message,
        constraint: error.constraint
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la création de la matière première',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
});

app.put('/api/matieres-premieres/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, type, lot, fournisseur, pays_origine, valeur, code_douanier, matiere_premiere_source, regle_origine } = req.body;
  const client = await pool.connect();

  try {
    // Vérifier si le fournisseur existe déjà
    let fournisseurId = null;
    if (fournisseur) {
      const fournisseurResult = await client.query('SELECT id FROM fournisseurs WHERE nom = $1', [fournisseur]);
      if (fournisseurResult.rows.length > 0) {
        fournisseurId = fournisseurResult.rows[0].id;
      } else {
        const newFournisseurResult = await client.query('INSERT INTO fournisseurs (nom) VALUES ($1) RETURNING id', [fournisseur]);
        fournisseurId = newFournisseurResult.rows[0].id;
      }
    }

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    const result = await client.query(
      'UPDATE matieres_premieres SET nom = $1, type = $2, lot = $3, fournisseur_id = $4, pays_origine = $5, valeur = $6, code_douanier = $7, matiere_premiere_source = $8, regle_origine = $9 WHERE id = $10 RETURNING *',
      [nom, type, lot, fournisseurId, pays_origine, valeur, normalizedCode, matiere_premiere_source, regle_origine, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la matière première:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la matière première' });
  } finally {
    client.release();
  }
});

app.delete('/api/matieres-premieres/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('DELETE FROM transformations WHERE matiere_premiere_id = $1', [id]);
    await client.query('DELETE FROM documents WHERE matiere_premiere_id = $1', [id]);
    await client.query('DELETE FROM semi_finis_matieres_premieres WHERE matiere_premiere_id = $1', [id]);
    const result = await client.query('DELETE FROM matieres_premieres WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Matière première non trouvée');
    }

    res.json({ message: 'Supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression', 
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// Routes pour les transformations
app.get('/api/transformations', async (req, res) => {
  try {
    // Récupérer les paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Requête pour récupérer les transformations avec pagination
    const query = `
      SELECT t.*, f.nom as fournisseur 
      FROM transformations t 
      JOIN fournisseurs f ON t.fournisseur_id = f.id 
      ORDER BY t.id ASC
      LIMIT $1 OFFSET $2
    `;
    
    // Requête pour compter le nombre total de transformations
    const countQuery = `SELECT COUNT(*) FROM transformations`;
    
    // Exécuter les deux requêtes
    const transformationsResult = await pool.query(query, [limit, offset]);
    const countResult = await pool.query(countQuery);
    
    // Calculer le nombre total de pages
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    // Retourner les résultats avec les métadonnées de pagination
    res.json({
      data: transformationsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transformations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des transformations' });
  }
});

app.post('/api/transformations', async (req, res) => {
  const { nom, fournisseur, lot, origine, valeur, code_douanier, description, matiere_premiere_id } = req.body;
  const client = await pool.connect();

  try {
    // Vérifier si le fournisseur existe déjà
    let fournisseurId = null;
    if (fournisseur) {
      const fournisseurResult = await client.query('SELECT id FROM fournisseurs WHERE nom = $1', [fournisseur]);
      if (fournisseurResult.rows.length > 0) {
        fournisseurId = fournisseurResult.rows[0].id;
      } else {
        const newFournisseurResult = await client.query('INSERT INTO fournisseurs (nom) VALUES ($1) RETURNING id', [fournisseur]);
        fournisseurId = newFournisseurResult.rows[0].id;
      }
    }

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    const result = await client.query(
      'INSERT INTO transformations (nom, fournisseur_id, lot, origine, valeur, code_douanier, description, matiere_premiere_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nom, fournisseurId, lot, origine, valeur, normalizedCode, description, matiere_premiere_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de la transformation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la transformation' });
  } finally {
    client.release();
  }
});

app.put('/api/transformations/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, fournisseur, lot, origine, valeur, code_douanier, description, matiere_premiere_id } = req.body;
  const client = await pool.connect();

  try {
    // Vérifier si le fournisseur existe déjà
    let fournisseurId = null;
    if (fournisseur) {
      const fournisseurResult = await client.query('SELECT id FROM fournisseurs WHERE nom = $1', [fournisseur]);
      if (fournisseurResult.rows.length > 0) {
        fournisseurId = fournisseurResult.rows[0].id;
      } else {
        const newFournisseurResult = await client.query('INSERT INTO fournisseurs (nom) VALUES ($1) RETURNING id', [fournisseur]);
        fournisseurId = newFournisseurResult.rows[0].id;
      }
    }

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    const result = await client.query(
      'UPDATE transformations SET nom = $1, fournisseur_id = $2, lot = $3, origine = $4, valeur = $5, code_douanier = $6, description = $7, matiere_premiere_id = $8 WHERE id = $9 RETURNING *',
      [nom, fournisseurId, lot, origine, valeur, normalizedCode, description, matiere_premiere_id, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Transformation non trouvée' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la transformation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la transformation' });
  } finally {
    client.release();
  }
});

app.delete('/api/transformations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM transformations WHERE id = $1', [id]);
    res.json({ message: 'Supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour récupérer les fournisseurs et les lots
app.get('/api/matieres-premieres/fournisseurs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT f.nom as fournisseur 
      FROM fournisseurs f 
      JOIN matieres_premieres mp ON mp.fournisseur_id = f.id 
      ORDER BY f.nom
    `);
    res.json(result.rows.map(row => row.fournisseur));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/matieres-premieres/lots/:fournisseur', async (req, res) => {
  const { fournisseur } = req.params;
  try {
    const result = await pool.query(`
      SELECT DISTINCT mp.lot 
      FROM matieres_premieres mp 
      JOIN fournisseurs f ON mp.fournisseur_id = f.id 
      WHERE f.nom = $1 
      ORDER BY mp.lot
    `, [fournisseur]);
    res.json(result.rows.map(row => row.lot));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les transformations liées à une matière première
app.get('/api/matieres-premieres/:id/transformations', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM transformations WHERE matiere_premiere_id = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les documents
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await pool.query(
      'SELECT * FROM documents ORDER BY matiere_premiere_id, type_document'
    );
    res.json(documents.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/documents/matieres-premieres/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE matiere_premiere_id = $1 ORDER BY type_document',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/documents/transformations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE transformation_id = $1 ORDER BY type_document',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/documents/semi-finis/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Récupération des documents pour le semi-fini ID: ${id}`);
    const result = await pool.query(
      'SELECT * FROM documents WHERE semi_fini_id = $1 ORDER BY type_document',
      [id]
    );
    console.log(`Documents trouvés: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des documents pour le semi-fini:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  const { type_document, matiere_premiere_id, transformation_id } = req.body;
  
  try {
    // Créer le chemin relatif du fichier (pour le stockage en base de données)
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
    console.log('Chemin relatif du fichier:', relativePath);

    // Vérifier si le fichier existe
    try {
      await fs.promises.access(absolutePath);
      console.log('Le fichier existe');
    } catch (error) {
      console.error('Le fichier n\'existe pas:', error);
      throw new Error(`Le fichier ${fichier_path} n'existe pas`);
    }

    // Vérifier si le fichier est un PDF
    if (!absolutePath.toLowerCase().endsWith('.pdf')) {
      throw new Error('Le fichier doit être au format PDF');
    }

    // Lire le fichier PDF
    let dataBuffer;
    try {
      dataBuffer = await fs.promises.readFile(absolutePath);
      console.log('Fichier PDF lu avec succès:', absolutePath);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      throw new Error(`Erreur lors de la lecture du fichier: ${error.message}`);
    }

    let pdfData;
    try {
      pdfData = await pdf(dataBuffer);
      console.log('PDF parsé avec succès, nombre de pages:', pdfData.numpages);
    } catch (error) {
      console.error('Erreur lors du parsing du PDF:', error);
      throw new Error(`Erreur lors du parsing du PDF: ${error.message}`);
    }
    
    // Extraire le texte du PDF
    let fileContent = pdfData.text;
    console.log('Longueur du contenu extrait:', fileContent.length);
    
    // Limiter la taille du contenu
    const maxLength = 8000;
    if (fileContent.length > maxLength) {
      fileContent = fileContent.substring(0, maxLength) + "\n[Contenu tronqué pour respecter la limite de taille]";
      console.log('Contenu tronqué à', maxLength, 'caractères');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    let prompt = '';
    let fields = {};
    
    if (type_document === 'bon_livraison') {
      fields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        nom_matiere_premiere: 'nom de la matière première',
        numero_bl: 'numéro du bon de livraison',
        adresse_depart: 'adresse de départ',
        adresse_destination: 'adresse de destination',
        poids_colis: 'poids du colis',
        mode_transport: 'mode de transport'
      };
      prompt = `Analyser ce bon de livraison et indiquer si les informations suivantes sont présentes : ${Object.values(fields).join(', ')}. Répondre au format suivant :
PRESENT: [liste des champs présents]
MISSING: [liste des champs manquants]
SUMMARY: [résumé en français]`;
    } else if (type_document === 'bulletin_analyse') {
      fields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        numero_lot: 'numéro du lot',
        numero_commande: 'numéro de commande',
        nom_matiere_premiere: 'nom de la matière première',
        caracteristiques_matiere: 'caractéristique de la matière première'
      };
      prompt = `Analyser ce bulletin d'analyse et indiquer si les informations suivantes sont présentes : ${Object.values(fields).join(', ')}. Répondre au format suivant :
PRESENT: [liste des champs présents]
MISSING: [liste des champs manquants]
SUMMARY: [résumé en français]`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyse le document et identifie les informations présentes et manquantes. Réponds UNIQUEMENT au format demandé."
        },
        {
          role: "user",
          content: `${prompt}\n\nContenu du document:\n${fileContent}`
        }
      ]
    });

    // Nettoyer le fichier uploadé
    fs.unlinkSync(absolutePath);

    // Parser la réponse JSON
    console.log('Réponse brute de l\'API OpenAI:', JSON.stringify(completion.choices[0].message.content, null, 2));
    
    let analysisResults;
    try {
      analysisResults = JSON.parse(completion.choices[0].message.content);
      console.log('Structure de la réponse parsée:', JSON.stringify(analysisResults, null, 2));
      
      // Gérer différentes structures possibles de la réponse
      if (analysisResults.matieres_premieres) {
        // Si la réponse est sous la forme { matieres_premieres: [...] }
        analysisResults = analysisResults.matieres_premieres;
      } else if (analysisResults.results) {
        // Si la réponse est sous la forme { results: [...] }
        analysisResults = analysisResults.results;
      } else if (analysisResults.data) {
        // Si la réponse est sous la forme { data: [...] }
        analysisResults = analysisResults.data;
      } else if (!Array.isArray(analysisResults)) {
        // Si le résultat n'est pas un tableau et n'a pas de propriété spécifique
        // Vérifier si c'est un objet unique représentant une matière première
        if (analysisResults.nom || analysisResults.code_douanier || analysisResults.fournisseur) {
          analysisResults = [analysisResults];
        } else {
          // Chercher d'autres propriétés qui pourraient contenir les résultats
          const possibleArrayProps = Object.keys(analysisResults).filter(key => 
            Array.isArray(analysisResults[key]) && 
            analysisResults[key].length > 0 &&
            (analysisResults[key][0].nom || analysisResults[key][0].code_douanier)
          );
          
          if (possibleArrayProps.length > 0) {
            analysisResults = analysisResults[possibleArrayProps[0]];
          } else {
            // Si aucune structure reconnue n'est trouvée, créer un tableau vide
            analysisResults = [];
          }
        }
      }
      
      // Vérifier si le tableau est vide ou contient des objets vides
      if (!Array.isArray(analysisResults) || analysisResults.length === 0 || 
          (analysisResults.length === 1 && Object.keys(analysisResults[0]).length === 0)) {
        console.error('Aucune matière première n\'a été détectée dans le document');
        return res.status(404).json({ 
          error: 'Aucune matière première n\'a été détectée dans le document',
          message: 'Le système n\'a pas pu identifier de matières premières dans ce document. Veuillez vérifier que le document contient bien des informations sur des matières premières et qu\'il est lisible.',
          rawContent: completion.choices[0].message.content
        });
      }
      
      // Nettoyer et normaliser les résultats
      analysisResults = analysisResults.map(item => {
        // S'assurer que tous les champs requis existent
        const cleanedItem = {
          nom: item.nom || null,
          fournisseur: item.fournisseur || null,
          pays_origine: item.pays_origine || null,
          valeur: item.valeur || null,
          code_douanier: item.code_douanier ? normalizeCustomsCode(item.code_douanier) : null
        };
        
        // Nettoyer la valeur si elle existe
        if (cleanedItem.valeur) {
          // Extraire uniquement les chiffres et le point décimal
          const cleanedValue = String(cleanedItem.valeur).replace(/[^\d.]/g, '');
          cleanedItem.valeur = parseFloat(cleanedValue) || 0; // Utiliser 0 comme valeur par défaut
        }
        
        return cleanedItem;
      });
      
      // Filtrer les résultats qui n'ont pas au moins un nom ou un code douanier
      analysisResults = analysisResults.filter(item => item.nom || item.code_douanier);
      
      if (analysisResults.length === 0) {
        console.error('Après nettoyage, aucune matière première valide n\'a été détectée');
        return res.status(404).json({ 
          error: 'Aucune matière première valide n\'a été détectée',
          message: 'Après traitement, aucune matière première avec des informations suffisantes n\'a pu être identifiée.',
          rawContent: completion.choices[0].message.content
        });
      }
      
      console.log('Résultats d\'analyse finaux après nettoyage:', JSON.stringify(analysisResults, null, 2));
    } catch (parseError) {
      console.error('Erreur lors du parsing JSON:', parseError);
      console.error('Contenu qui a causé l\'erreur:', completion.choices[0].message.content);
      return res.status(500).json({ 
        error: 'Erreur lors du parsing des résultats d\'analyse',
        message: 'Le système n\'a pas pu interpréter la réponse de l\'analyse. Veuillez réessayer ou contacter le support technique.',
        details: parseError.message,
        rawContent: completion.choices[0].message.content
      });
    }
    
    // Préparer les champs pour l'insertion
    const fieldValues = {};
    Object.entries(fields).forEach(([dbField, displayName]) => {
      fieldValues[dbField] = analysisResults.some(mp => mp[displayName]);
    });

    // Calculer le ratio de conformité (nombre de champs présents / nombre total de champs)
    const presentCount = Object.values(fieldValues).filter(value => value).length;
    const totalFields = Object.keys(fieldValues).length;
    const ratio = presentCount / totalFields;

    // Déterminer la table et les champs
    const tableName = type_document === 'bon_livraison' ? 'analyses_bon_livraison' : 'analyses_bulletin_analyse';

    // Vérifier si une analyse existe déjà pour ce document
    const existingAnalysis = await pool.query(
      `SELECT id FROM ${tableName} WHERE document_id = $1`,
      [document_id]
    );

    let analyseResult;
    if (existingAnalysis.rows.length > 0) {
      // Mettre à jour l'analyse existante
      const setClause = Object.keys(fieldValues)
        .map((field, index) => `${field} = $${index + 4}`)
        .join(', ');
      
      const updateValues = [
        analysisResults[0].resume,
        ratio,
        document_id,
        ...Object.values(fieldValues)
      ];
      
      const updateQuery = `
        UPDATE ${tableName} 
        SET resume = $1, 
            ratio_conformite = $2,
            date_analyse = CURRENT_TIMESTAMP,
            ${setClause}
        WHERE document_id = $3
        RETURNING *`;
      
      console.log('Update Query:', updateQuery);
      console.log('Update Values:', updateValues);
      
      analyseResult = await pool.query(updateQuery, updateValues);
    } else {
      // Créer une nouvelle analyse
      const fields = ['document_id', 'matiere_premiere_id', 'resume', 'ratio_conformite', ...Object.keys(fieldValues)];
      const values = [document_id, matiere_premiere_id, analysisResults[0].resume, ratio, ...Object.values(fieldValues)];
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const insertQuery = `
        INSERT INTO ${tableName} (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *`;
      
      console.log('Insert Query:', insertQuery);
      console.log('Insert Values:', values);
      
      analyseResult = await pool.query(insertQuery, values);
    }

    // Récupérer l'analyse complète avec les informations du document
    const fullAnalyse = await pool.query(
      `SELECT a.*, d.fichier_path, d.type_document
       FROM ${tableName} a
       JOIN documents d ON d.id = a.document_id
       WHERE a.document_id = $1`,
      [document_id]
    );

    console.log('Analyse complète:', fullAnalyse.rows[0]);

    res.json(fullAnalyse.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse', 
      details: error.message,
      filename: fichier_path 
    });
  }
});

// Route simplifiée pour vérifier directement tous les semi-finis sans jointure
app.get('/api/semi-finis-simple', async (req, res) => {
  try {
    console.log('\n=== Vérification directe de tous les semi-finis ===');
    
    // Requête simple pour récupérer tous les semi-finis sans jointure
    const result = await pool.query('SELECT * FROM semi_finis ORDER BY nom');
    
    console.log(`\n${result.rows.length} semi-finis trouvés directement dans la base de données:`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}`);
      
      // Vérifier spécifiquement si la Sauce 5 existe
      if (row.nom && (row.nom.includes('5') || row.nom.toLowerCase().includes('sauce 5'))) {
        console.log('\n*** SAUCE 5 TROUVÉE DANS LA BASE DE DONNÉES ***');
        console.log('Détails de la Sauce 5:', row);
      }
    });
    
    res.json({ 
      success: true, 
      count: result.rows.length,
      rows: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la vérification directe des semi-finis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification directe des semi-finis',
      details: error.message 
    });
  }
});

// Routes pour les semi-finis
app.get('/api/semi-finis', async (req, res) => {
  try {
    console.log('\n=== Récupération des semi-finis ===');
    // Utiliser une requête simplifiée pour s'assurer que tous les semi-finis sont retournés
    const result = await pool.query(`
      SELECT 
        sf.id,
        sf.nom,
        sf.lot_number,
        sf.pays_origine,
        sf.valeur,
        sf.code_douanier,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', mp.id,
                'nom', mp.nom,
                'type', mp.type,
                'lot', mp.lot
              )
            )
            FROM semi_finis_matieres_premieres sfmp
            JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
            WHERE sfmp.semi_fini_id = sf.id
          ),
          '[]'::json
        ) as matieres_premieres
      FROM semi_finis sf
      ORDER BY sf.nom
    `);

    console.log('\nRésultats de la requête:');
    console.log(`Nombre total de semi-finis: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log('\n-------------------');
      console.log(`ID: ${row.id}`);
      console.log(`Nom: ${row.nom}`);
      console.log(`Lot: ${row.lot_number}`);
      console.log(`Pays d'origine: ${row.pays_origine}`);
      console.log(`Valeur: ${row.valeur}`);
      console.log(`Code douanier: ${row.code_douanier}`);
      console.log('Matières premières:', JSON.stringify(row.matieres_premieres, null, 2));
    });

    console.log('\n=== Fin de la récupération des semi-finis ===\n');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des semi-finis:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

app.post('/api/semi-finis', async (req, res) => {
  const { nom, lot_number, pays_origine, valeur, code_douanier, matieres_premieres } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    // Insérer le semi-fini
    const semiFiniResult = await client.query(
      'INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nom, lot_number, pays_origine, valeur, normalizedCode]
    );
    const semiFiniId = semiFiniResult.rows[0].id;

    // Insérer les relations avec les matières premières
    if (matieres_premieres && matieres_premieres.length > 0) {
      const values = matieres_premieres.map(mp_id => 
        `(${semiFiniId}, ${mp_id})`
      ).join(', ');
      
      await client.query(`
        INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id)
        VALUES ${values}
      `);
    }

    await client.query('COMMIT');
    
    // Récupérer le semi-fini complet avec ses matières premières
    const result = await client.query(`
      SELECT 
        sf.id,
        sf.nom,
        sf.lot_number,
        sf.pays_origine,
        sf.valeur,
        sf.code_douanier,
        json_agg(
          json_build_object(
            'id', mp.id,
            'nom', mp.nom,
            'type', mp.type,
            'lot', mp.lot
          )
        ) as matieres_premieres
      FROM semi_finis sf
      LEFT JOIN semi_finis_matieres_premieres sfmp ON sf.id = sfmp.semi_fini_id
      LEFT JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
      WHERE sf.id = $1
      GROUP BY sf.id, sf.nom, sf.lot_number, sf.pays_origine, sf.valeur, sf.code_douanier
    `, [semiFiniId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du semi-fini:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/semi-finis/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, lot_number, pays_origine, valeur, code_douanier, matieres_premieres } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    // Mettre à jour le semi-fini
    await client.query(
      'UPDATE semi_finis SET nom = $1, lot_number = $2, pays_origine = $3, valeur = $4, code_douanier = $5 WHERE id = $6',
      [nom, lot_number, pays_origine, valeur, normalizedCode, id]
    );

    // Supprimer les anciennes relations
    await client.query(
      'DELETE FROM semi_finis_matieres_premieres WHERE semi_fini_id = $1',
      [id]
    );

    // Insérer les nouvelles relations avec les matières premières
    if (matieres_premieres && matieres_premieres.length > 0) {
      const values = matieres_premieres.map(mp_id => 
        `(${id}, ${mp_id})`
      ).join(', ');
      
      await client.query(`
        INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id)
        VALUES ${values}
      `);
    }

    await client.query('COMMIT');
    
    // Récupérer le semi-fini mis à jour
    const result = await client.query(`
      SELECT 
        sf.id,
        sf.nom,
        sf.lot_number,
        sf.pays_origine,
        sf.valeur,
        sf.code_douanier,
        json_agg(
          json_build_object(
            'id', mp.id,
            'nom', mp.nom,
            'type', mp.type,
            'lot', mp.lot
          )
        ) as matieres_premieres
      FROM semi_finis sf
      LEFT JOIN semi_finis_matieres_premieres sfmp ON sf.id = sfmp.semi_fini_id
      LEFT JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
      WHERE sf.id = $1
      GROUP BY sf.id, sf.nom, sf.lot_number, sf.pays_origine, sf.valeur, sf.code_douanier
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Semi-fini non trouvé' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la mise à jour du semi-fini:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/semi-finis/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Supprimer d'abord les relations avec les matières premières
    await client.query('DELETE FROM semi_finis_matieres_premieres WHERE semi_fini_id = $1', [id]);

    // Supprimer le semi-fini
    await client.query('DELETE FROM semi_finis WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Semi-fini supprimé avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la suppression du semi-fini:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du semi-fini' });
  } finally {
    client.release();
  }
});

// Routes pour les produits finis
app.get('/api/produits-finis', async (req, res) => {
  console.log('Récupération des produits finis...');
  try {
    // Vérifier si la table existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'produits_finis'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('La table produits_finis n\'existe pas encore');
      return res.json([]);
    }

    const query = `
      SELECT 
        pf.*,
        s.nom as sauce_nom,
        s.lot_number as sauce_lot_number,
        s.pays_origine as sauce_pays_origine,
        s.valeur as sauce_valeur,
        s.code_douanier as sauce_code_douanier
      FROM produits_finis pf
      LEFT JOIN semi_finis s ON pf.sauce_id = s.id
      ORDER BY pf.id
    `;
    const result = await pool.query(query);
    console.log('Produits finis récupérés:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur détaillée lors de la récupération des produits finis:', err);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: err.message,
      stack: err.stack 
    });
  }
});

app.post('/api/produits-finis', async (req, res) => {
  console.log('Création d\'un nouveau produit fini...');
  console.log('Données reçues:', req.body);
  
  const { nom, pays_origine, lot_number, valeur, code_douanier, sauce_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    // Convertir les valeurs en nombres
    const valeurNumber = valeur ? parseFloat(valeur) : null;
    const sauceIdNumber = sauce_id ? parseInt(sauce_id) : null;

    // Insérer le produit fini
    const query = `
      INSERT INTO produits_finis 
        (nom, pays_origine, lot_number, valeur, code_douanier, sauce_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      nom,
      pays_origine,
      lot_number,
      valeurNumber,
      normalizedCode,
      sauceIdNumber
    ];
    
    const result = await client.query(query, values);
    console.log('Résultat de l\'insertion:', result.rows[0]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur détaillée lors de la création du produit fini:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
    res.status(500).json({ 
      error: 'Erreur lors de la création du produit fini',
      detail: err.message 
    });
  } finally {
    client.release();
  }
});

app.put('/api/produits-finis/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, pays_origine, lot_number, valeur, code_douanier, sauce_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normaliser le code douanier
    const normalizedCode = code_douanier ? normalizeCustomsCode(code_douanier) : null;

    // Convertir les valeurs en nombres
    const valeurNumber = valeur ? parseFloat(valeur) : null;
    const sauceIdNumber = sauce_id ? parseInt(sauce_id) : null;

    // Mettre à jour le produit fini
    const query = `
      UPDATE produits_finis 
      SET 
          nom = $1, 
          pays_origine = $2, 
          lot_number = $3, 
          valeur = $4, 
          code_douanier = $5,
          sauce_id = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [nom, pays_origine, lot_number, valeurNumber, normalizedCode, sauceIdNumber, id];
    
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produit fini non trouvé' });
    }

    console.log('Produit mis à jour avec succès:', result.rows[0]);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur détaillée lors de la mise à jour du produit fini:', {
      message: err.message,
      stack: err.stack,
      detail: err.detail,
      code: err.code
    });
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du produit fini',
      detail: err.message 
    });
  } finally {
    client.release();
  }
});

app.delete('/api/produits-finis/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produits_finis WHERE id = $1', [id]);
    res.json({ message: 'Produit fini supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression du produit fini:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour la traçabilité de la sauce3
app.get('/api/trace-sauce3', async (req, res) => {
  try {
    // 1. Trouver la sauce3 et ses matières premières
    const sauceQuery = `
      SELECT 
        s.id, s.nom, s.lot_number, s.pays_origine, s.valeur, s.code_douanier,
        json_agg(
          json_build_object(
            'id', mp.id,
            'nom', mp.nom,
            'type', mp.type,
            'lot', mp.lot
          )
        ) as matieres_premieres
      FROM semi_finis s
      LEFT JOIN semi_finis_matieres_premieres sfmp ON s.id = sfmp.semi_fini_id
      LEFT JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
      WHERE s.nom ILIKE '%sauce%'
      GROUP BY s.id
      ORDER BY s.id DESC
      LIMIT 1
    `;

    const sauceResult = await pool.query(sauceQuery);
    
    if (sauceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sauce non trouvée' });
    }
    
    const sauce = sauceResult.rows[0];
    
    // 2. Préparer la réponse
    const response = {
      sauce: {
        id: sauce.id,
        nom: sauce.nom,
        lot_number: sauce.lot_number,
        pays_origine: sauce.pays_origine,
        valeur: sauce.valeur,
        code_douanier: sauce.code_douanier
      },
      matieres_premieres: sauce.matieres_premieres.filter(mp => mp.id !== null)
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la traçabilité:', error);
    res.status(500).json({ error: 'Erreur lors de la traçabilité' });
  }
});

// Endpoint pour tracer un produit fini
app.get('/api/trace-produit-fini/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { id } = req.params;
    
    console.log(`Récupération de la traçabilité pour le produit: ${req.params.id}`);
    
    // 1. Récupérer le produit fini
    const produitFini = await pool.query(`
      SELECT pf.*, s.nom as sauce_nom, s.id as sauce_id, s.lot_number as sauce_lot_number
      FROM produits_finis pf
      JOIN semi_finis s ON pf.sauce_id = s.id
      WHERE pf.nom = $1
    `, [req.params.id]);

    if (produitFini.rows.length === 0) {
      return res.status(404).json({ error: 'Produit fini non trouvé' });
    }

    console.log(`Produit fini trouvé: ${JSON.stringify(produitFini.rows[0])}`);

    // 2. Récupérer les transformations de la sauce
    try {
      // Vérifier si nous avons une table de jointure entre semi_finis et transformations
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'semi_finis_transformations'
        );
      `);
      
      let sauceTransformations = { rows: [] };
      
      if (tableExists.rows[0].exists) {
        // Si la table de jointure existe, l'utiliser
        sauceTransformations = await pool.query(`
          SELECT t.nom, t.lot
          FROM transformations t
          JOIN semi_finis_transformations sft ON t.id = sft.transformation_id
          WHERE sft.semi_fini_id = $1
          ORDER BY t.id
        `, [produitFini.rows[0].sauce_id]);
      }
      
      console.log(`Transformations de la sauce récupérées: ${sauceTransformations.rows.length}`);
      
      // 3. Récupérer les extraits de la sauce
      const extraitsQuery = await pool.query(`
        SELECT 
          mp.*,
          f.nom as fournisseur
        FROM matieres_premieres mp
        LEFT JOIN fournisseurs f ON mp.fournisseur_id = f.id
        JOIN semi_finis_matieres_premieres sfmp ON mp.id = sfmp.matiere_premiere_id
        WHERE sfmp.semi_fini_id = $1 AND mp.type = 'extrait'
      `, [produitFini.rows[0].sauce_id]);
      
      console.log(`Extraits récupérés: ${extraitsQuery.rows.length}`);

      // 4. Pour chaque extrait, récupérer sa plante source
      const extraitsEtPlantes = await Promise.all(
        extraitsQuery.rows.map(async (extrait) => {
          // Récupérer les transformations de l'extrait
          const extraitTransformations = await pool.query(`
            SELECT nom, lot
            FROM transformations
            WHERE matiere_premiere_id = $1
            ORDER BY id
          `, [extrait.id]);
          
          console.log(`Transformations de l'extrait ${extrait.nom} récupérées: ${extraitTransformations.rows.length}`);

          if (!extrait.matiere_premiere_source) {
            return {
              extrait: {
                ...extrait,
                transformations: extraitTransformations.rows.map(t => 
                  t.lot ? `${t.nom} (${t.lot})` : t.nom
                )
              }
            };
          }

          // Récupérer la plante source et ses transformations
          const planteQuery = await pool.query(`
            SELECT 
              mp.*,
              f.nom as fournisseur
            FROM matieres_premieres mp
            LEFT JOIN fournisseurs f ON mp.fournisseur_id = f.id
            WHERE mp.lot = $1 AND mp.type = 'plante'
          `, [extrait.matiere_premiere_source]);
          
          console.log(`Plante source pour l'extrait ${extrait.nom} récupérée: ${planteQuery.rows.length > 0 ? planteQuery.rows[0].nom : 'aucune'}`);

          if (planteQuery.rows[0]) {
            const planteTransformations = await pool.query(`
              SELECT nom, lot
              FROM transformations
              WHERE matiere_premiere_id = $1
              ORDER BY id
            `, [planteQuery.rows[0].id]);
            
            console.log(`Transformations de la plante ${planteQuery.rows[0].nom} récupérées: ${planteTransformations.rows.length}`);

            return {
              extrait: {
                ...extrait,
                transformations: extraitTransformations.rows.map(t => 
                  t.lot ? `${t.nom} (${t.lot})` : t.nom
                )
              },
              plante: {
                ...planteQuery.rows[0],
                transformations: planteTransformations.rows.map(t => 
                  t.lot ? `${t.nom} (${t.lot})` : t.nom
                )
              }
            };
          }

          return {
            extrait: {
              ...extrait,
              transformations: extraitTransformations.rows.map(t => 
                t.lot ? `${t.nom} (${t.lot})` : t.nom
              )
            }
          };
        })
      );

      // 5. Construire la réponse finale
      const response = {
        produit_fini: produitFini.rows[0],
        sauce: {
          id: produitFini.rows[0].sauce_id,
          nom: produitFini.rows[0].sauce_nom,
          lot_number: produitFini.rows[0].sauce_lot_number,
          transformations: sauceTransformations.rows.map(t => 
            t.lot ? `${t.nom} (${t.lot})` : t.nom
          )
        },
        matieres_premieres: extraitsEtPlantes.reduce((acc, item) => {
          if (item.extrait) acc.push(item.extrait);
          if (item.plante) acc.push(item.plante);
          return acc;
        }, []).sort((a, b) => {
          if (a.type === 'extrait' && b.type === 'plante') return -1;
          if (a.type === 'plante' && b.type === 'extrait') return 1;
          return a.nom.localeCompare(b.nom);
        })
      };

      console.log('Réponse construite avec succès');
      res.json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de la chaîne:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la chaîne',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la traçabilité:', error);
    res.status(500).json({ error: 'Erreur lors de la traçabilité' });
  }
});

// Route pour récupérer les documents d'un élément
app.get('/api/documents/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const client = await pool.connect();

  try {
    console.log(`Récupération des documents pour ${type} avec l'ID ${id}`);

    // Construire la requête en fonction du type d'élément
    let query = '';
    let params = [id];

    switch (type) {
      case 'plante':
      case 'extrait':
        query = `
          SELECT d.id, d.type_document as type, d.status, d.created_at as date_reception,
                 d.fichier_path, mp.nom as nom_element, mp.lot as numero_lot
          FROM matieres_premieres mp
          LEFT JOIN documents d ON d.matiere_premiere_id = mp.id
          WHERE mp.id = $1
          ORDER BY d.created_at DESC NULLS LAST
        `;
        break;

      case 'sauce':
        query = `
          SELECT d.id, d.type_document as type, d.status, d.created_at as date_reception,
                 d.fichier_path, sf.nom as nom_element, sf.lot_number as numero_lot
          FROM semi_finis sf
          LEFT JOIN documents d ON d.semi_fini_id = sf.id
          WHERE sf.id = $1
          ORDER BY d.created_at DESC NULLS LAST
        `;
        break;

      case 'produit':
        query = `
          SELECT d.id, d.type_document as type, d.status, d.created_at as date_reception,
                 d.fichier_path, pf.nom as nom_element, pf.lot_number as numero_lot
          FROM produits_finis pf
          LEFT JOIN documents d ON d.produit_fini_id = pf.id
          WHERE pf.id = $1
          ORDER BY d.created_at DESC NULLS LAST
        `;
        break;

      default:
        return res.status(400).json({ error: 'Type d\'élément non valide' });
    }

    // Récupérer les documents reçus
    const documentsRecus = await client.query(query, params);

    // Récupérer la liste des documents requis pour ce type d'élément
    const documentsRequis = await client.query(`
      SELECT DISTINCT type_document
      FROM documents_requis
      WHERE type_element = $1
    `, [type]);

    // Si aucun document requis n'est trouvé, utiliser une liste vide
    const documentsManquants = documentsRequis.rows.length > 0
      ? documentsRequis.rows
        .map(doc => doc.type_document)
        .filter(type => !documentsRecus.rows.some(doc => doc.type === type))
        .map(type => ({ type }))
      : [];

    // Formater la réponse
    const documentsFormates = documentsRecus.rows
      .filter(doc => doc.id !== null) // Filtrer les lignes sans document
      .map(doc => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        date_reception: doc.date_reception,
        fichier_path: doc.fichier_path,
        nom_element: doc.nom_element,
        numero_lot: doc.numero_lot
      }));

    res.json({
      recus: documentsFormates,
      manquants: documentsManquants
    });

  } catch (err) {
    console.error('Erreur lors de la récupération des documents:', err);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des documents',
      detail: err.message 
    });
  } finally {
    client.release();
  }
});

// Route pour récupérer une analyse depuis la base de données
app.get('/api/analyses/:table/:documentId', async (req, res) => {
  const { table, documentId } = req.params;
  
  // Vérifier que la table est valide
  if (!['analyses_bon_livraison', 'analyses_bulletin_analyse'].includes(table)) {
    return res.status(400).json({ error: 'Type d\'analyse invalide' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE document_id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucune analyse trouvée pour ce document' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'analyse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.use('/api/gpt', gptRoutes); 
app.use('/api/gpt-transformations', gptTransformationsRoutes);
app.use('/api/transformations', transformationsRoutes);
app.use('/api', emailRoutes);
app.use('/api', pdfRoutes);
app.use('/api', pdfAnalysisRoutes);

// Utiliser les routes personnalisées
app.use('/api', customsCodeRoutes);
app.use('/api', cnCodeLookupRoutes);

// Endpoint pour obtenir les informations d'un produit par code EAN
app.get('/api/product-info/:eanCode', async (req, res) => {
  try {
    const { eanCode } = req.params;
    
    if (!eanCode || eanCode.trim().length < 8) {
      return res.status(400).json({ error: 'Code EAN invalide' });
    }
    
    // Base de données locale des produits EAN fréquemment recherchés
    const eanDatabase = {
      // Produits cosmétiques français (366)
      "3666057300424": {
        name: "Crème hydratante visage bio",
        description: "Crème hydratante pour le visage à base d'ingrédients biologiques. Formule enrichie en acide hyaluronique et en huile d'argan pour une hydratation intense et durable. Convient aux peaux sensibles.",
        brand: "Laboratoires Phytodia",
        category: "Produits cosmétiques",
        origin: "France",
        weight: "50"
      },
      // Autres produits cosmétiques français
      "3660876011578": {
        name: "Huile de soin visage anti-âge",
        description: "Huile de soin anti-âge pour le visage, formulée à base d'huiles végétales précieuses et d'actifs anti-oxydants. Pénètre rapidement et laisse la peau douce et lumineuse.",
        brand: "Evoluderm",
        category: "Produits cosmétiques",
        origin: "France",
        weight: "30"
      },
      // Produits alimentaires français
      "3017620422003": {
        name: "Pâte à tartiner aux noisettes",
        description: "Pâte à tartiner onctueuse au cacao et aux noisettes. Idéale pour le petit-déjeuner ou le goûter.",
        brand: "Nutella",
        category: "Produits alimentaires",
        origin: "France",
        weight: "400"
      },
      // Produits électroniques français
      "3147879000004": {
        name: "Casque audio sans fil",
        description: "Casque audio Bluetooth avec réduction de bruit active. Autonomie de 30 heures et charge rapide.",
        brand: "Thomson",
        category: "Produits électroniques",
        origin: "France",
        weight: "250"
      }
    };

    // 1. Vérifier si le produit existe dans notre base de données locale
    if (eanDatabase[eanCode]) {
      console.log(`Produit trouvé dans la base de données locale pour EAN ${eanCode}`);
      // Ajouter le code EAN à la réponse
      const productInfo = { ...eanDatabase[eanCode], ean: eanCode };
      return res.json(productInfo);
    }
    
    // 2. Analyser le code EAN pour déterminer l'origine et la catégorie
    let productCategory = '';
    let productOrigin = '';
    let specificProduct = '';
    let knownBrands = [];
    
    try {
      const eanPrefix = eanCode.substring(0, 3);
      const eanSubPrefix = eanCode.substring(0, 4);
      
      // Déterminer l'origine probable
      if (eanPrefix >= '300' && eanPrefix <= '379') {
        productOrigin = 'France';
        
        // Marques françaises connues par catégorie
        if (eanSubPrefix === '3666' || (eanPrefix >= '366' && eanPrefix <= '369')) {
          knownBrands = ['Yves Rocher', 'L\'Occitane', 'Nuxe', 'Caudalie', 'Avène', 'La Roche-Posay', 'Bioderma', 'Vichy', 'Phytodia', 'Evoluderm'];
        } else if (eanPrefix >= '300' && eanPrefix <= '302') {
          knownBrands = ['Danone', 'Bonne Maman', 'Lu', 'Président', 'Fleury Michon', 'Bonduelle'];
        } else if (eanPrefix >= '310' && eanPrefix <= '315') {
          knownBrands = ['Thomson', 'Parrot', 'Archos', 'Wiko', 'Netatmo', 'Withings'];
        }
        
      } else if (eanPrefix >= '400' && eanPrefix <= '440') {
        productOrigin = 'Allemagne';
        knownBrands = ['Nivea', 'Adidas', 'Puma', 'Bosch', 'Siemens', 'Braun', 'Bayer'];
      } else if (eanPrefix >= '500' && eanPrefix <= '509') {
        productOrigin = 'Royaume-Uni';
        knownBrands = ['Burberry', 'Rimmel', 'Boots', 'Twinings', 'Dyson', 'Jaguar'];
      } else if (eanPrefix >= '600' && eanPrefix <= '699') {
        productOrigin = 'Pays scandinaves';
        knownBrands = ['Ikea', 'H&M', 'Electrolux', 'Nokia', 'Volvo', 'Fjällräven'];
      } else if (eanPrefix >= '800' && eanPrefix <= '839') {
        productOrigin = 'Italie';
        knownBrands = ['Barilla', 'Lavazza', 'Ferrero', 'Gucci', 'Prada', 'Ferrari'];
      } else if (eanPrefix >= '840' && eanPrefix <= '849') {
        productOrigin = 'Espagne';
        knownBrands = ['Zara', 'Mango', 'Tous', 'Desigual', 'Seat', 'Freixenet'];
      } else if (eanPrefix >= '870' && eanPrefix <= '879') {
        productOrigin = 'Pays-Bas';
        knownBrands = ['Philips', 'Unilever', 'Heineken', 'Douwe Egberts', 'Bols'];
      } else if (eanPrefix >= '900' && eanPrefix <= '919') {
        productOrigin = 'Autriche';
        knownBrands = ['Red Bull', 'Swarovski', 'Manner', 'Rauch', 'KTM'];
      }
      
      // Déterminer la catégorie probable
      if (eanSubPrefix === '3666' || (eanPrefix >= '366' && eanPrefix <= '369')) {
        productCategory = 'Produits cosmétiques';
        specificProduct = 'produit cosmétique ou d\'hygiène personnelle';
      } else if (eanPrefix >= '300' && eanPrefix <= '302') {
        productCategory = 'Produits alimentaires';
        specificProduct = 'produit alimentaire';
      } else if (eanPrefix >= '303' && eanPrefix <= '305') {
        productCategory = 'Produits ménagers';
        specificProduct = 'produit d\'entretien ménager';
      } else if (eanPrefix >= '306' && eanPrefix <= '309') {
        productCategory = 'Produits textiles';
        specificProduct = 'produit textile ou vêtement';
      } else if (eanPrefix >= '310' && eanPrefix <= '315') {
        productCategory = 'Produits électroniques';
        specificProduct = 'appareil électronique';
      } else if (eanPrefix >= '316' && eanPrefix <= '319') {
        productCategory = 'Produits de bricolage';
        specificProduct = 'outil ou produit de bricolage';
      } else if (eanPrefix >= '320' && eanPrefix <= '329') {
        productCategory = 'Produits pharmaceutiques';
        specificProduct = 'médicament ou produit pharmaceutique';
      } else if (eanPrefix >= '330' && eanPrefix <= '339') {
        productCategory = 'Produits de luxe';
        specificProduct = 'produit de luxe';
      } else if (eanPrefix >= '340' && eanPrefix <= '349') {
        productCategory = 'Produits sportifs';
        specificProduct = 'équipement sportif';
      } else if (eanPrefix >= '350' && eanPrefix <= '359') {
        productCategory = 'Produits pour enfants';
        specificProduct = 'produit pour enfants';
      } else if (eanPrefix >= '360' && eanPrefix <= '365') {
        productCategory = 'Produits de papeterie';
        specificProduct = 'article de papeterie';
      } else if (eanPrefix >= '367' && eanPrefix <= '379') {
        productCategory = 'Autres produits français';
        specificProduct = 'produit français';
      }
      
      console.log(`EAN ${eanCode} analysé: origine probable ${productOrigin}, catégorie probable ${productCategory}`);
      
    } catch (lookupError) {
      console.error('Erreur lors de l\'analyse EAN:', lookupError);
    }
    
    // 3. Utiliser l'API OpenAI pour générer des informations détaillées sur le produit
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Tu es un assistant spécialisé dans la recherche de produits par code EAN (European Article Number).
        
TÂCHE:
Génère des informations précises et réalistes pour un produit correspondant au code EAN fourni.
${productCategory ? `Le code EAN indique qu'il s'agit d'un produit de la catégorie: ${productCategory}.` : ''}
${productOrigin ? `Le code EAN indique que le produit provient de: ${productOrigin}.` : ''}
${specificProduct ? `Plus précisément, il s'agit d'un ${specificProduct}.` : ''}
${knownBrands.length > 0 ? `Voici des marques connues pour ce type de produit: ${knownBrands.join(', ')}.` : ''}

RÈGLES CRITIQUES:
- Génère des informations RÉALISTES et PRÉCISES pour un produit basé sur le code EAN fourni.
- Sois ABSOLUMENT cohérent avec l'origine et la catégorie identifiées à partir du code EAN.
- Pour les codes EAN commençant par 366, il s'agit UNIQUEMENT de produits cosmétiques français.
- Utilise UNIQUEMENT des marques réelles correspondant au pays d'origine et à la catégorie de produit.
- Sois précis dans la description du produit, incluant ses caractéristiques principales.
- NE JAMAIS inventer un produit qui ne correspond pas à la catégorie identifiée.

FORMAT DE RÉPONSE:
Réponds au format JSON avec les champs suivants:
1. "name": nom du produit (obligatoire)
2. "description": description détaillée du produit (obligatoire)
3. "brand": marque du produit (obligatoire, utilise une marque réelle du pays d'origine)
4. "category": catégorie du produit (obligatoire, doit correspondre à la catégorie identifiée)
5. "origin": pays d'origine (obligatoire, doit être ${productOrigin || "le pays identifié par le code EAN"})
6. "weight": poids en grammes (optionnel)
7. "dimensions": dimensions en cm (optionnel)`
      }, {
        role: "user",
        content: `Recherche les informations du produit avec le code EAN: ${eanCode}`
      }],
      temperature: 0.2,
      max_tokens: 350,
      response_format: { type: "json_object" }
    });
    
    try {
      const productInfo = JSON.parse(completion.choices[0].message.content);
      
      // Vérifier la cohérence des informations générées
      if (productCategory && productInfo.category !== productCategory) {
        console.warn(`Incohérence détectée: catégorie attendue ${productCategory}, reçue ${productInfo.category}`);
        productInfo.category = productCategory;
      }
      
      if (productOrigin && productInfo.origin !== productOrigin) {
        console.warn(`Incohérence détectée: origine attendue ${productOrigin}, reçue ${productInfo.origin}`);
        productInfo.origin = productOrigin;
      }
      
      // Ajouter le code EAN à la réponse
      productInfo.ean = eanCode;
      
      // Enregistrer la recherche dans les logs pour amélioration future
      console.log(`Recherche EAN ${eanCode} réussie: ${productInfo.name} (${productInfo.category})`);
      
      // Ajouter ce produit à notre base de données locale pour les futures recherches
      eanDatabase[eanCode] = {
        name: productInfo.name,
        description: productInfo.description,
        brand: productInfo.brand,
        category: productInfo.category,
        origin: productInfo.origin,
        weight: productInfo.weight,
        dimensions: productInfo.dimensions
      };
      
      res.json(productInfo);
    } catch (parseError) {
      console.error('Erreur lors du parsing de la réponse JSON:', parseError);
      res.status(500).json({ error: 'Erreur lors de la récupération des informations du produit' });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche du produit par EAN:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche du produit',
      details: error.message
    });
  }
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur globale:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    detail: err.detail
  });

  // Si la réponse a déjà été envoyée, passez l'erreur au gestionnaire par défaut
  if (res.headersSent) {
    return next(err);
  }

  // Envoyer une réponse JSON formatée
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      code: err.code,
      detail: err.detail
    } : undefined
  });
});

// Endpoint pour rechercher un code douanier avec Engine 1 ou Engine 2
app.post('/api/query-customs-code', async (req, res) => {
  try {
    const { description, engine, includeExplanation } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'La description du produit est requise' });
    }
    
    if (!engine || !['gpt', 'claude', 'deepseek'].includes(engine)) {
      return res.status(400).json({ error: 'Moteur de recherche invalide. Utilisez "gpt", "claude" ou "deepseek"' });
    }
    
    let result;
    
    if (engine === 'gpt') {
      if (includeExplanation) {
        // Prompt de base pour GPT
        let basePrompt = `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée avec les références et l'origine des informations.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut :
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente
  6. Les références précises utilisées (documents officiels, nomenclature, notes explicatives du SH, etc.)
  7. L'origine de chaque information fournie (ex: "Selon les Notes explicatives du SH 2022, chapitre X, page Y")

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte incluant toutes les références et sources (pas d'objet imbriqué)`;

        // Améliorer le prompt avec des exemples de corrections
        const enhancedPrompt = generateEnhancedPrompt(basePrompt, description, 'gpt');

        // Demander le code ET l'explication avec le prompt amélioré
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: enhancedPrompt
          }, {
            role: "user",
            content: `Détermine le code SH à 8 chiffres pour ce produit et explique-le en détail: ${description}`
          }],
          temperature: 0.3,
          max_tokens: 600,
          response_format: { type: "json_object" }
        });

        try {
          const parsedResponse = JSON.parse(completion.choices[0].message.content);
          
          // Extraire et nettoyer le code
          const code = parsedResponse.code ? parsedResponse.code.replace(/\D/g, '').substring(0, 8) : null;
          
          // S'assurer que l'explication est une chaîne de caractères
          let explanation = parsedResponse.explanation;
          if (explanation && typeof explanation === 'object') {
            explanation = formatExplanationObject(explanation);
          }
          
          if (code && code.length > 0) {
            result = { 
              code: code,
              explanation: explanation || "Aucune explication fournie."
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: "Le système n'a pas pu générer un code douanier valide pour cette description.",
              explanation: explanation || "Aucune explication disponible."
            };
          }
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse JSON:', parseError);
          
          // Fallback: extraire uniquement le code
          const responseText = completion.choices[0].message.content.trim();
          const codeMatch = responseText.replace(/\D/g, '').substring(0, 8);
          
          if (codeMatch && codeMatch.length > 0) {
            result = { 
              code: codeMatch,
              explanation: "Une erreur s'est produite lors de l'analyse de l'explication. Voici la réponse brute: " + responseText
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: responseText
            };
          }
        }
      } else {
        // Demander uniquement le code (comportement original)
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur.

RÈGLES IMPORTANTES:
- Fournis UNIQUEMENT le code SH à 8 chiffres, sans texte supplémentaire.
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Ne fournis aucune explication, justification ou texte supplémentaire.`
          }, {
            role: "user",
            content: `Détermine le code SH à 8 chiffres pour ce produit: ${description}`
          }],
          temperature: 0.1,
          max_tokens: 20
        });
        
        // Extraire et nettoyer le code de la réponse
        const responseText = completion.choices[0].message.content.trim();
        // Extraire uniquement les chiffres (jusqu'à 8)
        const codeMatch = responseText.replace(/\D/g, '').substring(0, 8);
        
        if (codeMatch && codeMatch.length > 0) {
          result = { code: codeMatch };
        } else {
          result = { 
            error: "Impossible de déterminer un code douanier valide", 
            message: responseText 
          };
        }
      }
    } else if (engine === 'claude') {
      // Utiliser Claude (simulation améliorée)
      
      // Générer un code douanier réaliste pour la démonstration
      // Nous utilisons OpenAI pour simuler Claude avec un prompt différent
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `Tu es Claude, un assistant IA expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée avec les références et l'origine des informations.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut EXACTEMENT les éléments suivants:
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente
  6. Les références précises des documents consultés (nomenclature combinée, notes explicatives, règlements, etc.)
  7. L'origine de chaque information (ex: "Selon le Règlement d'exécution (UE) 2021/1832 de la Commission")
  8. Si possible, cite les numéros d'articles ou de pages des documents de référence

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte incluant toutes les références et sources (pas d'objet imbriqué)`
          }, {
            role: "user",
            content: `Détermine le code SH à 8 chiffres pour ce produit et explique-le en détail: ${description}`
          }],
          temperature: 0.3, // Température plus basse pour des réponses plus précises
          max_tokens: 600, // Augmentation des tokens pour des explications plus détaillées
          response_format: { type: "json_object" }
        });
        
        try {
          const parsedResponse = JSON.parse(completion.choices[0].message.content);
          
          // Extraire et nettoyer le code
          const code = parsedResponse.code ? parsedResponse.code.replace(/\D/g, '').substring(0, 8) : null;
          
          // S'assurer que l'explication est une chaîne de caractères
          let explanation = parsedResponse.explanation;
          if (explanation && typeof explanation === 'object') {
            explanation = formatExplanationObject(explanation);
          }
          
          if (code && code.length > 0) {
            result = { 
              code: code,
              explanation: explanation || "Aucune explication fournie."
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: "Claude n'a pas pu générer un code douanier valide pour cette description.",
              explanation: explanation || "Aucune explication disponible."
            };
          }
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse JSON (Claude):', parseError);
          
          // Fallback: extraire uniquement le code
          const responseText = completion.choices[0].message.content.trim();
          const codeMatch = responseText.replace(/\D/g, '').substring(0, 8);
          
          if (codeMatch && codeMatch.length > 0) {
            result = { 
              code: codeMatch,
              explanation: "Une erreur s'est produite lors de l'analyse de l'explication. Voici la réponse brute: " + responseText
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: responseText
            };
          }
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel API pour Claude (simulé):', apiError);
        
        // Fallback en cas d'erreur API
        result = {
          code: Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8),
          explanation: "Simulation de Claude: Une erreur s'est produite lors de l'appel API. Ceci est un code généré aléatoirement à des fins de démonstration uniquement."
        };
      }
      
      // Commentaire pour l'implémentation future avec l'API Claude réelle...
    } else if (engine === 'deepseek') {
      // Utiliser Deepseek
      try {
        const completion = await deepseek.chat.completions.create({
          model: "deepseek-coder",
          messages: [{
            role: "system",
            content: `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée avec les références et l'origine des informations.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut:
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente
  6. Les références précises des documents consultés (nomenclature douanière, notes explicatives, règlements, etc.)
  7. L'origine de chaque information (ex: "Selon le Système Harmonisé 2022, chapitre X")
  8. Si possible, cite les numéros d'articles ou de pages des documents de référence

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte incluant toutes les références et sources (pas d'objet imbriqué)`
          }, {
            role: "user",
            content: `Détermine le code SH à 8 chiffres pour ce produit et explique-le en détail: ${description}`
          }],
          temperature: 0.3, // Température plus basse pour des réponses plus précises
          max_tokens: 600, // Augmentation des tokens pour des explications plus détaillées
          response_format: { type: "json_object" }
        });
        
        try {
          const parsedResponse = JSON.parse(completion.choices[0].message.content);
          
          // Extraire et nettoyer le code
          const code = parsedResponse.code ? parsedResponse.code.replace(/\D/g, '').substring(0, 8) : null;
          
          // S'assurer que l'explication est une chaîne de caractères
          let explanation = parsedResponse.explanation;
          if (explanation && typeof explanation === 'object') {
            explanation = formatExplanationObject(explanation);
          }
          
          if (code && code.length > 0) {
            result = { 
              code: code,
              explanation: explanation || "Aucune explication fournie."
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: "Deepseek n'a pas pu générer un code douanier valide pour cette description.",
              explanation: explanation || "Aucune explication disponible."
            };
          }
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse JSON (Deepseek):', parseError);
          
          // Fallback: extraire uniquement le code
          const responseText = completion.choices[0].message.content.trim();
          const codeMatch = responseText.replace(/\D/g, '').substring(0, 8);
          
          if (codeMatch && codeMatch.length > 0) {
            result = { 
              code: codeMatch,
              explanation: "Une erreur s'est produite lors de l'analyse de l'explication. Voici la réponse brute: " + responseText
            };
          } else {
            result = { 
              error: "Impossible de déterminer un code douanier valide", 
              message: responseText
            };
          }
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel API pour Deepseek:', apiError);
        
        // Fallback en cas d'erreur API
        result = {
          code: Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8),
          explanation: "Deepseek: Une erreur s'est produite lors de l'appel API. Ceci est un code généré aléatoirement à des fins de démonstration uniquement."
        };
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la recherche du code douanier:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche du code douanier',
      details: error.message
    });
  }
});

// Fonction pour convertir un objet d'explication en chaîne de caractères
function formatExplanationObject(explanationObj) {
  if (!explanationObj) return '';
  if (typeof explanationObj === 'string') return explanationObj;
  
  let formattedExplanation = '';
  
  // Parcourir toutes les propriétés de l'objet et les ajouter au texte formaté
  for (const [key, value] of Object.entries(explanationObj)) {
    // Formater la clé en titre
    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
    
    // Ajouter la clé et la valeur au texte formaté
    if (typeof value === 'object' && value !== null) {
      // Si la valeur est elle-même un objet, la formater récursivement
      formattedExplanation += `${formattedKey}:\n${formatExplanationObject(value)}\n\n`;
    } else {
      formattedExplanation += `${formattedKey}: ${value}\n\n`;
    }
  }
  
  return formattedExplanation;
}

// Stockage global pour les corrections de codes douaniers
const customsCodeCorrections = [];

// Middleware pour gérer les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route non trouvée : ${req.method} ${req.url}`
  });
});

// Endpoint temporaire pour lister les bases vectorielles
app.get('/list-vector-stores', (req, res) => {
  if (!global.vectorStores) {
    return res.json({ message: 'Aucune base vectorielle disponible', stores: [] });
  }
  
  const vectorStoresList = Object.keys(global.vectorStores).map(name => {
    const fileNameParts = name.split('_');
    const fileName = fileNameParts.slice(0, -1).join('_');
    const timestamp = parseInt(fileNameParts[fileNameParts.length - 1]);
    
    return {
      id: name,
      fileName: fileName,
      createdAt: timestamp,
      displayName: `${fileName} (${new Date(timestamp).toLocaleString()})`
    };
  });
  
  vectorStoresList.sort((a, b) => b.createdAt - a.createdAt);
  
  res.json({ 
    message: `${vectorStoresList.length} base(s) vectorielle(s) trouvée(s)`, 
    stores: vectorStoresList 
  });
});

// Endpoint temporaire pour déboguer les routes
app.get('/debug-routes', (req, res) => {
  const routes = [];
  
  // Récupérer toutes les routes Express
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Route directe
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Router monté
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
          routes.push({
            path: middleware.regexp.toString().includes('/api') ? `/api${path}` : path,
            methods
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Routes disponibles dans l\'application',
    routes
  });
});

// Cet appel à app.listen a été supprimé pour éviter le conflit de port
// Le serveur est démarré à la fin du fichier avec server.listen

// Route temporaire pour la recherche dans les documents PDF
app.post('/direct-pdf-search', async (req, res) => {
  try {
    const { collectionName, query, temperature = 0.2 } = req.body;
    
    console.log('Requête de recherche PDF reçue:');
    console.log('- Collection:', collectionName);
    console.log('- Query:', query);
    console.log('- Température:', temperature);
    
    if (!collectionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nom de la collection manquant' 
      });
    }
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Requête de recherche manquante' 
      });
    }
    
    // Vérifier si la base de données vectorielle existe
    if (!global.vectorStores || !global.vectorStores[collectionName]) {
      console.log('Bases vectorielles disponibles:', Object.keys(global.vectorStores || {}));
      return res.status(404).json({ 
        success: false, 
        error: `Base de données vectorielle "${collectionName}" non trouvée`,
        availableStores: Object.keys(global.vectorStores || {})
      });
    }
    
    // Récupérer la base de données vectorielle
    const vectorStore = global.vectorStores[collectionName];
    
    // Effectuer la recherche
    const searchResults = await vectorStore.similaritySearch(query, 5);
    
    // Formater les résultats de recherche pour une meilleure lisibilité
    const formattedResults = searchResults.map(result => {
      return {
        ...result,
        pageContent: result.pageContent
      };
    });
    
    // Convertir la température en nombre et vérifier qu'elle est dans la plage valide
    const parsedTemperature = parseFloat(temperature);
    const validTemperature = !isNaN(parsedTemperature) && 
                             parsedTemperature >= 0 && 
                             parsedTemperature <= 1 
                             ? parsedTemperature 
                             : 0.2;
    
    // Générer une réponse RAG
    const { OpenAI } = require('@langchain/openai');
    const { PromptTemplate } = require('@langchain/core/prompts');
    const { StringOutputParser } = require('@langchain/core/output_parsers');
    const { RunnableSequence } = require('@langchain/core/runnables');
    
    const llm = new OpenAI({
      modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      temperature: validTemperature,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    const prompt = PromptTemplate.fromTemplate(`
    En tant qu'expert en classification douanière, utilisez les informations suivantes pour déterminer le code douanier le plus approprié pour le produit décrit.
    
    Description du produit: {query}
    
    Contexte extrait du document:
    {context}
    
    Veuillez fournir:
    1. Le code douanier le plus approprié (8 chiffres)
    2. Une explication détaillée de votre raisonnement
    3. Les sections pertinentes du document qui ont guidé votre décision
    `);
    
    const ragChain = RunnableSequence.from([
      {
        query: (input) => input.query,
        context: (input) => {
          return input.context.map(doc => doc.pageContent).join('\n\n');
        }
      },
      prompt,
      llm,
      new StringOutputParser()
    ]);
    
    const ragResponse = await ragChain.invoke({
      query: query,
      context: formattedResults
    });
    
    // Renvoyer les résultats
    res.json({
      success: true,
      searchResults: formattedResults,
      ragResponse,
      usedTemperature: validTemperature
    });
  } catch (error) {
    console.error('Erreur lors de la recherche dans le document:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Fonction pour extraire le texte d'un PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du PDF:', error);
    throw error;
  }
}

// Fonction pour nettoyer le nom d'une matière première
function cleanProductName(designation) {
  if (!designation) return 'Matière première';
  
  // Rechercher des motifs courants pour les noms de produits alimentaires
  const foodProductRegex = /(filet mignon|entrecôte|côte|jambon|saucisse|saucisson|viande|poisson|saumon|thon)(?: de | d'| du )?(poulet|porc|boeuf|bœuf|veau|agneau|canard|dinde)(?:[^\(]*?)(?:\(|$)/i;
  
  const match = designation.match(foodProductRegex);
  if (match) {
    // Combiner le type de produit et l'animal
    let nom = match[1];
    if (match[2]) {
      nom += ' de ' + match[2];
    }
    return nom.trim();
  }
  
  // Rechercher un motif de type "code + nom du produit"
  const genericProductRegex = /[A-Z0-9]{4,6}([A-Za-z].+?)(?:\(|\d|$)/;
  const genericMatch = designation.match(genericProductRegex);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].trim();
  }
  
  // Si aucun motif ne correspond, retourner une partie de la désignation
  return designation.substring(0, 50);
}

// Fonction pour extraire les codes douaniers du texte
function extractCustomsCodes(text) {
  console.log('Extraction des codes douaniers à partir du texte...');
  const results = [];
  
  // Recherche des codes douaniers (format: 8 chiffres consécutifs ou 4 chiffres + point + 2 chiffres)
  const codeRegex = /\b\d{8}\b|\b\d{4}\.\d{2}(?:\.\d{2})?\b/g;
  const codes = text.match(codeRegex) || [];
  
  console.log('Codes douaniers trouvés:', codes);
  
  // Recherche des désignations (texte avant ou après le code)
  codes.forEach(code => {
    const index = text.indexOf(code);
    let designation = '';
    
    // Extraire environ 150 caractères avant et après le code
    const start = Math.max(0, index - 150);
    const end = Math.min(text.length, index + code.length + 150);
    designation = text.substring(start, end).trim();
    
    // Normaliser le code douanier (remplacer les points par rien pour obtenir un format standard)
    const normalizedCode = code.replace(/\./g, '');
    
    // Vérifier si le code est déjà dans les résultats pour éviter les doublons
    if (!results.some(r => r.code === normalizedCode)) {
      results.push({
        code: normalizedCode,
        designation
      });
    }
  });
  
  // Si aucun code n'est trouvé, essayer une approche plus souple
  if (results.length === 0) {
    console.log('Aucun code trouvé avec la première méthode, essai d\'une approche plus souple...');
    
    // Rechercher des motifs qui ressemblent à des codes douaniers (4 chiffres suivis de texte puis 2 ou 4 chiffres)
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Rechercher des lignes qui contiennent des chiffres qui pourraient être des codes douaniers
      if (/\d{4}.*\d{2}/.test(line)) {
        console.log('Ligne potentielle avec code douanier:', line);
        
        // Essayer d'extraire un code à 8 chiffres de cette ligne
        const potentialCodes = line.match(/\d{4}[^\d]*\d{4}|\d{4}[^\d]*\d{2}[^\d]*\d{2}/g) || [];
        
        for (const potentialCode of potentialCodes) {
          // Extraire uniquement les chiffres
          const digits = potentialCode.replace(/\D/g, '');
          
          // Si nous avons au moins 6 chiffres, considérer comme un code douanier potentiel
          if (digits.length >= 6) {
            const normalizedCode = digits.padEnd(8, '0').substring(0, 8);
            
            // Vérifier si le code est déjà dans les résultats pour éviter les doublons
            if (!results.some(r => r.code === normalizedCode)) {
              results.push({
                code: normalizedCode,
                designation: line.trim()
              });
            }
          }
        }
      }
    }
  }
  
  return results;
}

// Utiliser les routes pour l'analyse de documents PDF
app.use('/api/pdf', pdfRoutes);
app.use('/api/pdf-analysis', pdfAnalysisRoutes);
// Enregistrer la route d'analyse de documents
app.use('/api', analyseDocumentRoutes);
console.log('Enregistrement prioritaire de la route /api/analyse-document');

// S'assurer que le répertoire d'uploads existe
const directUploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(directUploadsDir)) {
  fs.mkdirSync(directUploadsDir, { recursive: true });
}

// Configurer multer pour l'upload de fichiers pour la route directe
const directStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directUploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const directUpload = multer({ storage: directStorage });

// Ajouter une route de test directement dans server.js
app.post('/api/test-analyse-document', (req, res) => {
  console.log('Route de test /api/test-analyse-document appelée');
  res.json({ message: 'Route de test fonctionnelle' });
});

// Note: Nous utilisons uniquement la route /api/analyse-document définie dans le fichier routes/analyse-document.js

// Vérification explicite que la route est bien enregistrée
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log('Route enregistrée:', r.route.path);
  } else if (r.name === 'router' && r.handle.stack) {
    r.handle.stack.forEach((layer) => {
      if (layer.route) {
        console.log('Sous-route enregistrée:', layer.route.path);
      }
    });
  }
});
console.log('Route /api/analyse-document enregistrée');

// Fonction améliorée pour extraire le texte d'un PDF en préservant la structure
async function extractTextFromPDF(pdfPath) {
  try {
    // Lire le fichier PDF
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Extraire le texte avec des options avancées
    const options = {
      // Ces options aident à préserver la structure du document
      pagerender: function(pageData) {
        // Récupérer le texte de la page
        const renderOptions = {
          normalizeWhitespace: false,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(renderOptions)
          .then(function(textContent) {
            let lastY, text = '';
            // Traiter chaque élément de texte
            for (let item of textContent.items) {
              // Détecter les changements de ligne en fonction de la position Y
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
      }
    };
    
    const pdfData = await pdf(dataBuffer, options);
    let fileContent = pdfData.text;
    
    // Nettoyage du texte extrait
    fileContent = fileContent
      .replace(/\s+/g, ' ')         // Remplacer les séquences d'espaces par un seul espace
      .replace(/\n+/g, '\n')        // Remplacer les séquences de sauts de ligne par un seul
      .replace(/\n\s+/g, '\n')      // Supprimer les espaces en début de ligne
      .replace(/\s+\n/g, '\n');     // Supprimer les espaces en fin de ligne
    
    // Ajouter des informations sur le document
    const metadata = await pdfData.info;
    const numPages = pdfData.numpages;
    
    console.log(`PDF extrait: ${numPages} pages, taille du texte: ${fileContent.length} caractères`);
    
    // Limiter la taille du contenu pour l'API OpenAI
    const maxLength = 12000; // Augmenté pour capturer plus de contenu
    if (fileContent.length > maxLength) {
      console.log(`Texte tronqué de ${fileContent.length} à ${maxLength} caractères`);
      fileContent = fileContent.substring(0, maxLength);
    }
    
    return fileContent;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du PDF:', error);
    throw new Error(`Erreur lors de l\'extraction du texte du PDF: ${error.message}`);
  }
}

// La route d'analyse de document est maintenant définie uniquement dans le fichier routes/analyse-document.js
// et importée via app.use('/api', analyseDocumentRoutes);

// Configuration de multer pour l'upload d'images directement dans server.js
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads/images');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'), false);
    }
  }
});

// Route directe pour l'analyse d'images
console.log('Enregistrement de la route directe /api/analyze-image');
app.post('/api/analyze-image', imageUpload.single('image'), async (req, res) => {
  console.log('Requête reçue pour analyser une image');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image n\'a été téléchargée' });
    }

    const imagePath = req.file.path;
    console.log('Image reçue et enregistrée à:', imagePath);
    
    // Lire l'image en tant que buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convertir le buffer en base64
    const base64Image = imageBuffer.toString('base64');
    
    // Appeler l'API ChatGPT Vision pour décrire l'image
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Décris cette image en détail. Concentre-toi sur les caractéristiques du produit qui pourraient être pertinentes pour déterminer son code douanier, comme les matériaux, la composition, l'utilisation prévue, etc." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${path.extname(req.file.originalname).substring(1)};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Supprimer le fichier après utilisation
    fs.unlinkSync(imagePath);
    
    // Extraire la description générée
    const description = response.choices[0]?.message?.content || 'Aucune description générée';
    console.log('Description générée:', description.substring(0, 100) + '...');
    
    res.json({ description });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'image:', error);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse de l\'image', 
      details: error.message 
    });
  }
});

// Route de test pour vérifier l'accès à l'API d'analyse d'images
app.get('/api/test-image-analysis', (req, res) => {
  console.log('Route de test d\'analyse d\'images appelée');
  res.json({ message: 'API d\'analyse d\'images accessible' });
});

// Démarrer le serveur sur toutes les interfaces réseau (0.0.0.0)
const PORT = process.env.PORT || 5004;
const HOST = process.env.HOST || '0.0.0.0';

// Détecter l'environnement d'exécution
const isProduction = process.env.NODE_ENV === 'production';
const isWindows = process.platform === 'win32';

// Libérer le port si nécessaire (uniquement sur Linux en production)
if (isProduction && !isWindows) {
  try {
    const { execSync } = require('child_process');
    console.log(`Vérification si le port ${PORT} est déjà utilisé...`);
    const portCheck = execSync(`lsof -i :${PORT} -t`).toString().trim();
    
    if (portCheck) {
      console.log(`Port ${PORT} utilisé par le(s) processus ${portCheck}. Tentative de libération...`);
      execSync(`kill -9 ${portCheck}`);
      console.log(`Port ${PORT} libéré avec succès.`);
    } else {
      console.log(`Port ${PORT} libre.`);
    }
  } catch (error) {
    // Si la commande lsof échoue, cela signifie généralement qu'aucun processus n'utilise le port
    console.log(`Aucun processus n'utilise le port ${PORT} ou erreur lors de la vérification.`);
  }
}

// Créer un serveur HTTP explicite pour pouvoir définir les options de socket
const http = require('http');
const server = http.createServer(app);

// Forcer la réutilisation de l'adresse socket même si elle est en état TIME_WAIT
server.on('listening', () => {
  // La méthode setNoDelay n'est pas disponible sur l'objet serveur HTTP
  // mais sur les connexions socket individuelles
  console.log(`Serveur en écoute sur ${HOST}:${PORT}`);
});

// Configurer le serveur pour réutiliser l'adresse immédiatement
server.on('error', (e) => {
  console.error('Erreur du serveur:', e.message);
  if (e.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Tentative de libération forcée...`);
    
    // Tenter de se connecter à la base de données malgré l'erreur de port
    try {
      // Vérifier la connexion à la base de données
      pool.connect().then(client => {
        console.log('Connexion à la base de données réussie');
        client.release();
      }).catch(err => {
        console.error('Erreur de connexion à la base de données:', err.message);
      });
    } catch (dbError) {
      console.error('Erreur lors de la tentative de connexion à la base de données:', dbError.message);
    }
  }
});

// Activer la réutilisation d'adresse
server.listen(PORT, HOST, () => {
  console.log(`Serveur démarré sur ${HOST}:${PORT}`);
  if (isProduction) {
    console.log(`API accessible à l'adresse: http://app1.communify.solutions:${PORT}`);
  } else {
    console.log(`API accessible à l'adresse: http://localhost:${PORT}`);
  }
});
