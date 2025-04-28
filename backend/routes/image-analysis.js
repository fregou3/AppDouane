const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialisation de l'API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration de multer pour le stockage temporaire des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/images');
    
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

// Ajouter un log pour débugger
console.log('Route image-analysis.js chargée');

// Route de test pour vérifier que le routeur fonctionne
router.get('/test-image-route', (req, res) => {
  console.log('Test de la route d\'analyse d\'images');
  res.json({ message: 'Route d\'analyse d\'images fonctionnelle' });
});

// Endpoint pour analyser une image avec ChatGPT
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  console.log('Requête reçue pour analyser une image');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image n\'a été téléchargée' });
    }

    const imagePath = req.file.path;
    
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

// Afficher les routes enregistrées
console.log('Routes enregistrées dans image-analysis.js:');
console.log(router.stack.map(r => r.route?.path).filter(Boolean));

module.exports = router;
