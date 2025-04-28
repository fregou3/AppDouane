/**
 * Script de débogage avancé pour identifier pourquoi la Sauce 5 n'apparaît pas
 * malgré son ajout dans la base de données
 */

(async function debugSauceV2() {
  console.clear();
  console.log('%c DÉBOGAGE AVANCÉ DE LA SAUCE 5 ', 'background: #8e44ad; color: white; font-size: 16px; padding: 5px;');
  
  const API_URL = 'http://localhost:5004';
  
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

  // Étape 1: Vérifier toutes les sauces dans la base de données (sans filtrage)
  logInfo('Étape 1: Vérification directe de toutes les sauces dans la base de données');
  
  try {
    // Utiliser fetch avec cache: 'no-store' pour éviter les problèmes de cache
    const response = await fetch(`${API_URL}/api/semi-finis`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      logSuccess(`${data.length} sauces récupérées directement de l'API`);
      console.table(data.map(s => ({ 
        id: s.id, 
        nom: s.nom, 
        lot: s.lot_number,
        pays: s.pays_origine,
        valeur: s.valeur
      })));
      
      // Vérifier si la Sauce 5 est présente
      const sauce5 = data.find(s => 
        s.nom && (
          s.nom.includes('5') || 
          s.nom.toLowerCase().includes('sauce 5') ||
          s.nom.toLowerCase() === 'sauce5'
        )
      );
      
      if (sauce5) {
        logSuccess('SAUCE 5 TROUVÉE dans les données de l\'API');
        console.log('Détails de la Sauce 5:', sauce5);
      } else {
        logError('SAUCE 5 NON TROUVÉE dans les données de l\'API malgré son ajout');
        logWarning('Problème possible avec la requête SQL ou l\'enregistrement de la sauce');
      }
    } else {
      logError('Aucune sauce récupérée de l\'API ou format de données invalide');
    }
  } catch (error) {
    logError(`Erreur lors de la récupération des sauces via l'API: ${error.message}`);
  }
  
  // Étape 2: Analyser le comportement du composant Select
  logInfo('Étape 2: Analyse du comportement du composant Select');
  
  // Récupérer le composant Select des sauces
  const selects = Array.from(document.querySelectorAll('select[name="sauce_id"]'));
  
  if (selects.length > 0) {
    logSuccess(`${selects.length} composant(s) Select pour les sauces trouvé(s)`);
    
    // Analyser les options du Select
    selects.forEach((select, index) => {
      const options = Array.from(select.options);
      
      logInfo(`Select #${index + 1}: ${options.length} options disponibles`);
      
      if (options.length > 0) {
        console.table(options.map(opt => ({ 
          value: opt.value, 
          text: opt.text,
          selected: opt.selected
        })));
        
        // Vérifier si la Sauce 5 est présente dans les options
        const sauce5Option = options.find(opt => 
          opt.text && (
            opt.text.includes('5') || 
            opt.text.toLowerCase().includes('sauce 5')
          )
        );
        
        if (sauce5Option) {
          logSuccess('SAUCE 5 TROUVÉE dans les options du Select');
          console.log('Option de la Sauce 5:', sauce5Option);
        } else {
          logError('SAUCE 5 NON TROUVÉE dans les options du Select');
          logWarning('Le composant Select ne reçoit pas toutes les sauces disponibles');
        }
      } else {
        logWarning('Le Select ne contient aucune option (à part l\'option vide par défaut)');
      }
    });
  } else {
    logWarning('Aucun composant Select pour les sauces trouvé dans le DOM');
    logInfo('Assurez-vous d\'être sur la page d\'édition d\'un produit fini');
  }
  
  // Étape 3: Vérifier le code du composant ProduitsFinis
  logInfo('Étape 3: Vérification du code du composant ProduitsFinis');
  
  // Vérifier si le composant est correctement monté
  const componentInstance = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber?.()?.stateNode;
  
  if (componentInstance) {
    logSuccess('Instance du composant ProduitsFinis trouvée');
    
    // Vérifier la fonction fetchSauces
    if (typeof componentInstance.fetchSauces === 'function') {
      logSuccess('Fonction fetchSauces trouvée dans le composant');
      
      // Exécuter fetchSauces manuellement pour voir si cela résout le problème
      try {
        logInfo('Exécution manuelle de fetchSauces...');
        await componentInstance.fetchSauces();
        logSuccess('fetchSauces exécutée avec succès');
      } catch (error) {
        logError(`Erreur lors de l'exécution de fetchSauces: ${error.message}`);
      }
    } else {
      logWarning('Fonction fetchSauces non trouvée dans le composant');
    }
  } else {
    logWarning('Instance du composant ProduitsFinis non trouvée');
  }
  
  // Étape 4: Recommandations pour résoudre le problème
  logInfo('Étape 4: Recommandations pour résoudre le problème');
  
  console.log(`
  %c RECOMMANDATIONS AVANCÉES POUR RÉSOUDRE LE PROBLÈME DE LA SAUCE 5 
  `, 'background: #8e44ad; color: white; font-size: 14px; padding: 5px;');
  
  console.log(`
  1. Vérifiez que la Sauce 5 a bien été enregistrée avec le bon format:
     - Le nom doit être exactement "Sauce 5" (vérifiez les espaces et la casse)
     - Tous les champs obligatoires doivent être remplis
  
  2. Redémarrez le serveur backend:
     - Il est possible que le serveur garde en cache les anciennes données
     - Arrêtez et redémarrez le serveur Node.js
  
  3. Vérifiez la requête SQL dans le fichier server.js:
     - Assurez-vous qu'il n'y a pas de filtrage qui exclut la Sauce 5
     - Vérifiez que la requête récupère bien tous les semi-finis
  
  4. Modifiez temporairement le code pour forcer l'affichage de toutes les sauces:
     - Dans le fichier ProduitsFinis.js, modifiez la fonction fetchSauces
     - Ajoutez un console.log pour afficher toutes les données reçues
     - Assurez-vous que setSauces(response.data) est bien appelé sans filtrage
  
  5. Vérifiez directement dans la base de données:
     - Utilisez un outil comme pgAdmin ou psql pour vérifier que la Sauce 5 existe
     - Exécutez la requête: SELECT * FROM semi_finis WHERE nom LIKE '%Sauce 5%'
  `);
  
  logInfo('Fin du débogage avancé');
})();
