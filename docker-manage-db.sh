#!/bin/bash

# Fonction d'aide
show_help() {
    echo "Usage: ./docker-manage-db.sh [option]"
    echo "Options:"
    echo "  init     - Initialiser la structure de la base de données"
    echo "  clear    - Vider la base de données"
    echo "  seed     - Remplir la base de données avec des données d'exemple"
    echo "  reset    - Vider puis remplir la base de données"
    echo "  clear-conformite - Vider les données de conformité"
    echo "  help     - Afficher cette aide"
}

# Vérifier si le conteneur est en cours d'exécution
check_container() {
    if ! docker ps | grep -q douane_db; then
        echo "Le conteneur douane_db n'est pas en cours d'exécution."
        exit 1
    fi
}

# Fonction pour initialiser la base de données
init_db() {
    echo "Initialisation de la structure de la base de données..."
    docker exec -i douane_db psql -U postgres < backend/init.sql
}

# Fonction pour vider la base de données
clear_db() {
    echo "Nettoyage de la base de données..."
    docker exec -i douane_db psql -U postgres -d douane < backend/clear-db.sql
}

# Fonction pour remplir la base de données
seed_db() {
    echo "Remplissage de la base de données avec les données d'exemple..."
    docker exec -i douane_db psql -U postgres -d douane < backend/seed-db.sql
}

# Fonction pour vider les données de conformité
clear_conformite() {
    echo "Nettoyage des données de conformité..."
    docker exec -i douane_db psql -U postgres -d douane < backend/clear-conformite.sql
}

# Vérifier si un argument a été fourni
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Traiter l'argument
case "$1" in
    "init")
        check_container
        init_db
        ;;
    "clear")
        check_container
        clear_db
        ;;
    "seed")
        check_container
        seed_db
        ;;
    "reset")
        check_container
        init_db
        clear_db
        seed_db
        # Pas besoin d'appeler clear_conformite car seed-db.sql vide déjà les tables
        ;;
    "clear-conformite")
        check_container
        clear_conformite
        ;;
    "help")
        show_help
        ;;
    *)
        echo "Option invalide : $1"
        show_help
        exit 1
        ;;
esac
