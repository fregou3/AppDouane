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

async function addMissingSauces() {
  const client = await pool.connect();
  
  try {
    console.log('Début de l\'ajout des sauces manquantes...');
    
    // Commencer une transaction
    await client.query('BEGIN');
    
    // Ajouter Sauce 6
    const sauce6Result = await client.query(
      'INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Sauce6', '444', '', 223.00, '']
    );
    const sauce6Id = sauce6Result.rows[0].id;
    console.log(`Sauce6 créée avec succès ! ID: ${sauce6Id}`);
    
    // Ajouter Sauce 7
    const sauce7Result = await client.query(
      'INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['sauce7', '4434', 'France', 334.00, '']
    );
    const sauce7Id = sauce7Result.rows[0].id;
    console.log(`sauce7 créée avec succès ! ID: ${sauce7Id}`);
    
    // Ajouter la relation entre Sauce6 et Huile Verveine
    // Nous devons d'abord trouver l'ID de l'Huile Verveine
    const verveineResult = await client.query("SELECT id FROM matieres_premieres WHERE nom LIKE '%Verveine%' LIMIT 1");
    if (verveineResult.rows.length > 0) {
      const verveineId = verveineResult.rows[0].id;
      await client.query(
        'INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) VALUES ($1, $2)',
        [sauce6Id, verveineId]
      );
      console.log(`Relation créée entre Sauce6 et Huile Verveine (ID: ${verveineId})`);
      
      // Ajouter aussi la relation pour sauce7
      await client.query(
        'INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) VALUES ($1, $2)',
        [sauce7Id, verveineId]
      );
      console.log(`Relation créée entre sauce7 et Huile Verveine (ID: ${verveineId})`);
    } else {
      console.log('Huile Verveine non trouvée dans la base de données');
    }
    
    // Valider la transaction
    await client.query('COMMIT');
    
    // Vérifier que les sauces ont bien été ajoutées
    console.log('\nListe complète des sauces après ajout:');
    const allSauces = await client.query('SELECT * FROM semi_finis ORDER BY id');
    allSauces.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}, Pays d'origine: ${row.pays_origine}, Valeur: ${row.valeur}`);
    });
    
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'ajout des sauces:', error);
  } finally {
    // Libérer le client
    client.release();
    // Fermer le pool de connexions
    pool.end();
  }
}

// Exécuter la fonction
addMissingSauces();
