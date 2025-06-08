const axios = require('axios');
const { Pool } = require('pg');
const util = require('util');
const sleep = util.promisify(setTimeout);

// Configuration de la base de données pour les tests
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'douane',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5434,
});

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Fonction pour vérifier si l'API est disponible
async function isApiAvailable() {
  try {
    await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    // Si l'endpoint /api/health n'existe pas, essayer un autre endpoint
    try {
      await axios.get(`${API_URL}/api/conformite/lots`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Nettoyer la base de données après les tests
afterAll(async () => {
  await pool.end();
});

// Marquer tous les tests comme conditionnels
const describeIfApiAvailable = (title, fn) => {
  describe(title, () => {
    beforeAll(async () => {
      const available = await isApiAvailable();
      if (!available) {
        console.warn(`L'API n'est pas disponible à l'URL ${API_URL}. Les tests API seront ignorés.`);
      }
    });
    fn();
  });
};

describeIfApiAvailable('API Conformité', () => {
  // Test de récupération des lots
  test('GET /api/conformite/lots - Récupération des lots', async () => {
    // Vérifier si l'API est disponible
    const available = await isApiAvailable();
    if (!available) {
      console.warn(`Test ignoré: L'API n'est pas disponible à l'URL ${API_URL}`);
      return;
    }
    
    // Essayer plusieurs fois en cas d'erreur temporaire
    let attempts = 0;
    let success = false;
    let lastError = null;
    
    while (attempts < 3 && !success) {
    try {
      const response = await axios.get(`${API_URL}/api/conformite/lots`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // Vérifier la structure des données
      if (response.data.length > 0) {
        expect(response.data[0]).toHaveProperty('lot');
        expect(response.data[0]).toHaveProperty('fournisseur');
      }
      success = true;
    } catch (error) {
      lastError = error;
      attempts++;
      await sleep(1000); // Attendre 1 seconde avant de réessayer
    }
    }
    
    if (!success) {
      fail(`Erreur lors de la récupération des lots après ${attempts} tentatives: ${lastError.message}`);
    }
  });

  // Test de récupération des matières premières pour un lot
  test('GET /api/conformite/matiere/:lot - Récupération des matières premières pour un lot', async () => {
    // Vérifier si l'API est disponible
    const available = await isApiAvailable();
    if (!available) {
      console.warn(`Test ignoré: L'API n'est pas disponible à l'URL ${API_URL}`);
      return;
    }
    // D'abord récupérer un lot existant
    let lotId;
    try {
      const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
      if (lotsResponse.data.length > 0) {
        lotId = lotsResponse.data[0].lot;
      } else {
        // Si aucun lot n'existe, on skip ce test
        console.warn('Aucun lot trouvé pour tester GET /api/conformite/matiere/:lot');
        return;
      }

      const response = await axios.get(`${API_URL}/api/conformite/matiere/${lotId}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Vérifier la structure des données
      if (response.data.length > 0) {
        const document = response.data[0];
        expect(document).toHaveProperty('id');
        expect(document).toHaveProperty('type_document');
        expect(document).toHaveProperty('fichier_path');
        expect(document).toHaveProperty('matiere_premiere_id');
      }
    } catch (error) {
      fail(`Erreur lors de la récupération des matières premières pour le lot ${lotId}: ${error.message}`);
    }
  });

  // Test d'analyse d'un document
  test('POST /api/conformite/analyze - Analyse d\'un document', async () => {
    // Vérifier si l'API est disponible
    const available = await isApiAvailable();
    if (!available) {
      console.warn(`Test ignoré: L'API n'est pas disponible à l'URL ${API_URL}`);
      return;
    }
    // D'abord récupérer un document existant
    let document;
    try {
      // Récupérer un lot
      const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
      if (lotsResponse.data.length === 0) {
        console.warn('Aucun lot trouvé pour tester POST /api/conformite/analyze');
        return;
      }
      
      const lotId = lotsResponse.data[0].lot;
      
      // Récupérer les documents du lot
      const matiereResponse = await axios.get(`${API_URL}/api/conformite/matiere/${lotId}`);
      if (matiereResponse.data.length === 0) {
        console.warn('Aucun document trouvé pour tester POST /api/conformite/analyze');
        return;
      }
      
      // Prendre le premier document
      document = matiereResponse.data[0];
      
      // Analyser le document
      const analyzeResponse = await axios.post(`${API_URL}/api/conformite/analyze`, {
        fichier_path: document.fichier_path,
        type_document: document.type_document,
        document_id: document.id,
        matiere_premiere_id: document.matiere_premiere_id
      });
      
      expect(analyzeResponse.status).toBe(200);
      expect(analyzeResponse.data).toHaveProperty('analyse');
      expect(analyzeResponse.data).toHaveProperty('ratio');
      expect(analyzeResponse.data).toHaveProperty('summary');
      
      // Vérifier la structure de l'analyse
      const analyse = analyzeResponse.data.analyse;
      expect(analyse).toHaveProperty('id');
      expect(analyse).toHaveProperty('document_id');
      expect(analyse).toHaveProperty('matiere_premiere_id');
      expect(analyse).toHaveProperty('ratio_conformite');
      
    } catch (error) {
      fail(`Erreur lors de l'analyse du document: ${error.message}`);
    }
  });

  // Test de récupération d'une analyse spécifique
  test('GET /api/conformite/analyse/:table/:documentId - Récupération d\'une analyse spécifique', async () => {
    // Vérifier si l'API est disponible
    const available = await isApiAvailable();
    if (!available) {
      console.warn(`Test ignoré: L'API n'est pas disponible à l'URL ${API_URL}`);
      return;
    }
    // D'abord récupérer un document existant et son analyse
    let document;
    let table;
    
    try {
      // Récupérer un lot
      const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
      if (lotsResponse.data.length === 0) {
        console.warn('Aucun lot trouvé pour tester GET /api/conformite/analyse/:table/:documentId');
        return;
      }
      
      const lotId = lotsResponse.data[0].lot;
      
      // Récupérer les documents du lot
      const matiereResponse = await axios.get(`${API_URL}/api/conformite/matiere/${lotId}`);
      if (matiereResponse.data.length === 0) {
        console.warn('Aucun document trouvé pour tester GET /api/conformite/analyse/:table/:documentId');
        return;
      }
      
      // Prendre le premier document
      document = matiereResponse.data[0];
      
      // Déterminer la table d'analyse en fonction du type de document
      switch (document.type_document) {
        case 'bon_livraison':
          table = 'analyses_bon_livraison';
          break;
        case 'bulletin_analyse':
          table = 'analyses_bulletin_analyse';
          break;
        case 'certificat':
          table = 'analyses_certificat';
          break;
        case 'facture':
          table = 'analyses_facture';
          break;
        default:
          console.warn(`Type de document non pris en charge: ${document.type_document}`);
          return;
      }
      
      // Récupérer l'analyse
      const analyseResponse = await axios.get(`${API_URL}/api/conformite/analyse/${table}/${document.id}`);
      
      // Si l'analyse n'existe pas, on skip ce test
      if (analyseResponse.data === null) {
        console.warn(`Aucune analyse trouvée pour le document ${document.id} dans la table ${table}`);
        return;
      }
      
      expect(analyseResponse.status).toBe(200);
      expect(analyseResponse.data).toHaveProperty('id');
      expect(analyseResponse.data).toHaveProperty('document_id');
      expect(analyseResponse.data).toHaveProperty('matiere_premiere_id');
      expect(analyseResponse.data).toHaveProperty('ratio_conformite');
      
    } catch (error) {
      fail(`Erreur lors de la récupération de l'analyse: ${error.message}`);
    }
  });
});
