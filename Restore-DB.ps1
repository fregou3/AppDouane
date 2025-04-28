# Script PowerShell pour restaurer la base de données PostgreSQL via Docker
# Version simplifiée et robuste
# Usage: .\Restore-DB.ps1 <fichier_de_sauvegarde>

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"

# Vérifier si le fichier de sauvegarde est spécifié
if ($args.Count -eq 0) {
    Write-Host "Erreur: Vous devez spécifier un fichier de sauvegarde." -ForegroundColor Red
    Write-Host "Usage: .\Restore-DB.ps1 <fichier_de_sauvegarde>"
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

# Supprimer la base de données existante
Write-Host "Suppression de la base de données $DB_NAME si elle existe..."
$dropResult = cmd /c "docker exec $CONTAINER_NAME psql -U $DB_USER -c `"DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);`" 2>&1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la suppression de la base de données: $dropResult" -ForegroundColor Red
    exit 1
}

# Créer une nouvelle base de données
Write-Host "Création de la base de données $DB_NAME..."
$createResult = cmd /c "docker exec $CONTAINER_NAME psql -U $DB_USER -c `"CREATE DATABASE $DB_NAME;`" 2>&1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la création de la base de données: $createResult" -ForegroundColor Red
    exit 1
}

# Restaurer la base de données
Write-Host "Restauration des données à partir du fichier de sauvegarde..."
$restoreResult = cmd /c "type `"$BACKUP_FILE`" | docker exec -i $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restauration réussie!" -ForegroundColor Green
} else {
    Write-Host "Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs: $restoreResult" -ForegroundColor Yellow
    Write-Host "Veuillez vérifier l'état de la base de données."
}

Write-Host "Opération terminée." -ForegroundColor Green
