/**
 * Script de débogage pour identifier pourquoi la Sauce 5 n'apparaît pas dans le menu déroulant
 * 
 * Instructions d'utilisation :
 * 1. Ouvrez votre application dans le navigateur
 * 2. Ouvrez la console développeur (F12 ou Ctrl+Shift+I)
 * 3. Copiez-collez tout ce script dans la console
 * 4. Appuyez sur Entrée pour exécuter le script
 */

(async function debugSauce() {
  console.clear();
  console.log('%c DÉBOGAGE DE LA SAUCE 5 ', 'background: #e74c3c; color: white; font-size: 16px; padding: 5px;');
  
  const API_URL = 'http://localhost:5004'; // Assurez-vous que c'est la bonne URL de votre API
  
  // Fonction pour vérifier si un objet est vide
  const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
  };
  
  // Fonction pour vérifier si un élément est un tableau non vide
  const isNonEmptyArray = (arr) => {
    return Array.isArray(arr) && arr.length > 0;
  };
  
  // Fonction pour afficher un message d'erreur
  const logError = (message) => {
    console.log('%c ERREUR ', 'background: #e74c3c; color: white; font-size: 14px; padding: 3px;', message);
  };
  
  // Fonction pour afficher un message de succès
  const logSuccess = (message) => {
    console.log('%c SUCCÈS ', 'background: #2ecc71; color: white; font-size: 14px; padding: 3px;', message);
  };
  
  // Fonction pour afficher un message d'information
  const logInfo = (message) => {
    console.log('%c INFO ', 'background: #3498db; color: white; font-size: 14px; padding: 3px;', message);
  };
  
  // Fonction pour afficher un message d'avertissement
  const logWarning = (message) => {
    console.log('%c ATTENTION ', 'background: #f39c12; color: white; font-size: 14px; padding: 3px;', message);
  };
  
  // Étape 1: Vérifier si les sauces sont correctement chargées
  logInfo('Étape 1: Vérification des sauces disponibles dans le state du composant');
  
  // Récupérer l'état actuel du composant ProduitsFinis
  const componentState = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber?.()?.stateNode?.state;
  
  if (componentState && !isEmptyObject(componentState)) {
    logSuccess('État du composant récupéré avec succès');
    console.log('État du composant:', componentState);
    
    // Vérifier si les sauces sont chargées dans l'état
    if (componentState.sauces && isNonEmptyArray(componentState.sauces)) {
      logSuccess(`${componentState.sauces.length} sauces trouvées dans l'état du composant`);
      console.table(componentState.sauces.map(s => ({ id: s.id, nom: s.nom, lot: s.lot_number })));
      
      // Vérifier si la Sauce 5 est présente
      const sauce5 = componentState.sauces.find(s => 
        s.nom && (s.nom.includes('5') || s.nom.toLowerCase().includes('sauce 5'))
      );
      
      if (sauce5) {
        logSuccess('SAUCE 5 TROUVÉE dans l\'état du composant');
        console.log('Détails de la Sauce 5:', sauce5);
      } else {
        logWarning('SAUCE 5 NON TROUVÉE dans l\'état du composant');
      }
    } else {
      logWarning('Aucune sauce trouvée dans l\'état du composant');
    }
  } else {
    logWarning('Impossible de récupérer l\'état du composant');
  }
  
  // Étape 2: Vérifier directement dans l'API
  logInfo('Étape 2: Vérification directe des sauces via l\'API');
  
  try {
    const response = await fetch(`${API_URL}/api/semi-finis`);
    const data = await response.json();
    
    if (isNonEmptyArray(data)) {
      logSuccess(`${data.length} sauces récupérées directement de l'API`);
      console.table(data.map(s => ({ id: s.id, nom: s.nom, lot: s.lot_number })));
      
      // Vérifier si la Sauce 5 est présente
      const sauce5 = data.find(s => 
        s.nom && (s.nom.includes('5') || s.nom.toLowerCase().includes('sauce 5'))
      );
      
      if (sauce5) {
        logSuccess('SAUCE 5 TROUVÉE dans les données de l\'API');
        console.log('Détails de la Sauce 5:', sauce5);
      } else {
        logError('SAUCE 5 NON TROUVÉE dans les données de l\'API');
        logWarning('La Sauce 5 n\'existe probablement pas dans la base de données');
      }
    } else {
      logError('Aucune sauce récupérée de l\'API ou format de données invalide');
    }
  } catch (error) {
    logError(`Erreur lors de la récupération des sauces via l'API: ${error.message}`);
  }
  
  // Étape 3: Vérifier le comportement du Select lors de l'édition du produit DS9
  logInfo('Étape 3: Vérification du comportement du Select lors de l\'édition du produit DS9');
  
  // Récupérer le produit DS9
  try {
    const response = await fetch(`${API_URL}/api/produits-finis`);
    const produits = await response.json();
    
    if (isNonEmptyArray(produits)) {
      logSuccess(`${produits.length} produits finis récupérés`);
      
      // Chercher le produit DS9
      const ds9 = produits.find(p => p.nom && p.nom.includes('DS9'));
      
      if (ds9) {
        logSuccess('Produit DS9 trouvé');
        console.log('Détails du produit DS9:', ds9);
        
        // Vérifier si le produit DS9 a une sauce associée
        if (ds9.sauce_id) {
          logInfo(`Le produit DS9 a une sauce associée (ID: ${ds9.sauce_id})`);
          
          // Vérifier si cette sauce existe dans les sauces disponibles
          const sauces = await fetch(`${API_URL}/api/semi-finis`).then(res => res.json());
          
          if (isNonEmptyArray(sauces)) {
            const sauceAssociee = sauces.find(s => s.id === ds9.sauce_id);
            
            if (sauceAssociee) {
              logSuccess('La sauce associée au produit DS9 existe dans la liste des sauces disponibles');
              console.log('Détails de la sauce associée:', sauceAssociee);
            } else {
              logError('La sauce associée au produit DS9 N\'EXISTE PAS dans la liste des sauces disponibles');
              logWarning('C\'est probablement la raison pour laquelle vous ne pouvez pas voir la Sauce 5');
            }
          }
        } else {
          logInfo('Le produit DS9 n\'a pas de sauce associée');
        }
      } else {
        logWarning('Produit DS9 non trouvé');
      }
    } else {
      logError('Aucun produit fini récupéré ou format de données invalide');
    }
  } catch (error) {
    logError(`Erreur lors de la récupération des produits finis: ${error.message}`);
  }
  
  // Étape 4: Recommandations pour résoudre le problème
  logInfo('Étape 4: Recommandations pour résoudre le problème');
  
  console.log(`
  %c RECOMMANDATIONS POUR RÉSOUDRE LE PROBLÈME DE LA SAUCE 5 
  `, 'background: #8e44ad; color: white; font-size: 14px; padding: 5px;');
  
  console.log(`
  1. Vérifiez que la Sauce 5 existe bien dans la base de données (table semi_finis).
  2. Si elle n'existe pas, ajoutez-la via l'interface des semi-finis.
  3. Si elle existe mais n'apparaît pas dans le menu déroulant:
     - Vérifiez que la requête SQL dans l'API renvoie bien toutes les sauces sans filtrage.
     - Assurez-vous que le composant Select n'applique pas de filtrage supplémentaire.
  4. Si le problème persiste, essayez de vider le cache du navigateur et de redémarrer l'application.
  `);
  
  logInfo('Fin du débogage');
})();
