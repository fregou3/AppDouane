@echo off
echo Arrêt des processus Node.js en cours...
taskkill /f /im node.exe
echo Démarrage du serveur...
node server.js
