# Prompt : Rendre le Projet Responsive et Adaptatif

## Objectif
Rendre toutes les pages et fonctionnalités du projet SilyProcure **100% responsive** et adaptées à tous les types de supports (desktop, tablette, mobile, très petits écrans).

## Principes de Design Responsive à Appliquer

### 1. Viewport et Meta Tags
- ✅ Vérifier que toutes les pages HTML incluent :
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  ```

### 2. Breakpoints Standard
Utiliser ces breakpoints pour tous les media queries :
- **Mobile (petit)** : `max-width: 576px` (téléphones en portrait)
- **Mobile (moyen)** : `min-width: 577px` et `max-width: 768px` (téléphones en paysage, petites tablettes)
- **Tablette** : `min-width: 769px` et `max-width: 1024px` (tablettes)
- **Desktop (petit)** : `min-width: 1025px` et `max-width: 1440px` (petits écrans desktop)
- **Desktop (grand)** : `min-width: 1441px` (grands écrans)

### 3. Layout et Grilles
- ✅ Utiliser **Flexbox** ou **CSS Grid** pour tous les layouts
- ✅ Éviter les largeurs fixes (`width: 500px`) - utiliser `max-width`, `min-width`, ou pourcentages
- ✅ Utiliser `flex-wrap: wrap` pour permettre le retour à la ligne automatique
- ✅ Utiliser `gap` au lieu de `margin` pour les espacements dans les grilles flexbox/grid

### 4. Typographie Responsive
- ✅ Utiliser des unités relatives (`rem`, `em`, `%`) au lieu de `px` pour les tailles de police
- ✅ Implémenter une échelle typographique fluide :
  ```css
  /* Base mobile */
  font-size: 14px; /* 0.875rem */
  
  /* Tablette */
  @media (min-width: 768px) {
    font-size: 16px; /* 1rem */
  }
  
  /* Desktop */
  @media (min-width: 1024px) {
    font-size: 18px; /* 1.125rem */
  }
  ```

### 5. Images et Médias
- ✅ Utiliser `max-width: 100%` et `height: auto` pour toutes les images
- ✅ Utiliser `object-fit: cover` ou `contain` selon le besoin
- ✅ Implémenter des images responsives avec `srcset` et `sizes` si nécessaire
- ✅ Utiliser `picture` element pour différentes résolutions

### 6. Navigation et Menus
- ✅ **Header/Navbar** :
  - Desktop : Menu horizontal complet
  - Mobile/Tablette : Menu hamburger avec sidebar/drawer
  - Toujours accessible et visible
  
- ✅ **Sidebar** :
  - Desktop : Toujours visible (largeur fixe ou collapsible)
  - Tablette : Collapsible avec bouton toggle
  - Mobile : Masquée par défaut, accessible via bouton hamburger

### 7. Formulaires
- ✅ Tous les champs de formulaire doivent avoir :
  - `width: 100%` ou `max-width: 100%`
  - `box-sizing: border-box`
  - Padding et margin adaptatifs
  - Labels au-dessus des champs sur mobile, à côté sur desktop si espace disponible

- ✅ Boutons de formulaire :
  - Largeur complète sur mobile (`width: 100%`)
  - Largeur auto sur desktop avec `min-width` appropriée
  - Espacement vertical suffisant pour éviter les clics accidentels (min 44px de hauteur)

### 8. Tableaux
- ✅ Sur mobile/tablette :
  - Option 1 : Scroll horizontal avec `overflow-x: auto`
  - Option 2 : Transformer en cartes empilées
  - Option 3 : Masquer certaines colonnes non essentielles
  
- ✅ Toujours inclure un wrapper avec `overflow-x: auto` :
  ```css
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  ```

### 9. Modales et Dialogs
- ✅ Largeur adaptative :
  - Mobile : `width: 95vw` avec `max-width: 100%`
  - Tablette : `width: 80vw` avec `max-width: 600px`
  - Desktop : `width: auto` avec `max-width: 800px`
  
- ✅ Padding adaptatif :
  - Mobile : `padding: 1rem`
  - Desktop : `padding: 2rem`

### 10. Cartes et Cards
- ✅ Utiliser `display: grid` avec `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- ✅ Espacement adaptatif avec `gap`
- ✅ Sur mobile : 1 colonne
- ✅ Sur tablette : 2 colonnes
- ✅ Sur desktop : 3+ colonnes selon l'espace

### 11. Boutons et Actions
- ✅ Taille minimale : `min-height: 44px` (accessibilité tactile)
- ✅ Espacement : `padding: 0.75rem 1.5rem` (adaptatif)
- ✅ Sur mobile : Boutons pleine largeur si dans un conteneur vertical
- ✅ Sur desktop : Largeur auto avec espacement horizontal

### 12. Espacements et Marges
- ✅ Utiliser des unités relatives (`rem`, `em`) pour tous les espacements
- ✅ Système d'espacement cohérent :
  ```css
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-xxl: 3rem;     /* 48px */
  ```

### 13. Zones Tactiles (Touch Targets)
- ✅ Tous les éléments cliquables doivent avoir au minimum :
  - `min-height: 44px`
  - `min-width: 44px`
  - Espacement suffisant entre les éléments (min 8px)

### 14. Performance Mobile
- ✅ Éviter les animations lourdes sur mobile
- ✅ Utiliser `will-change` et `transform` pour les animations fluides
- ✅ Lazy loading pour les images
- ✅ Minimiser les reflows et repaints

### 15. Orientation (Portrait/Paysage)
- ✅ Tester en portrait ET paysage
- ✅ Adapter les layouts selon l'orientation :
  ```css
  @media (orientation: landscape) {
    /* Styles pour paysage */
  }
  
  @media (orientation: portrait) {
    /* Styles pour portrait */
  }
  ```

## Checklist pour Chaque Page/Fonctionnalité

### Avant de Commencer
- [ ] Vérifier le viewport meta tag
- [ ] Vérifier que les polices sont en unités relatives
- [ ] Vérifier que les images sont responsives

### Layout Principal
- [ ] Header/Navbar responsive (menu hamburger sur mobile)
- [ ] Sidebar responsive (masquée/collapsible sur mobile)
- [ ] Contenu principal avec padding adaptatif
- [ ] Footer responsive

### Composants Spécifiques
- [ ] Formulaires : champs pleine largeur sur mobile
- [ ] Tableaux : scroll horizontal ou transformation en cartes
- [ ] Modales : largeur adaptative selon l'écran
- [ ] Boutons : taille tactile appropriée (min 44px)
- [ ] Cartes : grille adaptative (1 col mobile, 2-3+ desktop)

### Tests Responsive
- [ ] Tester sur mobile (320px - 576px)
- [ ] Tester sur tablette (577px - 1024px)
- [ ] Tester sur desktop (1025px+)
- [ ] Tester en portrait et paysage
- [ ] Vérifier que tous les éléments sont accessibles
- [ ] Vérifier que le texte est lisible (taille minimale 14px)
- [ ] Vérifier que les boutons sont facilement cliquables

## Template CSS Responsive de Base

```css
/* Variables CSS pour cohérence */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-xxl: 3rem;
  
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;
}

/* Base mobile-first */
.container {
  width: 100%;
  max-width: 100%;
  padding: var(--spacing-md);
  box-sizing: border-box;
}

/* Tablette */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
  }
  
  :root {
    --font-size-base: 16px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl);
  }
  
  :root {
    --font-size-base: 18px;
  }
}

/* Grille responsive */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Boutons responsive */
.btn {
  min-height: 44px;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-base);
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 576px) {
  .btn {
    width: 100%;
    margin-bottom: var(--spacing-sm);
  }
  
  .btn-group {
    flex-direction: column;
  }
}

/* Formulaires responsive */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-base);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  max-width: 100%;
  padding: 0.75rem;
  font-size: var(--font-size-base);
  box-sizing: border-box;
  min-height: 44px;
}

/* Tableaux responsive */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

@media (max-width: 768px) {
  .table {
    font-size: 0.875rem;
  }
  
  .table th,
  .table td {
    padding: 0.5rem;
  }
}

/* Modales responsive */
.modal {
  width: 95vw;
  max-width: 100%;
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .modal {
    width: 80vw;
    max-width: 600px;
    padding: var(--spacing-lg);
  }
}

@media (min-width: 1024px) {
  .modal {
    width: auto;
    max-width: 800px;
    padding: var(--spacing-xl);
  }
}
```

## Instructions d'Application

1. **Pour chaque nouvelle page** :
   - Copier ce prompt
   - Appliquer tous les principes listés
   - Vérifier avec la checklist
   - Tester sur différents appareils

2. **Pour les pages existantes** :
   - Identifier les problèmes de responsive
   - Appliquer les corrections selon ce guide
   - Tester et valider

3. **Pour les nouveaux composants** :
   - Créer avec une approche mobile-first
   - Utiliser les variables CSS définies
   - Tester sur tous les breakpoints

## Outils de Test Recommandés

- Chrome DevTools (Device Toolbar)
- Firefox Responsive Design Mode
- BrowserStack ou similaires pour tests réels
- Test manuel sur appareils physiques si possible

## Notes Importantes

- ⚠️ **Toujours commencer par mobile-first** : concevoir d'abord pour mobile, puis étendre pour desktop
- ⚠️ **Tester réellement** : les outils de développement ne remplacent pas les tests sur vrais appareils
- ⚠️ **Performance** : optimiser les images et éviter les animations lourdes sur mobile
- ⚠️ **Accessibilité** : maintenir les tailles de texte lisibles et les zones tactiles suffisantes

---

**Ce prompt doit être utilisé pour TOUTES les pages et fonctionnalités du projet SilyProcure.**

