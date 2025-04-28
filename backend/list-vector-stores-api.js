/**
 * Script pour lister les bases de données vectorielles disponibles via l'API
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5004'; // Ajustez selon votre configuration

async function listVectorStores() {
  try {
    console.log('Récupération des bases de données vectorielles...');
    const response = await axios.get(`${API_URL}/api/pdf-analysis/vector-stores`);
    
    if (response.data.success) {
      const vectorStores = response.data.vectorStores;
      
      console.log('\n=== BASES DE DONNÉES VECTORIELLES DISPONIBLES ===\n');
      
      if (vectorStores.length === 0) {
        console.log('Aucune base de données vectorielle n\'est actuellement disponible.');
        return;
      }
      
      // Afficher les informations sur chaque base de données
      vectorStores.forEach((store, index) => {
        console.log(`${index + 1}. ID: ${store.id}`);
        console.log(`   Nom du fichier: ${store.fileName}`);
        console.log(`   Créé le: ${new Date(store.createdAt).toLocaleString()}`);
        console.log('');
      });
      
      console.log(`Total: ${vectorStores.length} base(s) de données vectorielle(s)`);
    } else {
      console.log('Erreur: Impossible de récupérer les bases de données vectorielles.');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des bases de données vectorielles:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nAssurez-vous que le serveur backend est en cours d\'exécution sur ' + API_URL);
    }
  }
}

// Exécuter la fonction
listVectorStores();
