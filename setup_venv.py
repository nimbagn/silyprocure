#!/usr/bin/env python3
"""
Script d'installation de SilyProcure avec environnement virtuel Python
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, check=True):
    """Exécute une commande shell"""
    print(f"🔧 Exécution: {cmd}")
    result = subprocess.run(cmd, shell=True, check=check, capture_output=True, text=True)
    if result.returncode == 0 and result.stdout:
        print(result.stdout)
    return result.returncode == 0

def check_command(cmd):
    """Vérifie si une commande existe"""
    return shutil.which(cmd) is not None

def main():
    print("=" * 50)
    print("Installation de SilyProcure")
    print("=" * 50)
    print()

    # Vérifier Python
    python_version = sys.version_info
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} détecté")
    print()

    # Vérifier Node.js
    if not check_command("node"):
        print("❌ Node.js n'est pas installé")
        print("   Installez Node.js depuis https://nodejs.org/")
        sys.exit(1)

    node_version = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()
    npm_version = subprocess.run(["npm", "--version"], capture_output=True, text=True).stdout.strip()
    print(f"✅ Node.js {node_version} détecté")
    print(f"✅ npm {npm_version} détecté")
    print()

    # Activer l'environnement virtuel s'il existe
    venv_path = Path("venv")
    if venv_path.exists():
        print("✅ Environnement virtuel Python trouvé")
        if sys.platform == "win32":
            activate_script = venv_path / "Scripts" / "activate.bat"
        else:
            activate_script = venv_path / "bin" / "activate"
        
        if activate_script.exists():
            print(f"   Pour activer: source {activate_script}")
    else:
        print("📦 Création de l'environnement virtuel Python...")
        if not run_command(f"{sys.executable} -m venv venv"):
            print("❌ Erreur lors de la création de l'environnement virtuel")
            sys.exit(1)
        print("✅ Environnement virtuel créé")
    print()

    # Installer les dépendances Node.js
    if not Path("node_modules").exists():
        print("📦 Installation des dépendances Node.js...")
        if not run_command("npm install"):
            print("❌ Erreur lors de l'installation des dépendances npm")
            sys.exit(1)
        print("✅ Dépendances Node.js installées")
    else:
        print("✅ Dépendances Node.js déjà installées")
    print()

    # Créer le fichier .env
    env_file = Path(".env")
    env_example = Path(".env.example")
    if not env_file.exists() and env_example.exists():
        print("📝 Création du fichier .env...")
        shutil.copy(env_example, env_file)
        print("✅ Fichier .env créé")
        print("⚠️  N'oubliez pas de configurer .env si nécessaire")
    elif env_file.exists():
        print("✅ Fichier .env existe déjà")
    print()

    # Vérifier la base de données
    print("🔍 Vérification de la base de données...")
    if check_command("mysql"):
        result = run_command("mysql -u soul -pSatina2025 -e 'USE silypro;' 2>/dev/null", check=False)
        if result:
            print("✅ Base de données silypro accessible")
        else:
            print("⚠️  Base de données non accessible")
            print("   Exécutez: cd database && ./install.sh")
    else:
        print("⚠️  MySQL non détecté")
    print()

    print("=" * 50)
    print("✅ Installation terminée !")
    print("=" * 50)
    print()
    print("Pour démarrer l'application :")
    print("  npm start        # Mode production")
    print("  npm run dev      # Mode développement")
    print()
    print("Pour activer l'environnement virtuel Python :")
    if sys.platform == "win32":
        print("  venv\\Scripts\\activate")
    else:
        print("  source venv/bin/activate")
    print()
    print("L'application sera disponible sur :")
    print("  http://localhost:3000")
    print()

if __name__ == "__main__":
    main()

