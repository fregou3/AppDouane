#!/bin/bash
# Script pour sauvegarder la base de données PostgreSQL en format SQL pur
# Usage: ./linux-backup-sql.sh [nom_du_fichier_de_sauvegarde]

# Définir les variables
CONTAINER_NAME="douane_db"
DB_NAME="douane"
DB_USER="postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Définir le nom du fichier de sauvegarde
if [ $# -eq 0 ]; then
    BACKUP_FILE="$BACKUP_DIR/douane_sql_backup_$TIMESTAMP.sql"
else
    BACKUP_FILE="$BACKUP_DIR/$1"
fi

echo "Sauvegarde de la base de données $DB_NAME en cours..."
echo "Fichier de sauvegarde: $BACKUP_FILE"

# Créer la sauvegarde en format SQL pur (non binaire)
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER --format=p --create --clean $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Sauvegarde réussie! Fichier créé: $BACKUP_FILE"
    echo "Taille du fichier: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "Erreur lors de la sauvegarde de la base de données."
    exit 1
fi

echo "Opération terminée."
