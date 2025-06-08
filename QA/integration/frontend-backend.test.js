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
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Nettoyer la base de données après les tests
afterAll(async () => {
  await pool.end();
});

describe('Tests d\'intégration Frontend-Backend', () => {
  // Test du flux complet d'analyse de document
  test('Flux complet d\'analyse de document', async () => {
    try {
      // 1. Récupérer un lot existant
      const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
      expect(lotsResponse.status).toBe(200);
      expect(Array.isArray(lotsResponse.data)).toBe(true);
      
      if (lotsResponse.data.length === 0) {
        console.warn('Aucun lot trouvé pour les tests d\'intégration');
        return;
      }
      
      const lotId = lotsResponse.data[0].lot;
      
      // 2. Récupérer les documents du lot
      const matiereResponse = await axios.get(`${API_URL}/api/conformite/matiere/${lotId}`);
      expect(matiereResponse.status).toBe(200);
      expect(Array.isArray(matiereResponse.data)).toBe(true);
      
      if (matiereResponse.data.length === 0) {
        console.warn('Aucun document trouvé pour les tests d\'intégration');
        return;
      }
      
      // 3. Analyser un document de chaque type si disponible
      const documentTypes = ['bon_livraison', 'bulletin_analyse', 'certificat', 'facture'];
      
      for (const type of documentTypes) {
        // Trouver un document du type spécifié
        const document = matiereResponse.data.find(doc => doc.type_document === type);
        
        if (!document) {
          console.warn(`Aucun document de type ${type} trouvé pour les tests d'intégration`);
          continue;
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
        
        // 4. Vérifier que l'analyse a été enregistrée en base de données
        const tableName = `analyses_${type}`;
        const dbResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE document_id = $1`,
          [document.id]
        );
        
        expect(dbResult.rows.length).toBe(1);
        expect(dbResult.rows[0].document_id).toBe(document.id);
        expect(dbResult.rows[0].matiere_premiere_id).toBe(document.matiere_premiere_id);
        
        // 5. Récupérer l'analyse via l'API
        const analyseResponse = await axios.get(`${API_URL}/api/conformite/analyse/${tableName}/${document.id}`);
        expect(analyseResponse.status).toBe(200);
        expect(analyseResponse.data).toHaveProperty('id');
        expect(analyseResponse.data).toHaveProperty('document_id');
        expect(analyseResponse.data).toHaveProperty('matiere_premiere_id');
        expect(analyseResponse.data).toHaveProperty('ratio_conformite');
        
        // 6. Vérifier que la colonne fields est présente et au format JSON
        if (analyseResponse.data.fields) {
          let fields;
          
          // Si fields est une chaîne, essayer de la parser en JSON
          if (typeof analyseResponse.data.fields === 'string') {
            try {
              fields = JSON.parse(analyseResponse.data.fields);
              expect(typeof fields).toBe('object');
            } catch (e) {
              fail(`La colonne fields n'est pas un JSON valide: ${e.message}`);
            }
          } else {
            // Si fields est déjà un objet, c'est bon
            expect(typeof analyseResponse.data.fields).toBe('object');
          }
        }
      }
    } catch (error) {
      fail(`Erreur lors du test d'intégration: ${error.message}`);
    }
  });
  
  // Test de la cohérence des données entre le frontend et le backend
  test('Cohérence des données entre le frontend et le backend', async () => {
    try {
      // 1. Récupérer un lot existant
      const lotsResponse = await axios.get(`${API_URL}/api/conformite/lots`);
      
      if (lotsResponse.data.length === 0) {
        console.warn('Aucun lot trouvé pour les tests de cohérence');
        return;
      }
      
      const lotId = lotsResponse.data[0].lot;
      
      // 2. Récupérer les documents du lot
      const matiereResponse = await axios.get(`${API_URL}/api/conformite/matiere/${lotId}`);
      
      if (matiereResponse.data.length === 0) {
        console.warn('Aucun document trouvé pour les tests de cohérence');
        return;
      }
      
      // 3. Pour chaque document, vérifier la cohérence des données
      for (const document of matiereResponse.data) {
        const type = document.type_document;
        const tableName = `analyses_${type}`;
        
        // Récupérer l'analyse via l'API
        const analyseResponse = await axios.get(`${API_URL}/api/conformite/analyse/${tableName}/${document.id}`);
        
        // Si l'analyse n'existe pas, passer au document suivant
        if (analyseResponse.status !== 200 || !analyseResponse.data) {
          continue;
        }
        
        // Récupérer l'analyse directement depuis la base de données
        const dbResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE document_id = $1`,
          [document.id]
        );
        
        if (dbResult.rows.length === 0) {
          continue;
        }
        
        const dbAnalyse = dbResult.rows[0];
        
        // Vérifier la cohérence des données
        expect(analyseResponse.data.id).toBe(dbAnalyse.id);
        expect(analyseResponse.data.document_id).toBe(dbAnalyse.document_id);
        expect(analyseResponse.data.matiere_premiere_id).toBe(dbAnalyse.matiere_premiere_id);
        expect(analyseResponse.data.ratio_conformite).toBe(dbAnalyse.ratio_conformite);
        
        // Vérifier la cohérence des champs fields
        if (analyseResponse.data.fields && dbAnalyse.fields) {
          let apiFields, dbFields;
          
          // Parser les champs si nécessaire
          if (typeof analyseResponse.data.fields === 'string') {
            apiFields = JSON.parse(analyseResponse.data.fields);
          } else {
            apiFields = analyseResponse.data.fields;
          }
          
          if (typeof dbAnalyse.fields === 'string') {
            dbFields = JSON.parse(dbAnalyse.fields);
          } else {
            dbFields = dbAnalyse.fields;
          }
          
          // Vérifier que les champs sont identiques
          expect(JSON.stringify(apiFields)).toBe(JSON.stringify(dbFields));
        }
      }
    } catch (error) {
      fail(`Erreur lors du test de cohérence: ${error.message}`);
    }
  });
});
