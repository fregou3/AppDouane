/**
 * Nettoie une chaîne de caractères en remplaçant les caractères spéciaux mal encodés
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} La chaîne nettoyée
 */
function cleanSpecialCharacters(str) {
    if (!str) return str;

    // Map de remplacement simple (sans regex)
    const replacements = {
        'Ãé': 'é',
        'Ã¨': 'è',
        'Ã': 'à',
        'Ã¢': 'â',
        'Ã®': 'î',
        'Ã´': 'ô',
        'Ã»': 'û',
        'Ã«': 'ë',
        'Ã¯': 'ï',
        'Ã¼': 'ü',
        'Ã§': 'ç'
    };

    let cleanedStr = str;

    // Remplacement des caractères mal encodés
    Object.entries(replacements).forEach(([incorrect, correct]) => {
        cleanedStr = cleanedStr.split(incorrect).join(correct);
    });

    // Remplacement des ?? par leurs équivalents
    cleanedStr = cleanedStr
        .replace(/\?\?/g, 'é')  // Premier cas le plus commun
        .replace(/é\?/g, 'é')   // Cas particulier
        .replace(/\?é/g, 'é');  // Cas particulier

    return cleanedStr;
}

module.exports = {
    cleanSpecialCharacters
};
