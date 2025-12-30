# 🧪 Guide de Test des Fonctionnalités IA

## ✅ Tests Unitaires - RÉUSSIS

Tous les services IA ont été testés et fonctionnent correctement :
- ✅ Configuration AI
- ✅ Client IA
- ✅ Quote Analyzer
- ✅ Supplier Recommender
- ✅ Anomaly Detector
- ✅ Chatbot
- ✅ Routes API

## 🚀 Tests à Effectuer dans l'Interface

### 1. Analyse Intelligente des Devis

**Page**: `http://localhost:3000/devis-compare.html?ids=1,2,3`

**Étapes**:
1. Accédez à la page de comparaison des devis avec plusieurs devis
2. Vérifiez que la section "Analyse IA" s'affiche automatiquement
3. Vérifiez l'affichage des scores (0-100) pour chaque devis
4. Vérifiez les recommandations IA
5. Vérifiez les anomalies détectées (si présentes)
6. Cliquez sur "Actualiser" pour relancer l'analyse

**API à tester**:
```bash
# Analyser les devis d'une RFQ
POST http://localhost:3000/api/ai/analyze-quotes/:rfq_id

# Récupérer une analyse existante
GET http://localhost:3000/api/ai/analyze-quotes/:rfq_id
```

### 2. Recommandation de Fournisseurs

**API à tester**:
```bash
# Recommander des fournisseurs pour une demande de devis
POST http://localhost:3000/api/ai/recommend-suppliers
Content-Type: application/json
{
  "demande_devis_id": 1
}

# Recommander des fournisseurs pour une RFQ
POST http://localhost:3000/api/ai/recommend-suppliers
Content-Type: application/json
{
  "rfq_id": 1
}
```

**Réponse attendue**:
```json
{
  "recommendations": [
    {
      "fournisseur_id": 1,
      "fournisseur_nom": "Fournisseur ABC",
      "score": 85,
      "score_details": {
        "historique": 32,
        "performance": 25,
        "capacite": 18,
        "localisation": 10
      },
      "match_reasons": [
        "Secteur d'activité correspondant: Électronique",
        "Taux d'acceptation: 80% (4/5 devis)"
      ]
    }
  ]
}
```

### 3. Détection d'Anomalies

**API à tester**:
```bash
# Détecter les anomalies d'un devis
POST http://localhost:3000/api/ai/detect-anomalies/:devis_id

# Récupérer les anomalies
GET http://localhost:3000/api/ai/anomalies?entite_type=devis&entite_id=1&resolue=false
```

**Types d'anomalies détectées**:
- `prix_trop_bas` : Prix anormalement bas (< 70% de la moyenne)
- `prix_trop_haut` : Prix élevé (> 150% de la moyenne)
- `incoherence_calcul` : Incohérence entre prix unitaires et total
- `conditions_defavorables` : Conditions de paiement défavorables
- `pattern_toujours_plus_cher` : Fournisseur systématiquement le plus cher
- `pattern_toujours_moins_cher` : Fournisseur systématiquement le moins cher

**Note**: La détection d'anomalies est automatiquement déclenchée lors de la création d'un devis.

### 4. Chatbot d'Assistance

**API à tester**:
```bash
# Envoyer un message au chatbot
POST http://localhost:3000/api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>
{
  "message": "Bonjour, où en est ma demande de devis ?",
  "context": {
    "reference": "DEV-2024-001"
  }
}
```

**Messages de test**:
- "Bonjour" → Salutation
- "Aide" → Guide d'utilisation
- "Où en est ma demande ?" → Suivi de statut
- "Quel est le délai ?" → FAQ

## 📊 Base de Données

### Migration SQL

Exécutez la migration pour créer les tables nécessaires :

```bash
node database/run_migration_ai.js
```

Ou manuellement via MySQL :

```bash
mysql -u soul -pSatina2025 silypro < database/migration_ai_analyses.sql
```

### Tables créées

1. **ai_analyses** : Cache des analyses IA
2. **ai_recommendations** : Recommandations générées
3. **ai_anomalies** : Anomalies détectées

## ⚙️ Configuration

### Variables d'environnement (optionnel)

Pour activer les APIs IA externes, ajoutez dans `.env` :

```env
# Provider IA (hybrid, openai, claude, ollama)
AI_PROVIDER=hybrid

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Claude (optionnel)
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-haiku-20240307

# Ollama (optionnel, local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**Note**: Par défaut, le système fonctionne en mode "hybrid" (règles métier) sans nécessiter d'API externe.

## 🎯 Scénarios de Test Complets

### Scénario 1 : Comparaison de devis avec IA

1. Créez une RFQ avec plusieurs produits
2. Créez 3-4 devis différents pour cette RFQ
3. Accédez à `devis-compare.html?ids=<id1>,<id2>,<id3>`
4. Vérifiez que l'analyse IA s'affiche avec :
   - Scores pour chaque devis
   - Recommandation du meilleur devis
   - Anomalies détectées (si présentes)
5. Les boutons "Accepter" affichent maintenant les scores IA

### Scénario 2 : Recommandation automatique de fournisseurs

1. Créez une demande de devis client
2. Utilisez l'API pour obtenir des recommandations :
   ```javascript
   const response = await fetch('/api/ai/recommend-suppliers', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ demande_devis_id: 1 })
   });
   ```
3. Vérifiez que les fournisseurs sont classés par score
4. Utilisez ces recommandations pour créer une RFQ

### Scénario 3 : Détection automatique d'anomalies

1. Créez un devis avec un prix anormalement bas ou haut
2. Vérifiez que les anomalies sont détectées automatiquement
3. Consultez les anomalies via l'API :
   ```javascript
   const response = await fetch('/api/ai/anomalies?entite_type=devis&entite_id=1');
   ```

## 🔍 Vérifications

- [ ] L'analyse IA s'affiche sur la page de comparaison
- [ ] Les scores sont calculés correctement (0-100)
- [ ] Les recommandations sont pertinentes
- [ ] Les anomalies sont détectées automatiquement
- [ ] Le chatbot répond aux questions
- [ ] Les routes API fonctionnent sans erreur
- [ ] Les tables de base de données sont créées

## 📝 Notes

- Le mode "hybrid" fonctionne sans API externe (règles métier)
- Les APIs externes (OpenAI, Claude) sont optionnelles
- Les analyses sont mises en cache pour améliorer les performances
- La détection d'anomalies est non-bloquante (ne ralentit pas la création de devis)

