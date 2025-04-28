#!/bin/bash

# Vérifier si le conteneur existe et est en cours d'exécution
if ! docker ps | grep -q douane_db; then
    echo "Démarrage du conteneur PostgreSQL..."
    docker compose up -d
    
    # Attendre que PostgreSQL soit prêt
    echo "Attente du démarrage de PostgreSQL..."
    sleep 5
fi

# Exécuter les scripts SQL dans l'ordre
echo "Initialisation de la base de données..."

# 1. Initialiser la structure de la base de données
echo "1. Création des tables..."
docker exec -i douane_db psql -U postgres -d douane < backend/init.sql

# 2. Nettoyer les données existantes
echo "2. Nettoyage des données existantes..."
docker exec -i douane_db psql -U postgres -d douane < backend/clear-db.sql

# 3. Charger les nouvelles données
echo "3. Chargement des données..."
docker exec -i douane_db psql -U postgres -d douane < backend/seed-db.sql

echo "Base de données initialisée avec succès!"
