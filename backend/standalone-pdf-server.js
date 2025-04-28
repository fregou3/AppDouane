/**
 * Serveur autonome pour tester la fonctionnalité de recherche dans les documents PDF
 * Ce serveur s'exécute sur le port 5005 pour éviter les conflits avec le serveur principal
 */

// Charger le polyfill pour ReadableStream
require('./polyfill');

// Importer les dépendances nécessaires
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI, ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { OpenAIEmbeddings } = require('@langchain/openai');
require('dotenv').config();

// Créer une application Express
const app = express();
const PORT = 5005;
const HOST = process.env.HOST || '0.0.0.0';

// Configuration CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variable globale pour stocker les bases vectorielles
global.vectorStores = {};

// Fonction pour formater le texte
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

// Charger les bases vectorielles existantes
function loadExistingVectorStores() {
  try {
    const vectorStoresDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(vectorStoresDir)) {
      console.log('Répertoire uploads non trouvé, création...');
      fs.mkdirSync(vectorStoresDir, { recursive: true });
      return;
    }
    
    // Lire le contenu du répertoire uploads
    const files = fs.readdirSync(vectorStoresDir);
    
    // Filtrer les fichiers JSON qui pourraient contenir des bases vectorielles
    const vectorStoreFiles = files.filter(file => 
      file.endsWith('.json')
      // Accepter tous les fichiers JSON, car ils sont créés par notre fonction saveVectorStoreToFile
    );
    
    console.log(`${vectorStoreFiles.length} fichiers de bases vectorielles trouvés.`);
    
    // Charger chaque base vectorielle
    vectorStoreFiles.forEach(async file => {
      try {
        const filePath = path.join(vectorStoresDir, file);
        console.log(`Chargement de la base vectorielle: ${filePath}`);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const vectorStoreData = JSON.parse(fileContent);
        
        // Recréer la base vectorielle à partir des données
        if (vectorStoreData.vectors && vectorStoreData.documents) {
          const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
          });
          
          const vectorStore = new MemoryVectorStore(embeddings);
          
          // Ajouter les documents à la base vectorielle
          for (let i = 0; i < vectorStoreData.documents.length; i++) {
            const doc = vectorStoreData.documents[i];
            const vector = vectorStoreData.vectors[i];
            
            await vectorStore.addVectors([vector], [doc]);
          }
          
          // Stocker la base vectorielle dans la variable globale
          const collectionName = path.basename(file, '.json');
          global.vectorStores[collectionName] = vectorStore;
          
          console.log(`Base vectorielle ${collectionName} chargée avec succès.`);
        } else {
          console.error(`Format de fichier invalide pour ${file}: vectors ou documents manquants`);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de la base vectorielle ${file}:`, error);
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement des bases vectorielles existantes:', error);
  }
}

// Route pour lister les bases vectorielles
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

// Route pour la recherche dans les documents PDF
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
    
    // Examiner la configuration du modèle OpenAI
    console.log('Modèle OpenAI configuré:', process.env.CHAT_MODEL);
    console.log('Température:', validTemperature);
    
    try {
      // Générer une réponse RAG en utilisant le modèle de chat correctement
      const chatModel = new ChatOpenAI({
        modelName: process.env.CHAT_MODEL,
        temperature: validTemperature,
        openAIApiKey: process.env.OPENAI_API_KEY
      });
      
      const systemTemplate = `
      Vous êtes un expert en classification douanière. Votre tâche est de déterminer le code douanier le plus approprié pour un produit en fonction des informations fournies.
      `;
      
      const humanTemplate = `
      En tant qu'expert en classification douanière, utilisez les informations suivantes pour déterminer le code douanier le plus approprié pour le produit décrit.
      
      Description du produit: {query}
      
      Contexte extrait du document:
      {context}
      
      Veuillez fournir:
      1. Le code douanier le plus approprié (8 chiffres)
      2. Une explication détaillée de votre raisonnement
      3. Les sections pertinentes du document qui ont guidé votre décision
      `;
      
      // Utiliser une approche plus simple pour la chaîne RAG
      const contextText = formattedResults.map(doc => doc.pageContent).join('\n\n');
      
      // Utiliser le modèle de chat correctement
      const messages = [
        { role: 'system', content: systemTemplate },
        { role: 'user', content: humanTemplate
          .replace('{query}', query)
          .replace('{context}', contextText)
        }
      ];
      
      const response = await chatModel.call(messages);
      const ragResponse = response.content;
      
      // Renvoyer les résultats
      res.json({
        success: true,
        searchResults: formattedResults,
        ragResponse: ragResponse,
        usedTemperature: validTemperature
      });
    } catch (ragError) {
      console.error('Erreur lors de la génération de la réponse RAG:', ragError);
      
      // En cas d'erreur avec le modèle, renvoyer quand même les résultats de recherche
      res.json({
        success: true,
        searchResults: formattedResults,
        ragResponse: "Impossible de générer une réponse RAG en raison d'une erreur avec le modèle OpenAI. Veuillez vérifier votre clé API et la configuration du modèle.",
        error: ragError.message,
        usedTemperature: validTemperature
      });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche dans le document:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour vérifier l'état du serveur
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Serveur PDF autonome en cours d\'exécution',
    vectorStores: Object.keys(global.vectorStores || {}).length
  });
});

// Démarrer le serveur sur toutes les interfaces réseau
app.listen(PORT, HOST, () => {
  console.log(`Serveur PDF autonome démarré sur ${HOST}:${PORT}`);
  console.log(`API PDF accessible à l'adresse: http://app1.communify.solutions:${PORT}`);
  console.log('Routes disponibles:');
  console.log('- GET /list-vector-stores');
  console.log('- POST /direct-pdf-search');
  console.log('- GET /status');
  
  // Charger les bases vectorielles existantes
  loadExistingVectorStores();
});
