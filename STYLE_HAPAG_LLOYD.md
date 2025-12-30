# 🎨 Style Hapag-Lloyd - Guide d'Application

## Vue d'ensemble

Le style de SilyProcure a été adapté pour correspondre au design moderne et professionnel de Hapag-Lloyd.

## Caractéristiques principales

### 🎨 Palette de couleurs

- **Bleu foncé** (`#00387A`) : Couleur principale, utilisée pour les headers et éléments importants
- **Orange** (`#FF6600`) : Couleur d'accent, utilisée pour les boutons principaux et éléments actifs
- **Gris foncé** (`#1F2937`) : Sidebar et éléments de navigation
- **Blanc** : Fond principal et cartes

### 📐 Structure de layout

1. **Sidebar latérale** (280px) :
   - Fond gris foncé
   - Navigation verticale avec icônes
   - Élément actif en orange avec bordure gauche

2. **Header supérieur** :
   - Fond blanc
   - Informations utilisateur à droite
   - Bouton menu mobile (sur petits écrans)

3. **Zone de contenu principale** :
   - Marge gauche de 280px pour la sidebar
   - Padding et espacement généreux
   - Cartes avec ombres subtiles

## Fichiers modifiés

### CSS
- `frontend/css/style.css` : Styles principaux mis à jour
- `frontend/css/style-hapag.css` : Fichier de référence (optionnel)

### JavaScript
- `frontend/js/sidebar.js` : Composant sidebar réutilisable

### HTML
- `frontend/dashboard.html` : Exemple d'application

## Application aux autres pages

Pour appliquer le style à toutes les pages, ajoutez dans chaque fichier HTML :

```html
<head>
    ...
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <script src="js/sidebar.js"></script>
    <!-- Votre contenu existant -->
    ...
</body>
```

## Remplacement de l'ancien header/nav

L'ancien système avec `.header` et `.nav` est toujours supporté pour compatibilité, mais le nouveau système utilise :
- `.sidebar` : Navigation latérale
- `.top-header` : Header supérieur
- `.main-content` : Zone de contenu

## Responsive

- **Desktop** (>1024px) : Sidebar visible, contenu avec marge gauche
- **Tablet/Mobile** (≤1024px) : Sidebar cachée par défaut, bouton toggle pour l'afficher

## Boutons

Les boutons principaux utilisent maintenant l'orange Hapag-Lloyd :
- `.btn-primary` : Orange (`#FF6600`)
- Hover : Orange foncé (`#E55A00`)

## Prochaines étapes

1. Appliquer `sidebar.js` à toutes les pages HTML
2. Remplacer les anciens headers/nav par le nouveau système
3. Tester sur différentes tailles d'écran
4. Ajuster les couleurs si nécessaire

