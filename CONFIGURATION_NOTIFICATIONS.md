# 📱 Configuration des Notifications (SMS/WhatsApp/Email)

## Vue d'ensemble

SilyProcure permet d'envoyer des notifications aux clients après validation de leur demande de devis via :
- **Email** (déjà configuré)
- **SMS** (nécessite un service tiers)
- **WhatsApp** (nécessite un service tiers)

## Configuration Email

Voir `CONFIGURATION_EMAIL.md` pour la configuration complète.

## Configuration SMS

### Option 1 : Twilio (Recommandé)

1. Créer un compte sur [Twilio](https://www.twilio.com/)
2. Récupérer vos identifiants :
   - Account SID
   - Auth Token
   - Numéro de téléphone Twilio

3. Installer le package :
```bash
npm install twilio
```

4. Ajouter dans `.env` :
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

5. Décommenter le code dans `backend/utils/notificationService.js` (fonction `sendSMSNotification`)

### Option 2 : Vonage (Nexmo)

1. Créer un compte sur [Vonage](https://www.vonage.com/)
2. Installer le package :
```bash
npm install @vonage/server-sdk
```

3. Ajouter dans `.env` :
```env
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM_NUMBER=+1234567890
```

## Configuration WhatsApp

### Option 1 : Twilio WhatsApp Business API

1. Activer WhatsApp sur votre compte Twilio
2. Configurer un numéro WhatsApp Business
3. Ajouter dans `.env` :
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

4. Décommenter le code dans `backend/utils/notificationService.js` (fonction `sendWhatsAppNotification`)

### Option 2 : WhatsApp Business API (Meta)

1. Créer un compte WhatsApp Business API
2. Utiliser l'API Graph de Meta
3. Configurer les webhooks

## Test des notifications

Une fois configuré, testez en créant une demande de devis depuis la page d'accueil et en sélectionnant le mode de notification souhaité.

## Variables d'environnement complètes

```env
# Email (obligatoire)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
ADMIN_EMAIL=admin@silyprocure.com

# SMS (optionnel - Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp (optionnel - Twilio)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# URL Frontend (pour les liens de suivi)
FRONTEND_URL=http://localhost:3000
```

## Notes importantes

- ⚠️ Les services SMS et WhatsApp sont payants (Twilio, Vonage, etc.)
- 📧 L'email est gratuit et fonctionne immédiatement après configuration SMTP
- 🔒 Les tokens de suivi sont sécurisés et uniques pour chaque demande
- 📱 Les notifications incluent toujours la référence et le lien de suivi

