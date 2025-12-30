# 🔍 Vérifier le Mot de Passe Admin

## ⚠️ Problème de Connexion

Je ne peux pas me connecter à MySQL depuis cet environnement. Voici comment vérifier vous-même :

## 🚀 Méthode 1 : Script Node.js (Recommandé)

Exécutez ce script sur votre machine :

```bash
cd /Users/dantawi/Documents/SilyProcure
node trouver_mot_de_passe_admin.js
```

OU

```bash
node verifier_admin_local.js
```

## 🛠️ Méthode 2 : Via MySQL Directement

### Étape 1 : Connectez-vous à MySQL

```bash
mysql -u soul -pSatina2025 silypro
```

OU si cela ne fonctionne pas :

```bash
mysql -u root -p silypro
```

### Étape 2 : Vérifiez l'utilisateur admin

```sql
SELECT email, nom, prenom, role, actif, LEFT(mot_de_passe, 30) as hash_preview
FROM utilisateurs 
WHERE email = 'admin@silyprocure.com';
```

### Étape 3 : Testez les mots de passe avec Node.js

Créez un fichier `test_pwd.js` :

```javascript
const bcrypt = require('bcryptjs');

// Copiez le hash complet depuis MySQL (colonne mot_de_passe)
const hashFromDB = 'COLLER_LE_HASH_ICI';

const passwords = [
    '12345',
    'password', 
    'admin123',
    'admin',
    'Admin123',
    'Password123',
    'silyprocure',
    'SilyProcure123',
    'admin2024',
    'Satina2025'
];

console.log('🔐 Test des mots de passe...\n');

passwords.forEach((pwd, i) => {
    bcrypt.compare(pwd, hashFromDB, (err, result) => {
        if (result) {
            console.log(`✅ MOT DE PASSE TROUVÉ: "${pwd}"`);
            console.log('\n📋 Identifiants:');
            console.log('   Email: admin@silyprocure.com');
            console.log('   Mot de passe: ' + pwd);
        } else {
            console.log(`${(i+1).toString().padStart(2, ' ')}. "${pwd}" → ❌`);
        }
    });
});
```

Puis exécutez :
```bash
node test_pwd.js
```

## 🔧 Méthode 3 : Réinitialiser Directement

Si vous ne trouvez pas le mot de passe, réinitialisez-le :

```bash
node database/fix_admin_password.js
```

Cela définira le mot de passe à **`12345`**

## 📋 Mots de Passe les Plus Probables

1. **`12345`** ⭐ (utilisé dans fix_admin_password.js)
2. **`password`** (mentionné dans IDENTIFIANTS_ADMIN.md)
3. **`admin123`** (mentionné dans update_admin_password_final.js)
4. **`admin`**
5. **`Satina2025`** (mot de passe MySQL, peut-être réutilisé)

## ✅ Après Avoir Trouvé

Une fois le mot de passe trouvé, connectez-vous à :
- **URL** : `http://localhost:3000`
- **Email** : `admin@silyprocure.com`
- **Mot de passe** : (celui trouvé)

## 🐛 Si MySQL n'est pas accessible

Vérifiez que MySQL est en cours d'exécution :

```bash
# macOS
brew services list | grep mysql
# ou
sudo /usr/local/mysql/support-files/mysql.server status

# Démarrer si nécessaire
brew services start mysql
# ou
sudo /usr/local/mysql/support-files/mysql.server start
```

