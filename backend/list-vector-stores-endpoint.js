/**
 * Script pour ajouter un endpoint temporaire au serveur qui liste les bases vectorielles
 * 
 * Pour utiliser ce script:
 * 1. Arrêtez le serveur s'il est en cours d'exécution
 * 2. Ajoutez le code suivant à la fin du fichier server.js (juste avant app.listen):
 *    
 *    // Endpoint temporaire pour lister les bases vectorielles
 *    app.get('/list-vector-stores', (req, res) => {
 *      if (!global.vectorStores) {
 *        return res.json({ message: 'Aucune base vectorielle disponible', stores: [] });
 *      }
 *      
 *      const vectorStoresList = Object.keys(global.vectorStores).map(name => {
 *        const fileNameParts = name.split('_');
 *        const fileName = fileNameParts.slice(0, -1).join('_');
 *        const timestamp = parseInt(fileNameParts[fileNameParts.length - 1]);
 *        
 *        return {
 *          id: name,
 *          fileName: fileName,
 *          createdAt: timestamp,
 *          displayName: `${fileName} (${new Date(timestamp).toLocaleString()})`
 *        };
 *      });
 *      
 *      vectorStoresList.sort((a, b) => b.createdAt - a.createdAt);
 *      
 *      res.json({ 
 *        message: `${vectorStoresList.length} base(s) vectorielle(s) trouvée(s)`, 
 *        stores: vectorStoresList 
 *      });
 *    });
 * 
 * 3. Redémarrez le serveur
 * 4. Accédez à http://localhost:5004/list-vector-stores dans votre navigateur
 */

// Ce script est uniquement informatif et ne fait rien par lui-même
console.log('Ce script est informatif et ne fait rien par lui-même.');
console.log('Veuillez suivre les instructions dans le fichier pour ajouter un endpoint temporaire au serveur.');
