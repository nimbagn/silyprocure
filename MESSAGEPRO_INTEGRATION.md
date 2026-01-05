# Intégration Message Pro API

Ce document explique comment configurer et utiliser l'intégration Message Pro pour l'envoi de SMS et WhatsApp dans SilyProcure.

## 📋 Prérequis

1. Compte Message Pro actif sur https://messagepro-gn.com
2. Clé API secrète (disponible dans Tools -> API Keys)
3. Compte WhatsApp configuré (pour WhatsApp) ou gateway/device (pour SMS)

## 🔧 Configuration

### Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` ou dans les variables d'environnement de Render :

```env
# Message Pro API
MESSAGEPRO_SECRET=votre_secret_api_ici

# Configuration SMS (optionnel)
MESSAGEPRO_SMS_MODE=credits  # 'devices' ou 'credits'
MESSAGEPRO_GATEWAY=gateway_id  # Si mode='credits'
MESSAGEPRO_DEVICE=device_id  # Si mode='devices'
MESSAGEPRO_SIM=1  # 1 ou 2, si mode='devices'

# Configuration WhatsApp (optionnel)
MESSAGEPRO_WHATSAPP_ACCOUNT=whatsapp_account_unique_id
```

### Obtenir votre clé API

1. Connectez-vous à votre compte Message Pro
2. Allez dans **Tools -> API Keys**
3. Copiez votre **API Secret**
4. Ajoutez-le dans `MESSAGEPRO_SECRET`

### Obtenir l'ID du compte WhatsApp

1. Utilisez l'API : `GET /api/messagepro/whatsapp/accounts`
2. Ou connectez-vous au dashboard Message Pro
3. Copiez l'ID unique du compte WhatsApp
4. Ajoutez-le dans `MESSAGEPRO_WHATSAPP_ACCOUNT`

### Obtenir l'ID du gateway/device

1. Utilisez l'API : `GET /api/messagepro/rates` (pour les gateways)
2. Utilisez l'API : `GET /api/messagepro/devices` (pour les devices)
3. Copiez l'ID et ajoutez-le dans `MESSAGEPRO_GATEWAY` ou `MESSAGEPRO_DEVICE`

## 🚀 Utilisation

### Envoi automatique

L'envoi de SMS/WhatsApp se fait automatiquement lors de la création d'une demande de devis, selon le `mode_notification` choisi par le client :

- `email` : Envoi par email (via SMTP)
- `sms` : Envoi par SMS (via Message Pro)
- `whatsapp` : Envoi par WhatsApp (via Message Pro)

### API Routes disponibles

#### Vérifier les crédits
```bash
GET /api/messagepro/credits
```

#### Récupérer les comptes WhatsApp
```bash
GET /api/messagepro/whatsapp/accounts?limit=10&page=1
```

#### Récupérer les devices Android
```bash
GET /api/messagepro/devices?limit=10&page=1
```

#### Récupérer les taux des gateways
```bash
GET /api/messagepro/rates
```

#### Envoyer un SMS de test (admin uniquement)
```bash
POST /api/messagepro/test/sms
Content-Type: application/json

{
  "phone": "+224601123456",
  "message": "Message de test",
  "mode": "credits",
  "gateway": "gateway_id"
}
```

#### Envoyer un WhatsApp de test (admin uniquement)
```bash
POST /api/messagepro/test/whatsapp
Content-Type: application/json

{
  "account": "whatsapp_account_id",
  "recipient": "+224601123456",
  "message": "Message de test",
  "priority": 1
}
```

## 📱 Format des numéros de téléphone

Message Pro accepte les formats suivants :

- **E.164** : `+224601123456` (recommandé)
- **Local** : `601123456` (utilise le code pays de votre profil)

## 🔒 Permissions API requises

Assurez-vous que votre clé API Message Pro a les permissions suivantes :

- `sms_send` : Pour envoyer des SMS
- `wa_send` : Pour envoyer des messages WhatsApp
- `get_credits` : Pour vérifier les crédits
- `get_wa_accounts` : Pour récupérer les comptes WhatsApp
- `get_devices` : Pour récupérer les devices Android
- `get_rates` : Pour récupérer les taux des gateways

## 📝 Exemples d'utilisation

### Dans le code

```javascript
const messageProService = require('./services/messagepro');

// Envoyer un SMS
await messageProService.sendSMS(
    '+224601123456',
    'Votre message ici',
    'credits',
    { gateway: 'gateway_id' }
);

// Envoyer un WhatsApp
await messageProService.sendWhatsApp(
    'whatsapp_account_id',
    '+224601123456',
    'Votre message ici',
    { priority: 1 }
);
```

## ⚠️ Notes importantes

1. **Crédits** : Assurez-vous d'avoir suffisamment de crédits pour envoyer des messages
2. **Mode SMS** : 
   - `credits` : Utilise les gateways et nécessite des crédits
   - `devices` : Utilise vos devices Android liés (gratuit mais nécessite un device)
3. **WhatsApp** : Nécessite un compte WhatsApp configuré et lié dans Message Pro
4. **Priorité** : 
   - `1` : Message prioritaire (envoyé immédiatement)
   - `2` : Message normal (mis en file d'attente)

## 🐛 Dépannage

### Erreur "MESSAGEPRO_SECRET non configuré"
- Vérifiez que la variable `MESSAGEPRO_SECRET` est définie dans votre `.env` ou variables d'environnement Render

### Erreur "Aucun compte WhatsApp disponible"
- Vérifiez que vous avez au moins un compte WhatsApp configuré dans Message Pro
- Utilisez `GET /api/messagepro/whatsapp/accounts` pour voir les comptes disponibles

### SMS non envoyé
- Vérifiez vos crédits avec `GET /api/messagepro/credits`
- Vérifiez que le gateway/device est correctement configuré
- Vérifiez le format du numéro de téléphone

### WhatsApp non envoyé
- Vérifiez que le compte WhatsApp est actif et lié
- Vérifiez que le numéro de téléphone est valide et existe sur WhatsApp

## 📚 Documentation complète

Pour plus de détails, consultez la documentation officielle de Message Pro :
https://messagepro-gn.com/api

