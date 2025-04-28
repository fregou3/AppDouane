const axios = require('axios');
require('dotenv').config();

// URL de l'API
const API_URL = 'http://localhost:5004';

async function checkApiSauce8() {
  try {
    console.log('Vérification de l\'API pour sauce8...');
    
    // 1. Vérifier la route /api/semi-finis-simple
    console.log('\n=== Test de la route /api/semi-finis-simple ===');
    const simpleResponse = await axios.get(`${API_URL}/api/semi-finis-simple`);
    
    if (simpleResponse.data && simpleResponse.data.success) {
      console.log(`${simpleResponse.data.count} semi-finis trouvés via /api/semi-finis-simple`);
      
      // Rechercher sauce8
      const sauce8Simple = simpleResponse.data.rows.find(item => 
        item.nom && item.nom.toLowerCase() === 'sauce8'
      );
      
      if (sauce8Simple) {
        console.log('✅ sauce8 trouvée via /api/semi-finis-simple:', sauce8Simple);
      } else {
        console.log('❌ sauce8 NON trouvée via /api/semi-finis-simple');
      }
    }
    
    // 2. Vérifier la route /api/semi-finis
    console.log('\n=== Test de la route /api/semi-finis ===');
    const response = await axios.get(`${API_URL}/api/semi-finis`);
    
    if (response.data) {
      console.log(`${response.data.length} semi-finis trouvés via /api/semi-finis`);
      
      // Afficher tous les semi-finis
      console.log('\nListe complète des semi-finis via /api/semi-finis:');
      response.data.forEach(item => {
        console.log(`ID: ${item.id}, Nom: ${item.nom}, Lot: ${item.lot_number}`);
      });
      
      // Rechercher sauce8
      const sauce8 = response.data.find(item => 
        item.nom && item.nom.toLowerCase() === 'sauce8'
      );
      
      if (sauce8) {
        console.log('\n✅ sauce8 trouvée via /api/semi-finis:', sauce8);
      } else {
        console.log('\n❌ sauce8 NON trouvée via /api/semi-finis');
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'API:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
  }
}

// Exécuter la fonction
checkApiSauce8();
