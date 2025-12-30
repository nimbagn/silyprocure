# 🚀 Migration MySQL → PostgreSQL - Guide Complet

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la migration complète de SilyProcure de MySQL vers PostgreSQL pour le déploiement en production.

## ✅ Fichiers créés pour la migration

1. **`backend/config/database.postgresql.js`** - Configuration PostgreSQL
2. **`database/silypro_create_database_postgresql.sql`** - Schéma PostgreSQL complet
3. **`database/migrate_to_postgresql.sh`** - Script de migration automatique
4. **`package.json`** - Mis à jour avec `pg` au lieu de `mysql2`

## 🔄 Différences principales MySQL → PostgreSQL

### 1. Types de données
- `INT AUTO_INCREMENT` → `SERIAL`
- `DATETIME` → `TIMESTAMP`
- `ENUM` → `VARCHAR` avec `CHECK`
- `BOOLEAN` → `BOOLEAN` (identique)
- `TEXT` → `TEXT` (identique)

### 2. Syntaxe SQL
- `NOW()` → `CURRENT_TIMESTAMP` (identique)
- `ON UPDATE CURRENT_TIMESTAMP` → Trigger PostgreSQL
- `USE database` → `\c database` (dans psql)
- `ENGINE=InnoDB` → Supprimé (PostgreSQL utilise un seul moteur)

### 3. Requêtes
- `pool.execute()` → Compatible (wrapper créé)
- `?` placeholders → `$1, $2, $3...` (géré par pg)
- `LIMIT ?, ?` → `LIMIT $1 OFFSET $2`

## 📦 Installation et Configuration

### Étape 1 : Installer PostgreSQL

#### Sur Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Sur macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Sur CentOS/RHEL
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Étape 2 : Créer l'utilisateur et la base de données

```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Créer l'utilisateur
CREATE USER soul WITH PASSWORD 'Satina2025';

# Créer la base de données
CREATE DATABASE silypro OWNER soul;

# Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE silypro TO soul;

# Quitter
\q
```

### Étape 3 : Exécuter le script de migration

```bash
cd /Users/dantawi/Documents/SilyProcure
bash database/migrate_to_postgresql.sh
```

Ou manuellement :

```bash
# Exporter les variables d'environnement
export DB_NAME=silypro
export DB_USER=soul
export DB_PASSWORD=Satina2025
export DB_HOST=localhost
export DB_PORT=5432

# Exécuter le script SQL
psql -U soul -d silypro -f database/silypro_create_database_postgresql.sql
```

### Étape 4 : Configurer l'application

1. **Renommer le fichier de configuration** :
```bash
mv backend/config/database.js backend/config/database.mysql.js.backup
mv backend/config/database.postgresql.js backend/config/database.js
```

2. **Mettre à jour le fichier `.env`** :
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=silypro
DB_USER=soul
DB_PASSWORD=Satina2025
DB_SSL=false

# Pour production (ex: Heroku, Railway, etc.)
# DB_SSL=true
```

3. **Installer les dépendances** :
```bash
npm install
```

### Étape 5 : Tester la connexion

```bash
npm start
```

Vous devriez voir :
```
✅ Connexion à la base de données PostgreSQL réussie
```

## 🌐 Déploiement en Production

### Option 1 : Heroku

1. **Créer l'application** :
```bash
heroku create silyprocure
heroku addons:create heroku-postgresql:hobby-dev
```

2. **Configurer les variables** :
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

3. **Déployer** :
```bash
git push heroku main
```

4. **Exécuter les migrations** :
```bash
heroku run psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
```

### Option 2 : Railway

1. **Créer un nouveau projet** sur [Railway.app](https://railway.app)
2. **Ajouter PostgreSQL** via le dashboard
3. **Connecter votre dépôt GitHub**
4. **Configurer les variables d'environnement** :
   - `DB_HOST` → Automatique
   - `DB_PORT` → Automatique
   - `DB_NAME` → Automatique
   - `DB_USER` → Automatique
   - `DB_PASSWORD` → Automatique
   - `DB_SSL` → `true`

5. **Déployer** : Railway déploie automatiquement

### Option 3 : DigitalOcean App Platform

1. **Créer une nouvelle app** sur DigitalOcean
2. **Ajouter une base de données PostgreSQL**
3. **Configurer les variables d'environnement**
4. **Déployer depuis GitHub**

### Option 4 : VPS (Ubuntu/Debian)

1. **Installer PostgreSQL** :
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib nginx nodejs npm
```

2. **Configurer PostgreSQL** :
```bash
sudo -u postgres createuser -s soul
sudo -u postgres createdb silypro
sudo -u postgres psql -c "ALTER USER soul WITH PASSWORD 'Satina2025';"
```

3. **Cloner et configurer** :
```bash
git clone https://github.com/nimbagn/silyprocure.git
cd silyprocure
npm install
cp .env.example .env
# Éditer .env avec les bonnes valeurs
```

4. **Exécuter les migrations** :
```bash
psql -U soul -d silypro -f database/silypro_create_database_postgresql.sql
```

5. **Configurer PM2** :
```bash
npm install -g pm2
pm2 start backend/server.js --name silyprocure
pm2 save
pm2 startup
```

6. **Configurer Nginx** :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Adaptations nécessaires dans le code

### Requêtes SQL à adapter

Les requêtes utilisant `?` comme placeholder fonctionnent avec le wrapper créé, mais certaines requêtes spécifiques peuvent nécessiter des ajustements :

#### Exemple 1 : LIMIT avec OFFSET
```javascript
// MySQL
const [rows] = await pool.execute('SELECT * FROM table LIMIT ?, ?', [offset, limit]);

// PostgreSQL (automatique avec le wrapper)
const [rows] = await pool.execute('SELECT * FROM table LIMIT $1 OFFSET $2', [limit, offset]);
```

#### Exemple 2 : NOW() vs CURRENT_TIMESTAMP
Les deux fonctionnent, mais `CURRENT_TIMESTAMP` est préféré.

#### Exemple 3 : LAST_INSERT_ID()
```javascript
// MySQL
const [result] = await pool.execute('INSERT INTO ...');
const insertId = result.insertId;

// PostgreSQL
const [result] = await pool.query('INSERT INTO ... RETURNING id');
const insertId = result.rows[0].id;
```

## 📊 Migration des données existantes

Si vous avez des données MySQL à migrer :

### Option 1 : Export/Import SQL

1. **Exporter depuis MySQL** :
```bash
mysqldump -u soul -p silypro > backup_mysql.sql
```

2. **Convertir le SQL** (manuellement ou avec un outil) :
   - Remplacer `AUTO_INCREMENT` par `SERIAL`
   - Remplacer `DATETIME` par `TIMESTAMP`
   - Remplacer `ENUM` par `VARCHAR` avec `CHECK`
   - Adapter les requêtes `INSERT`

3. **Importer dans PostgreSQL** :
```bash
psql -U soul -d silypro -f backup_converted.sql
```

### Option 2 : Utiliser pgloader (recommandé)

```bash
# Installer pgloader
sudo apt install pgloader  # Ubuntu/Debian
brew install pgloader       # macOS

# Migrer
pgloader mysql://soul:Satina2025@localhost/silypro postgresql://soul:Satina2025@localhost/silypro
```

## ✅ Checklist de migration

- [ ] PostgreSQL installé et démarré
- [ ] Utilisateur et base de données créés
- [ ] Script de migration exécuté avec succès
- [ ] Fichier `database.js` remplacé par la version PostgreSQL
- [ ] Fichier `.env` mis à jour
- [ ] Dépendances installées (`npm install`)
- [ ] Test de connexion réussi
- [ ] Application démarre sans erreur
- [ ] Tests fonctionnels passés
- [ ] Backup de l'ancienne base MySQL créé

## 🐛 Résolution de problèmes

### Erreur : "relation does not exist"
- Vérifiez que le schéma a été créé : `\dt` dans psql
- Vérifiez les permissions : `GRANT ALL ON SCHEMA public TO soul;`

### Erreur : "password authentication failed"
- Vérifiez le fichier `pg_hba.conf`
- Vérifiez le mot de passe dans `.env`

### Erreur : "connection refused"
- Vérifiez que PostgreSQL est démarré : `sudo systemctl status postgresql`
- Vérifiez le port : `netstat -an | grep 5432`

### Erreur : "syntax error"
- Vérifiez que vous utilisez la syntaxe PostgreSQL
- Certaines fonctions MySQL n'existent pas dans PostgreSQL

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [pg (driver Node.js)](https://node-postgres.com/)
- [Migration MySQL → PostgreSQL](https://www.postgresql.org/docs/current/migration.html)

## 🔐 Sécurité en production

1. **Changer les mots de passe par défaut**
2. **Utiliser SSL pour les connexions** (`DB_SSL=true`)
3. **Restreindre les accès réseau**
4. **Activer le firewall**
5. **Faire des backups réguliers**

## 📞 Support

En cas de problème, consultez :
- Les logs PostgreSQL : `/var/log/postgresql/`
- Les logs de l'application : `pm2 logs` ou `npm start`
- Le fichier `.env` pour vérifier la configuration

---

**Migration créée le** : 2025-01-01  
**Version PostgreSQL cible** : 12+  
**Compatibilité** : Node.js 14+

