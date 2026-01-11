# 🎨 Analyse des Couleurs du Menu - Style Hapag-Lloyd

## Problème identifié

Il y a un **conflit entre deux fichiers CSS** qui définissent des couleurs différentes pour la sidebar :

### 1. `style-hapag.css` (Style Hapag-Lloyd)
```css
--color-sidebar: #1F2937;         /* Gris très foncé */
--color-sidebar-hover: #374151;   /* Gris foncé */
--color-sidebar-active: #FF6600;   /* Orange */
```

**Sidebar :**
- Fond : `#1F2937` (gris très foncé)
- Texte : `rgba(255, 255, 255, 0.8)` (blanc à 80% d'opacité)
- Actif : `#FF6600` (orange)

### 2. `style.css` (Style existant - ÉCRASE le style Hapag-Lloyd)
```css
--color-sidebar: var(--color-primary);  /* #00387A (bleu foncé) */
--color-sidebar-hover: var(--color-primary-light);  /* #0052A3 */
--color-sidebar-active: var(--color-accent);  /* #FF6600 */
```

**Sidebar :**
- Fond : `linear-gradient(180deg, #00387A 0%, #1E3A8A 100%)` (dégradé bleu)
- Texte : `rgba(255, 255, 255, 0.9)` (blanc à 90% d'opacité)
- Actif : `#FF6600` (orange)

## Conflit de priorité

Le fichier `style.css` est chargé **après** `style-hapag.css` dans `dashboard.html`, donc il **écrase** les styles Hapag-Lloyd.

## Solution recommandée

Pour avoir le style Hapag-Lloyd (gris foncé), il faut :
1. Soit inverser l'ordre de chargement des CSS
2. Soit utiliser `!important` dans `style-hapag.css`
3. Soit supprimer les styles sidebar de `style.css`

## Palette de couleurs actuelle

### Sidebar (selon style.css qui est actif)
- **Fond** : Dégradé bleu (#00387A → #1E3A8A)
- **Texte normal** : Blanc à 90% (`rgba(255, 255, 255, 0.9)`)
- **Texte hover** : Blanc pur (`white`)
- **Texte actif** : Orange (#FF6600)
- **Bordure active** : Orange (#FF6600)
- **Fond hover** : Orange transparent (`rgba(255, 102, 0, 0.15)`)
- **Fond actif** : Orange transparent (`rgba(255, 102, 0, 0.2)`)

### Sidebar (selon style-hapag.css - non actif)
- **Fond** : Gris foncé (#1F2937)
- **Texte normal** : Blanc à 80% (`rgba(255, 255, 255, 0.8)`)
- **Texte hover** : Blanc pur (`white`)
- **Texte actif** : Orange (#FF6600)
- **Bordure active** : Orange (#FF6600)
- **Fond hover** : Gris foncé (#374151)
- **Fond actif** : Orange transparent (`rgba(255, 102, 0, 0.1)`)

## Recommandation

Pour un style Hapag-Lloyd authentique, utiliser :
- Fond sidebar : **#1F2937** (gris très foncé)
- Texte : **Blanc** avec bonne opacité
- Accent : **#FF6600** (orange) pour les éléments actifs

