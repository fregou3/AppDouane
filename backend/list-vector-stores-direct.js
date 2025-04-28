/**
 * Script pour lister les bases de données vectorielles directement depuis le serveur
 * Ce script doit être exécuté dans le contexte du serveur
 */

// Charger les variables d'environnement
require('dotenv').config();

// Créer une fonction pour lister les bases de données vectorielles
function listVectorStores() {
  // Vérifier si la variable globale existe
  if (typeof global.vectorStores === 'undefined' || global.vectorStores === null) {
    console.log('Aucune base de données vectorielle n\'est disponible dans la mémoire du serveur.');
    console.log('Le serveur doit être démarré et au moins un document doit avoir été analysé.');
    return;
  }
  
  const vectorStores = Object.keys(global.vectorStores);
  
  console.log('\n=== BASES DE DONNÉES VECTORIELLES EN MÉMOIRE ===\n');
  
  if (vectorStores.length === 0) {
    console.log('Aucune base de données vectorielle n\'est actuellement disponible.');
    return;
  }
  
  // Créer un tableau d'objets contenant les informations sur chaque base de données
  const vectorStoresList = vectorStores.map(name => {
    // Extraire le nom du fichier à partir du nom de la collection
    const fileNameParts = name.split('_');
    // Retirer le timestamp de la fin
    const fileName = fileNameParts.slice(0, -1).join('_');
    const timestamp = parseInt(fileNameParts[fileNameParts.length - 1]);
    
    return {
      id: name,
      fileName: fileName,
      createdAt: timestamp,
      displayName: `${fileName} (${new Date(timestamp).toLocaleString()})`
    };
  });
  
  // Trier les bases de données par date de création (plus récentes en premier)
  vectorStoresList.sort((a, b) => b.createdAt - a.createdAt);
  
  // Afficher les informations sur chaque base de données
  vectorStoresList.forEach((store, index) => {
    console.log(`${index + 1}. ID: ${store.id}`);
    console.log(`   Nom du fichier: ${store.fileName}`);
    console.log(`   Créé le: ${new Date(store.createdAt).toLocaleString()}`);
    console.log('');
  });
  
  console.log(`Total: ${vectorStoresList.length} base(s) de données vectorielle(s)`);
}

// Exporter la fonction pour qu'elle puisse être utilisée dans le serveur
module.exports = listVectorStores;

// Si le script est exécuté directement, afficher un message d'information
if (require.main === module) {
  console.log('Ce script doit être importé dans le serveur pour fonctionner correctement.');
  console.log('Ajoutez le code suivant au fichier server.js :');
  console.log('\nconst listVectorStores = require(\'./list-vector-stores-direct\');');
  console.log('// Puis, pour lister les bases de données :');
  console.log('listVectorStores();');
}
