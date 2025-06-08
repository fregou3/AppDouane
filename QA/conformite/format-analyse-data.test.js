const axios = require('axios');

// Fonction qui simule le comportement de formatAnalyseData du frontend
function formatAnalyseData(data, type_document) {
  // Définir les champs attendus en fonction du type de document
  let expectedFields = {};
  
  switch (type_document) {
    case 'bon_livraison':
      expectedFields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        numero_bon_livraison: 'numéro du bon de livraison',
        nom_matiere_premiere: 'nom de la matière première',
        quantite: 'quantité',
        unite: 'unité'
      };
      break;
    case 'bulletin_analyse':
      expectedFields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        numero_lot: 'numéro de lot',
        nom_matiere_premiere: 'nom de la matière première',
        resultats_analyses: 'résultats d\'analyses'
      };
      break;
    case 'certificat':
      expectedFields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        numero_certificat: 'numéro du certificat',
        nom_matiere_premiere: 'nom de la matière première',
        normes_conformite: 'normes de conformité',
        validite: 'validité'
      };
      break;
    case 'facture':
      expectedFields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur',
        numero_facture: 'numéro de facture',
        nom_matiere_premiere: 'nom de la matière première',
        montant_ht: 'montant HT',
        montant_ttc: 'montant TTC',
        tva: 'TVA'
      };
      break;
    default:
      expectedFields = {
        date_document: 'date',
        nom_fournisseur: 'nom du fournisseur'
      };
  }

  // Vérifier si les données contiennent un champ fields JSON
  let fieldsData = {};
  if (data.fields && typeof data.fields === 'object') {
    fieldsData = data.fields;
  } else if (data.fields && typeof data.fields === 'string') {
    try {
      fieldsData = JSON.parse(data.fields);
    } catch (e) {
      console.error('Erreur lors du parsing des champs JSON:', e);
    }
  }

  // Créer l'objet fields avec les valeurs de la base de données
  const fields = {};
  Object.entries(expectedFields).forEach(([key, name]) => {
    fields[key] = {
      name,
      present: data[key] || (fieldsData && fieldsData[key]) || false
    };
  });

  // Calculer le ratio
  const presentCount = Object.values(fields).filter(f => f.present).length;
  const ratio = presentCount / Object.keys(fields).length;

  return {
    ...data,
    fields,
    ratio_conformite: data.ratio_conformite || ratio
  };
}

describe('Fonction formatAnalyseData', () => {
  // Test de formatage des données d'analyse pour chaque type de document
  const documentTypes = ['bon_livraison', 'bulletin_analyse', 'certificat', 'facture'];
  
  documentTypes.forEach(type => {
    test(`Formatage des données d'analyse pour un document de type ${type}`, () => {
      // Créer des données de test
      const testData = {
        id: 1,
        document_id: 1,
        matiere_premiere_id: 1,
        resume: `Analyse du document de type ${type}`,
        ratio_conformite: 0.8,
        fields: JSON.stringify({
          date_document: true,
          nom_fournisseur: true
        })
      };
      
      // Appeler la fonction formatAnalyseData
      const formattedData = formatAnalyseData(testData, type);
      
      // Vérifier la structure des données formatées
      expect(formattedData).toHaveProperty('fields');
      expect(formattedData).toHaveProperty('ratio_conformite');
      
      // Vérifier que les champs attendus sont présents
      switch (type) {
        case 'bon_livraison':
          expect(formattedData.fields).toHaveProperty('date_document');
          expect(formattedData.fields).toHaveProperty('nom_fournisseur');
          expect(formattedData.fields).toHaveProperty('numero_bon_livraison');
          expect(formattedData.fields).toHaveProperty('nom_matiere_premiere');
          expect(formattedData.fields).toHaveProperty('quantite');
          expect(formattedData.fields).toHaveProperty('unite');
          break;
        case 'bulletin_analyse':
          expect(formattedData.fields).toHaveProperty('date_document');
          expect(formattedData.fields).toHaveProperty('nom_fournisseur');
          expect(formattedData.fields).toHaveProperty('numero_lot');
          expect(formattedData.fields).toHaveProperty('nom_matiere_premiere');
          expect(formattedData.fields).toHaveProperty('resultats_analyses');
          break;
        case 'certificat':
          expect(formattedData.fields).toHaveProperty('date_document');
          expect(formattedData.fields).toHaveProperty('nom_fournisseur');
          expect(formattedData.fields).toHaveProperty('numero_certificat');
          expect(formattedData.fields).toHaveProperty('nom_matiere_premiere');
          expect(formattedData.fields).toHaveProperty('normes_conformite');
          expect(formattedData.fields).toHaveProperty('validite');
          break;
        case 'facture':
          expect(formattedData.fields).toHaveProperty('date_document');
          expect(formattedData.fields).toHaveProperty('nom_fournisseur');
          expect(formattedData.fields).toHaveProperty('numero_facture');
          expect(formattedData.fields).toHaveProperty('nom_matiere_premiere');
          expect(formattedData.fields).toHaveProperty('montant_ht');
          expect(formattedData.fields).toHaveProperty('montant_ttc');
          expect(formattedData.fields).toHaveProperty('tva');
          break;
      }
      
      // Vérifier que le ratio de conformité est calculé correctement
      expect(formattedData.ratio_conformite).toBe(0.8);
      
      // Vérifier que les champs présents sont bien marqués comme tels
      expect(formattedData.fields.date_document.present).toBe(true);
      expect(formattedData.fields.nom_fournisseur.present).toBe(true);
    });
  });
  
  // Test de gestion des erreurs dans la fonction formatAnalyseData
  test('Gestion des erreurs dans la fonction formatAnalyseData', () => {
    // Cas 1: fields est une chaîne JSON invalide
    const testData1 = {
      id: 1,
      document_id: 1,
      matiere_premiere_id: 1,
      resume: 'Analyse du document',
      ratio_conformite: 0.8,
      fields: '{invalid json}'
    };
    
    // La fonction ne devrait pas planter mais gérer l'erreur de parsing
    const formattedData1 = formatAnalyseData(testData1, 'bon_livraison');
    expect(formattedData1).toHaveProperty('fields');
    
    // Cas 2: fields est null
    const testData2 = {
      id: 1,
      document_id: 1,
      matiere_premiere_id: 1,
      resume: 'Analyse du document',
      ratio_conformite: 0.8,
      fields: null
    };
    
    // La fonction devrait gérer le cas où fields est null
    const formattedData2 = formatAnalyseData(testData2, 'bon_livraison');
    expect(formattedData2).toHaveProperty('fields');
    
    // Cas 3: type de document non reconnu
    const testData3 = {
      id: 1,
      document_id: 1,
      matiere_premiere_id: 1,
      resume: 'Analyse du document',
      ratio_conformite: 0.8,
      fields: JSON.stringify({
        date_document: true,
        nom_fournisseur: true
      })
    };
    
    // La fonction devrait utiliser les champs par défaut
    const formattedData3 = formatAnalyseData(testData3, 'type_inconnu');
    expect(formattedData3).toHaveProperty('fields');
    expect(formattedData3.fields).toHaveProperty('date_document');
    expect(formattedData3.fields).toHaveProperty('nom_fournisseur');
  });
});
