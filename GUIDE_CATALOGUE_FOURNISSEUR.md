# 📦 Guide - Catalogue Produits Fournisseur

## Vue d'ensemble

Chaque entreprise de type **fournisseur** peut maintenant gérer son propre catalogue de produits avec la possibilité d'importer depuis un fichier Excel.

## Fonctionnalités

### 1. Gestion des produits par fournisseur

- ✅ Chaque fournisseur a son propre catalogue de produits
- ✅ Les produits sont liés au fournisseur via le champ `fournisseur_id`
- ✅ Un fournisseur peut avoir plusieurs produits avec la même référence (mais unique par fournisseur)
- ✅ Champs spécifiques : référence fournisseur, prix fournisseur, délai de livraison, quantité minimale

### 2. Import depuis Excel

- ✅ Téléchargement d'un template Excel pré-rempli
- ✅ Import en masse de produits depuis un fichier Excel (.xlsx, .xls)
- ✅ Mise à jour automatique des produits existants (basé sur la référence)
- ✅ Gestion des erreurs avec rapport détaillé

### 3. Interface utilisateur

- ✅ Page dédiée : `produits-fournisseur.html?fournisseur_id=X`
- ✅ Section dans la page de détails entreprise pour les fournisseurs
- ✅ Filtres : recherche, catégorie, disponibilité
- ✅ Pagination pour les grandes listes
- ✅ Formulaire d'ajout/modification de produit

## Structure de la base de données

### Colonnes ajoutées à la table `produits`

```sql
- fournisseur_id INT NULL              -- ID du fournisseur (NULL = produit générique)
- reference_fournisseur VARCHAR(100)    -- Référence du produit chez le fournisseur
- prix_fournisseur DECIMAL(10,2)        -- Prix proposé par le fournisseur
- disponible BOOLEAN DEFAULT TRUE       -- Disponibilité du produit
- delai_livraison_jours INT             -- Délai de livraison en jours
- quantite_minimale DECIMAL(10,2)       -- Quantité minimale de commande
- image_url VARCHAR(255)                -- URL de l'image du produit
```

## API Endpoints

### Produits par fournisseur

```
GET    /api/produits/fournisseur/:fournisseur_id
POST   /api/produits/fournisseur/:fournisseur_id
PUT    /api/produits/fournisseur/:fournisseur_id/:id
DELETE /api/produits/fournisseur/:fournisseur_id/:id
```

### Upload Excel

```
POST   /api/upload/produits/:fournisseur_id
GET    /api/upload/template
```

## Format Excel

### Colonnes supportées

Le template Excel contient les colonnes suivantes :

| Colonne | Obligatoire | Description |
|---------|-------------|-------------|
| Référence | ✅ Oui | Référence unique du produit pour ce fournisseur |
| Référence Fournisseur | ❌ Non | Référence interne du fournisseur |
| Libellé | ✅ Oui | Nom du produit |
| Catégorie | ❌ Non | Nom de la catégorie (doit exister dans la base) |
| Prix HT | ❌ Non | Prix unitaire HT en GNF |
| Prix Fournisseur | ❌ Non | Prix proposé par le fournisseur en GNF |
| Unité | ❌ Non | Unité de mesure (défaut: "unité") |
| TVA % | ❌ Non | Taux de TVA (défaut: 18%) |
| Description | ❌ Non | Description du produit |
| Disponible | ❌ Non | "Oui" ou "Non" (défaut: Oui) |
| Délai Livraison | ❌ Non | Délai en jours |
| Quantité Minimale | ❌ Non | Quantité minimale de commande |

### Exemple de données

```
Référence | Référence Fournisseur | Libellé | Catégorie | Prix HT | Prix Fournisseur | Unité | TVA % | Disponible | Délai Livraison | Quantité Minimale
REF-001   | FOURN-REF-001         | Ordinateur portable | Matériel informatique | 1000000 | 950000 | unité | 18 | Oui | 7 | 1
REF-002   | FOURN-REF-002         | Clavier USB | Matériel informatique | 50000 | 45000 | unité | 18 | Oui | 3 | 10
```

## Utilisation

### 1. Accéder au catalogue d'un fournisseur

**Depuis la page de détails entreprise :**
- Ouvrir une entreprise de type "fournisseur"
- Cliquer sur "📦 Gérer le catalogue" dans la section "Catalogue Produits"

**URL directe :**
```
http://localhost:3000/produits-fournisseur.html?fournisseur_id=1
```

### 2. Ajouter un produit manuellement

1. Cliquer sur "➕ Ajouter un produit"
2. Remplir le formulaire
3. Cliquer sur "💾 Enregistrer"

### 3. Importer depuis Excel

1. Cliquer sur "📥 Télécharger Template Excel" pour obtenir le template
2. Remplir le template avec vos produits
3. Cliquer sur "📤 Importer depuis Excel"
4. Sélectionner le fichier Excel
5. Cliquer sur "📤 Importer"

### 4. Modifier/Supprimer un produit

- **Modifier** : Cliquer sur "✏️" dans la ligne du produit
- **Supprimer** : Cliquer sur "🗑️" dans la ligne du produit

## Migration de la base de données

Si la migration n'a pas encore été appliquée :

```bash
mysql -u root -p silypro < database/migration_catalogue_fournisseur_safe.sql
```

## Notes importantes

1. **Unicité des références** : La référence doit être unique pour un même fournisseur, mais peut être dupliquée entre différents fournisseurs.

2. **Produits génériques** : Les produits avec `fournisseur_id = NULL` sont des produits génériques du catalogue principal.

3. **Catégories** : Si une catégorie n'existe pas dans le fichier Excel, le système utilisera la première catégorie disponible par défaut.

4. **Mise à jour** : Si un produit avec la même référence existe déjà pour le fournisseur, il sera mis à jour au lieu d'être créé.

5. **Taille de fichier** : Les fichiers Excel sont limités à 10 MB.

## Dépannage

### Erreur "Fournisseur non trouvé"
- Vérifier que l'entreprise est bien de type "fournisseur"
- Vérifier que l'ID du fournisseur est correct

### Erreur lors de l'import Excel
- Vérifier que le fichier est bien au format .xlsx ou .xls
- Vérifier que les colonnes obligatoires sont présentes (Référence, Libellé)
- Vérifier que les catégories existent dans la base de données

### Produits non affichés
- Vérifier les filtres appliqués
- Vérifier que les produits ont bien `fournisseur_id` défini

## Prochaines améliorations possibles

- [ ] Export Excel du catalogue
- [ ] Import/Export CSV
- [ ] Gestion des images produits
- [ ] Synchronisation automatique avec systèmes externes
- [ ] Historique des modifications de prix
- [ ] Gestion des stocks par fournisseur

