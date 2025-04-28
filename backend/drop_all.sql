-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = 'replica';

-- Supprimer toutes les vues
DROP VIEW IF EXISTS vue_transformations CASCADE;

-- Supprimer toutes les tables
DROP TABLE IF EXISTS
    resultats_bulletin_analyse,
    resultats_bon_livraison,
    analyses_bulletin_analyse,
    analyses_bon_livraison,
    documents,
    documents_requis,
    semi_finis_transformations,
    semi_finis_matieres_premieres,
    matieres_transformations,
    produits_finis,
    semi_finis,
    transformations,
    matieres_premieres,
    fournisseurs
CASCADE;

-- Supprimer toutes les séquences
DROP SEQUENCE IF EXISTS
    fournisseurs_id_seq,
    matieres_premieres_id_seq,
    transformations_id_seq,
    semi_finis_id_seq,
    produits_finis_id_seq,
    documents_id_seq,
    analyses_bon_livraison_id_seq,
    analyses_bulletin_analyse_id_seq,
    resultats_bon_livraison_id_seq,
    resultats_bulletin_analyse_id_seq
CASCADE;

-- Supprimer les types personnalisés
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) 
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Supprimer toutes les fonctions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT proname, oid FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
END $$;

-- Supprimer tous les triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tgname, tgrelid::regclass as table_name
              FROM pg_trigger
              WHERE tgisinternal = false)
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ' || r.table_name || ' CASCADE';
    END LOOP;
END $$;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- Message de confirmation
DO $$ 
BEGIN 
    RAISE NOTICE 'Tous les objets de la base de données ont été supprimés avec succès.';
END $$;
