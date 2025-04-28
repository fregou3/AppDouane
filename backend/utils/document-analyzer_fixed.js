/**
 * Module d'analyse de documents PDF pour l'extraction d'informations sur les matières premières
 * Utilise l'API OpenAI (GPT-3.5-turbo) pour analyser le contenu des documents
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

// Initialiser OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration de multer pour le stockage des fichiers
const configureDocumentAnalyzer = (uploadsDir) => {
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
      const options = {
        pagerender: function (pageData) {
          let renderOptions = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
          };
          return pageData.getTextContent(renderOptions);
        }
      };
      const data = await pdfParse(dataBuffer, options);
      let cleanedText = data.text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      console.log('Texte extrait (100 premiers caractères): ', cleanedText.substring(0, 100));
      return cleanedText;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte du PDF:', error);
      throw error;
    }
  }

  // Fonction d'analyse de document avec OpenAI
  async function analyzeDocumentWithOpenAI(fileContent) {
    console.log('Appel à l\'API OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse de documents commerciaux, spécialisé dans l'extraction d'informations à partir de factures et de documents douaniers.

TÂCHE:
Extrais toutes les informations sur les matières premières mentionnées dans le document fourni. Analyse attentivement les tableaux, les listes d'articles et les descriptions de produits.

INFORMATIONS À EXTRAIRE POUR CHAQUE MATIÈRE PREMIÈRE:
1. nom: Le nom complet du produit ou de la matière première.
2. fournisseur: Le nom de l'entreprise qui fournit le produit.
3. pays_origine: Le pays d'origine du produit.
4. valeur: Le prix unitaire ou total en euros.
5. code_douanier: Le code tarifaire douanier.

RÈGLES:
- Le code douanier doit être uniquement numérique, 8 chiffres, sans espaces ni points.
- Utilise null si une information est absente.
- Retourne un tableau JSON avec les champs ci-dessus.`
        },
        {
          role: "user",
          content: `Voici un document commercial à analyser. Extrais toutes les informations sur les matières premières mentionnées selon les instructions. Assure-toi que le code douanier est uniquement numérique, limité à 8 chiffres maximum, sans points ni espaces:\n\n${fileContent}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    console.log('Réponse reçue de l\'API OpenAI');
    return completion;
  }

  // Fonction pour configurer la route d'analyse de document
  const setupDocumentAnalysisRoute = (router) => {
    router.post('/analyse-document', upload.single('file'), async (req, res) => {
      try {
        console.log('Route /api/analyse-document appelée avec ChatGPT');
        console.log('API Key définie:', !!process.env.OPENAI_API_KEY);

        if (!req.file) {
          return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
        }

        if (req.file.mimetype !== 'application/pdf') {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Le fichier doit être un PDF' });
        }

        const pdfPath = req.file.path;
        console.log('Chemin du fichier:', pdfPath);

        const fileContent = await extractTextFromPDF(pdfPath);
        console.log('Contenu extrait du PDF, longueur:', fileContent.length);
        console.log('Extrait du contenu:', fileContent.substring(0, 200));

        const completion = await analyzeDocumentWithOpenAI(fileContent);
        fs.unlinkSync(pdfPath);

        let rawContent = completion.choices[0].message.content.trim();

        if (rawContent.startsWith('```json')) {
          rawContent = rawContent.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (rawContent.startsWith('```')) {
          rawContent = rawContent.replace(/^```/, '').replace(/```$/, '').trim();
        }

        rawContent = rawContent.replace(/\\n/g, '').replace(/\\r/g, '');

        let analysisResults;
        try {
          analysisResults = JSON.parse(rawContent);
          console.log('Structure de la réponse parsée:', JSON.stringify(analysisResults, null, 2));

          if (analysisResults.matieres_premieres) {
            analysisResults = analysisResults.matieres_premieres;
          } else if (analysisResults.results) {
            analysisResults = analysisResults.results;
          } else if (!Array.isArray(analysisResults)) {
            analysisResults = [analysisResults];
          }

          if (
            Array.isArray(analysisResults) &&
            (analysisResults.length === 0 ||
              (analysisResults.length === 1 && Object.keys(analysisResults[0]).length === 0))
          ) {
            console.error('Aucune matière première détectée dans le document');
            return res.status(404).json({
              error: 'Aucune matière première détectée dans le document',
              rawContent
            });
          }

          res.json(analysisResults);

        } catch (parseError) {
          console.error('Erreur de parsing JSON:', parseError);
          console.error('Contenu problématique:', rawContent);
          return res.status(500).json({
            error: 'Erreur lors du parsing JSON',
            details: parseError.message,
            rawContent
          });
        }

      } catch (error) {
        console.error('Erreur lors de l\'analyse du document:', error);
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  };

  return {
    extractTextFromPDF,
    analyzeDocumentWithOpenAI,
    setupDocumentAnalysisRoute
  };
};

module.exports = configureDocumentAnalyzer;
