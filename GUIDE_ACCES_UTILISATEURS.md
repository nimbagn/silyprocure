# Guide : Accès à la gestion des utilisateurs

## Problème

Vous ne voyez pas la possibilité de créer des utilisateurs.

## Vérifications

### 1. Vérifier que vous êtes connecté en tant qu'admin

1. Connectez-vous avec le compte admin :
   - Email: `admin@silyprocure.com`
   - Mot de passe: `admin123`

2. Vérifiez votre rôle dans la console du navigateur :
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   ```
   Le champ `role` doit être `"admin"`.

### 2. Vérifier que le menu "Utilisateurs" est visible

Le menu "Utilisateurs" devrait apparaître dans la sidebar uniquement si vous êtes admin. Il se trouve :
- En bas de la sidebar
- Après un séparateur
- Avec l'icône 👥 (users-cog)

Si le menu n'apparaît pas :
1. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
2. Reconnectez-vous
3. Vérifiez que `user.role === 'admin'` dans la console

### 3. Accéder directement à la page

Si le menu n'apparaît pas, vous pouvez accéder directement à :
```
https://silyprocure.onrender.com/utilisateurs.html
```

La page devrait :
- Vérifier automatiquement que vous êtes admin
- Rediriger vers le dashboard si vous n'êtes pas admin
- Afficher le bouton "Créer un utilisateur" en haut à droite

### 4. Vérifier le bouton "Créer un utilisateur"

Le bouton devrait être visible en haut de la page `utilisateurs.html`, à droite du titre "Gestion des Utilisateurs".

Si le bouton n'apparaît pas :
1. Vérifiez la console du navigateur pour les erreurs JavaScript
2. Vérifiez que Font Awesome est chargé (pour l'icône)
3. Vérifiez que vous êtes bien admin

### 5. Tester la création d'utilisateur

1. Cliquez sur "Créer un utilisateur"
2. Un modal devrait s'ouvrir avec un formulaire
3. Remplissez les champs :
   - Nom *
   - Prénom *
   - Email *
   - Mot de passe *
   - Téléphone (optionnel)
   - Fonction (optionnel)
   - Département (optionnel)
   - Rôle (par défaut: viewer)
4. Cliquez sur "Créer"

## Rôles disponibles

- **admin** : Administrateur (accès complet)
- **superviseur** : Superviseur (nouveau rôle)
- **acheteur** : Acheteur
- **approbateur** : Approbateur
- **comptable** : Comptable
- **viewer** : Visualiseur (lecture seule)

## Dépannage

### Le menu "Utilisateurs" n'apparaît pas

1. Vérifiez dans la console :
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Role:', user.role);
   ```

2. Si le rôle n'est pas "admin", reconnectez-vous avec le compte admin

3. Vérifiez que `sidebar.js` charge correctement :
   - Ouvrez la console
   - Vérifiez qu'il n'y a pas d'erreurs JavaScript

### Le bouton "Créer un utilisateur" n'apparaît pas

1. Vérifiez que vous êtes sur la page `utilisateurs.html`
2. Vérifiez la console pour les erreurs
3. Vérifiez que Font Awesome est chargé (icône)

### Erreur lors de la création

1. Vérifiez que tous les champs obligatoires sont remplis
2. Vérifiez que l'email n'est pas déjà utilisé
3. Vérifiez la console pour les erreurs API
4. Vérifiez les logs Render pour les erreurs backend

