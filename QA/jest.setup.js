// Configuration globale pour les tests Jest
jest.setTimeout(30000); // Timeout global de 30 secondes pour tous les tests

// Variables d'environnement pour les tests
process.env.API_URL = 'http://localhost:3000';
process.env.DB_USER = 'postgres';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'douane';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_PORT = '5434';

// Désactiver les logs de console pendant les tests sauf en cas d'erreur
if (process.env.NODE_ENV !== 'debug') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}
