@echo off
echo Démarrage du serveur backend pour l'application douane_v3.9.3...

echo Démarrage du serveur backend...
node server.js

echo Le serveur backend est accessible sur %PORT% (défini dans .env)
