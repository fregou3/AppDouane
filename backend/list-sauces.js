const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à la base de données depuis le fichier .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function listSauces() {
  try {
    console.log('\n=== Liste des sauces (semi-finis) dans la base de données ===\n');
    
    // Requête pour récupérer tous les semi-finis
    const result = await pool.query('SELECT * FROM semi_finis ORDER BY nom');
    
    // Afficher les résultats
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}, Pays d'origine: ${row.pays_origine}`);
      
      // Vérifier spécifiquement si c'est la Sauce 5
      if (row.nom && (row.nom.includes('5') || row.nom.toLowerCase().includes('sauce 5'))) {
        console.log(`\n*** SAUCE 5 TROUVÉE! (ID: ${row.id}) ***`);
        console.log('Détails complets:', row);
      }
    });
    
    console.log(`\nTotal: ${result.rows.length} sauces trouvées`);
  } catch (error) {
    console.error('Erreur lors de la récupération des sauces:', error);
  } finally {
    // Fermer la connexion à la base de données
    pool.end();
  }
}

// Exécuter la fonction
listSauces();
