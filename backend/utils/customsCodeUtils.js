/**
 * Utilitaires pour la gestion des codes douaniers
 */

/**
 * Normalise un code douanier pour qu'il soit sur 8 chiffres maximum
 * Nettoie le code en supprimant tous les caractères non numériques
 * Limite le code à 8 chiffres maximum
 * @param {string} code - Le code douanier à normaliser
 * @returns {string} Le code douanier normalisé
 */
function normalizeCustomsCode(code) {
  if (!code) return null;
  
  try {
    // Convertir en chaîne si ce n'est pas déjà le cas
    code = String(code);
    
    // Supprimer les espaces
    code = code.trim();
    
    // Supprimer tous les caractères non numériques (points, espaces, etc.)
    code = code.replace(/[^\d]/g, '');
    
    // Si le code est vide après nettoyage, retourner null
    if (!code) return null;
    
    // Limiter à 8 chiffres maximum
    if (code.length > 8) {
      code = code.substring(0, 8);
    }
    
    return code;
  } catch (error) {
    console.error('Erreur lors de la normalisation du code douanier:', error);
    return null;
  }
}

module.exports = {
  normalizeCustomsCode
};
