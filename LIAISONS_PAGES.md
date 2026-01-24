# Liaisons entre les Pages - SilyProcure

## Vue d'ensemble du Flux

```
Demandes Devis → RFQ → Devis → Commandes → Factures Proforma
```

## Menu de Navigation Principal

Toutes les pages principales ont le même menu de navigation dans l'ordre suivant :

1. **Dashboard** (`dashboard.html`)
2. **RFQ** (`rfq.html`)
3. **Devis** (`devis.html`)
4. **Demandes Devis** (`demandes-devis.html`) - uniquement sur certaines pages
5. **Commandes** (`commandes.html`)
6. **Entreprises** (`entreprises.html`)
7. **Factures** (`factures.html`) - sur certaines pages

## Liaisons Contextuelles

### 1. Demandes Devis → RFQ

**Page source** : `demandes-devis.html`
- **Action** : "Créer des RFQ depuis cette demande"
- **Redirection** : Après création réussie → `rfq.html`
- **Code** : `frontend/js/pages/demandes-devis.js` ligne 1755
  ```javascript
  window.location.href = 'rfq.html';
  ```

### 2. RFQ → Devis

**Page source** : `rfq-detail.html`
- **Action** : "Importer devis" ou "Voir devis"
- **Redirection** : 
  - Vers liste : `devis.html`
  - Vers détail : `devis-detail.html?id={devis_id}`
  - Vers comparaison : `devis-compare.html?ids={devis_ids}`
- **Code** : `frontend/rfq-detail.html` lignes 645, 711

### 3. Devis → Commandes

**Page source** : `devis-detail.html`
- **Action** : "Accepter" (créer une commande)
- **Redirection** : Après acceptation → `commandes-detail.html?id={commande_id}`
- **Code** : `frontend/devis-detail.html` ligne 413

### 4. Commandes → Devis / RFQ

**Page source** : `commandes-detail.html`
- **Liens contextuels** :
  - "Voir Devis" → `devis-detail.html?id={devis_id}`
  - "Voir RFQ" → `rfq-detail.html?id={rfq_id}`
- **Code** : `frontend/commandes-detail.html` lignes 1439-1440

### 5. Commandes → Factures Proforma

**Page source** : `commandes-detail.html`
- **Action** : "Créer une facture proforma"
- **Redirection** : Reste sur la même page après création
- **Code** : `frontend/commandes-detail.html`

## Pages de Détail

### RFQ Detail (`rfq-detail.html`)
- **Liens vers** :
  - Liste RFQ : `rfq.html`
  - Devis associés : `devis-detail.html?id={id}`
  - Comparaison devis : `devis-compare.html?ids={ids}`

### Devis Detail (`devis-detail.html`)
- **Liens vers** :
  - Liste devis : `devis.html`
  - RFQ source : `rfq-detail.html?id={rfq_id}`
  - Commande créée : `commandes-detail.html?id={commande_id}`

### Commandes Detail (`commandes-detail.html`)
- **Liens vers** :
  - Liste commandes : `commandes.html`
  - Devis source : `devis-detail.html?id={devis_id}`
  - RFQ source : `rfq-detail.html?id={rfq_id}`

## Corrections Appliquées

### ✅ Ajout du lien "Devis" dans `demandes-devis.html`

**Problème** : Le menu de navigation de `demandes-devis.html` ne contenait pas le lien vers "Devis", ce qui rendait la navigation incohérente.

**Solution** : Ajout du lien "Devis" dans :
- Menu desktop (ligne 78-81)
- Menu mobile (ligne 147-150)

**Ordre du menu maintenant** :
1. Dashboard
2. RFQ
3. **Devis** ← Ajouté
4. Demandes Devis
5. Commandes
6. Entreprises

## Vérifications à Faire

### ✅ Menu de Navigation
- [x] `demandes-devis.html` : Menu complet avec "Devis"
- [x] `rfq.html` : Menu complet
- [x] `devis.html` : Menu complet
- [x] `commandes.html` : Menu complet

### ✅ Redirections Fonctionnelles
- [x] Demandes Devis → RFQ (après création)
- [x] RFQ → Devis (import/comparaison)
- [x] Devis → Commandes (après acceptation)
- [x] Commandes → Devis/RFQ (liens contextuels)

### ⚠️ Points d'Attention

1. **Menu moderne** (`modern-menu.js`) : La page `demandes-devis` est mappée vers `rfq` dans le menu moderne. C'est peut-être intentionnel, mais à vérifier.

2. **Cohérence des menus** : Toutes les pages principales devraient avoir le même menu de navigation pour une expérience utilisateur cohérente.

3. **Liens contextuels** : Les liens "Voir Devis", "Voir RFQ" dans les pages de détail sont conditionnels (affichés seulement si les IDs existent).

## Structure Recommandée

Pour une navigation optimale, l'ordre logique devrait être :

```
Dashboard
  ↓
Demandes Devis (point d'entrée)
  ↓
RFQ (créées depuis les demandes)
  ↓
Devis (réponses aux RFQ)
  ↓
Commandes (créées depuis les devis acceptés)
  ↓
Factures Proforma (créées depuis les commandes)
```

Mais dans le menu, l'ordre pratique est :
1. Dashboard
2. RFQ
3. Devis
4. Demandes Devis
5. Commandes
6. Entreprises

