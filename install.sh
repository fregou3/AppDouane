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
APP_DIR="/home/ubuntu/douane_v3.9.11/AppDouane"

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
npm install -g pm2 || { error "Échec de l'installation de PM2"; exit 1; }

# 4. Configurer et démarrer le backend
log "Configuration et démarrage du backend..."
cd "$APP_DIR/backend" || { error "Le répertoire backend n'existe pas"; exit 1; }

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
  warn "Le fichier .env n'existe pas. Création d'un fichier .env par défaut..."
  cat > .env << EOF
# Server Configuration
HOST=localhost
PORT=5004

# API Configuration
API_HOST=localhost
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

# Démarrer le backend
log "Démarrage du backend..."
pm2 start server.js --name "douane-backend" || { error "Échec du démarrage du backend"; exit 1; }

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
npm install express || { error "Échec de l'installation d'express"; exit 1; }

# Construire le frontend
log "Construction du frontend..."
npm run build || { error "Échec de la construction du frontend"; exit 1; }

# Vérifier si le fichier serve-app.js existe
if [ ! -f "serve-app.js" ]; then
  warn "Le fichier serve-app.js n'existe pas. Création du fichier..."
  cat > serve-app.js << EOF
const express = require('express');
const path = require('path');
const app = express();

// Servir les fichiers statiques depuis le répertoire build
app.use(express.static(path.join(__dirname, 'build')));

// Pour toutes les autres routes, renvoyer index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(\`Frontend server running on port \${PORT}\`);
});
EOF
fi

# Démarrer le frontend
log "Démarrage du frontend..."
pm2 start serve-app.js --name "douane-frontend" || { error "Échec du démarrage du frontend"; exit 1; }

# 8. Sauvegarder la configuration PM2
log "Sauvegarde de la configuration PM2..."
pm2 save || warn "Échec de la sauvegarde de la configuration PM2"

# 9. Configurer PM2 pour démarrer au démarrage du système
log "Configuration de PM2 pour démarrer au démarrage du système..."
pm2 startup || warn "Échec de la configuration de PM2 pour démarrer au démarrage du système"

# 10. Afficher l'état des services
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
