# ✅ Checklist de Déploiement Render - SilyProcure

## 📋 Vérifications avant déploiement

### 1. Fichiers HTML présents
- [x] `frontend/home.html` - Page d'accueil publique
- [x] `frontend/index.html` - Page d'accueil alternative
- [x] `frontend/dashboard.html` - Tableau de bord
- [x] `frontend/rfq.html` - Liste RFQ
- [x] `frontend/rfq-detail.html` - Détails RFQ
- [x] `frontend/rfq-create.html` - Création RFQ
- [x] `frontend/devis.html` - Liste devis
- [x] `frontend/devis-detail.html` - Détails devis
- [x] `frontend/devis-compare.html` - Comparaison devis
- [x] `frontend/devis-create.html` - Création devis
- [x] `frontend/devis-externe.html` - Devis externe
- [x] `frontend/commandes.html` - Liste commandes
- [x] `frontend/commandes-detail.html` - Détails commande
- [x] `frontend/factures.html` - Liste factures
- [x] `frontend/factures-detail.html` - Détails facture
- [x] `frontend/bons-livraison-detail.html` - Détails bon de livraison
- [x] `frontend/entreprises.html` - Liste entreprises
- [x] `frontend/entreprises-detail.html` - Détails entreprise
- [x] `frontend/produits.html` - Liste produits
- [x] `frontend/utilisateurs.html` - Liste utilisateurs
- [x] `frontend/demandes-devis.html` - Liste demandes devis
- [x] `frontend/suivi.html` - Suivi demande
- [x] `frontend/parametres-messagepro.html` - Paramètres Message Pro
- [x] `frontend/carte.html` - Carte géographique
- [x] `frontend/notifications.html` - Notifications

### 2. Fichiers CSS
- [x] `frontend/css/style.css` - Styles principaux
- [x] `frontend/css/responsive.css` - Styles responsive
- [x] `frontend/css/animations.css` - Animations
- [x] `frontend/css/style-hapag.css` - Styles Hapag-Lloyd
- [x] `frontend/css/workflow.css` - Styles workflow

### 3. Fichiers JavaScript
- [x] `frontend/js/auth.js` - Authentification
- [x] `frontend/js/app.js` - Application principale
- [x] `frontend/js/components.js` - Composants
- [x] `frontend/js/sidebar.js` - Sidebar
- [x] `frontend/js/fileUpload.js` - Upload fichiers
- [x] `frontend/js/forms.js` - Formulaires
- [x] `frontend/js/notifications.js` - Notifications
- [x] `frontend/js/geolocalisation.js` - Géolocalisation
- [x] `frontend/js/map-utils.js` - Utilitaires carte

### 4. Routes Backend
- [x] `/api/auth` - Authentification
- [x] `/api/utilisateurs` - Utilisateurs
- [x] `/api/entreprises` - Entreprises
- [x] `/api/produits` - Produits
- [x] `/api/rfq` - RFQ
- [x] `/api/devis` - Devis
- [x] `/api/commandes` - Commandes
- [x] `/api/bl` - Bons de livraison
- [x] `/api/factures` - Factures
- [x] `/api/contact` - Contact
- [x] `/api/messagepro` - Message Pro
- [x] `/api/settings` - Paramètres
- [x] `/api/marges` - Marges commerciales
- [x] `/api/fichiers` - Fichiers
- [x] `/api/pdf` - Génération PDF
- [x] `/api/excel` - Génération Excel

### 5. Services
- [x] `backend/services/messagepro.js` - Service Message Pro
- [x] `backend/utils/whatsappNotifications.js` - Notifications WhatsApp
- [x] `backend/utils/notificationService.js` - Service notifications
- [x] `backend/utils/emailService.js` - Service email

### 6. Configuration Render
- [x] `render.yaml` - Configuration Render
- [x] `render-build.sh` - Script de build
- [x] `package.json` - Dépendances Node.js
- [x] `.nvmrc` - Version Node.js

### 7. Scripts de migration
- [x] `backend/scripts/init-db-render.js` - Initialisation DB
- [x] `backend/scripts/run-update-render.js` - Mise à jour DB
- [x] `backend/scripts/migrate-demandes-devis.js` - Migration demandes devis
- [x] `backend/scripts/add-clients-columns.js` - Ajout colonnes clients
- [x] `backend/scripts/add-entreprises-columns.js` - Ajout colonnes entreprises
- [x] `backend/scripts/add-liens-externes.js` - Ajout table liens externes

### 8. Scripts SQL
- [x] `database/silypro_create_database_postgresql.sql` - Schéma complet
- [x] `database/fix_all_errors_postgresql.sql` - Corrections
- [x] `database/update_render_complete.sql` - Mise à jour complète
- [x] `database/update_render_postgresql_complete.sql` - Mise à jour PostgreSQL

## 🚀 Commandes de déploiement

### Sur Render (via Shell)

```bash
# 1. Vérifier que tous les fichiers sont présents
ls -la frontend/*.html
ls -la frontend/css/*.css
ls -la frontend/js/*.js

# 2. Initialiser la base de données (si pas déjà fait)
npm run render:init-db

# 3. Mettre à jour la base de données
npm run render:update

# 4. Vérifier les logs
tail -f /var/log/render.log
```

## ✅ Vérifications post-déploiement

1. **Page d'accueil** : `https://silyprocure.onrender.com/`
2. **Dashboard** : `https://silyprocure.onrender.com/dashboard.html`
3. **Commandes** : `https://silyprocure.onrender.com/commandes.html`
4. **Détails commande** : `https://silyprocure.onrender.com/commandes-detail.html?id=3`
   - ✅ Bouton "Créer une facture proforma" visible
5. **Factures** : `https://silyprocure.onrender.com/factures.html`
6. **RFQ** : `https://silyprocure.onrender.com/rfq.html`
7. **Devis** : `https://silyprocure.onrender.com/devis.html`

## 🔧 Problèmes courants

### Bouton "Créer facture proforma" non visible
- **Cause** : Fichier `commandes-detail.html` non à jour sur Render
- **Solution** : Vérifier que le fichier est bien déployé, vider le cache du navigateur

### Erreur 404 sur les pages HTML
- **Cause** : Fichiers statiques non servis correctement
- **Solution** : Vérifier `express.static` dans `backend/server.js`

### Erreurs de base de données
- **Cause** : Tables manquantes
- **Solution** : Exécuter `npm run render:update` dans le Shell Render

