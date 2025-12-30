# Gestion de la Marge Commerciale - SilyProcure

## 📋 Vue d'ensemble

Le système permet de majorer les devis reçus des fournisseurs avant de créer des factures pour vos clients. Cela vous permet d'ajouter une marge commerciale (20% ou plus) sur chaque article.

## 🔄 Processus complet

### 1. Réception d'un devis fournisseur
- Vous recevez un devis d'un fournisseur avec des prix d'achat
- Le devis est accepté et une commande est créée

### 2. Livraison de la commande
- La commande est marquée comme "livrée"
- Le statut passe à `livre`

### 3. Création d'une facture pour le client avec majoration
- Sur la page de détails d'une commande livrée, cliquez sur **"Créer une facture pour le client"**
- Un modal s'ouvre avec :
  - **Sélection du client** : Choisissez le client final
  - **Marge commerciale** : Définissez le pourcentage de majoration (par défaut 20%)
  - **Aperçu en temps réel** : Visualisez les prix d'achat, prix de vente et marge

### 4. Calcul automatique
Pour chaque ligne :
- **Prix d'achat HT** = Prix du fournisseur
- **Prix de vente HT** = Prix d'achat × (1 + marge%)
- **Marge** = Prix de vente - Prix d'achat
- **TVA** = Calculée sur le prix de vente
- **Total TTC** = Prix de vente + TVA

### 5. Création de la facture
- La facture est créée avec :
  - Les prix majorés pour le client
  - Les prix d'achat conservés pour votre comptabilité
  - La marge totale calculée

## 📊 Exemple de calcul

**Article :**
- Prix d'achat fournisseur : 100 000 GNF
- Quantité : 2
- Marge appliquée : 20%

**Calcul :**
- Prix d'achat HT total : 200 000 GNF
- Prix de vente HT unitaire : 100 000 × 1.20 = 120 000 GNF
- Prix de vente HT total : 240 000 GNF
- Marge totale : 240 000 - 200 000 = 40 000 GNF
- TVA (20%) : 240 000 × 0.20 = 48 000 GNF
- **Total TTC client : 288 000 GNF**

## 🗄️ Structure de la base de données

### Table `marges_commerciales`
Stocke les configurations de marge :
- `id` : Identifiant
- `nom` : Nom de la marge (ex: "Marge standard")
- `pourcentage` : Pourcentage de majoration (ex: 20.00)
- `actif` : Marge active ou non

### Colonnes ajoutées à `factures`
- `total_achat_ht` : Total HT d'achat (prix fournisseur)
- `marge_totale` : Marge totale générée

### Colonnes ajoutées à `facture_lignes`
- `prix_achat_ht` : Prix d'achat HT (prix du fournisseur)
- `marge_appliquee` : Pourcentage de marge appliquée

## 🔧 Configuration

### Marge par défaut
- La marge par défaut est de **20%**
- Elle peut être modifiée dans le modal de création de facture
- Une marge personnalisée peut être définie pour chaque facture

### Routes API

1. **GET `/api/marges/active`** : Récupère la marge active par défaut
2. **POST `/api/factures/from-commande/:commande_id`** : Crée une facture depuis une commande avec majoration
   - Paramètres :
     - `marge_pourcentage` : Pourcentage de majoration (optionnel, défaut: 20)
     - `client_id` : ID du client final
     - `date_emission` : Date d'émission
     - `conditions_paiement` : Conditions de paiement

## 📝 Utilisation

### Pour créer une facture avec majoration :

1. Allez sur la page de détails d'une commande livrée
2. Cliquez sur **"Créer une facture pour le client"**
3. Sélectionnez le client
4. Définissez la marge (20% par défaut, modifiable)
5. Consultez l'aperçu avec :
   - Prix d'achat (du fournisseur)
   - Prix de vente (au client)
   - Marge générée
6. Cliquez sur **"Créer la facture"**

## 🔒 Confidentialité des informations de marge

**IMPORTANT** : Les informations de marge et de prix d'achat sont **strictement confidentielles** et ne sont **jamais visibles par le client**.

### Ce que voit le client :
- ✅ Prix de vente unitaire HT
- ✅ Quantité
- ✅ Remise (si applicable)
- ✅ TVA
- ✅ Total HT et TTC
- ❌ **Prix d'achat** (masqué)
- ❌ **Marge appliquée** (masquée)
- ❌ **Total achat HT** (masqué)
- ❌ **Marge totale** (masquée)

### Ce que voient les administrateurs/superviseurs/comptables :
- ✅ Toutes les informations client
- ✅ **Prix d'achat** (prix fournisseur)
- ✅ **Marge appliquée** par ligne
- ✅ **Total achat HT**
- ✅ **Marge totale générée**
- ✅ **Taux de marge**

### Où sont masquées les informations de marge ?

1. **Page de détails facture** (`factures-detail.html`) :
   - Les colonnes "Prix achat HT" et "Marge" n'apparaissent que pour les admins/superviseurs/comptables
   - Une section "Informations internes" s'affiche uniquement pour ces rôles

2. **PDF de facture** :
   - Le PDF généré ne contient **jamais** les prix d'achat ni la marge
   - Seuls les prix de vente sont affichés

3. **API** :
   - Les routes publiques ne retournent pas les informations de marge
   - Les informations de marge sont filtrées dans les réponses API selon le rôle de l'utilisateur

## 💡 Avantages

- **Traçabilité** : Les prix d'achat et de vente sont conservés
- **Flexibilité** : Marge personnalisable par facture
- **Transparence** : Aperçu avant création
- **Comptabilité** : Calcul automatique de la marge totale
- **Confidentialité** : Les informations de marge restent internes

---

**Version** : 1.1  
**Date** : 2025

