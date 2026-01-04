# 🧪 Tester l'Authentification sur Render

## 🔍 Diagnostic

Le compte admin existe et le mot de passe est valide, mais la connexion échoue.

## 📋 Étapes de Diagnostic

### 1. Vérifier les logs Render

Dans le dashboard Render → Service web → **Logs**, cherchez les messages lors d'une tentative de connexion :

- `⚠️  Aucun utilisateur trouvé pour: admin@silyprocure.com`
- `⚠️  Mot de passe incorrect pour: admin@silyprocure.com`
- `✅ Connexion réussie pour: admin@silyprocure.com`
- `❌ Erreur base de données lors de la connexion: ...`

### 2. Tester la requête SQL directement

Dans le Shell Render :

```bash
# Tester la requête exacte utilisée par l'authentification
psql $DATABASE_URL -c "SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com' AND actif = TRUE;"
```

### 3. Tester le script de test

```bash
node test_auth_render.js
```

Ce script va :
- ✅ Tester la requête SQL avec pool.query
- ✅ Tester le mot de passe
- ✅ Simuler le wrapper pool.execute
- ✅ Afficher les erreurs détaillées

### 4. Tester l'API directement

```bash
curl -X POST https://silyprocure.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silyprocure.com","mot_de_passe":"admin123"}'
```

**Résultat attendu** :
```json
{
  "message": "Connexion réussie",
  "token": "...",
  "user": {...}
}
```

**Si erreur** :
```json
{
  "error": "Email ou mot de passe incorrect"
}
```

## 🔧 Solutions selon les Erreurs

### Erreur : "Aucun utilisateur trouvé"

**Cause** : La requête SQL ne trouve pas l'utilisateur

**Solution** :
```bash
# Vérifier que l'utilisateur existe et est actif
psql $DATABASE_URL -c "SELECT email, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com';"

# Si actif = false, réactiver
psql $DATABASE_URL -c "UPDATE utilisateurs SET actif = TRUE WHERE email = 'admin@silyprocure.com';"
```

### Erreur : "Mot de passe incorrect"

**Cause** : Le hash du mot de passe ne correspond pas

**Solution** :
```bash
# Réinitialiser le mot de passe
npm run render:fix-admin
```

### Erreur : "Erreur base de données"

**Cause** : Problème avec la requête SQL ou la connexion

**Solution** :
1. Vérifier les logs Render pour l'erreur exacte
2. Vérifier que `database.js` utilise PostgreSQL (doit être copié depuis `database.postgresql.js`)
3. Vérifier les variables d'environnement

### Erreur : "Cannot read property 'execute' of undefined"

**Cause** : Le pool de base de données n'est pas correctement initialisé

**Solution** :
```bash
# Vérifier que database.js existe et utilise PostgreSQL
head -5 backend/config/database.js

# Devrait afficher :
# const { Pool } = require('pg');
# OU
# const mysql = require('mysql2/promise');
```

## 🐛 Problèmes Courants

### Le wrapper PostgreSQL ne fonctionne pas

Si `pool.execute` existe mais ne convertit pas correctement les placeholders :

1. Vérifier que `backend/config/database.js` est bien la version PostgreSQL
2. Vérifier que le wrapper est correctement défini
3. Utiliser `pool.query` directement avec les placeholders `$1, $2`

### La valeur `true` n'est pas acceptée

PostgreSQL accepte `TRUE`, `true`, ou `1` (converti automatiquement). Si problème :

```sql
-- Tester directement
SELECT * FROM utilisateurs WHERE email = 'admin@silyprocure.com' AND actif = TRUE;
SELECT * FROM utilisateurs WHERE email = 'admin@silyprocure.com' AND actif = true;
SELECT * FROM utilisateurs WHERE email = 'admin@silyprocure.com' AND actif = 1;
```

## ✅ Vérification Finale

Une fois les corrections appliquées :

1. **Redéployer** le service sur Render
2. **Tester la connexion** via l'interface web
3. **Vérifier les logs** pour confirmer `✅ Connexion réussie`
4. **Tester l'API** avec curl pour confirmer

---

**Guide créé le** : 2025-01-01  
**Plateforme** : Render.com

