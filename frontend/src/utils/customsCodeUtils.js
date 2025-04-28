/**
 * Utilitaires pour la gestion des codes douaniers dans le frontend
 */

/**
 * Normalise un code douanier pour qu'il soit sur 8 chiffres
 * Si le code est sur 6 chiffres, ajoute "00" à la fin
 * Si le code contient un point, le supprime avant de normaliser
 * @param {string} code - Le code douanier à normaliser
 * @returns {string} Le code douanier normalisé
 */
export function normalizeCustomsCode(code) {
  if (!code) return '';
  
  // Supprimer les espaces
  code = code.trim();
  
  // Remplacer les points par rien
  code = code.replace(/\./g, '');
  
  // Si le code est sur 6 chiffres, ajouter "00" à la fin
  if (code.length === 6 && /^\d+$/.test(code)) {
    return code + '00';
  }
  
  // Si le code est déjà sur 8 chiffres ou plus, le retourner tel quel
  return code;
}

/**
 * Formate un code douanier pour l'affichage (ajoute un point après les 4 premiers chiffres)
 * @param {string} code - Le code douanier à formater
 * @returns {string} Le code douanier formaté
 */
export function formatCustomsCode(code) {
  if (!code) return '';
  
  // Normaliser d'abord le code
  const normalizedCode = normalizeCustomsCode(code);
  
  // Si le code a au moins 4 chiffres, ajouter un point après les 4 premiers chiffres
  if (normalizedCode.length >= 4) {
    return normalizedCode.substring(0, 4) + '.' + normalizedCode.substring(4);
  }
  
  return normalizedCode;
}

/**
 * Extrait les codes douaniers potentiels d'un texte
 * @param {string} text - Le texte contenant des codes douaniers
 * @returns {string[]} Un tableau de codes douaniers extraits
 */
export function extractCustomsCodes(text) {
  if (!text) return [];
  
  try {
    const codes = new Set();
    // Utiliser une regex plus robuste pour extraire les codes douaniers
    const regex = /\b\d{1,4}(?:\.\d{1,2})?\b/g;
    const matches = text.match(regex) || [];
    matches.forEach(code => {
      // Normaliser chaque code avant de l'ajouter
      codes.add(normalizeCustomsCode(code));
    });
    return Array.from(codes);
  } catch (error) {
    console.error('Erreur lors de l\'extraction des codes:', error);
    return [];
  }
}
