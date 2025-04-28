const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { addCorrection, generateEnhancedPrompt, resetAllCorrections, getAllCorrections, deleteCorrection } = require('../utils/correctionUtils');

// Initialisation de l'API OpenAI
let openai;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'votre_cle_api_openai_ici') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn('⚠️ Aucune clé API OpenAI valide n\'a été fournie. Les fonctionnalités utilisant OpenAI ne seront pas disponibles.');
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de l\'API OpenAI:', error);
}

// Initialisation de l'API Deepseek avec la bonne URL et modèle
const deepseek = new OpenAI({
  apiKey: 'sk-21dd7886116f47bfa39a1241192ec6ea',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-coder'
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

// Endpoint pour rechercher un code douanier avec Engine 1, Engine 2 ou Engine 3
router.post('/query-customs-code', async (req, res) => {
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
      if (!openai) {
        return res.status(503).json({ 
          error: 'Service OpenAI non disponible', 
          message: 'Veuillez configurer une clé API OpenAI valide dans le fichier .env',
          code: 'API_KEY_MISSING'
        });
      }
      
      if (includeExplanation) {
        // Prompt de base pour GPT
        let basePrompt = `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut:
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte (pas d'objet imbriqué)`;

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
              message: "GPT n'a pas pu générer un code douanier valide pour cette description.",
              explanation: explanation || "Aucune explication disponible."
            };
          }
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse JSON (GPT):', parseError);
          
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
        // Demander uniquement le code (sans explication)
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.

FORMAT DE RÉPONSE:
Réponds uniquement avec le code SH à 8 chiffres, sans aucun texte supplémentaire.`
          }, {
            role: "user",
            content: `Détermine le code SH à 8 chiffres pour ce produit: ${description}`
          }],
          temperature: 0.3,
          max_tokens: 20
        });
        
        // Extraire et nettoyer le code
        const responseText = completion.choices[0].message.content.trim();
        const code = responseText.replace(/\D/g, '').substring(0, 8);
        
        if (code && code.length > 0) {
          result = { code: code };
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
        // Prompt de base pour Claude
        let basePrompt = `Tu es Claude, un assistant IA expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut EXACTEMENT les mêmes éléments que ci-dessous:
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte (pas d'objet imbriqué)`;

        // Améliorer le prompt avec des exemples de corrections
        const enhancedPrompt = generateEnhancedPrompt(basePrompt, description, 'claude');

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: enhancedPrompt
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
    } else if (engine === 'deepseek') {
      // Utiliser Deepseek
      try {
        // Prompt de base pour Deepseek
        let basePrompt = `Tu es un expert en classification douanière des marchandises selon le Système Harmonisé (SH).
            
TÂCHE:
Détermine le code SH (Système Harmonisé) à 8 chiffres pour le produit décrit par l'utilisateur et fournis une explication détaillée.

RÈGLES IMPORTANTES:
- Le code doit être composé uniquement de chiffres (0-9), sans espaces, points ou autres caractères.
- Si tu n'es pas sûr du code exact, fournis ta meilleure estimation basée sur les règles de classification douanière.
- Fournis une explication détaillée qui inclut:
  1. La catégorie principale du produit
  2. Les sous-catégories pertinentes
  3. Les règles de classification qui s'appliquent
  4. La signification des différentes parties du code (chapitres, positions, etc.)
  5. Toute note explicative ou règle d'interprétation pertinente

FORMAT DE RÉPONSE:
Réponds au format JSON avec deux champs:
1. "code": le code SH à 8 chiffres (uniquement des chiffres)
2. "explanation": l'explication détaillée du code sous forme de texte (pas d'objet imbriqué)`;

        // Améliorer le prompt avec des exemples de corrections
        const enhancedPrompt = generateEnhancedPrompt(basePrompt, description, 'deepseek');

        const completion = await deepseek.chat.completions.create({
          model: "deepseek-coder",
          messages: [{
            role: "system",
            content: enhancedPrompt
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
          explanation: "Simulation de Deepseek: Une erreur s'est produite lors de l'appel API. Ceci est un code généré aléatoirement à des fins de démonstration uniquement."
        };
      }
    }
    
    // Renvoyer le résultat
    res.json(result);
    
  } catch (error) {
    console.error('Erreur lors de la recherche du code douanier:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la recherche du code douanier',
      details: error.message
    });
  }
});

// Endpoint pour soumettre une correction de code douanier
router.post('/submit-correction', async (req, res) => {
  try {
    const { description, correctedCode, originalResults } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'La description du produit est requise' });
    }
    
    if (!correctedCode || correctedCode.length !== 8 || !/^\d+$/.test(correctedCode)) {
      return res.status(400).json({ error: 'Le code corrigé doit contenir exactement 8 chiffres' });
    }
    
    // Stocker la correction
    addCorrection(description, correctedCode, originalResults);
    
    // Répondre avec succès
    res.json({ 
      success: true, 
      message: 'Correction soumise avec succès. Les moteurs de recherche tiendront compte de cette correction pour les recherches futures similaires.' 
    });
    
  } catch (error) {
    console.error('Erreur lors du traitement de la correction:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors du traitement de la correction',
      details: error.message
    });
  }
});

// Endpoint pour réinitialiser toutes les corrections
router.post('/reset-corrections', async (req, res) => {
  try {
    // Réinitialiser toutes les corrections
    const count = resetAllCorrections();
    
    // Répondre avec succès
    res.json({ 
      success: true, 
      message: `${count} corrections ont été supprimées. Les moteurs de recherche n'utiliseront plus ces corrections pour améliorer les résultats.` 
    });
    
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des corrections:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la réinitialisation des corrections',
      details: error.message
    });
  }
});

// Endpoint pour récupérer toutes les corrections
router.get('/corrections', async (req, res) => {
  try {
    // Récupérer toutes les corrections
    const corrections = getAllCorrections();
    
    // Trier par ordre alphabétique des descriptions
    corrections.sort((a, b) => a.description.localeCompare(b.description, 'fr', { sensitivity: 'base' }));
    
    // Répondre avec les corrections
    res.json({ 
      success: true, 
      corrections
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des corrections:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la récupération des corrections',
      details: error.message
    });
  }
});

// Endpoint pour supprimer une correction spécifique
router.delete('/correction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID de correction non spécifié' });
    }
    
    // Supprimer la correction
    const deleted = deleteCorrection(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Correction non trouvée' });
    }
    
    // Répondre avec succès
    res.json({ 
      success: true, 
      message: 'Correction supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la correction:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la suppression de la correction',
      details: error.message
    });
  }
});

module.exports = router;
