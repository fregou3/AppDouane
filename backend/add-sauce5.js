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

async function addSauce5() {
  const client = await pool.connect();
  
  try {
    console.log('Début de l\'ajout de Sauce 5...');
    
    // Commencer une transaction
    await client.query('BEGIN');
    
    // Insérer Sauce 5 dans la table semi_finis
    const result = await client.query(
      'INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Sauce 5', 'S5-2025', 'France', 250.00, '']
    );
    
    const sauceId = result.rows[0].id;
    console.log(`Sauce 5 créée avec succès ! ID: ${sauceId}`);
    
    // Valider la transaction
    await client.query('COMMIT');
    
    // Vérifier que la sauce a bien été ajoutée
    const verification = await client.query('SELECT * FROM semi_finis WHERE id = $1', [sauceId]);
    console.log('Détails de la Sauce 5 créée:', verification.rows[0]);
    
    console.log('\nListe complète des sauces après ajout:');
    const allSauces = await client.query('SELECT * FROM semi_finis ORDER BY id');
    allSauces.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}, Pays d'origine: ${row.pays_origine}, Valeur: ${row.valeur}`);
    });
    
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'ajout de Sauce 5:', error);
  } finally {
    // Libérer le client
    client.release();
    // Fermer le pool de connexions
    pool.end();
  }
}

// Exécuter la fonction
addSauce5();
