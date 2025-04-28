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
  Box,
  Typography,
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
  Tooltip,
  Chip,
  Pagination
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { API_URL } from '../config';
import EmailDialog from './EmailDialog';
import { normalizeCustomsCode, formatCustomsCode, extractCustomsCodes } from '../utils/customsCodeUtils';

const Row = ({ row, index, onEdit, onDelete, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [matiereInfo, setMatiereInfo] = useState(null);
  const [showGptExplanation, setShowGptExplanation] = useState(false);
  const [alternativeCodes, setAlternativeCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(row.code_douanier ? normalizeCustomsCode(row.code_douanier) : '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (open && !matiereInfo) {
      fetchMatiereInfo();
    }
  }, [open]);

  useEffect(() => {
    if (row.code_douanier_gpt) {
      const codes = extractCustomsCodes(row.code_douanier_gpt);
      setAlternativeCodes(codes);
    }
  }, [row.code_douanier_gpt]);

  useEffect(() => {
    setSelectedCode(row.code_douanier ? normalizeCustomsCode(row.code_douanier) : '');
  }, [row.code_douanier]);

  const fetchMatiereInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matieres-premieres/${row.matiere_premiere_id}`);
      setMatiereInfo(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de la matière première:', error);
    }
  };

  const handleCodeChange = async (newCode) => {
    if (!newCode || newCode === selectedCode) return;
    
    // Normaliser le code avant de l'envoyer au serveur
    const normalizedCode = normalizeCustomsCode(newCode);
    
    setIsUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/api/transformations/${row.id}/code-douanier`, {
        code_douanier: normalizedCode
      });
      
      if (response.status === 200) {
        setSelectedCode(normalizedCode);
        onUpdate({ ...row, code_douanier: normalizedCode });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du code douanier:', error);
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
            disabled={!row.matiere_premiere_id}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.id}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.nom}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.fournisseur}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.lot}</TableCell>
        <TableCell sx={{ fontWeight: 'bold' }}>{row.origine}</TableCell>
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
        <TableCell sx={{ fontWeight: 'bold' }}>{row.description}</TableCell>
        <TableCell sx={{ borderRight: '2px solid #1976d2', fontWeight: 'bold' }}>
          <IconButton color="primary" onClick={() => onEdit(row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(row.id)}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>

      <Dialog
        open={showGptExplanation}
        onClose={() => setShowGptExplanation(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Explication du code douanier pour la transformation : {row.nom}
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

      {open && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1, backgroundColor: '#f5f5f5', padding: 2, borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom component="div" sx={{ color: '#666' }}>
                  Matière Première
                </Typography>
                {matiereInfo ? (
                  <Table size="small" sx={{ backgroundColor: 'white' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Lot</TableCell>
                        <TableCell>Fournisseur</TableCell>
                        <TableCell>Pays d'origine</TableCell>
                        <TableCell>Code Douanier</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{matiereInfo.nom}</TableCell>
                        <TableCell>{matiereInfo.type}</TableCell>
                        <TableCell>{matiereInfo.lot}</TableCell>
                        <TableCell>{matiereInfo.fournisseur}</TableCell>
                        <TableCell>{matiereInfo.pays_origine}</TableCell>
                        <TableCell>{matiereInfo.code_douanier}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                    Chargement des informations...
                  </Typography>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const Transformations = () => {
  const [transformations, setTransformations] = useState([]);
  const [matieresPremieresSources, setMatieresPremieresSources] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransformation, setCurrentTransformation] = useState({
    nom: '',
    fournisseur: '',
    lot: '',
    origine: '',
    valeur: '',
    code_douanier: '',
    description: '',
    matiere_premiere_id: null
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchTransformations();
    fetchMatieresPremieres();
  }, [page, limit]);

  const fetchTransformations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transformations?page=${page}&limit=${limit}`);
      setTransformations(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error('Erreur lors de la récupération des transformations:', error);
    }
  };

  const fetchMatieresPremieres = async () => {
    try {
      // Ajouter un paramètre limit=100 pour récupérer plus de résultats
      const response = await axios.get(`${API_URL}/api/matieres-premieres?limit=100`);
      console.log('Matières premières récupérées:', response.data);
      // Extraire les matières premières avec leurs lots
      const matieresSources = response.data.data
        .filter(m => m.lot) // Filtrer les matières premières qui ont un lot
        .map(m => ({
          id: m.id,
          lot: m.lot,
          nom: m.nom
        }));
      console.log('Matières premières filtrées:', matieresSources);
      setMatieresPremieresSources(matieresSources);
    } catch (error) {
      console.error('Erreur lors de la récupération des matières premières:', error);
    }
  };

  const estimateCustomsCodes = async () => {
    setIsEstimating(true);
    try {
      const response = await axios.post(`${API_URL}/api/gpt-transformations/estimate-customs-codes`);
      
      if (response.data.success) {
        fetchTransformations();
        alert(response.data.message);
      } else {
        alert('Erreur lors de l\'estimation des codes douaniers');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'estimation des codes douaniers');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleOpen = () => {
    setCurrentTransformation({
      nom: '',
      fournisseur: '',
      lot: '',
      origine: '',
      valeur: '',
      code_douanier: '',
      description: '',
      matiere_premiere_id: null
    });
    setEditMode(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCurrentTransformation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Normaliser le code douanier avant de l'envoyer
      const transformationToSubmit = {
        ...currentTransformation,
        code_douanier: normalizeCustomsCode(currentTransformation.code_douanier)
      };
      
      let response;
      if (editMode) {
        response = await axios.put(`${API_URL}/api/transformations/${currentTransformation.id}`, transformationToSubmit);
      } else {
        response = await axios.post(`${API_URL}/api/transformations`, transformationToSubmit);
        // Après création, aller à la première page pour voir le nouvel élément
        setPage(1);
      }
      
      if (response.status === 200) {
        fetchTransformations();
        handleClose();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transformation) => {
    setCurrentTransformation(transformation);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transformation ?')) {
      try {
        await axios.delete(`${API_URL}/api/transformations/${id}`);
        // Si c'était le dernier élément de la page, revenir à la page précédente (sauf si on est déjà à la page 1)
        if (transformations.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchTransformations();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleUpdate = (updatedTransformation) => {
    setTransformations(prevTransformations =>
      prevTransformations.map(t =>
        t.id === updatedTransformation.id ? { ...t, ...updatedTransformation } : t
      )
    );
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div className="p-4">
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
          Ajouter une transformation
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
          {isEstimating ? 'Estimation en cours...' : 'Estimer les codes douaniers'}
        </Button>
      </div>

      <TableContainer component={Paper} sx={{ margin: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Id</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Lot</TableCell>
              <TableCell>Origine</TableCell>
              <TableCell>Valeur (€)</TableCell>
              <TableCell>Code Douanier</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transformations.map((row, index) => (
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
            Total: {totalItems} transformations
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
          {editMode ? 'Modifier la transformation' : 'Ajouter une transformation'}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="nom"
            label="Nom"
            value={currentTransformation.nom}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="fournisseur"
            label="Fournisseur"
            value={currentTransformation.fournisseur}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Lot de matière première source</InputLabel>
            <Select
              name="lot"
              value={currentTransformation.lot || ''}
              onChange={(e) => {
                const selectedLot = e.target.value;
                const selectedMatiere = matieresPremieresSources.find(m => m.lot === selectedLot);
                setCurrentTransformation(prev => ({
                  ...prev,
                  lot: selectedLot,
                  matiere_premiere_id: selectedMatiere ? selectedMatiere.id : null
                }));
              }}
            >
              <MenuItem value="">
                <em>Sélectionner un lot</em>
              </MenuItem>
              {matieresPremieresSources.map((matiere) => (
                <MenuItem key={matiere.id} value={matiere.lot}>
                  {matiere.lot} - {matiere.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="origine"
            label="Origine"
            value={currentTransformation.origine}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="valeur"
            label="Valeur"
            type="number"
            value={currentTransformation.valeur}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="code_douanier"
            label="Code douanier"
            value={currentTransformation.code_douanier}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            name="description"
            label="Description"
            value={currentTransformation.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
            {editMode ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Transformations;
