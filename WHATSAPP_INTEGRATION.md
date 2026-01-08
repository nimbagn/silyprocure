# Intégration WhatsApp - Flux de Demandes de Devis

Ce document explique comment fonctionne le flux complet de réception de demandes de devis par WhatsApp et leur transmission numérique aux fournisseurs.

## 📋 Vue d'ensemble

Le système permet de recevoir des demandes de devis directement par WhatsApp, d'extraire automatiquement les informations avec l'IA, de les valider manuellement, puis de créer des RFQ pour les transmettre aux fournisseurs.

## 🔄 Flux complet

### 1. Réception du message WhatsApp

**Endpoint:** `POST /api/whatsapp/webhook`

Quand un client envoie un message WhatsApp à votre numéro configuré dans MessagePro, le webhook est déclenché.

**Format attendu du webhook:**
```json
{
  "account": "whatsapp_account_id",
  "sender": "+224612345678",
  "message": "Bonjour, j'aimerais un devis pour 100 kg de riz",
  "type": "text",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Extraction automatique avec IA

Le service `whatsappParser` analyse le message avec l'IA pour extraire:
- Nom du client
- Email (si mentionné)
- Téléphone (depuis l'expéditeur)
- Entreprise (si mentionnée)
- Articles demandés (description, quantité, unité, secteur)
- Adresse de livraison
- Ville et pays

**Niveau de confiance:** L'IA retourne un score de confiance (0-1) indiquant la qualité de l'extraction.

### 3. Création de la demande en attente

La demande est créée dans la table `demandes_devis` avec:
- `statut = 'nouvelle'`
- `mode_notification = 'whatsapp'`
- `notes_internes` contient les métadonnées WhatsApp (confiance, message original, etc.)

### 4. Notifications

- **Client:** Reçoit un accusé de réception par WhatsApp avec la référence
- **Admins/Superviseurs:** Reçoivent une notification dans la plateforme avec le niveau de confiance

### 5. Validation manuelle

Les admins/superviseurs voient les demandes WhatsApp en attente dans la page **Demandes de Devis** avec:
- Un badge de confiance (vert ≥70%, orange ≥50%, rouge <50%)
- Le message original
- Les informations extraites

Ils peuvent:
- Valider et corriger les informations
- Ajouter/modifier/supprimer des articles
- Compléter les informations manquantes

**Endpoint:** `POST /api/whatsapp/pending/:id/validate`

### 6. Création de RFQ pour les fournisseurs

Une fois validée, la demande passe au statut `en_cours` et peut être utilisée pour créer des RFQ comme une demande normale.

**Flux standard:**
1. Admin sélectionne la demande validée
2. Clique sur "Créer RFQ"
3. Sélectionne les fournisseurs
4. Les RFQ sont créées et envoyées aux fournisseurs
5. Les fournisseurs reçoivent une notification WhatsApp

## 🔧 Configuration

### 1. Configurer le webhook dans MessagePro

1. Connectez-vous à votre compte MessagePro
2. Allez dans **Settings → Webhooks**
3. Configurez l'URL: `https://votre-domaine.com/api/whatsapp/webhook`
4. Sélectionnez les événements: `message.received`

### 2. Variables d'environnement

Assurez-vous que ces variables sont configurées:

```env
MESSAGEPRO_SECRET=votre_secret_api
MESSAGEPRO_WHATSAPP_ACCOUNT=whatsapp_account_id
```

### 3. Configuration IA

L'extraction utilise le service IA configuré dans `backend/config/ai.js`. 
- Si une API IA est configurée (OpenAI, Claude, Ollama), elle sera utilisée
- Sinon, un fallback basique avec regex sera utilisé

## 📱 Interface utilisateur

### Page Demandes de Devis

Une section spéciale affiche les demandes WhatsApp en attente:
- Badge WhatsApp vert
- Compteur de demandes en attente
- Liste avec niveau de confiance
- Bouton "Valider" pour chaque demande

### Modal de validation

Le modal permet de:
- Corriger les informations client
- Modifier les articles
- Ajouter des articles manquants
- Compléter l'adresse de livraison

## 🔍 Dépannage

### Le webhook ne reçoit pas de messages

1. Vérifiez que l'URL est correctement configurée dans MessagePro
2. Vérifiez que le serveur est accessible depuis Internet (pas de localhost)
3. Vérifiez les logs: `console.log('📱 Webhook WhatsApp reçu:', ...)`

### L'extraction IA ne fonctionne pas

1. Vérifiez la configuration IA dans `backend/config/ai.js`
2. Si aucune API IA n'est configurée, le fallback basique sera utilisé
3. Vérifiez les logs pour les erreurs d'extraction

### Les notifications ne sont pas envoyées

1. Vérifiez `MESSAGEPRO_SECRET` et `MESSAGEPRO_WHATSAPP_ACCOUNT`
2. Vérifiez les crédits MessagePro
3. Vérifiez les logs pour les erreurs d'envoi

## 📊 Structure des données

### Table `demandes_devis`

Les demandes WhatsApp sont stockées avec:
- `mode_notification = 'whatsapp'`
- `statut = 'nouvelle'` (en attente de validation)
- `notes_internes` contient un JSON avec:
  ```json
  {
    "source": "whatsapp",
    "account": "whatsapp_account_id",
    "confiance": 0.85,
    "timestamp": "2024-01-15T10:30:00Z",
    "raw_message": "Message original..."
  }
  ```

## 🚀 Exemple de message client

**Message WhatsApp:**
```
Bonjour, je suis Jean Dupont de l'entreprise ABC.
J'aimerais un devis pour:
- 100 kg de riz
- 50 sacs de ciment
- 20 m² de tôles

Livraison à Conakry, Guinée
Email: jean.dupont@abc.com
```

**Extraction automatique:**
- Nom: "Jean Dupont"
- Email: "jean.dupont@abc.com"
- Entreprise: "ABC"
- Articles: 3 articles détectés
- Adresse: Conakry, Guinée
- Confiance: ~0.9 (très élevée)

## 📝 Notes importantes

1. **Sécurité:** Le webhook est public (sans authentification) car MessagePro doit pouvoir y accéder. Assurez-vous que MessagePro valide les requêtes.

2. **Performance:** L'extraction IA peut prendre quelques secondes. Le webhook répond immédiatement et le traitement se fait en arrière-plan.

3. **Validation:** Toujours valider manuellement les demandes à faible confiance (<50%) avant de créer des RFQ.

4. **Historique:** Tous les messages originaux sont conservés dans `notes_internes` pour traçabilité.

## 🔗 Liens utiles

- [Documentation MessagePro API](https://messagepro-gn.com/api)
- [Guide d'intégration MessagePro](./MESSAGEPRO_INTEGRATION.md)
- [Guide du flux complet](./GUIDE_FLUX_COMPLET.md)

