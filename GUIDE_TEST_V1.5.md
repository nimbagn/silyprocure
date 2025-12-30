# 🧪 Guide de Test - SilyProcure v1.5

## ✅ Fonctionnalités à tester

### 1. 📎 Upload de fichiers joints

#### Test sur RFQ (`rfq-detail.html`)
1. Ouvrir une RFQ : http://localhost:3000/rfq-detail.html?id=X
2. Scroller jusqu'à la section "Fichiers joints"
3. Cliquer sur "Ajouter un fichier"
4. Sélectionner un fichier (PDF, image, Excel, etc.)
5. Ajouter une description (optionnel)
6. Cliquer sur "Uploader"
7. Vérifier que le fichier apparaît dans la liste
8. Tester le téléchargement
9. Tester la suppression

#### Test sur Devis (`devis-detail.html`)
1. Ouvrir un devis : http://localhost:3000/devis-detail.html?id=X
2. Vérifier la section "Fichiers joints" en bas de page
3. Tester l'ajout, téléchargement et suppression

#### Test sur Commandes (`commandes-detail.html`)
1. Ouvrir une commande : http://localhost:3000/commandes-detail.html?id=X
2. Vérifier la section "Fichiers joints" en bas de page
3. Tester l'ajout, téléchargement et suppression

#### Test sur Factures (`factures-detail.html`)
1. Ouvrir une facture : http://localhost:3000/factures-detail.html?id=X
2. Vérifier la section "Fichiers joints" en bas de page
3. Tester l'ajout, téléchargement et suppression

**Types de fichiers à tester :**
- ✅ Images (JPG, PNG, GIF)
- ✅ PDF
- ✅ Excel (.xlsx, .xls)
- ✅ Word (.doc, .docx)
- ✅ Texte (.txt, .csv)
- ✅ ZIP

**Limites :**
- Taille max : 50MB
- Types non autorisés doivent être rejetés

---

### 2. ✏️ Édition des lignes RFQ

#### Test complet
1. Ouvrir une RFQ en statut "brouillon" : http://localhost:3000/rfq-detail.html?id=X
2. Cliquer sur le bouton "Modifier"
3. Vérifier que le modal s'ouvre avec :
   - Les informations générales de la RFQ
   - La section "Lignes de la RFQ" avec les lignes existantes

#### Test modification de lignes existantes
1. Dans le modal d'édition, modifier :
   - Description d'une ligne
   - Quantité
   - Unité
   - Produit (sélectionner depuis le dropdown)
   - Référence
   - Spécifications techniques
2. Vérifier que les modifications sont sauvegardées

#### Test ajout de nouvelles lignes
1. Cliquer sur "Ajouter une ligne"
2. Remplir les champs :
   - Description *
   - Quantité *
   - Unité
   - Produit (optionnel)
   - Référence
   - Spécifications techniques
3. Vérifier que la ligne apparaît dans le formulaire
4. Ajouter plusieurs lignes
5. Enregistrer et vérifier que toutes les lignes sont sauvegardées

#### Test suppression de lignes
1. Cliquer sur le bouton "Supprimer" (icône poubelle) d'une ligne
2. Vérifier que la ligne disparaît
3. Supprimer toutes les lignes et vérifier le message "Aucune ligne"
4. Ajouter une nouvelle ligne après suppression
5. Enregistrer et vérifier

#### Test sélection de produits
1. Dans une ligne, cliquer sur le dropdown "Produit"
2. Vérifier que la liste des produits se charge
3. Sélectionner un produit
4. Vérifier que la référence se remplit automatiquement (si disponible)
5. Enregistrer et vérifier

#### Test validation
1. Essayer d'enregistrer sans description → doit afficher une erreur
2. Essayer d'enregistrer sans quantité → doit afficher une erreur
3. Essayer d'enregistrer avec quantité = 0 → doit afficher une erreur
4. Enregistrer avec toutes les données valides → doit réussir

---

### 3. 💰 Gestion des paiements (déjà testé précédemment)

#### Test rapide
1. Ouvrir une facture : http://localhost:3000/factures-detail.html?id=X
2. Vérifier la section "Historique des paiements"
3. Tester l'ajout, modification et suppression de paiements
4. Vérifier que les totaux se mettent à jour automatiquement

---

## 🐛 Points à vérifier

### Upload de fichiers
- [ ] Les fichiers s'uploadent correctement
- [ ] Les fichiers apparaissent dans la liste avec les bonnes informations
- [ ] Le téléchargement fonctionne
- [ ] La suppression fonctionne
- [ ] Les erreurs sont gérées (fichier trop gros, type non autorisé)
- [ ] Les fichiers sont organisés par type de document dans `/uploads/fichiers/`

### Édition des lignes RFQ
- [ ] Les lignes existantes se chargent correctement
- [ ] Les modifications sont sauvegardées
- [ ] Les nouvelles lignes sont ajoutées
- [ ] Les lignes supprimées sont retirées
- [ ] La sélection de produits fonctionne
- [ ] La référence se remplit automatiquement
- [ ] La validation fonctionne (champs requis)
- [ ] Le rechargement de la page affiche les modifications

---

## 📊 Checklist de test

### Upload de fichiers
- [ ] RFQ - Ajout fichier
- [ ] RFQ - Téléchargement
- [ ] RFQ - Suppression
- [ ] Devis - Ajout fichier
- [ ] Devis - Téléchargement
- [ ] Devis - Suppression
- [ ] Commandes - Ajout fichier
- [ ] Commandes - Téléchargement
- [ ] Commandes - Suppression
- [ ] Factures - Ajout fichier
- [ ] Factures - Téléchargement
- [ ] Factures - Suppression

### Édition lignes RFQ
- [ ] Chargement des lignes existantes
- [ ] Modification d'une ligne existante
- [ ] Ajout d'une nouvelle ligne
- [ ] Suppression d'une ligne
- [ ] Sélection de produit
- [ ] Remplissage automatique de la référence
- [ ] Validation des champs requis
- [ ] Sauvegarde et rechargement

---

## 🔍 Tests de régression

Vérifier que les fonctionnalités existantes fonctionnent toujours :
- [ ] Création de RFQ
- [ ] Création de devis
- [ ] Création de commandes
- [ ] Création de factures
- [ ] Génération PDF
- [ ] Notifications
- [ ] Dashboard

---

## 📝 Notes de test

**Date de test :** _______________

**Testeur :** _______________

**Résultats :**
- Fonctionnalités OK : _______________
- Bugs trouvés : _______________
- Suggestions : _______________

---

**Version testée :** 1.5  
**Date :** 2025

