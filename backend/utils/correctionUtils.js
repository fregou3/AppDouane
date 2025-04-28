// Utilitaires pour gérer les corrections de codes douaniers
const customsCodeCorrections = [];

/**
 * Ajoute une nouvelle correction de code douanier
 * @param {string} description - Description du produit
 * @param {string} correctedCode - Code douanier corrigé (8 chiffres)
 * @param {Object} originalResults - Résultats originaux des moteurs
 * @returns {Object} - La correction ajoutée
 */
function addCorrection(description, correctedCode, originalResults) {
  const correction = {
    id: Date.now().toString(), // Utiliser un timestamp comme ID unique
    description,
    correctedCode,
    originalResults,
    timestamp: new Date()
  };
  
  customsCodeCorrections.push(correction);
  
  // Limiter le nombre de corrections stockées (garder les 100 plus récentes)
  if (customsCodeCorrections.length > 100) {
    customsCodeCorrections.shift(); // Supprimer la plus ancienne
  }
  
  return correction;
}

/**
 * Réinitialise toutes les corrections (supprime toutes les corrections stockées)
 * @returns {number} - Le nombre de corrections supprimées
 */
function resetAllCorrections() {
  const count = customsCodeCorrections.length;
  customsCodeCorrections.length = 0; // Vider le tableau
  return count;
}

/**
 * Récupère toutes les corrections stockées
 * @returns {Array} - Liste de toutes les corrections
 */
function getAllCorrections() {
  return [...customsCodeCorrections]; // Retourner une copie pour éviter les modifications directes
}

/**
 * Supprime une correction spécifique par son ID
 * @param {string} id - ID de la correction à supprimer
 * @returns {boolean} - true si la correction a été trouvée et supprimée, false sinon
 */
function deleteCorrection(id) {
  const initialLength = customsCodeCorrections.length;
  const index = customsCodeCorrections.findIndex(correction => correction.id === id);
  
  if (index !== -1) {
    customsCodeCorrections.splice(index, 1);
    return true;
  }
  
  return false;
}

/**
 * Trouve des corrections similaires à une description donnée
 * @param {string} description - Description du produit
 * @param {number} limit - Nombre maximum de corrections à retourner
 * @returns {Array} - Liste des corrections similaires
 */
function findSimilarCorrections(description, limit = 3) {
  // Convertir la description en minuscules pour la comparaison
  const lowerDescription = description.toLowerCase();
  
  // Rechercher des mots-clés similaires dans les descriptions des corrections
  return customsCodeCorrections
    .filter(correction => {
      const correctionDesc = correction.description.toLowerCase();
      // Vérifier si des mots-clés de la description actuelle se trouvent dans la correction
      const words = lowerDescription.split(/\s+/).filter(word => word.length > 3);
      return words.some(word => correctionDesc.includes(word));
    })
    .sort((a, b) => b.timestamp - a.timestamp) // Trier par date (plus récent d'abord)
    .slice(0, limit); // Limiter le nombre de résultats
}

/**
 * Génère un prompt amélioré avec des exemples de corrections
 * @param {string} basePrompt - Prompt de base
 * @param {string} description - Description du produit
 * @param {string} engine - Moteur de recherche (gpt, claude, deepseek)
 * @returns {string} - Prompt amélioré
 */
function generateEnhancedPrompt(basePrompt, description, engine) {
  // Trouver des corrections similaires
  const similarCorrections = findSimilarCorrections(description);
  
  if (similarCorrections.length === 0) {
    return basePrompt; // Aucune correction similaire trouvée, utiliser le prompt de base
  }
  
  // Ajouter des exemples de corrections au prompt
  let enhancedPrompt = basePrompt + "\n\nEXEMPLES DE RÉFÉRENCE:";
  
  similarCorrections.forEach(correction => {
    enhancedPrompt += `\nPour un produit décrit comme "${correction.description}", le code SH correct est ${correction.correctedCode}.`;
  });
  
  enhancedPrompt += "\n\nUtilise ces exemples comme référence pour améliorer ta classification, mais n'applique pas automatiquement ces codes sans analyse appropriée du produit actuel.";
  
  return enhancedPrompt;
}

module.exports = {
  addCorrection,
  resetAllCorrections,
  getAllCorrections,
  deleteCorrection,
  findSimilarCorrections,
  generateEnhancedPrompt
};
