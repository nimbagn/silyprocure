# 🔧 Réparer le Compte Admin sur Render

## 🚨 Problème

Le compte admin ne fonctionne pas sur Render.

## ✅ Solution Rapide

### Étape 1 : Accéder au Shell Render

1. Allez sur [dashboard.render.com](https://dashboard.render.com)
2. Ouvrez votre service web `silyprocure`
3. Cliquez sur **"Shell"** dans le menu de gauche

### Étape 2 : Exécuter le script de réparation

Dans le Shell, exécutez :

```bash
npm run render:fix-admin
```

Ce script va :
- ✅ Vérifier si le compte admin existe
- ✅ Le créer s'il n'existe pas
- ✅ Le réactiver s'il est désactivé
- ✅ Réinitialiser le mot de passe à `admin123`
- ✅ Tester la connexion

### Étape 3 : Se connecter

Une fois le script terminé, utilisez :

- **URL** : `https://silyprocure.onrender.com` (ou votre domaine)
- **Email** : `admin@silyprocure.com`
- **Mot de passe** : `admin123`

## 🔍 Vérification Manuelle

Si le script ne fonctionne pas, vérifiez manuellement :

### 1. Vérifier que la base de données est initialisée

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM utilisateurs;"
```

Si la table n'existe pas :
```bash
npm run render:init-db
```

### 2. Vérifier le compte admin

```bash
psql $DATABASE_URL -c "SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com';"
```

### 3. Créer/réinitialiser le compte admin manuellement

```bash
node fix_admin_render.js
```

## 🐛 Dépannage

### Erreur : "Cannot find module 'pg'"

```bash
npm install
```

### Erreur : "Connection refused"

Vérifiez que :
- La base de données PostgreSQL est active sur Render
- Les variables d'environnement `DATABASE_URL` ou `DB_*` sont correctes

### Erreur : "Table utilisateurs does not exist"

Initialisez la base de données :
```bash
npm run render:init-db
```

### Le mot de passe ne fonctionne toujours pas

Réinitialisez manuellement :

```bash
node -e "
const {Pool} = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
bcrypt.hash('admin123', 10).then(hash => {
  return pool.query('UPDATE utilisateurs SET mot_de_passe = \$1, actif = TRUE WHERE email = \$2', [hash, 'admin@silyprocure.com']);
}).then(() => {
  console.log('✅ Mot de passe réinitialisé');
  process.exit(0);
}).catch(e => {
  console.error('❌ Erreur:', e.message);
  process.exit(1);
});
"
```

## 📝 Identifiants par Défaut

Après réparation :

- **Email** : `admin@silyprocure.com`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez le mot de passe après la première connexion !

## 🔐 Changer le Mot de Passe

Une fois connecté :

1. Allez dans **Paramètres utilisateur**
2. Cliquez sur **Changer le mot de passe**
3. Entrez l'ancien mot de passe : `admin123`
4. Entrez le nouveau mot de passe
5. Confirmez

---

**Guide créé le** : 2025-01-01  
**Plateforme** : Render.com

