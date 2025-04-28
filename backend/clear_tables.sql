-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Vider toutes les tables en préservant la structure
TRUNCATE TABLE 
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

-- Réinitialiser les séquences
ALTER SEQUENCE fournisseurs_id_seq RESTART WITH 1;
ALTER SEQUENCE matieres_premieres_id_seq RESTART WITH 1;
ALTER SEQUENCE transformations_id_seq RESTART WITH 1;
ALTER SEQUENCE semi_finis_id_seq RESTART WITH 1;
ALTER SEQUENCE produits_finis_id_seq RESTART WITH 1;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;
ALTER SEQUENCE analyses_bon_livraison_id_seq RESTART WITH 1;
ALTER SEQUENCE analyses_bulletin_analyse_id_seq RESTART WITH 1;
ALTER SEQUENCE resultats_bon_livraison_id_seq RESTART WITH 1;
ALTER SEQUENCE resultats_bulletin_analyse_id_seq RESTART WITH 1;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';
