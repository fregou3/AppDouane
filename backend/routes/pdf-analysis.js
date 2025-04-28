const fs = require('fs');
const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const router = express.Router();
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { Document } = require('langchain/document');

// Définir le répertoire pour les fichiers temporaires
const UPLOADS_DIRECTORY = path.join(__dirname, '../uploads');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(UPLOADS_DIRECTORY)) {
  fs.mkdirSync(UPLOADS_DIRECTORY, { recursive: true });
  console.log(`Répertoire uploads créé: ${UPLOADS_DIRECTORY}`);
}

// Définir le répertoire pour ChromaDB
const CHROMA_DIRECTORY = path.join(__dirname, '../chroma-db');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(CHROMA_DIRECTORY)) {
  fs.mkdirSync(CHROMA_DIRECTORY, { recursive: true });
  console.log(`Répertoire ChromaDB créé: ${CHROMA_DIRECTORY}`);
}

// Configuration de multer pour le téléchargement de fichiers
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10 Mo
});

/**
 * Extrait le texte d'un fichier PDF
 * @param {string} filePath - Chemin vers le fichier PDF
 * @returns {Promise<string>} - Texte extrait du PDF
 */
const extractTextFromPDF = async (filePath) => {
  try {
    // Lire le fichier PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extraire le texte du PDF
    const data = await pdfParse(dataBuffer);
    
    return data.text;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du PDF:', error);
    throw new Error('Impossible d\'extraire le texte du PDF');
  }
};

/**
 * Extrait les codes douaniers de différentes longueurs d'un texte avec des informations détaillées
 * @param {string} text - Texte à analyser
 * @returns {Array} - Liste des codes douaniers trouvés avec leurs détails
 */
const extractCustomsCodes = (text) => {
  if (!text) return [];
  
  // Normaliser le texte pour faciliter la détection
  const normalizedText = text.replace(/\s+/g, ' ');
  
  // Regex pour détecter les codes douaniers de différentes longueurs (4, 6, 8, 10 chiffres)
  // Format: XXXX XX XX XX où X est un chiffre, avec des espaces optionnels entre les groupes
  const codeRegex = /\b(\d{4}(?:\s?\d{2}){0,3})\b/g;
  
  // Regex pour détecter les colonnes "Codes NC" et "Désignation des marchandises"
  const columnHeaderRegex = /\b(Codes?\s*NC|Code\s*douanier|Nomenclature\s*combinée)\b.*?\b(Désignation\s*des\s*marchandises|Description|Libellé)\b/i;
  
  // Vérifier si le texte contient des en-têtes de colonnes
  const hasColumnHeaders = columnHeaderRegex.test(normalizedText);
  
  const codes = [];
  let match;
  
  // Trouver tous les codes douaniers potentiels
  while ((match = codeRegex.exec(normalizedText)) !== null) {
    const fullMatch = match[0];
    const codePosition = match.index;
    
    // Normaliser le format du code (supprimer les espaces)
    const normalizedCode = fullMatch.replace(/\s+/g, '');
    
    // Vérifier si le code a une longueur valide (4, 6, 8 ou 10 chiffres)
    if ([4, 6, 8, 10].includes(normalizedCode.length)) {
      // Formater le code avec des espaces pour une meilleure lisibilité
      let formattedCode;
      if (normalizedCode.length === 4) {
        formattedCode = normalizedCode;
      } else if (normalizedCode.length === 6) {
        formattedCode = `${normalizedCode.substring(0, 4)} ${normalizedCode.substring(4, 6)}`;
      } else if (normalizedCode.length === 8) {
        formattedCode = `${normalizedCode.substring(0, 4)} ${normalizedCode.substring(4, 6)} ${normalizedCode.substring(6, 8)}`;
      } else { // 10 chiffres
        formattedCode = `${normalizedCode.substring(0, 4)} ${normalizedCode.substring(4, 6)} ${normalizedCode.substring(6, 8)} ${normalizedCode.substring(8, 10)}`;
      }
      
      // Extraire le contexte autour du code
      const context = extractContext(normalizedText, codePosition);
      
      // Extraire la désignation des marchandises associée au code
      const designation = hasColumnHeaders 
        ? extractDesignationFromColumns(normalizedText, codePosition, normalizedCode) 
        : extractDescription(context, formattedCode);
      
      // Ajouter le code à la liste
      codes.push({
        code: formattedCode,
        context: context,
        position: codePosition,
        designation: designation,
        // Identifier le niveau du code (4, 6 ou 8 chiffres)
        level: normalizedCode.length === 4 ? 'section' : 
               normalizedCode.length === 6 ? 'sous-section' : 
               normalizedCode.length === 8 ? 'position' : 'sous-position',
        fullMatch: fullMatch,
        normalizedCode: normalizedCode
      });
    }
  }
  
  // Organiser les codes par hiérarchie
  return organizeCodesByHierarchy(codes);
};

/**
 * Extrait la désignation des marchandises à partir d'une structure en colonnes
 * @param {string} text - Texte complet
 * @param {number} codePosition - Position du code dans le texte
 * @param {string} normalizedCode - Code normalisé (sans espaces)
 * @returns {string} - Désignation des marchandises
 */
const extractDesignationFromColumns = (text, codePosition, normalizedCode) => {
  // Rechercher la désignation après le code
  // Différentes stratégies selon la longueur du code
  
  // 1. Rechercher un modèle où le code est suivi d'un espace puis de la désignation
  const afterCodeRegex = new RegExp(`${normalizedCode}\\s+([^\\d\\n]{10,}?)(?=\\n|\\d{4}|$)`, 'i');
  const afterCodeMatch = text.substr(codePosition).match(afterCodeRegex);
  
  if (afterCodeMatch && afterCodeMatch[1] && afterCodeMatch[1].trim().length > 5) {
    return cleanDesignation(afterCodeMatch[1]);
  }
  
  // 2. Rechercher un modèle de tableau avec colonnes
  const tableRowRegex = new RegExp(`(^|\\n)\\s*${normalizedCode}\\s+([^\\n]+)`, 'i');
  const tableRowMatch = text.match(tableRowRegex);
  
  if (tableRowMatch && tableRowMatch[2] && tableRowMatch[2].trim().length > 5) {
    return cleanDesignation(tableRowMatch[2]);
  }
  
  // 3. Rechercher dans une fenêtre plus large autour du code
  const windowSize = 200;
  const start = Math.max(0, codePosition - 10);
  const end = Math.min(text.length, codePosition + windowSize);
  const contextWindow = text.substring(start, end);
  
  // Rechercher tout texte qui pourrait être une désignation après le code
  const designationRegex = new RegExp(`${normalizedCode}\\s*[-–—:\\s]\\s*([^\\d\\n]{5,}?)(?=\\n|\\d{4}|$)`, 'i');
  const designationMatch = contextWindow.match(designationRegex);
  
  if (designationMatch && designationMatch[1] && designationMatch[1].trim().length > 5) {
    return cleanDesignation(designationMatch[1]);
  }
  
  // Si aucune désignation n'est trouvée, retourner une chaîne vide
  return '';
};

/**
 * Nettoie une désignation de marchandises
 * @param {string} designation - Désignation brute
 * @returns {string} - Désignation nettoyée
 */
const cleanDesignation = (designation) => {
  if (!designation) return '';
  
  // Supprimer les caractères spéciaux et les espaces multiples
  let cleaned = designation.trim()
    .replace(/[.]{2,}/g, '') // Supprimer les séries de points
    .replace(/[-]{2,}/g, '') // Supprimer les séries de tirets
    .replace(/\s+/g, ' ')    // Remplacer les espaces multiples par un seul espace
    .replace(/^\s*[-–—:]\s*/, '') // Supprimer les tirets ou deux-points au début
    .replace(/\s*[-–—:]\s*$/, ''); // Supprimer les tirets ou deux-points à la fin
  
  return cleaned;
};

/**
 * Organise les codes douaniers par hiérarchie (4, 6, 8 chiffres)
 * @param {Array} codes - Liste des codes douaniers
 * @returns {Array} - Liste organisée des codes douaniers
 */
const organizeCodesByHierarchy = (codes) => {
  // Créer un dictionnaire pour organiser les codes par niveau
  const codesByLevel = {
    sections: [], // Codes à 4 chiffres
    subsections: [], // Codes à 6 chiffres
    positions: [], // Codes à 8 chiffres
    subpositions: [] // Codes à 10 chiffres
  };
  
  // Trier les codes par position dans le texte
  const sortedCodes = [...codes].sort((a, b) => a.position - b.position);
  
  // Classifier les codes par niveau
  sortedCodes.forEach(code => {
    const normalizedCode = code.normalizedCode;
    
    if (normalizedCode.length === 4) {
      codesByLevel.sections.push(code);
    } else if (normalizedCode.length === 6) {
      codesByLevel.subsections.push(code);
    } else if (normalizedCode.length === 8) {
      codesByLevel.positions.push(code);
    } else if (normalizedCode.length === 10) {
      codesByLevel.subpositions.push(code);
    }
  });
  
  // Établir les relations hiérarchiques
  const hierarchicalCodes = [];
  
  // Traiter d'abord les sections (codes à 4 chiffres)
  codesByLevel.sections.forEach(section => {
    const sectionCode = section.normalizedCode;
    
    // Trouver toutes les sous-sections liées à cette section
    const relatedSubsections = codesByLevel.subsections.filter(subsection => {
      const subsectionCode = subsection.normalizedCode;
      return subsectionCode.startsWith(sectionCode);
    });
    
    // Trouver toutes les positions liées à cette section
    const relatedPositions = codesByLevel.positions.filter(position => {
      const positionCode = position.normalizedCode;
      return positionCode.startsWith(sectionCode);
    });
    
    // Ajouter la section avec ses sous-sections et positions
    hierarchicalCodes.push({
      ...section,
      subsections: relatedSubsections,
      positions: relatedPositions
    });
  });
  
  // Ajouter les codes qui n'ont pas été inclus dans la hiérarchie
  const processedCodes = new Set();
  hierarchicalCodes.forEach(section => {
    processedCodes.add(section.code);
    section.subsections.forEach(subsection => processedCodes.add(subsection.code));
    section.positions.forEach(position => processedCodes.add(position.code));
  });
  
  // Ajouter les codes non traités
  sortedCodes.forEach(code => {
    if (!processedCodes.has(code.code)) {
      hierarchicalCodes.push(code);
    }
  });
  
  return hierarchicalCodes;
};

/**
 * Extrait la description d'un produit à partir du contexte
 * @param {string} context - Le contexte du code douanier
 * @param {string} code - Le code douanier
 * @returns {string} - La description du produit
 */
const extractDescription = (context, code) => {
  if (!context) return '';
  
  // Supprimer le code du contexte pour éviter qu'il ne soit inclus dans la description
  const contextWithoutCode = context.replace(new RegExp(code.replace(/\s/g, '\\s?'), 'g'), '');
  
  // Rechercher du texte descriptif après le code
  const afterCodeRegex = new RegExp(`${code.replace(/\s/g, '\\s?')}\\s*[-–—:]?\\s*([^.;:]*)[.;:]`, 'i');
  const afterCodeMatch = context.match(afterCodeRegex);
  
  if (afterCodeMatch && afterCodeMatch[1] && afterCodeMatch[1].trim().length > 3) {
    return afterCodeMatch[1].trim();
  }
  
  // Si aucune description n'est trouvée après le code, rechercher dans tout le contexte
  // Rechercher des phrases qui pourraient être des descriptions de produit
  const descriptionRegex = /[-–—:]\s*([^.;:]{5,})[.;:]/g;
  const descriptions = [];
  let descMatch;
  
  while ((descMatch = descriptionRegex.exec(contextWithoutCode)) !== null) {
    if (descMatch[1] && descMatch[1].trim().length > 5) {
      descriptions.push(descMatch[1].trim());
    }
  }
  
  return descriptions.length > 0 ? descriptions[0] : '';
};

/**
 * Extrait les informations sur les droits de douane à partir du contexte
 * @param {string} context - Le contexte du code douanier
 * @returns {string} - Les informations sur les droits de douane
 */
const extractDutyInfo = (context) => {
  if (!context) return '';
  
  // Rechercher des informations sur les droits de douane
  const dutyRegex = /(\d+[,.]\d+\s*%)/i;
  const dutyMatch = context.match(dutyRegex);
  
  if (dutyMatch && dutyMatch[1]) {
    return dutyMatch[1].trim();
  }
  
  // Rechercher des mentions de droits ou taxes
  const taxRegex = /(droit|taxe|taux|duty|rate)\s*:?\s*(\d+[,.]\d+\s*%)/i;
  const taxMatch = context.match(taxRegex);
  
  if (taxMatch && taxMatch[2]) {
    return taxMatch[2].trim();
  }
  
  return '';
};

/**
 * Extrait les informations sur l'unité de mesure à partir du contexte
 * @param {string} context - Le contexte du code douanier
 * @returns {string} - Les informations sur l'unité de mesure
 */
const extractUnitInfo = (context) => {
  if (!context) return '';
  
  // Rechercher des informations sur l'unité de mesure
  const unitRegex = /(kg|m[²³]?|l|pièce|paire|unité|tonne)/i;
  const unitMatch = context.match(unitRegex);
  
  if (unitMatch && unitMatch[1]) {
    return unitMatch[1].trim();
  }
  
  // Rechercher des mentions d'unités supplémentaires
  const suppUnitRegex = /(unité supplémentaire|supplementary unit)\s*:?\s*([a-z0-9]+)/i;
  const suppUnitMatch = context.match(suppUnitRegex);
  
  if (suppUnitMatch && suppUnitMatch[2]) {
    return suppUnitMatch[2].trim();
  }
  
  return '';
};

/**
 * Calcule la pertinence d'un code douanier par rapport à une description de produit
 * @param {object} code - Code douanier avec son contexte
 * @param {string} productDescription - Description du produit
 * @returns {number} - Score de pertinence (0-100)
 */
const calculateRelevance = (code, productDescription) => {
  if (!productDescription || !code.context) return 0;
  
  // Normaliser la description du produit et le contexte pour la comparaison
  const normalizedDescription = productDescription.toLowerCase().trim();
  const normalizedContext = code.context.toLowerCase().trim();
  
  // Extraire les mots-clés de la description du produit (mots de plus de 3 lettres)
  const keywords = normalizedDescription
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  if (keywords.length === 0) return 0;
  
  let score = 0;
  
  // Vérifier la présence de chaque mot-clé dans le contexte
  keywords.forEach(keyword => {
    // Vérifier si le mot-clé exact est présent
    if (normalizedContext.includes(keyword)) {
      // Donner un score plus élevé pour les correspondances exactes
      score += 20;
      
      // Bonus supplémentaire si le mot-clé est proche du code
      const keywordPosition = normalizedContext.indexOf(keyword);
      const codeInContext = code.code.replace(/\s/g, '');
      const codePosition = normalizedContext.indexOf(codeInContext);
      
      if (codePosition !== -1 && Math.abs(keywordPosition - codePosition) < 50) {
        score += 10;
      }
    }
    // Vérifier les correspondances partielles
    else if (normalizedContext.includes(keyword.substring(0, keyword.length - 1))) {
      score += 5;
    }
  });
  
  // Ajuster le score en fonction de termes spécifiques
  const specificTerms = {
    'bois': ['bois', 'wooden', 'timber', 'wood'],
    'métal': ['métal', 'metal', 'acier', 'steel', 'aluminium', 'aluminum'],
    'plastique': ['plastique', 'plastic', 'pvc'],
    'textile': ['textile', 'tissu', 'fabric', 'coton', 'cotton', 'lin', 'linen'],
    'cuir': ['cuir', 'leather'],
    'verre': ['verre', 'glass'],
    'céramique': ['céramique', 'ceramic', 'porcelaine', 'porcelain']
  };
  
  // Vérifier si la description du produit contient des termes spécifiques
  Object.entries(specificTerms).forEach(([category, terms]) => {
    const descriptionHasTerm = terms.some(term => normalizedDescription.includes(term));
    const contextHasTerm = terms.some(term => normalizedContext.includes(term));
    
    // Si la description et le contexte contiennent des termes de la même catégorie, augmenter le score
    if (descriptionHasTerm && contextHasTerm) {
      score += 15;
    }
    // Si la description contient un terme mais pas le contexte, réduire le score
    else if (descriptionHasTerm && !contextHasTerm) {
      score -= 10;
    }
  });
  
  // Normaliser le score sur 100
  score = Math.min(100, Math.max(0, score));
  
  return score;
};

/**
 * Fonction pour filtrer les codes par pertinence
 */
const filterCodesByRelevance = (codes, productDescription) => {
  if (!productDescription || !codes || codes.length === 0) {
    return codes;
  }
  
  const normalizedDescription = productDescription.toLowerCase().trim();
  
  // Définir un seuil de pertinence en fonction de la description du produit
  let relevanceThreshold = 30; // Seuil par défaut
  
  // Ajuster le seuil pour certains types de produits
  const specificProducts = {
    'chaise': { threshold: 25, maxResults: 10 },
    'table': { threshold: 25, maxResults: 10 },
    'meuble': { threshold: 25, maxResults: 10 },
    'bois': { threshold: 25, maxResults: 15 },
    'parquet': { threshold: 20, maxResults: 10 },
    'textile': { threshold: 30, maxResults: 10 },
    'vêtement': { threshold: 30, maxResults: 10 },
    'machine': { threshold: 35, maxResults: 8 },
    'électronique': { threshold: 35, maxResults: 8 },
    'chimique': { threshold: 40, maxResults: 8 }
  };
  
  // Vérifier si la description correspond à un produit spécifique
  let maxResults = 10; // Nombre maximum de résultats par défaut
  
  for (const [product, settings] of Object.entries(specificProducts)) {
    if (normalizedDescription.includes(product)) {
      relevanceThreshold = settings.threshold;
      maxResults = settings.maxResults;
      break;
    }
  }
  
  // Cas spécial pour le parquet
  const parquetCodes = ['4407', '4409', '4418'];
  if (normalizedDescription.includes('parquet')) {
    const highlyRelevantCodes = codes.filter(item => 
      parquetCodes.some(code => item.code.startsWith(code)) && 
      item.relevance >= relevanceThreshold
    );
    
    if (highlyRelevantCodes.length > 0) {
      return highlyRelevantCodes
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);
    }
  }
  
  // Filtrer les codes par pertinence et limiter le nombre de résultats
  return codes
    .filter(item => item.relevance >= relevanceThreshold)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
};

/**
 * Fonction pour organiser les résultats en catégories
 */
const categorizeResults = (codes, productDescription) => {
  if (!codes || codes.length === 0) {
    return [];
  }
  
  // Organiser les codes par chapitre (les deux premiers chiffres)
  const chapterMap = {};
  
  codes.forEach(code => {
    const chapter = code.code.substring(0, 2);
    if (!chapterMap[chapter]) {
      chapterMap[chapter] = [];
    }
    chapterMap[chapter].push(code);
  });
  
  // Convertir en tableau de catégories
  const categories = Object.entries(chapterMap).map(([chapter, codes]) => {
    // Trouver le code le plus pertinent pour cette catégorie
    const mostRelevantCode = codes.reduce((prev, current) => 
      (current.relevance > prev.relevance) ? current : prev, codes[0]);
    
    return {
      chapter,
      title: `Chapitre ${chapter}`,
      description: mostRelevantCode.description || '',
      codes: codes.sort((a, b) => b.relevance - a.relevance)
    };
  });
  
  // Trier les catégories par pertinence du code le plus pertinent de chaque catégorie
  return categories.sort((a, b) => {
    const maxRelevanceA = Math.max(...a.codes.map(code => code.relevance));
    const maxRelevanceB = Math.max(...b.codes.map(code => code.relevance));
    return maxRelevanceB - maxRelevanceA;
  });
};

/**
 * Fonction pour générer un résumé explicatif des codes douaniers
 */
const generateExplanatoryResult = (codes, productDescription) => {
  if (!codes || codes.length === 0 || !productDescription) {
    return null;
  }

  const normalizedDescription = productDescription.toLowerCase().trim();
  
  // Dictionnaire des produits connus et leurs explications
  const productExplanations = {
    'chaise': {
      chapter: '94',
      mainPosition: '9401',
      title: 'Sièges (autres que ceux du n° 9402), même transformables en lits, et leurs parties',
      variants: [
        { 
          code: '9401 91', 
          description: 'en bois' 
        },
        { 
          code: '9401 80', 
          description: 'en plastique ou en métal' 
        },
        { 
          code: '9401 99 20', 
          description: 'pour un usage automobile ou aérien' 
        },
        { 
          code: '9402', 
          description: 'pour salon de coiffure ou médical' 
        }
      ],
      conclusion: 'Pour une chaise standard domestique ou de bureau non spécifique à un usage médical ou automobile, 9401 99 80 est généralement le bon code.'
    },
    'parquet': {
      chapter: '44',
      mainPosition: '4407, 4409, 4418',
      title: 'Bois et ouvrages en bois',
      variants: [
        { 
          code: '4407 91', 
          description: 'Lames et frises en chêne, non assemblées' 
        },
        { 
          code: '4409 29', 
          description: 'Lames et frises à parquet profilées, non assemblées' 
        },
        { 
          code: '4418 73', 
          description: 'Panneaux assemblés pour revêtement de sol en bambou' 
        },
        { 
          code: '4418 75', 
          description: 'Panneaux assemblés pour revêtement de sol multicouches' 
        }
      ],
      conclusion: 'Pour du parquet en chêne massif non assemblé, utilisez le code 4407 91. Pour du parquet stratifié multicouche assemblé, utilisez plutôt le code 4418 75.'
    },
    'meuble': {
      chapter: '94',
      mainPosition: '9403',
      title: 'Autres meubles et leurs parties',
      variants: [
        { 
          code: '9403 30', 
          description: 'Meubles en bois des types utilisés dans les bureaux' 
        },
        { 
          code: '9403 40', 
          description: 'Meubles en bois des types utilisés dans les cuisines' 
        },
        { 
          code: '9403 50', 
          description: 'Meubles en bois des types utilisés dans les chambres à coucher' 
        },
        { 
          code: '9403 60', 
          description: 'Autres meubles en bois' 
        },
        { 
          code: '9403 70', 
          description: 'Meubles en matières plastiques' 
        }
      ],
      conclusion: 'Le code douanier dépend du type de meuble et du matériau principal. Vérifiez les sous-positions pour plus de précision.'
    }
  };

  // Identifier le produit dans notre dictionnaire
  let productKey = null;
  for (const key in productExplanations) {
    if (normalizedDescription.includes(key)) {
      productKey = key;
      break;
    }
  }

  // Si le produit est reconnu, utiliser l'explication prédéfinie
  if (productKey) {
    const explanation = productExplanations[productKey];
    
    // Trouver les codes pertinents dans les résultats
    let relevantCodes = codes.filter(item => 
      explanation.mainPosition.split(',').some(pos => item.code.startsWith(pos.trim())) && 
      item.relevance >= 30
    );
    
    if (relevantCodes.length === 0) {
      relevantCodes = codes
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3); // Limiter à 3 codes les plus pertinents
    }
    
    // Formater les codes trouvés
    const formattedCodes = relevantCodes.length > 0 
      ? relevantCodes.map(code => 
          `${code.code} : ${code.description || 'autres'} — Taux de droit : ${code.dutyInfo || 'non spécifié'}`
        ).join('\n')
      : "Aucun code pertinent trouvé dans le document.";
    
    // Construire le résultat explicatif
    return {
      introText: `Le code douanier à 8 chiffres (code NC) pour ${productDescription} dépend du matériau et du type, mais ${productDescription} relève généralement du chapitre ${explanation.chapter}, plus précisément de la sous-position ${explanation.mainPosition}, intitulée « ${explanation.title} ».`,
      relevantCodes: `Voici quelques codes pertinents trouvés dans le fichier :\n\n${formattedCodes}`,
      variantsText: `Si votre ${productKey} est :`,
      variants: explanation.variants,
      conclusion: explanation.conclusion,
      rawCodes: relevantCodes
    };
  }
  
  // Si le produit n'est pas reconnu, générer une explication générique
  else {
    // Déterminer le chapitre probable basé sur les codes trouvés
    const chapters = {};
    codes.forEach(code => {
      const chapter = code.code.substring(0, 2);
      chapters[chapter] = (chapters[chapter] || 0) + 1;
    });
    
    // Trouver le chapitre le plus fréquent
    let mostFrequentChapter = null;
    let maxCount = 0;
    for (const chapter in chapters) {
      if (chapters[chapter] > maxCount) {
        maxCount = chapters[chapter];
        mostFrequentChapter = chapter;
      }
    }
    
    // Sélectionner les codes les plus pertinents
    const relevantCodes = codes
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
    
    // Formater les codes trouvés
    const formattedCodes = relevantCodes.length > 0 
      ? relevantCodes.map(code => 
          `${code.code} : ${code.description || 'autres'} — Taux de droit : ${code.dutyInfo || 'non spécifié'}`
        ).join('\n')
      : "Aucun code pertinent trouvé dans le document.";
    
    return {
      introText: `Le code douanier à 8 chiffres (code NC) pour "${productDescription}" semble relever du chapitre ${mostFrequentChapter || '??'}.`,
      relevantCodes: `Voici quelques codes pertinents trouvés dans le fichier :\n\n${formattedCodes}`,
      variantsText: `Vérifiez les spécificités de votre produit pour déterminer le code exact :`,
      variants: relevantCodes.map(code => ({
        code: code.code.substring(0, 6),
        description: code.description || 'Non spécifié'
      })),
      conclusion: `Pour une classification précise, consultez les notes explicatives de la nomenclature combinée ou contactez les services douaniers.`,
      rawCodes: relevantCodes
    };
  }
};

/**
 * Nettoie et formate un texte pour une meilleure lisibilité
 * @param {string} text - Texte à formater
 * @param {boolean} highlightCodes - Si true, les codes douaniers seront mis en évidence
 * @returns {string} - Texte formaté
 */
const formatText = (text, highlightCodes = false) => {
  if (!text) return '';
  
  // ÉTAPE 1: Extraire les codes douaniers
  const customsCodes = [];
  const codePatterns = [
    /\b(\d{4}\.\d{2}(?:\.\d{2})?)\b/g,  // Format 4407.10.10
    /\b(\d{4}\s\d{2}(?:\s\d{2})?)\b/g,  // Format 4407 10 10
    /\b((?:ex\s)?\d{4}(?:\s\d{2}(?:\s\d{2})?)?)\b/g  // Format ex 4407 ou ex 4407 10
  ];
  
  // Identifier tous les codes douaniers
  codePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      customsCodes.push({
        code: match[0],
        index: match.index,
        length: match[0].length
      });
    }
  });
  
  // ÉTAPE 2: Supprimer complètement les lignes problématiques
  
  // Diviser le texte en lignes
  let lines = text.split('\n');
  
  // Filtrer les lignes qui contiennent des points ou tirets
  lines = lines.filter(line => {
    // Éliminer les lignes qui contiennent des séquences de points ou tirets
    if (/\.{3,}|-{3,}|_{3,}|={3,}/.test(line)) return false;
    
    // Éliminer les lignes qui contiennent trop de caractères spéciaux
    const specialChars = line.replace(/[a-zA-Z0-9àáâäæçèéêëìíîïòóôöùúûüýÿÀÁÂÄÆÇÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÝŸ\s]/g, '');
    if (specialChars.length > line.length * 0.2) return false;
    
    return true;
  });
  
  // Joindre les lignes filtrées
  let formattedText = lines.join(' ');
  
  // ÉTAPE 3: Nettoyage supplémentaire
  
  // Supprimer les séquences de points et tirets restantes
  formattedText = formattedText.replace(/\.{2,}/g, ' ');
  formattedText = formattedText.replace(/-{2,}/g, ' ');
  formattedText = formattedText.replace(/_{2,}/g, ' ');
  formattedText = formattedText.replace(/={2,}/g, ' ');
  
  // Normaliser les espaces
  formattedText = formattedText.replace(/\s+/g, ' ').trim();
  
  // ÉTAPE 4: Mettre en évidence les codes douaniers
  if (highlightCodes && customsCodes.length > 0) {
    // Trier les codes par index décroissant pour éviter de perturber les indices
    customsCodes.sort((a, b) => b.index - a.index);
    
    // Créer une copie du texte formaté
    let textWithHighlights = formattedText;
    
    // Rechercher et mettre en évidence chaque code douanier
    for (const codeInfo of customsCodes) {
      const codeRegex = new RegExp(`\\b${codeInfo.code.replace(/\./g, '\\.').replace(/\s/g, '\\s')}\\b`);
      const match = codeRegex.exec(textWithHighlights);
      
      if (match) {
        const before = textWithHighlights.substring(0, match.index);
        const after = textWithHighlights.substring(match.index + match[0].length);
        textWithHighlights = before + '**' + match[0] + '**' + after;
      }
    }
    
    formattedText = textWithHighlights;
  }
  
  return formattedText;
};

/**
 * Sauvegarde une base vectorielle sur disque pour le serveur PDF autonome
 * @param {MemoryVectorStore} vectorStore - La base vectorielle à sauvegarder
 * @param {string} collectionName - Nom de la collection
 * @returns {Promise<boolean>} - True si la sauvegarde a réussi, false sinon
 */
const saveVectorStoreToFile = async (vectorStore, collectionName) => {
  try {
    // Créer le répertoire uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Extraire les vecteurs et documents de la base vectorielle
    const vectors = [];
    const documents = [];
    
    // Accéder aux données internes de la base vectorielle
    const docstore = vectorStore._docstore;
    const docIds = Array.from(docstore._docs.keys());
    
    // Pour chaque document, récupérer son vecteur correspondant
    for (const docId of docIds) {
      const doc = docstore._docs.get(docId);
      if (doc) {
        documents.push(doc);
        // Récupérer le vecteur correspondant
        const vector = vectorStore._vectorstoreType === 'memory' ? 
          vectorStore._vectors.find(v => v.id === docId)?.values :
          await vectorStore.embeddings.embedQuery(doc.pageContent);
        
        if (vector) {
          vectors.push(vector);
        }
      }
    }
    
    // Créer l'objet à sauvegarder
    const vectorStoreData = {
      collectionName,
      createdAt: Date.now(),
      vectors,
      documents
    };
    
    // Sauvegarder dans un fichier JSON
    const filePath = path.join(uploadsDir, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(vectorStoreData, null, 2));
    
    console.log(`Base vectorielle ${collectionName} sauvegardée sur disque: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de la base vectorielle ${collectionName}:`, error);
    return false;
  }
};

/**
 * Crée une base de données vectorielle à partir du texte extrait
 * @param {string} text - Texte extrait du PDF
 * @param {string} collectionName - Nom de la collection (utilisé comme identifiant)
 * @returns {Promise<MemoryVectorStore>} - Instance de la base de données vectorielle
 */
const createVectorStore = async (text, collectionName) => {
  try {
    // Diviser le texte en morceaux plus grands pour réduire le nombre de chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,  // Augmenter la taille des chunks pour réduire leur nombre
      chunkOverlap: 100,
    });
    
    const chunks = await textSplitter.splitText(text);
    console.log(`Texte divisé en ${chunks.length} morceaux`);
    
    // Formater chaque morceau pour une meilleure lisibilité
    const formattedChunks = chunks.map(chunk => formatText(chunk));
    
    // Vérifier que la clé API est définie
    if (!process.env.OPENAI_API_KEY) {
      console.error('La clé API OpenAI n\'est pas définie dans les variables d\'environnement');
      throw new Error('Clé API OpenAI manquante');
    }
    
    // Utiliser le modèle d'embedding configuré ou un modèle par défaut
    const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-ada-002";
    
    console.log(`Tentative de création des embeddings avec le modèle: ${embeddingModel}`);
    
    // Créer les embeddings avec OpenAI - sans spécifier de dimensions
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: embeddingModel,
      // Pas de dimensions spécifiées car cela cause une erreur
    });
    
    console.log('Embeddings créés, tentative de création de la base vectorielle...');
    
    // Créer un tableau de documents avec le format correct
    const documents = formattedChunks.map((text, i) => ({
      pageContent: text,
      metadata: { id: i.toString() }
    }));
    
    // Traiter les documents par lots pour éviter les timeouts et les erreurs
    const batchSize = 50; // Augmenter la taille des lots pour réduire le nombre d'appels API
    const batches = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    
    console.log(`Traitement des embeddings par lots (${batches.length} lots de ${batchSize} documents max)`);
    
    // Créer la base de données vectorielle en mémoire
    const vectorStore = new MemoryVectorStore(embeddings);
    
    // Traiter chaque lot séquentiellement
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        await vectorStore.addDocuments(batch);
        console.log(`Lot ${i+1}/${batches.length} traité (${batch.length} documents)`);
      } catch (error) {
        console.error(`Erreur lors du traitement du lot ${i+1}:`, error);
        // Continuer avec le lot suivant même en cas d'erreur
      }
    }
    
    console.log('Base de données vectorielle créée avec succès');
    return vectorStore;
  } catch (error) {
    console.error('Erreur détaillée lors de la création de la base de données vectorielle:', error);
    
    // Vérifier si l'erreur est liée à l'authentification
    if (error.message.includes('401') || error.message.includes('auth') || error.message.includes('key')) {
      throw new Error('Impossible de créer la base de données vectorielle: Problème d\'authentification avec l\'API OpenAI. Vérifiez votre clé API.');
    }
    
    // Vérifier si l'erreur est liée au format des données
    if (error.message.includes('400') || error.message.includes('invalid') || error.message.includes('input')) {
      throw new Error('Impossible de créer la base de données vectorielle: Format de données invalide pour l\'API OpenAI. ' + error.message);
    }
    
    // Vérifier si l'erreur est liée au réseau
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT') || error.message.includes('network')) {
      throw new Error('Impossible de créer la base de données vectorielle: Problème de connexion réseau avec l\'API OpenAI.');
    }
    
    throw new Error('Impossible de créer la base de données vectorielle: ' + error.message);
  }
};

/**
 * Recherche dans la base de données vectorielle et extrait des paragraphes complets
 * @param {object} vectorStore - Base de données vectorielle
 * @param {string} query - Requête de recherche
 * @param {number} k - Nombre de résultats à retourner
 * @returns {Promise<Array>} - Résultats de la recherche
 */
const searchVectorStore = async (vectorStore, query, k = 5) => {
  try {
    // Recherche initiale
    let results = await vectorStore.similaritySearch(query, k);
    
    // Si peu de résultats sont trouvés, essayer une recherche plus large
    if (results.length < 2) {
      console.log('Peu de résultats trouvés, élargissement de la recherche...');
      
      // Extraire les mots-clés de la requête (mots de plus de 3 caractères)
      const keywords = query
        .split(/\s+/)
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase());
      
      console.log('Mots-clés extraits:', keywords);
      
      // Rechercher avec chaque mot-clé individuellement
      const keywordResults = [];
      for (const keyword of keywords) {
        const keywordResult = await vectorStore.similaritySearch(keyword, 2);
        keywordResults.push(...keywordResult);
      }
      
      // Fusionner les résultats et supprimer les doublons
      const allResults = [...results, ...keywordResults];
      const uniqueResults = [];
      const seenContents = new Set();
      
      for (const result of allResults) {
        // Utiliser une version simplifiée du contenu comme clé pour détecter les doublons
        const contentKey = result.pageContent
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 100);
        
        if (!seenContents.has(contentKey)) {
          seenContents.add(contentKey);
          
          // Ajouter un score de pertinence aux résultats
          if (!result.score) {
            // Calculer un score basé sur la présence des mots-clés dans le contenu
            const content = result.pageContent.toLowerCase();
            const keywordMatches = keywords.filter(keyword => content.includes(keyword)).length;
            const score = keywordMatches / keywords.length;
            result.score = score > 0 ? score : 0.5; // Score par défaut si aucun mot-clé ne correspond
          }
          
          uniqueResults.push(result);
        }
      }
      
      // Trier les résultats par score de pertinence
      uniqueResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Limiter le nombre de résultats
      results = uniqueResults.slice(0, k);
    }
    
    // Extraire des paragraphes complets pour chaque résultat
    const enhancedResults = results.map(result => {
      // Récupérer le contenu original
      const originalContent = result.pageContent;
      
      // Identifier les paragraphes en utilisant des heuristiques
      // Un paragraphe est défini comme du texte entre deux sauts de ligne ou entre le début/fin du texte
      const paragraphs = originalContent.split(/\n{2,}/);
      
      // Trouver le paragraphe qui contient le plus de mots-clés de la requête
      const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      
      let bestParagraph = originalContent;
      let bestScore = 0;
      
      // Si nous avons des paragraphes distincts, trouver le meilleur
      if (paragraphs.length > 1) {
        for (const paragraph of paragraphs) {
          if (paragraph.trim().length < 20) continue; // Ignorer les paragraphes trop courts
          
          const paragraphLower = paragraph.toLowerCase();
          const keywordMatches = keywords.filter(keyword => paragraphLower.includes(keyword)).length;
          
          // Calculer un score basé sur le nombre de mots-clés et la longueur du paragraphe
          // Favoriser les paragraphes plus courts à score égal
          const lengthPenalty = Math.log(paragraph.length) / 10;
          const paragraphScore = keywordMatches - lengthPenalty;
          
          if (paragraphScore > bestScore) {
            bestScore = paragraphScore;
            bestParagraph = paragraph;
          }
        }
      }
      
      // Retourner le résultat avec le meilleur paragraphe
      return {
        ...result,
        pageContent: bestParagraph.trim(),
        score: result.score
      };
    });
    
    return enhancedResults;
  } catch (error) {
    console.error('Erreur lors de la recherche dans la base de données vectorielle:', error);
    throw new Error('Impossible de rechercher dans la base de données vectorielle');
  }
};

/**
 * Génère une réponse RAG basée sur les résultats de la recherche
 * @param {Array} searchResults - Résultats de la recherche
 * @param {string} query - Requête de recherche
 * @param {number} temperature - Température du modèle (0.0 à 1.0)
 * @returns {Promise<string>} - Réponse générée
 */
const generateRAGResponse = async (searchResults, query, temperature = 0.2) => {
  try {
    // Nettoyer et formater les résultats de recherche
    const cleanedResults = searchResults.map(result => {
      // Nettoyer le texte pour éliminer les lignes de points et tirets
      let cleanedContent = formatText(result.pageContent);
      return {
        ...result,
        pageContent: cleanedContent
      };
    });
    
    // Extraire les codes douaniers des résultats
    const codePattern = /\b(\d{4})(?:\s?\d{2}(?:\s?\d{2}(?:\s?\d{2})?)?)?\b/g;
    const extractedCodes = new Set();
    
    cleanedResults.forEach(result => {
      let match;
      const content = result.pageContent;
      while ((match = codePattern.exec(content)) !== null) {
        // Extraire le code complet
        extractedCodes.add(match[0]);
      }
    });
    
    // Organiser le contenu par code douanier à 4 chiffres
    const contentByCode = {};
    
    // Initialiser les entrées pour chaque code
    [...extractedCodes].forEach(code => {
      // Extraire les 4 premiers chiffres (section principale)
      const sectionCode = code.replace(/\s+/g, '').substring(0, 4);
      if (!contentByCode[sectionCode]) {
        contentByCode[sectionCode] = [];
      }
      
      // Ajouter le code complet à la section
      if (!contentByCode[sectionCode].includes(code)) {
        contentByCode[sectionCode].push(code);
      }
    });
    
    // Pour chaque code, trouver les passages pertinents
    Object.keys(contentByCode).forEach(sectionCode => {
      const codesInSection = contentByCode[sectionCode];
      
      // Trouver les passages pertinents pour chaque code de la section
      const relevantPassages = cleanedResults.filter(result => {
        return codesInSection.some(code => result.pageContent.includes(code));
      });
      
      // Mettre à jour le contenu avec les passages pertinents
      contentByCode[sectionCode] = {
        codes: codesInSection.sort((a, b) => a.length - b.length || a.localeCompare(b)),
        passages: relevantPassages.map(result => result.pageContent)
      };
    });
    
    // Vérifier si le contexte est suffisant
    const isContextInsufficient = Object.keys(contentByCode).length === 0;
    
    // Structurer le contexte par codes douaniers
    const structuredContext = isContextInsufficient ? '' : structureContextByCodes(contentByCode);
    
    // Créer le modèle de chat
    const model = new ChatOpenAI({
      modelName: process.env.CHAT_MODEL || 'gpt-3.5-turbo',
      temperature: temperature,
      // Ajouter des paramètres supplémentaires pour renforcer l'effet de la température
      top_p: temperature <= 0.3 ? 0.1 : temperature >= 0.7 ? 0.9 : 0.5,
      presence_penalty: temperature <= 0.3 ? -0.2 : temperature >= 0.7 ? 0.2 : 0,
      frequency_penalty: temperature <= 0.3 ? 0.3 : temperature >= 0.7 ? -0.1 : 0.1,
      max_tokens: temperature <= 0.3 ? 500 : temperature >= 0.7 ? 1000 : 750,
    });
    
    // Créer le modèle de prompt avec des instructions spécifiques pour la structuration
    const promptTemplate = PromptTemplate.fromTemplate(`
Tu es un assistant spécialisé dans l'analyse des codes douaniers et des documents d'importation/exportation.
${isContextInsufficient ? 
  `La recherche n'a pas trouvé d'informations spécifiques sur "${query}" dans le document analysé.
   Si tu connais des informations générales sur ce type de produit et ses codes douaniers potentiels, tu peux les partager.
   Précise bien que ces informations sont générales et ne proviennent pas du document analysé.` 
  : 
  `Utilise le contexte suivant pour répondre à la question de l'utilisateur.
   Le contexte est déjà organisé par codes douaniers à 4 chiffres.
   
   INSTRUCTIONS IMPORTANTES:
   1. Analyse attentivement les colonnes "Codes NC" et "Désignation des marchandises" dans le document.
   2. Commence par identifier les codes à 4 chiffres (sections principales) qui correspondent au produit recherché.
   3. Pour chaque code à 4 chiffres pertinent, présente les sous-sections (codes à 6 chiffres) et positions (codes à 8 chiffres) associées.
   4. Structure ta réponse de manière hiérarchique, en commençant par les codes à 4 chiffres, puis en détaillant les codes à 6 et 8 chiffres.
   5. Mets en gras les codes douaniers pour les faire ressortir.
   6. IMPORTANT: Pour chaque information ou code douanier, indique clairement sa source et son origine.
   7. Inclus les références précises des documents d'où proviennent les informations (nom du document, page, section, etc.).
   8. Pour chaque code douanier, précise le document exact d'où il provient et, si possible, la page ou la section.
   ${temperature <= 0.3 ? 
      `9. Sois très précis et concis. Limite-toi strictement aux informations présentes dans le document.
       10. Présente uniquement les codes les plus pertinents avec une explication minimale.
       11. Évite toute spéculation ou interprétation qui n'est pas directement soutenue par le document.
       12. Cite systématiquement la source exacte de chaque information (ex: "Selon le document X, page Y").` 
      : temperature >= 0.7 ? 
      `9. Sois créatif et détaillé dans tes explications. Explore différentes possibilités.
       10. Présente un large éventail de codes potentiellement pertinents avec des explications détaillées.
       11. Offre des interprétations et des suggestions basées sur ton expertise, même si elles ne sont pas explicitement mentionnées dans le document.
       12. Pour chaque interprétation, distingue clairement ce qui provient directement du document (avec référence précise) et ce qui relève de ton expertise.` 
      : 
      `9. Présente l'information sous forme de paragraphes clairs et concis, sans lignes de points ou de tirets.
       10. Si plusieurs codes sont pertinents, indique lequel semble le plus approprié pour la requête de l'utilisateur.
       11. Explique clairement la signification de chaque code et sa relation avec le produit recherché.
       12. Pour chaque code ou information, indique clairement sa source dans le document analysé.`
   }
  `
}

Contexte:
${isContextInsufficient ? 
  `Le document analysé ne contient pas d'informations pertinentes sur "${query}".` 
  : 
  structuredContext
}

Question: ${query}

Réponse:
    `);
    
    // Créer la chaîne de traitement
    const chain = RunnableSequence.from([
      {
        query: (input) => input.query,
        context: (input) => input.context,
        isContextInsufficient: (input) => input.isContextInsufficient
      },
      promptTemplate,
      model,
      new StringOutputParser(),
    ]);
    
    // Générer la réponse
    const response = await chain.invoke({
      query,
      context: structuredContext,
      isContextInsufficient
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la génération de la réponse RAG:', error);
    
    if (error.message.includes('API key')) {
      return "Erreur: La clé API OpenAI n'est pas configurée correctement. Veuillez vérifier votre configuration.";
    }
    
    return `Erreur lors de la génération de la réponse: ${error.message}`;
  }
};

/**
 * Structure le contexte par codes douaniers pour une meilleure présentation
 * @param {Object} contentByCode - Contenu organisé par code douanier
 * @returns {string} - Contexte structuré
 */
const structureContextByCodes = (contentByCode) => {
  // Si aucun code n'est trouvé, retourner une chaîne vide
  if (Object.keys(contentByCode).length === 0) return '';
  
  // Formater le contexte structuré
  let structuredContext = '';
  
  // Trier les sections par code
  const sortedSections = Object.keys(contentByCode).sort();
  
  // Pour chaque section, formater les informations
  sortedSections.forEach(sectionCode => {
    const sectionData = contentByCode[sectionCode];
    structuredContext += `== SECTION ${sectionCode} ==\n\n`;
    
    // Ajouter les codes de la section
    structuredContext += `Codes: ${sectionData.codes.join(', ')}\n\n`;
    
    // Ajouter les passages pertinents
    sectionData.passages.forEach((passage, index) => {
      structuredContext += `Passage ${index + 1}:\n${passage}\n\n`;
    });
    
    structuredContext += '\n';
  });
  
  return structuredContext;
};

/**
 * Fonction pour enrichir le traitement des codes douaniers et des désignations de marchandises
 * @param {string} text - Texte à analyser
 * @param {number} codePosition - Position du code dans le texte
 * @param {string} normalizedCode - Code normalisé (sans espaces)
 * @returns {string} - Désignation des marchandises
 */

/**
 * Fonction pour nettoyer le contexte
 * @param {string} context - Contexte à nettoyer
 * @returns {string} - Contexte nettoyé
 */
const cleanContext = (context) => {
  if (!context) return '';
  
  // Supprimer les caractères de ponctuation excessifs
  let cleaned = context.replace(/[.]{2,}/g, '.');
  cleaned = cleaned.replace(/[,]{2,}/g, ',');
  
  // Supprimer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Supprimer les points à la fin des mots (sauf s'ils sont suivis d'un espace et d'une majuscule)
  cleaned = cleaned.replace(/\.(?!\s[A-Z])/g, ' ');
  
  // Supprimer les tirets excessifs
  cleaned = cleaned.replace(/[-]{2,}/g, '-');
  
  return cleaned.trim();
};

/**
 * Extraire le contexte autour du code
 * @param {string} text - Texte complet
 * @param {number} codePosition - Position du code dans le texte
 * @param {number} windowSize - Taille de la fenêtre de contexte
 * @returns {string} - Contexte extrait
 */
const extractContext = (text, codePosition, windowSize = 150) => {
  const start = Math.max(0, codePosition - windowSize);
  const end = Math.min(text.length, codePosition + windowSize);
  
  const context = text.substring(start, end);
  
  return cleanContext(context);
};

/**
 * Enrichit les codes douaniers avec des informations supplémentaires
 * @param {Array} codes - Liste des codes douaniers extraits
 * @param {string} text - Texte complet du document
 * @param {string} productDescription - Description du produit recherché
 * @returns {Array} - Liste des codes enrichis avec des informations supplémentaires
 */
const enrichCodes = (codes, text, productDescription) => {
  if (!codes || codes.length === 0) {
    return [];
  }

  return codes.map(code => {
    // Trouver la position du code dans le texte
    const codePosition = text.indexOf(code.fullMatch);
    
    // Si le code n'est pas trouvé dans le texte, retourner le code tel quel
    if (codePosition === -1) {
      return {
        ...code,
        designation: '',
        description: '',
        dutyInfo: '',
        unitInfo: '',
        relevance: 0
      };
    }
    
    // Extraire la désignation des marchandises
    const designation = extractDesignationFromColumns(text, codePosition, code.normalizedCode);
    
    // Extraire le contexte autour du code
    const context = extractContext(text, codePosition, 300);
    
    // Extraire la description du produit
    const description = extractDescription(context, code.normalizedCode);
    
    // Extraire les informations sur les droits de douane
    const dutyInfo = extractDutyInfo(context);
    
    // Extraire les informations sur l'unité de mesure
    const unitInfo = extractUnitInfo(context);
    
    // Calculer la pertinence du code par rapport à la description du produit
    const relevance = calculateRelevance({ ...code, context }, productDescription);
    
    return {
      ...code,
      designation,
      description,
      dutyInfo,
      unitInfo,
      relevance,
      context
    };
  });
};

// Route pour analyser un PDF
router.post('/analyze', upload.single('pdfFile'), async (req, res) => {
  try {
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier PDF n\'a été téléchargé' });
    }
    
    const filePath = req.file.path;
    const productDescription = req.body.productDescription || '';
    
    console.log(`Analyse du fichier PDF: ${filePath}`);
    console.log(`Description du produit: ${productDescription}`);
    
    // Extraire le texte du PDF
    const text = await extractTextFromPDF(filePath);
    console.log(`Texte extrait (${text.length} caractères)`);
    
    // Extraire les codes douaniers du texte
    const extractedCodes = extractCustomsCodes(text);
    console.log(`Codes douaniers extraits: ${extractedCodes.length}`);
    
    // Enrichir les codes avec des informations supplémentaires
    const enrichedCodes = enrichCodes(extractedCodes, text, productDescription);
    
    // Filtrer les codes par pertinence
    const relevantCodes = filterCodesByRelevance(enrichedCodes, productDescription);
    console.log(`Codes pertinents: ${relevantCodes.length}`);
    
    // Organiser les résultats en catégories
    const categorizedResults = categorizeResults(relevantCodes, productDescription);
    
    // Générer un résultat explicatif
    const explanatoryResult = await generateExplanatoryResult(relevantCodes, productDescription);
    
    // Générer un nom de collection unique basé sur le nom du fichier et l'horodatage
    const fileName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const timestamp = Date.now();
    const collectionName = `${fileName}_${timestamp}`;
    
    // Créer la base de données vectorielle
    const vectorStore = await createVectorStore(text, collectionName);
    
    // Stocker la référence à la base de données vectorielle dans une variable globale
    // pour pouvoir y accéder plus tard
    global.vectorStores = global.vectorStores || {};
    global.vectorStores[collectionName] = vectorStore;
    
    // Sauvegarder la base vectorielle sur disque pour le serveur PDF autonome
    await saveVectorStoreToFile(vectorStore, collectionName);
    
    // Renvoyer les résultats
    res.json({
      success: true,
      codes: relevantCodes,
      totalFound: extractedCodes.length,
      explanatoryResult,
      categorizedResults,
      collectionName,
      filePath
    });
  } catch (error) {
    console.error('Erreur lors de l\'analyse du PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour obtenir la liste des bases de données vectorielles disponibles
router.get('/vector-stores', (req, res) => {
  try {
    // Si aucune base de données n'est disponible, initialiser un objet vide
    if (!global.vectorStores) {
      global.vectorStores = {};
    }
    
    console.log('Bases de données vectorielles disponibles:', Object.keys(global.vectorStores));
    
    // Créer un tableau d'objets contenant les informations sur chaque base de données
    const vectorStoresList = Object.keys(global.vectorStores).map(name => {
      // Extraire le nom du fichier à partir du nom de la collection
      const fileNameParts = name.split('_');
      // Retirer le timestamp de la fin
      const fileName = fileNameParts.slice(0, -1).join('_');
      
      return {
        id: name,
        fileName: fileName,
        createdAt: parseInt(fileNameParts[fileNameParts.length - 1]),
        displayName: `${fileName} (${new Date(parseInt(fileNameParts[fileNameParts.length - 1])).toLocaleString()})`
      };
    });
    
    // Trier les bases de données par date de création (plus récentes en premier)
    vectorStoresList.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      success: true,
      vectorStores: vectorStoresList
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des bases de données vectorielles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour rechercher dans un document déjà analysé
router.post('/search', async (req, res) => {
  try {
    const { collectionName, query, temperature = 0.2 } = req.body;
    
    if (!collectionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nom de la collection manquant' 
      });
    }
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Requête de recherche manquante' 
      });
    }
    
    // Vérifier si la base de données vectorielle existe
    if (!global.vectorStores || !global.vectorStores[collectionName]) {
      return res.status(404).json({ 
        success: false, 
        error: `Base de données vectorielle "${collectionName}" non trouvée` 
      });
    }
    
    // Récupérer la base de données vectorielle
    const vectorStore = global.vectorStores[collectionName];
    
    // Effectuer la recherche
    const searchResults = await vectorStore.similaritySearch(query, 5);
    
    // Formater les résultats de recherche pour une meilleure lisibilité
    const formattedResults = searchResults.map(result => {
      return {
        ...result,
        pageContent: formatText(result.pageContent, true)
      };
    });
    
    // Convertir la température en nombre et vérifier qu'elle est dans la plage valide
    const parsedTemperature = parseFloat(temperature);
    const validTemperature = !isNaN(parsedTemperature) && 
                             parsedTemperature >= 0 && 
                             parsedTemperature <= 1 
                             ? parsedTemperature 
                             : 0.2;
    
    // Générer une réponse RAG avec la température spécifiée
    const ragResponse = await generateRAGResponse(formattedResults, query, validTemperature);
    
    // Renvoyer les résultats
    res.json({
      success: true,
      searchResults: formattedResults,
      ragResponse,
      usedTemperature: validTemperature
    });
  } catch (error) {
    console.error('Erreur lors de la recherche dans le document:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
