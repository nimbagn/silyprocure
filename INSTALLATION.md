# Guide d'installation SilyProcure

## 📋 Prérequis

- **Node.js** : v14 ou supérieur ([Télécharger](https://nodejs.org/))
- **MySQL** : v8 ou supérieur ([Télécharger](https://dev.mysql.com/downloads/))
- **npm** : Inclus avec Node.js

## 🚀 Installation étape par étape

### 1. Installer les dépendances Node.js

```bash
cd /Users/dantawi/Documents/SilyProcure
npm install
```

### 2. Créer la base de données

```bash
# Option 1 : Script automatique
cd database
./install.sh

# Option 2 : Manuel
mysql -u root -p < database/silypro_create_database.sql
```

### 3. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env si nécessaire (les valeurs par défaut fonctionnent)
```

### 4. Mettre à jour le mot de passe admin

Le script SQL crée un utilisateur admin avec le mot de passe "password" (non hashé).

Pour le hasher correctement :

```bash
# Hasher un nouveau mot de passe
node backend/utils/hashPassword.js "VotreNouveauMotDePasse"

# Copier le hash généré et mettre à jour dans MySQL
mysql -u soul -pSatina2025 silypro
```

Puis dans MySQL :
```sql
UPDATE utilisateurs 
SET mot_de_passe = 'VOTRE_HASH_GENERE' 
WHERE email = 'admin@silyprocure.com';
```

### 5. Démarrer le serveur

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

### 6. Accéder à l'application

Ouvrir dans le navigateur : **http://localhost:3000**

**Identifiants par défaut** :
- Email : `admin@silyprocure.com`
- Mot de passe : `password` (à changer après la première connexion)

## ✅ Vérification

### Vérifier que MySQL fonctionne

```bash
mysql -u soul -pSatina2025 -e "USE silypro; SHOW TABLES;"
```

Vous devriez voir 25 tables listées.

### Vérifier que Node.js fonctionne

```bash
node --version
npm --version
```

### Tester l'API

```bash
# Tester la connexion
curl http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silyprocure.com","mot_de_passe":"password"}'
```

## 🔧 Dépannage

### Erreur de connexion MySQL

- Vérifier que MySQL est démarré : `mysql.server start` (macOS)
- Vérifier les identifiants dans `.env`
- Vérifier que l'utilisateur `soul` existe et a les permissions

### Erreur "Cannot find module"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 déjà utilisé

Modifier le port dans `.env` :
```
PORT=3001
```

## 📚 Documentation

- **Base de données** : `database/README_DATABASE.md`
- **API** : `README_PROJET.md`
- **Charte graphique** : `charte-graphique/mini-charte-pro-confiance.md`

---

**Besoin d'aide ?** Consultez les fichiers README dans chaque dossier.

