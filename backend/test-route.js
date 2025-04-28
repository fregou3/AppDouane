const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Chemin vers un fichier PDF de test
const pdfPath = path.join(__dirname, 'test.pdf');

// Créer un fichier PDF vide si nécessaire
if (!fs.existsSync(pdfPath)) {
  console.log('Création d\'un fichier PDF de test...');
  fs.writeFileSync(pdfPath, 'Test PDF content');
}

// Tester la route /api/analyse-document
async function testAnalyseDocument() {
  try {
    console.log('Test de la route /api/analyse-document...');
    console.log('Fichier PDF de test:', pdfPath);
    console.log('Le fichier existe:', fs.existsSync(pdfPath));
    console.log('Taille du fichier:', fs.statSync(pdfPath).size, 'octets');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath), {
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('Envoi de la requête à http://localhost:5004/api/analyse-document');
    const response = await axios.post('http://localhost:5004/api/analyse-document', formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Réponse reçue avec succès!');
    console.log('Statut:', response.status);
    console.log('Réponse:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Erreur lors du test de la route:', error.message);
    if (error.response) {
      console.error('Statut de l\'erreur:', error.response.status, error.response.statusText);
      console.error('Détails de l\'erreur:', error.response.data);
    } else if (error.request) {
      console.error('Aucune réponse reçue. La requête a été envoyée mais pas de réponse.');
    } else {
      console.error('Erreur lors de la configuration de la requête:', error.message);
    }
  }
}

// Tester également la route /api/test-analyse-document pour comparaison
async function testTestAnalyseDocument() {
  try {
    console.log('\nTest de la route /api/test-analyse-document...');
    const response = await axios.post('http://localhost:5004/api/test-analyse-document');
    console.log('Réponse:', response.data);
  } catch (error) {
    console.error('Erreur lors du test de la route:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', error.response.status, error.response.statusText);
    }
  }
}

// Exécuter les tests
async function runTests() {
  await testAnalyseDocument();
  await testTestAnalyseDocument();
}

runTests();
