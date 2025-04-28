-- Function pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table fournisseurs
CREATE TABLE fournisseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    pays VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table matieres_premieres
CREATE TABLE matieres_premieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('metal', 'plastic', 'plante', 'extrait', 'carton', 'verre', 'tissu')),
    lot VARCHAR(100) NOT NULL,
    fournisseur_id INTEGER REFERENCES fournisseurs(id),
    pays_origine VARCHAR(100),
    valeur NUMERIC(10,2),
    code_douanier VARCHAR(50),
    matiere_premiere_source VARCHAR(255),
    regle_origine TEXT,
    code_douanier_gpt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table transformations
CREATE TABLE transformations (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    fournisseur_id INTEGER REFERENCES fournisseurs(id),
    lot VARCHAR(100) NOT NULL,
    origine VARCHAR(100),
    valeur NUMERIC(10,2),
    code_douanier VARCHAR(50),
    description TEXT,
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    code_douanier_gpt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table semi_finis
CREATE TABLE semi_finis (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    lot_number VARCHAR(255),
    pays_origine VARCHAR(100),
    valeur NUMERIC(10,2),
    code_douanier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table produits_finis
CREATE TABLE produits_finis (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    origine VARCHAR(255),
    valeur NUMERIC,
    code_douanier VARCHAR(255),
    semi_fini_id INTEGER,
    sauce_id INTEGER,
    pays_origine VARCHAR(100),
    lot_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    transformation_id INTEGER REFERENCES transformations(id),
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    produit_fini_id INTEGER REFERENCES produits_finis(id),
    type_document VARCHAR(50) CHECK (type_document IN (
        'bon_livraison', 'bulletin_analyse', 'certificat', 'controle_qualite',
        'certificat_transformation', 'certificat_conformite', 'certificat_origine',
        'facture', 'certificat_phytosanitaire', 'fiche_technique',
        'bon_fabrication', 'declaration_douaniere'
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

-- Table documents_requis
CREATE TABLE documents_requis (
    id SERIAL PRIMARY KEY,
    type_element VARCHAR(50) NOT NULL,
    type_document VARCHAR(100) NOT NULL,
    UNIQUE(type_element, type_document)
);

-- Table analyses_bon_livraison
CREATE TABLE analyses_bon_livraison (
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
    ratio_conformite NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table analyses_bulletin_analyse
CREATE TABLE analyses_bulletin_analyse (
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
    ratio_conformite NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables de liaison
CREATE TABLE matieres_transformations (
    id SERIAL PRIMARY KEY,
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id) ON DELETE CASCADE,
    transformation_id INTEGER REFERENCES transformations(id) ON DELETE CASCADE,
    UNIQUE(matiere_premiere_id, transformation_id)
);

CREATE TABLE semi_finis_matieres_premieres (
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    matiere_premiere_id INTEGER REFERENCES matieres_premieres(id),
    PRIMARY KEY (semi_fini_id, matiere_premiere_id)
);

CREATE TABLE semi_finis_transformations (
    semi_fini_id INTEGER REFERENCES semi_finis(id),
    transformation_id INTEGER REFERENCES transformations(id),
    PRIMARY KEY (semi_fini_id, transformation_id)
);

-- Tables de résultats
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

-- Vue pour les transformations
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

-- Triggers pour updated_at
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

CREATE TRIGGER update_analyses_bon_livraison_updated_at
    BEFORE UPDATE ON analyses_bon_livraison
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_bulletin_analyse_updated_at
    BEFORE UPDATE ON analyses_bulletin_analyse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resultats_bon_livraison_updated_at
    BEFORE UPDATE ON resultats_bon_livraison
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resultats_bulletin_analyse_updated_at
    BEFORE UPDATE ON resultats_bulletin_analyse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semi_finis_updated_at
    BEFORE UPDATE ON semi_finis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fournisseurs_updated_at
    BEFORE UPDATE ON fournisseurs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
