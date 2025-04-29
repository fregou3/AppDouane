#!/bin/bash

# Script d'installation complète de l'application Douane
# Ce script permet de déployer l'ensemble de l'application sur un serveur Ubuntu
# Il gère l'installation des dépendances, la configuration et le démarrage des services

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si le script est exécuté en tant que root
if [ "$EUID" -ne 0 ]; then
  error "Ce script doit être exécuté en tant que root (utilisez sudo)"
  exit 1
fi

# Répertoire de base de l'application
APP_DIR="/home/ubuntu/douane_v3.9.12/AppDouane"

# Vérifier si le répertoire existe
if [ ! -d "$APP_DIR" ]; then
  error "Le répertoire $APP_DIR n'existe pas"
  log "Création du répertoire..."
  mkdir -p "$APP_DIR"
fi

# Aller dans le répertoire de l'application
cd "$APP_DIR" || exit 1

# 1. Arrêter tous les services existants
log "Arrêt des services existants..."
pm2 delete all 2>/dev/null || true
pkill -f node 2>/dev/null || true

# 2. Vérifier si les ports sont libres
check_port() {
  if lsof -i :"$1" >/dev/null 2>&1; then
    warn "Le port $1 est déjà utilisé. Tentative de libération..."
    lsof -i :"$1" -t | xargs kill -9 2>/dev/null || true
    sleep 2
    if lsof -i :"$1" >/dev/null 2>&1; then
      error "Impossible de libérer le port $1. Veuillez vérifier manuellement."
      return 1
    else
      log "Port $1 libéré avec succès."
    fi
  else
    log "Port $1 disponible."
  fi
  return 0
}

# Vérifier les ports utilisés par l'application
check_port 5004 || exit 1  # Backend
check_port 5005 || exit 1  # PDF Server
check_port 5006 || exit 1  # Image Server
check_port 3004 || exit 1  # Frontend

# 3. Installer les dépendances globales
log "Installation des dépendances globales..."
npm install -g pm2 serve || { error "Échec de l'installation des dépendances globales"; exit 1; }

# 4. Configurer et démarrer le backend
log "Configuration et démarrage du backend..."
cd "$APP_DIR/backend" || { error "Le répertoire backend n'existe pas"; exit 1; }

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
  warn "Le fichier .env n'existe pas. Création d'un fichier .env par défaut..."
  cat > .env << EOF
# Server Configuration
HOST=0.0.0.0
PORT=5004
NODE_ENV=production

# API Configuration
API_HOST=app1.communify.solutions
API_PORT=5004

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=douane
DB_PASSWORD=your_password
DB_PORT=5434

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
EOF
  warn "Veuillez éditer le fichier .env avec vos propres valeurs"
fi

# Installer les dépendances du backend
log "Installation des dépendances du backend..."
npm install || { error "Échec de l'installation des dépendances du backend"; exit 1; }

# Démarrer le backend avec PM2
log "Démarrage du backend..."
NODE_ENV=production pm2 start server.js --name "douane-backend" || { error "Échec du démarrage du backend"; exit 1; }

# 5. Démarrer le serveur PDF
log "Démarrage du serveur PDF..."
pm2 start standalone-pdf-server.js --name "douane-pdf" || { error "Échec du démarrage du serveur PDF"; exit 1; }

# 6. Démarrer le serveur d'image
log "Démarrage du serveur d'image..."
cd "$APP_DIR" || exit 1
pm2 start image-server.js --name "douane-image" || { error "Échec du démarrage du serveur d'image"; exit 1; }

# 7. Configurer et démarrer le frontend
log "Configuration et démarrage du frontend..."
cd "$APP_DIR/frontend" || { error "Le répertoire frontend n'existe pas"; exit 1; }

# Installer les dépendances du frontend
log "Installation des dépendances du frontend..."
npm install || { error "Échec de l'installation des dépendances du frontend"; exit 1; }

# Construire le frontend
log "Construction du frontend..."
npm run build || { error "Échec de la construction du frontend"; exit 1; }

# Vérifier si le fichier static-server.js existe
if [ ! -f "static-server.js" ]; then
  warn "Le fichier static-server.js n'existe pas. Création du fichier..."
  cat > static-server.js << EOF
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
  console.error(\`ERREUR: Le répertoire build n'existe pas à l'emplacement: \${BUILD_DIR}\`);
  console.error('Veuillez exécuter "npm run build" avant de démarrer le serveur.');
  process.exit(1);
}

// Vérifier si le fichier index.html existe
const indexPath = path.join(BUILD_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(\`ERREUR: Le fichier index.html n'existe pas à l'emplacement: \${indexPath}\`);
  console.error('La construction du frontend semble incomplète ou corrompue.');
  process.exit(1);
}

// Lire le fichier index.html une seule fois au démarrage
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Créer le serveur HTTP
const server = http.createServer((req, res) => {
  // Journaliser la requête
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);

  // Analyser l'URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Normaliser le chemin pour éviter les attaques de traversée de répertoire
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\\\])+/, '');
  
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
  console.log(\`Serveur frontend démarré sur le port \${PORT}\`);
  console.log(\`Application accessible à l'adresse: http://localhost:\${PORT}\`);
});

// Gérer les erreurs du serveur
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(\`ERREUR: Le port \${PORT} est déjà utilisé.\`);
    console.error('Veuillez libérer ce port ou en spécifier un autre via la variable d\\'environnement PORT.');
    process.exit(1);
  } else {
    console.error(\`ERREUR lors du démarrage du serveur: \${err.message}\`);
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
EOF
fi

# Démarrer le frontend avec serve
log "Démarrage du frontend..."
pm2 start serve --name "douane-frontend" -- -s build -l 3004 || { error "Échec du démarrage du frontend"; exit 1; }

# 8. Sauvegarder la configuration PM2
log "Sauvegarde de la configuration PM2..."
pm2 save || { warn "Échec de la sauvegarde de la configuration PM2"; }

# Configurer PM2 pour démarrer automatiquement au démarrage du système
log "Configuration du démarrage automatique de PM2..."
pm2 startup || { warn "Échec de la configuration du démarrage automatique de PM2"; }

# Vérifier l'installation
log "Vérification de l'installation..."
echo -e "\n${GREEN}=== SERVICES EN COURS D'EXÉCUTION ===${NC}"
pm2 list

echo -e "\n${GREEN}=== PORTS UTILISÉS ===${NC}"
netstat -tulpn | grep -E ':(3004|5004|5005|5006)'

echo -e "\n${GREEN}=== INSTALLATION TERMINÉE ===${NC}"
echo -e "Backend: ${YELLOW}http://app1.communify.solutions:5004${NC}"
echo -e "Serveur PDF: ${YELLOW}http://app1.communify.solutions:5005${NC}"
echo -e "Serveur d'images: ${YELLOW}http://app1.communify.solutions:5006${NC}"
echo -e "Frontend: ${YELLOW}http://app1.communify.solutions:3004${NC}"

log "Pour vérifier les logs, utilisez: pm2 logs [nom-du-service]"

# 9. Configurer PM2 pour démarrer au démarrage du système
log "Configuration de PM2 pour démarrer au démarrage du système..."
pm2 startup || warn "Échec de la configuration de PM2 pour démarrer au démarrage du système"

log "État des services :"
pm2 list

log "============================================="
log "Installation terminée avec succès !"
log "L'application est accessible aux adresses suivantes :"
log "- Frontend : http://localhost:3004"
log "- Backend API : http://localhost:5004"
log "- PDF Server : http://localhost:5005"
log "- Image Server : http://localhost:5006"
log "============================================="
