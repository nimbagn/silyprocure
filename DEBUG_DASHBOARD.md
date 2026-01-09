# 🔍 Guide de Débogage du Dashboard

## Problème : Les données ne s'affichent pas

J'ai ajouté des logs de débogage détaillés pour identifier le problème. Voici comment diagnostiquer :

## 📋 Étapes de Diagnostic

### 1. Ouvrir la Console du Navigateur
- Appuyez sur `F12` ou `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- Allez dans l'onglet **Console**

### 2. Vérifier les Logs

Vous devriez voir une séquence de logs comme ceci :

```
📄 DOM chargé, initialisation du dashboard...
🔄 Initialisation du dashboard...
📡 Appel API /api/dashboard/stats...
API Call: http://localhost:3000/api/dashboard/stats {method: 'GET', hasBody: false}
✅ Réponse API reçue, parsing JSON...
📊 Statistiques reçues: {commandes_total: 10, montant_mois: 500000, ...}
📝 Mise à jour des KPIs...
✅ KPIs mis à jour
📊 Initialisation des graphiques...
📋 Chargement des listes...
📦 Chargement des commandes récentes...
💬 Chargement des messages...
✅ Dashboard initialisé avec succès
```

## 🐛 Scénarios d'Erreur

### Scénario 1 : "Aucun token trouvé"
```
❌ Aucun token trouvé, redirection vers login
```
**Solution** : Connectez-vous d'abord sur `index.html`

### Scénario 2 : "apiCall a retourné null"
```
❌ apiCall a retourné null (probablement 401)
```
**Causes possibles** :
- Token expiré ou invalide
- Backend non démarré
- Problème de CORS

**Solutions** :
1. Vérifiez que le backend est démarré : `cd backend && npm start`
2. Reconnectez-vous
3. Vérifiez que le token est présent : `localStorage.getItem('token')` dans la console

### Scénario 3 : "Erreur 401"
```
❌ Erreur API stats: {status: 401, statusText: 'Unauthorized', ...}
```
**Solution** : Votre session a expiré, reconnectez-vous

### Scénario 4 : "Erreur 500"
```
❌ Erreur API stats: {status: 500, statusText: 'Internal Server Error', ...}
```
**Causes possibles** :
- Erreur dans le backend
- Problème de connexion à la base de données
- Erreur SQL

**Solutions** :
1. Vérifiez les logs du backend
2. Vérifiez que la base de données est accessible
3. Vérifiez que les tables existent

### Scénario 5 : "Erreur réseau"
```
❌ Erreur API: Failed to fetch
```
**Causes possibles** :
- Backend non démarré
- Mauvaise URL
- Problème de CORS
- Firewall bloquant la connexion

**Solutions** :
1. Vérifiez que le backend est démarré sur le port 3000
2. Vérifiez l'URL dans la console : `API Call: http://localhost:3000/api/dashboard/stats`
3. Testez l'endpoint directement : `curl http://localhost:3000/api/dashboard/stats`

### Scénario 6 : "Éléments DOM manquants"
```
❌ Éléments DOM manquants pour les KPIs
```
**Causes possibles** :
- Le HTML n'est pas complètement chargé
- IDs des éléments incorrects

**Solution** : Vérifiez que les IDs suivants existent dans le HTML :
- `stats-cmd-count`
- `stats-amount`
- `stats-rfq-count`
- `stats-supplier-count`
- `mainChart`
- `rfqChart`
- `categoriesChart`
- `sectorsChart`
- `recent-orders-tbody`
- `messages-list`

## 🔧 Commandes Utiles pour le Débogage

### Dans la Console du Navigateur

```javascript
// Vérifier le token
localStorage.getItem('token')

// Vérifier l'utilisateur
localStorage.getItem('user')

// Tester l'appel API manuellement
fetch('http://localhost:3000/api/dashboard/stats', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
}).then(r => r.json()).then(console.log)

// Forcer le rechargement du dashboard
initDashboard()
```

### Vérifier le Backend

```bash
# Vérifier que le backend est démarré
lsof -ti:3000

# Tester l'endpoint directement (avec un token valide)
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:3000/api/dashboard/stats
```

## 📊 Vérification des Données

### Si les données sont chargées mais ne s'affichent pas

1. **Vérifiez les KPIs** :
   - Ouvrez la console
   - Tapez : `document.getElementById('stats-cmd-count')?.innerText`
   - Devrait afficher un nombre, pas "-" ou vide

2. **Vérifiez les graphiques** :
   - Les graphiques Chart.js peuvent échouer silencieusement
   - Vérifiez la console pour les erreurs Chart.js
   - Vérifiez que les données sont au bon format :
     ```javascript
     // Dans la console après chargement
     stats.evolution_commandes  // Devrait être un tableau
     stats.rfq_par_statut        // Devrait être un tableau
     ```

3. **Vérifiez les listes** :
   - Ouvrez les DevTools → Onglet Network
   - Vérifiez les requêtes `/api/commandes` et `/api/contact/messages`
   - Vérifiez que les réponses contiennent des données

## ✅ Checklist de Vérification

- [ ] Backend démarré sur le port 3000
- [ ] Token présent dans localStorage
- [ ] Pas d'erreurs CORS dans la console
- [ ] Les requêtes API retournent 200 (onglet Network)
- [ ] Les données JSON sont valides
- [ ] Les éléments DOM existent
- [ ] Chart.js est chargé (pas d'erreur "Chart is not defined")

## 🆘 Si Rien Ne Fonctionne

1. **Videz le cache** :
   - `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
   - Ou : DevTools → Application → Clear Storage

2. **Reconnectez-vous** :
   - Allez sur `index.html`
   - Connectez-vous à nouveau

3. **Vérifiez les logs du backend** :
   - Regardez la console où le backend tourne
   - Vérifiez les erreurs SQL ou de connexion

4. **Testez avec un autre navigateur** :
   - Parfois les extensions peuvent bloquer les requêtes

## 📝 Notes

- Tous les logs commencent par un emoji pour faciliter la recherche
- Les erreurs sont préfixées par ❌
- Les succès sont préfixés par ✅
- Les informations sont préfixées par ℹ️

