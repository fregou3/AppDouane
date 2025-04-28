-- Supprimer les anciennes entrées
TRUNCATE TABLE documents_requis;

-- Insérer les nouveaux types de documents requis standardisés
INSERT INTO documents_requis (type_element, type_document)
VALUES
    -- Documents obligatoires pour tous les types
    ('plante', 'bon_livraison'),
    ('plante', 'bulletin_analyse'),
    ('plante', 'certificat'),
    ('extrait', 'bon_livraison'),
    ('extrait', 'bulletin_analyse'),
    ('extrait', 'certificat'),
    ('sauce', 'bon_livraison'),
    ('sauce', 'bulletin_analyse'),
    ('sauce', 'certificat'),
    ('produit', 'bon_livraison'),
    ('produit', 'bulletin_analyse'),
    ('produit', 'certificat');
