-- Migration pour ajouter les colonnes pays_origine et lot_number à la table produits_finis
DO $$
BEGIN
    -- Ajout de la colonne pays_origine si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'produits_finis' AND column_name = 'pays_origine') THEN
        ALTER TABLE produits_finis ADD COLUMN pays_origine VARCHAR(100);
    END IF;

    -- Ajout de la colonne lot_number si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'produits_finis' AND column_name = 'lot_number') THEN
        ALTER TABLE produits_finis ADD COLUMN lot_number VARCHAR(100);
    END IF;
END $$;
