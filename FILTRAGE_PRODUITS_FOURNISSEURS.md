# 🔍 Filtrage des Produits par Fournisseurs - RFQ

## ✅ Fonctionnalité implémentée

Les produits disponibles dans l'étape 3 de la création de RFQ sont maintenant **automatiquement filtrés** en fonction des fournisseurs sélectionnés à l'étape 2.

## 🎯 Comportement

### Avant la sélection des fournisseurs
- Les selects de produits sont vides (seulement "Sélectionner un produit")
- Un message informatif indique que les produits dépendent des fournisseurs sélectionnés

### Après la sélection des fournisseurs
- Les produits de **tous les fournisseurs sélectionnés** sont chargés automatiquement
- Seuls les produits **disponibles** (`disponible = 1`) sont affichés
- Les produits sont **dédupliqués** (si plusieurs fournisseurs ont le même produit)
- Le prix fournisseur est affiché si disponible : `REF-001 - Nom produit (1 000 000 GNF)`

### Lors de la sélection/désélection d'un fournisseur
- Les produits sont **automatiquement rechargés**
- Les sélections existantes sont préservées si le produit est toujours disponible
- Un message d'information s'affiche si aucun produit n'est disponible

## 🔧 Modifications techniques

### 1. Fonction `loadProduits()` refactorisée

**Avant** : Chargement de tous les produits sans filtre
```javascript
async function loadProduits() {
    const response = await apiCall('/api/produits?limit=1000');
    // Charge tous les produits
}
```

**Après** : Chargement uniquement des produits des fournisseurs sélectionnés
```javascript
async function loadProduits() {
    if (selectedFournisseurs.length === 0) {
        // Vider les selects si aucun fournisseur
        return;
    }
    
    // Charger les produits de chaque fournisseur sélectionné
    for (const fournisseurId of selectedFournisseurs) {
        const response = await apiCall(`/api/produits/fournisseur/${fournisseurId}?limit=1000`);
        // Fusionner et dédupliquer
    }
}
```

### 2. Appel automatique lors de la sélection

**Fonction `toggleFournisseur()` modifiée** :
```javascript
function toggleFournisseur(id, nom) {
    // ... logique de sélection/désélection ...
    searchFournisseurs();
    loadProduits(); // ✅ Rechargement automatique
}
```

### 3. Chargement à l'arrivée sur l'étape 3

**Fonction `nextStep()` modifiée** :
```javascript
if (step === 3) {
    loadProduits(); // ✅ Charger les produits quand on arrive à l'étape 3
}
```

### 4. Gestion des nouvelles lignes

**Fonction `addLigneRFQ()` modifiée** :
- Utilise les produits déjà chargés en mémoire (`allAvailableProduits`)
- Évite les appels API inutiles
- Si aucun produit n'est chargé, déclenche le chargement

## 📊 API utilisée

**Route** : `GET /api/produits/fournisseur/:fournisseur_id`

**Paramètres** :
- `fournisseur_id` : ID du fournisseur (dans l'URL)
- `limit` : Nombre maximum de produits (query parameter, défaut: 1000)

**Réponse** :
```json
{
  "data": [
    {
      "id": 1,
      "reference": "REF-001",
      "libelle": "Nom du produit",
      "prix_fournisseur": 1000000,
      "disponible": 1,
      "fournisseur_id": 47,
      ...
    }
  ],
  "pagination": { ... }
}
```

## 🎨 Améliorations UX

1. **Message informatif** sous chaque select de produit :
   > "Les produits disponibles dépendent des fournisseurs sélectionnés"

2. **Affichage du prix** dans la liste déroulante :
   - Format : `REF-001 - Nom produit (1 000 000 GNF)`
   - Facilite la sélection en fonction du prix

3. **Toast d'information** si aucun produit disponible :
   - "Aucun produit disponible pour les fournisseurs sélectionnés"

4. **Préservation des sélections** :
   - Si un produit sélectionné est toujours disponible après changement de fournisseurs, la sélection est conservée

## 🔄 Flux de données

```
Étape 2 : Sélection des fournisseurs
    ↓
toggleFournisseur() appelé
    ↓
loadProduits() appelé automatiquement
    ↓
Pour chaque fournisseur sélectionné :
    GET /api/produits/fournisseur/{id}?limit=1000
    ↓
Fusion et déduplication des produits
    ↓
Mise à jour de tous les selects de produits
    ↓
Étape 3 : Produits disponibles affichés
```

## ✅ Tests à effectuer

1. **Sélection d'un fournisseur** :
   - ✅ Les produits de ce fournisseur apparaissent dans les selects
   - ✅ Seuls les produits disponibles sont affichés

2. **Sélection de plusieurs fournisseurs** :
   - ✅ Les produits de tous les fournisseurs sont fusionnés
   - ✅ Les doublons sont éliminés

3. **Désélection d'un fournisseur** :
   - ✅ Les produits sont rechargés
   - ✅ Les sélections de produits toujours disponibles sont conservées

4. **Ajout d'une nouvelle ligne** :
   - ✅ Les produits déjà chargés sont disponibles immédiatement
   - ✅ Pas d'appel API supplémentaire

5. **Aucun fournisseur sélectionné** :
   - ✅ Les selects sont vides
   - ✅ Message informatif affiché

## 🐛 Gestion des erreurs

- **Erreur API pour un fournisseur** : Continue avec les autres fournisseurs
- **Aucun produit disponible** : Message informatif affiché
- **Produit supprimé entre-temps** : Sélection perdue (comportement normal)

## 📝 Notes

- Les produits sont chargés avec une limite de 1000 par fournisseur
- Seuls les produits avec `disponible = 1` sont affichés
- Le prix fournisseur est affiché si disponible
- Les produits sont triés par libellé

---

**Date d'implémentation** : 11 décembre 2025  
**Statut** : ✅ Implémenté et testé

