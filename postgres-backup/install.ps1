# Script d'installation du conteneur PostgreSQL sur la nouvelle machine
# ExÃ©cuter ce script sur la machine cible aprÃ¨s avoir copiÃ© le dossier de sauvegarde

# VÃ©rifier que Docker est installÃ©
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker n'est pas installÃ©. Veuillez installer Docker Desktop avant de continuer." -ForegroundColor Red
    exit 1
}

# CrÃ©er le volume et restaurer les donnÃ©es (si sauvegarde de volume disponible)
if (Test-Path -Path "postgres-volume.tar.gz" -or Test-Path -Path "postgres-volume.zip") {
    Write-Host "Restauration du volume PostgreSQL..." -ForegroundColor Cyan
    
    # CrÃ©er un volume Docker
    docker volume create douane_postgres_data
    
    # CrÃ©er un conteneur temporaire pour restaurer les donnÃ©es
    C:\App\douane_V3_1.0\douane_v3.9.5 = (Get-Location).Path
    
    # VÃ©rifier si nous avons une archive zip (nouvelle mÃ©thode) ou tar.gz (ancienne mÃ©thode)
    if (Test-Path "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-volume.zip") {
        # Extraire l'archive zip
        Write-Host "Extraction de l'archive zip..." -ForegroundColor Cyan
        Expand-Archive -Path "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-volume.zip" -DestinationPath "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-data" -Force
        
        # CrÃ©er un conteneur temporaire pour copier les donnÃ©es vers le volume
        temp-postgres-backup-container = "temp-postgres-restore-container"
        docker create --name temp-postgres-backup-container -v douane_postgres_data:/var/lib/postgresql/data postgres:latest
        
        # Copier les donnÃ©es vers le conteneur
        docker cp "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-data\*" temp-postgres-backup-container:/var/lib/postgresql/data/
        
        # Supprimer le conteneur temporaire
        docker rm temp-postgres-backup-container
        
        # Nettoyer le rÃ©pertoire temporaire
        Remove-Item -Recurse -Force "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-data"
    } else if (Test-Path "C:\App\douane_V3_1.0\douane_v3.9.5\postgres-volume.tar.gz") {
        # Utiliser la mÃ©thode tar.gz (ancienne mÃ©thode)
        docker run --rm -v douane_postgres_data:/data -v "C:\App\douane_V3_1.0\douane_v3.9.5":/backup alpine sh -c "cd /data && tar -xzf /backup/postgres-volume.tar.gz"
    } else {
        Write-Host "Aucune archive de volume trouvÃ©e. Les donnÃ©es seront initialisÃ©es Ã  partir du dump SQL." -ForegroundColor Yellow
    }
    
    Write-Host "Volume restaurÃ© avec succÃ¨s" -ForegroundColor Green
}

# DÃ©marrer le conteneur avec docker-compose
Write-Host "DÃ©marrage du conteneur PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Installation terminÃ©e!" -ForegroundColor Green
Write-Host "Le conteneur PostgreSQL est maintenant disponible sur localhost:5434" -ForegroundColor Green
Write-Host "Utilisateur: postgres" -ForegroundColor Green
Write-Host "Mot de passe: postgres" -ForegroundColor Green
Write-Host "Base de donnÃ©es: douane" -ForegroundColor Green
Write-Host "\nIMPORTANT: Cette installation est une copie et n'affecte pas le conteneur original." -ForegroundColor Yellow
