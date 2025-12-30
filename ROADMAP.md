# 🗺️ Roadmap SilyProcure

## Version 1.3 - Finalisation (Semaine 1-2)

### 🎯 Objectifs
Finaliser les fonctionnalités de base et améliorer l'expérience utilisateur.

### 📋 Tâches

#### Édition complète
- [ ] **Édition RFQ**
  - Formulaire d'édition avec toutes les données
  - Modification des lignes
  - Changement de fournisseurs
  - Mise à jour du statut

- [ ] **Édition Entreprise**
  - Formulaire pré-rempli
  - Modification des informations légales
  - Ajout/modification d'adresses
  - Gestion des contacts

- [ ] **Édition Produit**
  - Modification prix, stock, description
  - Changement de catégorie
  - Mise à jour des caractéristiques

- [ ] **Édition Devis**
  - Modification avant envoi
  - Ajustement des prix
  - Modification des remises

#### Génération PDF
- [ ] **Bibliothèque PDF**
  - Installation `pdfkit` ou `puppeteer`
  - Templates PDF dynamiques
  - Génération depuis les données

- [ ] **Documents à générer**
  - RFQ en PDF
  - Devis en PDF
  - Commande en PDF
  - Facture en PDF

- [ ] **Fonctionnalités PDF**
  - Logo et en-tête
  - Tableaux formatés
  - Totaux calculés
  - Signature électronique (optionnel)

#### Notifications
- [ ] **Système de notifications**
  - Table `notifications` en base
  - API de notifications
  - Centre de notifications dans l'UI

- [ ] **Types de notifications**
  - RFQ reçue (fournisseur)
  - Devis reçu (acheteur)
  - Commande créée
  - Statut modifié

---

## Version 1.4 - Enrichissement (Semaine 3-4)

### 🎯 Objectifs
Ajouter des fonctionnalités avancées et améliorer les visualisations.

### 📋 Tâches

#### Graphiques Dashboard
- [ ] **Chart.js** ou **Chartist**
  - Graphique évolution commandes (ligne)
  - Répartition par type (camembert)
  - Top fournisseurs (barres)
  - Évolution des montants (aire)

#### Upload de fichiers
- [ ] **Multer** (déjà installé)
  - Upload de fichiers
  - Stockage dans `/uploads`
  - Association aux documents
  - Visualisation et téléchargement

- [ ] **Types de fichiers**
  - Images (contrats, factures)
  - PDF (documents officiels)
  - Excel (tableaux)
  - Limite de taille et validation

#### Recherche avancée
- [ ] **Filtres combinés**
  - Multi-critères
  - Dates (période)
  - Montants (fourchette)
  - Statuts multiples

- [ ] **Recherche globale**
  - Recherche dans tous les modules
  - Résultats groupés
  - Navigation rapide

---

## Version 1.5 - Optimisation (Semaine 5-6)

### 🎯 Objectifs
Optimiser les performances et ajouter des fonctionnalités métier.

### 📋 Tâches

#### Gestion des contacts
- [ ] **CRUD complet**
  - Création depuis entreprise
  - Édition et suppression
  - Import CSV
  - Export contacts

#### Workflow d'approbation
- [ ] **Système d'approbation**
  - Seuils configurables
  - Validation hiérarchique
  - Historique des approbations
  - Notifications d'approbation

#### Rapports
- [ ] **Rapports personnalisés**
  - Rapport commandes
  - Rapport fournisseurs
  - Rapport financier
  - Export Excel

---

## Version 2.0 - Avancé (Mois 2-3)

### 🎯 Objectifs
Fonctionnalités avancées et optimisations majeures.

### 📋 Tâches

#### Application mobile
- [ ] **PWA** (Progressive Web App)
  - Service Worker
  - Offline mode
  - Installation sur mobile
  - Notifications push

#### Intégrations
- [ ] **Email**
  - Envoi automatique de documents
  - Notifications par email
  - Templates d'emails

- [ ] **Export comptable**
  - Format standard
  - Export périodique
  - Intégration comptable

#### Intelligence
- [ ] **Recommandations**
  - Meilleurs fournisseurs
  - Prix moyens par catégorie
  - Détection d'anomalies

---

## 🎯 Priorités par impact

### Impact Élevé / Effort Faible
1. ✅ Édition complète (RFQ, Entreprise, Produit)
2. ✅ Génération PDF
3. ✅ Notifications de base

### Impact Élevé / Effort Moyen
1. ✅ Graphiques dashboard
2. ✅ Upload de fichiers
3. ✅ Recherche avancée

### Impact Moyen / Effort Faible
1. ✅ Export Excel
2. ✅ Gestion contacts complète
3. ✅ Améliorations UX

### Impact Moyen / Effort Moyen
1. ✅ Workflow d'approbation
2. ✅ Rapports personnalisés
3. ✅ Gestion stocks

### Impact Élevé / Effort Élevé
1. ✅ Application mobile
2. ✅ IA et recommandations
3. ✅ Multi-tenant

---

## 📊 Estimation temps

| Fonctionnalité | Complexité | Temps estimé |
|---------------|------------|--------------|
| Édition complète | Moyenne | 3-5 jours |
| Génération PDF | Moyenne | 2-3 jours |
| Notifications | Faible | 2 jours |
| Graphiques | Faible | 1-2 jours |
| Upload fichiers | Faible | 1-2 jours |
| Recherche avancée | Moyenne | 2-3 jours |
| Workflow approbation | Élevée | 5-7 jours |
| Application mobile | Élevée | 2-3 semaines |

---

**Total estimé** : 4-6 semaines pour les fonctionnalités prioritaires

