# 📋 Qui émet les documents dans SilyProcure

## 🎯 Deux scénarios de fonctionnement

Le système SilyProcure supporte **deux modes de fonctionnement** selon que le fournisseur a un compte sur la plateforme ou non.

---

## 📊 Vue d'ensemble des deux scénarios

### Scénario 1 : Fournisseur avec compte sur la plateforme

```
ACHETEUR (Utilisateur avec rôle acheteur/admin)
    ↓
    Émet : RFQ (Demande de devis) → Envoyée directement sur la plateforme
    ↓
FOURNISSEUR (Utilisateur connecté avec compte fournisseur)
    ↓
    Reçoit la RFQ sur la plateforme
    ↓
    Émet : Devis directement sur la plateforme
    ↓
ACHETEUR (Utilisateur avec rôle acheteur/admin/approbateur)
    ↓
    Émet : Commande (BC/PO)
    ↓
FOURNISSEUR (Utilisateur connecté avec compte fournisseur)
    ↓
    Émet : Facture directement sur la plateforme
```

### Scénario 2 : Fournisseur externe (géré par superviseur/admin)

```
ACHETEUR (Utilisateur avec rôle acheteur/admin)
    ↓
    Émet : RFQ (Demande de devis)
    ↓
SUPERVISEUR/ADMIN (Utilisateur avec rôle admin/superviseur)
    ↓
    Envoie au fournisseur externe :
    - Lien de remplissage (formulaire externe) OU
    - Fichier PDF/Excel à remplir
    ↓
FOURNISSEUR EXTERNE (hors plateforme)
    ↓
    Remplit le devis et le retourne
    ↓
SUPERVISEUR/ADMIN
    ↓
    Importe le devis retourné dans la plateforme
    ↓
    Envoie le devis au client final
    ↓
CLIENT FINAL
    ↓
    Fait parvenir sa commande
    ↓
SUPERVISEUR/ADMIN
    ↓
    Établit la facture finale sur la plateforme
```

---

## 1. 📝 RFQ (Demande de devis)

### Qui émet ?
**L'ACHETEUR** (utilisateur connecté avec rôle `acheteur`, `admin`, ou `approbateur`)

### Détails techniques :
- **Champ dans la base** : `rfq.emetteur_id` → référence `utilisateurs.id`
- **Destinataire** : `rfq.destinataire_id` → référence `entreprises.id` (entreprise de type `fournisseur`)
- **Code source** : `backend/routes/rfq.js` ligne 130-131
  ```javascript
  const [users] = await pool.execute('SELECT entreprise_id FROM utilisateurs WHERE id = ?', [req.user.id]);
  const emetteur_id = users.length > 0 && users[0].entreprise_id ? users[0].entreprise_id : null;
  ```

### Processus - Scénario 1 (Fournisseur avec compte) :
1. Un utilisateur connecté (acheteur) crée une RFQ
2. Il sélectionne un ou plusieurs fournisseurs (`destinataire_id`)
3. La RFQ est envoyée directement sur la plateforme aux fournisseurs
4. Les fournisseurs reçoivent une notification sur la plateforme
5. Statut initial : `brouillon` → puis `envoye`

### Processus - Scénario 2 (Fournisseur externe) :
1. Un utilisateur connecté (acheteur) crée une RFQ
2. Il sélectionne un ou plusieurs fournisseurs (`destinataire_id`)
3. Un **superviseur/admin** prend en charge l'envoi :
   - **Option A** : Génère un lien de remplissage externe (formulaire web public)
   - **Option B** : Exporte la RFQ en PDF ou Excel
4. Le superviseur/admin envoie le lien ou le fichier au fournisseur externe
5. Statut initial : `brouillon` → puis `envoye`

---

## 2. 💼 DEVIS

### Scénario 1 : Fournisseur avec compte sur la plateforme

#### Qui émet ?
**LE FOURNISSEUR** (utilisateur connecté avec compte fournisseur)

#### Détails techniques :
- **Champ dans la base** : `devis.fournisseur_id` → référence `entreprises.id` (type = `fournisseur`)
- **Lien avec RFQ** : `devis.rfq_id` → référence `rfq.id`
- **Code source** : `backend/routes/devis.js` ligne 87-100
  ```javascript
  const {
      numero, rfq_id, fournisseur_id, ...
  } = req.body;
  
  // Récupérer le fournisseur depuis la RFQ si non fourni
  let finalFournisseurId = fournisseur_id;
  if (!finalFournisseurId && rfq_id) {
      const [rfqs] = await pool.execute('SELECT destinataire_id FROM rfq WHERE id = ?', [rfq_id]);
      if (rfqs.length > 0) {
          finalFournisseurId = rfqs[0].destinataire_id;
      }
  }
  ```

#### Processus :
1. Le fournisseur se connecte à la plateforme
2. Il voit les RFQ reçues dans son tableau de bord
3. Il crée un devis directement sur la plateforme en réponse à la RFQ
4. Le devis contient les prix, quantités, remises, etc.
5. Statut initial : `brouillon` → puis `envoye` → peut être `accepte` ou `refuse`

---

### Scénario 2 : Fournisseur externe (géré par superviseur/admin)

#### Qui émet ?
**LE SUPERVISEUR/ADMIN** (utilisateur avec rôle `admin` ou `superviseur`)

#### Processus :
1. Le fournisseur externe reçoit :
   - **Option A** : Un lien de remplissage (formulaire web public sans authentification)
   - **Option B** : Un fichier PDF ou Excel à remplir
2. Le fournisseur externe remplit le devis et le retourne :
   - **Option A** : Soumet le formulaire en ligne (données envoyées automatiquement)
   - **Option B** : Retourne le fichier PDF/Excel rempli par email
3. Le **superviseur/admin** :
   - **Option A** : Reçoit automatiquement les données du formulaire
   - **Option B** : Importe le fichier retourné dans la plateforme
4. Le superviseur/admin crée le devis sur la plateforme pour le client final
5. Le devis est envoyé au client final
6. Statut initial : `brouillon` → puis `envoye` → peut être `accepte` ou `refuse`

#### Fonctionnalités à créer :
- ✅ Génération de lien de remplissage externe (formulaire public)
- ✅ Export RFQ en PDF/Excel
- ✅ Import de devis depuis fichier Excel/PDF retourné
- ✅ Interface d'import pour superviseur/admin

---

## 3. 🛒 COMMANDE (BC/PO)

### Scénario 1 : Fournisseur avec compte

#### Qui émet ?
**L'ACHETEUR** (utilisateur connecté avec rôle `acheteur`, `admin`, ou `approbateur`)

#### Processus :
1. L'acheteur compare les devis reçus sur la plateforme
2. Il accepte un devis (statut devis → `accepte`)
3. Il crée une commande à partir du devis accepté directement sur la plateforme
4. Type de commande : `BC` (Bon de Commande) ou `PO` (Purchase Order)
5. Statut initial : `brouillon` → puis `envoye` → `accepte` → `en_preparation` → `livre`

---

### Scénario 2 : Fournisseur externe

#### Qui émet ?
**LE CLIENT FINAL** (envoie sa commande au superviseur/admin)

#### Processus :
1. Le client final reçoit le devis (envoyé par le superviseur/admin)
2. Le client final fait parvenir sa commande au superviseur/admin :
   - Par email
   - Par téléphone
   - Par document papier
   - Ou directement sur la plateforme s'il a un compte
3. Le **superviseur/admin** crée la commande sur la plateforme
4. Type de commande : `BC` (Bon de Commande) ou `PO` (Purchase Order)
5. Statut initial : `brouillon` → puis `envoye` → `accepte` → `en_preparation` → `livre`

#### Détails techniques :
- **Champ dans la base** : `commandes.commandeur_id` → référence `utilisateurs.id` (superviseur/admin)
- **Fournisseur** : `commandes.fournisseur_id` → référence `entreprises.id` (type = `fournisseur`)
- **Lien avec devis** : `commandes.devis_id` → référence `devis.id` (optionnel)
- **Code source** : `backend/routes/commandes.js` ligne 95
  ```javascript
  const commandeur_id = req.user.id; // Superviseur/admin connecté
  ```

---

## 4. 🧾 FACTURE

### Scénario 1 : Fournisseur avec compte

#### Qui émet ?
**LE FOURNISSEUR** (utilisateur connecté avec compte fournisseur)

#### Processus :
1. Le fournisseur livre la commande (création d'un Bon de Livraison sur la plateforme)
2. Le fournisseur crée une facture directement sur la plateforme
3. La facture peut être :
   - `proforma` : facture proforma (avant la facture définitive)
   - `facture` : facture définitive
   - `avoir` : avoir/remboursement
4. Statut initial : `brouillon` → puis `envoyee` → `en_attente` → `partiellement_payee` → `payee`

---

### Scénario 2 : Fournisseur externe

#### Qui émet ?
**LE SUPERVISEUR/ADMIN** (utilisateur avec rôle `admin` ou `superviseur`)

#### Processus :
1. Le fournisseur externe livre la commande (hors plateforme)
2. Le fournisseur externe envoie sa facture au superviseur/admin :
   - Par email
   - Par document papier
   - Ou le superviseur/admin crée la facture directement
3. Le **superviseur/admin** établit la facture finale sur la plateforme
4. La facture peut être :
   - `proforma` : facture proforma (avant la facture définitive)
   - `facture` : facture définitive
   - `avoir` : avoir/remboursement
5. La facture est envoyée au client final
6. Statut initial : `brouillon` → puis `envoyee` → `en_attente` → `partiellement_payee` → `payee`

#### Détails techniques :
- **Champ dans la base** : `factures.facturier_id` → référence `entreprises.id` (type = `fournisseur`)
- **Client** : `factures.client_id` → référence `entreprises.id` (type = `acheteur` ou `client`)
- **Lien avec commande** : `factures.commande_id` → référence `commandes.id` (optionnel)
- **Lien avec BL** : `factures.bl_id` → référence `bons_livraison.id` (optionnel)
- **Code source** : `backend/routes/factures.js` ligne 95
  ```javascript
  const {
      facturier_id, client_id, ...
  } = req.body;
  ```

---

## 📊 Récapitulatif par scénario

### Scénario 1 : Fournisseur avec compte sur la plateforme

| Document | Émetteur | Type d'entreprise | Rôle utilisateur requis |
|----------|----------|-------------------|-------------------------|
| **RFQ** | Acheteur | `acheteur` | `acheteur`, `admin`, `approbateur` |
| **Devis** | Fournisseur | `fournisseur` | Utilisateur lié à l'entreprise fournisseur |
| **Commande** | Acheteur | `acheteur` | `acheteur`, `admin`, `approbateur` |
| **Facture** | Fournisseur | `fournisseur` | Utilisateur lié à l'entreprise fournisseur |

### Scénario 2 : Fournisseur externe (géré par superviseur/admin)

| Document | Émetteur | Type d'entreprise | Rôle utilisateur requis |
|----------|----------|-------------------|-------------------------|
| **RFQ** | Acheteur | `acheteur` | `acheteur`, `admin`, `approbateur` |
| **Envoi RFQ** | Superviseur/Admin | - | `admin`, `superviseur` |
| **Devis** | Superviseur/Admin | `fournisseur` | `admin`, `superviseur` (import depuis fournisseur externe) |
| **Commande** | Superviseur/Admin | `acheteur` | `admin`, `superviseur` (créée depuis commande client) |
| **Facture** | Superviseur/Admin | `fournisseur` | `admin`, `superviseur` (établie pour le fournisseur) |

---

## 🔐 Rôles utilisateurs

Les rôles définis dans `utilisateurs.role` sont :
- `admin` : Accès complet, peut gérer les fournisseurs externes
- `superviseur` : Peut gérer les fournisseurs externes (à créer)
- `acheteur` : Peut créer RFQ et commandes
- `approbateur` : Peut approuver et créer commandes
- `comptable` : Gestion financière
- `viewer` : Lecture seule

### Nouveau rôle à créer : `superviseur`
Le rôle `superviseur` permettra de :
- Gérer les fournisseurs externes
- Générer des liens de remplissage pour les RFQ
- Exporter des RFQ en PDF/Excel
- Importer des devis depuis fichiers retournés
- Créer des commandes depuis les demandes clients
- Établir des factures pour les fournisseurs externes

---

## 🏢 Types d'entreprises

Les types définis dans `entreprises.type_entreprise` sont :
- `acheteur` : Entreprise qui achète
- `fournisseur` : Entreprise qui vend
- `client` : Client final
- `transporteur` : Entreprise de transport

---

## 📝 Notes importantes

### Scénario 1 (Fournisseur avec compte) :
1. **RFQ** : Un utilisateur (acheteur) peut créer une RFQ pour plusieurs fournisseurs
2. **Devis** : Un fournisseur répond à une RFQ avec un devis directement sur la plateforme
3. **Commande** : Un acheteur crée une commande à partir d'un devis accepté
4. **Facture** : Un fournisseur émet une facture après livraison directement sur la plateforme

### Scénario 2 (Fournisseur externe) :
1. **RFQ** : Un utilisateur (acheteur) crée une RFQ
2. **Envoi RFQ** : Un superviseur/admin envoie la RFQ au fournisseur externe (lien ou fichier)
3. **Devis** : Le fournisseur externe retourne le devis rempli → Le superviseur/admin l'importe dans la plateforme
4. **Commande** : Le client final fait parvenir sa commande → Le superviseur/admin la crée sur la plateforme
5. **Facture** : Le superviseur/admin établit la facture finale sur la plateforme

Le flux est unidirectionnel : **RFQ → Devis → Commande → Facture**

---

## 🚀 Fonctionnalités à développer pour le Scénario 2

### 1. Génération de lien de remplissage externe
- Créer un formulaire public (sans authentification) pour remplir un devis
- Générer un lien unique et sécurisé par RFQ
- Permettre au fournisseur externe de remplir le devis en ligne
- Envoyer automatiquement les données au superviseur/admin

### 2. Export RFQ en PDF/Excel
- ✅ Export PDF déjà disponible (`backend/routes/pdf.js`)
- Créer export Excel avec format de remplissage
- Inclure toutes les informations nécessaires (lignes, quantités, spécifications)

### 3. Import de devis depuis fichier
- Interface d'upload pour superviseur/admin
- Parser les fichiers Excel/PDF retournés
- Valider et importer les données dans la base
- Créer automatiquement le devis sur la plateforme

### 4. Gestion des fournisseurs externes
- Marquer les fournisseurs comme "externe" ou "avec compte"
- Interface dédiée pour superviseur/admin
- Suivi des envois et retours de documents

### 5. Notifications et suivi
- Notifications pour superviseur/admin lors des retours de devis
- Suivi du statut des RFQ envoyées aux fournisseurs externes
- Rappels automatiques pour les devis en attente

---

---

## 📋 Tableau comparatif des deux scénarios

| Étape | Scénario 1 (Fournisseur avec compte) | Scénario 2 (Fournisseur externe) |
|-------|-------------------------------------|-----------------------------------|
| **RFQ** | Créée par acheteur, envoyée automatiquement sur la plateforme | Créée par acheteur, envoyée par superviseur/admin (lien ou fichier) |
| **Réception RFQ** | Fournisseur voit la RFQ sur son tableau de bord | Fournisseur reçoit un lien ou un fichier |
| **Création Devis** | Fournisseur crée le devis directement sur la plateforme | Fournisseur remplit un formulaire externe ou un fichier, superviseur/admin importe |
| **Envoi Devis** | Automatique sur la plateforme | Superviseur/admin envoie le devis au client final |
| **Commande** | Acheteur crée la commande sur la plateforme | Client final fait parvenir sa commande, superviseur/admin la crée |
| **Facture** | Fournisseur crée la facture sur la plateforme | Superviseur/admin établit la facture finale |

---

**Date de création** : 2024  
**Version** : 2.0  
**Dernière mise à jour** : Ajout des deux scénarios (fournisseur avec compte / fournisseur externe)

