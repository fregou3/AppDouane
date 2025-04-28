# Script PowerShell pour importer un fichier SQL dans PostgreSQL via Docker
# Usage: .\Import-SQL.ps1 <fichier_sql>

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"

# Vérifier si le fichier SQL est spécifié
if ($args.Count -eq 0) {
    Write-Host "Erreur: Vous devez spécifier un fichier SQL à importer." -ForegroundColor Red
    Write-Host "Usage: .\Import-SQL.ps1 <fichier_sql>"
    exit 1
}

$SQL_FILE = $args[0]

# Si le chemin n'est pas absolu, ajouter le préfixe du répertoire backups
if (-not [System.IO.Path]::IsPathRooted($SQL_FILE)) {
    $SQL_FILE = ".\backups\$SQL_FILE"
}

# Vérifier si le fichier SQL existe
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "Erreur: Le fichier SQL '$SQL_FILE' n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "Importation du fichier SQL $SQL_FILE dans la base de données $DB_NAME..."

# Copier le fichier SQL dans le conteneur
Write-Host "Copie du fichier SQL vers le conteneur..."
docker cp $SQL_FILE ${CONTAINER_NAME}:/tmp/import.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la copie du fichier SQL vers le conteneur." -ForegroundColor Red
    exit 1
}

# Supprimer la base de données existante
Write-Host "Suppression de la base de données $DB_NAME si elle existe..."
$dropResult = docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la suppression de la base de données: $dropResult" -ForegroundColor Red
    exit 1
}

# Créer une nouvelle base de données
Write-Host "Création de la base de données $DB_NAME..."
$createResult = docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la création de la base de données: $createResult" -ForegroundColor Red
    exit 1
}

# Importer le fichier SQL
Write-Host "Importation du fichier SQL dans la base de données..."
docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f /tmp/import.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Importation réussie!" -ForegroundColor Green
    
    # Vérifier le nombre de tables importées
    $tableCount = docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t
    $tableCount = $tableCount.Trim()
    Write-Host "Nombre de tables importées: $tableCount" -ForegroundColor Green
} else {
    Write-Host "Avertissement: L'importation s'est terminée avec des avertissements ou des erreurs." -ForegroundColor Yellow
    Write-Host "Veuillez vérifier l'état de la base de données."
}

# Nettoyer le fichier temporaire
Write-Host "Nettoyage du fichier temporaire..."
docker exec -t $CONTAINER_NAME rm /tmp/import.sql

Write-Host "Opération terminée." -ForegroundColor Green
