# Guide d'Application du Thème Dashboard

Ce guide explique comment appliquer le thème Dashboard (Pro Confiance) à toutes les pages du projet.

## Fichiers créés

1. **`css/dashboard-theme.css`** : Fichier CSS principal avec tous les styles du thème
2. **`js/components/navbar.js`** : Composant navbar réutilisable (optionnel)
3. **`templates/navbar-template.html`** : Template HTML de la navbar

## Structure à appliquer

### 1. Head Section (à ajouter dans toutes les pages)

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nom de la Page - SilyProcure</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#E0E7FF',
                            100: '#DBEAFE',
                            400: '#60A5FA',
                            500: '#3B82F6',
                            600: '#2563EB',
                            700: '#1D4ED8',
                            900: '#1E3A8A',
                        },
                        success: {
                            500: '#10B981',
                        },
                        neutral: {
                            500: '#64748B',
                            600: '#475569',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'Arial', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <!-- Chart.js (si nécessaire) -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Font Awesome & Google Fonts -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard Theme CSS -->
    <link rel="stylesheet" href="css/dashboard-theme.css">
</head>
```

### 2. Body Structure

```html
<body class="h-full flex flex-col">
    <!-- Navbar (voir section suivante) -->
    
    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Contenu de la page -->
    </main>
    
    <!-- Scripts -->
    <script src="js/auth.js"></script>
    <!-- Autres scripts -->
</body>
```

### 3. Navbar (à remplacer dans toutes les pages)

Copier la navbar depuis `dashboard.html` (lignes 403-499) et adapter la classe `border-primary-500` et `aria-current="page"` selon la page courante :

- **Dashboard** : `dashboard.html` → `border-primary-500` sur Dashboard
- **RFQ** : `rfq.html` → `border-primary-500` sur RFQ
- **Devis** : `devis.html` → `border-primary-500` sur Devis
- **Commandes** : `commandes.html` → `border-primary-500` sur Commandes
- **Entreprises** : `entreprises.html` → `border-primary-500` sur Entreprises

### 4. Classes CSS à utiliser

#### Cartes
```html
<div class="card">
    <div class="card-header">Titre</div>
    <div class="card-body">Contenu</div>
</div>
```

#### Boutons
```html
<button class="btn-primary">Bouton Principal</button>
<button class="btn-secondary">Bouton Secondaire</button>
```

#### Badges
```html
<span class="badge badge-success">Succès</span>
<span class="badge badge-warning">Attention</span>
<span class="badge badge-danger">Erreur</span>
<span class="badge badge-info">Info</span>
```

#### Tableaux
```html
<div class="table-container">
    <table>
        <thead>
            <tr>
                <th>Colonne 1</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Donnée</td>
            </tr>
        </tbody>
    </table>
</div>
```

#### Formulaires
```html
<div class="form-group">
    <label class="form-label">Label</label>
    <input type="text" class="form-input" placeholder="Placeholder">
</div>
```

### 5. Responsive Design

- Utiliser les classes Tailwind responsive : `sm:`, `md:`, `lg:`
- Tous les éléments cliquables doivent avoir `min-h-[44px]` pour l'accessibilité tactile
- Le menu mobile s'affiche automatiquement sur écrans < 640px

### 6. Checklist par page

Pour chaque page, vérifier :

- [ ] Head mis à jour avec Tailwind et dashboard-theme.css
- [ ] Body avec classe `h-full flex flex-col`
- [ ] Navbar remplacée par la nouvelle navbar
- [ ] Page courante correctement identifiée dans la navbar
- [ ] Contenu principal dans `<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">`
- [ ] Cartes utilisent la classe `.card`
- [ ] Boutons utilisent `.btn-primary` ou `.btn-secondary`
- [ ] Tableaux dans `.table-container`
- [ ] Formulaires utilisent `.form-group`, `.form-label`, `.form-input`
- [ ] Responsive testé sur mobile, tablette et desktop
- [ ] Lisibilité vérifiée (contrastes, tailles de police)

## Pages prioritaires

1. ✅ dashboard.html (déjà fait)
2. ⏳ rfq.html
3. ⏳ commandes.html
4. ⏳ devis.html
5. ⏳ entreprises.html
6. ⏳ factures.html
7. ⏳ rfq-create.html
8. ⏳ commandes-detail.html
9. ⏳ devis-detail.html
10. ⏳ entreprises-detail.html

## Notes importantes

- Le fichier `css/dashboard-theme.css` contient toutes les variables CSS et styles de base
- Les couleurs principales sont définies dans les variables CSS (`--color-primary`, etc.)
- Tous les styles sont responsive par défaut
- Les animations sont incluses (fade-in, etc.)
- La scrollbar personnalisée est appliquée automatiquement

