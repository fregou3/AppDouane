import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';

const CorrectionsModal = ({ open, onClose }) => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Charger les corrections lorsque la modale s'ouvre
  useEffect(() => {
    if (open) {
      fetchCorrections();
    }
  }, [open]);

  // Fonction pour récupérer toutes les corrections
  const fetchCorrections = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/api/corrections`);
      setCorrections(response.data.corrections);
    } catch (error) {
      console.error('Erreur lors de la récupération des corrections:', error);
      setError(`Erreur: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une correction
  const handleDeleteCorrection = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/correction/${id}`);
      
      // Mettre à jour la liste des corrections
      setCorrections(corrections.filter(correction => correction.id !== id));
      
      // Afficher un message de succès
      setSnackbar({
        open: true,
        message: 'Correction supprimée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la correction:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  // Fonction pour fermer le snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Liste des optimisations de codes douaniers
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : corrections.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              Aucune optimisation n'a été enregistrée.
            </Typography>
          ) : (
            <List>
              {corrections.map((correction, index) => (
                <React.Fragment key={correction.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          <strong>Description:</strong> {correction.description}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            <strong>Code corrigé:</strong> {correction.correctedCode}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="textSecondary">
                            <strong>Date:</strong> {new Date(correction.timestamp).toLocaleString('fr-FR')}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleDeleteCorrection(correction.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CorrectionsModal;
