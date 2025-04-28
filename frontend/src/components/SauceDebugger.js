import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';
import { API_URL } from '../config';

const SauceDebugger = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sauces, setSauces] = useState([]);
  const [error, setError] = useState(null);
  const [sauce5Found, setSauce5Found] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    checkSauces();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const checkSauces = async () => {
    setLoading(true);
    setError(null);
    setSauce5Found(false);
    
    try {
      console.log('Vérification des sauces disponibles...');
      
      // Récupérer tous les semi-finis sans filtrage
      const response = await axios.get(`${API_URL}/api/semi-finis`);
      
      if (!response.data || !Array.isArray(response.data)) {
        setError('Les données reçues ne sont pas un tableau valide');
        console.error('Données invalides reçues:', response.data);
        setLoading(false);
        return;
      }
      
      console.log('Semi-finis récupérés:', response.data);
      setSauces(response.data);
      
      // Rechercher spécifiquement la Sauce 5
      const sauce5 = response.data.find(item => 
        item.nom && (
          item.nom.includes('5') || 
          item.nom.toLowerCase().includes('sauce 5') || 
          item.nom.toLowerCase() === 'sauce5' ||
          item.nom.toLowerCase() === 's5'
        )
      );
      
      if (sauce5) {
        console.log('SAUCE 5 TROUVÉE:', sauce5);
        setSauce5Found(true);
      } else {
        console.warn('SAUCE 5 NON TROUVÉE dans les données');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des sauces:', error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleOpen}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
      >
        Déboguer Sauces
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Débogueur de Sauces</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body1" gutterBottom>
              {error}
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {sauces.length} sauces trouvées dans la base de données
              </Typography>
              
              {sauce5Found ? (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#e8f5e9' }}>
                  <Typography variant="h6" color="success.main">
                    SAUCE 5 TROUVÉE DANS LA BASE DE DONNÉES!
                  </Typography>
                  <Typography variant="body1">
                    La Sauce 5 existe dans la base de données et devrait être disponible dans le menu déroulant.
                  </Typography>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
                  <Typography variant="h6" color="error">
                    SAUCE 5 NON TROUVÉE DANS LA BASE DE DONNÉES!
                  </Typography>
                  <Typography variant="body1">
                    La Sauce 5 n'existe pas dans la base de données. Vous devez d'abord l'ajouter via l'interface des semi-finis.
                  </Typography>
                </Paper>
              )}
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Liste de toutes les sauces disponibles:
              </Typography>
              
              <List component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                {sauces.map((sauce) => (
                  <ListItem key={sauce.id} divider>
                    <ListItemText
                      primary={`${sauce.nom} ${sauce.lot_number ? `(Lot: ${sauce.lot_number})` : ''}`}
                      secondary={`ID: ${sauce.id}, Pays: ${sauce.pays_origine || 'Non spécifié'}, Code douanier: ${sauce.code_douanier || 'Non spécifié'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={checkSauces} color="primary" disabled={loading}>
            Rafraîchir
          </Button>
          <Button onClick={handleClose} color="secondary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SauceDebugger;
