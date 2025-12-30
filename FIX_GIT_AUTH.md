# 🔧 Correction de l'authentification Git

## Problème
Git utilise les credentials de "dantawi" au lieu de "nimbagn", ce qui cause l'erreur 403.

## ✅ Solution : Utiliser un Personal Access Token

### 1. Créer un token sur GitHub (compte nimbagn)

1. Connectez-vous sur GitHub avec le compte **nimbagn**
2. Allez sur : **https://github.com/settings/tokens**
3. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
4. Donnez un nom : `SilyProcure Push Token`
5. Sélectionnez l'expiration (90 jours recommandé)
6. **Cochez la permission** : `repo` (accès complet aux dépôts)
7. Cliquez sur **"Generate token"**
8. **⚠️ COPIEZ LE TOKEN IMMÉDIATEMENT** (vous ne pourrez plus le voir)

### 2. Pousser avec le token

```bash
cd /Users/dantawi/Documents/SilyProcure
git push -u origin main
```

Quand demandé :
- **Username** : `nimbagn`
- **Password** : Collez votre **token** (pas votre mot de passe)

### 3. Sauvegarder le token dans le keychain (optionnel)

Pour éviter de retaper le token à chaque fois :

```bash
# Configurer le credential helper
git config --global credential.helper osxkeychain

# Pousser (le token sera sauvegardé)
git push -u origin main
# Username: nimbagn
# Password: [votre token]
```

## 🔄 Alternative : Supprimer les anciens credentials

Si vous voulez supprimer complètement les anciens credentials du keychain :

```bash
# Ouvrir le Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Chercher "github.com" et supprimer les entrées
# OU via la ligne de commande :
security delete-internet-password -s github.com
```

## ✅ Vérification

Après le push réussi, vérifiez :
- https://github.com/nimbagn/silyprocure

## 📝 Note importante

Le token remplace votre mot de passe pour Git. Gardez-le secret et ne le partagez jamais.

