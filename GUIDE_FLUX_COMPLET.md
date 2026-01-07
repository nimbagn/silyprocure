# 📖 Guide Complet : Du Formulaire d'Accueil à la Facture Définitive

## 🎯 Vue d'ensemble

Ce document explique le fonctionnement complet de SilyProcure, depuis la soumission d'une demande de devis par un client sur la page d'accueil publique jusqu'à la génération de la facture définitive.

---

## 🔄 Flux Complet du Processus (CORRIGÉ)

```
1. PAGE D'ACCUEIL (home.html)
   ↓ Client remplit le formulaire de demande de devis
   
2. DEMANDE DE DEVIS (demandes_devis)
   ↓ Admin reçoit la demande
   
3. CRÉATION RFQ (rfq)
   ↓ Admin crée une RFQ et l'envoie aux fournisseurs
   
4. DEVIS FOURNISSEURS (devis)
   ↓ Fournisseurs répondent avec leurs devis
   
5. COMPARAISON & AJOUT DE MARGE
   ↓ Admin compare les devis et ajoute la marge commerciale
   
6. FACTURE PROFORMA (factures - type: proforma)
   ↓ Facture proforma créée directement depuis les devis comparés
   ↓ Envoyée au client avec prix de vente (prix fournisseur + marge)
   
7. VALIDATION PROFORMA PAR LE CLIENT
   ↓ Client valide la facture proforma
   
8. BON DE LIVRAISON (bons_livraison)
   ↓ Bon de livraison créé automatiquement après validation
   
9. COMMANDE VALIDÉE (commandes - statut: validee)
   ↓ Commande validée créée automatiquement (basée sur prix d'achat)
   
10. FACTURE DÉFINITIVE (factures - type: facture)
    ↓ Facture définitive créée depuis le BL/commande validée
    ↓ Utilise les prix de vente de la proforma (avec marge)
```

---

## 📝 ÉTAPE 1 : Page d'Accueil - Demande de Devis Client

### Page : `frontend/home.html`

**Fonctionnalités :**
- Formulaire public accessible sans authentification
- Section "Demande de Devis" avec formulaire complet

**Données collectées :**
1. **Informations client :**
   - Nom complet
   - Email
   - Téléphone
   - Entreprise (optionnel)

2. **Articles demandés :**
   - Description
   - Secteur d'activité
   - Quantité
   - Unité de mesure
   - Possibilité d'ajouter plusieurs articles

3. **Adresse de livraison :**
   - Adresse complète
   - Ville
   - Pays
   - Géolocalisation GPS (automatique ou manuelle)

4. **Fichiers joints :**
   - Images, PDF, Excel
   - Maximum 10 fichiers (10MB chacun)

5. **Mode de notification :**
   - Email
   - SMS
   - WhatsApp

**Traitement backend :** `POST /api/contact/devis-request`

**Ce qui se passe :**
1. Validation des données
2. Création ou mise à jour du client dans `clients`
3. Création de la demande dans `demandes_devis` avec :
   - Référence unique (ex: `DEM-2026-001234`)
   - Token de suivi pour le client
   - Statut initial : `nouvelle`
4. Enregistrement des lignes dans `demandes_devis_lignes`
5. Upload des fichiers joints
6. Envoi de notifications :
   - Confirmation au client (email/SMS/WhatsApp)
   - Notification aux admins/superviseurs

**Résultat :**
- La demande apparaît dans `demandes-devis.html` pour les admins
- Le client reçoit une confirmation avec sa référence de suivi

---

## 📋 ÉTAPE 2 : Gestion des Demandes de Devis

### Page : `frontend/demandes-devis.html`

**Actions disponibles pour l'admin :**
1. **Voir toutes les demandes** (nouvelles, en cours, traitées)
2. **Consulter les détails** d'une demande
3. **Créer une RFQ** depuis une demande (à implémenter)
4. **Marquer comme traitée**

**Statuts possibles :**
- `nouvelle` : Demande reçue, en attente de traitement
- `en_cours` : RFQ créée et envoyée
- `traitee` : Processus terminé
- `annulee` : Demande annulée

---

## 📨 ÉTAPE 3 : Création et Envoi de RFQ aux Fournisseurs

### Page : `frontend/rfq-create.html` ou `frontend/rfq-detail.html`

**Processus de création RFQ :**

1. **Informations générales :**
   - Numéro RFQ (auto-généré : `RFQ-YYYY-NNNN`)
   - Date d'émission
   - Date limite de réponse
   - Catégorie
   - Description

2. **Sélection des fournisseurs :**
   - Recherche par nom ou secteur
   - Sélection multiple
   - Une RFQ est créée pour chaque fournisseur sélectionné

3. **Lignes de produits :**
   - Copiées depuis la demande client ou ajoutées manuellement
   - Quantité, unité, spécifications

4. **Conditions :**
   - Adresse de livraison
   - Date souhaitée
   - Incoterms
   - Conditions de paiement

**Envoi de la RFQ :**
- Statut passe de `brouillon` à `envoye`
- Notifications envoyées aux fournisseurs
- Liens externes générés pour les fournisseurs sans compte

**Traitement backend :** `POST /api/rfq`

---

## 💼 ÉTAPE 4 : Réponse des Fournisseurs

### Pages : `frontend/devis-create.html` ou formulaire externe

**Options pour le fournisseur :**

1. **Via interface connectée :**
   - Voir les RFQ reçues
   - Cliquer sur "Répondre avec un devis"
   - Remplir le formulaire de devis

2. **Via lien externe :**
   - Lien unique généré par l'admin
   - Formulaire accessible sans compte
   - Token de sécurité pour validation

**Données du devis :**
- Numéro de devis
- Dates (émission, validité)
- Délai de livraison
- Prix unitaire pour chaque ligne
- Remises (ligne et globale)
- TVA
- Conditions de paiement
- Garanties et certifications
- Notes

**Traitement backend :** `POST /api/devis` ou `POST /api/liens-externes/submit-devis-externe`

**Résultat :**
- Devis créé avec statut `envoye`
- RFQ passe à `en_cours`
- Notification à l'admin

---

## 🔍 ÉTAPE 5 : Comparaison des Devis et Ajout de la Marge

### Pages : `frontend/rfq-detail.html` ou `frontend/devis-compare.html`

**Fonctionnalités :**
1. **Visualisation de tous les devis** reçus pour une RFQ
2. **Comparaison côte à côte :**
   - Prix HT, TVA, TTC
   - Remises appliquées
   - Délais de livraison
   - Conditions de paiement
   - Garanties
3. **Recommandation automatique** (meilleur prix)
4. **Sélection des devis et lignes** pour consolidation

**Action : Créer facture proforma**
- Sélection des devis fournisseurs et lignes
- Application de la marge commerciale
- Création directe de la facture proforma

---

## 💰 ÉTAPE 6 : Création de la Facture Proforma (Directement depuis les Devis)

### Page : `frontend/rfq-detail.html` ou `frontend/devis-compare.html`

**Processus :**

1. **Bouton "Créer facture proforma"** après comparaison :
   - Sélection des devis fournisseurs
   - Sélection des lignes à inclure
   - Application de la marge commerciale

2. **Modal de création :**
   - Marge commerciale (%) : Par défaut 20% ou marge active configurée
   - Date d'émission
   - Conditions de paiement
   - Aperçu en temps réel avec :
     - Prix d'achat HT (du fournisseur)
     - Prix de vente HT (après marge)
     - Marge totale
     - TVA
     - Total TTC

3. **Création de la facture proforma :**
   - Traitement backend : `POST /api/factures/proforma-from-devis`
   - Type : `proforma`
   - Statut : `envoyee`
   - Numéro : `PROFORMA-YYYY-TIMESTAMP`
   - Calcul automatique :
     - Prix de vente = Prix d'achat × (1 + marge%)
     - Total HT, TVA, TTC
     - Marge totale

4. **Lignes de facture :**
   - Consolidées depuis les devis sélectionnés
   - Prix de vente calculé avec marge
   - Prix d'achat conservé (visible admin uniquement)

5. **Enregistrement :**
   - Dans `factures` (type: `proforma`)
   - Dans `facture_lignes`
   - Dans l'historique client
   - Lien avec `demande_devis_id`

**Résultat :**
- Facture proforma créée et envoyée au client
- Visible dans `factures.html` (filtre "Proforma")
- Statut : `envoyee`
- **Aucune commande créée à ce stade**

---

## ✅ ÉTAPE 7 : Validation de la Facture Proforma par le Client

### Page : `frontend/factures-detail.html`

**Processus :**

1. **Visualisation de la proforma :**
   - Détails complets
   - Lignes avec prix de vente (client ne voit pas le prix d'achat)
   - Totaux (HT, TVA, TTC)
   - Informations de marge (admin uniquement)

2. **Bouton "Valider la proforma"** :
   - Visible quand :
     - Type = `proforma`
     - Statut = `envoyee`

3. **Validation :**
   - Confirmation demandée
   - Traitement backend : `POST /api/factures/validate-proforma/:proforma_id`
   - Actions automatiques :
     - **Création d'un bon de livraison (BL)**
     - **Création d'une commande validée** (statut: `validee`)
     - Commande basée sur les prix d'achat (pas les prix de vente)
     - Mise à jour de la proforma : statut → `payee` (validée)
     - Lien proforma → commande créée
     - Enregistrement dans l'historique client

**Résultat :**
- Bon de livraison créé (statut: `brouillon`)
- Commande validée créée (statut: `validee`)
- Proforma marquée comme validée
- Redirection vers le bon de livraison

---

## 🚚 ÉTAPE 8 : Bon de Livraison (BL)

### Page : `frontend/bons-livraison-detail.html` (à créer)

**Processus :**

1. **Création automatique** lors de la validation de la proforma
2. **Détails du BL :**
   - Numéro : `BL-YYYY-TIMESTAMP`
   - Lien vers la commande validée
   - Date de livraison
   - Transporteur (optionnel)
   - Lignes de livraison (basées sur la commande)

3. **Lignes du BL :**
   - Quantité commandée
   - Quantité livrée
   - État (conforme, non conforme, endommagé, manquant)

4. **Actions :**
   - Modifier les quantités livrées
   - Marquer comme livré
   - Générer PDF

**Résultat :**
- BL créé et prêt pour la livraison
- Commande validée liée

---

## 📦 ÉTAPE 9 : Commande Validée

### Page : `frontend/commandes-detail.html`

**Processus :**

1. **Création automatique** lors de la validation de la proforma
2. **Caractéristiques :**
   - Statut : `validee` (validée par le client)
   - Basée sur les prix d'achat (du fournisseur)
   - Lien vers la proforma
   - Lien vers le BL

3. **Utilisation :**
   - Référence pour la livraison
   - Base pour la facture définitive

**Résultat :**
- Commande validée créée
- Prête pour transformation en facture définitive

---

## 🧾 ÉTAPE 10 : Facture Définitive (depuis le BL/Commande Validée)

### Page : `frontend/bons-livraison-detail.html` ou `frontend/commandes-detail.html`

**Processus :**

1. **Bouton "Créer facture définitive"** :
   - Visible sur le BL ou la commande validée
   - Après validation de la proforma

2. **Création de la facture définitive :**
   - Traitement backend : `POST /api/factures/definitive-from-bl/:bl_id`
   - Type : `facture`
   - Statut : `en_attente`
   - Numéro : `FAC-YYYY-TIMESTAMP`
   - **Utilise les prix de vente de la proforma** (avec marge)
   - Lien vers le BL
   - Lien vers la commande validée

3. **Lignes de facture :**
   - Copiées depuis la proforma (prix de vente avec marge)
   - Même structure que la proforma

4. **Enregistrement :**
   - Dans `factures` (type: `facture`)
   - Dans `facture_lignes`
   - Dans l'historique client

**Résultat :**
- Facture définitive créée
- Prête pour gestion des paiements

---

## 🧾 ÉTAPE 10 : Facture Définitive et Gestion des Paiements

### Page : `frontend/factures-detail.html`

**Fonctionnalités :**

1. **Visualisation de la facture :**
   - Informations générales
   - Lignes détaillées
   - Totaux (HT, TVA, TTC)
   - Reste à payer
   - Informations de marge (admin uniquement)

2. **Gestion des paiements :**
   - Bouton "Enregistrer un paiement"
   - Modal pour saisir :
     - Montant
     - Date de paiement
     - Mode de paiement
     - Référence
     - Notes
   - Mise à jour automatique :
     - `montant_regle` : Total des paiements
     - `reste_a_payer` : Total TTC - Montant réglé
     - Statut :
       - `en_attente` : Aucun paiement
       - `partiellement_payee` : Paiement partiel
       - `payee` : Totalement payée

3. **Historique des paiements :**
   - Liste de tous les paiements
   - Possibilité de modifier/supprimer
   - Total payé affiché

4. **Génération PDF :**
   - Bouton "PDF" pour télécharger la facture
   - Route : `GET /api/pdf/facture/:id`

**Statuts de facture :**
- `brouillon` : En cours de création
- `envoyee` : Envoyée au client (proforma uniquement)
- `en_attente` : En attente de paiement
- `partiellement_payee` : Paiement partiel reçu
- `payee` : Totalement payée
- `impayee` : En retard
- `annulee` : Annulée

---

## 📊 Tableau Récapitulatif des Statuts

| Étape | Document | Statuts Possibles |
|-------|----------|-------------------|
| 1 | Demande Devis | `nouvelle`, `en_cours`, `traitee`, `annulee` |
| 3 | RFQ | `brouillon`, `envoye`, `en_cours`, `cloture` |
| 4 | Devis | `brouillon`, `envoye`, `accepte`, `refuse` |
| 6 | Commande | `brouillon`, `envoye`, `en_preparation`, `partiellement_livre`, `livre`, `annule` |
| 8 | Facture Proforma | `envoyee`, `payee`, `annulee` |
| 10 | Facture Définitive | `brouillon`, `en_attente`, `partiellement_payee`, `payee`, `impayee`, `annulee` |

---

## 🔐 Rôles et Permissions

### Client (Public)
- ✅ Soumettre une demande de devis
- ✅ Suivre sa demande (via token)
- ❌ Accès à l'interface admin

### Fournisseur
- ✅ Voir les RFQ reçues
- ✅ Créer des devis
- ✅ Suivre l'état de ses devis
- ❌ Voir les marges commerciales
- ❌ Accéder aux autres sections

### Admin / Superviseur
- ✅ Toutes les fonctionnalités
- ✅ Voir les marges commerciales
- ✅ Créer RFQ, valider devis
- ✅ Créer factures proforma et définitives
- ✅ Gérer les paiements

### Acheteur / Comptable
- ✅ Voir les commandes et factures
- ✅ Gérer les paiements
- ❌ Voir les marges (selon configuration)

---

## 🔔 Notifications Automatiques

Le système envoie des notifications à chaque étape :

1. **Demande de devis soumise** → Notification aux admins
2. **RFQ envoyée** → Notification aux fournisseurs (email/SMS/WhatsApp)
3. **Devis reçu** → Notification à l'admin
4. **Devis accepté** → Notification au fournisseur
5. **Commande créée** → Notification aux parties concernées
6. **Commande livrée** → Notification au client
7. **Facture proforma créée** → Notification au client
8. **Facture définitive créée** → Notification au client
9. **Paiement enregistré** → Notification de confirmation

---

## 💡 Points Importants

### Marge Commerciale
- Configurable dans les paramètres
- Appliquée automatiquement lors de la création de facture proforma
- Visible uniquement par les admins/superviseurs
- Calcul : `Prix vente = Prix achat × (1 + marge%)`

### Géolocalisation
- Automatique via le navigateur (si autorisé)
- Manuelle via carte interactive
- Stockée dans `demandes_devis` (latitude, longitude)
- Utilisée pour la visualisation sur la carte

### Fichiers Joints
- Supportés : Images, PDF, Excel
- Maximum 10 fichiers, 10MB chacun
- Stockés dans `uploads/fichiers/demandes_devis/`
- Enregistrés dans `documents_joints`

### Historique Client
- Toutes les interactions sont enregistrées
- Accessible dans la fiche client
- Permet le suivi complet du parcours client

---

## 🚀 Utilisation Pratique

### Pour un Client
1. Aller sur `home.html`
2. Remplir le formulaire de demande de devis
3. Recevoir une confirmation avec référence
4. Attendre la réponse (facture proforma)
5. Valider la proforma
6. Recevoir la facture définitive
7. Effectuer le paiement

### Pour un Admin
1. Consulter `demandes-devis.html`
2. Créer une RFQ depuis la demande
3. Envoyer la RFQ aux fournisseurs
4. Comparer les devis reçus
5. Accepter le meilleur devis
6. Marquer la commande comme livrée
7. Créer la facture proforma
8. Valider la proforma → Facture définitive créée
9. Gérer les paiements

### Pour un Fournisseur
1. Recevoir notification RFQ
2. Consulter les RFQ reçues
3. Créer un devis
4. Envoyer le devis
5. Suivre l'acceptation/refus

---

## 📁 Fichiers Clés

### Frontend
- `home.html` : Page d'accueil publique
- `demandes-devis.html` : Gestion des demandes
- `rfq-create.html` : Création RFQ
- `rfq-detail.html` : Détails RFQ et comparaison
- `devis-detail.html` : Détails devis et acceptation
- `commandes-detail.html` : Détails commande et création proforma
- `factures.html` : Liste des factures
- `factures-detail.html` : Détails facture et validation

### Backend
- `backend/routes/contact.js` : Gestion des demandes de devis
- `backend/routes/rfq.js` : Gestion des RFQ
- `backend/routes/devis.js` : Gestion des devis
- `backend/routes/commandes.js` : Gestion des commandes
- `backend/routes/factures.js` : Gestion des factures (proforma et définitive)

### Base de Données
- `demandes_devis` : Demandes clients
- `rfq` : Demandes aux fournisseurs
- `devis` : Réponses fournisseurs
- `commandes` : Commandes créées
- `factures` : Factures (proforma et définitive)
- `facture_lignes` : Lignes de facture
- `paiements` : Paiements reçus

---

**Version** : 2.0  
**Date** : Janvier 2026  
**Dernière mise à jour** : Ajout du flux facture proforma → facture définitive

