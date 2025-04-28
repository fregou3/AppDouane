#!/bin/bash

# Vérifier si le conteneur est en cours d'exécution
CONTAINER_NAME="douane_db"
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "Le conteneur $CONTAINER_NAME n'est pas en cours d'exécution."
    exit 1
fi

# Copier le fichier SQL dans le conteneur
docker cp backend/seed-db.sql $CONTAINER_NAME:/seed-db.sql

# Exécuter le script SQL dans le conteneur
docker exec -i $CONTAINER_NAME psql -U postgres -d douane -f /seed-db.sql

echo "Base de données remplie avec les données d'exemple."
