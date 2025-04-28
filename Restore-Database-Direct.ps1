# Script PowerShell pour restaurer la base de données PostgreSQL via Docker
# Cette version copie d'abord le fichier de sauvegarde dans le conteneur, puis effectue la restauration
# Usage: .\Restore-Database-Direct.ps1 <fichier_de_sauvegarde>

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"
$TEMP_CONTAINER_PATH = "/tmp/db_restore.dump"

# Vérifier si le fichier de sauvegarde est spécifié
if ($args.Count -eq 0) {
    Write-Host "Erreur: Vous devez spécifier un fichier de sauvegarde." -ForegroundColor Red
    Write-Host "Usage: .\Restore-Database-Direct.ps1 <fichier_de_sauvegarde>"
    exit 1
}

$BACKUP_FILE = $args[0]

# Si le chemin n'est pas absolu, ajouter le préfixe du répertoire backups
if (-not [System.IO.Path]::IsPathRooted($BACKUP_FILE)) {
    $BACKUP_FILE = ".\backups\$BACKUP_FILE"
}

# Vérifier si le fichier de sauvegarde existe
if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host "Erreur: Le fichier de sauvegarde '$BACKUP_FILE' n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "Restauration de la base de données $DB_NAME à partir du fichier $BACKUP_FILE..."

try {
    # Étape 1: Copier le fichier de sauvegarde dans le conteneur
    Write-Host "Copie du fichier de sauvegarde vers le conteneur..."
    docker cp $BACKUP_FILE ${CONTAINER_NAME}:${TEMP_CONTAINER_PATH}
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de la copie du fichier de sauvegarde vers le conteneur." -ForegroundColor Red
        exit 1
    }
    
    # Étape 2: Vérifier que le fichier est une archive PostgreSQL valide
    Write-Host "Vérification de l'intégrité de l'archive..."
    docker exec -t $CONTAINER_NAME pg_restore -l $TEMP_CONTAINER_PATH | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur: Le fichier ne semble pas être une archive PostgreSQL valide." -ForegroundColor Red
        Write-Host "Nettoyage du fichier temporaire..."
        docker exec -t $CONTAINER_NAME rm $TEMP_CONTAINER_PATH
        exit 1
    }
    
    # Étape 3: Supprimer la base de données existante
    Write-Host "Suppression de la base de données $DB_NAME si elle existe..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
    
    # Étape 4: Créer une nouvelle base de données
    Write-Host "Création de la base de données $DB_NAME..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    
    # Étape 5: Restaurer la base de données
    Write-Host "Restauration des données à partir du fichier de sauvegarde..."
    docker exec -t $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists $TEMP_CONTAINER_PATH
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restauration réussie!" -ForegroundColor Green
    } else {
        Write-Host "Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs." -ForegroundColor Yellow
        Write-Host "Veuillez vérifier l'état de la base de données."
    }
    
    # Étape 6: Nettoyer le fichier temporaire
    Write-Host "Nettoyage du fichier temporaire..."
    docker exec -t $CONTAINER_NAME rm $TEMP_CONTAINER_PATH
    
} catch {
    Write-Host "Exception: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Opération terminée." -ForegroundColor Green
