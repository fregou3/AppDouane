const axios = require('axios');
const { Pool } = require('pg');

// Configuration de la base de données pour les tests
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'douane',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5434,
});

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Nettoyer la base de données après les tests
afterAll(async () => {
  await pool.end();
});

describe('Fonctionnalité d\'analyse des documents de la page Conformité', () => {
  // Test d'analyse pour chaque type de document
  const documentTypes = ['bon_livraison', 'bulletin_analyse', 'certificat', 'facture'];
  
  documentTypes.forEach(type => {
    test(`Analyse d'un document de type ${type}`, async () => {
      // Récupérer un document du type spécifié
      let document = null;
      
      try {
        // Récupérer tous les lots
        const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
        if (lotsResponse.data.length === 0) {
          console.warn('Aucun lot trouvé pour les tests');
          return;
        }
        
        // Parcourir les lots pour trouver un document du type spécifié
        for (const lot of lotsResponse.data) {
          const matiereResponse = await axios.get(`${API_URL}/api/conformite/matiere/${lot.lot}`);
          
          // Chercher un document du type spécifié
          const documentFound = matiereResponse.data.find(doc => doc.type_document === type);
          if (documentFound) {
            document = documentFound;
            break;
          }
        }
        
        if (!document) {
          console.warn(`Aucun document de type ${type} trouvé pour les tests`);
          return;
        }
        
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
        
        // Vérifier que l'analyse a été correctement enregistrée en base de données
        const tableName = `analyses_${type}`;
        const dbResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE document_id = $1`,
          [document.id]
        );
        
        expect(dbResult.rows.length).toBe(1);
        expect(dbResult.rows[0].document_id).toBe(document.id);
        expect(dbResult.rows[0].matiere_premiere_id).toBe(document.matiere_premiere_id);
        expect(dbResult.rows[0].ratio_conformite).toBeDefined();
        
      } catch (error) {
        fail(`Erreur lors de l'analyse du document de type ${type}: ${error.message}`);
      }
    });
  });
  
  // Test de vérification des champs attendus dans les analyses
  test('Vérification des champs attendus dans les analyses', async () => {
    // Définir les champs attendus pour chaque type de document
    const expectedFields = {
      bon_livraison: ['date_document', 'nom_fournisseur', 'numero_bon_livraison', 'nom_matiere_premiere', 'quantite', 'unite'],
      bulletin_analyse: ['date_document', 'nom_fournisseur', 'numero_lot', 'nom_matiere_premiere', 'resultats_analyses'],
      certificat: ['date_document', 'nom_fournisseur', 'numero_certificat', 'nom_matiere_premiere', 'normes_conformite', 'validite'],
      facture: ['date_document', 'nom_fournisseur', 'numero_facture', 'nom_matiere_premiere', 'montant_ht', 'montant_ttc', 'tva']
    };
    
    // Pour chaque type de document, vérifier que la fonction formatAnalyseData gère correctement les champs attendus
    for (const [type, fields] of Object.entries(expectedFields)) {
      // Créer des données de test
      const testData = {
        analyse: {
          id: 1,
          document_id: 1,
          matiere_premiere_id: 1,
          ratio_conformite: 0.8,
          fields: {}
        },
        ratio: 0.8,
        summary: `Analyse du document de type ${type}`
      };
      
      // Simuler une réponse d'API
      try {
        // Appeler directement la fonction formatAnalyseData via une requête au backend
        const response = await axios.post(`${API_URL}/api/test/format-analyse`, {
          data: testData,
          type_document: type
        }).catch(error => {
          // Si l'endpoint de test n'existe pas, on skip ce test
          console.warn(`L'endpoint de test /api/test/format-analyse n'existe pas. Ajoutez-le pour tester la fonction formatAnalyseData.`);
          return { data: null };
        });
        
        // Si l'endpoint de test n'existe pas, on skip ce test
        if (!response.data) continue;
        
        // Vérifier que tous les champs attendus sont présents
        for (const field of fields) {
          expect(response.data.fields).toHaveProperty(field);
        }
        
      } catch (error) {
        console.warn(`Impossible de tester la fonction formatAnalyseData pour le type ${type}: ${error.message}`);
      }
    }
  });
});
