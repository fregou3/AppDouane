/**
 * Script pour vérifier si le serveur PDF autonome est en cours d'exécution
 */
const axios = require('axios');

async function checkServer() {
  try {
    console.log('Vérification du serveur PDF autonome...');
    const response = await axios.get('http://localhost:5005/status');
    console.log('Statut du serveur:', response.data);
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du serveur:', error.message);
    return false;
  }
}

checkServer();
