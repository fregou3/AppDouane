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
  console.log(`Frontend server running on port ${PORT}`);
});
