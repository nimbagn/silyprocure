# 🚀 Comment Démarrer le Backend Express.js

## Problème Actuel

Vous utilisez actuellement un serveur HTTP simple (`python3 -m http.server`) qui sert uniquement les fichiers statiques. Ce serveur **ne peut pas** gérer les routes API comme `/api/dashboard/stats`.

## Solution : Démarrer le Backend Express.js

Le backend Express.js doit être démarré pour gérer les routes API. Il peut aussi servir le frontend.

### Option 1 : Backend sur le port 3000 (Recommandé)

1. **Arrêtez le serveur Python actuel** (Ctrl+C dans le terminal)

2. **Démarrez le backend Express.js** :
```bash
cd /Users/dantawi/Documents/SilyProcure/backend
npm start
```

Le backend Express.js va :
- Servir les fichiers statiques du frontend
- Gérer toutes les routes API (`/api/*`)
- Écouter sur le port 3000

3. **Ouvrez le dashboard** :
   - URL : `http://localhost:3000/dashboard.html`

### Option 2 : Backend sur un port différent (3001)

Si vous voulez garder le serveur Python pour le frontend :

1. **Démarrez le backend Express.js sur le port 3001** :
```bash
cd /Users/dantawi/Documents/SilyProcure/backend
PORT=3001 npm start
```

2. **Modifiez `frontend/js/auth.js`** pour pointer vers le port 3001 :
```javascript
// Dans auth.js, ligne ~57
baseUrl = 'http://localhost:3001';  // Au lieu de 3000
```

3. **Gardez le serveur Python sur le port 3000** pour servir le frontend

## Vérification

Après avoir démarré le backend, vous devriez voir dans les logs :
```
✅ Route dashboard chargée
✅ Route /api/dashboard enregistrée
🚀 Serveur SilyProcure démarré sur le port 3000
📱 Application disponible sur http://localhost:3000
```

## Test Rapide

Une fois le backend démarré, testez dans la console du navigateur :
```javascript
fetch('http://localhost:3000/api/dashboard/stats', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(console.log)
```

Si ça fonctionne, vous verrez les statistiques dans la console.

## Note Importante

Le backend Express.js **doit être démarré** pour que les routes API fonctionnent. Le serveur Python simple ne peut pas exécuter du code Node.js/Express.

