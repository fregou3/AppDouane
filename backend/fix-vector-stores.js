/**
 * Script pour corriger les problèmes de recherche dans les bases vectorielles
 * 
 * Ce script ajoute directement les routes nécessaires au serveur Express en cours d'exécution
 * sans avoir besoin de redémarrer le serveur.
 */

// Importer les dépendances nécessaires
const express = require('express');
const { OpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Fonction pour formater le texte (similaire à celle dans pdf-analysis.js)
function formatText(text, highlightCodes = false) {
  if (!text) return '';
  
  // Nettoyage de base
  let formattedText = text
    .replace(/\n{3,}/g, '\n\n')                // Réduire les sauts de ligne multiples
    .replace(/[.]{4,}/g, '...')                // Réduire les points multiples
    .replace(/[-]{4,}/g, '---')                // Réduire les tirets multiples
    .replace(/\s{2,}/g, ' ')                   // Réduire les espaces multiples
    .trim();
  
  // Mise en évidence des codes douaniers (8 chiffres) si demandé
  if (highlightCodes) {
    formattedText = formattedText.replace(/\b\d{8}\b/g, match => 
      `<span style="font-weight: bold; background-color: #e6f7ff; padding: 0 3px; border-radius: 3px;">${match}</span>`
    );
  }
  
  return formattedText;
}

// Fonction principale
async function fixVectorStores() {
  try {
    // Vérifier si le serveur Express est disponible
    if (!global.app) {
      console.error('Erreur: Le serveur Express n\'est pas disponible globalement.');
      console.log('Ce script doit être exécuté dans le contexte du serveur en cours d\'exécution.');
      console.log('Ajoutez le code suivant au début de server.js:');
      console.log('global.app = app;');
      return;
    }
    
    const app = global.app;
    
    // Ajouter la route pour lister les bases vectorielles
    app.get('/list-vector-stores', (req, res) => {
      console.log('Requête reçue pour lister les bases vectorielles');
      
      if (!global.vectorStores) {
        return res.json({ 
          message: 'Aucune base vectorielle disponible', 
          stores: [] 
        });
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
    
    // Ajouter la route pour la recherche dans les documents PDF
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
            pageContent: formatText(result.pageContent, true)
          };
        });
        
        // Convertir la température en nombre et vérifier qu'elle est dans la plage valide
        const parsedTemperature = parseFloat(temperature);
        const validTemperature = !isNaN(parsedTemperature) && 
                                parsedTemperature >= 0 && 
                                parsedTemperature <= 1 
                                ? parsedTemperature 
                                : 0.2;
        
        // Vérifier si la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
          return res.status(503).json({
            success: false,
            error: "Clé API OpenAI non configurée. Veuillez configurer la clé API dans le fichier .env du backend.",
            searchResults: formattedResults
          });
        }
        
        // Générer une réponse RAG
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
    
    console.log('✅ Routes temporaires ajoutées avec succès:');
    console.log('- GET /list-vector-stores');
    console.log('- POST /direct-pdf-search');
    console.log('\nLes routes sont maintenant disponibles pour utilisation.');
    
  } catch (error) {
    console.error('Erreur lors de la correction des bases vectorielles:', error);
  }
}

// Exporter la fonction pour une utilisation externe
module.exports = { fixVectorStores };

// Si le script est exécuté directement, appeler la fonction principale
if (require.main === module) {
  fixVectorStores();
}
