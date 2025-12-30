# Migration RCCM et GNF

## 📋 Changements

Cette migration ajoute le support du **RCCM** (Registre du Commerce et du Crédit Mobilier) et change la monnaie en **GNF** (Franc guinéen).

## 🚀 Installation

### 1. Exécuter la migration

```bash
mysql -u soul -pSatina2025 silypro < database/migration_rccm_gnf.sql
```

### 2. Vérifier la migration

```bash
mysql -u soul -pSatina2025 silypro -e "DESCRIBE entreprises;"
```

Vous devriez voir les nouvelles colonnes :
- `rccm`
- `numero_contribuable`
- `capital_social`
- `forme_juridique`
- `secteur_activite`

## 📊 Modifications apportées

### Table entreprises
- ✅ Ajout colonne `rccm` (RCCM - obligatoire)
- ✅ Ajout colonne `numero_contribuable`
- ✅ Ajout colonne `capital_social` (en GNF)
- ✅ Ajout colonne `forme_juridique`
- ✅ Ajout colonne `secteur_activite`
- ✅ `siret` reste disponible (pour entreprises françaises)

### Adresses
- ✅ Pays par défaut changé en "Guinée"

### Monnaie
- ✅ Tous les montants affichés en GNF
- ✅ Format : `1 000 000 GNF` (sans décimales)

## 🔄 Compatibilité

- Les entreprises existantes continuent de fonctionner
- Le SIRET reste disponible pour les entreprises françaises
- Le RCCM est maintenant le champ principal d'identification

## 📝 Notes

- Le RCCM est maintenant **obligatoire** lors de la création d'entreprise
- Format RCCM recommandé : `GN-YYYY-A-XXXXX`
- Le capital social est en GNF (sans décimales)

---

**Date** : 2024

