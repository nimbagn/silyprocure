# Schéma de la base de données SilyProcure

## 📊 Vue d'ensemble

La base de données `silypro` contient **25 tables** organisées en modules fonctionnels.

## 🗂️ Modules et tables

### 👥 Module Utilisateurs
- **utilisateurs** - Gestion des utilisateurs et rôles

### 🏢 Module Entreprises
- **entreprises** - Informations des entreprises
- **adresses** - Adresses des entreprises
- **contacts** - Contacts des entreprises
- **coordonnees_bancaires** - Coordonnées bancaires

### 📦 Module Catalogue
- **categories** - Catégories hiérarchiques
- **produits** - Catalogue produits/services

### 📊 Module Gestion
- **projets** - Gestion de projets
- **centres_cout** - Centres de coût budgétaires

### 📋 Module Processus d'achat
- **rfq** - Demandes de devis
- **rfq_lignes** - Lignes de RFQ
- **devis** - Devis fournisseurs
- **devis_lignes** - Lignes de devis
- **commandes** - Commandes (BC/PO)
- **commande_lignes** - Lignes de commande

### 🚚 Module Logistique
- **bons_livraison** - Bons de livraison
- **bl_lignes** - Lignes de BL

### 💰 Module Facturation
- **factures** - Factures et proforma
- **facture_lignes** - Lignes de facture
- **paiements** - Suivi des paiements

### 🤝 Module Services
- **sla** - Service Level Agreements

### 🔧 Module Système
- **documents_joints** - Pièces jointes
- **historique** - Historique des actions
- **notifications** - Notifications
- **parametres** - Paramètres système

## 🔗 Flux principal des données

```
1. RFQ (Demande de devis)
   └── rfq_lignes
       └── devis (Réponses)
           └── devis_lignes
               └── commandes (Commandes)
                   └── commande_lignes
                       └── bons_livraison
                           └── bl_lignes
                               └── factures
                                   └── facture_lignes
                                       └── paiements
```

## 📋 Détails des tables principales

### utilisateurs
- Gestion des utilisateurs avec rôles (admin, acheteur, approbateur, comptable, viewer)
- Authentification et autorisation

### entreprises
- Support de plusieurs types : acheteur, fournisseur, client, transporteur
- Informations légales (SIRET, TVA)

### rfq
- Demandes de devis avec suivi de statut
- Liens vers projets et centres de coût

### commandes
- Support BC (Bon de Commande) et PO (Purchase Order)
- Suivi complet du cycle de commande

### factures
- Support factures, proforma et avoirs
- Calcul automatique des totaux et suivi des paiements

### sla
- Gestion des accords de niveau de service
- Métriques de performance (disponibilité, temps de réponse, etc.)

## 🔍 Index et performances

Toutes les tables principales ont des index sur :
- Clés primaires (auto-incrément)
- Clés étrangères
- Champs de recherche (numéros, dates, statuts)
- Champs uniques (numéros de documents)

## 📈 Statistiques

- **25 tables** au total
- **Relations** : ~40 clés étrangères
- **Index** : ~60 index pour optimiser les requêtes
- **Charset** : utf8mb4 pour support Unicode complet

## 🔐 Sécurité

- Contraintes d'intégrité référentielle
- Validation des données au niveau base
- Support des transactions (InnoDB)
- Isolation des données par utilisateur

---

**Version** : 1.0  
**Date** : 2024

