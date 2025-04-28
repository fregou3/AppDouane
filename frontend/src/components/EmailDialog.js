import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../config';

const EmailDialog = ({ open, onClose, emailContent }) => {
  const [sending, setSending] = useState(false);
  const [emailData, setEmailData] = useState({
    to: 'conseil@lh-lf.com',
    subject: 'Demande de conseil',
    body: `Bonjour,

Nous sollicitons vos conseils sur le code douane ci-dessous.

${emailContent || ''}`
  });

  const handleChange = (field) => (event) => {
    setEmailData({
      ...emailData,
      [field]: event.target.value
    });
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await axios.post(`${API_URL}/api/send-email`, emailData);
      onClose(true); // true indique que l'email a été envoyé avec succès
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      alert('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>Envoyer un email</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="À"
            value={emailData.to}
            onChange={handleChange('to')}
            fullWidth
          />
          <TextField
            label="Objet"
            value={emailData.subject}
            onChange={handleChange('subject')}
            fullWidth
          />
          <TextField
            label="Message"
            value={emailData.body}
            multiline
            rows={10}
            onChange={handleChange('body')}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={sending}>
          Annuler
        </Button>
        <Button 
          onClick={handleSend} 
          variant="contained" 
          color="primary"
          disabled={sending || !emailData.to || !emailData.subject || !emailData.body}
        >
          {sending ? 'Envoi en cours...' : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;
