#!/bin/bash
# Script pour sauvegarder la base de données PostgreSQL via Docker
# Version améliorée créant à la fois un fichier .dmp (binaire) et un fichier .sql (texte)
# Usage: ./docker-backup-db.sh [nom_du_fichier_sans_extension]

# Définir les variables
CONTAINER_NAME="douane_db"
DB_NAME="douane"
DB_USER="postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Définir le nom de base du fichier de sauvegarde
if [ $# -eq 0 ]; then
    BACKUP_BASE="douane_backup_$TIMESTAMP"
else
    BACKUP_BASE="$1"
fi

BACKUP_FILE_DMP="$BACKUP_DIR/$BACKUP_BASE.dmp"
BACKUP_FILE_SQL="$BACKUP_DIR/$BACKUP_BASE.sql"

echo "Sauvegarde de la base de données $DB_NAME en cours..."
echo "Fichiers de sauvegarde:"
echo "- Format binaire (.dmp): $BACKUP_FILE_DMP"
echo "- Format SQL (.sql): $BACKUP_FILE_SQL"

# Étape 1: Créer le fichier de sauvegarde binaire (.dmp)
echo "Création de la sauvegarde au format binaire (.dmp)..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -Fc $DB_NAME > "$BACKUP_FILE_DMP"

if [ $? -eq 0 ]; then
    echo "Sauvegarde binaire réussie! Fichier créé: $BACKUP_FILE_DMP"
    echo "Taille du fichier: $(du -h "$BACKUP_FILE_DMP" | cut -f1)"
else
    echo "Erreur lors de la sauvegarde binaire de la base de données."
    exit 1
fi

# Étape 2: Créer le fichier de sauvegarde SQL (.sql)
echo "Création de la sauvegarde au format SQL (.sql)..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER --format=p --create --clean $DB_NAME > "$BACKUP_FILE_SQL"

if [ $? -eq 0 ]; then
    echo "Sauvegarde SQL réussie! Fichier créé: $BACKUP_FILE_SQL"
    echo "Taille du fichier: $(du -h "$BACKUP_FILE_SQL" | cut -f1)"
else
    echo "Erreur lors de la sauvegarde SQL de la base de données."
    echo "La sauvegarde binaire reste disponible."
fi

echo "Opération terminée."
echo "Fichiers créés:"
echo "- $BACKUP_FILE_DMP (format binaire pour restauration rapide)"
echo "- $BACKUP_FILE_SQL (format SQL pour compatibilité maximale)"
