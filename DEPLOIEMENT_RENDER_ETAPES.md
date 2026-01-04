# 🚀 Déploiement sur Render - Étapes Détaillées

## 📋 Vue d'ensemble

Ce guide vous accompagne étape par étape pour déployer SilyProcure sur Render.

## ✅ Prérequis

- ✅ Compte GitHub (projet déjà sur GitHub)
- ✅ Compte Render : [render.com](https://render.com) (gratuit)

## 🎯 Méthode 1 : Déploiement Automatique (Recommandé - 5 minutes)

### Étape 1 : Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **Get Started for Free**
3. **Sign up with GitHub** (recommandé)
4. Autorisez Render à accéder à vos dépôts

### Étape 2 : Créer un Blueprint

1. Dans le dashboard Render, cliquez sur **New** → **Blueprint**
2. **Connect GitHub** → Sélectionnez `nimbagn/silyprocure`
3. Render détectera automatiquement le fichier `render.yaml`
4. Vous verrez :
   - ✅ **Web Service** : `silyprocure`
   - ✅ **PostgreSQL Database** : `silyprocure-db`
5. Cliquez sur **Apply**

### Étape 3 : Configurer JWT_SECRET

1. Une fois les services créés, allez dans **Web Service** → **Environment**
2. Trouvez `JWT_SECRET` et cliquez sur **Generate** ou entrez manuellement :
   ```bash
   # Générer un secret (sur votre machine)
   openssl rand -base64 32
   ```
3. Copiez le secret généré dans Render

### Étape 4 : Attendre le déploiement

- Le build prendra 3-5 minutes
- La base de données sera créée automatiquement
- Le service web démarrera automatiquement

### Étape 5 : Initialiser la base de données

1. Allez dans votre **Web Service** sur Render
2. Cliquez sur **Shell**
3. Exécutez :
   ```bash
   npm run render:init-db
   ```

Ou manuellement :
```bash
psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
```

### Étape 6 : Tester

1. Votre application sera disponible sur : `https://silyprocure.onrender.com`
2. Connectez-vous avec :
   - **Email:** `admin@silyprocure.com`
   - **Mot de passe:** `admin123`

## 🔧 Méthode 2 : Déploiement Manuel (Si Blueprint ne fonctionne pas)

### Étape 1 : Créer la base de données PostgreSQL

1. **New** → **PostgreSQL**
2. Configurez :
   - **Name:** `silyprocure-db`
   - **Database:** `silypro`
   - **User:** Laissez Render générer ou `soul`
   - **Region:** Choisissez (ex: Frankfurt, Oregon)
   - **Plan:** Free (90 jours) ou Starter ($7/mois)
3. **Create Database**
4. **Notez les credentials** (ou utilisez la connection string)

### Étape 2 : Créer le service web

1. **New** → **Web Service**
2. **Connect GitHub** → `nimbagn/silyprocure`
3. Configurez :
   - **Name:** `silyprocure`
   - **Environment:** `Node`
   - **Region:** Même que la base de données
   - **Branch:** `main`
   - **Root Directory:** (laisser vide)
   - **Build Command:** `bash render-build.sh || npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free ou Starter ($7/mois)

### Étape 3 : Configurer les variables d'environnement

Dans **Environment** du service web :

#### Variables requises :
```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<générez avec: openssl rand -base64 32>
DB_SSL=true
```

#### Variables de base de données :
Si Render ne les lie pas automatiquement, ajoutez :

```env
DB_HOST=<depuis le dashboard PostgreSQL>
DB_PORT=<depuis le dashboard PostgreSQL>
DB_NAME=silypro
DB_USER=<depuis le dashboard PostgreSQL>
DB_PASSWORD=<depuis le dashboard PostgreSQL>
```

**OU** utilisez `DATABASE_URL` (plus simple) :
```env
DATABASE_URL=<depuis le dashboard PostgreSQL - Internal Database URL>
```

### Étape 4 : Déployer

1. Cliquez sur **Create Web Service**
2. Attendez le build (3-5 minutes)
3. Vérifiez les logs pour les erreurs

### Étape 5 : Initialiser la base de données

Comme dans la méthode 1, étape 5.

## 🔍 Vérification du déploiement

### 1. Vérifier les logs

Dans le dashboard Render :
- **Web Service** → **Logs**
- Vous devriez voir :
  ```
  ✅ Connexion à la base de données PostgreSQL réussie
  🚀 Serveur SilyProcure démarré sur le port 10000
  ```

### 2. Tester l'API

```bash
curl https://silyprocure.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silyprocure.com","mot_de_passe":"admin123"}'
```

### 3. Accéder à l'interface

Ouvrez votre navigateur :
```
https://silyprocure.onrender.com
```

## 🔐 Sécurité après déploiement

### 1. Changer le mot de passe admin

1. Connectez-vous avec `admin@silyprocure.com` / `admin123`
2. Allez dans les paramètres utilisateur
3. Changez le mot de passe

### 2. Vérifier les variables d'environnement

- ✅ `JWT_SECRET` est défini et fort
- ✅ `DB_SSL=true` pour les connexions sécurisées
- ✅ `NODE_ENV=production`

## 📊 Monitoring

### Logs en temps réel

- **Dashboard** → **Web Service** → **Logs**
- Filtrez par niveau (Info, Warning, Error)

### Métriques

- **Dashboard** → **Web Service** → **Metrics**
- CPU, Mémoire, Requêtes

## 🔄 Mises à jour

Render déploie automatiquement à chaque push sur `main`.

Pour déployer manuellement :
1. **Dashboard** → **Web Service** → **Manual Deploy**
2. Sélectionnez la branche/commit

## 💰 Coûts

### Plan Free
- **Web Service** : Gratuit
  - ⚠️ S'endort après 15 min d'inactivité
  - Réveil en ~30 secondes
- **PostgreSQL** : Gratuit 90 jours, puis $7/mois

### Plan Starter (Recommandé pour production)
- **Web Service** : $7/mois
  - ✅ Pas de mise en veille
  - ✅ Meilleures performances
- **PostgreSQL** : $7/mois
- **Total** : ~$14/mois

## 🐛 Dépannage

### Le service ne démarre pas

1. **Vérifiez les logs** :
   - Erreur de connexion DB → Vérifiez les variables
   - Module manquant → Vérifiez package.json
   - Port déjà utilisé → Vérifiez PORT=10000

2. **Vérifiez les variables d'environnement** :
   - Toutes les variables requises sont définies
   - JWT_SECRET est défini

### Erreur de connexion à la base de données

1. **Vérifiez** que la base de données est dans la même région
2. **Vérifiez** les variables `DB_*` ou `DATABASE_URL`
3. **Vérifiez** que `DB_SSL=true`
4. **Testez la connexion** depuis le Shell :
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Base de données vide

1. **Allez dans Shell** du service web
2. **Exécutez** :
   ```bash
   npm run render:init-db
   ```

### Le service s'endort (Plan Free)

- C'est normal avec le plan Free
- Le service se réveille automatiquement en ~30 secondes
- Pour éviter cela, passez au plan Starter ($7/mois)

## 📝 Checklist de déploiement

- [ ] Compte Render créé
- [ ] Base de données PostgreSQL créée
- [ ] Service web créé
- [ ] Variables d'environnement configurées
- [ ] JWT_SECRET généré et configuré
- [ ] Build réussi
- [ ] Service démarré
- [ ] Base de données initialisée
- [ ] Test de connexion réussi
- [ ] Interface web accessible
- [ ] Compte admin fonctionnel

## 🎯 Prochaines étapes

1. ✅ **Déploiement terminé**
2. 🌐 **Tester l'application** sur l'URL Render
3. 🔐 **Changer le mot de passe admin**
4. 📧 **Configurer l'email** (optionnel)
5. 🌍 **Configurer un domaine personnalisé** (optionnel)

## 📞 Support

- **Documentation Render** : https://render.com/docs
- **Support Render** : support@render.com
- **Status Render** : https://status.render.com

---

**Guide créé le** : 2025-01-01  
**Plateforme** : Render.com  
**Temps estimé** : 5-10 minutes

