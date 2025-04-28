const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
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

// ... autres routes existantes ...

// Route pour mettre à jour le code douanier d'une transformation
router.put('/:id/code-douanier', async (req, res) => {
    const { id } = req.params;
    const { code_douanier } = req.body;

    console.log('Mise à jour du code douanier de la transformation:', { id, code_douanier, body: req.body });

    if (!code_douanier) {
        return res.status(400).json({
            success: false,
            message: 'Le code douanier est requis'
        });
    }

    try {
        // Normaliser le code douanier
        const normalizedCode = normalizeCustomsCode(code_douanier);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                'UPDATE transformations SET code_douanier = $1 WHERE id = $2 RETURNING *',
                [normalizedCode, id]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                console.log('Transformation non trouvée:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Transformation non trouvée'
                });
            }

            await client.query('COMMIT');
            console.log('Mise à jour réussie:', result.rows[0]);
            res.json({
                success: true,
                message: 'Code douanier mis à jour avec succès',
                transformation: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erreur détaillée lors de la mise à jour du code douanier:', {
                error: error.message,
                stack: error.stack,
                params: req.params,
                body: req.body
            });
            res.status(500).json({
                success: false,
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du code douanier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du code douanier',
            error: error.message
        });
    }
});

// Route pour récupérer les transformations d'une matière première
router.get('/matiere/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        console.log('Récupération des transformations pour la matière première:', id);

        const result = await client.query(
            'SELECT * FROM transformations WHERE matiere_premiere_id = $1 ORDER BY id',
            [id]
        );

        console.log(`${result.rows.length} transformations trouvées pour la matière première ${id}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des transformations:', {
            error: error.message,
            stack: error.stack,
            params: req.params
        });
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        client.release();
    }
});

module.exports = router;
