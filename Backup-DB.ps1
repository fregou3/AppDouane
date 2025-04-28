# Script PowerShell pour sauvegarder la base de données PostgreSQL via Docker
# Version améliorée créant à la fois un fichier .dmp (binaire) et un fichier .sql (texte)
# Usage: .\Backup-DB.ps1 [nom_du_fichier_sans_extension]

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

# Définir le nom de base du fichier de sauvegarde
if ($args.Count -eq 0) {
    $BACKUP_BASE = "douane_backup_$TIMESTAMP"
} else {
    $BACKUP_BASE = $args[0]
}

$BACKUP_FILE_DMP = "$BACKUP_DIR\$BACKUP_BASE.dmp"
$BACKUP_FILE_SQL = "$BACKUP_DIR\$BACKUP_BASE.sql"

Write-Host "Sauvegarde de la base de données $DB_NAME en cours..."
Write-Host "Fichiers de sauvegarde:"
Write-Host "- Format binaire (.dmp): $BACKUP_FILE_DMP"
Write-Host "- Format SQL (.sql): $BACKUP_FILE_SQL"

# Étape 1: Créer le fichier de sauvegarde binaire (.dmp)
Write-Host "Création de la sauvegarde au format binaire (.dmp)..."
$result = cmd /c "docker exec $CONTAINER_NAME pg_dump -U $DB_USER -Fc $DB_NAME > `"$BACKUP_FILE_DMP`" 2>&1"

if ($LASTEXITCODE -eq 0) {
    $fileInfo = Get-Item $BACKUP_FILE_DMP
    Write-Host "Sauvegarde binaire réussie! Fichier créé: $BACKUP_FILE_DMP"
    Write-Host "Taille du fichier: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
} else {
    Write-Host "Erreur lors de la sauvegarde binaire de la base de données: $result" -ForegroundColor Red
    exit 1
}

# Étape 2: Créer le fichier de sauvegarde SQL (.sql)
Write-Host "Création de la sauvegarde au format SQL (.sql)..."
$result = cmd /c "docker exec $CONTAINER_NAME pg_dump -U $DB_USER --format=p --create --clean $DB_NAME > `"$BACKUP_FILE_SQL`" 2>&1"

if ($LASTEXITCODE -eq 0) {
    $fileInfo = Get-Item $BACKUP_FILE_SQL
    Write-Host "Sauvegarde SQL réussie! Fichier créé: $BACKUP_FILE_SQL"
    Write-Host "Taille du fichier: $([math]::Round($fileInfo.Length / 1KB, 2)) KB"
} else {
    Write-Host "Erreur lors de la sauvegarde SQL de la base de données: $result" -ForegroundColor Red
    # Ne pas quitter si la sauvegarde binaire a réussi
    Write-Host "La sauvegarde binaire reste disponible." -ForegroundColor Yellow
}

Write-Host "Opération terminée." -ForegroundColor Green
Write-Host "Fichiers créés:"
Write-Host "- $BACKUP_FILE_DMP (format binaire pour restauration rapide)"
Write-Host "- $BACKUP_FILE_SQL (format SQL pour compatibilité maximale)"
