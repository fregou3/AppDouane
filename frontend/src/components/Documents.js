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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { API_URL } from '../config';

const documentTypes = {
    matieres_premieres: [
        { value: 'bon_livraison', label: 'Bon de livraison' },
        { value: 'bulletin_analyse', label: 'Bulletin d\'analyse' },
        { value: 'certificat', label: 'Certificat' }
    ],
    transformations: [
        { value: 'controle_qualite', label: 'Contrôle qualité' },
        { value: 'certificat_transformation', label: 'Certificat de transformation' },
        { value: 'certificat_conformite', label: 'Certificat de conformité' }
    ]
};

const Documents = () => {
    const [selectedCategory, setSelectedCategory] = useState('matieres_premieres');
    const [matieres, setMatieres] = useState([]);
    const [transformations, setTransformations] = useState([]);
    const [documents, setDocuments] = useState({});
    const [openUpload, setOpenUpload] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedDocType, setSelectedDocType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        try {
            if (selectedCategory === 'matieres_premieres') {
                const response = await axios.get(`${API_URL}/api/matieres-premieres`);
                // S'assurer que response.data est un tableau
                const data = Array.isArray(response.data) ? response.data : [];
                setMatieres(data);
                fetchDocuments(data, true);
            } else {
                const response = await axios.get(`${API_URL}/api/transformations`);
                // S'assurer que response.data est un tableau
                const data = Array.isArray(response.data) ? response.data : [];
                setTransformations(data);
                fetchDocuments(data, false);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            // En cas d'erreur, initialiser avec des tableaux vides
            if (selectedCategory === 'matieres_premieres') {
                setMatieres([]);
            } else {
                setTransformations([]);
            }
        }
    };

    const fetchDocuments = async (items, isMatiere) => {
        // S'assurer que items est un tableau
        if (!items || !Array.isArray(items)) {
            console.warn('fetchDocuments: items n\'est pas un tableau', items);
            return;
        }
        
        const newDocuments = {};
        for (const item of items) {
            try {
                const response = await axios.get(`${API_URL}/api/documents/${isMatiere ? 'matieres-premieres' : 'transformations'}/${item.id}`);
                newDocuments[item.id] = response.data;
            } catch (error) {
                console.error('Erreur lors de la récupération des documents:', error);
            }
        }
        setDocuments(newDocuments);
    };

    const handleUploadClick = (item) => {
        setSelectedItem(item);
        setSelectedDocType('');
        setSelectedFile(null);
        setOpenUpload(true);
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !selectedDocType) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type_document', selectedDocType);
        
        if (selectedCategory === 'matieres_premieres') {
            formData.append('matiere_premiere_id', selectedItem.id);
        } else {
            formData.append('transformation_id', selectedItem.id);
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/documents/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Mettre à jour les documents après l'upload
            if (selectedCategory === 'matieres_premieres') {
                const response = await axios.get(`${API_URL}/api/documents/matieres-premieres/${selectedItem.id}`);
                const newDocuments = { ...documents };
                newDocuments[selectedItem.id] = response.data;
                setDocuments(newDocuments);
            } else {
                const response = await axios.get(`${API_URL}/api/documents/transformations/${selectedItem.id}`);
                const newDocuments = { ...documents };
                newDocuments[selectedItem.id] = response.data;
                setDocuments(newDocuments);
            }
            
            setOpenUpload(false);
            setSelectedFile(null);
            setSelectedDocType('');
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
        }
        setLoading(false);
    };

    const getStatusIcon = (itemId, docType) => {
        const itemDocs = documents[itemId] || [];
        const doc = itemDocs.find(d => d.type_document === docType);
        return doc?.status === 'valide' ? (
            <CheckCircleIcon sx={{ color: 'success.main' }} />
        ) : (
            <Typography color="text.secondary">en attente</Typography>
        );
    };

    const renderTable = () => {
        let items = selectedCategory === 'matieres_premieres' ? matieres : transformations;
        const currentDocTypes = documentTypes[selectedCategory];
        
        // S'assurer que items est un tableau
        if (!items || !Array.isArray(items)) {
            items = [];
        }

        return (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Nom</TableCell>
                            {selectedCategory === 'matieres_premieres' && <TableCell>Type</TableCell>}
                            <TableCell>Lot</TableCell>
                            <TableCell>Documents</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Upload</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Aucune donnée disponible
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, itemIndex) => (
                                currentDocTypes.map((docType, docIndex) => (
                                    <TableRow 
                                        key={`${item.id}-${docType.value}`}
                                        sx={{
                                            '& > td': {
                                                borderTop: docIndex === 0 ? '2px solid #1976d2' : 'none',
                                                borderBottom: docIndex === currentDocTypes.length - 1 ? '2px solid #1976d2' : '1px solid rgba(224, 224, 224, 1)',
                                                backgroundColor: itemIndex % 2 === 0 ? 'inherit' : '#fafafa'
                                            }
                                        }}
                                    >
                                        {docIndex === 0 && (
                                            <>
                                                <TableCell 
                                                    rowSpan={currentDocTypes.length}
                                                    sx={{
                                                        borderLeft: '2px solid #1976d2',
                                                        fontWeight: 'bold'
                                                    }}
                                                >{item.id}</TableCell>
                                                <TableCell 
                                                    rowSpan={currentDocTypes.length}
                                                    sx={{ fontWeight: 'bold' }}
                                                >{item.nom}</TableCell>
                                                {selectedCategory === 'matieres_premieres' && (
                                                    <TableCell 
                                                        rowSpan={currentDocTypes.length}
                                                        sx={{ fontWeight: 'bold' }}
                                                    >{item.type}</TableCell>
                                                )}
                                                <TableCell 
                                                    rowSpan={currentDocTypes.length}
                                                    sx={{ fontWeight: 'bold' }}
                                                >{item.lot}</TableCell>
                                            </>
                                        )}
                                        <TableCell>{docType.label}</TableCell>
                                        <TableCell>
                                            {getStatusIcon(item.id, docType.value)}
                                        </TableCell>
                                        {docIndex === 0 && (
                                            <TableCell 
                                                rowSpan={currentDocTypes.length}
                                                sx={{
                                                    borderRight: '2px solid #1976d2',
                                                }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    startIcon={<CloudUploadIcon />}
                                                    onClick={() => handleUploadClick(item)}
                                                >
                                                    Upload
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <div>
            <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Catégorie</InputLabel>
                <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Catégorie"
                >
                    <MenuItem value="matieres_premieres">Matières premières</MenuItem>
                    <MenuItem value="transformations">Transformations</MenuItem>
                    <MenuItem value="semi_finis" disabled>Semi-finis</MenuItem>
                    <MenuItem value="produits_finis" disabled>Produits finis</MenuItem>
                </Select>
            </FormControl>

            {renderTable()}

            <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
                <DialogTitle>Upload de document</DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 400, mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type de document</InputLabel>
                            <Select
                                value={selectedDocType}
                                onChange={(e) => setSelectedDocType(e.target.value)}
                                label="Type de document"
                            >
                                {documentTypes[selectedCategory].map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            style={{ marginTop: '1rem' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpload(false)}>Annuler</Button>
                    <Button
                        onClick={handleFileUpload}
                        variant="contained"
                        disabled={!selectedFile || !selectedDocType || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Documents;
