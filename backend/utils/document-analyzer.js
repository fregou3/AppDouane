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

  // Fonction améliorée pour extraire le texte d'un fichier PDF
  async function extractTextFromPDF(pdfPath) {
    try {
      console.log('Extraction du texte du PDF...');
      const dataBuffer = fs.readFileSync(pdfPath);
      
      // Options améliorées pour l'extraction du texte
      const options = {
        // Préserver la structure du document
        pagerender: function(pageData) {
          let renderOptions = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
          };
          return pageData.getTextContent(renderOptions)
            .then(function(textContent) {
              // Préserver la structure des tableaux et des colonnes
              let lastY, text = '';
              for (let item of textContent.items) {
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
      
      const data = await pdfParse(dataBuffer, options);
      
      // Nettoyer le texte extrait tout en préservant la structure
      let cleanedText = data.text
        .replace(/\s{3,}/g, ' ')     // Remplacer les espaces multiples (3+) par un seul espace
        .replace(/\n{3,}/g, '\n\n')  // Remplacer les sauts de ligne multiples (3+) par deux sauts
        .trim();                     // Supprimer les espaces au début et à la fin
      
      // Afficher un aperçu du texte extrait
      console.log('Texte extrait (100 premiers caractères): ', cleanedText.substring(0, 100));
      console.log('Nombre total de caractères extraits: ', cleanedText.length);
      
      // Enregistrer le texte extrait dans un fichier temporaire pour débogage
      const debugFilePath = path.join(path.dirname(pdfPath), 'extracted_text_debug.txt');
      fs.writeFileSync(debugFilePath, cleanedText);
      console.log('Texte extrait enregistré dans:', debugFilePath);
      
      return cleanedText;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte du PDF:', error);
      throw error;
    }
  }

  // Fonction d'analyse de document avec OpenAI
  async function analyzeDocumentWithOpenAI(fileContent) {
    console.log('Appel à l\'API OpenAI...');
    
    // Limiter la taille du contenu si nécessaire pour éviter de dépasser les limites de l'API
    const maxContentLength = 15000; // Environ 4000 tokens
    let truncatedContent = fileContent;
    if (fileContent.length > maxContentLength) {
      console.log(`Le contenu est trop long (${fileContent.length} caractères), troncature à ${maxContentLength} caractères`);
      truncatedContent = fileContent.substring(0, maxContentLength) + 
        "\n\n[CONTENU TRONQUÉ - Le document original est plus long]";
    }
    
    // Prompt amélioré pour l'API OpenAI
    const systemPrompt = `Tu es un expert en analyse de documents commerciaux et douaniers, spécialisé dans l'extraction d'informations précises à partir de factures, bons de livraison et documents d'importation.

TÂCHE PRINCIPALE:
Analyse méticuleusement le document fourni pour en extraire les informations sur les matières premières. Concentre-toi particulièrement sur les tableaux, les listes d'articles, et les sections décrivant les produits.

INFORMATIONS À EXTRAIRE POUR CHAQUE MATIÈRE PREMIÈRE:
1. nom: Le nom exact et complet du produit ou de la matière première (OBLIGATOIRE)
2. fournisseur: Le nom officiel de l'entreprise qui fournit le produit (OBLIGATOIRE)
3. pays_origine: Le pays de fabrication ou d'origine du produit (OBLIGATOIRE)
4. valeur: Le prix unitaire ou total, uniquement le nombre sans devise (OBLIGATOIRE)
5. code_douanier: Le code tarifaire douanier à 8 chiffres maximum (OBLIGATOIRE si présent)

GUIDE DÉTAILLÉ POUR CHAQUE CHAMP:
- nom: Extrait le nom commercial exact du produit, incluant toute référence ou description technique pertinente.
- fournisseur: Identifie l'entreprise émettrice du document ou le vendeur spécifique. Cherche dans l'en-tête du document.
- pays_origine: Localise toute mention de "Made in", "Country of Origin", "Origine", "Provenance", etc.
- valeur: Identifie le prix TOTAL HT de préférence (pas le prix unitaire). Format: nombre uniquement (ex: 25.30, pas "25,30 €").
- code_douanier: Recherche un code numérique à 6-8 chiffres, souvent précédé de "HS Code", "Code SH", "NC", "TARIC".

INSTRUCTIONS CRITIQUES:
- Examine ATTENTIVEMENT l'intégralité du document, y compris les en-têtes, pieds de page, et annotations.
- Le code douanier doit être UNIQUEMENT NUMÉRIQUE, sans points, espaces ou autres caractères.
- Si une information est introuvable, utilise null (jamais de champ vide ou manquant).
- Si tu identifies plusieurs matières premières, inclus-les TOUTES dans ta réponse.
- Analyse les tableaux avec une attention particulière - c'est souvent là que se trouvent les informations clés.

FORMAT DE RÉPONSE OBLIGATOIRE:
Retourne un tableau JSON où chaque élément représente une matière première distincte avec toutes les propriétés demandées.
Exemple: [{"nom":"Sucre cristallisé","fournisseur":"Cristal Union","pays_origine":"France","valeur":"1.25","code_douanier":"17019910"}]`;

    const userPrompt = `Voici un document commercial à analyser. Extrais toutes les informations sur les matières premières mentionnées selon les instructions précises que je t'ai données.

Pour chaque matière première identifiée, assure-toi d'extraire:
- Le nom exact
- Le fournisseur
- Le pays d'origine
- La valeur TOTALE (pas unitaire) en format nombre uniquement
- Le code douanier (format numérique uniquement, 8 chiffres max)

IMPORTANT: Pour la valeur, prends TOUJOURS le prix TOTAL de la commande/facture, PAS le prix unitaire

Voici le contenu du document:

${truncatedContent}`;

    // Appel à l'API OpenAI avec le prompt amélioré
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // Version plus récente avec meilleure compréhension des tableaux
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Réduit pour plus de précision
      max_tokens: 2500, // Augmenté pour les documents plus complexes
      response_format: { type: "json_object" }
    });
    
    console.log('Réponse reçue de l\'API OpenAI');
    return completion;
  }

  // Cette fonction n'est plus utilisée car la route est définie dans routes/analyse-document.js
  // Elle est conservée ici pour référence
  const setupDocumentAnalysisRoute = (router) => {
    console.log('ATTENTION: Cette fonction setupDocumentAnalysisRoute n\'est plus utilisée');
    return router;
  };

  // Fonction principale d'analyse de document
  async function analyzeDocument(pdfPath) {
    console.log('=== DÉBUT ANALYZE_DOCUMENT ===');
    console.log('Analyse du document:', pdfPath);
    console.log('Vérification de la clé API OpenAI:', process.env.OPENAI_API_KEY ? 'Clé présente (premiers caractères: ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)' : 'Clé absente');
    
    // Vérifier que le chemin du fichier est valide
    if (!pdfPath) {
      console.error('Erreur: Chemin du fichier PDF non spécifié');
      return { error: 'Chemin du fichier PDF non spécifié' };
    }
    
    console.log('Type de pdfPath:', typeof pdfPath);
    console.log('Contenu de pdfPath:', pdfPath);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Erreur: Le fichier ${pdfPath} n'existe pas`);
      return { error: `Le fichier ${pdfPath} n'existe pas` };
    }
    
    try {
      // Vérifier la taille du fichier
      const fileStats = fs.statSync(pdfPath);
      console.log('Taille du fichier:', fileStats.size, 'octets');
      
      if (fileStats.size === 0) {
        console.error('Erreur: Le fichier est vide');
        return { error: 'Le fichier PDF est vide' };
      }
      
      // Extraire le contenu du PDF
      console.log('Extraction du texte du PDF...');
      let fileContent;
      try {
        fileContent = await extractTextFromPDF(pdfPath);
        console.log('Contenu extrait du PDF, longueur:', fileContent.length);
        console.log('Extrait du contenu (100 premiers caractères):', fileContent.substring(0, 100));
        
        if (!fileContent || fileContent.length === 0) {
          console.error('Erreur: Aucun texte extrait du PDF');
          return { error: 'Aucun texte n\'a pu être extrait du document PDF' };
        }
      } catch (extractError) {
        console.error('Erreur lors de l\'extraction du texte du PDF:', extractError);
        return { error: 'Erreur lors de l\'extraction du texte du PDF: ' + extractError.message };
      }
      
      // Analyser le contenu avec ChatGPT
      console.log('Appel à l\'API OpenAI pour analyse...');
      console.log('Longueur du contenu envoyé à OpenAI:', fileContent.length);
      console.log('Début du contenu envoyé à OpenAI:', fileContent.substring(0, 200));
      
      let completion;
      try {
        completion = await analyzeDocumentWithOpenAI(fileContent);
        console.log('Réponse reçue de l\'API OpenAI');
        
        // Vérifier que la réponse est valide
        if (!completion) {
          console.error('Erreur: Réponse OpenAI vide ou non définie');
          return { error: 'Réponse vide de l\'API OpenAI' };
        }
        
        console.log('Structure de la réponse OpenAI:', Object.keys(completion).join(', '));
        
        if (!completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
          console.error('Erreur: Réponse OpenAI sans choix valides');
          return { error: 'Réponse invalide de l\'API OpenAI (aucun choix)' };
        }
        
        console.log('Nombre de choix dans la réponse:', completion.choices.length);
        console.log('Structure du premier choix:', Object.keys(completion.choices[0]).join(', '));
        
        if (!completion.choices[0].message || !completion.choices[0].message.content) {
          console.error('Erreur: Contenu de la réponse OpenAI manquant');
          return { error: 'Contenu manquant dans la réponse de l\'API OpenAI' };
        }
        
        const responseContent = completion.choices[0].message.content;
        console.log('Contenu de la réponse OpenAI (100 premiers caractères):', responseContent.substring(0, 100));
        
        // Parser la réponse JSON
        let analysisResults;
        try {
          analysisResults = JSON.parse(responseContent);
          console.log('Réponse JSON parsée avec succès');
          console.log('Structure de la réponse parsée:', typeof analysisResults, Array.isArray(analysisResults) ? 'tableau' : 'objet');
          console.log('Contenu de la réponse:', JSON.stringify(analysisResults, null, 2).substring(0, 500) + '...');
          
          // Gérer différentes structures possibles de la réponse
          if (analysisResults.matieres_premieres) {
            console.log('Structure détectée: { matieres_premieres: [...] }');
            analysisResults = analysisResults.matieres_premieres;
          } else if (analysisResults.results) {
            console.log('Structure détectée: { results: [...] }');
            analysisResults = analysisResults.results;
          } else if (analysisResults.data) {
            console.log('Structure détectée: { data: [...] }');
            analysisResults = analysisResults.data;
          } else if (!Array.isArray(analysisResults)) {
            console.log('Structure détectée: objet simple, conversion en tableau');
            analysisResults = [analysisResults];
          } else {
            console.log('Structure détectée: tableau');
          }
          
          // Vérifier si le tableau est vide ou contient des objets vides
          if (!Array.isArray(analysisResults)) {
            console.error('Erreur: Résultats non convertibles en tableau');
            return { 
              error: 'Format de réponse invalide',
              rawContent: responseContent
            };
          }
          
          if (analysisResults.length === 0) {
            console.error('Erreur: Aucune matière première détectée (tableau vide)');
            return { 
              error: 'Aucune matière première n\'a été détectée dans le document',
              rawContent: responseContent
            };
          }
          
          if (analysisResults.length === 1 && Object.keys(analysisResults[0]).length === 0) {
            console.error('Erreur: Aucune matière première détectée (objet vide)');
            return { 
              error: 'Aucune matière première n\'a été détectée dans le document',
              rawContent: responseContent
            };
          }
          
          // Normaliser les résultats pour s'assurer qu'ils sont dans un format cohérent
          const normalizedResults = analysisResults.map(item => {
            // S'assurer que tous les champs requis sont présents et correctement formatés
            return {
              nom: item.nom || '',
              fournisseur: item.fournisseur || '',
              pays_origine: item.pays_origine || '',
              valeur: item.valeur ? item.valeur.toString().replace(',', '.') : '0',
              code_douanier: item.code_douanier ? item.code_douanier.toString().replace(/[^0-9]/g, '') : ''
            };
          });
          
          // Afficher les résultats finaux
          console.log('Nombre de matières premières détectées:', normalizedResults.length);
          console.log('Première matière première normalisée:', JSON.stringify(normalizedResults[0], null, 2));
          console.log('=== FIN ANALYZE_DOCUMENT ===');
          
          return normalizedResults;
          
        } catch (parseError) {
          console.error('Erreur lors du parsing JSON:', parseError.message);
          console.error('Contenu qui a causé l\'erreur:', responseContent);
          return { 
            error: 'Erreur lors du parsing des résultats d\'analyse: ' + parseError.message,
            rawContent: responseContent
          };
        }
        
      } catch (openaiError) {
        console.error('Erreur lors de l\'appel à l\'API OpenAI:', openaiError.message);
        if (openaiError.response) {
          console.error('Détails de l\'erreur OpenAI:', JSON.stringify(openaiError.response.data, null, 2));
        }
        return { error: 'Erreur lors de l\'appel à l\'API OpenAI: ' + openaiError.message };
      }
      
    } catch (error) {
      console.error('Erreur générale lors de l\'analyse du document:', error.message);
      console.error('Stack trace:', error.stack);
      return { error: 'Erreur lors de l\'analyse du document: ' + error.message };
    }
  }

  return {
    analyzeDocument
  };
};

// Initialiser le module avec le répertoire par défaut pour les uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const analyzer = configureDocumentAnalyzer(uploadsDir);

// Exporter les fonctions du module
module.exports = analyzer;
