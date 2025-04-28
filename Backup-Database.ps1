# Script PowerShell pour sauvegarder la base de données PostgreSQL via Docker
# Usage: .\Backup-Database.ps1 [nom_du_fichier_de_sauvegarde]

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups"

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
Write-Host "Fichier de sauvegarde: $BACKUP_FILE"

# Exécuter la commande pg_dump dans le conteneur Docker
# Utilisation de la redirection directe pour préserver le format binaire
try {
    $command = "docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -Fc $DB_NAME > `"$BACKUP_FILE`""
    Invoke-Expression -Command "cmd /c $command"
    
    if ($LASTEXITCODE -eq 0) {
        $fileInfo = Get-Item $BACKUP_FILE
        Write-Host "Sauvegarde réussie! Fichier créé: $BACKUP_FILE"
        Write-Host "Taille du fichier: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
    } else {
        Write-Host "Erreur lors de la sauvegarde de la base de données." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Exception: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Opération terminée." -ForegroundColor Green
