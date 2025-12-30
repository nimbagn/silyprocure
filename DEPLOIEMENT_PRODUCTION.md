# 🚀 Guide de Déploiement en Production - SilyProcure

## 📋 Vue d'ensemble

Ce guide vous accompagne dans le déploiement de SilyProcure en production avec PostgreSQL.

## 🎯 Prérequis

- Node.js 14+ installé
- PostgreSQL 12+ installé
- Git installé
- Compte sur une plateforme de déploiement (optionnel)

## 📦 Étapes de déploiement

### 1. Préparation locale

```bash
# Cloner le dépôt
git clone https://github.com/nimbagn/silyprocure.git
cd silyprocure

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.postgresql.example .env
# Éditer .env avec vos valeurs
```

### 2. Configuration PostgreSQL

```bash
# Créer l'utilisateur et la base de données
sudo -u postgres psql
CREATE USER soul WITH PASSWORD 'Satina2025';
CREATE DATABASE silypro OWNER soul;
GRANT ALL PRIVILEGES ON DATABASE silypro TO soul;
\q

# Exécuter le schéma
psql -U soul -d silypro -f database/silypro_create_database_postgresql.sql
```

### 3. Migration de la configuration

```bash
# Activer PostgreSQL
mv backend/config/database.js backend/config/database.mysql.js.backup
mv backend/config/database.postgresql.js backend/config/database.js
```

### 4. Test local

```bash
npm start
# Vérifier que vous voyez : ✅ Connexion à la base de données PostgreSQL réussie
```

## 🌐 Déploiement sur différentes plateformes

### Heroku

1. **Installation Heroku CLI** :
```bash
# macOS
brew install heroku/brew/heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Créer l'application** :
```bash
heroku login
heroku create silyprocure
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Configurer les variables** :
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
```

4. **Déployer** :
```bash
git push heroku main
```

5. **Exécuter les migrations** :
```bash
heroku run psql $DATABASE_URL -f database/silypro_create_database_postgresql.sql
```

### Railway

1. **Créer un compte** sur [railway.app](https://railway.app)
2. **Nouveau projet** → **Deploy from GitHub repo**
3. **Ajouter PostgreSQL** via le dashboard
4. **Variables d'environnement** (automatiques) :
   - `DATABASE_URL` → Automatique
   - `NODE_ENV=production`
   - `JWT_SECRET` → Générer un secret
   - `PORT` → Automatique

5. **Déploiement automatique** après push sur GitHub

### DigitalOcean App Platform

1. **Créer une app** sur DigitalOcean
2. **Connecter GitHub**
3. **Ajouter PostgreSQL** (Managed Database)
4. **Configurer** :
   - Build Command : `npm install`
   - Run Command : `npm start`
   - Environment Variables : Configurer manuellement

### VPS (Ubuntu/Debian)

#### Installation des dépendances

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt install -y nginx

# Installer PM2
sudo npm install -g pm2
```

#### Configuration PostgreSQL

```bash
# Créer l'utilisateur
sudo -u postgres createuser -s soul
sudo -u postgres psql -c "ALTER USER soul WITH PASSWORD 'Satina2025';"

# Créer la base de données
sudo -u postgres createdb silypro -O soul
```

#### Déploiement de l'application

```bash
# Cloner le dépôt
cd /var/www
sudo git clone https://github.com/nimbagn/silyprocure.git
sudo chown -R $USER:$USER silyprocure
cd silyprocure

# Installer les dépendances
npm install --production

# Configurer l'environnement
cp .env.postgresql.example .env
nano .env  # Éditer avec vos valeurs

# Activer PostgreSQL
mv backend/config/database.js backend/config/database.mysql.js.backup
mv backend/config/database.postgresql.js backend/config/database.js

# Exécuter les migrations
psql -U soul -d silypro -f database/silypro_create_database_postgresql.sql

# Démarrer avec PM2
pm2 start backend/server.js --name silyprocure
pm2 save
pm2 startup  # Suivre les instructions
```

#### Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/silyprocure
```

Contenu :

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Taille maximale des uploads
    client_max_body_size 10M;
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/silyprocure /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## 🔐 Sécurité en production

### 1. Variables d'environnement

**Ne jamais** commiter le fichier `.env` ! Vérifiez qu'il est dans `.gitignore`.

### 2. Mots de passe forts

- Base de données : Utiliser un mot de passe fort (min 16 caractères)
- JWT_SECRET : Générer avec `openssl rand -base64 32`

### 3. Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. PostgreSQL

```bash
# Éditer pg_hba.conf pour restreindre les accès
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Autoriser seulement localhost
host    silypro    soul    127.0.0.1/32    md5
```

### 5. Backups réguliers

```bash
# Script de backup quotidien
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U soul silypro > /backups/silypro_$DATE.sql
# Garder seulement les 7 derniers backups
find /backups -name "silypro_*.sql" -mtime +7 -delete
```

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs silyprocure
```

### PostgreSQL Monitoring

```bash
# Voir les connexions actives
psql -U soul -d silypro -c "SELECT * FROM pg_stat_activity;"

# Taille de la base de données
psql -U soul -d silypro -c "SELECT pg_size_pretty(pg_database_size('silypro'));"
```

## 🔄 Mises à jour

```bash
# Sur le serveur
cd /var/www/silyprocure
git pull origin main
npm install --production
pm2 restart silyprocure
```

## 🐛 Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs silyprocure
# ou
npm start  # En mode développement pour voir les erreurs
```

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Tester la connexion
psql -U soul -d silypro -c "SELECT 1;"
```

### Erreur 502 Bad Gateway

- Vérifier que l'application tourne : `pm2 list`
- Vérifier les logs Nginx : `sudo tail -f /var/log/nginx/error.log`
- Vérifier le port dans la configuration Nginx

## 📞 Support

- Documentation : `MIGRATION_POSTGRESQL.md`
- Issues GitHub : https://github.com/nimbagn/silyprocure/issues

---

**Dernière mise à jour** : 2025-01-01

