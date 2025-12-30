# Changelog SilyProcure

## Version 1.2 - Géolocalisation et workflow complet

### ✨ Nouvelles fonctionnalités

#### Géolocalisation
- ✅ **Carte interactive** avec Leaflet et OpenStreetMap
- ✅ **Géolocalisation lors de la création** d'entreprise
- ✅ **Géocodage automatique** d'adresses
- ✅ **Utilisation de la position GPS** actuelle
- ✅ **Marqueurs colorés** par type d'entreprise
- ✅ **Filtres** sur la carte
- ✅ **Calcul des distances** et entreprises proches
- ✅ **Itinéraires** vers Google Maps

#### Workflow d'acquisition complet
- ✅ **Création RFQ en 4 étapes** avec formulaire guidé
- ✅ **Recherche et sélection** de fournisseurs
- ✅ **Numéro RFQ automatique** (RFQ-YYYY-NNNN)
- ✅ **Interface fournisseur** pour voir et répondre aux RFQ
- ✅ **Création de devis** depuis RFQ avec calculs automatiques
- ✅ **Comparaison de devis** côte à côte
- ✅ **Acceptation de devis** avec création automatique de commande

#### Adaptation locale (Guinée)
- ✅ **RCCM** au lieu de SIRET (obligatoire)
- ✅ **Numéro contribuable**
- ✅ **Capital social** en GNF
- ✅ **Forme juridique** et secteur d'activité
- ✅ **Monnaie GNF** partout dans l'application
- ✅ **Pays par défaut** : Guinée

#### Dashboard amélioré
- ✅ **Activité récente** (RFQ, devis, commandes)
- ✅ **Évolution** (fournisseurs actifs, totaux)
- ✅ **Statistiques en temps réel**
- ✅ **Cartes cliquables** avec navigation

#### Formulaires fonctionnels
- ✅ **Tous les formulaires** opérationnels
- ✅ **Recherche et filtres** sur toutes les pages
- ✅ **États vides** avec messages
- ✅ **Loading states** partout
- ✅ **Notifications Toast** pour toutes les actions

### 🎨 Améliorations visuelles

- **Section géolocalisation** dans le formulaire entreprise
- **Carte interactive** avec contrôles et légende
- **Badges** pour les statuts
- **Animations** améliorées

### 🔧 Améliorations techniques

- **Route `/api/rfq/generate-number`** pour numéros automatiques
- **Route `/api/adresses`** avec géocodage
- **Fonction `generateRFQNumber()`** pour séquencement
- **Géocodage** via Nominatim (OpenStreetMap)
- **Calcul de distances** (formule Haversine)

### 📁 Nouveaux fichiers

- `frontend/carte.html` - Carte interactive
- `frontend/rfq-create.html` - Création RFQ guidée
- `frontend/fournisseur-rfq.html` - Interface fournisseur
- `frontend/devis-create.html` - Création devis
- `frontend/rfq-detail.html` - Détails RFQ avec devis
- `frontend/devis-compare.html` - Comparaison devis
- `frontend/entreprises-detail.html` - Détails entreprise
- `frontend/js/geolocalisation.js` - Gestion géolocalisation
- `frontend/js/map-utils.js` - Utilitaires carte
- `frontend/js/forms-products.js` - Formulaires produits
- `frontend/css/workflow.css` - Styles workflow
- `database/migration_rccm_gnf.sql` - Migration RCCM/GNF
- `database/migration_geolocalisation.sql` - Migration géolocalisation
- `README_GEOLOCALISATION.md` - Documentation géolocalisation
- `README_WORKFLOW.md` - Documentation workflow
- `RECAP_EVOLUTION.md` - Récapitulatif complet
- `ROADMAP.md` - Roadmap future

---

## Version 1.1 - Interface dynamique et ergonomique

### ✨ Nouvelles fonctionnalités

#### Interface utilisateur
- ✅ **Design moderne** avec animations fluides
- ✅ **Système de notifications Toast** (succès, erreur, warning, info)
- ✅ **Modales interactives** pour création/édition
- ✅ **Recherche en temps réel** sur toutes les pages
- ✅ **Filtres dynamiques** par statut, type, etc.
- ✅ **États vides** avec messages encourageants
- ✅ **Loading states** avec spinners animés
- ✅ **Confirmations de suppression** avec modales

#### Fonctionnalités CRUD
- ✅ **Création RFQ** avec formulaire modal complet
- ✅ **Création Entreprise** avec formulaire modal
- ✅ **Suppression** avec vérification des dépendances
- ✅ **Actions rapides** (voir, éditer, supprimer) sur chaque ligne

#### Dashboard amélioré
- ✅ **Cartes statistiques cliquables** avec navigation
- ✅ **Indicateurs visuels** (positif/négatif)
- ✅ **Animations au survol**

### 🎨 Améliorations visuelles

- **Animations CSS** : fadeIn, slideUp, slideInRight
- **Transitions fluides** sur tous les éléments interactifs
- **Ombres et profondeur** pour un effet moderne
- **Responsive design** amélioré
- **Icônes emoji** pour une meilleure lisibilité
- **Badges colorés** pour les statuts

### 🔧 Améliorations techniques

- **Composants réutilisables** (Modal, Toast, Forms)
- **Gestion d'état** améliorée avec filtrage local
- **Gestion d'erreurs** avec messages utilisateur
- **Routes DELETE** ajoutées au backend
- **Validation** des suppressions (vérification dépendances)

### 📁 Nouveaux fichiers

- `frontend/css/animations.css` - Animations CSS
- `frontend/js/components.js` - Composants réutilisables
- `frontend/js/forms.js` - Gestion des formulaires

### 🐛 Corrections

- Correction du routage des pages HTML
- Amélioration de la gestion des erreurs API
- Correction des notifications de connexion

---

## Version 1.0 - Version initiale

### Fonctionnalités de base
- Authentification JWT
- Gestion RFQ, Devis, Commandes, Factures
- Gestion Entreprises et Produits
- Dashboard avec statistiques
- Base de données MySQL complète

---

**Prochaines étapes** :
- [ ] Graphiques sur le dashboard
- [ ] Fonctionnalités d'édition complètes
- [ ] Export PDF/Excel
- [ ] Notifications en temps réel
- [ ] Recherche avancée multi-critères

