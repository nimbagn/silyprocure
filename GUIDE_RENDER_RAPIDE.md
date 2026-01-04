# 🚀 Guide Rapide - Déploiement sur Render

## ⚡ Déploiement en 3 minutes

### Étape 1 : Créer la base de données (2 min)

1. Allez sur [dashboard.render.com](https://dashboard.render.com)
2. **New** → **PostgreSQL**
3. Configurez :
   - **Name:** `silyprocure-db`
   - **Database:** `silypro`
   - **Plan:** Free (ou Starter $7/mois)
4. **Create Database**

### Étape 2 : Créer le service web (1 min)

#### Option A : Via Blueprint (Recommandé - Plus rapide)

1. **New** → **Blueprint**
2. **Connect GitHub** → Sélectionnez `nimbagn/silyprocure`
3. Render détectera automatiquement `render.yaml`
4. **Apply** → Tout sera configuré automatiquement !

#### Option B : Manuellement

1. **New** → **Web Service**
2. **Connect GitHub** → `nimbagn/silyprocure`
3. Configurez :
   - **Name:** `silyprocure`
   - **Environment:** `Node`
   - **Build Command:** `bash render-build.sh || npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (ou Starter $7/mois)

### Étape 3 : Variables d'environnement

Dans **Environment** du service web, ajoutez :

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<générez avec: openssl rand -base64 32>
DB_SSL=true
```

**Les variables DB_* seront automatiquement liées** si vous utilisez le Blueprint.

### Étape 4 : Initialiser la base de données

Une fois le service déployé :

1. Allez dans **Shell** du service web
2. Exécutez :
```bash
npm run render:init-db
```

Ou manuellement :
```bash
psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
```

## ✅ C'est tout !

Votre application sera disponible sur : `https://silyprocure.onrender.com`

## 🔐 Identifiants par défaut

- **Email:** `admin@silyprocure.com`
- **Mot de passe:** `admin123`

⚠️ **Changez le mot de passe après la première connexion !**

## 📝 Notes importantes

1. **Premier déploiement** : Peut prendre 5-10 minutes
2. **Plan Free** : Le service peut s'endormir après inactivité (réveil en ~30s)
3. **Base de données** : Gratuite 90 jours, puis $7/mois
4. **SSL** : Automatique et gratuit sur Render

## 🔧 Dépannage

### Le service ne démarre pas
- Vérifiez les logs dans le dashboard
- Vérifiez que toutes les variables d'environnement sont définies

### Erreur de connexion DB
- Vérifiez que la base de données est dans la même région
- Vérifiez que `DB_SSL=true`

### Base de données vide
- Exécutez `npm run render:init-db` dans le Shell

## 📚 Documentation complète

Voir `DEPLOIEMENT_RENDER.md` pour plus de détails.

---

**Temps estimé** : 5-10 minutes  
**Coût** : Gratuit (avec limitations) ou $14/mois (Starter)

