#!/usr/bin/env python3
"""
Script de démarrage de SilyProcure
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    # Vérifier que nous sommes dans le bon répertoire
    if not Path("package.json").exists():
        print("❌ Erreur: package.json non trouvé")
        print("   Exécutez ce script depuis le répertoire racine de SilyProcure")
        sys.exit(1)

    # Vérifier que node_modules existe
    if not Path("node_modules").exists():
        print("❌ Dépendances non installées")
        print("   Exécutez d'abord: python3 setup_venv.py")
        sys.exit(1)

    # Vérifier le fichier .env
    if not Path(".env").exists():
        print("⚠️  Fichier .env non trouvé")
        if Path(".env.example").exists():
            print("   Création depuis .env.example...")
            import shutil
            shutil.copy(".env.example", ".env")
        else:
            print("   Veuillez créer un fichier .env")
            sys.exit(1)

    # Démarrer le serveur
    print("🚀 Démarrage de SilyProcure...")
    print()
    
    mode = sys.argv[1] if len(sys.argv) > 1 else "start"
    
    if mode == "dev":
        print("Mode développement (avec nodemon)")
        subprocess.run(["npm", "run", "dev"])
    else:
        print("Mode production")
        subprocess.run(["npm", "start"])

if __name__ == "__main__":
    main()

