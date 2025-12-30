# 🧪 Guide de Test - Création RFQ depuis Demande Client

## 📋 Prérequis

1. **Serveur en cours d'exécution**
   ```bash
   cd /Users/dantawi/Documents/SilyProcure
   node backend/server.js
   ```

2. **Migration SQL exécutée**
   ```bash
   node database/run_migration_demande_devis_links.js
   ```
   
   Ou manuellement dans MySQL :
   ```sql
   -- Ajouter demande_devis_id dans devis
   ALTER TABLE devis 
   ADD COLUMN IF NOT EXISTS demande_devis_id INT NULL 
   AFTER rfq_id;
   
   ALTER TABLE devis 
   ADD INDEX IF NOT EXISTS idx_demande_devis_id (demande_devis_id);
   
   ALTER TABLE devis 
   ADD CONSTRAINT fk_devis_demande_devis 
   FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;
   
   -- Ajouter demande_devis_id dans commandes
   ALTER TABLE commandes 
   ADD COLUMN IF NOT EXISTS demande_devis_id INT NULL 
   AFTER devis_id;
   
   ALTER TABLE commandes 
   ADD INDEX IF NOT EXISTS idx_commande_demande_devis_id (demande_devis_id);
   
   ALTER TABLE commandes 
   ADD CONSTRAINT fk_commande_demande_devis 
   FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;
   ```

3. **Compte admin connecté**
   - Email : `admin@silyprocure.com`
   - Mot de passe : `admin123` (ou celui configuré)

---

## 🧪 Scénario de Test Complet

### Étape 1 : Créer une demande de devis (client)

1. Ouvrir : `http://localhost:3000/`
2. Cliquer sur **"Demander un devis"**
3. Remplir le formulaire :
   - Nom : `Test Client`
   - Email : `test@example.com`
   - Téléphone : `+224 XXX XXX XXX`
   - Entreprise : `Test Entreprise`
   - Mode de notification : `Email`
   - Ajouter au moins 2 articles :
     - Article 1 : `Ordinateur portable`, Secteur : `Informatique`, Quantité : `5`, Unité : `unité`
     - Article 2 : `Souris sans fil`, Secteur : `Informatique`, Quantité : `10`, Unité : `unité`
   - Adresse de livraison : `123 Rue Test, Conakry`
   - Ville : `Conakry`
   - Pays : `Guinée`
4. Cliquer sur **"Envoyer la demande de devis"**
5. **Vérifier** : Message de succès avec référence (ex: `DEV-XXXXX-XXXXX`)

---

### Étape 2 : Voir la demande dans l'interface admin

1. Se connecter en tant qu'admin : `http://localhost:3000/index.html`
2. Aller dans **"Demandes Devis"** (menu de navigation)
3. **Vérifier** : La demande apparaît dans la liste avec statut "Nouvelle"
4. Cliquer sur le bouton **👁️ Voir** pour ouvrir les détails

---

### Étape 3 : Créer des RFQ depuis la demande

1. Dans le modal de détails de la demande, cliquer sur **"Créer des RFQ depuis cette demande"**
2. **Vérifier** : Le modal "Créer des RFQ" s'ouvre
3. **Vérifier** : La liste des fournisseurs s'affiche avec checkboxes
4. Sélectionner **au moins 2 fournisseurs** (cocher les cases)
5. Remplir les champs optionnels :
   - Date limite de réponse : `2024-12-31`
   - Date de livraison souhaitée : `2025-01-15`
   - Incoterms : `DDP`
   - Conditions de paiement : `30% à la commande, 70% à la livraison`
6. Cliquer sur **"Créer les RFQ"**
7. **Vérifier** :
   - Message de succès : "X RFQ créée(s) avec succès"
   - Le modal se ferme
   - Le statut de la demande passe à "En cours"

---

### Étape 4 : Vérifier les RFQ créées

1. Aller dans **"RFQ"** (menu de navigation)
2. **Vérifier** : Les nouvelles RFQ apparaissent dans la liste
3. Pour chaque RFQ créée :
   - Cliquer sur **👁️ Voir** pour ouvrir les détails
   - **Vérifier** :
     - Le numéro RFQ est généré (format : `RFQ-2024-XXXX`)
     - Le fournisseur correspond à celui sélectionné
     - Les lignes de la RFQ correspondent aux articles de la demande :
       - Ligne 1 : `Ordinateur portable`, Quantité : `5`, Unité : `unité`
       - Ligne 2 : `Souris sans fil`, Quantité : `10`, Unité : `unité`
     - Les spécifications contiennent le secteur (ex: `Secteur: Informatique`)
     - Le statut est "Brouillon"
     - La description contient les infos du client

---

### Étape 5 : Vérifier dans la base de données (optionnel)

```sql
-- Vérifier les RFQ créées
SELECT r.id, r.numero, r.destinataire_id, e.nom as fournisseur_nom, r.statut
FROM rfq r
LEFT JOIN entreprises e ON r.destinataire_id = e.id
ORDER BY r.id DESC
LIMIT 5;

-- Vérifier les lignes RFQ
SELECT rl.*, r.numero as rfq_numero
FROM rfq_lignes rl
LEFT JOIN rfq r ON rl.rfq_id = r.id
WHERE r.numero LIKE 'RFQ-2024-%'
ORDER BY r.id DESC, rl.ordre;

-- Vérifier le statut de la demande
SELECT id, nom, email, statut, date_modification
FROM demandes_devis
WHERE email = 'test@example.com'
ORDER BY id DESC
LIMIT 1;
```

---

## ✅ Checklist de Validation

- [ ] La demande client est créée avec succès
- [ ] La demande apparaît dans l'interface admin
- [ ] Le bouton "Créer des RFQ" est visible dans le modal de détails
- [ ] Le modal de création RFQ s'ouvre correctement
- [ ] La liste des fournisseurs se charge
- [ ] La sélection multiple de fournisseurs fonctionne
- [ ] Les RFQ sont créées avec succès (une par fournisseur)
- [ ] Les lignes RFQ correspondent aux articles de la demande
- [ ] Le statut de la demande passe à "En cours"
- [ ] Les RFQ créées sont visibles dans la liste RFQ
- [ ] Les détails de chaque RFQ sont corrects

---

## 🐛 Problèmes Potentiels et Solutions

### Problème 1 : Migration SQL échoue
**Solution** : Exécuter manuellement les commandes SQL dans MySQL Workbench ou phpMyAdmin

### Problème 2 : "Aucun fournisseur disponible"
**Solution** : 
- Vérifier qu'il existe des entreprises de type "fournisseur" dans la base
- Aller dans "Entreprises" et créer un fournisseur si nécessaire

### Problème 3 : Erreur "ID demande manquant"
**Solution** : 
- Vérifier que `currentDemandeId` est bien défini
- Recharger la page et réessayer

### Problème 4 : Les RFQ ne sont pas créées
**Solution** :
- Vérifier les logs du serveur (`/tmp/silyprocure.log` ou console)
- Vérifier que la route `/api/contact/demandes/:id/create-rfq` est bien enregistrée
- Vérifier les permissions de l'utilisateur (doit être admin ou superviseur)

### Problème 5 : Les lignes RFQ sont vides
**Solution** :
- Vérifier que la demande contient bien des articles
- Vérifier dans la base : `SELECT * FROM demandes_devis_lignes WHERE demande_devis_id = X`

---

## 📝 Notes

- Les RFQ créées sont en statut "Brouillon" par défaut
- L'admin doit ensuite les envoyer manuellement aux fournisseurs
- Chaque fournisseur reçoit une RFQ séparée avec les mêmes articles
- Le lien entre demande et RFQ n'est pas encore stocké (sera ajouté dans une prochaine version)

---

## 🎯 Prochaines Étapes Après Test

Une fois le test validé, nous pourrons implémenter :
1. Création devis consolidé pour le client
2. Notifications client
3. Lien explicite demande → devis → commande dans les interfaces

