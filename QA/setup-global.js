/**
 * Configuration globale pour Jest
 * Ce script est exécuté une seule fois avant tous les tests
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = async () => {
  console.log('Exécution de la configuration globale avant les tests...');
  
  try {
    // Exécuter le script de configuration des tests
    const { stdout, stderr } = await execPromise('node setup-tests.js', { 
      cwd: process.cwd() 
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Configuration globale terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la configuration globale:', error);
    // Ne pas faire échouer les tests si la configuration échoue
    // Les tests individuels géreront leurs propres erreurs
  }
};
