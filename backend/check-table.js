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

async function checkTable() {
  try {
    console.log('\n=== Vérification des tables de la base de données ===\n');
    
    // 1. Vérifier la structure de la table semi_finis
    console.log('Structure de la table semi_finis:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'semi_finis'
      ORDER BY ordinal_position
    `);
    
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    // 2. Lister tous les semi-finis (avec les plus récents en premier)
    console.log('\nContenu de la table semi_finis (les plus récents en premier):');
    const result = await pool.query('SELECT * FROM semi_finis ORDER BY id DESC');
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nom: ${row.nom}, Lot: ${row.lot_number}, Pays d'origine: ${row.pays_origine}, Valeur: ${row.valeur}`);
    });
    
    console.log(`\nTotal: ${result.rows.length} semi-finis trouvés`);
    
    // 3. Vérifier la table de liaison avec les matières premières
    console.log('\nVérification de la table de liaison semi_finis_matieres_premieres:');
    const joinTable = await pool.query(`
      SELECT sfmp.semi_fini_id, sf.nom as semi_fini_nom, sfmp.matiere_premiere_id, mp.nom as matiere_premiere_nom
      FROM semi_finis_matieres_premieres sfmp
      JOIN semi_finis sf ON sfmp.semi_fini_id = sf.id
      JOIN matieres_premieres mp ON sfmp.matiere_premiere_id = mp.id
      ORDER BY sfmp.semi_fini_id DESC
    `);
    
    if (joinTable.rows.length > 0) {
      joinTable.rows.forEach(row => {
        console.log(`Semi-fini ID: ${row.semi_fini_id} (${row.semi_fini_nom}) - Matière première ID: ${row.matiere_premiere_id} (${row.matiere_premiere_nom})`);
      });
    } else {
      console.log('Aucune association trouvée dans la table de liaison');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
  } finally {
    // Fermer la connexion à la base de données
    pool.end();
  }
}

// Exécuter la fonction
checkTable();
