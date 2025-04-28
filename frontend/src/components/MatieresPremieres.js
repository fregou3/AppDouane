import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  CircularProgress,
  Chip,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Pagination
} from '@mui/material';
import { Edit, Delete, KeyboardArrowDown, KeyboardArrowUp, Send, Email } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config';
import { normalizeCustomsCode, formatCustomsCode, extractCustomsCodes } from '../utils/customsCodeUtils';
import EmailDialog from './EmailDialog';

const typeOptions = [
  'metal',
  'plastic',
  'plante',
  'extrait',
  'carton',
  'verre',
  'tissu'
];

const Row = ({ row, index, onEdit, onDelete, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [showGptExplanation, setShowGptExplanation] = useState(false);
  const [alternativeCodes, setAlternativeCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(row.code_douanier ? normalizeCustomsCode(row.code_douanier) : '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (row.code_douanier_gpt) {
      const codes = extractCustomsCodes(row.code_douanier_gpt);
      setAlternativeCodes(codes);
    }
  }, [row.code_douanier_gpt]);

  useEffect(() => {
    setSelectedCode(row.code_douanier ? normalizeCustomsCode(row.code_douanier) : '');
  }, [row.code_douanier]);

  const handleCodeChange = async (newCode) => {
    if (!newCode || newCode === selectedCode) return;
    
    // Normaliser le code avant de l'envoyer au serveur
    const normalizedCode = normalizeCustomsCode(newCode);
    
    setIsUpdating(true);
    try {
      const requestData = { code_douanier: normalizedCode };
      const requestUrl = `${API_URL}/api/gpt/matieres-premieres/${row.id}/code-douanier`;

      console.log('Tentative de mise à jour du code douanier:', {
        url: requestUrl,
        method: 'PUT',
        data: requestData,
        currentRow: row
      });

      const response = await axios.put(
        requestUrl,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Réponse reçue:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      if (response.data.success) {
        console.log('Mise à jour réussie, nouveau code:', normalizedCode);
        setSelectedCode(normalizedCode);
        onUpdate({ ...row, code_douanier: normalizedCode });
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur détaillée:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Erreur lors de la mise à jour : ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDemandeConseil = () => {
    setShowEmailDialog(true);
  };

  const handleEmailDialogClose = (success) => {
    setShowEmailDialog(false);
    if (success) {
      // Optionnellement afficher un message de succès
    }
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '& > td': {
            backgroundColor: index % 2 === 0 ? 'inherit' : '#fafafa',
            borderTop: '2px solid #1976d2',
            borderBottom: !open ? '2px solid #1976d2' : '1px solid rgba(224, 224, 224, 1)',
          }
        }}
      >
        <TableCell sx={{ borderLeft: '2px solid #1976d2', fontWeight: 'bold' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.id}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.nom}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.type}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.lot}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.fournisseur}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.pays_origine || '-'}</TableCell>
        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{row.valeur ? `${row.valeur} €` : '-'}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>
          {row.code_douanier ? (
            <Tooltip title="Cliquez pour changer le code">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setShowGptExplanation(true)}
                style={{ marginRight: '8px' }}
              >
                {formatCustomsCode(row.code_douanier)}
              </Button>
            </Tooltip>
          ) : '-'}
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.matiere_premiere_source}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.regle_origine}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.exceptions}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.tolerances}</TableCell>
        <TableCell sx={{ borderRight: '2px solid #1976d2', fontWeight: 'bold' }}>
          <Button onClick={() => onEdit(row)} color="primary">
            Modifier
          </Button>
          <Button onClick={() => onDelete(row.id)} color="error">
            Supprimer
          </Button>
        </TableCell>
      </TableRow>

      <Dialog
        open={showGptExplanation}
        onClose={() => setShowGptExplanation(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Explication du code douanier pour {row.nom}
        </DialogTitle>
        <DialogContent>
          {alternativeCodes.length > 0 && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Code douanier</InputLabel>
                <Select
                  value={selectedCode || ''}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={isUpdating}
                >
                  {alternativeCodes.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          <Typography
            variant="body1"
            component="div"
            style={{ whiteSpace: 'pre-line' }}
          >
            {row.code_douanier_gpt}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            onClick={handleDemandeConseil}
            variant="outlined"
            color="primary"
            sx={{ mr: 'auto' }}
          >
            Demande de conseil
          </Button>
          <Button onClick={() => setShowGptExplanation(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <EmailDialog
        open={showEmailDialog}
        onClose={handleEmailDialogClose}
        emailContent={row.code_douanier_gpt}
      />

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={14}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, backgroundColor: '#f5f5f5', padding: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ color: '#666' }}>
                Transformations
              </Typography>
              <TransformationsTable matierePremiereId={row.id} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const TransformationsTable = ({ matierePremiereId }) => {
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransformations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/transformations/matiere/${matierePremiereId}`);
        console.log('Transformations reçues:', response.data);
        setTransformations(response.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des transformations:', error);
        setTransformations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransformations();
  }, [matierePremiereId]);

  if (loading) {
    return <Typography>Chargement des transformations...</Typography>;
  }

  if (transformations.length === 0) {
    return <Typography>Aucune transformation pour cette matière première</Typography>;
  }

  return (
    <TableContainer>
      <Table size="small" aria-label="transformations">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Code douanier</TableCell>
            <TableCell>Règle d'origine</TableCell>
            <TableCell>Exceptions</TableCell>
            <TableCell>Tolérances</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transformations.map((transformation) => (
            <TableRow key={transformation.id}>
              <TableCell component="th" scope="row">
                {transformation.id}
              </TableCell>
              <TableCell>{transformation.nom}</TableCell>
              <TableCell>{transformation.description || '-'}</TableCell>
              <TableCell>{transformation.code_douanier || '-'}</TableCell>
              <TableCell>{transformation.regle_origine || '-'}</TableCell>
              <TableCell>{transformation.exceptions || '-'}</TableCell>
              <TableCell>{transformation.tolerances || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const MatieresPremieres = () => {
  const [matieres, setMatieres] = useState([]);
  const [allMatieres, setAllMatieres] = useState([]); // Toutes les matières premières pour les listes déroulantes
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMatiere, setCurrentMatiere] = useState({
    id: '',
    nom: '',
    type: '',
    lot: '',
    fournisseur: '',
    pays_origine: '',
    valeur: '',
    code_douanier: '',
    matiere_premiere_source: '',
    regle_origine: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedAnalysisResult, setSelectedAnalysisResult] = useState(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isEstimating, setIsEstimating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchMatieres();
    fetchAllMatieres(); // Charger toutes les matières premières pour les listes déroulantes
  }, [page, limit]);
  
  // Fonction pour charger toutes les matières premières sans pagination
  const fetchAllMatieres = async () => {
    try {
      console.log('Récupération de toutes les matières premières pour les listes déroulantes...');
      const response = await axios.get(`${API_URL}/api/matieres-premieres?limit=1000`); // Limite élevée pour récupérer toutes les matières
      
      // Vérifier la structure de la réponse
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`${response.data.data.length} matières premières récupérées pour les listes déroulantes`);
        setAllMatieres(response.data.data);
      } else if (Array.isArray(response.data)) {
        console.log(`${response.data.length} matières premières récupérées pour les listes déroulantes`);
        setAllMatieres(response.data);
      } else {
        console.error('Format de données inattendu pour les matières premières:', response.data);
        setAllMatieres([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les matières premières:', error);
      setAllMatieres([]);
    }
  };

  const fetchMatieres = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matieres-premieres?page=${page}&limit=${limit}`);
      setMatieres(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Erreur lors de la récupération des matières premières:', error);
    }
  };

  const estimateCustomsCodes = async () => {
    setIsEstimating(true);
    try {
      const response = await fetch(`${API_URL}/api/gpt/estimate-customs-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'estimation des codes douaniers');
      }
      
      const data = await response.json();
      if (data.success) {
        // Rafraîchir les données
        fetchMatieres();
        setSnackbarMessage('Codes douaniers estimés avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Erreur lors de l\'estimation des codes douaniers');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbarMessage('Erreur lors de l\'estimation des codes douaniers');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleOpen = () => {
    setCurrentMatiere({
      id: '',
      nom: '',
      type: '',
      lot: '',
      fournisseur: '',
      pays_origine: '',
      valeur: '',
      code_douanier: '',
      matiere_premiere_source: '',
      regle_origine: ''
    });
    setEditMode(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    setCurrentMatiere({
      ...currentMatiere,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Normaliser le code douanier avant de l'envoyer
      const matiereToSubmit = {
        ...currentMatiere,
        code_douanier: normalizeCustomsCode(currentMatiere.code_douanier)
      };
      
      let response;
      if (editMode) {
        response = await axios.put(`${API_URL}/api/matieres-premieres/${currentMatiere.id}`, matiereToSubmit);
        setSnackbarMessage('Matière première mise à jour avec succès');
      } else {
        response = await axios.post(`${API_URL}/api/matieres-premieres`, matiereToSubmit);
        setSnackbarMessage('Matière première ajoutée avec succès');
        // Après création, aller à la première page pour voir le nouvel élément
        setPage(1);
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClose();
      fetchMatieres();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSnackbarMessage('Erreur lors de la soumission');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (matiere) => {
    setCurrentMatiere(matiere);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière première ?')) {
      try {
        await axios.delete(`${API_URL}/api/matieres-premieres/${id}`);
        setSnackbarMessage('Matière première supprimée avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Si c'était le dernier élément de la page, revenir à la page précédente (sauf si on est déjà à la page 1)
        if (matieres.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchMatieres();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setSnackbarMessage('Erreur lors de la suppression');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleCreateMatierePremiere = (result) => {
    // Créer directement la matière première à partir des résultats d'analyse
    const newMatiere = {
      nom: result.nom || '',
      type: 'extrait', // Valeur par défaut pour éviter l'erreur de contrainte
      lot: result.lot || '',
      fournisseur: result.fournisseur || '',
      pays_origine: result.pays_origine || '',
      valeur: result.valeur ? parseFloat(result.valeur.toString().replace(/[^0-9.]/g, '')).toString() : '0', // Valeur par défaut
      code_douanier: result.code_douanier || '',
      matiere_premiere_source: result.matiere_premiere_source || '',
      regle_origine: result.regle_origine || ''
    };
    
    // Afficher les valeurs qui seront utilisées pour créer la matière première
    console.log('Valeurs extraites du PDF:', {
      nom: result.nom,
      fournisseur: result.fournisseur,
      pays_origine: result.pays_origine,
      valeur: result.valeur,
      code_douanier: result.code_douanier
    });
    
    console.log('Création d\'une nouvelle matière première:', newMatiere);
    
    axios.post(`${API_URL}/api/matieres-premieres`, newMatiere)
      .then(response => {
        setSnackbarMessage('Matière première créée avec succès');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Après création, aller à la première page pour voir le nouvel élément
        setPage(1);
        fetchMatieres();
      })
      .catch(error => {
        console.error('Erreur lors de la création de la matière première:', error);
        if (error.response && error.response.data) {
          console.error('Détails de l\'erreur:', error.response.data);
        }
        setSnackbarMessage(`Erreur lors de la création de la matière première: ${error.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
    
    setShowAnalysisDialog(false);
  };

  const handleUpdate = (updatedMatiere) => {
    setMatieres(prevMatieres =>
      prevMatieres.map(m =>
        m.id === updatedMatiere.id ? { ...m, ...updatedMatiere } : m
      )
    );
  };

  const handleAnalyseClick = () => {
    setShowAnalysisDialog(true);
  };

  const handleAnalyseClose = () => {
    setShowAnalysisDialog(false);
    setSelectedFile(null);
    setAnalysisResults([]);
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleAnalyseSubmit = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('Envoi de la requête à:', `${API_URL}/api/analyse-document`);
      const response = await axios.post(`${API_URL}/api/analyse-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Afficher la réponse brute pour débogage
      console.log('Réponse brute de l\'API:', response.data);
      
      // Traiter les résultats pour s'assurer que les valeurs nulles sont gérées correctement
      const processedResults = Array.isArray(response.data) ? response.data.map(item => ({
        ...item,
        fournisseur: item.fournisseur || '',
        pays_origine: item.pays_origine || '',
        valeur: item.valeur || '0'
      })) : [];
      
      console.log('Résultats traités:', processedResults);
      setAnalysisResults(processedResults);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <>
      <div className="mb-8 flex justify-start items-center gap-8">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          sx={{ 
            height: '40px',
            minWidth: '200px'
          }}
        >
          Ajouter une matière première
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleAnalyseClick}
          sx={{ 
            height: '40px',
            minWidth: '200px',
            marginLeft: '20px'
          }}
        >
          Analyser un document
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={estimateCustomsCodes}
          disabled={isEstimating}
          sx={{ 
            height: '40px',
            minWidth: '200px',
            marginLeft: '20px'
          }}
        >
          Estimer les codes douaniers
        </Button>
      </div>

      <TableContainer component={Paper} sx={{ margin: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Id</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Lot</TableCell>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Pays d'origine</TableCell>
              <TableCell>Valeur (€)</TableCell>
              <TableCell>Code Douanier</TableCell>
              <TableCell>Matière première source</TableCell>
              <TableCell>Règle d'origine</TableCell>
              <TableCell>Exceptions</TableCell>
              <TableCell>Tolérances</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matieres.map((row, index) => (
              <Row
                key={row.id}
                row={row}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Éléments par page:
          </Typography>
          <Select
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              setPage(1); // Réinitialiser à la première page lors du changement de limite
            }}
            size="small"
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
          <Typography variant="body2" sx={{ ml: 2 }}>
            Total: {totalItems} matières premières
          </Typography>
        </Box>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
        />
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifier la matière première' : 'Ajouter une matière première'}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="nom"
            label="Nom"
            value={currentMatiere.nom}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={currentMatiere.type}
              onChange={handleChange}
            >
              {typeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="lot"
            label="Lot"
            value={currentMatiere.lot}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="fournisseur"
            label="Fournisseur"
            value={currentMatiere.fournisseur}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="pays_origine"
            label="Pays d'origine"
            value={currentMatiere.pays_origine}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="valeur"
            label="Valeur (€)"
            value={currentMatiere.valeur}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="number"
            inputProps={{ step: "0.01" }}
          />
          <TextField
            name="code_douanier"
            label="Code douanier"
            value={currentMatiere.code_douanier}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Matière première source</InputLabel>
            <Select
              name="matiere_premiere_source"
              value={currentMatiere.matiere_premiere_source || ''}
              onChange={handleChange}
              displayEmpty
            >
              <MenuItem value="">
                <em>Aucune</em>
              </MenuItem>
              {/* Utiliser allMatieres au lieu de matieres pour avoir une liste complète */}
              {allMatieres.map((m) => (
                <MenuItem key={m.id} value={m.lot}>
                  {m.lot} - {m.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="regle_origine"
            label="Règle d'origine"
            value={currentMatiere.regle_origine}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            name="exceptions"
            label="Exceptions"
            value={currentMatiere.exceptions}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            name="tolerances"
            label="Tolérances"
            value={currentMatiere.tolerances}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
            {editMode ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showAnalysisDialog} onClose={handleAnalyseClose} maxWidth="md" fullWidth>
        <DialogTitle>Analyse de document</DialogTitle>
        <DialogContent>
          {!analysisResults.length ? (
            <Box sx={{ mt: 2 }}>
              <input
                accept="application/pdf"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="raised-button-file">
                <Button variant="contained" component="span">
                  Sélectionner un PDF
                </Button>
              </label>
              {selectedFile && (
                <Typography sx={{ mt: 2 }}>
                  Fichier sélectionné: {selectedFile.name}
                </Typography>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnalyseSubmit}
                disabled={!selectedFile || isAnalyzing}
                sx={{ mt: 2 }}
              >
                {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'analyse'}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Résultats de l'analyse
              </Typography>
              {analysisResults.map((result, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <Typography><strong>Nom de la matière première:</strong> {result.nom || 'Non spécifié'}</Typography>
                  <Typography><strong>Fournisseur:</strong> {result.fournisseur || 'Non spécifié'}</Typography>
                  <Typography><strong>Pays d'origine:</strong> {result.pays_origine || 'Non spécifié'}</Typography>
                  <Typography><strong>Valeur:</strong> {result.valeur ? `${result.valeur} €` : '0 €'}</Typography>
                  <Typography><strong>Code douanier:</strong> {result.code_douanier || 'Non spécifié'}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleCreateMatierePremiere(result)}
                    sx={{ mt: 1 }}
                  >
                    Créer la matière première
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnalyseClose}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
      >
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default MatieresPremieres;
