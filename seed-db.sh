#!/bin/bash

# Charger les variables d'environnement
source backend/.env

# Exécuter le script SQL avec les données d'exemple
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/seed-db.sql

echo "Base de données remplie avec les données d'exemple."
