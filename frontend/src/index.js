import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import axios from 'axios';

// Intercepteur pour rediriger les requêtes localhost:5006 vers app1.communify.solutions:5006
axios.interceptors.request.use(config => {
  // Vérifier si l'URL contient localhost:5006
  if (config.url && config.url.includes('localhost:5006')) {
    // Remplacer localhost:5006 par app1.communify.solutions:5006
    config.url = config.url.replace('localhost:5006', 'app1.communify.solutions:5006');
    console.log('URL interceptée et modifiée:', config.url);
  }
  return config;
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
