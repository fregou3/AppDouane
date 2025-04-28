#!/bin/bash

# Script pour restaurer la base de données PostgreSQL via Docker
# Usage: ./docker-restore-db.sh <fichier_de_sauvegarde>

# Définir les variables
CONTAINER_NAME="douane_db"
DB_NAME="douane"
DB_USER="postgres"

# Vérifier si le fichier de sauvegarde est spécifié
if [ -z "$1" ]; then
    echo "Erreur: Vous devez spécifier un fichier de sauvegarde."
    echo "Usage: ./docker-restore-db.sh <fichier_de_sauvegarde>"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier si le fichier de sauvegarde existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erreur: Le fichier de sauvegarde '$BACKUP_FILE' n'existe pas."
    exit 1
fi

echo "Restauration de la base de données ${DB_NAME} à partir du fichier ${BACKUP_FILE}..."

# Vérifier si la base de données existe déjà
DB_EXISTS=$(docker exec -t $CONTAINER_NAME psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

# Si la base de données existe, la supprimer d'abord
if [ $DB_EXISTS -eq 1 ]; then
    echo "La base de données $DB_NAME existe déjà. Suppression en cours..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE $DB_NAME WITH (FORCE);"
    
    # Recréer la base de données
    echo "Recréation de la base de données $DB_NAME..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
else
    # Créer la base de données si elle n'existe pas
    echo "Création de la base de données $DB_NAME..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
fi

# Restaurer la base de données à partir du fichier de sauvegarde
echo "Restauration des données à partir de $BACKUP_FILE..."
cat $BACKUP_FILE | docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists

# Vérifier si la restauration a réussi
if [ $? -eq 0 ]; then
    echo "Restauration réussie!"
else
    echo "Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs."
    echo "Veuillez vérifier l'état de la base de données."
fi

echo "Opération terminée."
