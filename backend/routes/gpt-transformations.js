const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const OpenAI = require('openai');
const { normalizeCustomsCode } = require('../utils/customsCodeUtils');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'douane_db',  // Nom du service Docker
    database: process.env.DB_NAME || 'douane',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function extractCustomsCode(text) {
    const match = text.match(/(\d+(?:\.\d+)*)/);
    return match ? match[1] : null;
}

async function estimateCustomsCode(description) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Tu es un expert en codes douaniers. Pour la transformation décrite, fournis le code douanier le plus approprié avec une brève explication de ton choix. Indique aussi les alternatives possibles si pertinent. IMPORTANT: Commence TOUJOURS ta réponse par le code douanier principal (format numérique uniquement, exemple: 3301.29) sur une ligne, puis ton explication détaillée sur les lignes suivantes."
            }, {
                role: "user",
                content: `Quel est le code douanier pour cette transformation : ${description}?`
            }],
            temperature: 0.7,
            max_tokens: 250
        });
        const fullResponse = completion.choices[0].message.content.trim();
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
        // Récupérer toutes les transformations sans code douanier
        const result = await pool.query(`
            SELECT t.*, f.nom as fournisseur_nom, mp.nom as matiere_premiere_nom 
            FROM transformations t 
            LEFT JOIN fournisseurs f ON t.fournisseur_id = f.id
            LEFT JOIN matieres_premieres mp ON t.matiere_premiere_id = mp.id
            WHERE t.code_douanier IS NULL OR t.code_douanier = ''
        `);
        const transformations = result.rows;
        let updatedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        if (transformations.length === 0) {
            return res.json({ 
                success: true, 
                message: 'Toutes les transformations ont déjà un code douanier',
                updatedCount: 0,
                errorCount: 0,
                skippedCount: 0
            });
        }

        // Pour chaque transformation, obtenir une estimation
        for (const transformation of transformations) {
            const description = `Nom: ${transformation.nom}
Matière première d'origine: ${transformation.matiere_premiere_nom || 'Non spécifiée'}
Description: ${transformation.description || 'Non spécifiée'}
Origine: ${transformation.origine || 'Non spécifiée'}`;

            try {
                const { mainCode, fullResponse } = await estimateCustomsCode(description);
                if (mainCode) {
                    await pool.query(
                        'UPDATE transformations SET code_douanier = $1, code_douanier_gpt = $2 WHERE id = $3',
                        [mainCode, fullResponse, transformation.id]
                    );
                    updatedCount++;
                } else {
                    errorCount++;
                    console.error(`Pas de code douanier valide extrait pour la transformation ${transformation.id}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`Erreur pour la transformation ${transformation.id}:`, error);
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

module.exports = router;
