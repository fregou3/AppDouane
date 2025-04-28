-- Correction des accents dans la colonne matiere_premiere_source
UPDATE matieres_premieres
SET matiere_premiere_source = CASE
    WHEN matiere_premiere_source = 'matiÃ¨re premiÃ¨re' THEN 'matière première'
    WHEN matiere_premiere_source = 'matiÃ¨re premiÃ¨re transformÃ©e' THEN 'matière première transformée'
    WHEN matiere_premiere_source = 'matiÃ¨re' THEN 'matière'
    WHEN matiere_premiere_source = 'premiÃ¨re' THEN 'première'
    WHEN matiere_premiere_source = 'transformÃ©e' THEN 'transformée'
    ELSE matiere_premiere_source
END;
