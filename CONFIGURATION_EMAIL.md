# 📧 Configuration Email pour SilyProcure

## Configuration requise

Pour activer l'envoi d'emails de notification et de confirmation pour les demandes de devis, vous devez configurer les variables d'environnement suivantes dans votre fichier `.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

# Email de destination pour les notifications admin
ADMIN_EMAIL=admin@silyprocure.com
```

## Configuration Gmail

### 1. Activer l'authentification à deux facteurs
- Allez dans votre compte Google : https://myaccount.google.com/
- Activez l'authentification à deux facteurs

### 2. Créer un mot de passe d'application
1. Allez sur : https://myaccount.google.com/apppasswords
2. Sélectionnez "Application" : "Mail"
3. Sélectionnez "Appareil" : "Autre (nom personnalisé)" et entrez "SilyProcure"
4. Cliquez sur "Générer"
5. Copiez le mot de passe généré (16 caractères)
6. Utilisez ce mot de passe dans `SMTP_PASS` (pas votre mot de passe Gmail normal)

### 3. Configuration dans .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Le mot de passe d'application généré
ADMIN_EMAIL=votre-email@gmail.com
```

## Configuration Outlook/Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
ADMIN_EMAIL=votre-email@outlook.com
```

## Configuration serveur SMTP personnalisé

```env
SMTP_HOST=smtp.votre-serveur.com
SMTP_PORT=587
SMTP_SECURE=false  # true pour le port 465
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASS=votre-mot-de-passe
ADMIN_EMAIL=admin@votre-domaine.com
```

## Test de la configuration

Une fois la configuration effectuée, testez en créant une demande de devis depuis la page d'accueil (`home.html`). 

Si la configuration n'est pas correcte, vous verrez un avertissement dans les logs du serveur :
```
⚠️  Configuration SMTP non définie. Email non envoyé.
💡 Ajoutez SMTP_USER et SMTP_PASS dans votre fichier .env
```

## Dépannage

### Erreur "Invalid login"
- Vérifiez que vous utilisez un mot de passe d'application (Gmail) et non votre mot de passe normal
- Vérifiez que l'authentification à deux facteurs est activée (Gmail)

### Erreur "Connection timeout"
- Vérifiez que le port SMTP n'est pas bloqué par votre firewall
- Essayez avec `SMTP_SECURE=true` et `SMTP_PORT=465` pour Gmail

### Emails non reçus
- Vérifiez les dossiers spam/courrier indésirable
- Vérifiez les logs du serveur pour les erreurs
- Testez avec un autre service email

## Notes importantes

- ⚠️ **Ne commitez jamais votre fichier `.env`** dans Git
- 🔒 Gardez vos mots de passe d'application sécurisés
- 📝 Les emails sont envoyés en arrière-plan et n'empêchent pas l'enregistrement de la demande si l'envoi échoue

