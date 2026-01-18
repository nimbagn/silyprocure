# ⚠️ Note sur le Rate Limiting

## Problème
Le rate limiting pour l'authentification limite à **5 tentatives par 15 minutes** par IP. Cela peut bloquer les tests automatisés.

## Solutions

### Solution 1 : Mode Test (Recommandé)
Le rate limiter est maintenant **automatiquement désactivé** en mode test.

Pour exécuter les tests, définissez la variable d'environnement :
```bash
NODE_ENV=test node test-final-complet.js
```

Ou dans votre script de test :
```bash
export NODE_ENV=test
node test-final-complet.js
```

### Solution 2 : Attendre 15 minutes
Si vous avez épuisé les tentatives, attendez 15 minutes avant de relancer les tests.

### Solution 3 : Réinitialiser le serveur
Redémarrer le serveur backend réinitialise le rate limiter (en mémoire).

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm start
```

### Solution 4 : Augmenter la limite pour les tests
Modifier temporairement `backend/middleware/security.js` pour augmenter `max` à une valeur plus élevée (ex: 100) pendant les tests.

---

**Note** : En production, le rate limiting reste actif pour la sécurité.

