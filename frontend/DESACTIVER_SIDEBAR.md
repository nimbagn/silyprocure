# Désactiver la Sidebar Hapag-Lloyd

Si vous voulez revenir à l'ancien design sans sidebar, vous avez plusieurs options :

## Option 1 : Désactiver globalement

Ajoutez dans chaque fichier HTML, **AVANT** le script `sidebar.js` :

```html
<script>
    window.DISABLE_SIDEBAR = true;
</script>
<script src="js/sidebar.js"></script>
```

## Option 2 : Retirer le script

Supprimez simplement la ligne :
```html
<script src="js/sidebar.js"></script>
```

## Option 3 : Restaurer l'ancien CSS

Si vous voulez restaurer complètement l'ancien style, vous pouvez :
1. Faire un backup de `style.css`
2. Restaurer depuis git si vous utilisez git
3. Ou me demander de restaurer l'ancien style

## Option 4 : Garder les couleurs mais sans sidebar

Les nouvelles couleurs (bleu foncé, orange) sont dans le CSS. Si vous voulez garder les couleurs mais sans la sidebar, utilisez l'Option 1.

