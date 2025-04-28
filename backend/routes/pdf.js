const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Fonction utilitaire pour extraire les pourcentages de fiabilité du texte
function extractReliabilityPercentages(text) {
  if (!text) return [];
  
  // Recherche des pourcentages dans le texte (format: XX% ou XX %)
  const percentageRegex = /(\d+)\s*%/g;
  const matches = [...text.matchAll(percentageRegex)];
  
  return matches.map(match => ({
    percentage: parseInt(match[1]),
    position: match.index
  }));
}

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Endpoint pour générer un PDF des résultats de recherche
router.post('/export-pdf', async (req, res) => {
  try {
    const { productDescription, results } = req.body;
    
    if (!productDescription || !results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Données invalides pour la génération du PDF' });
    }
    
    // Créer un document PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=resultats_douaniers_${Date.now()}.pdf`);
    
    // Pipe le PDF directement vers la réponse
    doc.pipe(res);
    
    // Ajouter le titre
    doc.fontSize(20).text('Résultats de recherche de code douanier', { align: 'center' });
    doc.moveDown();
    
    // Ajouter la date
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown();
    
    // Ajouter la description du produit
    doc.fontSize(14).text('Description du produit:');
    doc.fontSize(12).text(productDescription);
    doc.moveDown(2);
    
    // Ajouter les résultats de chaque moteur
    results.forEach((result, index) => {
      if (result && result.engine && result.code) {
        // Titre du moteur
        doc.fontSize(16).text(`Résultat ${result.engine}:`);
        doc.moveDown();
        
        // Code douanier
        doc.fontSize(14).text(`Code SH: ${result.code}`);
        doc.moveDown();
        
        // Explication
        if (result.explanation) {
          doc.fontSize(14).text('Explication:');
          doc.fontSize(12).text(result.explanation, {
            paragraphGap: 5,
            lineGap: 2
          });
        }
        
        // Ajouter un séparateur entre les résultats
        if (index < results.length - 1) {
          doc.moveDown(2);
          doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(2);
        }
      }
    });
    
    // Finaliser le PDF
    doc.end();
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// Endpoint pour générer un PDF avec une image
router.post('/export-pdf-with-image', upload.single('image'), async (req, res) => {
  try {
    // Vérifier si l'image a été uploadée
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }
    
    // Récupérer les données JSON de la requête
    let { productDescription, results } = JSON.parse(req.body.data);
    
    if (!productDescription || !results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Données invalides pour la génération du PDF' });
    }
    
    // Chemin de l'image uploadée
    const imagePath = req.file.path;
    
    // Créer un document PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=resultats_douaniers_${Date.now()}.pdf`);
    
    // Pipe le PDF directement vers la réponse
    doc.pipe(res);
    
    // Première page : Titre, date et image
    doc.fontSize(20).text('Résultats de recherche de code douanier', { align: 'center' });
    doc.moveDown();
    
    // Ajouter la date
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);
    
    // Section dédiée uniquement à l'image sur la première page
    try {
      // Centrer l'image sur la page
      doc.image(imagePath, {
        fit: [300, 300],
        align: 'center'
      });
      
      // Ajouter la légende sous l'image
      doc.fontSize(12).text('Image du produit analysé', { align: 'center' });
    } catch (imageError) {
      console.error('Erreur lors de l\'ajout de l\'image au PDF:', imageError);
      // Continuer sans l'image
    }
    
    // Créer une nouvelle page pour le contenu textuel
    doc.addPage();
    
    // Ajouter la description du produit au début de la nouvelle page
    doc.fontSize(14).font('Helvetica-Bold').text('Description du produit:', 50, 50);
    doc.font('Helvetica').fontSize(12).text(productDescription, 50, 70, {
      paragraphGap: 5,
      lineGap: 2,
      align: 'left',  // Aligner le texte à gauche
      width: 500  // Limiter la largeur du texte pour éviter les débordements
    });
    doc.moveDown(2);
    
    // Ajouter les résultats de chaque moteur
    results.forEach((result, index) => {
      if (result && result.engine && (result.code || result.engine === 'Moteur par raisonnement')) {
        // Créer un encadré pour chaque résultat
        const startY = doc.y;
        
        // Fond de couleur légère pour chaque résultat
        doc.rect(40, startY - 5, 515, result.engine === 'Moteur par raisonnement' ? 400 : 200);
        doc.fillColor('#f5f5f5').fill();
        doc.fillColor('#000000'); // Rétablir la couleur de texte
        
        // Titre du moteur avec couleur spéciale pour le moteur par raisonnement
        if (result.engine === 'Moteur par raisonnement') {
          doc.fillColor('#003366').fontSize(18).font('Helvetica-Bold').text(`Résultat ${result.engine}:`, {
            align: 'center'
          });
        } else {
          doc.fillColor('#333333').fontSize(16).font('Helvetica-Bold').text(`Résultat ${result.engine}:`);
        }
        doc.fillColor('#000000').font('Helvetica');
        doc.moveDown();
        
        // Code douanier (sauf pour le moteur par raisonnement qui n'a pas de code spécifique)
        if (result.code && result.code !== 'Analyse') {
          doc.fontSize(14).font('Helvetica-Bold').text(`Code SH: `, {
            continued: true
          });
          doc.font('Helvetica').text(result.code);
          doc.moveDown();
        }
        
        // Explication avec mise en évidence des pourcentages
        if (result.explanation) {
          doc.fontSize(14).font('Helvetica-Bold').text('Explication:');
          doc.font('Helvetica');
          
          // Extraire et mettre en évidence les pourcentages de fiabilité
          const percentages = extractReliabilityPercentages(result.explanation);
          
          // Suppression de l'affichage des pourcentages ici (ils seront ajoutés à la fin du document)
          doc.moveDown(1);
          
          // Texte de l'explication strictement aligné à gauche sans indentation
          doc.fontSize(12).font('Helvetica').fillColor('#000000').text(result.explanation, 50, doc.y, {
            paragraphGap: 5,
            lineGap: 2,
            width: 500,
            align: 'left'  // Aligner le texte à gauche
          });
        }
        
        // Ajouter un séparateur entre les résultats
        if (index < results.length - 1) {
          doc.moveDown(2);
          doc.strokeColor('#aaaaaa').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.strokeColor('#000000'); // Rétablir la couleur de contour
          doc.moveDown(2);
        }
      }
    });
    
    // Ajouter les pourcentages de fiabilité à la fin du document
    // Définir les noms des moteurs standards (sans le moteur par raisonnement)
    const standardNames = ['Engine 1', 'Engine 2', 'Engine 3'];
    let percentagesToShow = [];
    
    // Parcourir les résultats pour trouver les pourcentages du moteur par raisonnement
    for (const result of results) {
      if (result && result.engine === 'Moteur par raisonnement' && result.explanation) {
        // Extraire tous les pourcentages du texte
        const allPercentages = [];
        const percentageRegex = /(\d+)\s*%/g;
        let percentageMatch;
        while ((percentageMatch = percentageRegex.exec(result.explanation)) !== null) {
          allPercentages.push(percentageMatch[1]);
        }
        
        // Si nous avons au moins 3 pourcentages (pour les 3 moteurs), les utiliser
        if (allPercentages.length >= 3) {
          // Créer la liste des pourcentages avec les noms standardisés (seulement les 3 moteurs)
          percentagesToShow = standardNames.map((name, index) => ({
            engine: name,
            percentage: allPercentages[index] || '95' // Valeur par défaut si manquant
          }));
          
          // Ajouter le moteur par raisonnement uniquement s'il y a un 4ème pourcentage
          if (allPercentages.length >= 4 && allPercentages[3]) {
            percentagesToShow.push({
              engine: 'Moteur par raisonnement',
              percentage: allPercentages[3]
            });
          }
        } else {
          // Fallback avec des valeurs par défaut pour les 3 moteurs seulement
          percentagesToShow = standardNames.map((name, index) => ({
            engine: name,
            percentage: '95'
          }));
        }
        break; // Sortir de la boucle une fois les pourcentages trouvés
      }
    }
    
    // Afficher les pourcentages à la fin du document s'il y en a
    if (percentagesToShow.length > 0) {
      // Ajouter un séparateur avant la section des pourcentages
      doc.moveDown(2);
      doc.strokeColor('#aaaaaa').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.strokeColor('#000000'); // Rétablir la couleur de contour
      doc.moveDown(2);
      
      // Titre de la section des pourcentages
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#003366');
      doc.text('Pourcentages de fiabilité', 50, doc.y, { underline: true });
      doc.fillColor('#000000');
      doc.moveDown(1.5);
      
      // Afficher les pourcentages sous forme de liste simple avec meilleur alignement
      doc.fontSize(12);
      
      // Déterminer la largeur maximale des noms de moteurs pour un alignement uniforme
      const motorNameWidth = 180; // Largeur fixe pour tous les noms de moteurs
      
      // Utiliser directement les pourcentages dans l'ordre prédéfini
      percentagesToShow.forEach((item, index) => {
        // Position Y de départ pour cet élément
        const itemStartY = doc.y;
        
        // Créer un petit indicateur visuel amélioré pour chaque élément de la liste
        doc.fillColor('#003366');
        doc.circle(60, itemStartY + 6, 4).fill();
        doc.fillColor('#000000');
        
        // Afficher le nom du moteur en gras avec un alignement fixe
        doc.font('Helvetica-Bold').text(item.engine + ':', 70, itemStartY, {
          width: motorNameWidth,
          continued: false
        });
        
        // Afficher le pourcentage aligné à droite du nom du moteur
        doc.font('Helvetica-Bold').fillColor('#003366');
        doc.text(`${item.percentage}%`, 70 + motorNameWidth, itemStartY, {
          width: 50,
          align: 'left'
        });
        doc.fillColor('#000000');
        
        // Ajouter un espacement plus important entre les éléments de la liste
        doc.moveDown(1.2);
      });
    }
    
    // Finaliser le PDF
    doc.end();
    
    // Supprimer l'image temporaire après avoir généré le PDF
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Erreur lors de la suppression de l\'image temporaire:', err);
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF avec image:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF avec image' });
  }
});

module.exports = router;
