# 🔐 Accès Administrateur - SilyProcure

## ✅ Identifiants de connexion

**Email:** `admin@silyprocure.com`  
**Mot de passe:** `12345`

## 🚀 Connexion

1. Ouvrez votre navigateur
2. Allez sur la page de connexion (ex: `http://localhost:3000` ou votre URL)
3. Entrez les identifiants ci-dessus

## 🔧 Si vous ne pouvez toujours pas vous connecter

### Option 1 : Vérifier/réinitialiser avec le script

```bash
# Vérifier le compte admin
node fix_admin_access.js

# Réinitialiser le mot de passe
node fix_admin_access.js --reset-password
```

### Option 2 : Réinitialiser manuellement via la base de données

#### Pour MySQL :
```sql
USE silypro;

-- Vérifier que l'admin existe et est actif
SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com';

-- Réactiver si nécessaire
UPDATE utilisateurs SET actif = TRUE WHERE email = 'admin@silyprocure.com';

-- Réinitialiser le mot de passe (générer le hash d'abord)
-- node backend/utils/hashPassword.js "nouveaumotdepasse"
UPDATE utilisateurs SET mot_de_passe = 'HASH_GENERE' WHERE email = 'admin@silyprocure.com';
```

#### Pour PostgreSQL :
```sql
-- Vérifier que l'admin existe et est actif
SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com';

-- Réactiver si nécessaire
UPDATE utilisateurs SET actif = TRUE WHERE email = 'admin@silyprocure.com';

-- Réinitialiser le mot de passe (générer le hash d'abord)
-- node backend/utils/hashPassword.js "nouveaumotdepasse"
UPDATE utilisateurs SET mot_de_passe = 'HASH_GENERE' WHERE email = 'admin@silyprocure.com';
```

### Option 3 : Créer un nouvel utilisateur admin

```bash
# Générer un hash pour le nouveau mot de passe
node backend/utils/hashPassword.js "votrenouveaumotdepasse"
```

Puis dans la base de données :

```sql
-- MySQL ou PostgreSQL
INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
VALUES ('nouveau-admin@exemple.com', 'HASH_GENERE', 'Nom', 'Prénom', 'Administrateur', 'admin', TRUE);
```

## ⚠️ Sécurité

**IMPORTANT** : Changez le mot de passe par défaut après la première connexion !

1. Connectez-vous avec `admin@silyprocure.com` / `12345`
2. Allez dans les paramètres utilisateur
3. Changez le mot de passe

## 🔍 Vérification

Pour vérifier que tout fonctionne :

```bash
node fix_admin_access.js
```

Ce script va :
- ✅ Vérifier que le compte admin existe
- ✅ Vérifier qu'il est actif
- ✅ Tester les mots de passe courants
- ✅ Proposer de créer/réinitialiser si nécessaire

## 📋 Informations du compte

- **Email:** admin@silyprocure.com
- **Nom:** Admin
- **Prénom:** SilyProcure
- **Fonction:** Administrateur
- **Rôle:** admin
- **Statut:** Actif

---

**Dernière vérification** : Le compte admin existe et le mot de passe est `12345`

