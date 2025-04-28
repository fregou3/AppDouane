-- Création de la table documents_requis
CREATE TABLE IF NOT EXISTS documents_requis (
    id SERIAL PRIMARY KEY,
    type_element VARCHAR(50) NOT NULL,
    type_document VARCHAR(100) NOT NULL,
    UNIQUE (type_element, type_document)
);

-- Insertion des types de documents requis
INSERT INTO documents_requis (type_element, type_document)
VALUES
    ('plante', 'Certificat d''origine'),
    ('plante', 'Facture'),
    ('plante', 'Bon de livraison'),
    ('plante', 'Certificat phytosanitaire'),
    ('extrait', 'Certificat d''origine'),
    ('extrait', 'Facture'),
    ('extrait', 'Bon de livraison'),
    ('extrait', 'Certificat d''analyse'),
    ('sauce', 'Fiche technique'),
    ('sauce', 'Certificat d''analyse'),
    ('sauce', 'Bon de fabrication'),
    ('produit', 'Fiche technique'),
    ('produit', 'Certificat d''analyse'),
    ('produit', 'Bon de fabrication'),
    ('produit', 'Déclaration douanière')
ON CONFLICT DO NOTHING;
