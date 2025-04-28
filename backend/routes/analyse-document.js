const express = require('express');
const router = express.Router();
console.log('Module analyse-document.js chargé');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

// Importer le module document-analyzer
const { analyzeDocument } = require('../utils/document-analyzer');

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration de multer pour le stockage des fichiers
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Fonction pour extraire le texte d'un fichier PDF
async function extractTextFromPDF(pdfPath) {
  try {
    console.log('Extraction du texte du PDF...');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Options pour l'extraction du texte
    const options = {
      // Activer la récupération de la structure du document
      pagerender: function(pageData) {
        let renderOptions = {
          normalizeWhitespace: false,
          disableCombineTextItems: false
        };
        return pageData.getTextContent(renderOptions);
      }
    };
    
    const data = await pdfParse(dataBuffer, options);
    
    // Nettoyer le texte extrait (supprimer les espaces multiples, etc.)
    let cleanedText = data.text
      .replace(/\s+/g, ' ')  // Remplacer les espaces multiples par un seul espace
      .replace(/\n+/g, '\n') // Remplacer les sauts de ligne multiples par un seul
      .trim();                // Supprimer les espaces au début et à la fin
    
    // Afficher un aperçu du texte extrait
    console.log('Texte extrait (100 premiers caractères): ', cleanedText.substring(0, 100));
    
    return cleanedText;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du PDF:', error);
    throw error;
  }
}

// Route pour l'analyse de documents (sans 's')
console.log('Enregistrement de la route /api/analyse-document');
router.post('/analyse-document', upload.single('file'), async (req, res) => {
  console.log('==================================================');
  console.log('ROUTE /api/analyse-document APPELÉE - ' + new Date().toISOString());
  try {
    console.log('Route /api/analyse-document appelée avec le module document-analyzer');
    console.log('API Key définie:', !!process.env.OPENAI_API_KEY);
    console.log('Headers de la requête:', JSON.stringify(req.headers));
    console.log('Fichier reçu:', req.file ? req.file.originalname : 'Aucun fichier');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }

    // Vérifier que le fichier est un PDF
    if (req.file.mimetype !== 'application/pdf') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Le fichier doit être un PDF' });
    }

    const pdfPath = req.file.path;
    console.log('Chemin du fichier:', pdfPath);
    
    // Utiliser le module document-analyzer pour analyser le document
    console.log('Appel au module document-analyzer...');
    console.log('OPENAI_API_KEY définie:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY premiers caractères:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'non définie');
    try {
      console.log('Avant appel à analyzeDocument - pdfPath:', pdfPath);
      console.log('Le fichier existe:', fs.existsSync(pdfPath));
      console.log('Taille du fichier:', fs.statSync(pdfPath).size);
      
      const results = await analyzeDocument(pdfPath);
      console.log('Après appel à analyzeDocument');
      console.log('Résultats de l\'analyse:', JSON.stringify(results, null, 2));
      
      // Renvoyer les résultats directement
      return res.json(results);
    } catch (analyzeError) {
      console.error('Erreur lors de l\'analyse du document:', analyzeError);
      console.error('Stack trace:', analyzeError.stack);
      return res.status(500).json({ error: 'Erreur lors de l\'analyse du document', details: analyzeError.message });
    }
  } catch (error) {
    console.error('Erreur générale lors de l\'analyse du document:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'analyse du document', details: error.message });
  }
});

// Note: La route /api/analyse-documents (avec un 's') a été supprimée pour éviter les confusions.
// Nous utilisons uniquement la route /api/analyse-document (sans 's').

module.exports = router;
