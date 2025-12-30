# Installation avec environnement virtuel Python

## 🐍 Utilisation de venv

Ce projet utilise un environnement virtuel Python (`venv`) pour gérer les scripts d'installation et de démarrage.

## 📦 Installation

### 1. Créer et activer l'environnement virtuel

```bash
# Créer l'environnement virtuel
python3 -m venv venv

# Activer l'environnement virtuel
# Sur macOS/Linux :
source venv/bin/activate

# Sur Windows :
venv\Scripts\activate
```

### 2. Installer le projet

```bash
# Méthode 1 : Script Python automatique
python3 setup_venv.py

# Méthode 2 : Manuel
npm install
cp .env.example .env
```

## 🚀 Démarrage

### Avec le script Python

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Démarrer en mode production
python3 start.py

# Démarrer en mode développement
python3 start.py dev
```

### Avec npm directement

```bash
# Mode production
npm start

# Mode développement
npm run dev
```

## 📋 Commandes utiles

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Désactiver l'environnement virtuel
deactivate

# Vérifier que l'environnement est actif
which python  # Devrait pointer vers venv/bin/python

# Installer les dépendances Node.js
npm install

# Installer la base de données
cd database && ./install.sh
```

## 🔧 Structure

```
SilyProcure/
├── venv/              # Environnement virtuel Python
├── node_modules/      # Dépendances Node.js
├── setup_venv.py      # Script d'installation
├── start.py           # Script de démarrage
└── requirements.txt   # Dépendances Python (vide pour l'instant)
```

## ⚠️ Notes

- L'environnement virtuel Python est utilisé uniquement pour les scripts d'automatisation
- L'application elle-même est en Node.js
- Les dépendances Node.js sont installées dans `node_modules/`
- L'environnement virtuel Python n'est pas nécessaire pour exécuter l'application, mais facilite la gestion

---

**Version** : 1.0

