# 🔧 Guide de Résolution - Erreur de Connexion MySQL

## ❌ Problème

```
❌ Erreur de connexion à la base de données: Access denied for user 'soul'@'localhost' (using password: YES)
```

L'utilisateur MySQL `soul` n'existe pas ou le mot de passe est incorrect.

---

## ✅ Solutions

### Solution 1 : Créer l'utilisateur MySQL (Recommandé)

#### Option A : Utiliser le script automatique

```bash
cd /Users/dantawi/Documents/SilyProcure
./database/setup_mysql.sh
```

Le script vous demandera :
- Le nom d'utilisateur MySQL (root par défaut)
- Le mot de passe MySQL

#### Option B : Création manuelle

1. **Se connecter en tant que root** :
```bash
mysql -u root -p
```

2. **Exécuter le script de création** :
```sql
-- Créer l'utilisateur
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
```

3. **Créer les tables** :
```bash
mysql -u root -p < database/silypro_create_database.sql
```

---

### Solution 2 : Utiliser root temporairement

Si vous ne pouvez pas créer l'utilisateur `soul`, modifiez le fichier `.env` :

```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_root
```

⚠️ **Attention** : Utiliser root en production n'est pas recommandé pour des raisons de sécurité.

---

### Solution 3 : Utiliser un autre utilisateur MySQL

1. **Créer un nouvel utilisateur** :
```sql
CREATE USER 'silyprocure'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON silypro.* TO 'silyprocure'@'localhost';
FLUSH PRIVILEGES;
```

2. **Modifier le fichier `.env`** :
```env
DB_USER=silyprocure
DB_PASSWORD=votre_mot_de_passe
```

---

## 🔍 Vérification

Après avoir créé l'utilisateur, testez la connexion :

```bash
mysql -u soul -pSatina2025 silypro -e "SHOW TABLES;"
```

Si cela fonctionne, vous devriez voir la liste des tables.

---

## 🚀 Redémarrer le serveur

Une fois la base de données configurée :

```bash
# Arrêter le serveur actuel (Ctrl+C ou)
pkill -f "node backend/server.js"

# Redémarrer
npm start
```

Vous devriez voir :
```
✅ Connexion à la base de données MySQL réussie
```

---

## 📝 Notes

- **Sécurité** : En production, utilisez un mot de passe fort et limitez les privilèges de l'utilisateur MySQL
- **Permissions** : L'utilisateur `soul` a tous les privilèges sur la base `silypro` uniquement
- **Backup** : Pensez à sauvegarder régulièrement votre base de données

---

## 🆘 Aide supplémentaire

Si le problème persiste :

1. Vérifiez que MySQL est en cours d'exécution :
```bash
brew services list | grep mysql
# ou
sudo systemctl status mysql
```

2. Vérifiez les logs MySQL pour plus de détails

3. Consultez la documentation MySQL pour votre système d'exploitation

