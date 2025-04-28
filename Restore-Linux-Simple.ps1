# Script PowerShell simplifié pour restaurer une sauvegarde PostgreSQL créée sur Linux
# Usage: .\Restore-Linux-Simple.ps1 <fichier_de_sauvegarde>

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"

# Vérifier si le fichier de sauvegarde est spécifié
if ($args.Count -eq 0) {
    Write-Host "Erreur: Vous devez spécifier un fichier de sauvegarde." -ForegroundColor Red
    Write-Host "Usage: .\Restore-Linux-Simple.ps1 <fichier_de_sauvegarde>"
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

Write-Host "Restauration de la base de données $DB_NAME à partir du fichier Linux $BACKUP_FILE..."

# Étape 1: Supprimer la base de données existante
Write-Host "Suppression de la base de données $DB_NAME si elle existe..."
$dropResult = docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la suppression de la base de données: $dropResult" -ForegroundColor Red
    exit 1
}

# Étape 2: Créer une nouvelle base de données
Write-Host "Création de la base de données $DB_NAME..."
$createResult = docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la création de la base de données: $createResult" -ForegroundColor Red
    exit 1
}

# Étape 3: Copier le fichier de sauvegarde dans le conteneur
Write-Host "Copie du fichier de sauvegarde vers le conteneur..."
docker cp $BACKUP_FILE ${CONTAINER_NAME}:/tmp/linux_backup.dump

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la copie du fichier de sauvegarde vers le conteneur." -ForegroundColor Red
    exit 1
}

# Étape 4: Restaurer la base de données
Write-Host "Restauration des données à partir du fichier de sauvegarde Linux..."
docker exec -t $CONTAINER_NAME pg_restore -U $DB_USER -d $DB_NAME --no-owner --no-privileges /tmp/linux_backup.dump

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restauration réussie!" -ForegroundColor Green
    
    # Vérifier le nombre de tables restaurées
    $tableCount = docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t
    Write-Host "Nombre de tables restaurées: $tableCount" -ForegroundColor Green
} else {
    Write-Host "Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs." -ForegroundColor Yellow
    Write-Host "Veuillez vérifier l'état de la base de données."
}

# Étape 5: Nettoyer le fichier temporaire
Write-Host "Nettoyage du fichier temporaire..."
docker exec -t $CONTAINER_NAME rm /tmp/linux_backup.dump

Write-Host "Opération terminée." -ForegroundColor Green
