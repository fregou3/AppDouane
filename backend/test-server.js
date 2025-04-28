// Script de test pour vérifier si le serveur est accessible
const express = require('express');
const cors = require('cors');

const app = express();

// Configuration CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Route de test simple
app.get('/api/test', (req, res) => {
  console.log('Route de test appelée');
  res.json({ message: 'API de test accessible' });
});

// Route de test pour l'analyse d'images
app.post('/api/analyze-image', (req, res) => {
  console.log('Route d\'analyse d\'images appelée (version test)');
  res.json({ 
    description: 'Ceci est une description de test générée pour simuler l\'analyse d\'image. L\'image montre un produit cosmétique à base d\'huiles essentielles, probablement un mélange d\'huiles de verveine et d\'autres plantes aromatiques. Le produit semble être conditionné dans un flacon en verre avec un compte-gouttes.' 
  });
});

// Démarrer le serveur
const PORT = 5004;
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur le port ${PORT}`);
  console.log(`API accessible à http://localhost:${PORT}/api/test`);
  console.log(`API d'analyse d'images accessible à http://localhost:${PORT}/api/analyze-image`);
});
