-- Insertion des fournisseurs
INSERT INTO fournisseurs (nom, adresse, pays) VALUES
('Naturex SA', '250 rue Pierre Bayle BP 81218, 84911 Avignon', 'France'),
('Givaudan', 'Chemin de la Parfumerie 5, 1214 Vernier', 'Suisse'),
('Firmenich', 'Route des Jeunes 1, Case Postale 239, 1211 Genève', 'Suisse'),
('Symrise', 'Mühlenfeldstraße 1, 37603 Holzminden', 'Allemagne');

-- Insertion des matières premières
INSERT INTO matieres_premieres (nom, type, lot, fournisseur_id, pays_origine, valeur, code_douanier) VALUES
('Extrait de Vanille', 'extrait', 'LOT2023-001', 1, 'Madagascar', 150.00, '1302.19'),
('Huile Essentielle de Lavande', 'extrait', 'LOT2023-002', 2, 'France', 80.00, '3301.29'),
('Essence de Rose', 'extrait', 'LOT2023-003', 3, 'Bulgarie', 200.00, '3301.29'),
('Extrait de Citron', 'extrait', 'LOT2023-004', 4, 'Italie', 60.00, '3301.13');

-- Insertion des transformations
INSERT INTO transformations (nom, fournisseur_id, lot, origine, valeur, code_douanier, description, matiere_premiere_id) VALUES
('Concentration Vanille', 1, 'TRANS2023-001', 'France', 300.00, '3302.10', 'Concentration de l''extrait de vanille', 1),
('Mélange Lavande', 2, 'TRANS2023-002', 'France', 160.00, '3302.90', 'Mélange d''huiles essentielles de lavande', 2),
('Absolue de Rose', 3, 'TRANS2023-003', 'Suisse', 400.00, '3302.90', 'Concentration d''essence de rose', 3),
('Essence Citron Concentrée', 4, 'TRANS2023-004', 'Allemagne', 120.00, '3302.10', 'Concentration d''extrait de citron', 4);

-- Insertion des semi-finis
INSERT INTO semi_finis (nom, lot_number, pays_origine, valeur, code_douanier) VALUES
('Base Parfum Vanille', 'SF2023-001', 'France', 450.00, '3302.90'),
('Base Parfum Lavande', 'SF2023-002', 'France', 240.00, '3302.90'),
('Base Parfum Rose', 'SF2023-003', 'Suisse', 600.00, '3302.90'),
('Base Parfum Citron', 'SF2023-004', 'Allemagne', 180.00, '3302.90');

-- Insertion des liens entre matières premières et transformations
INSERT INTO matieres_transformations (matiere_premiere_id, transformation_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Insertion des liens entre semi-finis et matières premières
INSERT INTO semi_finis_matieres_premieres (semi_fini_id, matiere_premiere_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Insertion des liens entre semi-finis et transformations
INSERT INTO semi_finis_transformations (semi_fini_id, transformation_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- Insertion des documents requis
INSERT INTO documents_requis (type_element, type_document) VALUES
('matiere_premiere', 'bon_livraison'),
('matiere_premiere', 'bulletin_analyse'),
('matiere_premiere', 'certificat_origine'),
('transformation', 'certificat_transformation'),
('transformation', 'certificat_conformite'),
('semi_fini', 'fiche_technique'),
('semi_fini', 'bon_fabrication');
