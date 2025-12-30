# 🚀 Push vers GitHub - Guide Rapide

## ✅ Remote configuré en HTTPS
Le dépôt est maintenant configuré pour utiliser HTTPS.

## 📝 Étapes pour pousser

### 1. Créer un Personal Access Token sur GitHub

1. Allez sur : **https://github.com/settings/tokens**
2. Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**
3. Donnez un nom : `SilyProcure Push`
4. Sélectionnez la permission : **`repo`** (accès complet aux dépôts)
5. Cliquez sur **"Generate token"**
6. **⚠️ IMPORTANT** : Copiez le token immédiatement (vous ne pourrez plus le voir après)

### 2. Pousser le code

Dans votre terminal, exécutez :

```bash
cd /Users/dantawi/Documents/SilyProcure
git push -u origin main
```

Quand vous serez demandé :
- **Username** : `nimbagn`
- **Password** : Collez votre **token** (pas votre mot de passe GitHub)

### 3. Sauvegarder les credentials (optionnel)

Pour ne pas avoir à entrer le token à chaque fois :

```bash
# macOS
git config --global credential.helper osxkeychain

# Puis pousser (le token sera sauvegardé)
git push -u origin main
```

## 🔄 Alternative : Créer une clé SSH

Si vous préférez utiliser SSH (plus sécurisé à long terme) :

```bash
# 1. Générer une clé SSH
ssh-keygen -t ed25519 -C "votre_email@example.com"
# Appuyez sur Entrée pour accepter l'emplacement par défaut
# Entrez un mot de passe (optionnel mais recommandé)

# 2. Démarrer l'agent SSH
eval "$(ssh-agent -s)"

# 3. Ajouter la clé
ssh-add ~/.ssh/id_ed25519

# 4. Copier la clé publique
cat ~/.ssh/id_ed25519.pub
# Copiez tout le contenu affiché

# 5. Ajouter sur GitHub
# - Allez sur https://github.com/settings/keys
# - Cliquez "New SSH key"
# - Collez la clé et sauvegardez

# 6. Changer le remote en SSH
git remote set-url origin git@github.com:nimbagn/silyprocure.git

# 7. Pousser
git push -u origin main
```

## ✅ Vérification

Après le push, vérifiez sur GitHub :
- https://github.com/nimbagn/silyprocure

Vous devriez voir tous vos fichiers !

## 📊 État actuel

- ✅ 239 fichiers commités
- ✅ Remote configuré : `https://github.com/nimbagn/silyprocure.git`
- ✅ Prêt à pousser !

