/**
 * Script pour tester les endpoints du serveur
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5004';

async function testEndpoints() {
  try {
    console.log('Test de l\'endpoint /list-vector-stores...');
    const response = await axios.get(`${API_URL}/list-vector-stores`);
    console.log('Réponse:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Erreur lors du test des endpoints:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nLe serveur ne semble pas être en cours d\'exécution sur ' + API_URL);
      console.log('Veuillez démarrer le serveur avec la commande: node server.js');
    }
  }
}

// Exécuter la fonction
testEndpoints();
