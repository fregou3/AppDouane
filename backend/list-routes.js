// Script pour lister toutes les routes enregistrées dans l'application Express
const express = require('express');
const app = require('./server.js');

console.log('=== ROUTES ENREGISTRÉES ===');

// Fonction pour afficher les routes
function printRoutes(stack, basePath = '') {
  stack.forEach(function(layer) {
    if (layer.route) {
      // Routes
      const methods = Object.keys(layer.route.methods)
        .filter(method => layer.route.methods[method])
        .join(', ').toUpperCase();
      
      console.log(`${methods} ${basePath}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Middleware de type router
      const routerPath = layer.regexp.toString()
        .replace('\\/?(?=\\/|$)', '')
        .replace(/^\^\\\//, '/')
        .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
        .replace(/\\\//g, '/');
      
      const newBasePath = basePath + (routerPath === '/' ? '' : routerPath);
      printRoutes(layer.handle.stack, newBasePath);
    }
  });
}

// Afficher toutes les routes
if (app._router && app._router.stack) {
  printRoutes(app._router.stack);
} else {
  console.log('Aucune route trouvée ou structure de routeur non standard.');
}

console.log('=== FIN DES ROUTES ===');
