# 🚀 Déploiement sur Render - SilyProcure

## 📋 Vue d'ensemble

Ce guide vous accompagne dans le déploiement de SilyProcure sur Render, une plateforme cloud moderne qui supporte Node.js et PostgreSQL.

## ✅ Prérequis

1. **Compte Render** : Créez un compte sur [render.com](https://render.com)
2. **Compte GitHub** : Votre projet doit être sur GitHub (✅ déjà fait)
3. **PostgreSQL** : Render fournira la base de données PostgreSQL

## 🚀 Déploiement en 5 étapes

### Étape 1 : Créer la base de données PostgreSQL

1. **Connectez-vous** sur [dashboard.render.com](https://dashboard.render.com)
2. **Nouveau** → **PostgreSQL**
3. **Configuration** :
   - **Name:** `silyprocure-db`
   - **Database:** `silypro`
   - **User:** `soul` (ou laissez Render générer)
   - **Region:** Choisissez la région la plus proche
   - **Plan:** Free (pour commencer) ou Starter ($7/mois)
4. **Créer la base de données**

### Étape 2 : Créer le service Web

1. **Nouveau** → **Web Service**
2. **Connecter votre dépôt GitHub** :
   - Sélectionnez `nimbagn/silyprocure`
   - Branche : `main`
3. **Configuration** :
   - **Name:** `silyprocure`
   - **Environment:** `Node`
   - **Region:** Même région que la base de données
   - **Branch:** `main`
   - **Root Directory:** (laisser vide)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (pour commencer) ou Starter ($7/mois)

### Étape 3 : Configurer les variables d'environnement

Dans les **Environment Variables** du service web, ajoutez :

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<générez un secret fort avec: openssl rand -base64 32>
DB_HOST=<automatique depuis la base de données>
DB_PORT=<automatique depuis la base de données>
DB_NAME=silypro
DB_USER=<automatique depuis la base de données>
DB_PASSWORD=<automatique depuis la base de données>
DB_SSL=true
```

**Note:** Les variables `DB_*` peuvent être liées automatiquement depuis la base de données dans Render.

### Étape 4 : Activer PostgreSQL dans l'application

Render utilisera automatiquement PostgreSQL. Assurez-vous que :

1. **Le fichier `database.js` utilise PostgreSQL** :
   - Renommez `backend/config/database.postgresql.js` en `database.js`
   - Ou créez un script de build qui fait cette conversion

2. **Créer un script de build** (optionnel) :

Créez `build.sh` :
```bash
#!/bin/bash
# Activer PostgreSQL pour Render
if [ "$NODE_ENV" = "production" ]; then
    cp backend/config/database.postgresql.js backend/config/database.js
fi
npm install
```

### Étape 5 : Initialiser la base de données

Une fois le service déployé :

1. **Obtenez les credentials** de la base de données depuis le dashboard Render
2. **Connectez-vous** via psql ou un client PostgreSQL
3. **Exécutez le schéma** :

```bash
# Via Render Shell (dans le dashboard)
psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql

# Ou via ligne de commande locale
psql "postgresql://user:password@host:port/database" -f database/silypro_create_database_postgresql.sql
```

## 🔧 Configuration Avancée

### Option 1 : Utiliser render.yaml (Recommandé)

Le fichier `render.yaml` est déjà créé. Render le détectera automatiquement :

1. **Créez un nouveau Blueprint** sur Render
2. **Connectez votre dépôt GitHub**
3. **Render détectera automatiquement** `render.yaml`
4. **Approuvez** la création des services

### Option 2 : Configuration manuelle

Suivez les étapes 1-5 ci-dessus.

## 📝 Scripts Utiles

### Script de build pour Render

Créez `render-build.sh` :

```bash
#!/bin/bash
set -e

echo "🔨 Build pour Render..."

# Activer PostgreSQL
echo "📊 Activation de PostgreSQL..."
cp backend/config/database.postgresql.js backend/config/database.js

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

echo "✅ Build terminé!"
```

Puis dans Render, changez le **Build Command** en :
```bash
bash render-build.sh
```

### Script d'initialisation de la base de données

Créez `render-init-db.sh` :

```bash
#!/bin/bash
set -e

echo "🗄️  Initialisation de la base de données PostgreSQL..."

# Exécuter le schéma
psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql

echo "✅ Base de données initialisée!"
```

## 🔐 Variables d'environnement

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port du serveur | `10000` (Render) |
| `JWT_SECRET` | Secret pour JWT | Générer avec `openssl rand -base64 32` |
| `DB_HOST` | Hôte PostgreSQL | Auto depuis Render |
| `DB_PORT` | Port PostgreSQL | Auto depuis Render |
| `DB_NAME` | Nom de la base | `silypro` |
| `DB_USER` | Utilisateur | Auto depuis Render |
| `DB_PASSWORD` | Mot de passe | Auto depuis Render |
| `DB_SSL` | SSL activé | `true` |

### Variables optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SMTP_HOST` | Serveur SMTP | - |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Utilisateur SMTP | - |
| `SMTP_PASSWORD` | Mot de passe SMTP | - |
| `SMTP_FROM` | Email expéditeur | - |

## 🗄️ Initialisation de la base de données

### Méthode 1 : Via Render Shell

1. Allez dans votre **service web** sur Render
2. Cliquez sur **Shell**
3. Exécutez :

```bash
psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
```

### Méthode 2 : Via ligne de commande locale

1. **Récupérez la connection string** depuis le dashboard Render
2. **Exécutez** :

```bash
psql "postgresql://user:password@host:port/database" -f database/silypro_create_database_postgresql.sql
```

### Méthode 3 : Via script automatique

Créez un script qui s'exécute au premier démarrage :

```javascript
// backend/scripts/init-db.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 
            `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`
    });

    try {
        const sql = fs.readFileSync(
            path.join(__dirname, '../../database/silypro_create_database_postgresql.sql'),
            'utf8'
        );
        
        await pool.query(sql);
        console.log('✅ Base de données initialisée');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Base de données déjà initialisée');
        } else {
            console.error('❌ Erreur:', error.message);
        }
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
```

## 🔄 Mise à jour automatique

Render déploie automatiquement à chaque push sur la branche `main`.

Pour désactiver le déploiement automatique :
1. Allez dans **Settings** du service
2. Désactivez **Auto-Deploy**

## 📊 Monitoring

### Logs

- **Accédez aux logs** : Dashboard → Service → Logs
- **Logs en temps réel** : Disponibles dans le dashboard

### Health Checks

Render vérifie automatiquement que votre service répond sur le port configuré.

## 🔧 Dépannage

### Le service ne démarre pas

1. **Vérifiez les logs** dans le dashboard
2. **Vérifiez les variables d'environnement**
3. **Vérifiez que PostgreSQL est démarré**

### Erreur de connexion à la base de données

1. **Vérifiez** que la base de données est dans la même région
2. **Vérifiez** les variables `DB_*`
3. **Vérifiez** que `DB_SSL=true`

### Erreur "Cannot find module"

1. **Vérifiez** que `package.json` contient toutes les dépendances
2. **Vérifiez** que le build command installe les dépendances

## 💰 Coûts

### Plan Free
- **Web Service** : Gratuit (avec limitations)
- **PostgreSQL** : Gratuit (90 jours, puis $7/mois)
- **Limitations** : Service peut s'endormir après inactivité

### Plan Starter ($7/mois)
- **Web Service** : $7/mois
- **PostgreSQL** : $7/mois
- **Total** : ~$14/mois
- **Avantages** : Pas de mise en veille, meilleures performances

## ✅ Checklist de déploiement

- [ ] Compte Render créé
- [ ] Base de données PostgreSQL créée
- [ ] Service web créé
- [ ] Variables d'environnement configurées
- [ ] Build command configuré
- [ ] Start command configuré
- [ ] Base de données initialisée
- [ ] Service déployé avec succès
- [ ] Test de connexion réussi
- [ ] Compte admin créé/réinitialisé

## 🎯 Prochaines étapes après déploiement

1. **Tester l'application** : Accédez à l'URL fournie par Render
2. **Créer le compte admin** : Utilisez `reset_admin_password.js` ou via l'API
3. **Configurer le domaine personnalisé** (optionnel)
4. **Configurer SSL** (automatique avec Render)
5. **Configurer les backups** de la base de données

## 📞 Support

- **Documentation Render** : https://render.com/docs
- **Support Render** : support@render.com
- **Status Render** : https://status.render.com

---

**Guide créé le** : 2025-01-01  
**Plateforme** : Render.com  
**Base de données** : PostgreSQL

