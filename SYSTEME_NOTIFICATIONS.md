# 🔔 Système de Notifications - SilyProcure

## ✅ Fonctionnalités implémentées

### 1. **Backend (API)**

#### Routes disponibles :
- `GET /api/notifications` - Récupérer toutes les notifications de l'utilisateur
- `GET /api/notifications/unread-count` - Compter les notifications non lues
- `PATCH /api/notifications/:id/read` - Marquer une notification comme lue
- `PATCH /api/notifications/read-all` - Marquer toutes les notifications comme lues
- `DELETE /api/notifications/:id` - Supprimer une notification

#### Fonction `createNotification` :
- Utilisable dans toutes les routes pour créer des notifications automatiquement
- Paramètres : `userId`, `typeNotification`, `titre`, `message`, `typeDocument`, `documentId`

### 2. **Frontend**

#### Badge de notifications dans le header :
- Affiche le nombre de notifications non lues
- Mise à jour automatique toutes les 30 secondes
- Badge visible uniquement s'il y a des notifications non lues

#### Dropdown de notifications :
- Clic sur l'icône de cloche pour ouvrir
- Affiche les 20 dernières notifications
- Indique les notifications non lues avec un style différent
- Boutons d'action pour chaque notification (Voir le document)
- Bouton "Tout marquer comme lu"

#### Page complète de notifications (`notifications.html`) :
- Liste complète de toutes les notifications
- Filtre par statut (Toutes / Non lues / Lues)
- Actions : Marquer comme lu, Supprimer
- Lien direct vers les documents associés

### 3. **Notifications automatiques**

Les notifications sont créées automatiquement lors des événements suivants :

#### ✅ Devis créé :
- **Type** : `devis_reçu`
- **Destinataire** : Émetteur de la RFQ
- **Message** : "Un devis a été reçu de [Fournisseur] pour la RFQ [Numéro]"
- **Lien** : Vers la page de détails du devis

#### ✅ Commande créée :
- **Type** : `commande_créée`
- **Destinataire** : Utilisateur ayant créé la commande
- **Message** : "Une nouvelle commande [Numéro] a été créée pour un montant de [Montant] GNF"
- **Lien** : Vers la page de détails de la commande

#### ✅ Facture créée :
- **Type** : `facture_créée`
- **Destinataire** : Utilisateur ayant créé la facture
- **Message** : "Une nouvelle facture [Numéro] a été créée pour un montant de [Montant] GNF"
- **Lien** : Vers la page de détails de la facture

### 4. **Types de notifications supportés**

- `rfq_reçue` - RFQ reçue (fournisseur)
- `devis_reçu` - Devis reçu (acheteur)
- `commande_créée` - Commande créée
- `statut_modifié` - Statut modifié
- `facture_créée` - Facture créée
- `paiement_reçu` - Paiement reçu

## 📋 Structure de la base de données

La table `notifications` existe déjà avec les colonnes suivantes :
- `id` - Identifiant unique
- `utilisateur_id` - Utilisateur destinataire
- `type_notification` - Type de notification
- `titre` - Titre de la notification
- `message` - Message détaillé
- `type_document` - Type de document associé (rfq, devis, commande, facture)
- `document_id` - ID du document associé
- `lu` - Statut de lecture (boolean)
- `date_creation` - Date de création

## 🎨 Interface utilisateur

### Badge dans le header :
- Icône de cloche avec badge rouge indiquant le nombre de notifications non lues
- Mise à jour en temps réel

### Dropdown :
- Design moderne avec ombre portée
- Notifications non lues avec fond bleu clair et bordure gauche bleue
- Icônes différentes selon le type de notification
- Date formatée en français
- Bouton "Voir" pour accéder directement au document

### Page complète :
- Design cohérent avec le reste de l'application
- Filtres et actions en en-tête
- Cartes de notifications avec toutes les informations
- Actions individuelles (Marquer comme lu, Supprimer)

## 🔧 Intégration

### Pour ajouter des notifications dans d'autres routes :

```javascript
const { createNotification } = require('./routes/notifications');

// Dans votre route
await createNotification(
    userId,                    // ID de l'utilisateur destinataire
    'type_notification',       // Type de notification
    'Titre de la notification', // Titre
    'Message détaillé',        // Message
    'type_document',           // Type de document (optionnel)
    documentId                 // ID du document (optionnel)
);
```

### Pour charger le système de notifications dans une page :

```html
<script src="js/notifications.js"></script>
```

Le système s'initialise automatiquement au chargement de la page.

## 📊 Statistiques

- ✅ **6 routes API** créées
- ✅ **1 page complète** de notifications
- ✅ **1 composant JavaScript** réutilisable
- ✅ **3 types de notifications automatiques** implémentés
- ✅ **Badge en temps réel** dans le header
- ✅ **Polling automatique** toutes les 30 secondes

## 🚀 Prochaines améliorations possibles

1. **Notifications par email** - Envoyer des emails pour les notifications importantes
2. **Notifications push** - Notifications navigateur (PWA)
3. **Préférences utilisateur** - Permettre aux utilisateurs de choisir les types de notifications
4. **Groupement de notifications** - Grouper les notifications similaires
5. **Notifications en temps réel** - Utiliser WebSockets au lieu du polling

---

**Version** : 1.0  
**Date** : 2025

