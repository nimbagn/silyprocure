# 🚀 Exécuter les Données de Test IA

## ⚠️ Problème de Connexion

Le script automatique ne peut pas se connecter à MySQL depuis l'environnement. Voici comment exécuter manuellement :

## 📋 Méthode 1 : MySQL en Ligne de Commande

```bash
cd /Users/dantawi/Documents/SilyProcure
mysql -u soul -pSatina2025 silypro < database/insert_test_data_ai.sql
```

## 📋 Méthode 2 : MySQL Workbench / phpMyAdmin

1. **Ouvrez MySQL Workbench** ou **phpMyAdmin**
2. **Sélectionnez la base** `silypro`
3. **Ouvrez le fichier** `database/insert_test_data_ai.sql`
4. **Exécutez le script** complet

## 📋 Méthode 3 : Via l'Interface Web (si disponible)

Si vous avez phpMyAdmin ou une interface web MySQL :
1. Connectez-vous
2. Sélectionnez la base `silypro`
3. Allez dans l'onglet "SQL"
4. Copiez-collez le contenu de `database/insert_test_data_ai.sql`
5. Cliquez sur "Exécuter"

## ✅ Vérification après Exécution

### 1. Vérifier que la RFQ a été créée

```sql
SELECT id, numero, description, statut 
FROM rfq 
WHERE numero = 'RFQ-TEST-IA-001';
```

### 2. Vérifier que les devis ont été créés

```sql
SELECT d.id, d.numero, e.nom as fournisseur, d.total_ttc, d.delai_livraison
FROM devis d
LEFT JOIN entreprises e ON d.fournisseur_id = e.id
WHERE d.numero LIKE 'DEV-TEST-IA-%'
ORDER BY d.total_ttc;
```

### 3. Récupérer les IDs pour l'URL de test

```sql
SELECT GROUP_CONCAT(d.id ORDER BY d.id) as devis_ids
FROM devis d
WHERE d.numero LIKE 'DEV-TEST-IA-%';
```

**Exemple de résultat** : `1,2,3,4`

### 4. Tester l'analyse IA

Ouvrez dans votre navigateur :
```
http://localhost:3000/devis-compare.html?ids=1,2,3,4
```

(Remplacez `1,2,3,4` par les IDs récupérés)

## 🐛 Dépannage

### Erreur : "Table doesn't exist"

**Solution** : Exécutez d'abord les migrations de base :
```sql
-- Vérifiez que les tables existent
SHOW TABLES LIKE 'rfq';
SHOW TABLES LIKE 'devis';
SHOW TABLES LIKE 'entreprises';
```

### Erreur : "Foreign key constraint fails"

**Solution** : Les fournisseurs ou produits n'existent pas. Le script les crée automatiquement, mais si ça échoue :

```sql
-- Créer un fournisseur manuellement si nécessaire
INSERT INTO entreprises (nom, type, secteur_activite, email, actif)
VALUES ('TechGuinée SARL', 'fournisseur', 'Informatique', 'contact@techguinee.gn', 1)
ON DUPLICATE KEY UPDATE nom = nom;
```

### Erreur : "Duplicate entry"

**Solution** : Les données existent déjà. Supprimez-les d'abord :

```sql
-- Supprimer les données de test existantes
DELETE FROM devis_lignes WHERE devis_id IN (
    SELECT id FROM devis WHERE numero LIKE 'DEV-TEST-IA-%'
);
DELETE FROM devis WHERE numero LIKE 'DEV-TEST-IA-%';
DELETE FROM rfq_lignes WHERE rfq_id IN (
    SELECT id FROM rfq WHERE numero = 'RFQ-TEST-IA-001'
);
DELETE FROM rfq WHERE numero = 'RFQ-TEST-IA-001';
```

Puis réexécutez le script.

## 📊 Résultats Attendus

Après exécution réussie, vous devriez avoir :

- ✅ 1 RFQ : `RFQ-TEST-IA-001`
- ✅ 4 devis : `DEV-TEST-IA-001` à `DEV-TEST-IA-004`
- ✅ Totaux calculés automatiquement
- ✅ Lignes de devis créées pour chaque devis

## 🎯 Prochaines Étapes

1. ✅ Exécutez le script SQL
2. ✅ Vérifiez les données créées
3. ✅ Récupérez les IDs des devis
4. ✅ Testez sur `http://localhost:3000/devis-compare.html?ids=<ids>`
5. ✅ Vérifiez que l'analyse IA s'affiche correctement

