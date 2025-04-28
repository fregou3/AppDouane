// Script pour mettre à jour la route /api/analyse-documents dans server.js
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier server.js
const serverFilePath = path.join(__dirname, 'server.js');

// Lire le contenu du fichier
fs.readFile(serverFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier server.js:', err);
    return;
  }

  // Rechercher la section qui formate les résultats dans la route /api/analyse-documents
  const targetPattern = /const formattedResults = results\.map\(result => \(\{\s*nom: result\.designation \|\| 'Matière première',/;
  
  // Remplacer par une version qui utilise cleanProductName
  const replacement = `const formattedResults = results.map(result => ({
      nom: cleanProductName(result.designation),`;
  
  // Effectuer le remplacement
  const updatedContent = data.replace(targetPattern, replacement);
  
  // Vérifier si le remplacement a été effectué
  if (data === updatedContent) {
    console.error('Aucun remplacement effectué. Le motif n\'a pas été trouvé.');
    return;
  }
  
  // Écrire le contenu mis à jour dans le fichier
  fs.writeFile(serverFilePath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Erreur lors de l\'écriture du fichier server.js:', err);
      return;
    }
    console.log('Le fichier server.js a été mis à jour avec succès.');
  });
});
