# Script de mise à jour complète pour Render

Ce script permet de mettre à jour complètement la base de données PostgreSQL sur Render pour que le projet fonctionne correctement.

## 📋 Contenu du script

Le script `update_render_complete.sql` effectue les opérations suivantes :

1. **Création des extensions PostgreSQL** :
   - `uuid-ossp` pour les UUID
   - `pg_trgm` pour les recherches de texte

2. **Création de la fonction `update_modified_column()`** :
   - Fonction trigger pour mettre à jour automatiquement `date_modification`

3. **Création des tables manquantes** :
   - `clients` : Table pour gérer les clients
   - `demandes_devis` : Table pour les demandes de devis depuis la page d'accueil
   - `demandes_devis_lignes` : Lignes d'articles des demandes de devis
   - `messages_contact` : Messages du formulaire de contact

4. **Ajout de colonnes manquantes** :
   - Colonnes de tracking (`reference`, `token_suivi`)
   - Colonnes de géolocalisation (`latitude`, `longitude`)
   - Colonnes d'adresse de livraison
   - Colonnes de notification
   - Lien avec la table `clients` (`client_id`)

5. **Ajout de liens entre tables** :
   - `devis.demande_devis_id` : Lien entre devis et demandes de devis
   - `commandes.demande_devis_id` : Lien entre commandes et demandes de devis

6. **Création d'index et contraintes** :
   - Index pour améliorer les performances
   - Contraintes de clés étrangères
   - Triggers pour la mise à jour automatique

## 🚀 Utilisation

### Option 1 : Via script Node.js (Recommandé)

```bash
npm run render:update
```

Cette commande exécute automatiquement le script SQL avec gestion des erreurs et affichage de la progression.

### Option 2 : Via Shell Render

1. Connectez-vous au Shell Render de votre service
2. Exécutez la commande :

```bash
npm run render:update
```

### Option 3 : Exécution manuelle du script SQL

Si vous préférez exécuter le script SQL directement :

1. Connectez-vous au Shell Render
2. Utilisez `psql` avec votre `DATABASE_URL` :

```bash
psql $DATABASE_URL -f database/update_render_complete.sql
```

Ou si vous avez les variables individuelles :

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/update_render_complete.sql
```

## ✅ Vérification

Après l'exécution, le script affiche :
- Le nombre d'instructions exécutées avec succès
- Les erreurs éventuelles (certaines sont attendues si les tables/colonnes existent déjà)
- La liste des tables vérifiées/créées

## 🔄 Idempotence

Le script est **idempotent**, ce qui signifie qu'il peut être exécuté plusieurs fois sans erreur. Il vérifie l'existence des tables et colonnes avant de les créer, évitant ainsi les erreurs de duplication.

## 📝 Tables créées/vérifiées

- ✅ `clients`
- ✅ `demandes_devis`
- ✅ `demandes_devis_lignes`
- ✅ `messages_contact`

## 🔗 Liens ajoutés

- ✅ `devis.demande_devis_id` → `demandes_devis.id`
- ✅ `commandes.demande_devis_id` → `demandes_devis.id`
- ✅ `demandes_devis.client_id` → `clients.id`

## ⚠️ Notes importantes

1. **Sauvegarde** : Il est recommandé de faire une sauvegarde de la base de données avant d'exécuter le script (même s'il est idempotent).

2. **Permissions** : Assurez-vous que l'utilisateur de la base de données a les permissions nécessaires pour créer des tables, index et contraintes.

3. **Temps d'exécution** : Le script peut prendre quelques secondes à quelques minutes selon la taille de votre base de données.

4. **Erreurs attendues** : Certaines erreurs comme "already exists" sont normales et peuvent être ignorées. Le script continue l'exécution même en cas d'erreurs mineures.

## 🐛 Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez les variables d'environnement** :
   - `DATABASE_URL` doit être défini, ou
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` doivent être définis

2. **Vérifiez les permissions** :
   - L'utilisateur doit avoir les droits CREATE, ALTER, INDEX sur la base de données

3. **Vérifiez les logs** :
   - Les erreurs importantes sont affichées dans la console
   - Les erreurs "already exists" peuvent être ignorées

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs du script d'exécution
- Les logs de Render
- La documentation PostgreSQL pour les erreurs spécifiques

