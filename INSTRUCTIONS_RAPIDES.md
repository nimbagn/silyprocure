# 🚀 Instructions Rapides - Corriger la Connexion MySQL

## ⚡ Solution la plus rapide (2 minutes)

### Étape 1 : Modifier le fichier .env

Ouvrez le fichier `.env` et modifiez ces deux lignes :

```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_root_ici
```

**Remplacez `votre_mot_de_passe_root_ici` par votre vrai mot de passe MySQL root.**

### Étape 2 : Relancer le serveur

```bash
npm start
```

C'est tout ! Le serveur devrait maintenant se connecter à MySQL.

---

## 🔧 Alternative : Créer l'utilisateur 'soul'

Si vous préférez créer l'utilisateur `soul` (recommandé pour la sécurité) :

### Étape 1 : Se connecter à MySQL

```bash
mysql -u root -p
```

Entrez votre mot de passe root quand demandé.

### Étape 2 : Exécuter ces commandes SQL

```sql
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Étape 3 : Créer les tables (si la base est vide)

```bash
mysql -u root -p < database/silypro_create_database.sql
```

### Étape 4 : Vérifier que .env utilise 'soul'

Le fichier `.env` devrait contenir :
```env
DB_USER=soul
DB_PASSWORD=Satina2025
```

### Étape 5 : Relancer le serveur

```bash
npm start
```

---

## ✅ Vérification

Après avoir modifié le `.env`, vous devriez voir au démarrage :

```
✅ Connexion à la base de données MySQL réussie
```

Au lieu de :

```
❌ Erreur de connexion à la base de données
```

---

## 🔐 Identifiants de connexion à l'application

Une fois le serveur démarré, connectez-vous avec :

- **Email :** `admin@silyprocure.com`
- **Mot de passe :** `password`

---

## 🆘 Si vous avez oublié le mot de passe root MySQL

### Sur macOS avec Homebrew :

1. Arrêter MySQL :
```bash
brew services stop mysql
```

2. Démarrer MySQL en mode safe :
```bash
mysqld_safe --skip-grant-tables &
```

3. Se connecter sans mot de passe :
```bash
mysql -u root
```

4. Réinitialiser le mot de passe :
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nouveau_mot_de_passe';
FLUSH PRIVILEGES;
EXIT;
```

5. Redémarrer MySQL normalement :
```bash
brew services restart mysql
```

---

**Note :** La solution la plus rapide est de modifier le `.env` pour utiliser root temporairement.

