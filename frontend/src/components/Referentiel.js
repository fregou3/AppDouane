import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Paper 
} from '@mui/material';
import MatieresPremieres from './MatieresPremieres';
import Transformations from './Transformations';
import SemiFinis from './SemiFinis';
import ProduitsFinis from './ProduitsFinis';

const Referentiel = () => {
  const [selectedType, setSelectedType] = useState('matieres-premieres');

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Type de référentiel</InputLabel>
          <Select
            value={selectedType}
            label="Type de référentiel"
            onChange={handleTypeChange}
          >
            <MenuItem value="matieres-premieres">Matières premières</MenuItem>
            <MenuItem value="transformations">Transformations</MenuItem>
            <MenuItem value="semi-finis">Semi-finis</MenuItem>
            <MenuItem value="produits-finis">Produits finis</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {selectedType === 'matieres-premieres' && <MatieresPremieres />}
        {selectedType === 'transformations' && <Transformations />}
        {selectedType === 'semi-finis' && <SemiFinis />}
        {selectedType === 'produits-finis' && <ProduitsFinis />}
      </Box>
    </Box>
  );
};

export default Referentiel;
