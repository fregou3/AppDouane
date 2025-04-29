// Script pour forcer le rechargement de l'application
// Ce script sera inclus dans le HTML et forcera le navigateur à recharger l'application
// s'il détecte qu'une ancienne version est en cache

(function() {
  // Version de l'application - à incrémenter à chaque déploiement
  const APP_VERSION = '1.0.1';
  
  // Vérifier si la version en cache est différente
  const cachedVersion = localStorage.getItem('appVersion');
  
  if (cachedVersion !== APP_VERSION) {
    // Stocker la nouvelle version
    localStorage.setItem('appVersion', APP_VERSION);
    
    // Forcer le rechargement de l'application en vidant le cache
    if (cachedVersion) { // Ne pas recharger lors de la première visite
      console.log('Nouvelle version détectée. Rechargement de l\'application...');
      
      // Vider le cache et recharger la page
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) caches.delete(name);
        });
      }
      
      // Recharger la page sans utiliser le cache
      window.location.reload(true);
    }
  }
})();
