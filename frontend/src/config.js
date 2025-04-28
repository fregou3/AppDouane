// Déterminer si nous sommes en environnement de production
const isProduction = process.env.NODE_ENV === 'production';

// Configuration pour l'environnement de production ou de développement
const API_HOST = isProduction 
  ? 'app1.communify.solutions' 
  : (process.env.REACT_APP_API_HOST || 'localhost');

const API_PORT = process.env.REACT_APP_API_PORT || '5004';

// URL de l'API
export const API_URL = `http://${API_HOST}:${API_PORT}`;
