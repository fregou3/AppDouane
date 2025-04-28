-- Nettoyage des tables existantes
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE transformations CASCADE;
TRUNCATE TABLE matieres_premieres CASCADE;
TRUNCATE TABLE fournisseurs CASCADE;

-- Insertion des fournisseurs
INSERT INTO fournisseurs (nom, adresse, pays) VALUES
    ('Aroma-Zone', '42 Avenue Wagram, 75008 Paris', 'France'),
    ('Botanica', 'Hauptstraße 25, 10178 Berlin', 'Allemagne'),
    ('Making Cosmetics', '15 Rue du Commerce, 75015 Paris', 'France'),
    ('Création & Parfum', '8 Avenue des Champs-Élysées, 75008 Paris', 'France');

-- Insertion des matières premières
INSERT INTO matieres_premieres (
    nom,
    type,
    lot,
    fournisseur_id,
    pays_origine,
    matiere_premiere_source,
    regle_origine
) VALUES 
    (
        'Huile essentielle de lavande',
        'extrait',
        'LAV2024001',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'France',
        'Lavande fine de Provence',
        'Origine UE - PDO Provence'
    ),
    (
        'Extrait de calendula',
        'extrait',
        'CAL2024002',
        (SELECT id FROM fournisseurs WHERE nom = 'Botanica'),
        'Allemagne',
        'Fleurs de Calendula Bio',
        'Origine UE'
    ),
    (
        'Acide hyaluronique',
        'extrait',
        'AH2024003',
        (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics'),
        'France',
        'Fermentation bactérienne',
        'Origine UE'
    ),
    (
        'Parfum rose',
        'extrait',
        'PRF2024004',
        (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum'),
        'France',
        'Synthèse',
        'Origine UE'
    ),
    (
        'Cosgard',
        'extrait',
        'COS2024005',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'France',
        'Synthèse chimique',
        'Origine UE'
    );

-- Insertion des transformations
INSERT INTO transformations (
    nom,
    fournisseur_id,
    lot,
    pays_origine,
    valeur,
    code_douanier,
    description,
    matiere_premiere_id
) VALUES
    -- Transformations pour Huile essentielle de lavande
    (
        'Distillation vapeur',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'DIST-LAV001',
        'France',
        150.00,
        '3301.29',
        'Distillation à la vapeur d''eau des fleurs de lavande',
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande')
    ),
    (
        'Rectification',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'RECT-LAV001',
        'Italie',
        180.00,
        '3301.29',
        'Purification par rectification de l''huile essentielle',
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande')
    ),
    (
        'Filtration',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'FILT-LAV001',
        'Espagne',
        160.00,
        '3301.29',
        'Filtration fine pour éliminer les impuretés',
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande')
    ),
    
    -- Transformations pour Extrait de calendula
    (
        'Macération',
        (SELECT id FROM fournisseurs WHERE nom = 'Botanica'),
        'MAC-CAL001',
        'Allemagne',
        80.00,
        '1302.19',
        'Macération des fleurs de calendula dans huile végétale',
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula')
    ),
    (
        'Filtration',
        (SELECT id FROM fournisseurs WHERE nom = 'Botanica'),
        'FILT-CAL001',
        'Autriche',
        90.00,
        '1302.19',
        'Filtration de l''extrait de calendula',
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula')
    ),
    (
        'Concentration',
        (SELECT id FROM fournisseurs WHERE nom = 'Botanica'),
        'CONC-CAL001',
        'Suisse',
        100.00,
        '1302.19',
        'Concentration de l''extrait par évaporation',
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula')
    ),
    
    -- Transformations pour Acide hyaluronique
    (
        'Fermentation',
        (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics'),
        'FERM-AH001',
        'France',
        200.00,
        '2918.19',
        'Fermentation bactérienne pour production d''acide hyaluronique',
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique')
    ),
    (
        'Purification',
        (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics'),
        'PUR-AH001',
        'Belgique',
        220.00,
        '2918.19',
        'Purification par chromatographie',
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique')
    ),
    (
        'Lyophilisation',
        (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics'),
        'LYO-AH001',
        'Pays-Bas',
        240.00,
        '2918.19',
        'Lyophilisation pour obtention de poudre',
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique')
    ),
    
    -- Transformations pour Parfum rose
    (
        'Extraction solvant',
        (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum'),
        'EXT-PRF001',
        'France',
        300.00,
        '3302.90',
        'Extraction par solvant des composés odorants',
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose')
    ),
    (
        'Distillation fractionnée',
        (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum'),
        'DIST-PRF001',
        'Bulgarie',
        320.00,
        '3302.90',
        'Séparation des composés par distillation fractionnée',
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose')
    ),
    (
        'Formulation',
        (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum'),
        'FORM-PRF001',
        'Grèce',
        350.00,
        '3302.90',
        'Formulation finale du parfum',
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose')
    ),
    
    -- Transformations pour Cosgard
    (
        'Synthèse',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'SYN-COS001',
        'France',
        120.00,
        '2905.49',
        'Synthèse chimique du conservateur',
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard')
    ),
    (
        'Purification',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'PUR-COS001',
        'Irlande',
        140.00,
        '2905.49',
        'Purification par distillation',
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard')
    ),
    (
        'Standardisation',
        (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone'),
        'STD-COS001',
        'Portugal',
        130.00,
        '2905.49',
        'Standardisation de la concentration',
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard')
    );

-- Insertion des documents (tous en statut 'en_attente')
INSERT INTO documents (
    matiere_premiere_id,
    transformation_id,
    type_document,
    fichier_path,
    status
) VALUES
    -- Documents pour Huile essentielle de lavande
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande'),
        (SELECT id FROM transformations WHERE nom = 'Distillation vapeur' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bon_livraison',
        '/path/to/bl_lavande_dist.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande'),
        (SELECT id FROM transformations WHERE nom = 'Rectification' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bulletin_analyse',
        '/path/to/ba_lavande_rect.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Huile essentielle de lavande'),
        (SELECT id FROM transformations WHERE nom = 'Filtration' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bon_livraison',
        '/path/to/bl_lavande_filt.pdf',
        'en_attente'
    ),
    
    -- Documents pour Extrait de calendula
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula'),
        (SELECT id FROM transformations WHERE nom = 'Macération' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Botanica')),
        'bon_livraison',
        '/path/to/bl_calendula_mac.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula'),
        (SELECT id FROM transformations WHERE nom = 'Filtration' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Botanica')),
        'bulletin_analyse',
        '/path/to/ba_calendula_filt.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Extrait de calendula'),
        (SELECT id FROM transformations WHERE nom = 'Concentration' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Botanica')),
        'bon_livraison',
        '/path/to/bl_calendula_conc.pdf',
        'en_attente'
    ),
    
    -- Documents pour Acide hyaluronique
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique'),
        (SELECT id FROM transformations WHERE nom = 'Fermentation' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics')),
        'bon_livraison',
        '/path/to/bl_ah_ferm.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique'),
        (SELECT id FROM transformations WHERE nom = 'Purification' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics')),
        'bulletin_analyse',
        '/path/to/ba_ah_pur.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Acide hyaluronique'),
        (SELECT id FROM transformations WHERE nom = 'Lyophilisation' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Making Cosmetics')),
        'bon_livraison',
        '/path/to/bl_ah_lyo.pdf',
        'en_attente'
    ),
    
    -- Documents pour Parfum rose
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose'),
        (SELECT id FROM transformations WHERE nom = 'Extraction solvant' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum')),
        'bon_livraison',
        '/path/to/bl_parfum_ext.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose'),
        (SELECT id FROM transformations WHERE nom = 'Distillation fractionnée' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum')),
        'bulletin_analyse',
        '/path/to/ba_parfum_dist.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Parfum rose'),
        (SELECT id FROM transformations WHERE nom = 'Formulation' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Création & Parfum')),
        'bon_livraison',
        '/path/to/bl_parfum_form.pdf',
        'en_attente'
    ),
    
    -- Documents pour Cosgard
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard'),
        (SELECT id FROM transformations WHERE nom = 'Synthèse' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bon_livraison',
        '/path/to/bl_cosgard_syn.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard'),
        (SELECT id FROM transformations WHERE nom = 'Purification' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bulletin_analyse',
        '/path/to/ba_cosgard_pur.pdf',
        'en_attente'
    ),
    (
        (SELECT id FROM matieres_premieres WHERE nom = 'Cosgard'),
        (SELECT id FROM transformations WHERE nom = 'Standardisation' AND fournisseur_id = (SELECT id FROM fournisseurs WHERE nom = 'Aroma-Zone')),
        'bon_livraison',
        '/path/to/bl_cosgard_std.pdf',
        'en_attente'
    );
