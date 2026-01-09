# 🔧 Configuration pour Base de Données PostgreSQL Locale

## Modifications Effectuées

J'ai corrigé le code pour qu'il utilise automatiquement PostgreSQL local par défaut.

### 1. Configuration de la Base de Données (`backend/config/database.js`)

- **Par défaut** : PostgreSQL local (au lieu de MySQL)
- **Détection automatique** :
  - Si `DATABASE_URL` est défini → PostgreSQL (Render/production)
  - Si `DB_TYPE=postgresql` → PostgreSQL
  - Si `DB_TYPE=mysql` → MySQL
  - **Sinon** → PostgreSQL local (par défaut)

### 2. Correction des Requêtes SQL (`backend/routes/dashboard.js`)

- Utilisation de placeholders `?` compatibles avec MySQL et PostgreSQL
- Le wrapper de `database.js` convertit automatiquement `?` en `$1` pour PostgreSQL
- Utilisation de fonctions SQL compatibles (EXTRACT, TO_CHAR, etc.)
- Ajout de vérification de connexion avant les requêtes

### 3. Paramètres de Connexion par Défaut

**MySQL Local :**
```javascript
host: 'localhost'
port: 3306
database: 'silypro'
user: 'soul'
password: 'Satina2025'
```

**PostgreSQL Render (via DATABASE_URL) :**
- Détecté automatiquement depuis `DATABASE_URL`

## Configuration

### Local (MySQL)

Par défaut, le système utilise MySQL. Créez un fichier `.env` dans `backend/` si nécessaire :

```env
# Configuration Base de Données MySQL Locale
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=soul
DB_PASSWORD=Satina2025

# JWT Secret (OBLIGATOIRE)
JWT_SECRET=votre-secret-tres-securise

# Port du serveur
PORT=3000
```

### Production (PostgreSQL sur Render)

Sur Render, définissez la variable d'environnement `DATABASE_URL` dans les paramètres du service. Le système détectera automatiquement PostgreSQL.

## Vérification

### En Local (MySQL)
Au démarrage du backend, vous devriez voir :
```
📊 Utilisation de MySQL
✅ Connexion à la base de données MySQL réussie
```

### En Production (PostgreSQL)
Au démarrage du backend, vous devriez voir :
```
📊 Utilisation de PostgreSQL
✅ Connexion à la base de données PostgreSQL réussie
```

## Conversion Automatique

Le fichier `backend/config/database.js` contient un wrapper qui convertit automatiquement :
- Les placeholders `?` (MySQL) en `$1, $2, ...` (PostgreSQL)
- Les fonctions SQL MySQL en équivalents PostgreSQL
- Les syntaxes spécifiques (EXTRACT, TO_CHAR, INTERVAL, etc.)

Vous pouvez donc écrire vos requêtes avec la syntaxe MySQL, elles seront automatiquement converties pour PostgreSQL si nécessaire.

## Test de Connexion

Le dashboard vérifie maintenant la connexion à la base de données avant d'exécuter les requêtes. Si la connexion échoue, vous verrez un message d'erreur clair dans les logs du serveur.

