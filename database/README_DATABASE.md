# Base de données SilyProcure

## 📋 Informations de connexion

- **Base de données** : `silypro`
- **Utilisateur** : `soul`
- **Mot de passe** : `Satina2025`
- **Moteur** : MySQL
- **Charset** : utf8mb4
- **Collation** : utf8mb4_unicode_ci

## 🚀 Installation

### 1. Exécuter le script de création

```bash
mysql -u root -p < database/silypro_create_database.sql
```

Ou en utilisant l'utilisateur créé :

```bash
mysql -u soul -pSatina2025 < database/silypro_create_database.sql
```

### 2. Vérifier la création

```bash
mysql -u soul -pSatina2025 -e "USE silypro; SHOW TABLES;"
```

## 📊 Structure de la base de données

### Tables principales

#### Gestion des utilisateurs
- `utilisateurs` - Utilisateurs du système avec rôles

#### Gestion des entreprises
- `entreprises` - Entreprises (acheteurs, fournisseurs, clients, transporteurs)
- `adresses` - Adresses des entreprises
- `contacts` - Contacts des entreprises
- `coordonnees_bancaires` - Coordonnées bancaires

#### Catalogue
- `categories` - Catégories d'achat/produits (hiérarchique)
- `produits` - Catalogue de produits et services

#### Gestion de projets
- `projets` - Projets
- `centres_cout` - Centres de coût budgétaires

#### Processus d'achat
- `rfq` - Request for Quotation (Demandes de devis)
- `rfq_lignes` - Lignes de RFQ
- `devis` - Réponses aux RFQ (Devis fournisseurs)
- `devis_lignes` - Lignes de devis
- `commandes` - Bons de commande (BC) et Purchase Orders (PO)
- `commande_lignes` - Lignes de commande

#### Logistique
- `bons_livraison` - Bons de livraison (BL)
- `bl_lignes` - Lignes de bon de livraison

#### Facturation
- `factures` - Factures et factures proforma
- `facture_lignes` - Lignes de facture
- `paiements` - Suivi des paiements

#### Services
- `sla` - Service Level Agreements

#### Système
- `documents_joints` - Pièces jointes
- `historique` - Historique des actions
- `notifications` - Système de notifications
- `parametres` - Paramètres système

## 🔗 Relations principales

```
utilisateurs
  ├── projets (responsable)
  ├── centres_cout (responsable)
  ├── rfq (emetteur)
  └── commandes (commandeur)

entreprises
  ├── adresses
  ├── contacts
  ├── coordonnees_bancaires
  ├── rfq (destinataire)
  ├── devis (fournisseur)
  ├── commandes (fournisseur)
  ├── factures (facturier/client)
  └── sla (fournisseur/client)

rfq
  ├── rfq_lignes
  └── devis

devis
  ├── devis_lignes
  └── commandes

commandes
  ├── commande_lignes
  ├── bons_livraison
  └── factures

bons_livraison
  └── bl_lignes

factures
  ├── facture_lignes
  └── paiements
```

## 📝 Données initiales

Le script crée automatiquement :
- 1 utilisateur administrateur (admin@silyprocure.com / password)
- 5 catégories par défaut
- Paramètres système de base

⚠️ **IMPORTANT** : Changez le mot de passe de l'administrateur en production !

## 🔐 Sécurité

- Tous les mots de passe doivent être hashés (bcrypt recommandé)
- L'utilisateur `soul` a tous les privilèges sur la base `silypro`
- En production, limitez les privilèges selon le principe du moindre privilège

## 📈 Index et performances

Les tables principales ont des index sur :
- Clés étrangères
- Champs de recherche fréquents (numéros, dates, statuts)
- Champs uniques

## 🔄 Maintenance

### Sauvegarde
```bash
mysqldump -u soul -pSatina2025 silypro > backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
mysql -u soul -pSatina2025 silypro < backup_YYYYMMDD.sql
```

## 📚 Documentation complémentaire

Pour plus de détails sur chaque table, consultez le script SQL qui contient des commentaires détaillés.

---

**Version** : 1.0  
**Date** : 2024

