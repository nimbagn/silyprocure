# Guide de Test : Envoyer la demande de Boubacar à un fournisseur

## ✅ Vérifications préalables

### 1. Serveur backend démarré
```bash
cd backend
npm start
```
Le serveur doit être accessible sur `http://localhost:3000`

### 2. Base de données accessible
- MySQL doit être démarré
- Les tables `demandes_devis`, `demandes_devis_lignes`, `entreprises`, `rfq` doivent exister

## 📋 Étapes de test

### Étape 1 : Accéder à la page des demandes de devis
1. Ouvrir le navigateur
2. Aller sur `http://localhost:3000/demandes-devis.html`
3. Se connecter avec un compte admin ou superviseur

### Étape 2 : Trouver la demande de Boubacar
1. Dans la liste des demandes, rechercher "Boubacar"
2. Si la demande n'apparaît pas, vérifier :
   - Le nom exact dans la base de données
   - Le statut de la demande (doit être "nouvelle" ou "en_cours" pour voir le bouton RFQ)

### Étape 3 : Ouvrir les détails de la demande
1. Cliquer sur la demande de Boubacar dans la liste
2. Les détails doivent s'afficher dans le panneau de droite

### Étape 4 : Lancer la création de RFQ
1. Cliquer sur le bouton **"Lancer RFQ"** ou **"Créer des RFQ depuis cette demande"**
2. Le modal `createRFQModal` doit s'ouvrir
3. **Vérifier dans la console du navigateur (F12)** :
   - `🔵 [RFQ] ========== openCreateRFQModal APPELÉE ==========`
   - `🔵 [RFQ] Appel API: /api/entreprises?type=fournisseur&limit=1000`

### Étape 5 : Vérifier le chargement des fournisseurs
1. Dans le modal, la section "Sélectionner les fournisseurs" doit afficher :
   - Soit la liste des fournisseurs avec des checkboxes
   - Soit "Chargement des fournisseurs..." (si en cours)
   - Soit "Aucun fournisseur disponible" (si aucun fournisseur)
2. **Vérifier dans la console** :
   - `🔵 [RFQ] Fournisseurs reçus: { isArray: true, length: X }`
   - `🔵 [RFQ] HTML généré et inséré`

### Étape 6 : Sélectionner un fournisseur
1. Cocher au moins un fournisseur dans la liste
2. Remplir les champs optionnels :
   - Date limite de réponse
   - Date de livraison souhaitée
   - Incoterms
   - Conditions de paiement

### Étape 7 : Créer les RFQ
1. Cliquer sur le bouton **"Créer les RFQ"**
2. **Vérifier dans la console** :
   - `🔵 submitCreateRFQ appelée, currentDemandeId: X`
3. **Vérifier dans les logs serveur** :
   - `POST /api/contact/demandes/:id/create-rfq`
   - `RFQ créées avec succès`

### Étape 8 : Vérifier le résultat
1. Un message de succès doit s'afficher : "X RFQ créée(s) avec succès"
2. Le modal doit se fermer
3. La liste des demandes doit se rafraîchir
4. Les RFQ créées doivent être visibles dans la page RFQ (`http://localhost:3000/rfq.html`)

## 🔍 Dépannage

### Problème : Les fournisseurs ne s'affichent pas
**Vérifications :**
1. Console navigateur : Vérifier les logs `🔵 [RFQ]`
2. Console serveur : Vérifier `🔵 GET /api/entreprises - Type demandé: fournisseur`
3. Vérifier qu'il y a des entreprises avec `type_entreprise = 'fournisseur'` dans la base

**Solutions :**
- Vérifier que le serveur backend est démarré
- Vérifier la connexion à la base de données
- Vérifier que des fournisseurs existent dans la table `entreprises`

### Problème : Le bouton "Lancer RFQ" ne fonctionne pas
**Vérifications :**
1. Console navigateur : Vérifier `🔵 [RFQ] Script demandes-devis.js chargé. openCreateRFQModal disponible: function`
2. Vérifier que le statut de la demande est "nouvelle" ou "en_cours"

**Solutions :**
- Recharger la page (Ctrl+F5)
- Vérifier que le script `demandes-devis.js` est bien chargé
- Vérifier que la fonction `window.openCreateRFQModal` est bien définie

### Problème : Erreur lors de la création RFQ
**Vérifications :**
1. Console navigateur : Vérifier les erreurs
2. Console serveur : Vérifier les logs d'erreur SQL

**Solutions :**
- Vérifier que la demande contient des articles (`demandes_devis_lignes`)
- Vérifier que les fournisseurs sélectionnés existent
- Vérifier les permissions (admin ou superviseur requis)

## 📊 Logs à surveiller

### Console navigateur (F12)
```
🔵 [RFQ] ========== openCreateRFQModal APPELÉE ==========
🔵 [RFQ] Appel API: /api/entreprises?type=fournisseur&limit=1000
🔵 [RFQ] Fournisseurs reçus: { isArray: true, length: X }
🔵 submitCreateRFQ appelée, currentDemandeId: X
```

### Console serveur
```
🔵 GET /api/entreprises - Type demandé: fournisseur
🔵 GET /api/entreprises - Résultat: X entreprises
POST /api/contact/demandes/:id/create-rfq
RFQ créées avec succès
```

## ✅ Checklist finale

- [ ] Serveur backend démarré
- [ ] Page demandes-devis.html accessible
- [ ] Demande de Boubacar trouvée
- [ ] Bouton "Lancer RFQ" visible et cliquable
- [ ] Modal s'ouvre correctement
- [ ] Liste des fournisseurs se charge
- [ ] Au moins un fournisseur sélectionné
- [ ] RFQ créée avec succès
- [ ] Message de succès affiché
- [ ] RFQ visible dans la page RFQ

