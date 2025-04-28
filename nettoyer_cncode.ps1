# Script PowerShell pour supprimer les espaces dans la colonne CN_CODE d'un fichier CSV
# Paramètres
$fichierSource = "CN2025_SML.csv"
$fichierDestination = "CN2025_SML_CLEAN.csv" 
$delimiteur = ";"

# Vérification de l'existence du fichier source
if (-not (Test-Path $fichierSource)) {
    Write-Error "Le fichier source '$fichierSource' n'existe pas."
    exit 1
}

# Lecture du fichier CSV avec encodage UTF-8
$donnees = Import-Csv -Path $fichierSource -Delimiter $delimiteur -Encoding UTF8

# Compteur pour les modifications
$lignesModifiees = 0

# Traitement des données - Suppression des espaces dans la colonne CN_CODE
foreach ($ligne in $donnees) {
    if ($ligne.CN_CODE -and $ligne.CN_CODE -match '\s') {
        $valeurOriginale = $ligne.CN_CODE
        $ligne.CN_CODE = $ligne.CN_CODE -replace '\s+', ''
        $lignesModifiees++
        
        # Affichage des 5 premières modifications pour vérification
        if ($lignesModifiees -le 5) {
            Write-Host "Ligne modifiée: '$valeurOriginale' -> '$($ligne.CN_CODE)'"
        }
    }
}

# Enregistrement du fichier modifié
$donnees | Export-Csv -Path $fichierDestination -Delimiter $delimiteur -NoTypeInformation -Encoding UTF8

# Affichage des résultats
Write-Host "Traitement terminé!"
Write-Host "Nombre total de lignes: $($donnees.Count)"
Write-Host "Nombre de lignes modifiées: $lignesModifiees"
Write-Host "Fichier résultat enregistré sous: $fichierDestination"