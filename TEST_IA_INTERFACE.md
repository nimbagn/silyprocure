# 🧪 Guide de Test IA - Interface Web

## ✅ Serveur en cours d'exécution

Le serveur est actif sur `http://localhost:3000`

## 🚀 Tests à Effectuer

### Test 1 : Analyse IA sur la Page de Comparaison

**Étape 1** : Accéder à une page de comparaison de devis

1. Connectez-vous à `http://localhost:3000`
2. Allez dans **Devis** → Sélectionnez plusieurs devis
3. Cliquez sur **Comparer** ou accédez directement à :
   ```
   http://localhost:3000/devis-compare.html?ids=1,2,3
   ```
   (Remplacez 1,2,3 par de vrais IDs de devis)

**Étape 2** : Vérifier l'affichage de l'analyse IA

Vous devriez voir :
- ✅ Une section **"Analyse IA"** avec un fond violet/dégradé
- ✅ Des **cartes de score** pour chaque devis (0-100)
- ✅ Des **recommandations** avec le meilleur devis
- ✅ Des **anomalies détectées** (si présentes)
- ✅ Un bouton **"Actualiser"** pour relancer l'analyse

**Étape 3** : Tester le bouton "Actualiser"

1. Cliquez sur **"Actualiser"** dans la section Analyse IA
2. Vérifiez que l'analyse se relance
3. Vérifiez que les scores sont mis à jour

### Test 2 : API Analyse IA (via Console Navigateur)

**Ouvrez la console du navigateur** (F12) et testez :

```javascript
// 1. Analyser les devis d'une RFQ (remplacez 1 par un vrai RFQ ID)
fetch('/api/ai/analyze-quotes/1', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(data => {
    console.log('📊 Analyse IA:', data);
    console.log('Scores:', data.scores);
    console.log('Recommandations:', data.recommendations);
    console.log('Anomalies:', data.anomalies);
});

// 2. Récupérer une analyse existante
fetch('/api/ai/analyze-quotes/1', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(data => console.log('📊 Analyse en cache:', data));
```

### Test 3 : API Recommandation de Fournisseurs

```javascript
// Recommander des fournisseurs pour une demande de devis
fetch('/api/ai/recommend-suppliers', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        demande_devis_id: 1  // Remplacez par un vrai ID
    })
})
.then(r => r.json())
.then(data => {
    console.log('💡 Recommandations fournisseurs:', data);
    data.recommendations.forEach((rec, i) => {
        console.log(`${i+1}. ${rec.fournisseur_nom} - Score: ${rec.score}/100`);
    });
});
```

### Test 4 : API Détection d'Anomalies

```javascript
// Détecter les anomalies d'un devis
fetch('/api/ai/detect-anomalies/1', {  // Remplacez 1 par un vrai devis ID
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(data => {
    console.log('⚠️ Anomalies détectées:', data);
    data.anomalies.forEach((anomaly, i) => {
        console.log(`${i+1}. [${anomaly.severity}] ${anomaly.type}: ${anomaly.message}`);
    });
});

// Récupérer toutes les anomalies
fetch('/api/ai/anomalies?entite_type=devis&resolue=false', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(data => console.log('📋 Toutes les anomalies:', data));
```

### Test 5 : API Chatbot

```javascript
// Tester le chatbot
fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: 'Bonjour',
        context: {}
    })
})
.then(r => r.json())
.then(data => console.log('🤖 Chatbot:', data.response));

// Autres messages à tester
const messages = [
    'aide',
    'quel est le délai ?',
    'où en est ma demande ?',
    'combien ça coûte ?'
];

messages.forEach(msg => {
    fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msg, context: {} })
    })
    .then(r => r.json())
    .then(data => console.log(`Q: ${msg}\nA: ${data.response}\n`));
});
```

## 📋 Checklist de Validation

### Page de Comparaison
- [ ] La section "Analyse IA" s'affiche automatiquement
- [ ] Les scores sont visibles pour chaque devis (0-100)
- [ ] Les recommandations sont affichées
- [ ] Les anomalies sont visibles (si présentes)
- [ ] Le bouton "Actualiser" fonctionne
- [ ] Les boutons "Accepter" affichent les scores IA

### APIs
- [ ] `POST /api/ai/analyze-quotes/:rfq_id` fonctionne
- [ ] `GET /api/ai/analyze-quotes/:rfq_id` fonctionne
- [ ] `POST /api/ai/recommend-suppliers` fonctionne
- [ ] `POST /api/ai/detect-anomalies/:devis_id` fonctionne
- [ ] `GET /api/ai/anomalies` fonctionne
- [ ] `POST /api/ai/chat` fonctionne

## 🎯 Scénario de Test Complet

### 1. Créer des données de test

Si vous n'avez pas de devis, créez-en :

1. Allez dans **RFQ** → Créez une RFQ
2. Créez 2-3 devis différents pour cette RFQ avec des prix variés
3. Allez dans **Devis** → Sélectionnez ces devis → **Comparer**

### 2. Vérifier l'analyse automatique

1. Sur la page de comparaison, l'analyse IA devrait s'afficher automatiquement
2. Vérifiez les scores (le meilleur devis devrait avoir le score le plus élevé)
3. Vérifiez les recommandations

### 3. Tester la détection d'anomalies

1. Créez un devis avec un prix anormalement bas ou haut
2. Vérifiez dans la console que les anomalies sont détectées
3. Ou utilisez l'API directement

## 🐛 Dépannage

### Problème : L'analyse IA ne s'affiche pas

**Solutions** :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que le RFQ ID est valide
3. Vérifiez que les devis ont bien un `rfq_id`
4. Vérifiez les logs du serveur

### Problème : Erreur 500 sur l'API

**Solutions** :
1. Vérifiez que les tables AI existent (exécutez la migration)
2. Vérifiez les logs du serveur
3. Vérifiez que vous êtes authentifié (token valide)

### Problème : Scores toujours à 0

**Solutions** :
1. Vérifiez que les devis ont des lignes
2. Vérifiez que les totaux sont calculés
3. Vérifiez que les fournisseurs existent

## 📊 Résultats Attendus

### Analyse IA
- Scores entre 0 et 100
- Recommandations pertinentes
- Anomalies détectées si prix anormaux
- Meilleur devis identifié

### Recommandations Fournisseurs
- Liste de fournisseurs triés par score
- Scores détaillés (historique, performance, capacité, localisation)
- Raisons de correspondance

### Détection d'Anomalies
- Anomalies de prix (trop bas/haut)
- Incohérences de calcul
- Conditions défavorables
- Patterns suspects

### Chatbot
- Réponses pertinentes aux questions
- Gestion des intentions (salutation, aide, statut, FAQ)
- Réponses en français

