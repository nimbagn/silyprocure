# 🧪 Guide de Test - Création de RFQ

## ✅ Corrections appliquées

1. ✅ Champ `reference` ajouté dans les lignes
2. ✅ Gestion des erreurs améliorée
3. ✅ Validation ajoutée (au moins une ligne requise)
4. ✅ Erreur JavaScript corrigée (variable `descriptions` dupliquée)

## 📋 Étapes pour tester la création de RFQ

### Étape 1 : Informations générales

1. Accédez à `http://localhost:3000/rfq-create.html`
2. Vérifiez que le numéro RFQ est généré automatiquement
3. Les dates d'émission et limite de réponse sont pré-remplies
4. Remplissez :
   - **Description de la demande** : "Test de création RFQ - Matériel informatique"
   - Catégorie (optionnel)
   - Projet (optionnel)
   - Centre de coût (optionnel)
5. Cliquez sur **"Suivant : Rechercher des fournisseurs →"**

### Étape 2 : Recherche de fournisseurs

1. La liste des fournisseurs devrait se charger automatiquement
2. Si nécessaire, utilisez la barre de recherche
3. **Sélectionnez au moins un fournisseur** en cliquant sur sa carte
   - La carte devrait se mettre en surbrillance avec une bordure bleue
   - Une coche (✓) devrait apparaître
4. Vérifiez que le compteur "Fournisseurs sélectionnés" s'incrémente
5. Cliquez sur **"Suivant : Détails produits →"**

### Étape 3 : Produits/Services demandés

1. Une ligne de produit est déjà présente par défaut
2. Remplissez :
   - **Description** : "Ordinateur portable Dell"
   - **Quantité** : 5
   - **Unité** : "unité" (déjà rempli)
   - **Produit** (optionnel) : Sélectionnez un produit si disponible
   - **Spécifications techniques** (optionnel) : "Intel i7, 16GB RAM, SSD 512GB"
3. Si besoin, cliquez sur **"Ajouter une ligne"** pour ajouter d'autres produits
4. Cliquez sur **"Suivant : Conditions →"**

### Étape 4 : Conditions de livraison et paiement

1. **Adresse de livraison** :
   - Sélectionnez une adresse existante (si disponible)
   - Ou cliquez sur "Nouvelle adresse" (redirige vers entreprises)
2. **Dates et délais** :
   - Date de livraison souhaitée : déjà pré-remplie (30 jours)
   - Délai de livraison (jours) : optionnel
3. **Conditions commerciales** :
   - **Incoterms** (optionnel) : Sélectionnez un incoterm si nécessaire
   - **Conditions de paiement** : Sélectionnez une option (ex: "30 jours net")
4. **Informations complémentaires** (optionnel) :
   - Notes de livraison
   - Garanties demandées
5. Vérifiez le **Récapitulatif** :
   - Nombre de lignes
   - Nombre de fournisseurs sélectionnés
   - Date limite de réponse
6. Cliquez sur **"✨ Créer la RFQ"**

## ✅ Résultats attendus

### Succès
- Message de succès : "X RFQ créée(s) avec succès"
- Redirection automatique vers `rfq.html` après 1.5 secondes
- Les RFQ créées apparaissent dans la liste

### Erreurs possibles et solutions

1. **"Veuillez sélectionner au moins un fournisseur"**
   - **Solution** : Retournez à l'étape 2 et sélectionnez un fournisseur

2. **"Veuillez ajouter au moins une ligne de produit/service"**
   - **Solution** : Retournez à l'étape 3 et remplissez au moins une ligne

3. **"Veuillez remplir tous les champs obligatoires"**
   - **Solution** : Vérifiez que tous les champs marqués d'un * sont remplis

4. **Erreur serveur (500)**
   - **Solution** : Vérifiez la console du navigateur (F12) pour les détails
   - Vérifiez que le serveur backend est en cours d'exécution
   - Vérifiez les logs du serveur

## 🔍 Vérifications supplémentaires

### Dans la console du navigateur (F12)

1. **Pas d'erreurs JavaScript** :
   - ✅ Pas d'erreur "Identifier 'descriptions' has already been declared"
   - ✅ Pas d'erreur "Cannot read properties of null"

2. **Appels API réussis** :
   - ✅ `GET /api/rfq/generate-number` : 200 OK
   - ✅ `GET /api/entreprises?type=fournisseur` : 200 OK
   - ✅ `GET /api/produits?limit=1000` : 200 OK
   - ✅ `POST /api/rfq` : 201 Created

### Dans la base de données

1. Vérifiez que la RFQ est créée :
   ```sql
   SELECT * FROM rfq ORDER BY id DESC LIMIT 1;
   ```

2. Vérifiez que les lignes sont créées :
   ```sql
   SELECT * FROM rfq_lignes WHERE rfq_id = [ID_DE_LA_RFQ];
   ```

3. Vérifiez que le champ `reference` est présent dans les lignes

## 📝 Notes

- Si vous créez une RFQ pour plusieurs fournisseurs, une RFQ séparée sera créée pour chacun
- Le statut initial de la RFQ est "brouillon"
- Le numéro RFQ est généré automatiquement si non fourni

## 🐛 Problèmes connus et solutions

### Problème : Les fournisseurs ne s'affichent pas
- **Solution** : Vérifiez que l'API `/api/entreprises?type=fournisseur` retourne des données
- Vérifiez la console pour les erreurs réseau

### Problème : Les produits ne se chargent pas
- **Solution** : Vérifiez que l'API `/api/produits?limit=1000` fonctionne
- Vérifiez que la pagination est correctement gérée

### Problème : Erreur lors de la soumission
- **Solution** : Ouvrez la console (F12) et vérifiez les erreurs
- Vérifiez que tous les champs requis sont remplis
- Vérifiez que le serveur backend est accessible

---

**Date de création** : 11 décembre 2025  
**Statut** : ✅ Prêt pour test

