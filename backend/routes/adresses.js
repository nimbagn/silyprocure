const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateAdresse, validateId } = require('../middleware/validation');
const router = express.Router();

// Utiliser fetch natif (Node.js 18+) ou require node-fetch pour versions antérieures
const fetch = globalThis.fetch || require('node-fetch');

router.use(authenticate);

// IMPORTANT: Les routes spécifiques (comme /geocode) doivent être définies AVANT les routes paramétrées (comme /:id)
// Géocoder une adresse (utiliser un service externe)
router.post('/geocode', async (req, res) => {
    try {
        const { adresse, ville, pays } = req.body;
        const query = `${adresse}, ${ville}, ${pays || 'Guinée'}`;
        
        // Utiliser Nominatim (OpenStreetMap) pour le géocodage
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'SilyProcure/1.0'
                }
            }
        );

        const data = await response.json();
        
        if (data && data.length > 0) {
            res.json({
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                display_name: data[0].display_name
            });
        } else {
            res.status(404).json({ error: 'Adresse non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Récupérer les adresses (avec filtres optionnels)
router.get('/', async (req, res) => {
    try {
        const { type, entreprise_id } = req.query;
        let query = 'SELECT * FROM adresses WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type_adresse = ?';
            params.push(type);
        }

        if (entreprise_id) {
            query += ' AND entreprise_id = ?';
            params.push(entreprise_id);
        }

        query += ' ORDER BY principal DESC, date_creation DESC';

        const [adresses] = await pool.execute(query, params);
        res.json(adresses);
    } catch (error) {
        console.error('Erreur récupération adresses:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer une adresse par ID
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [adresses] = await pool.execute('SELECT * FROM adresses WHERE id = ?', [id]);
        
        if (adresses.length === 0) {
            return res.status(404).json({ error: 'Adresse non trouvée' });
        }

        res.json(adresses[0]);
    } catch (error) {
        console.error('Erreur récupération adresse:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer une adresse avec géolocalisation
router.post('/', validateAdresse, async (req, res) => {
    try {
        const {
            entreprise_id, type_adresse, libelle, adresse_ligne1, adresse_ligne2,
            code_postal, ville, pays, latitude, longitude, notes_geolocalisation, principal
        } = req.body;

        // Validation : au moins une adresse ligne 1, une ville OU des coordonnées GPS doivent être fournies
        // Nettoyer d'abord les valeurs
        let finalAdresseLigne1 = (adresse_ligne1 && adresse_ligne1.trim()) || null;
        let finalVille = (ville && ville.trim()) || null;
        
        // Vérifier les coordonnées GPS avant de valider
        let hasCoordinates = false;
        if (latitude !== undefined && latitude !== null && latitude !== '') {
            const latStr = String(latitude).replace(',', '.');
            const latNum = parseFloat(latStr);
            if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
                hasCoordinates = true;
            }
        }
        if (longitude !== undefined && longitude !== null && longitude !== '') {
            const lngStr = String(longitude).replace(',', '.');
            const lngNum = parseFloat(lngStr);
            if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
                hasCoordinates = hasCoordinates || true;
            }
        }
        
        // Validation : au moins une adresse ligne 1, une ville OU des coordonnées GPS doivent être fournies
        if (!finalAdresseLigne1 && !finalVille && !hasCoordinates) {
            return res.status(400).json({ 
                error: 'Au moins l\'adresse ligne 1, la ville ou les coordonnées GPS doivent être fournies' 
            });
        }

        // Nettoyer et valider les coordonnées GPS (gérer virgule et point)
        let latValue = null;
        let lngValue = null;

        if (latitude !== undefined && latitude !== null && latitude !== '') {
            const latStr = String(latitude).replace(',', '.');
            const latNum = parseFloat(latStr);
            if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
                latValue = latNum;
            } else {
                return res.status(400).json({ 
                    error: `Latitude invalide: ${latitude}. Doit être un nombre entre -90 et 90.` 
                });
            }
        }

        if (longitude !== undefined && longitude !== null && longitude !== '') {
            const lngStr = String(longitude).replace(',', '.');
            const lngNum = parseFloat(lngStr);
            if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
                lngValue = lngNum;
            } else {
                return res.status(400).json({ 
                    error: `Longitude invalide: ${longitude}. Doit être un nombre entre -180 et 180.` 
                });
            }
        }

        // Préparer les valeurs pour l'insertion
        // code_postal peut être NULL, mais adresse_ligne1 ou ville doit être fourni
        const finalAdresseLigne1 = (adresse_ligne1 && adresse_ligne1.trim()) || null;
        const finalVille = (ville && ville.trim()) || null;
        const finalCodePostal = (code_postal && code_postal.trim()) || null;

        const [result] = await pool.execute(
            `INSERT INTO adresses (entreprise_id, type_adresse, libelle, adresse_ligne1, adresse_ligne2,
             code_postal, ville, pays, latitude, longitude, notes_geolocalisation, principal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                entreprise_id, type_adresse || 'siege', libelle || null, finalAdresseLigne1,
                (adresse_ligne2 && adresse_ligne2.trim()) || null, finalCodePostal, finalVille, pays || 'Guinée',
                latValue, lngValue, notes_geolocalisation || null,
                principal || false
            ]
        );

        res.status(201).json({ id: result.insertId, message: 'Adresse créée avec succès' });
    } catch (error) {
        console.error('Erreur création adresse:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour une adresse
router.put('/:id', validateId, validateAdresse, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            type_adresse, libelle, adresse_ligne1, adresse_ligne2,
            code_postal, ville, pays, latitude, longitude, notes_geolocalisation, principal
        } = req.body;

        // Validation : au moins une adresse ligne 1 ou une ville doit être fournie
        const finalAdresseLigne1 = (adresse_ligne1 && adresse_ligne1.trim()) || null;
        const finalVille = (ville && ville.trim()) || null;
        
        if (!finalAdresseLigne1 && !finalVille) {
            return res.status(400).json({ 
                error: 'Au moins l\'adresse ligne 1 ou la ville doit être fournie' 
            });
        }

        // Nettoyer et valider les coordonnées GPS
        let latValue = null;
        let lngValue = null;

        if (latitude !== undefined && latitude !== null && latitude !== '') {
            const latStr = String(latitude).replace(',', '.');
            const latNum = parseFloat(latStr);
            if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
                latValue = latNum;
            }
        }

        if (longitude !== undefined && longitude !== null && longitude !== '') {
            const lngStr = String(longitude).replace(',', '.');
            const lngNum = parseFloat(lngStr);
            if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
                lngValue = lngNum;
            }
        }

        const finalCodePostal = (code_postal && code_postal.trim()) || null;

        await pool.execute(
            `UPDATE adresses SET type_adresse = ?, libelle = ?, adresse_ligne1 = ?, adresse_ligne2 = ?,
             code_postal = ?, ville = ?, pays = ?, latitude = ?, longitude = ?, notes_geolocalisation = ?, principal = ?
             WHERE id = ?`,
            [
                type_adresse || 'siege', libelle || null, finalAdresseLigne1, 
                (adresse_ligne2 && adresse_ligne2.trim()) || null,
                finalCodePostal, finalVille, pays || 'Guinée', 
                latValue, lngValue, notes_geolocalisation || null, principal || false, id
            ]
        );

        res.json({ message: 'Adresse mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour adresse:', error);
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une adresse
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM adresses WHERE id = ?', [id]);
        res.json({ message: 'Adresse supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

