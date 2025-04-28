# Instructions pour cloner le conteneur PostgreSQL

Ce dossier contient tous les fichiers nÃ©cessaires pour recrÃ©er votre conteneur PostgreSQL sur une autre machine.

## IMPORTANT
Ce processus de sauvegarde et restauration ne modifie ni ne supprime votre base de donnÃ©es PostgreSQL originale. Il crÃ©e uniquement une copie qui peut Ãªtre dÃ©ployÃ©e sur une autre machine.

## Contenu du dossier
- container-config.json : Configuration complÃ¨te du conteneur d'origine
- postgres-dump.sql : Sauvegarde complÃ¨te de la base de donnÃ©es PostgreSQL
- postgres-volume.tar.gz : Sauvegarde du volume Docker (si disponible)
- docker-compose.yml : Fichier pour recrÃ©er le conteneur
- install.ps1 : Script PowerShell pour l'installation sur la nouvelle machine

## Instructions pour la nouvelle machine

1. Installez Docker Desktop sur la machine cible si ce n'est pas dÃ©jÃ  fait
2. Copiez l'intÃ©gralitÃ© de ce dossier sur la machine cible
3. Ouvrez PowerShell dans le dossier copiÃ©
4. ExÃ©cutez le script d'installation : .\install.ps1
5. Le conteneur PostgreSQL sera crÃ©Ã© avec toutes vos donnÃ©es

## Informations de connexion
- HÃ´te : localhost
- Port : 5434
- Utilisateur : postgres
- Mot de passe : postgres
- Base de donnÃ©es : douane

## Remarques
- Si vous avez besoin de modifier les paramÃ¨tres, Ã©ditez le fichier docker-compose.yml avant de lancer l'installation
- Pour vÃ©rifier que tout fonctionne, vous pouvez vous connecter Ã  la base de donnÃ©es avec : 
  docker exec -it douane_db psql -U postgres -d douane
