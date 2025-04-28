import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Tooltip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  Box,
  CircularProgress,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BugReportIcon from '@mui/icons-material/BugReport';
import SauceDebugger from './SauceDebugger';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { API_URL } from '../config';
import { normalizeCustomsCode, formatCustomsCode } from '../utils/customsCodeUtils';

const ProduitsFinis = () => {
  const [produits, setProduits] = useState([]);
  const [sauces, setSauces] = useState([]);
  const [matieresList, setMatieresList] = useState([]);
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduit, setCurrentProduit] = useState({
    nom: '',
    pays_origine: '',
    valeur: '',
    code_douanier: '',
    sauce_id: '',
    lot_number: '',
    matieres_premieres: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduits();
    fetchSauces();
    fetchMatieresList();
  }, []);

  const fetchProduits = async () => {
    try {
      console.log('Récupération des produits...');
      const response = await axios.get(`${API_URL}/api/produits-finis`);
      console.log('Produits reçus:', response.data);
      setProduits(response.data);
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des produits:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setError('Erreur lors de la récupération des produits');
    }
  };



  const fetchSauces = async () => {
    try {
      console.log('Récupération des sauces pour le menu déroulant des produits finis...');
      const response = await axios.get(`${API_URL}/api/semi-finis`);
      
      // Vérifier si la réponse contient des données
      if (!response.data) {
        console.error('Aucune donnée reçue de l\'API');
        return;
      }
      
      // Afficher toutes les données reçues
      console.log(`${response.data.length} sauces reçues de l'API pour les produits finis`);
      
      // Afficher chaque sauce pour le débogage
      response.data.forEach(sauce => {
        console.log(`Sauce trouvée dans ProduitsFinis: ID=${sauce.id}, Nom=${sauce.nom}, Lot=${sauce.lot_number}`);
      });
      
      // Essayons d'utiliser l'endpoint simplifié pour comparer
      console.log('Récupération des sauces via l\'endpoint simplifié pour comparaison...');
      const simplifiedResponse = await axios.get(`${API_URL}/api/semi-finis-simple`);
      
      if (simplifiedResponse.data && simplifiedResponse.data.rows) {
        console.log(`${simplifiedResponse.data.rows.length} sauces reçues de l'API simplifiée`);
        simplifiedResponse.data.rows.forEach(sauce => {
          console.log(`Sauce (simplifiée): ID=${sauce.id}, Nom=${sauce.nom}, Lot=${sauce.lot_number}`);
        });
      }
      
      // Utiliser toutes les sauces sans filtrage
      setSauces(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des sauces:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const fetchMatieresList = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Récupération des matières premières...');
      const response = await axios.get(`${API_URL}/api/matieres-premieres?limit=100`);
      console.log('Matières premières reçues:', response.data);
      
      // Vérifier la structure de la réponse et accéder au tableau de données
      const matieresData = response.data.data || response.data;
      
      if (!Array.isArray(matieresData)) {
        console.error('Les données des matières premières ne sont pas un tableau:', matieresData);
        throw new Error('Format de données incorrect');
      }
      
      setMatieresList(matieresData);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error.response?.data?.details || error.message || 'Erreur inconnue';
      setError(`Erreur lors du chargement des matières premières: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    // Forcer le rechargement des sauces à chaque ouverture du formulaire d'ajout
    console.log('Rechargement des sauces lors de l\'ouverture du formulaire d\'ajout...');
    fetchSauces();
    
    setCurrentProduit({
      nom: '',
      pays_origine: '',
      valeur: '',
      code_douanier: '',
      sauce_id: '',
      lot_number: '',
      matieres_premieres: []
    });
    setSelectedMatieres([]);
    setEditMode(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMatieres([]);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    console.log('Changement de champ:', name, value);
    setCurrentProduit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMatieresChange = (matiereId) => {
    setSelectedMatieres(prev => {
      if (prev.includes(matiereId)) {
        return prev.filter(id => id !== matiereId);
      } else {
        return [...prev, matiereId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Normaliser le code douanier avant de l'envoyer
      const normalizedCode = normalizeCustomsCode(currentProduit.code_douanier);
      
      // Afficher les matières premières sélectionnées pour le débogage
      console.log('Matières premières sélectionnées (IDs):', selectedMatieres);
      
      const payload = {
        ...currentProduit,
        lot_number: currentProduit.lot_number || '',
        pays_origine: currentProduit.pays_origine || '',
        valeur: currentProduit.valeur || '',
        code_douanier: normalizedCode,
        sauce_id: currentProduit.sauce_id || null,
        matieres_premieres: selectedMatieres
      };

      console.log('Envoi des données au serveur:', payload);

      if (editMode) {
        console.log('Mode édition - PUT request');
        await axios.put(`${API_URL}/api/produits-finis/${currentProduit.id}`, payload);
      } else {
        console.log('Mode création - POST request');
        await axios.post(`${API_URL}/api/produits-finis`, payload);
      }
      await fetchProduits();
      handleClose();
    } catch (error) {
      console.error('Erreur détaillée lors de la sauvegarde:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error
      });
      setError(error.response?.data?.detail || error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (produit) => {
    console.log('Produit à éditer:', produit);
    
    // Vérifier si le produit a une sauce associée
    if (produit.sauce_id) {
      console.log(`ID de la sauce associée: ${produit.sauce_id}`);
    } else {
      console.log('Aucune sauce associée à ce produit');
    }
    
    // Vérifier si les sauces sont déjà chargées
    console.log('Sauces disponibles lors de l\'édition:', sauces);
    
    // Forcer le rechargement des sauces à chaque ouverture du formulaire
    console.log('Rechargement systématique des sauces pour assurer les dernières données...');
    fetchSauces();
    
    // Créer un objet produit avec des valeurs par défaut pour éviter les undefined
    const updatedProduit = {
      id: produit.id,
      nom: produit.nom || '',
      lot_number: produit.lot_number || '',
      pays_origine: produit.pays_origine || '',
      valeur: produit.valeur || 0,
      code_douanier: produit.code_douanier || '',
      sauce_id: produit.sauce_id || null,
      matieres_premieres: produit.matieres_premieres || []
    };
    
    console.log('Produit mis à jour pour l\'édition:', updatedProduit);
    setCurrentProduit(updatedProduit);
    
    // Initialiser les matières premières sélectionnées
    if (produit.matieres_premieres && Array.isArray(produit.matieres_premieres)) {
      const selectedIds = produit.matieres_premieres.map(mp => typeof mp === 'object' ? mp.id : mp);
      console.log('Matières premières sélectionnées:', selectedIds);
      setSelectedMatieres(selectedIds);
    } else {
      console.log('Aucune matière première sélectionnée');
      setSelectedMatieres([]);
    }
    
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`${API_URL}/api/produits-finis/${id}`);
        fetchProduits();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Ajouter un produit fini
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Lot</TableCell>
              <TableCell>Pays d'origine</TableCell>
              <TableCell>Valeur</TableCell>
              <TableCell>Code douanier</TableCell>
              <TableCell>Sauce</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produits.map((produit) => (
              <TableRow key={produit.id}>
                <TableCell>{produit.nom}</TableCell>
                <TableCell>{produit.lot_number || '-'}</TableCell>
                <TableCell>{produit.pays_origine || '-'}</TableCell>
                <TableCell>{produit.valeur ? `${produit.valeur} €` : '-'}</TableCell>
                <TableCell>{produit.code_douanier ? formatCustomsCode(produit.code_douanier) : '-'}</TableCell>
                <TableCell>{produit.sauce_nom || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(produit)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(produit.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier le produit' : 'Ajouter un produit'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <TextField
              required
              margin="dense"
              name="nom"
              label="Nom"
              fullWidth
              value={currentProduit.nom || ''}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="lot_number"
              label="Lot"
              fullWidth
              value={currentProduit.lot_number || ''}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="pays_origine"
              label="Pays d'origine"
              fullWidth
              value={currentProduit.pays_origine || ''}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="valeur"
              label="Valeur"
              type="number"
              fullWidth
              value={currentProduit.valeur || ''}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="code_douanier"
              label="Code douanier"
              fullWidth
              value={currentProduit.code_douanier || ''}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Sauce</InputLabel>
              <Select
                name="sauce_id"
                value={currentProduit.sauce_id || ''}
                onChange={(e) => {
                  console.log('Nouvelle sauce sélectionnée:', e.target.value);
                  alert(`Sauce sélectionnée: ID ${e.target.value}`);
                  handleChange(e);
                }}
                renderValue={(selected) => {
                  console.log('%c SAUCE SÉLECTIONNÉE ', 'background: #2ecc71; color: white;');
                  console.log('ID de la sauce sélectionnée:', selected);
                  
                  // Afficher toutes les sauces disponibles pour débogage
                  console.log('Toutes les sauces disponibles:', sauces.map(s => ({ id: s.id, nom: s.nom })));
                  
                  const selectedSauce = sauces.find(s => s.id === selected);
                  console.log('Détails de la sauce sélectionnée:', selectedSauce);
                  
                  if (selectedSauce) {
                    return `${selectedSauce.nom} ${selectedSauce.lot_number ? `(Lot: ${selectedSauce.lot_number})` : ''}`;
                  } else {
                    console.warn('Sauce sélectionnée introuvable dans la liste des sauces!');
                    return 'Sélectionner une sauce';
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    },
                    onMouseEnter: () => {
                      console.log('%c MENU DES SAUCES OUVERT ', 'background: #3498db; color: white;');
                      console.log('Sauces disponibles dans le menu:', sauces);
                      
                      // Vérifier si la Sauce 5 est présente
                      const sauce5 = sauces.find(s => 
                        s.nom && (s.nom.includes('5') || s.nom.toLowerCase().includes('sauce 5'))
                      );
                      
                      if (sauce5) {
                        console.log('%c SAUCE 5 DISPONIBLE DANS LE MENU ', 'background: #27ae60; color: white;');
                        console.log('Détails de la Sauce 5:', sauce5);
                      } else {
                        console.warn('%c SAUCE 5 NON DISPONIBLE DANS LE MENU ', 'background: #e74c3c; color: white;');
                        console.log('Toutes les sauces disponibles:', sauces);
                      }
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>Sélectionner une sauce</em>
                </MenuItem>
                {sauces.length === 0 ? (
                  <MenuItem disabled>
                    <em>Aucune sauce disponible</em>
                  </MenuItem>
                ) : (
                  sauces.map((sauce) => {
                    console.log(`Rendu de l'option sauce ID ${sauce.id}:`, sauce.nom);
                    return (
                      <MenuItem key={sauce.id} value={sauce.id}>
                        {sauce.nom} {sauce.lot_number ? `(Lot: ${sauce.lot_number})` : ''}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
            
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Sélectionnez les matières premières composant ce produit :
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            ) : matieresList.length === 0 ? (
              <Typography sx={{ mb: 2 }}>
                Aucune matière première disponible
              </Typography>
            ) : (
              <FormGroup sx={{ maxHeight: 300, overflow: 'auto', px: 2 }}>
                {matieresList.map((matiere) => (
                  <FormControlLabel
                    key={matiere.id}
                    control={
                      <Checkbox
                        checked={selectedMatieres.includes(matiere.id)}
                        onChange={() => handleMatieresChange(matiere.id)}
                      />
                    }
                    label={`${matiere.nom} (${matiere.type || 'Type non spécifié'})`}
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editMode ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ProduitsFinis;
