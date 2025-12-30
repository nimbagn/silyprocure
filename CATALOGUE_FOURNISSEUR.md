# 📦 Catalogue Fournisseur - Documentation

**Date** : 2024  
**Version** : 1.3

---

## 📋 Vue d'ensemble

Chaque entreprise de type **fournisseur** peut maintenant avoir son propre catalogue de produits avec la possibilité d'importer les articles depuis un fichier Excel.

---

## 🎯 Fonctionnalités

### ✅ Catalogue par fournisseur
- Chaque fournisseur a son propre catalogue de produits
- Les produits peuvent avoir des références différentes selon le fournisseur
- Prix spécifiques par fournisseur
- Gestion de la disponibilité
- Délais de livraison par produit
- Quantités minimales de commande

### ✅ Import depuis Excel
- Upload de fichiers Excel (.xlsx, .xls, .csv)
- Template Excel téléchargeable
- Validation automatique des données
- Gestion des erreurs avec rapport détaillé
- Mise à jour automatique des produits existants

### ✅ Interface de gestion
- Page dédiée : `/catalogue-fournisseur.html`
- Sélection du fournisseur
- Liste des produits avec recherche et filtres
- Création, modification, suppression de produits
- Téléchargement du template Excel

---

## 🗄️ Structure de la base de données

### Modifications apportées à la table `produits`

Nouvelles colonnes ajoutées :
- `fournisseur_id` (INT NULL) : ID du fournisseur (NULL = produit générique)
- `reference_fournisseur` (VARCHAR(100)) : Référence du produit chez le fournisseur
- `prix_fournisseur` (DECIMAL(10,2)) : Prix proposé par le fournisseur
- `disponible` (BOOLEAN) : Disponibilité du produit
- `delai_livraison_jours` (INT) : Délai de livraison en jours
- `quantite_minimale` (DECIMAL(10,2)) : Quantité minimale de commande
- `image_url` (VARCHAR(255)) : URL de l'image du produit

### Règles d'unicité

- **Produits génériques** (`fournisseur_id = NULL`) : La référence doit être unique
- **Produits fournisseur** (`fournisseur_id != NULL`) : La référence doit être unique pour un même fournisseur, mais peut être la même pour différents fournisseurs

---

## 📤 Format Excel pour l'import

### Colonnes supportées

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| Référence | ✅ Oui | Référence unique du produit | REF-001 |
| Libellé | ✅ Oui | Nom du produit | Ordinateur portable |
| Description | ❌ Non | Description détaillée | Ordinateur professionnel... |
| Prix HT (GNF) | ❌ Non | Prix unitaire hors taxes | 8500000 |
| Unité | ❌ Non | Unité de mesure | unité, kg, m² |
| TVA (%) | ❌ Non | Taux de TVA | 18 |
| Catégorie | ❌ Non | Nom de la catégorie | Matériel informatique |
| Réf. Fournisseur | ❌ Non | Référence chez le fournisseur | FOURN-REF-001 |
| Disponible | ❌ Non | Oui/Non ou true/false | Oui |
| Délai (jours) | ❌ Non | Délai de livraison | 7 |
| Qté Min | ❌ Non | Quantité minimale | 1 |

### Exemple de fichier Excel

```
Référence | Libellé | Description | Prix HT (GNF) | Unité | TVA (%) | Catégorie | Réf. Fournisseur | Disponible | Délai (jours) | Qté Min
REF-001   | Ordinateur portable | Description... | 8500000 | unité | 18 | Matériel informatique | FOURN-001 | Oui | 7 | 1
REF-002   | Bureau ergonomique | Description... | 850000 | unité | 18 | Fournitures de bureau | FOURN-002 | Oui | 5 | 1
```

---

## 🔌 API Endpoints

### GET /api/catalogue/fournisseur/:fournisseurId
Liste les produits d'un fournisseur

**Paramètres de requête** :
- `search` : Recherche par référence, libellé, description
- `disponible` : Filtrer par disponibilité (true/false)
- `categorie_id` : Filtrer par catégorie

**Réponse** :
```json
[
  {
    "id": 1,
    "reference": "REF-001",
    "reference_fournisseur": "FOURN-001",
    "libelle": "Ordinateur portable",
    "prix_fournisseur": 8500000,
    "disponible": true,
    "delai_livraison_jours": 7,
    "categorie_libelle": "Matériel informatique"
  }
]
```

### POST /api/catalogue/fournisseur/:fournisseurId/import-excel
Importe les produits depuis un fichier Excel

**Body** : `multipart/form-data` avec champ `file`

**Réponse** :
```json
{
  "message": "Import terminé",
  "success": 10,
  "errors": [],
  "warnings": [],
  "total": 10
}
```

### POST /api/catalogue/fournisseur/:fournisseurId/produits
Crée un nouveau produit pour un fournisseur

**Body** :
```json
{
  "reference": "REF-001",
  "libelle": "Produit test",
  "prix_fournisseur": 1000000,
  "unite": "unité",
  "tva_taux": 18,
  "disponible": true
}
```

### PUT /api/catalogue/fournisseur/:fournisseurId/produits/:produitId
Met à jour un produit fournisseur

### DELETE /api/catalogue/fournisseur/:fournisseurId/produits/:produitId
Supprime un produit fournisseur

### GET /api/catalogue/template-excel
Télécharge un template Excel pour l'import

---

## 🚀 Utilisation

### 1. Accéder à la page catalogue

```
http://localhost:3000/catalogue-fournisseur.html
```

### 2. Sélectionner un fournisseur

Choisissez un fournisseur dans la liste déroulante.

### 3. Importer depuis Excel

1. Cliquez sur "📤 Importer depuis Excel"
2. Téléchargez le template si nécessaire
3. Remplissez le template avec vos produits
4. Sélectionnez le fichier et cliquez sur "Importer"
5. Vérifiez le rapport d'import

### 4. Gérer le catalogue

- **Ajouter un produit** : Cliquez sur "➕ Ajouter un produit"
- **Modifier** : Cliquez sur "✏️" à côté d'un produit
- **Supprimer** : Cliquez sur "🗑️" à côté d'un produit
- **Rechercher** : Utilisez la barre de recherche
- **Filtrer** : Utilisez le filtre de disponibilité

---

## 📝 Notes importantes

### Produits génériques vs produits fournisseur

- **Produits génériques** (`fournisseur_id = NULL`) : Produits du catalogue général, disponibles pour tous
- **Produits fournisseur** (`fournisseur_id != NULL`) : Produits spécifiques à un fournisseur, avec leurs propres prix et caractéristiques

### Gestion des doublons

Lors de l'import Excel :
- Si un produit avec la même référence existe déjà pour le fournisseur, il sera **mis à jour**
- Sinon, un nouveau produit sera **créé**

### Validation

Le système valide automatiquement :
- Référence obligatoire
- Libellé obligatoire
- Prix numérique et positif
- TVA entre 0 et 100%
- Délai de livraison positif
- Quantité minimale positive

---

## 🔧 Migration

Pour appliquer la migration :

```bash
mysql -u root -p silypro < database/migration_catalogue_fournisseur_safe.sql
```

Ou si vous utilisez l'utilisateur 'soul' :

```bash
mysql -u soul -pSatina2025 silypro < database/migration_catalogue_fournisseur_safe.sql
```

---

## 📊 Exemple d'utilisation

### Scénario : TechGuinée veut ajouter son catalogue

1. **TechGuinée** se connecte à l'application
2. Accède à la page **Catalogue Fournisseur**
3. Sélectionne **TechGuinée SARL** dans la liste
4. Télécharge le **template Excel**
5. Remplit le template avec ses produits :
   - Ordinateurs portables
   - Serveurs
   - Imprimantes
6. Upload le fichier Excel
7. Le système importe automatiquement tous les produits
8. TechGuinée peut maintenant voir et gérer son catalogue

### Lors de la création d'une RFQ

Lorsqu'un acheteur crée une RFQ :
- Il peut sélectionner des produits du **catalogue général**
- Ou des produits spécifiques d'un **fournisseur**
- Les prix affichés seront ceux du fournisseur si disponible

---

## 🎯 Avantages

1. **Flexibilité** : Chaque fournisseur gère son propre catalogue
2. **Rapidité** : Import en masse depuis Excel
3. **Précision** : Prix et caractéristiques spécifiques par fournisseur
4. **Traçabilité** : Références fournisseur distinctes
5. **Efficacité** : Mise à jour automatique des produits existants

---

**Version du document** : 1.0  
**Dernière mise à jour** : 2024

