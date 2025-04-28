@echo off
setlocal enabledelayedexpansion

REM Script pour sauvegarder ou restaurer la base de données PostgreSQL via Docker sur Windows
REM Usage: backup-restore-db.bat [backup|restore] [nom_fichier]

REM Définir les variables
set CONTAINER_NAME=douane_db
set DB_NAME=douane
set DB_USER=postgres
set BACKUP_DIR=backups

REM Créer le répertoire de sauvegarde s'il n'existe pas
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Vérifier les arguments
if "%1"=="" (
    echo Erreur: Vous devez spécifier une action (backup ou restore).
    echo Usage: backup-restore-db.bat [backup^|restore] [nom_fichier]
    exit /b 1
)

REM Traiter l'action de sauvegarde
if "%1"=="backup" (
    REM Définir le nom du fichier de sauvegarde
    set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=!TIMESTAMP: =0!
    
    if "%2"=="" (
        set BACKUP_FILE=%BACKUP_DIR%\douane_backup_!TIMESTAMP!.dump
    ) else (
        set BACKUP_FILE=%BACKUP_DIR%\%2
    )
    
    echo Sauvegarde de la base de données %DB_NAME% en cours...
    echo Fichier de sauvegarde: !BACKUP_FILE!
    
    REM Exécuter la commande pg_dump dans le conteneur Docker
    docker exec -t %CONTAINER_NAME% pg_dump -U %DB_USER% -Fc %DB_NAME% > !BACKUP_FILE!
    
    if !errorlevel! equ 0 (
        echo Sauvegarde réussie! Fichier créé: !BACKUP_FILE!
        for %%A in (!BACKUP_FILE!) do echo Taille du fichier: %%~zA octets
    ) else (
        echo Erreur lors de la sauvegarde de la base de données.
        exit /b 1
    )
    
    echo Opération terminée.
    exit /b 0
)

REM Traiter l'action de restauration
if "%1"=="restore" (
    REM Vérifier si le fichier de sauvegarde est spécifié
    if "%2"=="" (
        echo Erreur: Vous devez spécifier un fichier de sauvegarde.
        echo Usage: backup-restore-db.bat restore ^<fichier_de_sauvegarde^>
        exit /b 1
    )
    
    set BACKUP_FILE=%BACKUP_DIR%\%2
    
    REM Vérifier si le fichier de sauvegarde existe
    if not exist !BACKUP_FILE! (
        echo Erreur: Le fichier de sauvegarde '!BACKUP_FILE!' n'existe pas.
        exit /b 1
    )
    
    echo Restauration de la base de données %DB_NAME% à partir du fichier !BACKUP_FILE!...
    
    REM Vérifier si la base de données existe déjà et la supprimer
    echo Suppression de la base de données %DB_NAME% si elle existe...
    docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -c "DROP DATABASE IF EXISTS %DB_NAME% WITH (FORCE);"
    
    REM Créer la base de données
    echo Création de la base de données %DB_NAME%...
    docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
    
    REM Restaurer la base de données à partir du fichier de sauvegarde
    echo Restauration des données à partir de !BACKUP_FILE!...
    type !BACKUP_FILE! | docker exec -i %CONTAINER_NAME% pg_restore -U %DB_USER% -d %DB_NAME% --clean --if-exists
    
    if !errorlevel! equ 0 (
        echo Restauration réussie!
    ) else (
        echo Avertissement: La restauration s'est terminée avec des avertissements ou des erreurs.
        echo Veuillez vérifier l'état de la base de données.
    )
    
    echo Opération terminée.
    exit /b 0
)

echo Action non reconnue: %1
echo Usage: backup-restore-db.bat [backup^|restore] [nom_fichier]
exit /b 1
