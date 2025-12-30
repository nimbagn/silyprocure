# 📝 Guide de Création des Données de Test pour l'IA

## 🎯 Objectif

Créer une RFQ avec plusieurs devis variés pour tester l'analyse IA :
- Devis avec prix moyens (bon rapport qualité/prix)
- Devis avec prix élevés (meilleures garanties)
- Devis avec prix bas (délai long)
- Devis avec prix anormalement bas (anomalie à détecter)

## 🚀 Méthode 1 : Exécution Automatique (Recommandée)

```bash
# Depuis le répertoire du projet
cd /Users/dantawi/Documents/SilyProcure
node database/run_insert_test_data_ai.js
```

Le script va :
1. Créer les fournisseurs si nécessaire
2. Créer les produits si nécessaire
3. Créer une RFQ de test
4. Créer 4 devis avec des prix variés
5. Afficher l'URL de test

## 🛠️ Méthode 2 : Exécution Manuelle via MySQL

```bash
mysql -u soul -pSatina2025 silypro < database/insert_test_data_ai.sql
```

Ou via MySQL Workbench / phpMyAdmin :
1. Ouvrez le fichier `database/insert_test_data_ai.sql`
2. Exécutez le script complet

## 📋 Données Créées

### RFQ
- **Numéro** : `RFQ-TEST-IA-001`
- **Description** : RFQ de test pour analyse IA - Équipements informatiques
- **3 lignes** : Ordinateurs portables, PC de bureau, Imprimantes

### Devis 1 : DEV-TEST-IA-001
- **Fournisseur** : TechGuinée SARL
- **Prix** : Moyen (144,904,000 GNF)
- **Délai** : 15 jours
- **Remise** : 5%
- **Conditions** : 30% à la commande, 70% à la livraison
- **Garantie** : 1 an
- **Score attendu** : Élevé (bon rapport qualité/prix)

### Devis 2 : DEV-TEST-IA-002
- **Fournisseur** : Fournisseur Premium
- **Prix** : Élevé (159,300,000 GNF)
- **Délai** : 20 jours
- **Remise** : 0%
- **Conditions** : 50% à la commande, 50% à la livraison
- **Garantie** : 2 ans
- **Score attendu** : Moyen-Élevé (meilleures garanties)

### Devis 3 : DEV-TEST-IA-003
- **Fournisseur** : BureauPro Conakry
- **Prix** : Bas (135,700,000 GNF)
- **Délai** : 30 jours
- **Remise** : 10%
- **Conditions** : 100% à la livraison
- **Garantie** : 6 mois
- **Score attendu** : Moyen (prix bas mais délai long)

### Devis 4 : DEV-TEST-IA-004
- **Fournisseur** : TechGuinée SARL
- **Prix** : Anormalement bas (106,200,000 GNF)
- **Délai** : 25 jours
- **Remise** : 15%
- **Conditions** : 100% d'avance
- **Garantie** : 3 mois
- **Score attendu** : Bas (anomalie à détecter)
- **Anomalie** : Prix < 70% de la moyenne → Détection automatique

## 🧪 Test de l'Analyse IA

### Étape 1 : Récupérer les IDs des devis

Après l'exécution du script, récupérez les IDs :

```sql
SELECT d.id, d.numero, e.nom as fournisseur, d.total_ttc
FROM devis d
LEFT JOIN entreprises e ON d.fournisseur_id = e.id
WHERE d.numero LIKE 'DEV-TEST-IA-%'
ORDER BY d.id;
```

### Étape 2 : Accéder à la page de comparaison

Ouvrez dans votre navigateur :
```
http://localhost:3000/devis-compare.html?ids=<id1>,<id2>,<id3>,<id4>
```

Remplacez `<id1>`, `<id2>`, etc. par les IDs récupérés.

### Étape 3 : Vérifier l'analyse IA

Vous devriez voir :
- ✅ Section "Analyse IA" avec scores pour chaque devis
- ✅ Recommandation du meilleur devis (DEV-TEST-IA-001 attendu)
- ✅ Anomalie détectée pour DEV-TEST-IA-004 (prix trop bas)

## 🔍 Vérification des Résultats

### Scores Attendus (approximatifs)

1. **DEV-TEST-IA-001** : ~75-85/100
   - Bon prix
   - Bon délai (15 jours)
   - Bonnes conditions (30/70)
   - Garantie standard

2. **DEV-TEST-IA-002** : ~65-75/100
   - Prix élevé
   - Délai moyen (20 jours)
   - Garantie longue (2 ans) → bonus

3. **DEV-TEST-IA-003** : ~60-70/100
   - Prix bas
   - Délai long (30 jours) → pénalité
   - Conditions défavorables (100% à la livraison)

4. **DEV-TEST-IA-004** : ~40-50/100
   - Prix anormalement bas → anomalie
   - Conditions très défavorables (100% avance)
   - Garantie courte (3 mois)

### Anomalies Attendues

- **DEV-TEST-IA-004** : 
  - Type : `prix_trop_bas`
  - Severity : `warning`
  - Message : "Prix anormalement bas (< 70% de la moyenne) - Risque qualité"

## 🐛 Dépannage

### Problème : Script échoue

**Solutions** :
1. Vérifiez que MySQL est en cours d'exécution
2. Vérifiez les identifiants dans `.env`
3. Exécutez manuellement via MySQL Workbench
4. Vérifiez les logs d'erreur

### Problème : Aucun devis créé

**Solutions** :
1. Vérifiez que les fournisseurs existent
2. Vérifiez que les produits existent
3. Vérifiez que la RFQ a été créée
4. Vérifiez les contraintes de clés étrangères

### Problème : Totaux incorrects

**Solutions** :
1. Le script recalcule automatiquement les totaux
2. Si problème, exécutez manuellement :
   ```sql
   UPDATE devis d
   SET d.total_ht = (SELECT SUM(total_ht) FROM devis_lignes WHERE devis_id = d.id),
       d.total_tva = (SELECT SUM(total_ht * tva_taux / 100) FROM devis_lignes WHERE devis_id = d.id),
       d.total_ttc = d.total_ht + d.total_tva
   WHERE d.numero LIKE 'DEV-TEST-IA-%';
   ```

## 📊 Requêtes Utiles

### Voir tous les devis de test
```sql
SELECT d.id, d.numero, e.nom as fournisseur, d.total_ttc, d.delai_livraison, d.garanties
FROM devis d
LEFT JOIN entreprises e ON d.fournisseur_id = e.id
WHERE d.numero LIKE 'DEV-TEST-IA-%'
ORDER BY d.total_ttc;
```

### Voir les lignes d'un devis
```sql
SELECT * FROM devis_lignes WHERE devis_id = <id>;
```

### Voir l'analyse IA en cache
```sql
SELECT * FROM ai_analyses WHERE rfq_id = (SELECT id FROM rfq WHERE numero = 'RFQ-TEST-IA-001');
```

### Voir les anomalies détectées
```sql
SELECT * FROM ai_anomalies WHERE entite_type = 'devis' AND entite_id IN (
    SELECT id FROM devis WHERE numero LIKE 'DEV-TEST-IA-%'
);
```

## ✅ Checklist

- [ ] Script exécuté avec succès
- [ ] RFQ créée (RFQ-TEST-IA-001)
- [ ] 4 devis créés
- [ ] Totaux calculés correctement
- [ ] Page de comparaison accessible
- [ ] Analyse IA s'affiche
- [ ] Scores calculés
- [ ] Anomalies détectées

