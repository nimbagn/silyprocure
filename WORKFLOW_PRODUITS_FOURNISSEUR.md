# 📦 Workflow : Association Produits - Fournisseurs

## 🎯 Principe

Chaque fournisseur gère son propre catalogue de produits. L'association se fait à **deux moments clés** :

## 📋 Moment 1 : Création de la RFQ (Demande de devis)

### Situation actuelle
- L'acheteur crée une RFQ
- Il peut sélectionner des produits du catalogue **général** (optionnel)
- Les produits sélectionnés servent de **référence** pour la demande

### Amélioration recommandée
- **Option A** : Sélectionner des produits génériques (catalogue général)
- **Option B** : Sélectionner des produits spécifiques d'un fournisseur (si on sait déjà quel fournisseur on veut)

**Recommandation** : Garder l'option de produits génériques pour la RFQ, car on envoie souvent la même RFQ à plusieurs fournisseurs.

## 💼 Moment 2 : Création du Devis (Réponse fournisseur)

### ⭐ C'EST ICI QUE L'ASSOCIATION SE FAIT VRAIMENT

Quand un fournisseur répond à une RFQ avec un devis :

1. **Le fournisseur voit les lignes de la RFQ**
2. **Pour chaque ligne, il peut :**
   - Utiliser un produit de **son propre catalogue** (produit avec `fournisseur_id` = son ID)
   - Créer une ligne personnalisée sans produit

3. **Le système charge automatiquement les produits du fournisseur** lors de la création du devis

## 🔄 Workflow complet

```
1. Fournisseur crée ses produits
   └─> produits-fournisseur.html?fournisseur_id=X
       └─> Produits avec fournisseur_id = X

2. Acheteur crée une RFQ
   └─> rfq-create.html
       └─> Sélectionne produits génériques (optionnel)
       └─> Envoie à plusieurs fournisseurs

3. Fournisseur reçoit la RFQ
   └─> devis-create.html?rfq_id=Y
       └─> Voit les lignes de la RFQ
       └─> Pour chaque ligne, peut sélectionner UN PRODUIT DE SON CATALOGUE
           └─> Les produits affichés sont filtrés : fournisseur_id = son ID

4. Devis créé
   └─> devis_lignes.produit_id = ID du produit fournisseur
```

## 🛠️ Améliorations à implémenter

### 1. Filtrer les produits lors de la création de devis

**Fichier** : `frontend/devis-create.html`

**Modification** : Charger uniquement les produits du fournisseur qui répond

```javascript
// Au lieu de charger tous les produits
const response = await apiCall('/api/produits');

// Charger uniquement les produits du fournisseur
const response = await apiCall(`/api/produits/fournisseur/${fournisseurId}`);
```

### 2. Afficher les produits fournisseur dans le sélecteur

Lors de la création d'un devis, pour chaque ligne de la RFQ :
- Afficher un sélecteur avec les produits du fournisseur
- Permettre de lier la ligne RFQ à un produit fournisseur

### 3. Suggestion automatique

Si la RFQ référence un produit générique, suggérer les produits équivalents du fournisseur (basé sur la catégorie ou le libellé).

## 📊 Structure de données

### Table `produits`
```sql
- id
- reference (unique par fournisseur)
- libelle
- fournisseur_id (NULL = produit générique, NOT NULL = produit fournisseur)
- prix_fournisseur
- disponible
- delai_livraison_jours
```

### Table `devis_lignes`
```sql
- produit_id (peut être un produit fournisseur)
- rfq_ligne_id (ligne de la RFQ d'origine)
```

## ✅ Actions à faire

1. **Modifier `devis-create.html`** pour charger les produits du fournisseur
2. **Ajouter un sélecteur de produits** dans chaque ligne de devis
3. **Afficher les informations du produit** (prix, délai, disponibilité) quand sélectionné

