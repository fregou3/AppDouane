/**
 * Script pour lister les bases de données vectorielles disponibles
 */

// Accéder à la variable globale qui stocke les bases de données vectorielles
if (!global.vectorStores) {
  console.log('Aucune base de données vectorielle n\'est actuellement disponible.');
  process.exit(0);
}

console.log('=== BASES DE DONNÉES VECTORIELLES DISPONIBLES ===');
console.log('');

const vectorStores = Object.keys(global.vectorStores);

if (vectorStores.length === 0) {
  console.log('Aucune base de données vectorielle n\'est actuellement disponible.');
  process.exit(0);
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
