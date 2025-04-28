-- Nettoyage des tables de conformité
TRUNCATE TABLE resultats_bulletin_analyse CASCADE;
TRUNCATE TABLE analyses_bulletin_analyse CASCADE;
TRUNCATE TABLE resultats_bon_livraison CASCADE;
TRUNCATE TABLE analyses_bon_livraison CASCADE;

-- Réinitialisation des status des documents
UPDATE documents SET status = 'en_attente';
