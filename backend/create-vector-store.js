/**
 * Script pour créer une base vectorielle à partir d'un fichier PDF existant
 */
const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
require('dotenv').config();

// Vérifier si la clé API OpenAI est configurée
if (!process.env.OPENAI_API_KEY) {
  console.error('Erreur: Clé API OpenAI non configurée');
  console.error('Veuillez configurer la clé API dans le fichier .env du backend');
  process.exit(1);
}

// Fonction pour créer une base vectorielle à partir d'un fichier PDF
async function createVectorStore(pdfPath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Erreur: Le fichier ${pdfPath} n'existe pas`);
      return null;
    }
    
    console.log(`Chargement du document PDF: ${pdfPath}`);
    
    // Charger le document PDF
    const loader = new PDFLoader(pdfPath, {
      splitPages: false
    });
    
    const docs = await loader.load();
    
    if (!docs || docs.length === 0) {
      console.error('Erreur: Aucun document chargé');
      return null;
    }
    
    console.log(`Document chargé avec succès (${docs.length} pages)`);
    
    // Diviser le texte en chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    
    console.log(`Document divisé en ${splitDocs.length} chunks`);
    
    // Créer les embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    // Créer la base vectorielle
    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );
    
    console.log('Base vectorielle créée avec succès');
    
    // Générer un nom pour la base vectorielle
    const fileName = path.basename(pdfPath);
    const timestamp = Date.now();
    const collectionName = `${fileName.replace(/\.[^/.]+$/, '')}_${timestamp}`;
    
    // Sauvegarder la base vectorielle
    const vectors = await vectorStore.memoryVectors;
    const documents = vectors.map(vector => vector.metadata);
    
    const vectorStoreData = {
      vectors: vectors.map(vector => vector.embedding),
      documents: documents
    };
    
    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Sauvegarder la base vectorielle dans un fichier JSON
    const outputPath = path.join(outputDir, `${collectionName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(vectorStoreData));
    
    console.log(`Base vectorielle sauvegardée dans: ${outputPath}`);
    
    return {
      collectionName,
      outputPath,
      documentCount: splitDocs.length
    };
  } catch (error) {
    console.error('Erreur lors de la création de la base vectorielle:', error);
    return null;
  }
}

// Fonction principale
async function main() {
  // Récupérer le chemin du fichier PDF à partir des arguments de la ligne de commande
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Erreur: Veuillez spécifier le chemin du fichier PDF');
    console.error('Usage: node create-vector-store.js <chemin-du-fichier-pdf>');
    process.exit(1);
  }
  
  const pdfPath = args[0];
  
  console.log(`Création d'une base vectorielle à partir de: ${pdfPath}`);
  
  const result = await createVectorStore(pdfPath);
  
  if (result) {
    console.log('\nRésumé:');
    console.log(`- Nom de la collection: ${result.collectionName}`);
    console.log(`- Nombre de documents: ${result.documentCount}`);
    console.log(`- Fichier de sortie: ${result.outputPath}`);
    console.log('\nVous pouvez maintenant utiliser cette base vectorielle pour la recherche dans le document PDF.');
  } else {
    console.error('\nÉchec de la création de la base vectorielle.');
  }
}

// Exécuter la fonction principale
main();
