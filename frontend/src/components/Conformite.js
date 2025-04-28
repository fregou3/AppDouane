import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Box,
    Grid,
    Chip
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';

const Conformite = () => {
    const [category, setCategory] = useState('matieres_premieres');
    const [lots, setLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState('');
    const [matiereData, setMatiereData] = useState(null);
    const [analysesBonLivraison, setAnalysesBonLivraison] = useState({});
    const [analysesBulletinAnalyse, setAnalysesBulletinAnalyse] = useState({});
    const [openBonLivraison, setOpenBonLivraison] = useState(false);
    const [openBulletinAnalyse, setOpenBulletinAnalyse] = useState(false);
    const [loadingBonLivraison, setLoadingBonLivraison] = useState(false);
    const [loadingBulletinAnalyse, setLoadingBulletinAnalyse] = useState(false);
    const [analyseBonLivraison, setAnalyseBonLivraison] = useState(null);
    const [analyseBulletinAnalyse, setAnalyseBulletinAnalyse] = useState(null);

    useEffect(() => {
        if (category === 'matieres_premieres') {
            fetchLots();
        }
    }, [category]);

    useEffect(() => {
        if (selectedLot) {
            fetchMatiereData();
        }
    }, [selectedLot]);

    const fetchLots = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/conformite/lots`);
            setLots(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des lots:', error);
        }
    };

    const formatAnalyseData = (data, type) => {
        if (!data) return null;

        // Si c'est une erreur, retourner tel quel
        if (data.error) return data;

        // Définir les champs attendus pour chaque type
        const expectedFields = type === 'bon_livraison' ? {
            date_document: 'date',
            nom_fournisseur: 'nom du fournisseur',
            nom_matiere_premiere: 'nom de la matière première',
            numero_bl: 'numéro du bon de livraison',
            adresse_depart: 'adresse de départ',
            adresse_destination: 'adresse de destination',
            poids_colis: 'poids du colis',
            mode_transport: 'mode de transport'
        } : {
            date_document: 'date',
            nom_fournisseur: 'nom du fournisseur',
            numero_lot: 'numéro du lot',
            numero_commande: 'numéro de commande',
            nom_matiere_premiere: 'nom de la matière première',
            caracteristiques_matiere: 'caractéristique de la matière première'
        };

        // Créer l'objet fields avec les valeurs de la base de données
        const fields = {};
        Object.entries(expectedFields).forEach(([key, name]) => {
            fields[key] = {
                name,
                present: data[key] || false
            };
        });

        // Calculer le ratio
        const presentCount = Object.values(fields).filter(f => f.present).length;
        const ratio = presentCount / Object.keys(fields).length;

        return {
            ...data,
            fields,
            ratio_conformite: data.ratio_conformite || ratio
        };
    };

    const fetchMatiereData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/conformite/matiere/${selectedLot}`);
            setMatiereData(response.data);
            
            // Récupérer les analyses pour chaque document
            const analysesBL = {};
            const analysesBA = {};
            
            for (const row of response.data) {
                if (row.type_document) {
                    try {
                        const analyseResponse = await axios.get(`${API_URL}/api/conformite/analyse/${row.type_document}/${row.id}`);
                        if (analyseResponse.data) {
                            const formattedData = formatAnalyseData(analyseResponse.data, row.type_document);
                            if (row.type_document === 'bon_livraison') {
                                analysesBL[row.id] = formattedData;
                            } else {
                                analysesBA[row.id] = formattedData;
                            }
                        }
                    } catch (error) {
                        console.error('Erreur lors de la récupération de l\'analyse:', error);
                    }
                }
            }
            
            setAnalysesBonLivraison(analysesBL);
            setAnalysesBulletinAnalyse(analysesBA);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        }
    };

    const handleAnalyze = async (document) => {
        const isLivraison = document.type_document === 'bon_livraison';
        
        if (isLivraison) {
            setLoadingBonLivraison(true);
            setOpenBonLivraison(true);
        } else {
            setLoadingBulletinAnalyse(true);
            setOpenBulletinAnalyse(true);
        }

        try {
            const response = await axios.post(`${API_URL}/api/conformite/analyze`, {
                fichier_path: document.fichier_path,
                type_document: document.type_document,
                document_id: document.id,
                matiere_premiere_id: document.matiere_premiere_id
            });
            
            const formattedData = formatAnalyseData(response.data, document.type_document);

            // Mettre à jour les analyses spécifiques
            if (isLivraison) {
                setAnalysesBonLivraison(prev => ({
                    ...prev,
                    [document.id]: formattedData
                }));
                setAnalyseBonLivraison(formattedData);
            } else {
                setAnalysesBulletinAnalyse(prev => ({
                    ...prev,
                    [document.id]: formattedData
                }));
                setAnalyseBulletinAnalyse(formattedData);
            }

            // Rafraîchir les données après l'analyse
            await fetchMatiereData();
        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            const errorResult = {
                error: true,
                message: error.response?.data?.message || 'Erreur lors de l\'analyse du document',
                filename: error.response?.data?.filename || document.fichier_path
            };
            if (isLivraison) {
                setAnalyseBonLivraison(errorResult);
            } else {
                setAnalyseBulletinAnalyse(errorResult);
            }
        }

        if (isLivraison) {
            setLoadingBonLivraison(false);
        } else {
            setLoadingBulletinAnalyse(false);
        }
    };

    const handleShowAnalysis = (document) => {
        const isLivraison = document.type_document === 'bon_livraison';
        const analyse = isLivraison ? 
            analysesBonLivraison[document.id] : 
            analysesBulletinAnalyse[document.id];
            
        if (isLivraison) {
            setAnalyseBonLivraison(analyse);
            setOpenBonLivraison(true);
        } else {
            setAnalyseBulletinAnalyse(analyse);
            setOpenBulletinAnalyse(true);
        }
    };

    const handleCloseBonLivraison = () => {
        setOpenBonLivraison(false);
        setAnalyseBonLivraison(null);
        setLoadingBonLivraison(false);
    };

    const handleCloseBulletinAnalyse = () => {
        setOpenBulletinAnalyse(false);
        setAnalyseBulletinAnalyse(null);
        setLoadingBulletinAnalyse(false);
    };

    const renderAnalysisResult = (analysisResult) => {
        if (!analysisResult) return null;
        if (analysisResult.error) {
            return (
                <DialogContentText color="error">
                    {analysisResult.message}
                    <br />
                    Fichier: {analysisResult.filename}
                </DialogContentText>
            );
        }

        // Calculer le nombre de champs présents
        const presentFields = Object.entries(analysisResult.fields || {}).filter(([_, field]) => field.present);
        const totalFields = Object.keys(analysisResult.fields || {}).length;

        return (
            <>
                <DialogContentText>
                    <strong>Fichier analysé :</strong> {analysisResult.filename}
                </DialogContentText>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>État des informations requises :</strong>
                    </Typography>
                    <Grid container spacing={1}>
                        {Object.entries(analysisResult.fields || {}).map(([key, field], index) => (
                            <Grid item key={index}>
                                <Chip
                                    label={field.name}
                                    color={field.present ? "success" : "error"}
                                    variant={field.present ? "filled" : "outlined"}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
                <DialogContentText sx={{ mt: 3 }}>
                    <strong>Résumé :</strong>
                    <br />
                    {analysisResult.resume}
                </DialogContentText>
                <DialogContentText sx={{ mt: 2 }}>
                    <strong>Ratio de conformité :</strong> {((analysisResult.ratio_conformite || 0) * 100).toFixed(1)}%
                    ({presentFields.length}/{totalFields} informations présentes)
                </DialogContentText>
            </>
        );
    };

    const renderDocumentSection = (docType) => {
        const doc = getDocumentStatus(docType);
        const baseData = matiereData[0];
        const isLivraison = docType === 'bon_livraison';
        const analyse = doc ? 
            (isLivraison ? analysesBonLivraison[doc.id] : analysesBulletinAnalyse[doc.id]) 
            : null;
        const title = isLivraison ? 'Bon de livraison' : 'Bulletin d\'analyse';

        return (
            <>
                <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                    {title}
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Id</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Lot</TableCell>
                                <TableCell>Fichier</TableCell>
                                <TableCell>Actions</TableCell>
                                <TableCell>Conformité</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>{baseData?.id}</TableCell>
                                <TableCell>{baseData?.nom}</TableCell>
                                <TableCell>{baseData?.type}</TableCell>
                                <TableCell>{baseData?.lot}</TableCell>
                                <TableCell>
                                    {doc ? doc.fichier_path.split('/').pop() : 'Non reçu'}
                                </TableCell>
                                <TableCell>
                                    {doc && (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleAnalyze(doc)}
                                                sx={{ mr: 1 }}
                                            >
                                                Analyser
                                            </Button>
                                            {analyse && (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => handleShowAnalysis(doc)}
                                                >
                                                    Voir analyse
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {analyse && (
                                        <Typography>
                                            {((analyse.ratio_conformite || 0) * 100).toFixed(1)}%
                                            ({Object.values(analyse.fields || {}).filter(f => f.present).length}/
                                            {Object.keys(analyse.fields || {}).length})
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                {doc && analyse && (
                    <Box sx={{ mt: 2, ml: 2 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                            Informations requises :
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                            {Object.entries(analyse.fields || {}).map(([key, field], index) => (
                                <Grid item key={index}>
                                    <Chip
                                        label={field.name}
                                        color={field.present ? "success" : "error"}
                                        variant={field.present ? "filled" : "outlined"}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </>
        );
    };

    const getDocumentStatus = (type) => {
        if (!matiereData) return null;
        return matiereData.find(row => row.type_document === type);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Conformité
            </Typography>
            
            <FormControl fullWidth margin="normal">
                <InputLabel>Catégorie</InputLabel>
                <Select
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setSelectedLot('');
                        setMatiereData(null);
                        setAnalysesBonLivraison({});
                        setAnalysesBulletinAnalyse({});
                    }}
                    label="Catégorie"
                >
                    <MenuItem value="matieres_premieres">Matières Premières</MenuItem>
                    <MenuItem value="transformations">Transformations</MenuItem>
                </Select>
            </FormControl>

            {category === 'matieres_premieres' && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>Lot</InputLabel>
                    <Select
                        value={selectedLot}
                        onChange={(e) => setSelectedLot(e.target.value)}
                        label="Lot"
                    >
                        {lots.map((lot) => (
                            <MenuItem key={lot} value={lot}>{lot}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {matiereData && matiereData.length > 0 && (
                <Box sx={{ mb: 8 }}>
                    {renderDocumentSection('bon_livraison')}
                    {renderDocumentSection('bulletin_analyse')}
                </Box>
            )}

            {/* Dialog pour le bon de livraison */}
            <Dialog
                open={openBonLivraison}
                onClose={handleCloseBonLivraison}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Analyse du bon de livraison
                </DialogTitle>
                <DialogContent>
                    {loadingBonLivraison ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        renderAnalysisResult(analyseBonLivraison)
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBonLivraison}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog pour le bulletin d'analyse */}
            <Dialog
                open={openBulletinAnalyse}
                onClose={handleCloseBulletinAnalyse}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Analyse du bulletin d'analyse
                </DialogTitle>
                <DialogContent>
                    {loadingBulletinAnalyse ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        renderAnalysisResult(analyseBulletinAnalyse)
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBulletinAnalyse}>
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Conformite;
