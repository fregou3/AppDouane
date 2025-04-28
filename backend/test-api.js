const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Créer un fichier PDF de test simple
const testPdfPath = path.join(__dirname, 'test.pdf');
if (!fs.existsSync(testPdfPath)) {
  fs.writeFileSync(testPdfPath, 'Test PDF content');
  console.log('Fichier PDF de test créé:', testPdfPath);
}

// Tester la route /api/analyse-document (sans 's')
async function testAnalyseDocument() {
  try {
    console.log('Test de la route /api/analyse-document...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    
    const response = await axios.post('http://localhost:5004/api/analyse-document', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('Réponse:', response.data);
    return true;
  } catch (error) {
    console.error('Erreur lors du test de la route:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.status, error.response.statusText);
    }
    return false;
  }
}

// Tester la route /test
async function testSimpleRoute() {
  try {
    console.log('Test de la route /test...');
    const response = await axios.get('http://localhost:5004/test');
    console.log('Réponse:', response.data);
    return true;
  } catch (error) {
    console.error('Erreur lors du test de la route /test:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.status, error.response.statusText);
    }
    return false;
  }
}

// Exécuter les tests
async function runTests() {
  console.log('=== DÉBUT DES TESTS ===');
  
  // Test de la route simple
  const testResult = await testSimpleRoute();
  console.log('Test de la route /test:', testResult ? 'SUCCÈS' : 'ÉCHEC');
  
  // Test de la route d'analyse de documents (sans 's')
  const analyseResult = await testAnalyseDocument();
  console.log('Test de la route /api/analyse-document:', analyseResult ? 'SUCCÈS' : 'ÉCHEC');
  
  console.log('=== FIN DES TESTS ===');
}

runTests();
