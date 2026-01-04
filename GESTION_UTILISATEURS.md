# Gestion des Utilisateurs - Guide Admin

## Vue d'ensemble

L'interface de gestion des utilisateurs permet aux administrateurs de créer, modifier et gérer les utilisateurs de la plateforme SilyProcure.

## Accès

- **URL** : `/utilisateurs.html`
- **Rôle requis** : `admin` uniquement
- **Menu** : Le lien "Utilisateurs" apparaît automatiquement dans le sidebar pour les administrateurs

## Fonctionnalités

### 1. Créer un utilisateur

1. Cliquez sur le bouton **"Créer un utilisateur"** en haut de la page
2. Remplissez le formulaire :
   - **Nom** * (obligatoire)
   - **Prénom** * (obligatoire)
   - **Email** * (obligatoire, doit être unique)
   - **Téléphone** (optionnel)
   - **Fonction** (optionnel, ex: "Responsable Achats")
   - **Département** (optionnel, ex: "Achats")
   - **Rôle** * (obligatoire) :
     - **Superviseur** : Peut superviser les opérations et valider les demandes
     - **Acheteur** : Peut créer des RFQ et gérer les achats
     - **Approbateur** : Peut approuver les commandes et devis
     - **Comptable** : Accès aux factures et paiements
     - **Visualiseur** : Accès en lecture seule
   - **Mot de passe** * (obligatoire, minimum 6 caractères)
3. Cliquez sur **"Créer"**

> **Note** : Le rôle "Administrateur" ne peut pas être créé via l'interface pour des raisons de sécurité. Il doit être créé manuellement dans la base de données.

### 2. Modifier un utilisateur

1. Cliquez sur le bouton **"Modifier"** (icône crayon) à côté de l'utilisateur
2. Modifiez les informations souhaitées :
   - L'email ne peut pas être modifié
   - Seuls les admins peuvent modifier le rôle et le statut
3. Cliquez sur **"Enregistrer"**

### 3. Activer/Désactiver un utilisateur

1. Cliquez sur le bouton **"Désactiver"** (icône ban) ou **"Activer"** (icône check) à côté de l'utilisateur
2. Confirmez l'action

> **Note** : Vous ne pouvez pas désactiver votre propre compte.

### 4. Rechercher un utilisateur

Utilisez la barre de recherche en haut du tableau pour filtrer les utilisateurs par :
- Nom
- Prénom
- Email
- Fonction
- Département

## Rôles disponibles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Administrateur système | Accès complet, gestion des utilisateurs |
| **Superviseur** | Superviseur | Peut superviser et valider les opérations |
| **Acheteur** | Acheteur | Création de RFQ, gestion des achats |
| **Approbateur** | Approbateur | Approbation des commandes et devis |
| **Comptable** | Comptable | Gestion des factures et paiements |
| **Visualiseur** | Visualiseur | Accès en lecture seule |

## Mise à jour de la base de données

Si vous avez une base de données existante qui ne contient pas le rôle "superviseur", exécutez le script SQL suivant :

```bash
# Sur Render, via le Shell
psql $DATABASE_URL -f database/add_superviseur_role.sql
```

Ou manuellement :

```sql
-- Supprimer l'ancienne contrainte
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_role;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_check;

-- Ajouter la nouvelle contrainte avec le rôle superviseur
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'superviseur', 'acheteur', 'approbateur', 'comptable', 'viewer'));
```

## API Backend

### Routes disponibles

- `GET /api/users` - Liste des utilisateurs (admin uniquement)
- `GET /api/users/:id` - Détails d'un utilisateur
- `POST /api/users` - Créer un utilisateur (admin uniquement)
- `PUT /api/users/:id` - Modifier un utilisateur

### Exemple de création d'utilisateur

```json
POST /api/users
{
  "email": "superviseur@example.com",
  "mot_de_passe": "motdepasse123",
  "nom": "Dupont",
  "prenom": "Jean",
  "telephone": "+224 612 34 56 78",
  "fonction": "Superviseur Achats",
  "departement": "Achats",
  "role": "superviseur"
}
```

## Sécurité

- Les mots de passe sont hashés avec bcrypt (10 rounds)
- Seuls les administrateurs peuvent créer et modifier les utilisateurs
- Les utilisateurs ne peuvent modifier que leurs propres informations (sauf rôle et statut)
- L'email est unique et ne peut pas être modifié après création

## Dépannage

### L'erreur "Cet email est déjà utilisé" apparaît
- Vérifiez que l'email n'existe pas déjà dans la base de données
- L'email doit être unique

### Le menu "Utilisateurs" n'apparaît pas
- Vérifiez que vous êtes connecté avec un compte admin
- Rechargez la page après connexion

### Erreur lors de la création d'un utilisateur avec le rôle "superviseur"
- Exécutez le script SQL `database/add_superviseur_role.sql` pour ajouter le rôle à la contrainte CHECK

