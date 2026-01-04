# Guide : Test de création d'utilisateur

## Corrections apportées

### 1. Lien vers la page d'accueil
- ✅ Ajout d'un lien "Accueil" dans la sidebar (en haut, avant Dashboard)
- ✅ Cliquez sur "Accueil" pour retourner à `home.html`

### 2. Correction de l'API utilisateurs
- ✅ Correction de l'URL API : `/api/users` → `/api/utilisateurs`
- ✅ Le bouton "Créer un utilisateur" devrait maintenant fonctionner

## Test manuel

### 1. Accéder à la page d'accueil

**Depuis la sidebar :**
1. Connectez-vous avec le compte admin
2. Dans la sidebar, cliquez sur "Accueil" (icône 🏠, en haut)
3. Vous serez redirigé vers `home.html`

**Depuis l'URL :**
```
https://silyprocure.onrender.com/home.html
```

### 2. Tester la création d'utilisateur

**Étape 1 : Se connecter en tant qu'admin**
- Email: `admin@silyprocure.com`
- Mot de passe: `admin123`

**Étape 2 : Accéder à la gestion des utilisateurs**
- Cliquez sur "Utilisateurs" dans la sidebar (en bas, section admin)
- Ou accédez directement à : `https://silyprocure.onrender.com/utilisateurs.html`

**Étape 3 : Créer un utilisateur**
1. Cliquez sur le bouton "Créer un utilisateur" (en haut à droite)
2. Remplissez le formulaire :
   - **Nom** * : Test
   - **Prénom** * : User
   - **Email** * : test@example.com
   - **Mot de passe** * : Test123!
   - **Téléphone** : +224 622 69 24 33 (optionnel)
   - **Fonction** : Testeur (optionnel)
   - **Département** : IT (optionnel)
   - **Rôle** : viewer (par défaut)
3. Cliquez sur "Créer"
4. Vous devriez voir un message de succès
5. L'utilisateur devrait apparaître dans la liste

**Étape 4 : Vérifier la création**
- L'utilisateur devrait apparaître dans le tableau
- Vous pouvez cliquer sur "Modifier" pour voir les détails
- Vous pouvez activer/désactiver l'utilisateur

## Test automatisé

### Utiliser le script de test

```bash
node test_create_user.js [URL] [email] [password]
```

**Exemple :**
```bash
node test_create_user.js https://silyprocure.onrender.com admin@silyprocure.com admin123
```

Le script va :
1. Se connecter en tant qu'admin
2. Créer un utilisateur de test
3. Vérifier que l'utilisateur a été créé
4. Afficher les détails de l'utilisateur créé

## Dépannage

### Le lien "Accueil" n'apparaît pas
1. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
2. Rechargez la page
3. Vérifiez que vous êtes connecté

### Le bouton "Créer un utilisateur" ne fonctionne pas
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs JavaScript
3. Vérifiez que l'API est appelée : `/api/utilisateurs` (pas `/api/users`)
4. Vérifiez les logs Render pour les erreurs backend

### Erreur lors de la création
1. Vérifiez que tous les champs obligatoires sont remplis
2. Vérifiez que l'email n'est pas déjà utilisé
3. Vérifiez la console pour les erreurs
4. Vérifiez les logs Render

### L'utilisateur n'apparaît pas dans la liste
1. Rechargez la page
2. Vérifiez que l'utilisateur a bien été créé (logs backend)
3. Vérifiez que vous êtes toujours connecté

## Rôles disponibles

- **admin** : Administrateur (accès complet)
- **superviseur** : Superviseur
- **acheteur** : Acheteur
- **approbateur** : Approbateur
- **comptable** : Comptable
- **viewer** : Visualiseur (lecture seule)

## Notes

- Les mots de passe doivent respecter les règles de sécurité (minimum 8 caractères recommandé)
- Les emails doivent être uniques
- Seuls les admins peuvent créer des utilisateurs
- Les utilisateurs créés sont actifs par défaut

