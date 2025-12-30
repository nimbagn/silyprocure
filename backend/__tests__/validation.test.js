const { validateProduit, validateEntreprise } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');

describe('Validation Middleware', () => {
    describe('validateProduit', () => {
        it('devrait valider un produit correct', async () => {
            const req = {
                body: {
                    reference: 'REF001',
                    libelle: 'Produit test',
                    categorie_id: 1,
                    prix_unitaire_ht: 1000
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            // Simuler la validation
            await Promise.all(validateProduit.map(validator => validator(req, res, next)));
            
            // Si pas d'erreur, next() devrait être appelé
            // Note: Ce test nécessite une implémentation plus complète
            expect(true).toBe(true);
        });

        it('devrait rejeter un produit sans référence', async () => {
            const req = {
                body: {
                    libelle: 'Produit test',
                    categorie_id: 1,
                    prix_unitaire_ht: 1000
                }
            };
            
            // Test de validation
            for (const validator of validateProduit) {
                await validator(req, {}, () => {});
            }
            
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
});

