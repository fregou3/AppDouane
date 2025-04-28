const express = require('express');
const path = require('path');
const fs = require('fs');

// Vérifier si le répertoire build existe
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.error(`ERREUR: Le répertoire build n'existe pas à l'emplacement: ${buildPath}`);
  console.error('Veuillez exécuter "npm run build" avant de démarrer le serveur.');
  process.exit(1);
}

// Vérifier si le fichier index.html existe
const indexPath = path.join(buildPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`ERREUR: Le fichier index.html n'existe pas à l'emplacement: ${indexPath}`);
  console.error('La construction du frontend semble incomplète ou corrompue.');
  process.exit(1);
}

const app = express();

// Ajouter un middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques depuis le répertoire build
app.use(express.static(buildPath));

// Pour toutes les autres routes, renvoyer index.html
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Gérer les erreurs
app.use((err, req, res, next) => {
  console.error(`Erreur: ${err.message}`);
  res.status(500).send('Erreur serveur');
});

const PORT = process.env.PORT || 3004;

// Vérifier si le port est déjà utilisé
const server = app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Application accessible à l'adresse: http://localhost:${PORT}`);
});

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
