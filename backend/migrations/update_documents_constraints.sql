-- Ajout des nouvelles colonnes à la table documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS semi_fini_id INTEGER REFERENCES semi_finis(id),
ADD COLUMN IF NOT EXISTS produit_fini_id INTEGER REFERENCES produits_finis(id);

-- Mise à jour des types de documents autorisés
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_type_document_check;

ALTER TABLE documents
ADD CONSTRAINT documents_type_document_check 
CHECK (type_document IN (
    'bon_livraison', 'bulletin_analyse', 'certificat',
    'controle_qualite', 'certificat_transformation', 'certificat_conformite',
    'certificat_origine', 'facture', 'certificat_phytosanitaire',
    'fiche_technique', 'bon_fabrication', 'declaration_douaniere'
));

-- Nettoyer les données existantes pour s'assurer qu'un seul ID de référence est rempli
UPDATE documents
SET transformation_id = NULL
WHERE matiere_premiere_id IS NOT NULL AND transformation_id IS NOT NULL;

-- Ajout de la contrainte pour s'assurer qu'un seul ID de référence est rempli
ALTER TABLE documents
ADD CONSTRAINT check_one_reference CHECK (
    (CASE WHEN matiere_premiere_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN transformation_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN semi_fini_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN produit_fini_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);
