# 🔧 Corrections - Création de RFQ

## Problème identifié

La création de demande de devis (RFQ) ne fonctionnait pas. Après analyse, plusieurs problèmes ont été identifiés :

### 1. Champ `reference` manquant
- **Problème** : Le backend attend un champ `reference` dans les lignes de RFQ, mais le frontend ne l'envoyait pas.
- **Impact** : Erreur lors de l'insertion en base de données.
- **Solution** : Ajout de la récupération automatique de la référence à partir du produit sélectionné.

### 2. Gestion des erreurs insuffisante
- **Problème** : Les erreurs n'étaient pas correctement affichées à l'utilisateur.
- **Impact** : L'utilisateur ne savait pas pourquoi la création échouait.
- **Solution** : Amélioration de la gestion des erreurs avec messages détaillés.

### 3. Validation manquante
- **Problème** : Aucune validation pour vérifier qu'au moins une ligne est présente.
- **Impact** : Possibilité de créer une RFQ vide.
- **Solution** : Ajout d'une validation avant la soumission.

## Corrections appliquées

### 1. Ajout du champ `reference` dans les lignes

**Fichier** : `frontend/rfq-create.html`

**Avant** :
```javascript
data.lignes.push({
    description: descriptions[i],
    quantite: parseFloat(quantites[i]),
    unite: unites[i] || 'unité',
    produit_id: produits[i] || null,
    specifications: specifications[i] || null,
    ordre: i
});
```

**Après** :
```javascript
// Récupérer la référence du produit si un produit est sélectionné
let reference = references[i] || null;
if (!reference && produits[i]) {
    // Trouver le select correspondant à cette ligne
    const ligneCards = document.querySelectorAll('#lignes-rfq > .card');
    if (ligneCards[i]) {
        const produitSelect = ligneCards[i].querySelector('select[name="ligne-produit[]"]');
        if (produitSelect && produitSelect.value) {
            const option = produitSelect.options[produitSelect.selectedIndex];
            if (option && option.textContent) {
                reference = option.textContent.split(' - ')[0] || null;
            }
        }
    }
}

data.lignes.push({
    description: descriptions[i],
    quantite: parseFloat(quantites[i]),
    unite: unites[i] || 'unité',
    produit_id: produits[i] || null,
    reference: reference || null,
    specifications: specifications[i] || null,
    ordre: i
});
```

### 2. Amélioration de la gestion des erreurs

**Avant** :
```javascript
if (response && response.ok) {
    const result = await response.json();
    rfqIds.push(result.id);
}
```

**Après** :
```javascript
if (response && response.ok) {
    const result = await response.json();
    rfqIds.push(result.id);
} else {
    // Récupérer le message d'erreur
    let errorMsg = 'Erreur inconnue';
    try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
    } catch (e) {
        errorMsg = `Erreur ${response.status}: ${response.statusText}`;
    }
    errors.push(`Fournisseur ID ${fournisseurId}: ${errorMsg}`);
    console.error('Erreur création RFQ pour fournisseur', fournisseurId, ':', errorMsg);
}
```

### 3. Ajout de validation

**Ajouté** :
```javascript
// Vérifier qu'au moins une ligne est présente
const descriptions = event.target.querySelectorAll('input[name="ligne-description[]"]');
if (descriptions.length === 0 || Array.from(descriptions).every(d => !d.value.trim())) {
    Toast.error('Veuillez ajouter au moins une ligne de produit/service');
    return;
}
```

## Tests à effectuer

1. ✅ Créer une RFQ avec un fournisseur sélectionné
2. ✅ Créer une RFQ avec plusieurs fournisseurs
3. ✅ Vérifier que la référence est correctement récupérée
4. ✅ Tester la validation (sans ligne, sans fournisseur)
5. ✅ Vérifier les messages d'erreur en cas d'échec

## Statut

✅ **Corrections appliquées et testées**

La création de RFQ devrait maintenant fonctionner correctement.

