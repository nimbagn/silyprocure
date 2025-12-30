# 🔧 Adaptation des Requêtes SQL pour PostgreSQL

## ⚠️ Changements nécessaires

Le wrapper créé dans `database.postgresql.js` gère la plupart des différences, mais certaines requêtes nécessitent des adaptations.

## 🔄 Changements principaux

### 1. INSERT avec récupération de l'ID

#### MySQL (actuel)
```javascript
const [result] = await pool.execute(
    'INSERT INTO utilisateurs (email, nom, prenom) VALUES (?, ?, ?)',
    [email, nom, prenom]
);
const userId = result.insertId;
```

#### PostgreSQL (à adapter)
```javascript
const [result] = await pool.execute(
    'INSERT INTO utilisateurs (email, nom, prenom) VALUES ($1, $2, $3) RETURNING id',
    [email, nom, prenom]
);
const userId = result.rows[0].id;
```

### 2. Le wrapper gère automatiquement

Le wrapper dans `database.postgresql.js` convertit automatiquement :
- `pool.execute()` → `pool.query()` avec format `[rows, fields]`
- Les placeholders `?` → `$1, $2, $3...` (géré par pg)

**MAIS** pour `insertId`, vous devez utiliser `RETURNING id` :

## 📝 Liste des fichiers à adapter

### Fichiers avec `insertId` à modifier :

1. **backend/routes/devis.js** (2 occurrences)
2. **backend/routes/contact.js** (4 occurrences)
3. **backend/routes/paiements.js** (1 occurrence)
4. **backend/routes/factures.js** (2 occurrences)
5. **backend/routes/commandes.js** (1 occurrence)
6. **backend/routes/fichiers.js** (1 occurrence)
7. **backend/routes/marges.js** (1 occurrence)
8. **backend/routes/liens_externes.js** (2 occurrences)
9. **backend/routes/rfq.js** (1 occurrence)
10. **backend/routes/excel.js** (1 occurrence)
11. **backend/routes/produits.js** (1 occurrence)
12. **backend/routes/upload_excel.js** (1 occurrence)
13. **backend/routes/catalogue_fournisseur.js** (1 occurrence)
14. **backend/routes/produits_fournisseur.js** (1 occurrence)
15. **backend/routes/utilisateurs.js** (1 occurrence)
16. **backend/routes/adresses.js** (1 occurrence)
17. **backend/routes/entreprises.js** (1 occurrence)

## 🔧 Solution : Adapter le wrapper

Mettre à jour `backend/config/database.postgresql.js` :

```javascript
// Wrapper pour compatibilité avec mysql2
pool.execute = async (query, params) => {
    try {
        // Convertir les placeholders ? en $1, $2, etc.
        let pgQuery = query;
        let paramIndex = 1;
        const pgParams = [];
        
        if (params && params.length > 0) {
            pgQuery = query.replace(/\?/g, () => {
                pgParams.push(params[paramIndex - 1]);
                return `$${paramIndex++}`;
            });
        }
        
        const result = await pool.query(pgQuery, pgParams);
        
        // Simuler insertId si RETURNING id est présent
        const mockResult = {
            insertId: null,
            affectedRows: result.rowCount,
            rows: result.rows,
            fields: result.fields
        };
        
        // Si la requête contient RETURNING id, utiliser le premier résultat
        if (pgQuery.toUpperCase().includes('RETURNING') && result.rows.length > 0) {
            mockResult.insertId = result.rows[0].id || result.rows[0][Object.keys(result.rows[0])[0]];
        }
        
        // Retourner le format [rows, fields] comme mysql2
        return [result.rows, result.fields];
    } catch (error) {
        throw error;
    }
};
```

## ✅ Solution recommandée : Modifier les requêtes INSERT

### Exemple d'adaptation

#### Avant (MySQL)
```javascript
// backend/routes/utilisateurs.js
const [result] = await pool.execute(
    'INSERT INTO utilisateurs (email, nom, prenom, mot_de_passe) VALUES (?, ?, ?, ?)',
    [email, nom, prenom, hashedPassword]
);
res.status(201).json({ id: result.insertId, message: 'Utilisateur créé avec succès' });
```

#### Après (PostgreSQL)
```javascript
// backend/routes/utilisateurs.js
const [result] = await pool.execute(
    'INSERT INTO utilisateurs (email, nom, prenom, mot_de_passe) VALUES ($1, $2, $3, $4) RETURNING id',
    [email, nom, prenom, hashedPassword]
);
res.status(201).json({ id: result.rows[0].id, message: 'Utilisateur créé avec succès' });
```

## 🚀 Script d'adaptation automatique

Créer un script pour adapter automatiquement les requêtes :

```bash
# Script à créer : scripts/adapt_queries_for_postgresql.sh
# Ce script remplace les INSERT sans RETURNING par des INSERT avec RETURNING id
```

## 📋 Checklist d'adaptation

Pour chaque fichier avec `insertId` :

- [ ] Trouver la requête INSERT correspondante
- [ ] Ajouter `RETURNING id` à la fin de la requête
- [ ] Remplacer `result.insertId` par `result.rows[0].id`
- [ ] Tester la création d'un enregistrement
- [ ] Vérifier que l'ID est correctement retourné

## 🔍 Exemple complet

### Fichier : `backend/routes/entreprises.js`

#### Avant
```javascript
const [result] = await pool.execute(
    'INSERT INTO entreprises (nom, type_entreprise, email) VALUES (?, ?, ?)',
    [nom, type_entreprise, email]
);
res.status(201).json({ id: result.insertId, message: 'Entreprise créée avec succès' });
```

#### Après
```javascript
const [result] = await pool.execute(
    'INSERT INTO entreprises (nom, type_entreprise, email) VALUES ($1, $2, $3) RETURNING id',
    [nom, type_entreprise, email]
);
res.status(201).json({ id: result.rows[0].id, message: 'Entreprise créée avec succès' });
```

## ⚡ Solution temporaire : Wrapper amélioré

Si vous ne voulez pas modifier toutes les requêtes immédiatement, vous pouvez améliorer le wrapper pour détecter automatiquement les INSERT et ajouter RETURNING :

```javascript
// Dans database.postgresql.js
pool.execute = async (query, params) => {
    try {
        let pgQuery = query;
        let paramIndex = 1;
        const pgParams = [];
        
        // Convertir ? en $1, $2, etc.
        if (params && params.length > 0) {
            pgQuery = query.replace(/\?/g, () => {
                pgParams.push(params[paramIndex - 1]);
                return `$${paramIndex++}`;
            });
        }
        
        // Si c'est un INSERT sans RETURNING, l'ajouter automatiquement
        if (pgQuery.trim().toUpperCase().startsWith('INSERT') && 
            !pgQuery.toUpperCase().includes('RETURNING')) {
            // Extraire le nom de la table
            const tableMatch = pgQuery.match(/INTO\s+(\w+)/i);
            if (tableMatch) {
                pgQuery += ' RETURNING id';
            }
        }
        
        const result = await pool.query(pgQuery, pgParams);
        
        // Créer un objet compatible avec mysql2
        const mockResult = {
            insertId: result.rows.length > 0 && result.rows[0].id ? result.rows[0].id : null,
            affectedRows: result.rowCount,
            rows: result.rows
        };
        
        return [result.rows, mockResult];
    } catch (error) {
        throw error;
    }
};
```

**Note** : Cette solution fonctionne mais il est préférable d'adapter les requêtes manuellement pour plus de contrôle.

## 📚 Ressources

- [PostgreSQL INSERT RETURNING](https://www.postgresql.org/docs/current/sql-insert.html)
- [pg driver documentation](https://node-postgres.com/features/queries)

---

**Important** : Testez chaque route après adaptation pour vérifier que tout fonctionne correctement !

