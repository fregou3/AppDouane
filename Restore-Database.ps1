# Script PowerShell pour restaurer la base de données PostgreSQL via Docker
# Usage: .\Restore-Database.ps1 <fichier_de_sauvegarde>

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"

# Vérifier si le fichier de sauvegarde est spécifié
if ($args.Count -eq 0) {
    Write-Host "Erreur: Vous devez spécifier un fichier de sauvegarde." -ForegroundColor Red
    Write-Host "Usage: .\Restore-Database.ps1 <fichier_de_sauvegarde>"
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

# Vérifier si la base de données existe déjà
Write-Host "Suppression de la base de données $DB_NAME si elle existe..."
docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"

# Créer la base de données
Write-Host "Création de la base de données $DB_NAME..."
docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Restaurer la base de données à partir du fichier de sauvegarde
Write-Host "Restauration des données à partir de $BACKUP_FILE..."
try {
    Get-Content $BACKUP_FILE | docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restauration réussie!" -ForegroundColor Green
    } else {
        Write-Host "Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs." -ForegroundColor Yellow
        Write-Host "Veuillez vérifier l'état de la base de données."
    }
} catch {
    Write-Host "Exception: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Opération terminée." -ForegroundColor Green
