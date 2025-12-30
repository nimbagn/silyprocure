# 🚀 Solution Rapide - Connexion MySQL

## ⚡ Solution la plus rapide

### Option 1 : Script interactif (Recommandé)

```bash
cd /Users/dantawi/Documents/SilyProcure
./database/create_user_interactive.sh
```

Le script vous demandera le mot de passe MySQL root et créera automatiquement :
- L'utilisateur `soul`
- La base de données `silypro`
- Les tables si elles n'existent pas

---

### Option 2 : Utiliser root temporairement

Si vous ne pouvez pas créer l'utilisateur `soul`, modifiez le fichier `.env` pour utiliser root :

```bash
# Modifier .env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_root
```

⚠️ **Note** : N'oubliez pas de créer l'utilisateur `soul` plus tard pour la sécurité.

---

### Option 3 : Création manuelle via MySQL

1. **Ouvrir MySQL** :
```bash
mysql -u root -p
```

2. **Exécuter ces commandes** :
```sql
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Créer les tables** :
```bash
mysql -u root -p < database/silypro_create_database.sql
```

---

## ✅ Vérification

Après avoir créé l'utilisateur, testez :

```bash
mysql -u soul -pSatina2025 silypro -e "SHOW TABLES;"
```

---

## 🔄 Redémarrer le serveur

```bash
# Arrêter
pkill -f "node backend/server.js"

# Redémarrer
npm start
```

Vous devriez voir :
```
✅ Connexion à la base de données MySQL réussie
```

---

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifier que MySQL est en cours d'exécution** :
```bash
brew services list | grep mysql
# ou
ps aux | grep mysql
```

2. **Vérifier les permissions** :
```bash
ls -la /usr/local/var/mysql/
```

3. **Consulter les logs MySQL** :
```bash
tail -f /usr/local/var/mysql/*.err
```

