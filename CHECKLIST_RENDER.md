# ✅ Checklist de Déploiement Render

## 📋 Services Créés

- [x] Base de données PostgreSQL `silyprocure-db` créée
- [x] Service web `silyprocure` créé

## 🔧 Configuration du Service Web

### Variables d'environnement à vérifier

Allez dans **Web Service** → **Environment** et vérifiez :

- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `JWT_SECRET` est défini (générez avec `openssl rand -base64 32`)
- [ ] `DB_SSL=true`

### Variables de base de données (si non liées automatiquement)

Si Render n'a pas lié automatiquement les variables DB, ajoutez :

- [ ] `DB_HOST` (depuis le dashboard PostgreSQL)
- [ ] `DB_PORT` (depuis le dashboard PostgreSQL)
- [ ] `DB_NAME=silypro`
- [ ] `DB_USER` (depuis le dashboard PostgreSQL)
- [ ] `DB_PASSWORD` (depuis le dashboard PostgreSQL)

**OU** utilisez `DATABASE_URL` (plus simple) :
- [ ] `DATABASE_URL` (Internal Database URL depuis le dashboard PostgreSQL)

### Build Command

Vérifiez que le **Build Command** est :
```bash
bash render-build.sh || npm install
```

### Start Command

Vérifiez que le **Start Command** est :
```bash
npm start
```

## 🗄️ Initialisation de la Base de Données

Une fois le service web déployé :

1. [ ] Allez dans **Web Service** → **Shell**
2. [ ] Exécutez :
   ```bash
   npm run render:init-db
   ```

   Ou manuellement :
   ```bash
   psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
   ```

## ✅ Vérification du Déploiement

### 1. Vérifier les logs

- [ ] Allez dans **Web Service** → **Logs**
- [ ] Vérifiez qu'il n'y a pas d'erreurs
- [ ] Vous devriez voir :
  ```
  ✅ Connexion à la base de données PostgreSQL réussie
  🚀 Serveur SilyProcure démarré sur le port 10000
  ```

### 2. Tester l'API

- [ ] Testez la connexion :
  ```bash
  curl https://silyprocure.onrender.com/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@silyprocure.com","mot_de_passe":"admin123"}'
  ```

### 3. Accéder à l'interface

- [ ] Ouvrez : `https://silyprocure.onrender.com`
- [ ] Vérifiez que la page se charge
- [ ] Testez la connexion avec :
  - **Email:** `admin@silyprocure.com`
  - **Mot de passe:** `admin123`

## 🔐 Sécurité

- [ ] Changez le mot de passe admin après la première connexion
- [ ] Vérifiez que `JWT_SECRET` est fort et unique
- [ ] Vérifiez que `DB_SSL=true`

## 📊 Problèmes Courants

### Le service ne démarre pas

**Solution :**
1. Vérifiez les logs pour les erreurs
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez que `JWT_SECRET` est défini

### Erreur de connexion à la base de données

**Solution :**
1. Vérifiez que la base de données est dans la même région
2. Vérifiez les variables `DB_*` ou `DATABASE_URL`
3. Vérifiez que `DB_SSL=true`
4. Testez depuis le Shell :
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Base de données vide

**Solution :**
1. Allez dans **Shell** du service web
2. Exécutez :
   ```bash
   npm run render:init-db
   ```

---

**Note importante :** Si vous avez déjà une base de données gratuite active, vous ne pouvez pas en créer une autre. Dans ce cas :
- Utilisez la base de données existante
- Ou passez au plan Starter ($7/mois) pour avoir plusieurs bases de données

