#!/bin/bash

# Charger les variables d'environnement
source backend/.env

# Exécuter le script SQL pour vider la base de données
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/clear-db.sql

echo "Base de données vidée avec succès."
