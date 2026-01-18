#!/bin/bash

# Script d'exécution rapide des tests finaux - SilyProcure

echo "🧪 DÉMARRAGE DES TESTS FINAUX - SilyProcure"
echo "============================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Étape 1 : Vérification de la base de données${NC}"
echo "----------------------------------------"
node verifier-base-donnees.js
DB_STATUS=$?

if [ $DB_STATUS -ne 0 ]; then
    echo -e "${RED}❌ La vérification de la base de données a échoué${NC}"
    echo -e "${YELLOW}⚠️  Voulez-vous continuer quand même ? (o/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Oo]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${CYAN}📋 Étape 2 : Tests automatisés${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}⚠️  IMPORTANT : Le serveur backend doit être démarré avec NODE_ENV=test${NC}"
echo -e "${YELLOW}⚠️  Exemple : NODE_ENV=test npm start${NC}"
echo -e "${YELLOW}⚠️  Appuyez sur Entrée pour continuer...${NC}"
read -r

# Définir NODE_ENV=test pour le script de test
export NODE_ENV=test
node test-final-complet.js
TEST_STATUS=$?

echo ""
echo "============================================"
if [ $TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Tests terminés avec succès${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    echo -e "${YELLOW}⚠️  Consultez le fichier test-report-final.json pour plus de détails${NC}"
fi

echo ""
echo -e "${CYAN}📝 Prochaines étapes :${NC}"
echo "1. Consultez CHECKLIST_TEST_FINAL.md pour les tests manuels"
echo "2. Complétez RAPPORT_TEST_FINAL.md avec vos résultats"
echo "3. Corrigez les bugs identifiés"
echo ""

exit $TEST_STATUS

