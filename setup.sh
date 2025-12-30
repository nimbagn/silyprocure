#!/bin/bash

# Script d'installation de SilyProcure dans un environnement virtuel

echo "=========================================="
echo "Installation de SilyProcure"
echo "=========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo ""
    echo "Veuillez installer Node.js :"
    echo "  - macOS: brew install node"
    echo "  - Ou télécharger depuis https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js détecté : $(node --version)${NC}"
echo -e "${GREEN}✅ npm détecté : $(npm --version)${NC}"
echo ""

# Vérifier si nvm est disponible
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo -e "${YELLOW}📦 nvm détecté, utilisation de la version spécifiée dans .nvmrc${NC}"
    source "$HOME/.nvm/nvm.sh"
    nvm use
    echo ""
fi

# Créer le dossier node_modules si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances Node.js..."
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dépendances installées avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dépendances déjà installées${NC}"
fi

echo ""

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
    echo -e "${YELLOW}⚠️  N'oubliez pas de configurer .env si nécessaire${NC}"
else
    echo -e "${GREEN}✅ Fichier .env existe déjà${NC}"
fi

echo ""

# Vérifier la base de données
echo "🔍 Vérification de la base de données..."
if command -v mysql &> /dev/null; then
    mysql -u soul -pSatina2025 -e "USE silypro;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Base de données silypro accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Base de données non accessible${NC}"
        echo "   Exécutez : cd database && ./install.sh"
    fi
else
    echo -e "${YELLOW}⚠️  MySQL non détecté${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo "=========================================="
echo ""
echo "Pour démarrer l'application :"
echo "  npm start        # Mode production"
echo "  npm run dev      # Mode développement"
echo ""
echo "L'application sera disponible sur :"
echo "  http://localhost:3000"
echo ""

