@echo off
echo Redémarrage du serveur backend...

echo 1. Arrêt du serveur actuel (si en cours d'exécution)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5004 ^| findstr LISTENING') DO (
  echo Processus trouvé: %%P
  taskkill /F /PID %%P
  echo Processus terminé.
)

echo 2. Démarrage du nouveau serveur...
start cmd /k "node server.js"

echo 3. Attente de 3 secondes pour le démarrage du serveur...
timeout /t 3 /nobreak

echo 4. Application des correctifs pour les bases vectorielles...
node fix-vector-stores.js

echo Redémarrage terminé. Le serveur est maintenant accessible sur http://localhost:5004
