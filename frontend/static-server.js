/**
 * Serveur statique simple pour l'application React
 * Ce serveur n'utilise pas Express pour éviter les problèmes avec path-to-regexp
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3004;
const BUILD_DIR = path.join(__dirname, 'build');

// Types MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.txt': 'text/plain',
};

// Vérifier si le répertoire build existe
if (!fs.existsSync(BUILD_DIR)) {
  console.error(`ERREUR: Le répertoire build n'existe pas à l'emplacement: ${BUILD_DIR}`);
  console.error('Veuillez exécuter "npm run build" avant de démarrer le serveur.');
  process.exit(1);
}

// Vérifier si le fichier index.html existe
const indexPath = path.join(BUILD_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`ERREUR: Le fichier index.html n'existe pas à l'emplacement: ${indexPath}`);
  console.error('La construction du frontend semble incomplète ou corrompue.');
  process.exit(1);
}

// Lire le fichier index.html une seule fois au démarrage
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Créer le serveur HTTP
const server = http.createServer((req, res) => {
  // Journaliser la requête
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Analyser l'URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Normaliser le chemin pour éviter les attaques de traversée de répertoire
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  
  // Construire le chemin complet vers le fichier
  let filePath = path.join(BUILD_DIR, safePath);

  // Vérifier si le chemin pointe vers un répertoire
  const isDirectory = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
  if (isDirectory) {
    filePath = path.join(filePath, 'index.html');
  }

  // Obtenir l'extension du fichier
  const ext = path.extname(filePath);
  
  // Déterminer le type de contenu
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Vérifier si le fichier existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    // Si le fichier n'existe pas ou s'il y a une erreur, servir index.html
    if (err || ext === '.html') {
      // Pour les fichiers HTML ou les routes qui n'existent pas, servir index.html
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(indexContent);
      return;
    }

    // Lire et servir le fichier
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // En cas d'erreur de lecture, servir index.html
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexContent);
        return;
      }

      // Servir le fichier avec le bon type MIME
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur frontend démarré sur le port ${PORT}`);
  console.log(`Application accessible à l'adresse: http://localhost:${PORT}`);
});

// Gérer les erreurs du serveur
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ERREUR: Le port ${PORT} est déjà utilisé.`);
    console.error('Veuillez libérer ce port ou en spécifier un autre via la variable d\'environnement PORT.');
    process.exit(1);
  } else {
    console.error(`ERREUR lors du démarrage du serveur: ${err.message}`);
    process.exit(1);
  }
});

// Gérer l'arrêt propre du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('Serveur arrêté.');
    process.exit(0);
  });
});
