# 🔐 Identifiants Administrateur - SilyProcure

## Identifiants par défaut

**Email:** `admin@silyprocure.com`  
**Mot de passe:** `password`

## ⚠️ IMPORTANT - SÉCURITÉ

**Ces identifiants sont par défaut et doivent être changés en production !**

## Comment changer le mot de passe admin

### Option 1 : Via l'interface (si disponible)
1. Connectez-vous avec les identifiants admin
2. Allez dans les paramètres utilisateur
3. Changez le mot de passe

### Option 2 : Via la base de données

1. Générez un nouveau hash de mot de passe :
```bash
node backend/utils/hashPassword.js "VotreNouveauMotDePasse"
```

2. Mettez à jour dans MySQL :
```sql
USE silypro;
UPDATE utilisateurs 
SET mot_de_passe = 'VOTRE_HASH_GENERE'
WHERE email = 'admin@silyprocure.com';
```

### Option 3 : Utiliser le script SQL

Un script est disponible dans `database/update_admin_password.sql` pour mettre à jour le mot de passe.

## Informations utilisateur

- **Nom:** Admin
- **Prénom:** SilyProcure
- **Fonction:** Administrateur
- **Rôle:** admin
- **Statut:** Actif

## Créer un nouvel utilisateur admin

```sql
USE silypro;

-- Générer d'abord le hash avec: node backend/utils/hashPassword.js "motdepasse"
INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
VALUES ('nouveau-admin@exemple.com', 'HASH_GENERE', 'Nom', 'Prénom', 'Administrateur', 'admin', TRUE);
```

## Vérifier les utilisateurs admin

```sql
SELECT email, nom, prenom, role, actif 
FROM utilisateurs 
WHERE role = 'admin';
```


