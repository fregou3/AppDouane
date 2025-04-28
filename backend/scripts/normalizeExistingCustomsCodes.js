/**
 * Script pour normaliser tous les codes douaniers existants dans la base de données
 * Ce script met à jour tous les codes douaniers à 8 chiffres en ajoutant "00" à la fin des codes à 6 chiffres
 */

require('dotenv').config();
const { Pool } = require('pg');
const { normalizeCustomsCode } = require('../utils/customsCodeUtils');

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'douane_db',
  database: process.env.DB_NAME || 'douane',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function normalizeAllCustomsCodes() {
  const client = await pool.connect();
  
  try {
    console.log('Début de la normalisation des codes douaniers...');
    
    // 1. Normaliser les codes douaniers des matières premières
    console.log('\nNormalisation des codes douaniers des matières premières...');
    const matieresPremieres = await client.query(
      'SELECT id, code_douanier FROM matieres_premieres WHERE code_douanier IS NOT NULL AND code_douanier != \'\''
    );
    
    let mpUpdated = 0;
    for (const mp of matieresPremieres.rows) {
      const normalizedCode = normalizeCustomsCode(mp.code_douanier);
      if (normalizedCode !== mp.code_douanier) {
        await client.query(
          'UPDATE matieres_premieres SET code_douanier = $1 WHERE id = $2',
          [normalizedCode, mp.id]
        );
        console.log(`  Matière première ID ${mp.id}: ${mp.code_douanier} -> ${normalizedCode}`);
        mpUpdated++;
      }
    }
    console.log(`  ${mpUpdated} matières premières mises à jour sur ${matieresPremieres.rows.length} total.`);
    
    // 2. Normaliser les codes douaniers des transformations
    console.log('\nNormalisation des codes douaniers des transformations...');
    const transformations = await client.query(
      'SELECT id, code_douanier FROM transformations WHERE code_douanier IS NOT NULL AND code_douanier != \'\''
    );
    
    let transUpdated = 0;
    for (const trans of transformations.rows) {
      const normalizedCode = normalizeCustomsCode(trans.code_douanier);
      if (normalizedCode !== trans.code_douanier) {
        await client.query(
          'UPDATE transformations SET code_douanier = $1 WHERE id = $2',
          [normalizedCode, trans.id]
        );
        console.log(`  Transformation ID ${trans.id}: ${trans.code_douanier} -> ${normalizedCode}`);
        transUpdated++;
      }
    }
    console.log(`  ${transUpdated} transformations mises à jour sur ${transformations.rows.length} total.`);
    
    // 3. Normaliser les codes douaniers des semi-finis
    console.log('\nNormalisation des codes douaniers des semi-finis...');
    const semiFinis = await client.query(
      'SELECT id, code_douanier FROM semi_finis WHERE code_douanier IS NOT NULL AND code_douanier != \'\''
    );
    
    let sfUpdated = 0;
    for (const sf of semiFinis.rows) {
      const normalizedCode = normalizeCustomsCode(sf.code_douanier);
      if (normalizedCode !== sf.code_douanier) {
        await client.query(
          'UPDATE semi_finis SET code_douanier = $1 WHERE id = $2',
          [normalizedCode, sf.id]
        );
        console.log(`  Semi-fini ID ${sf.id}: ${sf.code_douanier} -> ${normalizedCode}`);
        sfUpdated++;
      }
    }
    console.log(`  ${sfUpdated} semi-finis mis à jour sur ${semiFinis.rows.length} total.`);
    
    // 4. Normaliser les codes douaniers des produits finis
    console.log('\nNormalisation des codes douaniers des produits finis...');
    const produitsFinis = await client.query(
      'SELECT id, code_douanier FROM produits_finis WHERE code_douanier IS NOT NULL AND code_douanier != \'\''
    );
    
    let pfUpdated = 0;
    for (const pf of produitsFinis.rows) {
      const normalizedCode = normalizeCustomsCode(pf.code_douanier);
      if (normalizedCode !== pf.code_douanier) {
        await client.query(
          'UPDATE produits_finis SET code_douanier = $1 WHERE id = $2',
          [normalizedCode, pf.id]
        );
        console.log(`  Produit fini ID ${pf.id}: ${pf.code_douanier} -> ${normalizedCode}`);
        pfUpdated++;
      }
    }
    console.log(`  ${pfUpdated} produits finis mis à jour sur ${produitsFinis.rows.length} total.`);
    
    // Résumé
    const totalUpdated = mpUpdated + transUpdated + sfUpdated + pfUpdated;
    const totalChecked = matieresPremieres.rows.length + transformations.rows.length + 
                         semiFinis.rows.length + produitsFinis.rows.length;
    
    console.log('\nRésumé de la normalisation:');
    console.log(`  Total des entrées vérifiées: ${totalChecked}`);
    console.log(`  Total des entrées mises à jour: ${totalUpdated}`);
    console.log('Normalisation des codes douaniers terminée avec succès!');
    
  } catch (error) {
    console.error('Erreur lors de la normalisation des codes douaniers:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Exécuter la fonction principale
normalizeAllCustomsCodes().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
