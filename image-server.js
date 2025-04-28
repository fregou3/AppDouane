// Serveur dédié à l'analyse d'images
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Initialisation de l'API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();

// Configuration CORS
app.use(cors({
  origin: true, // Permet toutes les origines en développement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de multer pour le stockage des images
const storage = multer.diskStorage({
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

const upload = multer({ 
  storage: storage,
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

// Route de test simple
app.get('/', (req, res) => {
  res.json({ message: 'Serveur d\'analyse d\'images fonctionnel' });
});

// Route pour l'analyse d'images
app.post('/analyze-image', upload.single('image'), async (req, res) => {
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
      model: "gpt-4o",
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

// Démarrer le serveur sur un port différent
const PORT = 5006;
app.listen(PORT, () => {
  console.log(`Serveur d'analyse d'images démarré sur le port ${PORT}`);
  console.log(`API accessible à http://localhost:${PORT}/analyze-image`);
});
