import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Referentiel from './components/Referentiel';
import Documents from './components/Documents';
import Conformite from './components/Conformite';
import Analyse from './components/Analyse';
import ProduitsFinis from './components/ProduitsFinis';
import MatieresPremieres from './components/MatieresPremieres';
import Transformations from './components/Transformations';
import SemiFinis from './components/SemiFinis';
import Query from './components/Query';

function App() {
  const [currentPage, setCurrentPage] = useState('accueil');
  const [referentielType, setReferentielType] = useState('');

  const handleReferentielChange = (event) => {
    setReferentielType(event.target.value);
  };

  const renderReferentiel = () => {
    switch (referentielType) {
      case 'matieres-premieres':
        return <MatieresPremieres />;
      case 'transformations':
        return <Transformations />;
      case 'semi-finis':
        return <SemiFinis />;
      case 'produits-finis':
        return <ProduitsFinis />;
      default:
        return <Typography>Sélectionnez un type de référentiel</Typography>;
    }
  };

  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Module Douane
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link to="/referentiel" style={{ color: 'white', textDecoration: 'none' }}>
                Référentiel
              </Link>
              <Link to="/documents" style={{ color: 'white', textDecoration: 'none' }}>
                Documents
              </Link>
              <Link to="/conformite" style={{ color: 'white', textDecoration: 'none' }}>
                Conformité
              </Link>
              <Link to="/analyse" style={{ color: 'white', textDecoration: 'none' }}>
                Analyse
              </Link>
              <Link to="/query" style={{ color: 'white', textDecoration: 'none' }}>
                Query
              </Link>
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth={false} sx={{ mt: 4, width: '95%' }}>
          <Routes>
            <Route path="/" element={<Referentiel />} />
            <Route path="/referentiel" element={
              <div>
                <FormControl sx={{ mt: 2, minWidth: 200 }}>
                  <InputLabel>Type de référentiel</InputLabel>
                  <Select
                    value={referentielType}
                    onChange={handleReferentielChange}
                  >
                    <MenuItem value="matieres-premieres">Matières Premières</MenuItem>
                    <MenuItem value="transformations">Transformations</MenuItem>
                    <MenuItem value="semi-finis">Semi-Finis</MenuItem>
                    <MenuItem value="produits-finis">Produits Finis</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ mt: 2 }}>
                  {renderReferentiel()}
                </Box>
              </div>
            } />
            <Route path="/documents" element={<Documents />} />
            <Route path="/conformite" element={<Conformite />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/query" element={<Query />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
