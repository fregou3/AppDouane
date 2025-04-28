import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';

const SauceRefresher = () => {
  const [sauces, setSauces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSauces = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Récupération des sauces...');
      const response = await axios.get(`${API_URL}/api/semi-finis`);
      
      if (response.data) {
        console.log(`${response.data.length} sauces récupérées:`, response.data);
        setSauces(response.data);
        setLastRefresh(new Date().toLocaleTimeString());
      } else {
        console.error('Aucune donnée reçue');
        setError('Aucune donnée reçue');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des sauces:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSauces();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Débogueur de Sauces</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchSauces} 
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Chargement...' : 'Rafraîchir les sauces'}
        </button>
        
        {lastRefresh && (
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
            Dernier rafraîchissement: {lastRefresh}
          </span>
        )}
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div>
        <h3>Liste des sauces ({sauces.length})</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Nom</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Lot</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Pays d'origine</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Matières premières</th>
            </tr>
          </thead>
          <tbody>
            {sauces.map(sauce => (
              <tr key={sauce.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{sauce.id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{sauce.nom}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{sauce.lot_number}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{sauce.pays_origine}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {sauce.matieres_premieres && sauce.matieres_premieres.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {sauce.matieres_premieres.map((mp, index) => (
                        <li key={index}>{mp.nom}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#999' }}>Aucune</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Instructions</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Cliquez sur "Rafraîchir les sauces" pour forcer la récupération des données depuis l'API.</li>
          <li>Vérifiez que sauce8 apparaît bien dans la liste.</li>
          <li>Si sauce8 apparaît ici mais pas dans le formulaire des produits finis, le problème est probablement lié au cache du navigateur ou à la façon dont le composant ProduitsFinis gère le rafraîchissement des données.</li>
          <li>Essayez de rafraîchir complètement la page des produits finis avec Ctrl+F5.</li>
        </ol>
      </div>
    </div>
  );
};

export default SauceRefresher;
