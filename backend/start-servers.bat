@echo off
echo Démarrage des serveurs...

echo 1. Démarrage du serveur principal...
start "Serveur Principal" cmd /k "node server.js"

echo 2. Attente de 2 secondes...
timeout /t 2 /nobreak

echo 3. Démarrage du serveur PDF autonome...
start "Serveur PDF" cmd /k "node standalone-pdf-server.js"

echo Serveurs démarrés avec succès!
echo - Serveur principal: http://localhost:5004
echo - Serveur PDF: http://localhost:5005
