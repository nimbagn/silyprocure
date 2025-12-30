# 🔍 Trouver le Mot de Passe Admin

## 🚀 Méthode 1 : Script Node.js (Recommandé)

Exécutez ce script depuis votre terminal :

```bash
cd /Users/dantawi/Documents/SilyProcure
node trouver_mot_de_passe_admin.js
```

Le script va :
1. Se connecter à la base de données
2. Tester automatiquement tous les mots de passe possibles
3. Afficher le mot de passe qui fonctionne

## 🛠️ Méthode 2 : Via MySQL Directement

### Étape 1 : Voir le hash actuel

```sql
USE silypro;
SELECT email, LEFT(mot_de_passe, 30) as hash_preview 
FROM utilisateurs 
WHERE email = 'admin@silyprocure.com';
```

### Étape 2 : Tester manuellement avec Node.js

Créez un fichier `test_password.js` :

```javascript
const bcrypt = require('bcryptjs');

// Récupérez le hash depuis MySQL (voir étape 1)
const hashFromDB = 'VOTRE_HASH_ICI';

// Testez les mots de passe
const passwords = ['12345', 'password', 'admin123', 'admin', 'Admin123'];

passwords.forEach(pwd => {
    bcrypt.compare(pwd, hashFromDB, (err, result) => {
        if (result) {
            console.log('✅ Mot de passe trouvé:', pwd);
        }
    });
});
```

Puis exécutez :
```bash
node test_password.js
```

## 🔧 Méthode 3 : Réinitialiser le Mot de Passe

Si vous ne trouvez pas le mot de passe, réinitialisez-le :

### Option A : Avec le script existant

```bash
node database/fix_admin_password.js
```

Cela définira le mot de passe à **`12345`**

### Option B : Créer un nouveau mot de passe

1. Générez un hash pour votre nouveau mot de passe :
```bash
node backend/utils/hashPassword.js "VotreNouveauMotDePasse"
```

2. Mettez à jour dans MySQL :
```sql
USE silypro;
UPDATE utilisateurs 
SET mot_de_passe = 'HASH_GENERE_CI_DESSUS'
WHERE email = 'admin@silyprocure.com';
```

## 📋 Mots de Passe à Tester (par ordre de probabilité)

1. **`12345`** - Le plus probable (utilisé dans fix_admin_password.js)
2. **`password`** - Mentionné dans IDENTIFIANTS_ADMIN.md
3. **`admin123`** - Mentionné dans update_admin_password_final.js
4. **`admin`** - Mot de passe simple
5. **`Admin123`** - Variante avec majuscule
6. **`Password123`** - Variante avec majuscule
7. **`silyprocure`** - Nom du projet
8. **`SilyProcure123`** - Nom du projet + chiffres

## ✅ Après Avoir Trouvé le Mot de Passe

Une fois que vous avez le mot de passe, vous pouvez :

1. **Vous connecter** à `http://localhost:3000`
2. **Changer le mot de passe** depuis l'interface (si disponible)
3. **Ou le noter** pour référence future

## 🐛 Dépannage

### Erreur : "Can't connect to MySQL"

**Solution** : Vérifiez que MySQL est en cours d'exécution :
```bash
# macOS
brew services list | grep mysql
# ou
sudo /usr/local/mysql/support-files/mysql.server status
```

### Erreur : "Access denied"

**Solution** : Vérifiez les identifiants dans `.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=soul
DB_PASSWORD=Satina2025
```

### Aucun utilisateur trouvé

**Solution** : Créez l'utilisateur admin :
```bash
node database/check_admin.js
```

## 📝 Note Importante

⚠️ **Sécurité** : Les mots de passe sont stockés sous forme de hash (bcrypt). On ne peut pas "décrypter" un hash, on ne peut que tester des mots de passe jusqu'à trouver celui qui correspond.

