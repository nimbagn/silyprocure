# SilyProcure - Application de gestion des achats

## 📋 Vue d'ensemble

SilyProcure est une application web complète pour la gestion des achats et de la supply chain, incluant :
- Gestion des RFQ (Request for Quotation)
- Gestion des devis
- Gestion des commandes (BC/PO)
- Gestion des bons de livraison
- Gestion des factures
- Gestion des SLA
- Gestion des entreprises et contacts
- Catalogue produits

## 🚀 Installation

### Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner/installer les dépendances**
```bash
npm install
```

2. **Configurer la base de données**
```bash
cd database
./install.sh
# ou manuellement :
mysql -u root -p < database/silypro_create_database.sql
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Modifier .env si nécessaire
```

4. **Démarrer le serveur**
```bash
npm start
# ou en mode développement :
npm run dev
```

5. **Accéder à l'application**
- Ouvrir http://localhost:3000
- Se connecter avec :
  - Email : admin@silyprocure.com
  - Mot de passe : password

⚠️ **IMPORTANT** : Changez le mot de passe en production !

## 📁 Structure du projet

```
SilyProcure/
├── backend/
│   ├── config/          # Configuration (base de données)
│   ├── routes/          # Routes API
│   ├── middleware/      # Middleware (auth, etc.)
│   └── server.js        # Serveur Express
├── frontend/
│   ├── css/             # Styles
│   ├── js/              # JavaScript
│   ├── views/           # Vues HTML
│   └── assets/          # Assets statiques
├── database/            # Scripts SQL
├── uploads/             # Fichiers uploadés
└── package.json         # Dépendances Node.js
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérifier le token

### Utilisateurs
- `GET /api/utilisateurs` - Liste (admin)
- `GET /api/utilisateurs/:id` - Détails
- `POST /api/utilisateurs` - Créer (admin)
- `PUT /api/utilisateurs/:id` - Mettre à jour

### Entreprises
- `GET /api/entreprises` - Liste
- `GET /api/entreprises/:id` - Détails
- `POST /api/entreprises` - Créer
- `PUT /api/entreprises/:id` - Mettre à jour

### RFQ
- `GET /api/rfq` - Liste
- `GET /api/rfq/:id` - Détails
- `POST /api/rfq` - Créer
- `PATCH /api/rfq/:id/statut` - Mettre à jour le statut

### Commandes
- `GET /api/commandes` - Liste
- `GET /api/commandes/:id` - Détails
- `POST /api/commandes` - Créer

### Factures
- `GET /api/factures` - Liste
- `GET /api/factures/:id` - Détails
- `POST /api/factures` - Créer

### Dashboard
- `GET /api/dashboard/stats` - Statistiques

## 🔐 Sécurité

- Authentification JWT
- Hashage des mots de passe (bcrypt)
- Validation des données
- Protection CORS
- Middleware d'authentification sur toutes les routes API

## 📊 Base de données

- **Base** : `silypro`
- **Utilisateur** : `soul`
- **Mot de passe** : `Satina2025`
- **25 tables** avec relations complètes

Voir `database/README_DATABASE.md` pour plus de détails.

## 🎨 Design

Application conforme à la charte graphique **Direction A : Pro Confiance** :
- Couleurs : Bleu (#1E3A8A, #3B82F6)
- Typographie : Arial/Inter
- Style : Professionnel et moderne

## 📝 Notes de développement

- Backend : Node.js + Express
- Frontend : HTML/CSS/JavaScript vanilla
- Base de données : MySQL
- Authentification : JWT

## 🚧 Fonctionnalités à venir

- [ ] Upload de fichiers
- [ ] Génération de PDF
- [ ] Notifications en temps réel
- [ ] Export Excel
- [ ] Recherche avancée
- [ ] Filtres et tri
- [ ] Tableau de bord avancé

---

**Version** : 1.0  
**Date** : 2024

