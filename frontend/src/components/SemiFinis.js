import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  FormGroup,
  Checkbox,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { normalizeCustomsCode, formatCustomsCode } from '../utils/customsCodeUtils';
import { API_URL } from '../config';

const SemiFinis = () => {
  const [open, setOpen] = useState(false);
  const [matieresList, setMatieresList] = useState([]);
  const [filteredMatieresList, setFilteredMatieresList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatieres, setSelectedMatieres] = useState([]);
  const [nomSemiFini, setNomSemiFini] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [paysOrigine, setPaysOrigine] = useState('');
  const [valeur, setValeur] = useState('');
  const [codeDouanier, setCodeDouanier] = useState('');
  const [semiFinisList, setSemiFinisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentSemiFini, setCurrentSemiFini] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [semiFiniToDelete, setSemiFiniToDelete] = useState(null);

  useEffect(() => {
    fetchMatieresList();
    fetchSemiFinisList();
  }, []);

  // Filtrer les matières premières en fonction du terme de recherche
  useEffect(() => {
    if (matieresList.length > 0) {
      if (searchTerm) {
        const filtered = matieresList.filter(matiere => 
          matiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (matiere.type && matiere.type.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredMatieresList(filtered);
      } else {
        setFilteredMatieresList(matieresList);
      }
    }
  }, [matieresList, searchTerm]);

  const fetchMatieresList = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Récupération des matières premières...');
      // Récupérer toutes les matières premières avec une limite élevée
      const response = await axios.get(`${API_URL}/api/matieres-premieres?limit=1000`);
      console.log('Matières premières reçues:', response.data);
      
      // Vérifier la structure des données reçues
      if (!response.data) {
        throw new Error('Aucune donnée reçue du serveur');
      }
      
      // Déterminer si les données sont dans response.data ou response.data.data
      let matieresData = [];
      
      if (Array.isArray(response.data)) {
        console.log('Les matières premières sont déjà un tableau');
        matieresData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Les matières premières sont dans response.data.data');
        matieresData = response.data.data;
      } else {
        console.warn('Format de données inattendu pour les matières premières:', response.data);
        // Essayer de convertir en tableau si possible
        matieresData = Object.values(response.data).filter(item => item && typeof item === 'object');
      }
      
      console.log(`Nombre de matières premières traitées: ${matieresData.length}`);
      
      // Vérifier si l'huile de verveine est présente
      const verveineFound = matieresData.some(m => m.nom && m.nom.toLowerCase().includes('verveine'));
      console.log('Huile de verveine trouvée dans les données:', verveineFound);
      
      setMatieresList(matieresData);
      setFilteredMatieresList(matieresData);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error.response?.data?.details || error.message || 'Erreur inconnue';
      setError(`Erreur lors du chargement des matières premières: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemiFinisList = async () => {
    try {
      console.log('Récupération des semi-finis pour le composant SemiFinis...');
      const response = await axios.get(`${API_URL}/api/semi-finis`);
      console.log('Données reçues de l\'API semi-finis:', response.data);
      
      // Déterminer si les données sont dans response.data ou response.data.data
      let semiFinis = [];
      
      if (Array.isArray(response.data)) {
        console.log('Les semi-finis sont déjà un tableau');
        semiFinis = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Les semi-finis sont dans response.data.data');
        semiFinis = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        console.warn('Format de données inattendu pour les semi-finis:', response.data);
        // Essayer de convertir en tableau si possible
        semiFinis = Object.values(response.data).filter(item => item && typeof item === 'object');
      }
      
      console.log(`Nombre de semi-finis traités: ${semiFinis.length}`);
      
      // Afficher chaque semi-fini pour le débogage
      if (semiFinis.length > 0) {
        semiFinis.forEach(item => {
          console.log(`Semi-fini: ID=${item.id}, Nom=${item.nom}, Lot=${item.lot_number || 'N/A'}`);
        });
      } else {
        console.warn('Aucun semi-fini traité!');
      }
      
      setSemiFinisList(semiFinis);
    } catch (error) {
      console.error('Erreur lors du chargement des semi-finis:', error);
      setSemiFinisList([]);
    }
  };

  const handleClickOpen = () => {
    setEditMode(false);
    setCurrentSemiFini(null);
    setNomSemiFini('');
    setLotNumber('');
    setPaysOrigine('');
    setValeur('');
    setCodeDouanier('');
    setSelectedMatieres([]);
    setOpen(true);
    fetchMatieresList();
  };

  const handleEdit = (semiFini) => {
    setEditMode(true);
    setCurrentSemiFini(semiFini);
    setNomSemiFini(semiFini.nom);
    setLotNumber(semiFini.lot_number || '');
    setPaysOrigine(semiFini.pays_origine || '');
    setValeur(semiFini.valeur || '');
    setCodeDouanier(semiFini.code_douanier || '');
    setSelectedMatieres(semiFini.matieres_premieres.map(m => m.id));
    setOpen(true);
    fetchMatieresList();
  };

  const handleDeleteClick = (semiFini) => {
    setSemiFiniToDelete(semiFini);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/api/semi-finis/${semiFiniToDelete.id}`);
      await fetchSemiFinisList();
      setOpenDeleteDialog(false);
      setSemiFiniToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du semi-fini');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOpenDeleteDialog(false);
    setSelectedMatieres([]);
    setNomSemiFini('');
    setLotNumber('');
    setPaysOrigine('');
    setValeur('');
    setCodeDouanier('');
    setError(null);
    setEditMode(false);
    setCurrentSemiFini(null);
    setSemiFiniToDelete(null);
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

  const handleSubmit = async () => {
    if (!nomSemiFini || selectedMatieres.length === 0) {
      alert('Veuillez remplir tous les champs nécessaires');
      return;
    }

    try {
      // Afficher les matières premières sélectionnées pour le débogage
      console.log('Matières premières sélectionnées (IDs):', selectedMatieres);
      
      // Récupérer les détails des matières premières sélectionnées
      const selectedMatieresDetails = matieresList.filter(m => selectedMatieres.includes(m.id));
      console.log('Détails des matières premières sélectionnées:', selectedMatieresDetails);
      
      // Vérifier spécifiquement si l'huile de verveine est incluse
      const huileVerveine = selectedMatieresDetails.find(m => m.nom.toLowerCase().includes('verveine') && m.type === 'extrait');
      console.log('Huile de Verveine incluse?', huileVerveine ? 'OUI' : 'NON');
      if (huileVerveine) {
        console.log('Détails de l\'Huile de Verveine:', huileVerveine);
      }
      
      // Normaliser le code douanier avant de l'envoyer
      const normalizedCode = normalizeCustomsCode(codeDouanier);
      
      const semiFiniData = {
        nom: nomSemiFini,
        lot_number: lotNumber,
        pays_origine: paysOrigine,
        valeur: valeur || null,
        code_douanier: normalizedCode,
        matieres_premieres: selectedMatieres
      };
      
      console.log('Données du semi-fini à envoyer:', semiFiniData);

      if (editMode && currentSemiFini) {
        console.log('Modification du semi-fini:', {
          id: currentSemiFini.id,
          ...semiFiniData
        });
        
        const response = await axios.put(`${API_URL}/api/semi-finis/${currentSemiFini.id}`, semiFiniData);
        console.log('Réponse de la modification:', response.data);
      } else {
        console.log('Création du semi-fini:', semiFiniData);
        
        const response = await axios.post(`${API_URL}/api/semi-finis`, semiFiniData);
        console.log('Réponse de la création:', response.data);
      }
      
      await fetchSemiFinisList();
      handleClose();
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      alert(`Une erreur est survenue : ${errorMessage}`);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClickOpen}
        sx={{ mb: 2 }}
      >
        Créer un semi-fini
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Modifier le semi-fini' : 'Créer un nouveau semi-fini'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nom du semi-fini"
              value={nomSemiFini}
              onChange={(e) => setNomSemiFini(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Numéro de lot"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Pays d'origine"
              value={paysOrigine}
              onChange={(e) => setPaysOrigine(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Valeur (€)"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              type="number"
              inputProps={{ step: "0.01" }}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Code douanier"
              value={codeDouanier}
              onChange={(e) => setCodeDouanier(e.target.value)}
              margin="normal"
            />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Sélectionnez les matières premières composant ce semi-fini :
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* Champ de recherche pour filtrer les matières premières */}
            <TextField
              fullWidth
              label="Rechercher une matière première"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              margin="normal"
              placeholder="Ex: verveine, huile, extrait..."
              InputProps={{
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            ) : filteredMatieresList.length === 0 ? (
              <Typography sx={{ mb: 2 }}>
                {matieresList.length === 0 ? 'Aucune matière première disponible' : 'Aucune matière première ne correspond à votre recherche'}
              </Typography>
            ) : (
              <FormGroup sx={{ maxHeight: 400, overflow: 'auto', px: 2 }}>
                {filteredMatieresList.map((matiere) => (
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!nomSemiFini || selectedMatieres.length === 0}
          >
            {editMode ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleClose}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le semi-fini "{semiFiniToDelete?.nom}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>N° Lot</TableCell>
              <TableCell>Pays d'origine</TableCell>
              <TableCell>Valeur (€)</TableCell>
              <TableCell>Code douanier</TableCell>
              <TableCell>Matières premières</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {semiFinisList.map((semiFini) => (
              <TableRow key={semiFini.id}>
                <TableCell>{semiFini.nom}</TableCell>
                <TableCell>{semiFini.lot_number || '-'}</TableCell>
                <TableCell>{semiFini.pays_origine || '-'}</TableCell>
                <TableCell>{semiFini.valeur ? `${semiFini.valeur} €` : '-'}</TableCell>
                <TableCell>{semiFini.code_douanier ? formatCustomsCode(semiFini.code_douanier) : '-'}</TableCell>
                <TableCell>
                  {semiFini.matieres_premieres?.map(m => m.nom).join(', ') || 'Aucune'}
                </TableCell>
                <TableCell>
                  <IconButton 
                    color="primary" 
                    onClick={() => handleEdit(semiFini)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteClick(semiFini)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SemiFinis;
