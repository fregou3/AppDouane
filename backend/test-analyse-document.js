const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Chemin vers un fichier PDF de test
const pdfPath = path.join(__dirname, '..', 'test-document.pdf');

// Vérifier si le fichier PDF existe
if (!fs.existsSync(pdfPath)) {
  console.error(`Le fichier ${pdfPath} n'existe pas.`);
  console.log('Veuillez placer un fichier PDF nommé "test-document.pdf" dans le répertoire parent.');
  process.exit(1);
}

async function testAnalyseDocument() {
  try {
    console.log('Test de la route /api/analyse-document');
    console.log('Fichier PDF:', pdfPath);
    console.log('Taille du fichier:', fs.statSync(pdfPath).size, 'octets');

    // Créer un FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));

    console.log('Envoi de la requête à http://localhost:5004/api/analyse-document');
    const response = await axios.post('http://localhost:5004/api/analyse-document', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Réponse reçue:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('Test réussi!');
  } catch (error) {
    console.error('Erreur lors du test:');
    console.error('Message d\'erreur:', error.message);
    if (error.response) {
      console.error('Statut de la réponse:', error.response.status);
      console.error('Données de la réponse:', error.response.data);
    }
  }
}

testAnalyseDocument();
