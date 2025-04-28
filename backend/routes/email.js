const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/send-email', async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    // Vérification des champs requis
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Les champs destinataire, objet et message sont requis'
      });
    }

    // Configuration de l'email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: body
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email envoyé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error.message
    });
  }
});

module.exports = router;
