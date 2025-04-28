const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const OpenAI = require('openai');
const { normalizeCustomsCode } = require('../utils/customsCodeUtils');

// Configuration de la connexion à la base de données
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'douane_db',  // Nom du service Docker
    database: process.env.DB_NAME || 'douane',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432
});

// Test de connexion
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données réussie');
        release();
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function extractCustomsCode(text) {
    // Recherche un motif de code douanier (séquence de chiffres possiblement séparés par des points)
    const match = text.match(/(\d+(?:\.\d+)*)/);
    return match ? match[1] : null;
}

async function estimateCustomsCode(description) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Tu es un expert en codes douaniers. Pour le produit décrit, fournis le code douanier le plus approprié avec une brève explication de ton choix. Indique aussi les alternatives possibles si pertinent. IMPORTANT: Commence TOUJOURS ta réponse par le code douanier principal (format numérique uniquement, exemple: 3301.29) sur une ligne, puis ton explication détaillée sur les lignes suivantes."
            }, {
                role: "user",
                content: `Quel est le code douanier pour : ${description}?`
            }],
            temperature: 0.7,
            max_tokens: 250
        });
        const fullResponse = completion.choices[0].message.content.trim();
        // Extraire le code douanier (première ligne) et nettoyer pour n'avoir que le code numérique
        const [firstLine, ...explanationParts] = fullResponse.split('\n');
        const extractedCode = extractCustomsCode(firstLine);
        const mainCode = extractedCode ? normalizeCustomsCode(extractedCode) : null;
        
        if (!mainCode) {
            console.warn(`Impossible d'extraire un code douanier valide de la réponse pour: ${description}`);
            return {
                mainCode: null,
                fullResponse: fullResponse
            };
        }

        return {
            mainCode,
            fullResponse: fullResponse
        };
    } catch (error) {
        console.error('Erreur OpenAI:', error);
        throw error;
    }
}

router.post('/estimate-customs-codes', async (req, res) => {
    try {
        // Récupérer toutes les matières premières sans code douanier
        const result = await pool.query(`
            SELECT id, nom, type, matiere_premiere_source 
            FROM matieres_premieres 
            WHERE code_douanier IS NULL OR code_douanier = ''
        `);
        const matieres = result.rows;
        let updatedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        if (matieres.length === 0) {
            return res.json({ 
                success: true, 
                message: 'Toutes les matières premières ont déjà un code douanier',
                updatedCount: 0,
                errorCount: 0,
                skippedCount: 0
            });
        }

        // Pour chaque matière, obtenir une estimation et mettre à jour la base
        for (const matiere of matieres) {
            const description = `${matiere.nom} - Type: ${matiere.type}${matiere.matiere_premiere_source ? ' - Source: ' + matiere.matiere_premiere_source : ''}`;
            try {
                const { mainCode, fullResponse } = await estimateCustomsCode(description);
                if (mainCode) {
                    await pool.query(
                        'UPDATE matieres_premieres SET code_douanier = $1, code_douanier_gpt = $2 WHERE id = $3',
                        [mainCode, fullResponse, matiere.id]
                    );
                    updatedCount++;
                } else {
                    errorCount++;
                    console.error(`Pas de code douanier valide extrait pour la matière ${matiere.id}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`Erreur pour la matière ${matiere.id}:`, error);
            }
        }

        res.json({ 
            success: true,
            message: `Estimation terminée. ${updatedCount} codes mis à jour, ${errorCount} erreurs, ${skippedCount} ignorés.`,
            updatedCount,
            errorCount,
            skippedCount
        });
    } catch (error) {
        console.error('Erreur lors de l\'estimation des codes douaniers:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'estimation des codes douaniers',
            details: error.message
        });
    }
});

// Route pour mettre à jour uniquement le code douanier d'une matière première
router.put('/matieres-premieres/:id/code-douanier', async (req, res) => {
    const { id } = req.params;
    const { code_douanier } = req.body;
    if (!code_douanier) {
        return res.status(400).json({ 
            success: false, 
            message: 'Le code douanier est requis'
        });
    }

    try {
        // Normaliser le code douanier
        const normalizedCode = normalizeCustomsCode(code_douanier);

        const result = await pool.query(
            'UPDATE matieres_premieres SET code_douanier = $1 WHERE id = $2 RETURNING *',
            [normalizedCode, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Matière première non trouvée'
            });
        }

        res.json({ 
            success: true, 
            message: 'Code douanier mis à jour avec succès',
            matiere_premiere: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du code douanier:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du code douanier',
            error: error.message
        });
    }
});

// Route pour l'analyse par raisonnement des résultats des moteurs de recherche
router.post('/reasoning-analysis', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Le prompt est requis' });
        }
        
        // Appel à l'API OpenAI pour l'analyse par raisonnement
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Utilisation du modèle le plus récent pour une meilleure analyse
            messages: [{
                role: "system",
                content: `Tu es un expert en codes douaniers qui analyse les résultats de différents moteurs de recherche. Ta mission est d'évaluer la fiabilité de chaque réponse et de fournir une analyse détaillée et structurée.

Pour ton analyse, suis cette structure précise :

1. **Évaluation détaillée de chaque moteur** :
   - Pour chaque moteur, donne un pourcentage de fiabilité (sur 100%)
   - Justifie ton évaluation en détail en te basant sur :
     * La précision du code douanier proposé
     * La pertinence de l'explication fournie
     * La cohérence avec la description du produit
     * La conformité aux règles de classification douanière

2. **Analyse comparative** :
   - Compare les résultats des différents moteurs entre eux
   - Identifie les points de convergence et de divergence
   - Explique pourquoi certains moteurs ont mieux performé que d'autres

3. **Suggestion optimale** :
   - Propose le code douanier que tu considères comme le plus approprié (qu'il soit issu d'un des moteurs ou que ce soit ta propre suggestion)
   - Attribue un pourcentage de fiabilité à ta suggestion
   - Explique en détail pourquoi ce code est le plus approprié en citant :
     * Les règles générales d'interprétation
     * Les notes de section ou de chapitre pertinentes
     * Les caractéristiques du produit qui justifient cette classification

4. **Recommandations pour l'utilisateur** :
   - Suggère des informations supplémentaires qui pourraient affiner la classification
   - Mentionne d'éventuelles précautions ou alternatives à considérer

Utilise un langage précis, technique mais accessible, et structure clairement ta réponse avec des titres et sous-titres.`
            }, {
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 2000  // Augmentation du nombre de tokens pour permettre une réponse plus détaillée
        });
        
        const analysis = completion.choices[0].message.content.trim();
        
        // Enregistrer l'analyse dans la base de données pour référence future (optionnel)
        // await pool.query(
        //     'INSERT INTO reasoning_analyses (prompt, analysis, created_at) VALUES ($1, $2, NOW())',
        //     [prompt, analysis]
        // );
        
        return res.json({ success: true, analysis });
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse par raisonnement:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de l\'analyse par raisonnement', 
            details: error.message 
        });
    }
});

module.exports = router;
