# Géolocalisation des Tiers - SilyProcure

## 🗺️ Fonctionnalités

### Carte interactive
- Visualisation de tous les tiers (entreprises, clients, fournisseurs, transporteurs) sur une carte
- Marqueurs colorés par type d'entreprise
- Filtres par type de tiers
- Centrage automatique sur la Guinée
- Géolocalisation de la position de l'agent

### Géocodage automatique
- Conversion d'adresse en coordonnées GPS
- Utilisation du service Nominatim (OpenStreetMap)
- Ajout manuel des coordonnées GPS

### Navigation
- Lien direct vers Google Maps pour itinéraires
- Calcul d'itinéraire depuis la position actuelle
- Vue détaillée de chaque localisation

## 📋 Utilisation

### 1. Ajouter une géolocalisation à une adresse

1. Aller sur la page de détails d'une entreprise
2. Cliquer sur "➕ Ajouter une adresse"
3. Remplir l'adresse
4. Cocher "Géolocaliser automatiquement cette adresse"
5. Cliquer sur "🔍 Géocoder l'adresse"
6. Les coordonnées GPS seront automatiquement remplies
7. Sauvegarder

### 2. Visualiser tous les tiers sur la carte

1. Aller dans le menu "🗺️ Carte"
2. Utiliser les filtres pour afficher/masquer certains types
3. Cliquer sur un marqueur pour voir les détails
4. Utiliser "📍 Ma position" pour se localiser
5. Utiliser "Itinéraire" pour obtenir les directions

### 3. Accéder à une entreprise depuis la carte

1. Sur la page de détails d'une entreprise
2. Cliquer sur "🗺️ Voir sur carte" dans la section Adresses
3. La carte s'ouvrira centrée sur cette entreprise

## 🔧 Configuration

### Base de données

La migration ajoute les colonnes suivantes à la table `adresses` :
- `latitude` : Coordonnée latitude (DECIMAL 10,8)
- `longitude` : Coordonnée longitude (DECIMAL 11,8)
- `notes_geolocalisation` : Notes sur la géolocalisation

### API

Nouvelle route : `/api/adresses`
- `POST /api/adresses` - Créer une adresse avec géolocalisation
- `PUT /api/adresses/:id` - Mettre à jour une adresse
- `DELETE /api/adresses/:id` - Supprimer une adresse
- `POST /api/adresses/geocode` - Géocoder une adresse

## 🎨 Interface

### Carte
- **Fournisseurs** : Bleu (🏭)
- **Clients** : Vert (🏢)
- **Acheteurs** : Orange (🛒)
- **Transporteurs** : Rouge (🚚)

### Contrôles
- Filtres par type de tiers
- Bouton "Ma position" pour géolocaliser l'agent
- Bouton "Centrer sur Guinée" pour revenir à la vue d'ensemble
- Compteur de tiers affichés

## 📱 Mobile

La carte est responsive et fonctionne sur mobile :
- Géolocalisation de l'agent
- Navigation vers Google Maps pour itinéraires
- Vue optimisée pour petits écrans

## 🔐 Sécurité

- Authentification requise pour accéder à la carte
- Seuls les tiers actifs sont affichés
- Les coordonnées GPS sont stockées de manière sécurisée

---

**Version** : 1.0  
**Date** : 2024

