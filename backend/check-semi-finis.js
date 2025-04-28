require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'douane',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432
});

async function main() {
  try {
    console.log('Vérification des semi-finis dans la base de données...');
    const result = await pool.query('SELECT * FROM semi_finis ORDER BY id');
    console.log('Semi-finis trouvés:', JSON.stringify(result.rows, null, 2));
    
    // Vérifier si la Sauce 5 existe
    const sauce5 = result.rows.find(row => 
      row.nom.toLowerCase().includes('sauce') && 
      row.nom.includes('5')
    );
    
    if (sauce5) {
      console.log('\nSauce 5 trouvée:', sauce5);
    } else {
      console.log('\nSauce 5 non trouvée dans la base de données.');
    }
    
    // Vérifier toutes les sauces
    const sauces = result.rows.filter(row => 
      row.nom.toLowerCase().includes('sauce') || 
      /^sauce\s*\d+/i.test(row.nom) || 
      /^s\s*\d+/i.test(row.nom)
    );
    
    console.log('\nToutes les sauces trouvées:', sauces.map(s => `${s.id}: ${s.nom} (Lot: ${s.lot_number})`));
    
  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    pool.end();
  }
}

main();
