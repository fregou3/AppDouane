-- Ajouter la colonne lot_number à la table semi_finis
ALTER TABLE semi_finis ADD COLUMN IF NOT EXISTS lot_number VARCHAR(255);
