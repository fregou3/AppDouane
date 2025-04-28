/**
 * Script pour tester l'API PDF autonome
 */
const axios = require('axios');

// Configuration
const PDF_API_URL = 'http://localhost:5005';

async function testPdfApi() {
  try {
    console.log('1. Test de l\'endpoint /list-vector-stores...');
    const listResponse = await axios.get(`${PDF_API_URL}/list-vector-stores`);
    console.log('Réponse:', JSON.stringify(listResponse.data, null, 2));
    
    if (listResponse.data.stores && listResponse.data.stores.length > 0) {
      const collectionName = listResponse.data.stores[0].id;
      
      console.log(`\n2. Test de l\'endpoint /direct-pdf-search avec la collection ${collectionName}...`);
      const searchResponse = await axios.post(`${PDF_API_URL}/direct-pdf-search`, {
        collectionName: collectionName,
        query: "Produit chimique",
        temperature: 0.2
      });
      
      console.log('Réponse de la recherche:');
      console.log('- Succès:', searchResponse.data.success);
      console.log('- Nombre de résultats:', searchResponse.data.searchResults?.length || 0);
      
      if (searchResponse.data.searchResults && searchResponse.data.searchResults.length > 0) {
        console.log('- Premier résultat (extrait):', searchResponse.data.searchResults[0].pageContent.substring(0, 100) + '...');
      }
      
      if (searchResponse.data.ragResponse) {
        console.log('- Réponse RAG (extrait):', searchResponse.data.ragResponse.substring(0, 100) + '...');
      }
    } else {
      console.log('Aucune base vectorielle disponible pour tester la recherche.');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du test de l\'API PDF:', error.message);
    
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return false;
  }
}

// Exécuter la fonction
testPdfApi();
