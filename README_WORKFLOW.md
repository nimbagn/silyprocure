# Workflow d'Acquisition Client - SilyProcure

## 📋 Vue d'ensemble

Le workflow complet d'acquisition client se déroule entièrement sur la plateforme, de la demande de devis jusqu'à la commande.

## 🔄 Processus complet

### 1. Création d'une RFQ (Demande de devis)

**Page**: `rfq-create.html`

**Étapes**:
1. **Informations générales**
   - Numéro RFQ (format: RFQ-YYYY-NNNN)
   - Date d'émission
   - Date limite de réponse
   - Catégorie
   - Description détaillée
   - Projet et centre de coût (optionnels)

2. **Recherche et sélection de fournisseurs**
   - Recherche par nom, secteur d'activité
   - Sélection multiple de fournisseurs
   - Affichage des informations (RCCM, secteur, email)

3. **Détails produits/services**
   - Ajout de lignes de produits
   - Quantité, unité, spécifications techniques
   - Lien avec le catalogue produits (optionnel)

4. **Conditions de livraison**
   - Adresse de livraison
   - Date de livraison souhaitée
   - Incoterms
   - Conditions de paiement

**Résultat**: Une RFQ est créée pour chaque fournisseur sélectionné avec le statut "brouillon".

### 2. Envoi de la RFQ aux fournisseurs

**Page**: `rfq-detail.html`

- L'émetteur peut envoyer la RFQ aux fournisseurs
- Le statut passe à "envoyé"
- Les fournisseurs reçoivent une notification

### 3. Réponse des fournisseurs

**Page**: `fournisseur-rfq.html` (vue fournisseur) ou `devis-create.html`

**Processus**:
1. Le fournisseur voit les RFQ reçues
2. Clique sur "Répondre avec un devis"
3. Remplit le formulaire de devis :
   - Numéro de devis
   - Dates (émission, validité)
   - Délai de livraison
   - Prix unitaire pour chaque ligne de la RFQ
   - Remises (ligne et globale)
   - TVA
   - Conditions de paiement
   - Garanties et certifications
   - Notes

**Résultat**: Un devis est créé avec le statut "envoyé", la RFQ passe à "en_cours".

### 4. Comparaison des devis

**Page**: `rfq-detail.html` ou `devis-compare.html`

**Fonctionnalités**:
- Visualisation de tous les devis reçus pour une RFQ
- Comparaison côte à côte :
  - Prix (HT, TVA, TTC)
  - Remises
  - Délais de livraison
  - Conditions de paiement
  - Garanties
- Recommandation automatique (meilleur prix)
- Bouton pour accepter un devis

### 5. Acceptation d'un devis et création de commande

**Processus**:
1. L'acheteur sélectionne un devis
2. Clique sur "Accepter"
3. Une commande (BC) est automatiquement créée :
   - Numéro de commande généré
   - Lignes copiées depuis le devis
   - Statut du devis passe à "accepté"
   - Statut de la RFQ passe à "clôturé"

**Résultat**: Commande créée, prête pour la suite du processus (bon de livraison, facturation).

## 📊 Statuts

### RFQ
- `brouillon` : RFQ en cours de création
- `envoye` : RFQ envoyée aux fournisseurs
- `en_cours` : Au moins un devis reçu
- `cloture` : Un devis a été accepté

### Devis
- `brouillon` : Devis en cours de création
- `envoye` : Devis envoyé à l'acheteur
- `accepte` : Devis accepté, commande créée
- `refuse` : Devis refusé

## 🔍 Recherche de fournisseurs

Le système permet de :
- Rechercher par nom
- Filtrer par secteur d'activité
- Voir les informations complètes (RCCM, coordonnées)
- Sélectionner plusieurs fournisseurs pour une même RFQ

## 💼 Interface fournisseur

Les fournisseurs peuvent :
- Voir toutes les RFQ reçues
- Filtrer par statut
- Répondre avec un devis détaillé
- Suivre l'état de leurs devis

## 📈 Comparaison intelligente

La page de comparaison affiche :
- Tableau comparatif de tous les critères
- Mise en évidence du meilleur prix
- Recommandation automatique
- Actions rapides pour accepter un devis

## 🔔 Notifications

À chaque étape, des notifications sont envoyées :
- RFQ envoyée → Notification au fournisseur
- Devis reçu → Notification à l'acheteur
- Devis accepté → Notification au fournisseur
- Commande créée → Notification aux parties concernées

## 🚀 Utilisation

### Pour l'acheteur

1. Aller dans **RFQ** → **Nouvelle RFQ**
2. Suivre les 4 étapes du formulaire
3. Envoyer la RFQ aux fournisseurs
4. Consulter les devis reçus
5. Comparer et accepter le meilleur devis
6. La commande est créée automatiquement

### Pour le fournisseur

1. Aller dans **RFQ** → Voir les RFQ reçues
2. Cliquer sur une RFQ pour voir les détails
3. Cliquer sur **Répondre avec un devis**
4. Remplir le formulaire de devis
5. Envoyer le devis
6. Suivre l'acceptation/refus

---

**Version** : 1.0  
**Date** : 2024

