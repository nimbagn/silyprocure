# ✅ Vérification du Dashboard

## 📊 État Actuel

D'après les logs, le backend est **correctement démarré** :

```
✅ Route dashboard chargée
✅ Route /api/dashboard enregistrée
📊 Utilisation de MySQL
✅ Connexion à la base de données MySQL réussie
🚀 Serveur SilyProcure démarré sur le port 3000
📊 Route /api/dashboard/stats appelée
✅ Connexion DB OK
```

## 🔍 Vérifications à Faire

### 1. Ouvrir le Dashboard dans le Navigateur

1. Ouvrez `http://localhost:3000/dashboard.html`
2. **Ouvrez la console du navigateur** (F12 ou Cmd+Option+I)

### 2. Vérifier les Logs dans la Console

Vous devriez voir une séquence comme ceci :

```
📄 DOM chargé, initialisation du dashboard...
🔄 Initialisation du dashboard...
📡 Appel API /api/dashboard/stats...
API Call: http://localhost:3000/api/dashboard/stats {method: 'GET', hasBody: false}
✅ Réponse API reçue, parsing JSON...
📊 Statistiques reçues: {commandes_total: X, montant_mois: Y, ...}
📝 Mise à jour des KPIs...
✅ KPIs mis à jour
📊 Initialisation des graphiques...
📋 Chargement des listes...
✅ Dashboard initialisé avec succès
```

### 3. Vérifier les Données Affichées

#### KPIs (Indicateurs Clés)
- **Commandes** : Doit afficher un nombre (pas "-")
- **Dépenses (Mois)** : Doit afficher un montant en GNF
- **Appels d'offres** : Doit afficher un nombre
- **Fournisseurs** : Doit afficher un nombre

#### Graphiques
- **Évolution des Achats** : Courbe avec des points de données
- **Statut des RFQ** : Graphique en donut avec des segments colorés
- **Catégories** : Graphique en barres (ou message si pas de données)
- **Secteurs** : Graphique polaire (ou message si pas de données)

#### Listes
- **Commandes Récentes** : Tableau avec des lignes (ou "Aucune commande")
- **Messages** : Liste de messages (ou "Aucun message")

### 4. Vérifier les Logs du Serveur

Dans le terminal où tourne le backend, vous devriez voir :

```
📊 Route /api/dashboard/stats appelée
✅ Connexion DB OK
```

Si vous voyez des erreurs SQL, notez-les.

## 🐛 Problèmes Possibles

### Problème 1 : "Session expirée" ou Redirection vers login

**Cause** : Pas de token d'authentification

**Solution** :
1. Allez sur `http://localhost:3000/index.html`
2. Connectez-vous avec vos identifiants
3. Revenez sur le dashboard

### Problème 2 : Les KPIs affichent "0" ou "-"

**Causes possibles** :
- La base de données est vide (pas de données)
- Erreur dans les requêtes SQL

**Vérification** :
- Regardez les logs du serveur pour les erreurs SQL
- Vérifiez que la base de données contient des données :
  ```sql
  SELECT COUNT(*) FROM commandes;
  SELECT COUNT(*) FROM rfq;
  SELECT COUNT(*) FROM entreprises WHERE type_entreprise = 'fournisseur';
  ```

### Problème 3 : Les graphiques sont vides

**Causes possibles** :
- Pas de données dans la base
- Erreur dans le parsing des données

**Vérification** :
- Ouvrez la console du navigateur
- Vérifiez les erreurs JavaScript
- Vérifiez que `stats.evolution_commandes` contient des données

### Problème 4 : Erreur 500 dans les logs du serveur

**Cause** : Erreur SQL ou problème de connexion DB

**Solution** :
- Vérifiez les logs du serveur pour l'erreur exacte
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants de connexion dans `.env`

## ✅ Checklist de Vérification

- [ ] Backend Express.js démarré sur le port 3000
- [ ] Pas de serveur Python qui tourne en même temps
- [ ] Utilisateur connecté (token présent)
- [ ] Console du navigateur sans erreurs JavaScript
- [ ] KPIs affichent des valeurs (pas "-" ou "0")
- [ ] Graphiques se chargent (ou affichent un message si pas de données)
- [ ] Listes affichent des données (ou messages appropriés)
- [ ] Logs du serveur sans erreurs SQL

## 📝 Test Manuel dans la Console

Ouvrez la console du navigateur et testez :

```javascript
// Vérifier le token
localStorage.getItem('token')

// Tester l'appel API
fetch('http://localhost:3000/api/dashboard/stats', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(data => {
    console.log('✅ Données reçues:', data);
    console.log('Commandes:', data.commandes_total);
    console.log('Montant:', data.montant_mois);
    console.log('RFQ:', data.rfq_en_cours);
    console.log('Fournisseurs:', data.fournisseurs_actifs);
})
.catch(err => console.error('❌ Erreur:', err));
```

## 🎯 Résultat Attendu

Si tout fonctionne correctement :
- ✅ Les KPIs affichent des valeurs réelles
- ✅ Les graphiques se chargent avec des données
- ✅ Les listes contiennent des éléments
- ✅ Pas d'erreurs dans la console
- ✅ Pas d'erreurs dans les logs du serveur

