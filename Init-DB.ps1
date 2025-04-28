# Script PowerShell pour initialiser la base de données PostgreSQL via Docker
# Usage: .\Init-DB.ps1 [chemin_du_fichier_sql]

# Définir les variables
$CONTAINER_NAME = "douane_db"
$DB_NAME = "douane"
$DB_USER = "postgres"

# Vérifier si un fichier SQL est spécifié
if ($args.Count -gt 0) {
    $SQL_FILE = $args[0]
} else {
    # Utiliser le fichier SQL par défaut
    $SQL_FILE = ".\douane_3.4.1.sql\douane_3.4.1.sql"
}

# Vérifier si le fichier SQL existe
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "Erreur: Le fichier SQL '$SQL_FILE' n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "Initialisation de la base de données $DB_NAME avec le fichier $SQL_FILE..."

# Vérifier si la base de données existe
Write-Host "Vérification de l'existence de la base de données $DB_NAME..."
$dbExists = docker exec -t $CONTAINER_NAME psql -U $DB_USER -lqt | Select-String -Pattern "\s$DB_NAME\s"

if ($dbExists) {
    # Si la base de données existe, vérifier si elle contient des tables
    $tableCount = docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t
    $tableCount = $tableCount.Trim()
    
    if ($tableCount -ne "0") {
        Write-Host "Attention: La base de données $DB_NAME existe déjà et contient $tableCount tables." -ForegroundColor Yellow
        $confirmation = Read-Host "Voulez-vous supprimer et recréer la base de données? (O/N)"
        if ($confirmation -ne "O" -and $confirmation -ne "o") {
            Write-Host "Opération annulée." -ForegroundColor Yellow
            exit 0
        }
        
        # Supprimer la base de données existante
        Write-Host "Suppression de la base de données $DB_NAME..."
        docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE $DB_NAME WITH (FORCE);"
        
        # Créer une nouvelle base de données
        Write-Host "Création d'une nouvelle base de données $DB_NAME..."
        docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    } else {
        Write-Host "La base de données $DB_NAME existe mais est vide. Initialisation en cours..."
    }
} else {
    # Créer la base de données si elle n'existe pas
    Write-Host "Création de la base de données $DB_NAME..."
    docker exec -t $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
}

# Copier le fichier SQL dans le conteneur
$TEMP_CONTAINER_PATH = "/tmp/init_db.sql"
Write-Host "Copie du fichier SQL vers le conteneur..."
docker cp $SQL_FILE ${CONTAINER_NAME}:${TEMP_CONTAINER_PATH}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la copie du fichier SQL vers le conteneur." -ForegroundColor Red
    exit 1
}

# Exécuter le script SQL
Write-Host "Exécution du script SQL pour initialiser la base de données..."
$result = docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f $TEMP_CONTAINER_PATH 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Initialisation de la base de données réussie!" -ForegroundColor Green
    
    # Vérifier le nombre de tables créées
    $tableCount = docker exec -t $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t
    $tableCount = $tableCount.Trim()
    Write-Host "Nombre de tables créées: $tableCount" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de l'initialisation de la base de données: $result" -ForegroundColor Red
    exit 1
}

# Nettoyer le fichier temporaire
docker exec -t $CONTAINER_NAME rm $TEMP_CONTAINER_PATH

Write-Host "Opération terminée." -ForegroundColor Green
