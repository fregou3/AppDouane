-- Création de la base de données si elle n'existe pas
SELECT 'CREATE DATABASE douane' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'douane')\gexec

-- Connexion à la base de données douane
\c douane;

-- Suppression des tables si elles existent
DROP TABLE IF EXISTS resultats_bulletin_analyse CASCADE;
DROP TABLE IF EXISTS analyses_bulletin_analyse CASCADE;
DROP TABLE IF EXISTS resultats_bon_livraison CASCADE;
DROP TABLE IF EXISTS analyses_bon_livraison CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS transformations CASCADE;
DROP TABLE IF EXISTS matieres_premieres CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS semi_finis_matieres_premieres CASCADE;
DROP TABLE IF EXISTS semi_finis_transformations CASCADE;
DROP TABLE IF EXISTS semi_finis CASCADE;
DROP TABLE IF EXISTS produits_finis CASCADE;

-- Création de la table fournisseurs
CREATE TABLE fournisseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    pays VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table matieres_premieres
CREATE TABLE matieres_premieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('metal', 'plastic', 'plante', 'extrait', 'carton', 'verre', 'tissu')),
    lot VARCHAR(100) NOT NULL,
    fournisseur_id INTEGER REFERENCES fournisseurs(id),
    pays_origine VARCHAR(100),
    valeur DECIMAL(10,2),
    code_douanier VARCHAR(50),
    matiere_premiere_source VARCHAR(255),
    regle_origine TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table transformations
CREATE TABLE transformations (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    fournisseur_id INTEGER REFERENCES fournisseurs(id),
    lot VARCHAR(100) NOT NULL,
    origine VARCHAR(100),
    valeur DECIMAL(10,2),
    code_douanier VARCHAR(50),
    description TEXT,
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table semi-finis
CREATE TABLE IF NOT EXISTS semi_finis (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    lot_number VARCHAR(255),
    pays_origine VARCHAR(100),
    valeur DECIMAL(10,2),
    code_douanier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table semi-finis_matieres_premieres
CREATE TABLE IF NOT EXISTS semi_finis_matieres_premieres (
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    PRIMARY KEY (semi_fini_id, matiere_premiere_id)
);

-- Création de la table semi-finis_transformations
CREATE TABLE IF NOT EXISTS semi_finis_transformations (
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    transformation_id INTEGER REFERENCES transformations(id),
    PRIMARY KEY (semi_fini_id, transformation_id)
);

-- Création de la table produits_finis
CREATE TABLE produits_finis (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    lot_number VARCHAR(100),
    valeur DECIMAL(10,2),
    code_douanier VARCHAR(50),
    sauce_id INTEGER REFERENCES semi_finis(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajout des colonnes manquantes si elles n'existent pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'produits_finis' AND column_name = 'pays_origine') THEN
        ALTER TABLE produits_finis ADD COLUMN pays_origine VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'produits_finis' AND column_name = 'lot_number') THEN
        ALTER TABLE produits_finis ADD COLUMN lot_number VARCHAR(100);
    END IF;
END $$;

-- Création de la table documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    transformation_id INTEGER REFERENCES transformations(id),
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    produit_fini_id INTEGER REFERENCES produits_finis(id),
    type_document VARCHAR(50) CHECK (type_document IN (
        'bon_livraison', 'bulletin_analyse', 'certificat',
        'controle_qualite', 'certificat_transformation', 'certificat_conformite',
        'certificat_origine', 'facture', 'certificat_phytosanitaire',
        'fiche_technique', 'bon_fabrication', 'declaration_douaniere'
    )),
    fichier_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'valide', 'rejete')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_one_reference CHECK (
        (CASE WHEN matiere_premiere_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN transformation_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN semi_fini_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN produit_fini_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

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

-- Création de la table analyses_bon_livraison
CREATE TABLE IF NOT EXISTS analyses_bon_livraison (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    date_analyse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_document BOOLEAN DEFAULT false,
    nom_fournisseur BOOLEAN DEFAULT false,
    nom_matiere_premiere BOOLEAN DEFAULT false,
    numero_bl BOOLEAN DEFAULT false,
    adresse_depart BOOLEAN DEFAULT false,
    adresse_destination BOOLEAN DEFAULT false,
    poids_colis BOOLEAN DEFAULT false,
    mode_transport BOOLEAN DEFAULT false,
    resume TEXT,
    ratio_conformite DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table analyses_bulletin_analyse
CREATE TABLE IF NOT EXISTS analyses_bulletin_analyse (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    date_analyse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_document BOOLEAN DEFAULT false,
    nom_fournisseur BOOLEAN DEFAULT false,
    numero_lot BOOLEAN DEFAULT false,
    numero_commande BOOLEAN DEFAULT false,
    nom_matiere_premiere BOOLEAN DEFAULT false,
    caracteristiques_matiere BOOLEAN DEFAULT false,
    resume TEXT,
    ratio_conformite DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table resultats_bon_livraison
CREATE TABLE resultats_bon_livraison (
    id SERIAL PRIMARY KEY,
    analyse_id INTEGER REFERENCES analyses_bon_livraison(id),
    document_id INTEGER REFERENCES documents(id),
    critere VARCHAR(100) NOT NULL,
    valeur_attendue TEXT,
    valeur_trouvee TEXT,
    est_conforme BOOLEAN,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table resultats_bulletin_analyse
CREATE TABLE resultats_bulletin_analyse (
    id SERIAL PRIMARY KEY,
    analyse_id INTEGER REFERENCES analyses_bulletin_analyse(id),
    document_id INTEGER REFERENCES documents(id),
    specification VARCHAR(100) NOT NULL,
    valeur_attendue TEXT,
    valeur_trouvee TEXT,
    est_conforme BOOLEAN,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la vue pour les transformations avec les noms des fournisseurs
CREATE OR REPLACE VIEW vue_transformations AS
SELECT 
    t.id,
    t.nom,
    f.nom as fournisseur,
    t.lot,
    t.origine,
    t.valeur,
    t.code_douanier,
    t.description,
    t.matiere_premiere_id,
    t.created_at,
    t.updated_at
FROM transformations t
JOIN fournisseurs f ON t.fournisseur_id = f.id;

-- Création des triggers pour la mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les tables principales
CREATE TRIGGER update_fournisseurs_updated_at
    BEFORE UPDATE ON fournisseurs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matieres_premieres_updated_at
    BEFORE UPDATE ON matieres_premieres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transformations_updated_at
    BEFORE UPDATE ON transformations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semi_finis_updated_at
    BEFORE UPDATE ON semi_finis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produits_finis_updated_at
    BEFORE UPDATE ON produits_finis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour les tables d'analyse
CREATE TRIGGER update_analyses_bon_livraison_updated_at
    BEFORE UPDATE ON analyses_bon_livraison
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_bulletin_analyse_updated_at
    BEFORE UPDATE ON analyses_bulletin_analyse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour les tables de résultats
CREATE TRIGGER update_resultats_bon_livraison_updated_at
    BEFORE UPDATE ON resultats_bon_livraison
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resultats_bulletin_analyse_updated_at
    BEFORE UPDATE ON resultats_bulletin_analyse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
