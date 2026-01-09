#!/usr/bin/env python3
"""
Script pour appliquer le thème Dashboard à toutes les pages HTML restantes
"""

import os
import re
from pathlib import Path

# Pages déjà mises à jour (ne pas toucher)
UPDATED_PAGES = {
    'dashboard.html', 'rfq.html', 'commandes.html', 'devis.html', 
    'entreprises.html', 'factures.html', 'rfq-create.html', 
    'commandes-detail.html', 'rfq-detail.html', 'devis-create.html',
    'factures-create.html', 'factures-detail.html', 'devis-detail.html',
    'entreprises-detail.html', 'test-dashboard.html', 'templates/navbar-template.html'
}

# Mapping des pages vers leur page active dans la navbar
PAGE_ACTIVE_MAP = {
    'devis-detail.html': 'devis',
    'devis-compare.html': 'devis',
    'devis-externe.html': 'devis',
    'entreprises-detail.html': 'entreprises',
    'factures-detail.html': 'factures',
    'bons-livraison-detail.html': 'commandes',
    'demandes-devis.html': 'devis',
    'clients.html': None,
    'produits.html': None,
    'carte.html': None,
    'catalogue-fournisseur.html': None,
    'fournisseur-rfq.html': 'rfq',
    'produits-fournisseur.html': None,
    'home.html': None,
    'index.html': None,
    'notifications.html': None,
    'parametres-messagepro.html': None,
    'suivi.html': None,
    'utilisateurs.html': None,
}

# Template du head
HEAD_TEMPLATE = '''    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - SilyProcure</title>
    
    <!-- CSS Charte Graphique Pro Confiance -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/responsive.css">
    <link rel="stylesheet" href="css/animations.css">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            theme: {{
                extend: {{
                    colors: {{
                        primary: {{
                            50: '#E0E7FF',
                            100: '#DBEAFE',
                            400: '#60A5FA',
                            500: '#3B82F6',
                            600: '#2563EB',
                            700: '#1D4ED8',
                            900: '#1E3A8A',
                        }},
                        success: {{
                            500: '#10B981',
                        }},
                        neutral: {{
                            500: '#64748B',
                            600: '#475569',
                        }}
                    }},
                    fontFamily: {{
                        sans: ['Inter', 'Arial', 'sans-serif'],
                    }}
                }}
            }}
        }}
    </script>
    
    <!-- Font Awesome & Google Fonts -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard Theme CSS -->
    <link rel="stylesheet" href="css/dashboard-theme.css">'''

def generate_navbar(active_page=None):
    """Génère la navbar avec la page active"""
    pages = [
        ('dashboard', 'dashboard.html', 'Dashboard', 'fa-chart-line'),
        ('rfq', 'rfq.html', 'RFQ', 'fa-file-contract'),
        ('devis', 'devis.html', 'Devis', 'fa-file-invoice-dollar'),
        ('commandes', 'commandes.html', 'Commandes', 'fa-shopping-cart'),
        ('entreprises', 'entreprises.html', 'Entreprises', 'fa-building'),
    ]
    
    nav_links = []
    mobile_links = []
    
    for page_id, href, label, icon in pages:
        is_active = page_id == active_page
        nav_class = 'border-primary-500 text-primary-900 font-semibold' if is_active else 'border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 font-medium'
        nav_links.append(f'''                        <a href="{href}" class="{nav_class} inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm transition-colors min-h-[44px] whitespace-nowrap" {'aria-current="page"' if is_active else ''}>
                            <i class="fas {icon} mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>{label}</span>
                        </a>''')
        
        mobile_class = 'bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-primary-500 text-primary-700 font-semibold' if is_active else 'border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 font-medium'
        mobile_icon_class = 'text-primary-600' if is_active else 'text-neutral-500'
        mobile_links.append(f'''                    <a href="{href}" class="{mobile_class} block px-4 py-3 rounded-lg text-base transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas {icon} {mobile_icon_class}" aria-hidden="true"></i>
                        <span>{label}</span>
                    </a>''')
    
    return f'''    <!-- Navbar Moderne selon charte Pro Confiance -->
    <nav class="bg-white border-b-2 border-blue-100 sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Navigation principale">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo & Nav Links -->
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center cursor-pointer" onclick="window.location.href='dashboard.html'">
                        <span class="text-2xl font-bold logo-primary">Sily<span class="text-gray-900">Procure</span></span>
                    </div>
                    <nav class="hidden sm:ml-6 sm:flex sm:space-x-1 md:ml-8" aria-label="Menu de navigation">
{chr(10).join(nav_links)}
                    </nav>
                </div>

                <!-- Search Bar & Profile -->
                <div class="flex items-center gap-4">
                    <!-- Global Search -->
                    <div class="hidden lg:block relative text-neutral-500 focus-within:text-primary-600" role="search">
                        <label for="global-search" class="sr-only">Rechercher dans l'application</label>
                        <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                            <i class="fas fa-search" aria-hidden="true"></i>
                        </div>
                        <input id="global-search" class="block w-64 bg-blue-50 py-2.5 pl-10 pr-4 border border-blue-200 rounded-full leading-5 text-neutral-700 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out min-h-[44px]" placeholder="Rechercher..." type="search" aria-label="Rechercher">
                    </div>

                    <!-- Notifications -->
                    <button class="relative p-2.5 text-neutral-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-blue-50 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Notifications" title="Notifications">
                        <i class="far fa-bell text-xl" aria-hidden="true"></i>
                        <span class="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true"></span>
                    </button>

                    <!-- Profile Dropdown -->
                    <div class="relative flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200 shadow-sm" aria-label="Profil utilisateur">
                            <span id="user-initials">U</span>
                        </div>
                        <span id="user-name" class="hidden md:block text-sm font-semibold text-neutral-700 min-w-[120px]">Chargement...</span>
                        <button onclick="logout()" class="ml-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition min-h-[44px] flex items-center gap-1.5" aria-label="Déconnexion" title="Déconnexion">
                            <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                            <span class="hidden lg:inline">Déconnexion</span>
                        </button>
                    </div>
                    
                    <!-- Menu mobile -->
                    <div class="sm:hidden ml-2">
                        <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="inline-flex items-center justify-center p-2.5 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-w-[44px] min-h-[44px]" aria-expanded="false" aria-label="Menu principal" aria-controls="mobile-menu">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Menu mobile déroulant -->
            <div id="mobile-menu" class="hidden sm:hidden border-t-2 border-blue-100 bg-white shadow-lg">
                <div class="px-4 pt-3 pb-4 space-y-1">
{chr(10).join(mobile_links)}
                </div>
            </div>
        </div>
    </nav>'''

TOGGLE_MOBILE_MENU_SCRIPT = '''        // Menu mobile
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const button = document.getElementById('mobile-menu-button');
            if (menu && button) {
                const isHidden = menu.classList.contains('hidden');
                menu.classList.toggle('hidden');
                button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
                const icon = button.querySelector('i');
                if (icon) {
                    if (isHidden) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        }
        window.toggleMobileMenu = toggleMobileMenu;'''

def apply_theme_to_page(filepath):
    """Applique le thème à une page HTML"""
    print(f"Traitement de {filepath.name}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifier si déjà mis à jour
    if 'dashboard-theme.css' in content:
        print(f"  ✅ {filepath.name} a déjà le thème")
        return True
    
    # Extraire le titre
    title_match = re.search(r'<title>(.*?)</title>', content)
    title = title_match.group(1).replace(' - SilyProcure', '') if title_match else 'Page'
    
    # Remplacer le head
    head_pattern = r'<head>.*?</head>'
    new_head = f'<head>\n{HEAD_TEMPLATE.format(title=title)}\n</head>'
    content = re.sub(head_pattern, new_head, content, flags=re.DOTALL)
    
    # Ajouter body class
    content = re.sub(r'<body([^>]*)>', r'<body class="h-full flex flex-col"\1>', content)
    
    # Déterminer la page active
    active_page = PAGE_ACTIVE_MAP.get(filepath.name)
    
    # Remplacer l'ancienne navbar
    old_nav_pattern = r'<div class="header">.*?</nav>'
    navbar = generate_navbar(active_page)
    
    # Chercher où insérer les scripts
    scripts_pattern = r'(<script src="js/auth\.js"></script>)'
    scripts_match = re.search(scripts_pattern, content)
    
    if old_nav_pattern in content:
        content = re.sub(old_nav_pattern, navbar, content, flags=re.DOTALL)
    elif not navbar in content:
        # Insérer la navbar avant le premier script ou container
        if scripts_match:
            content = content.replace(scripts_match.group(1), f'{navbar}\n\n    {scripts_match.group(1)}')
        else:
            # Chercher le container
            container_match = re.search(r'(<div class="container">)', content)
            if container_match:
                content = content.replace(container_match.group(1), f'{navbar}\n\n    <!-- Main Content -->\n    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">\n    {container_match.group(1)}')
    
    # Ajouter toggleMobileMenu si absent
    if 'toggleMobileMenu' not in content:
        # Chercher le dernier </script> avant </body>
        script_body_pattern = r'(</script>)(\s*</body>)'
        if re.search(script_body_pattern, content):
            content = re.sub(script_body_pattern, r'\1\n' + TOGGLE_MOBILE_MENU_SCRIPT + r'\2', content)
        else:
            content = content.replace('</body>', f'{TOGGLE_MOBILE_MENU_SCRIPT}\n    </script>\n</body>')
    
    # Corriger l'initialisation de l'utilisateur
    user_init_pattern = r'const user = JSON\.parse\(localStorage\.getItem\([\'"]user[\'"]\) \|\| [\'"]\{\}[\'"]\);\s*document\.getElementById\([\'"]user-name[\'"]\)\.textContent'
    if re.search(user_init_pattern, content):
        replacement = '''const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Initialisation du nom d'utilisateur et des initiales
        const userNameEl = document.getElementById('user-name');
        const userInitialsEl = document.getElementById('user-initials');
        if (userNameEl) {
            userNameEl.textContent'''
        content = re.sub(user_init_pattern, replacement, content)
    
    # Envelopper le contenu dans <main> si nécessaire
    if '<main' not in content:
        # Trouver le container principal ou le premier contenu après la navbar
        # Chercher après la navbar
        navbar_end = content.find('</nav>')
        if navbar_end > 0:
            # Chercher le premier élément de contenu après la navbar
            after_navbar = content[navbar_end:]
            # Chercher container, hero-section, ou autre contenu principal
            container_match = re.search(r'(<div class="container">|<div class="hero-section">|<section|<div id=")', after_navbar)
            if container_match:
                insert_pos = navbar_end + container_match.start()
                # Insérer <main> avant le contenu
                content = content[:insert_pos] + '\n    <!-- Main Content -->\n    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">\n    ' + content[insert_pos:]
                # Fermer le main avant les scripts (chercher le dernier </div> avant <script src="js/auth.js">)
                script_match = re.search(r'(<script src="js/auth\.js">)', content)
                if script_match:
                    before_script = content[:script_match.start()]
                    # Chercher le dernier </div> avant le script
                    last_div_match = list(re.finditer(r'</div>', before_script))
                    if last_div_match:
                        last_div_pos = last_div_match[-1].end()
                        # Insérer </main> après le dernier </div>
                        content = content[:last_div_pos] + '\n    </main>\n\n    ' + content[last_div_pos:]
    
    # Sauvegarder
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ {filepath.name} mis à jour")
    return True

def main():
    frontend_dir = Path(__file__).parent
    html_files = list(frontend_dir.glob('*.html'))
    
    updated_count = 0
    skipped_count = 0
    
    for html_file in html_files:
        if html_file.name in UPDATED_PAGES:
            skipped_count += 1
            continue
        
        try:
            if apply_theme_to_page(html_file):
                updated_count += 1
        except Exception as e:
            print(f"  ❌ Erreur sur {html_file.name}: {e}")
    
    print(f"\n✅ {updated_count} pages mises à jour")
    print(f"⏭️  {skipped_count} pages ignorées (déjà mises à jour)")

if __name__ == '__main__':
    main()

