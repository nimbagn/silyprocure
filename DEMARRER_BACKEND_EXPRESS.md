# 🚀 Comment Démarrer le Backend Express.js

## ⚠️ Problème Actuel

Vous utilisez actuellement un serveur HTTP Python simple qui **ne peut pas** gérer les routes API comme `/api/dashboard/stats`. C'est pourquoi vous recevez une erreur 404.

## ✅ Solution : Démarrer le Backend Express.js

### Étape 1 : Arrêter le Serveur Python

Dans le terminal où tourne `start-server-3000.sh` ou `python3 -m http.server`, appuyez sur **Ctrl+C** pour l'arrêter.

### Étape 2 : Démarrer le Backend Express.js

Ouvrez un **nouveau terminal** et exécutez :

```bash
cd /Users/dantawi/Documents/SilyProcure/backend
npm start
```

### Étape 3 : Vérifier les Logs

Vous devriez voir dans les logs :

```
✅ Route dashboard chargée
✅ Route /api/dashboard enregistrée
📊 Utilisation de MySQL
✅ Connexion à la base de données MySQL réussie
🚀 Serveur SilyProcure démarré sur le port 3000
📱 Application disponible sur http://localhost:3000
```

### Étape 4 : Tester le Dashboard

1. Ouvrez `http://localhost:3000/dashboard.html` dans votre navigateur
2. Les données devraient maintenant se charger depuis la base de données MySQL locale

## 🔍 Vérification

### Dans la Console du Navigateur

Vous devriez voir :
```
📡 Appel API /api/dashboard/stats...
API Call: http://localhost:3000/api/dashboard/stats
✅ Réponse API reçue, parsing JSON...
📊 Statistiques reçues: {...}
```

### Dans les Logs du Serveur

Quand vous chargez le dashboard, vous devriez voir :
```
📊 Route /api/dashboard/stats appelée
✅ Connexion DB OK
```

## ⚙️ Configuration

Le backend Express.js :
- ✅ Sert les fichiers statiques du frontend (comme le serveur Python)
- ✅ Gère toutes les routes API (`/api/*`)
- ✅ Se connecte à MySQL local par défaut
- ✅ Convertit automatiquement les requêtes pour PostgreSQL sur Render

## 🆘 Si ça ne fonctionne pas

1. **Vérifiez que le port 3000 est libre** :
   ```bash
   lsof -ti:3000
   ```
   Si un processus est retourné, tuez-le : `kill -9 <PID>`

2. **Vérifiez que MySQL est démarré** :
   ```bash
   mysql -u soul -p
   # Mot de passe: Satina2025
   ```

3. **Vérifiez les logs du backend** pour voir les erreurs éventuelles

4. **Vérifiez que vous êtes connecté** (token dans localStorage)

## 📝 Note Importante

**Ne démarrez jamais les deux serveurs en même temps !**
- ❌ Serveur Python (`python3 -m http.server`) → Ne gère PAS les API
- ✅ Backend Express.js (`npm start`) → Gère tout (frontend + API)

