# 🚀 Lancement du Projet SilyProcure

## ✅ État actuel

Le projet est en cours de démarrage...

## 📋 Informations de connexion

### Interface Web
- **URL:** http://localhost:3000
- **Port:** 3000 (par défaut)

### Compte Administrateur
- **Email:** admin@silyprocure.com
- **Mot de passe:** 12345

## 🔍 Vérification du démarrage

### 1. Vérifier que le serveur tourne

```bash
# Vérifier le processus
ps aux | grep "node backend/server.js"

# Tester la connexion
curl http://localhost:3000
```

### 2. Vérifier les logs

Le serveur devrait afficher :
```
✅ Connexion à la base de données MySQL réussie
🚀 Serveur démarré sur le port 3000
```

### 3. Accéder à l'interface

Ouvrez votre navigateur et allez sur :
- http://localhost:3000

## 🛠️ Commandes utiles

### Démarrer le serveur
```bash
npm start
```

### Démarrer en mode développement (avec auto-reload)
```bash
npm run dev
```

### Arrêter le serveur
```bash
# Trouver le processus
ps aux | grep "node backend/server.js"

# Arrêter (remplacer PID par le numéro du processus)
kill PID
```

## ⚠️ Problèmes courants

### Le serveur ne démarre pas

1. **Vérifier que le port 3000 est libre**
```bash
lsof -i :3000
```

2. **Vérifier la base de données**
```bash
# MySQL
mysql -u soul -pSatina2025 silypro -e "SELECT 1;"

# PostgreSQL
psql -U soul -d silypro -c "SELECT 1;"
```

3. **Vérifier le fichier .env**
```bash
cat .env
```

### Erreur de connexion à la base de données

- Vérifier que MySQL/PostgreSQL est démarré
- Vérifier les identifiants dans `.env`
- Vérifier que la base de données existe

### Erreur JWT_SECRET

Créer un fichier `.env` avec :
```env
JWT_SECRET=votre-secret-tres-securise
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=soul
DB_PASSWORD=Satina2025
```

## 📝 Prochaines étapes

1. ✅ Serveur démarré
2. 🌐 Accéder à http://localhost:3000
3. 🔐 Se connecter avec admin@silyprocure.com / 12345
4. ⚙️ Configurer l'application selon vos besoins

---

**Le projet est maintenant lancé !** 🎉

