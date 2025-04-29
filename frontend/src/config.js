// Déterminer si nous sommes en environnement de production
const isProduction = process.env.NODE_ENV === 'production';

// Configuration pour l'environnement de production ou de développement
const API_HOST = isProduction 
  ? 'app1.communify.solutions' 
  : (process.env.REACT_APP_API_HOST || 'localhost');

const API_PORT = process.env.REACT_APP_API_PORT || '5004';
const IMAGE_API_PORT = '5006';

// URL de l'API principale
export const API_URL = `http://${API_HOST}:${API_PORT}`;

// URL de l'API d'analyse d'images - FORCÉ en production pour éviter les problèmes de connexion
export const IMAGE_API_URL = 'http://app1.communify.solutions:5006';
