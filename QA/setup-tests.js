/**
 * Script pour configurer l'environnement de test
 * 
 * Ce script vérifie la connexion à la base de données et crée les tables nécessaires
 * si elles n'existent pas. Il est conçu pour être exécuté avant les tests.
 */

const { Pool } = require('pg');

// Configuration de la base de données pour les tests
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'douane',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5434,
});

// Tables d'analyses à vérifier
const tables = [
  'analyses_bon_livraison',
  'analyses_bulletin_analyse',
  'analyses_certificat',
  'analyses_facture'
];

// Colonnes requises pour chaque table
const requiredColumns = [
  'id',
  'document_id',
  'matiere_premiere_id',
  'resume',
  'ratio_conformite',
  'fields',
  'date_analyse',
  'created_at',
  'updated_at'
];

// Fonction pour vérifier l'existence d'une table
async function checkTableExists(tableName) {
  const result = await pool.query(`
    SELECT to_regclass($1) IS NOT NULL AS exists;
  `, [`public.${tableName}`]);
  
  return result.rows[0].exists;
}

// Fonction pour créer une table si elle n'existe pas
async function createTableIfNotExists(tableName) {
  const exists = await checkTableExists(tableName);
  
  if (!exists) {
    console.log(`La table ${tableName} n'existe pas. Création en cours...`);
    
    await pool.query(`
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        matiere_premiere_id INTEGER NOT NULL,
        resume TEXT,
        ratio_conformite FLOAT,
        fields JSONB,
        date_analyse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log(`Table ${tableName} créée avec succès.`);
  } else {
    console.log(`La table ${tableName} existe déjà.`);
  }
}

// Fonction pour vérifier l'existence d'une colonne dans une table
async function checkColumnExists(tableName, columnName) {
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2;
  `, [tableName, columnName]);
  
  return result.rows.length > 0;
}

// Fonction pour ajouter une colonne si elle n'existe pas
async function addColumnIfNotExists(tableName, columnName, columnType) {
  const exists = await checkColumnExists(tableName, columnName);
  
  if (!exists) {
    console.log(`La colonne ${columnName} n'existe pas dans la table ${tableName}. Ajout en cours...`);
    
    await pool.query(`
      ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};
    `);
    
    console.log(`Colonne ${columnName} ajoutée à la table ${tableName} avec succès.`);
  } else {
    console.log(`La colonne ${columnName} existe déjà dans la table ${tableName}.`);
  }
}

// Fonction principale pour configurer l'environnement de test
async function setupTestEnvironment() {
  try {
    console.log('Configuration de l\'environnement de test...');
    
    // Vérifier la connexion à la base de données
    await pool.query('SELECT NOW()');
    console.log('Connexion à la base de données établie avec succès.');
    
    // Vérifier et créer les tables si nécessaire
    for (const table of tables) {
      await createTableIfNotExists(table);
      
      // Vérifier et ajouter les colonnes si nécessaire
      await addColumnIfNotExists(table, 'fields', 'JSONB');
      await addColumnIfNotExists(table, 'resume', 'TEXT');
      await addColumnIfNotExists(table, 'ratio_conformite', 'FLOAT');
    }
    
    console.log('Configuration de l\'environnement de test terminée avec succès.');
    
  } catch (error) {
    console.error('Erreur lors de la configuration de l\'environnement de test:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la configuration
setupTestEnvironment();
