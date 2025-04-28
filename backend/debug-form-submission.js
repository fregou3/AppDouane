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

// Fonction pour ajouter manuellement sauce8
async function addSauce8() {
  const client = await pool.connect();
  
  try {
    console.log('Début de l\'ajout manuel de sauce8...');
    
    // Commencer une transaction
    await client.query('BEGIN');
    
    // Insérer sauce8 dans la table semi_finis
    const result = await client.query(
      'INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['sauce8', '434334', 'France', 223.00, '']
    );
    
    const sauceId = result.rows[0].id;
    console.log(`sauce8 créée avec succès ! ID: ${sauceId}`);
    
    // Ajouter la relation avec Huile Gentiane (ID 9)
    await client.query(
      'INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) VALUES ($1, $2)',
      [sauceId, 9]
    );
    console.log(`Relation créée entre sauce8 et Huile Gentiane (ID: 9)`);
    
    // Valider la transaction
    await client.query('COMMIT');
    
    // Vérifier que la sauce a bien été ajoutée
    const verification = await client.query('SELECT * FROM semi_finis WHERE id = $1', [sauceId]);
    console.log('Détails de sauce8 créée:', verification.rows[0]);
    
    // Vérifier la relation avec les matières premières
    const relationVerification = await client.query(`
      SELECT mp.nom as matiere_premiere_nom
      FROM semi_finis_matieres_premieres sfmp
      JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
      WHERE sfmp.semi_fini_id = $1
    `, [sauceId]);
    
    console.log('Matières premières associées:');
    relationVerification.rows.forEach(row => {
      console.log(`- ${row.matiere_premiere_nom}`);
    });
    
    console.log('\nListe complète des sauces après ajout:');
    const allSauces = await client.query('SELECT * FROM semi_finis ORDER BY id');
    allSauces.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}, Pays d'origine: ${row.pays_origine}, Valeur: ${row.valeur}`);
    });
    
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'ajout de sauce8:', error);
  } finally {
    // Libérer le client
    client.release();
    // Fermer le pool de connexions
    pool.end();
  }
}

// Exécuter la fonction
addSauce8();
