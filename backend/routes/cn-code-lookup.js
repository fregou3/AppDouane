const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// Chemin vers le fichier CSV
const csvFilePath = path.join(__dirname, '..', '..', 'CN2025_SML_CLEAN.csv');

// Fonction pour trouver les niveaux hiérarchiques précédents
const findHierarchy = async (cnCode) => {
  return new Promise((resolve, reject) => {
    // Stocker tous les résultats pour les traiter plus tard
    const allEntries = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        separator: ';',
        headers: ['CNKEY', 'CN_CODE', 'LEVEL', 'NAME_FR'],
        skipLines: 1
      }))
      .on('data', (data) => {
        allEntries.push(data);
      })
      .on('end', () => {
        // Trier les entrées par CNKEY pour respecter l'ordre du fichier
        allEntries.sort((a, b) => a.CNKEY.localeCompare(b.CNKEY));
        
        // Trouver les entrées correspondant au code CN
        const exactMatches = allEntries.filter(entry => entry.CN_CODE === cnCode);
        
        if (exactMatches.length === 0) {
          // Si pas de correspondance exacte, chercher des correspondances partielles
          const partialMatches = allEntries.filter(entry => 
            entry.CN_CODE && entry.CN_CODE.startsWith(cnCode)
          );
          
          if (partialMatches.length > 0) {
            // Trier les correspondances partielles par CNKEY
            partialMatches.sort((a, b) => a.CNKEY.localeCompare(b.CNKEY));
            
            // Pour chaque correspondance partielle, trouver sa hiérarchie
            const hierarchies = partialMatches.map(match => {
              const matchIndex = allEntries.findIndex(entry => entry.CNKEY === match.CNKEY);
              if (matchIndex === -1) return [match];
              
              const hierarchy = [match];
              const currentLevel = parseInt(match.LEVEL);
              
              // Remonter dans le tableau pour trouver les niveaux précédents
              let prevIndex = matchIndex - 1;
              while (prevIndex >= 0) {
                const prevEntry = allEntries[prevIndex];
                const prevLevel = parseInt(prevEntry.LEVEL);
                
                // Si on trouve un niveau supérieur qui n'est pas déjà dans la hiérarchie
                if (prevLevel < currentLevel && !hierarchy.some(h => parseInt(h.LEVEL) === prevLevel)) {
                  hierarchy.unshift(prevEntry);
                  
                  // Si on a trouvé le niveau 1, on peut arrêter
                  if (prevLevel === 1) break;
                }
                
                prevIndex--;
              }
              
              return hierarchy;
            });
            
            resolve(hierarchies);
          } else {
            resolve([]);
          }
        } else {
          // Pour chaque correspondance exacte, trouver sa hiérarchie
          const hierarchies = exactMatches.map(match => {
            const matchIndex = allEntries.findIndex(entry => entry.CNKEY === match.CNKEY);
            if (matchIndex === -1) return [match];
            
            const hierarchy = [match];
            const currentLevel = parseInt(match.LEVEL);
            
            // Remonter dans le tableau pour trouver les niveaux précédents
            let prevIndex = matchIndex - 1;
            while (prevIndex >= 0) {
              const prevEntry = allEntries[prevIndex];
              const prevLevel = parseInt(prevEntry.LEVEL);
              
              // Si on trouve un niveau supérieur qui n'est pas déjà dans la hiérarchie
              if (prevLevel < currentLevel && !hierarchy.some(h => parseInt(h.LEVEL) === prevLevel)) {
                hierarchy.unshift(prevEntry);
                
                // Si on a trouvé le niveau 1, on peut arrêter
                if (prevLevel === 1) break;
              }
              
              prevIndex--;
            }
            
            return hierarchy;
          });
          
          resolve(hierarchies);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Route pour rechercher un code douane dans le fichier CSV
router.get('/lookup/:code', async (req, res) => {
  const cnCode = req.params.code.trim();
  
  if (!cnCode) {
    return res.status(400).json({ error: 'Code douane non spécifié' });
  }

  try {
    const hierarchies = await findHierarchy(cnCode);
    
    if (hierarchies.length > 0) {
      return res.json(hierarchies);
    } else {
      return res.status(404).json({ error: 'Code douane non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche du code douane:', error);
    return res.status(500).json({ error: 'Erreur lors de la recherche du code douane' });
  }
});

module.exports = router;
