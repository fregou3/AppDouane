# Script PowerShell pour sauvegarder la base de données PostgreSQL via Docker
# Cette version crée d'abord la sauvegarde dans le conteneur, puis la copie vers l'hôte
# Usage: .\Backup-Database-Direct.ps1 [nom_du_fichier_de_sauvegarde]

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups"
$TEMP_CONTAINER_PATH = "/tmp/db_backup.dump"

# Créer le répertoire de sauvegarde s'il n'existe pas
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Répertoire de sauvegarde créé: $BACKUP_DIR"
}

# Définir le nom du fichier de sauvegarde
if ($args.Count -eq 0) {
    $BACKUP_FILE = "$BACKUP_DIR\douane_backup_$TIMESTAMP.dump"
} else {
    $BACKUP_FILE = "$BACKUP_DIR\$($args[0])"
}

Write-Host "Sauvegarde de la base de données $DB_NAME en cours..."

try {
    # Étape 1: Créer la sauvegarde à l'intérieur du conteneur
    Write-Host "Création de la sauvegarde dans le conteneur..."
    docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -Fc $DB_NAME -f $TEMP_CONTAINER_PATH
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de la création de la sauvegarde dans le conteneur." -ForegroundColor Red
        exit 1
    }
    
    # Étape 2: Copier le fichier du conteneur vers l'hôte
    Write-Host "Copie du fichier de sauvegarde vers l'hôte..."
    docker cp ${CONTAINER_NAME}:${TEMP_CONTAINER_PATH} $BACKUP_FILE
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de la copie du fichier de sauvegarde." -ForegroundColor Red
        exit 1
    }
    
    # Étape 3: Nettoyer le fichier temporaire dans le conteneur
    docker exec -t $CONTAINER_NAME rm $TEMP_CONTAINER_PATH
    
    # Vérifier la taille du fichier
    $fileInfo = Get-Item $BACKUP_FILE
    Write-Host "Sauvegarde réussie! Fichier créé: $BACKUP_FILE"
    Write-Host "Taille du fichier: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
    
    # Vérifier que le fichier est une archive PostgreSQL valide
    Write-Host "Vérification de l'intégrité de l'archive..."
    $tempFile = "/tmp/verify_backup.txt"
    docker cp $BACKUP_FILE ${CONTAINER_NAME}:${tempFile}
    docker exec -t $CONTAINER_NAME pg_restore -l $tempFile | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Vérification réussie: le fichier est une archive PostgreSQL valide." -ForegroundColor Green
        # Nettoyer le fichier temporaire
        docker exec -t $CONTAINER_NAME rm $tempFile
    } else {
        Write-Host "Avertissement: Le fichier ne semble pas être une archive PostgreSQL valide." -ForegroundColor Yellow
        Write-Host "La sauvegarde pourrait ne pas être utilisable pour une restauration." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Exception: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Opération terminée." -ForegroundColor Green
