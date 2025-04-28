-- Désactiver temporairement les contraintes de clé étrangère
SET session_replication_role = 'replica';

-- Suppression des données des tables dans l'ordre inverse des dépendances
TRUNCATE TABLE resultats_bulletin_analyse CASCADE;
TRUNCATE TABLE resultats_bon_livraison CASCADE;
TRUNCATE TABLE analyses_bulletin_analyse CASCADE;
TRUNCATE TABLE analyses_bon_livraison CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE transformations CASCADE;
TRUNCATE TABLE matieres_premieres CASCADE;
TRUNCATE TABLE fournisseurs CASCADE;
TRUNCATE TABLE semi_finis_transformations CASCADE;
TRUNCATE TABLE semi_finis_matieres_premieres CASCADE;
TRUNCATE TABLE semi_finis CASCADE;

-- Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';
