# 🧪 Guide de Test du Dashboard en Live

## ✅ Tests Automatiques - Résultats

Tous les tests structurels sont passés ! Le dashboard est prêt pour les tests en live.

## 🌐 Étapes pour Tester en Live

### 1. Prérequis

- ✅ Backend Express.js démarré sur le port 3000
- ✅ Base de données MySQL locale accessible
- ✅ Utilisateur avec compte valide

### 2. Démarrage du Backend

```bash
cd /Users/dantawi/Documents/SilyProcure/backend
npm start
```

**Vérifiez les logs** - Vous devriez voir :
```
✅ Route dashboard chargée
✅ Route /api/dashboard enregistrée
📊 Utilisation de MySQL
✅ Connexion à la base de données MySQL réussie
🚀 Serveur SilyProcure démarré sur le port 3000
```

### 3. Accès au Dashboard

1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:3000/dashboard.html`
3. **Si vous n'êtes pas connecté** : Vous serez redirigé vers `index.html`
4. Connectez-vous avec vos identifiants

### 4. Vérifications Visuelles

#### ✅ Navigation
- [ ] Navbar visible en haut avec logo "SilyProcure"
- [ ] Menu de navigation (Dashboard, RFQ, Devis, Commandes, Entreprises)
- [ ] Lien "Dashboard" est actif (souligné en bleu)
- [ ] Barre de recherche visible (sur grand écran)
- [ ] Icône notifications visible
- [ ] Profil utilisateur avec initiales
- [ ] Bouton déconnexion visible

#### ✅ Header
- [ ] Titre "Tableau de bord" visible
- [ ] Sous-titre descriptif visible
- [ ] Bouton "Nouvelle RFQ" visible et cliquable
- [ ] Bouton "Fournisseur" visible et cliquable
- [ ] Bouton "Actualiser" visible et cliquable

#### ✅ Cartes KPI (4 cartes)
- [ ] Carte "Commandes" avec icône et nombre
- [ ] Carte "Dépenses (Mois)" avec montant et barre de progression
- [ ] Carte "Appels d'offres" avec nombre
- [ ] Carte "Fournisseurs" avec nombre
- [ ] Les cartes sont cliquables (hover effect)
- [ ] Les valeurs ne sont plus "-" mais des nombres réels

#### ✅ Graphiques Principaux
- [ ] Graphique "Évolution des Achats" (ligne) visible
- [ ] Graphique "Statut des RFQ" (donut) visible
- [ ] Les graphiques contiennent des données (pas vides)

#### ✅ Graphiques Secondaires
- [ ] Graphique "Catégories les plus demandées" (barres) visible
- [ ] Graphique "Secteurs les plus sollicités" (polaire) visible
- [ ] Les graphiques contiennent des données ou un message approprié

#### ✅ Activité Récente
- [ ] Tableau "Commandes Récentes" visible
- [ ] Colonnes : Réf, Fournisseur, Montant, Statut
- [ ] Liste "Derniers Messages" visible
- [ ] Badge avec nombre de messages non lus

### 5. Vérifications Fonctionnelles

#### Console du Navigateur (F12)

Ouvrez la console et vérifiez les logs :

```
📄 DOM chargé, initialisation du dashboard...
🔄 Initialisation du dashboard...
📡 Appel API /api/dashboard/stats...
API Call: http://localhost:3000/api/dashboard/stats
✅ Réponse API reçue, parsing JSON...
📊 Statistiques reçues: {...}
📝 Mise à jour des KPIs...
✅ KPIs mis à jour
📊 Initialisation des graphiques...
📋 Chargement des listes...
📦 Chargement des commandes récentes...
💬 Chargement des messages...
✅ Dashboard initialisé avec succès
```

#### Onglet Network (Réseau)

Vérifiez que les requêtes suivantes sont effectuées :
- ✅ `GET /api/dashboard/stats` → Status 200
- ✅ `GET /api/commandes?limit=5` → Status 200
- ✅ `GET /api/contact/messages?limit=10` → Status 200

### 6. Tests d'Interactivité

#### ✅ Actions Rapides
- [ ] Cliquer sur "Nouvelle RFQ" → Redirige vers `rfq-create.html`
- [ ] Cliquer sur "Fournisseur" → Redirige vers `entreprises.html`
- [ ] Cliquer sur "Actualiser" → Recharge les données (vérifier dans la console)

#### ✅ Navigation
- [ ] Cliquer sur "RFQ" → Redirige vers `rfq.html`
- [ ] Cliquer sur "Commandes" → Redirige vers `commandes.html`
- [ ] Cliquer sur "Entreprises" → Redirige vers `entreprises.html`

#### ✅ Cartes KPI
- [ ] Cliquer sur la carte "Commandes" → Redirige vers `commandes.html`
- [ ] Cliquer sur la carte "Appels d'offres" → Redirige vers `rfq.html`
- [ ] Cliquer sur la carte "Fournisseurs" → Redirige vers `entreprises.html`

#### ✅ Tableaux et Listes
- [ ] Cliquer sur une ligne du tableau "Commandes Récentes" → Redirige vers le détail
- [ ] Cliquer sur "Tout voir" → Redirige vers `commandes.html`
- [ ] Cliquer sur un message → Ouvre le détail (si implémenté)

### 7. Tests Responsive

#### Mobile (< 768px)
- [ ] Menu hamburger visible
- [ ] Menu mobile s'ouvre au clic
- [ ] KPIs en 1 colonne
- [ ] Graphiques empilés verticalement
- [ ] Tableaux avec scroll horizontal

#### Tablette (768px - 1024px)
- [ ] KPIs en 2 colonnes
- [ ] Graphiques adaptés
- [ ] Navigation horizontale visible

#### Desktop (> 1024px)
- [ ] KPIs en 4 colonnes
- [ ] Graphiques en grille optimale
- [ ] Navigation complète visible
- [ ] Barre de recherche visible

### 8. Tests d'Erreur

#### Test 1 : Déconnexion du Backend
1. Arrêtez le backend (Ctrl+C)
2. Rechargez le dashboard
3. **Attendu** : Message d'erreur Toast + logs dans la console

#### Test 2 : Token Expiré
1. Supprimez le token : `localStorage.removeItem('token')`
2. Rechargez le dashboard
3. **Attendu** : Redirection vers `index.html`

#### Test 3 : Données Vides
1. Si la base est vide, vérifiez que :
   - Les KPIs affichent "0" (pas "-")
   - Les graphiques affichent un message approprié
   - Les listes affichent "Aucune commande" / "Aucun message"

## 🐛 Dépannage

### Problème : Les données ne s'affichent pas

**Vérifications :**
1. Backend démarré ? → Vérifiez les logs
2. Token présent ? → `localStorage.getItem('token')` dans la console
3. Erreurs dans la console ? → Regardez les messages d'erreur
4. Erreurs dans les logs du serveur ? → Vérifiez les requêtes SQL

### Problème : Graphiques vides

**Vérifications :**
1. Données dans la base ? → Vérifiez `stats.evolution_commandes` dans la console
2. Erreurs Chart.js ? → Vérifiez la console pour les erreurs JavaScript
3. Canvas présent ? → Vérifiez que les éléments `<canvas>` existent

### Problème : Erreur 404

**Solution :**
- Le backend n'est pas démarré ou la route n'est pas trouvée
- Vérifiez que le backend tourne sur le port 3000
- Vérifiez les logs du serveur

## ✅ Checklist Finale

- [ ] Backend démarré et accessible
- [ ] Dashboard accessible via navigateur
- [ ] Utilisateur connecté
- [ ] Toutes les données s'affichent
- [ ] Tous les graphiques se chargent
- [ ] Navigation fonctionne
- [ ] Actions rapides fonctionnent
- [ ] Responsive fonctionne (mobile/tablette/desktop)
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs dans les logs du serveur

## 📊 Résultat Attendu

Si tout fonctionne correctement :
- ✅ Dashboard professionnel et moderne
- ✅ Données réelles de la base de données
- ✅ Graphiques interactifs avec Chart.js
- ✅ Navigation fluide
- ✅ Design conforme à la charte Pro Confiance
- ✅ Responsive sur tous les appareils
- ✅ Accessible (WCAG)

