# ✅ Checklist de Test Final - SilyProcure

**Date**: $(date)  
**Version**: 1.5  
**Testeur**: _________________

---

## 📋 PRÉ-REQUIS

- [ ] Serveur backend démarré (`npm start` dans le dossier backend)
- [ ] Base de données accessible et fonctionnelle
- [ ] Variables d'environnement configurées (.env)
- [ ] Compte administrateur disponible
- [ ] Navigateur web à jour (Chrome/Firefox/Safari)

---

## 🔐 PHASE 1 : AUTHENTIFICATION

### 1.1 Connexion
- [ ] Connexion réussie avec identifiants valides
- [ ] Redirection vers dashboard après connexion
- [ ] Token JWT stocké dans localStorage
- [ ] Message d'erreur avec identifiants invalides
- [ ] Message d'erreur avec email invalide
- [ ] Message d'erreur avec mot de passe vide

### 1.2 Déconnexion
- [ ] Déconnexion depuis le menu
- [ ] Token supprimé après déconnexion
- [ ] Redirection vers page de connexion
- [ ] Accès aux pages protégées bloqué après déconnexion

### 1.3 Session
- [ ] Session maintenue lors du rafraîchissement de page
- [ ] Redirection si token expiré
- [ ] Message d'erreur clair si session expirée

---

## 🏠 PHASE 2 : PAGE D'ACCUEIL (home.html)

### 2.1 Affichage
- [ ] Page se charge correctement
- [ ] Menu de navigation visible et fonctionnel
- [ ] Hero section affichée
- [ ] Section avantages visible
- [ ] Section processus visible
- [ ] Logos clients chargés (si disponibles)
- [ ] Footer visible

### 2.2 Formulaire de demande de devis
- [ ] Modal s'ouvre au clic sur "Demander un devis"
- [ ] Tous les champs sont présents :
  - [ ] Nom complet
  - [ ] Email
  - [ ] Téléphone
  - [ ] Entreprise (optionnel)
  - [ ] Adresse de livraison
  - [ ] Articles (ajout/suppression)
- [ ] Validation des champs (email, téléphone)
- [ ] Soumission réussie
- [ ] Message de confirmation affiché
- [ ] Modal se ferme après soumission

### 2.3 Formulaire de suivi
- [ ] Widget de suivi visible
- [ ] Recherche par numéro de commande fonctionne
- [ ] Affichage des détails de commande
- [ ] Message si commande non trouvée

### 2.4 Responsive
- [ ] Menu mobile fonctionne (hamburger)
- [ ] Layout s'adapte sur mobile (< 640px)
- [ ] Layout s'adapte sur tablette (640-1024px)
- [ ] Pas de scroll horizontal indésirable

---

## 📊 PHASE 3 : DASHBOARD (dashboard.html)

### 3.1 Statistiques (KPI Cards)
- [ ] Total RFQ affiché
- [ ] RFQ en cours affichées
- [ ] Total commandes affiché
- [ ] Commandes en attente affichées
- [ ] Total factures affiché
- [ ] Factures en attente affichées
- [ ] Montant total factures affiché
- [ ] Commandes du mois affichées
- [ ] Liens depuis les cartes fonctionnent

### 3.2 Graphiques
- [ ] Graphique d'évolution des achats (6 mois) affiché
- [ ] Graphique donut des statuts RFQ affiché
- [ ] Graphique barres des catégories affiché
- [ ] Graphique polar area des secteurs affiché
- [ ] Graphiques responsive (s'adaptent à la taille d'écran)

### 3.3 Activité récente
- [ ] Liste des RFQ récentes affichée
- [ ] Liste des devis récents affichés
- [ ] Liste des commandes récentes affichée
- [ ] Liens vers les détails fonctionnent

### 3.4 Navigation
- [ ] Menu fonctionne
- [ ] Bouton d'actualisation fonctionne
- [ ] Responsive sur mobile

---

## 📝 PHASE 4 : GESTION RFQ

### 4.1 Liste RFQ (rfq.html)
- [ ] Liste des RFQ affichée
- [ ] Recherche fonctionne (par numéro, client, statut)
- [ ] Filtres fonctionnent (statut, date)
- [ ] Tri par colonnes fonctionne
- [ ] Bouton "Nouvelle RFQ" visible et fonctionne
- [ ] Clic sur une RFQ ouvre les détails

### 4.2 Création RFQ (rfq-create.html)
- [ ] Formulaire s'affiche correctement
- [ ] Étape 1 : Informations générales
  - [ ] Sélection client fonctionne
  - [ ] Date limite sélectionnable
  - [ ] Champs obligatoires validés
- [ ] Étape 2 : Recherche fournisseurs
  - [ ] Recherche de fournisseurs fonctionne
  - [ ] Sélection multiple possible
  - [ ] Filtres fonctionnent
- [ ] Étape 3 : Produits
  - [ ] Ajout de lignes de produits fonctionne
  - [ ] Suppression de lignes fonctionne
  - [ ] Calcul automatique des totaux
- [ ] Étape 4 : Conditions
  - [ ] Tous les champs remplissables
- [ ] Soumission réussie
- [ ] Redirection vers liste RFQ

### 4.3 Détails RFQ (rfq-detail.html)
- [ ] Tous les détails affichés
- [ ] Lignes de produits affichées
- [ ] Bouton "Générer PDF" fonctionne
- [ ] Bouton "Créer devis" fonctionne
- [ ] Bouton "Modifier" fonctionne (si autorisé)
- [ ] Bouton "Supprimer" fonctionne (si autorisé)

---

## 💰 PHASE 5 : GESTION DEVIS

### 5.1 Liste devis (devis.html)
- [ ] Liste des devis affichée
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent (statut, fournisseur, RFQ)
- [ ] Tri fonctionne
- [ ] Bouton "Nouveau devis" fonctionne
- [ ] Bouton "Comparer devis" fonctionne

### 5.2 Création devis (devis-create.html)
- [ ] Sélection RFQ fonctionne
- [ ] Lignes de la RFQ chargées
- [ ] Modification des prix possible
- [ ] Modification des quantités possible
- [ ] Calcul automatique des totaux (HT, TVA, TTC)
- [ ] Ajout de notes possible
- [ ] Soumission réussie

### 5.3 Détails devis (devis-detail.html)
- [ ] Tous les détails affichés
- [ ] Lignes de devis affichées avec calculs
- [ ] Bouton "Générer PDF" fonctionne
- [ ] Bouton "Accepter" fonctionne
- [ ] Bouton "Refuser" fonctionne
- [ ] Bouton "Créer commande" fonctionne (si accepté)

### 5.4 Comparaison devis (devis-compare.html)
- [ ] Sélection de plusieurs devis possible
- [ ] Tableau comparatif affiché
- [ ] Colonnes : Fournisseur, Prix HT, TVA, TTC, Délai, Garantie
- [ ] Tri par colonnes fonctionne
- [ ] Bouton "Sélectionner le meilleur" fonctionne

---

## 🛒 PHASE 6 : GESTION COMMANDES

### 6.1 Liste commandes (commandes.html)
- [ ] Liste des commandes affichée
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent (statut, fournisseur, date)
- [ ] Tri fonctionne
- [ ] Bouton "Nouvelle commande" fonctionne

### 6.2 Détails commande (commandes-detail.html)
- [ ] Tous les détails affichés
- [ ] Lignes de commande affichées
- [ ] Bouton "Générer PDF" fonctionne
- [ ] Bouton "Créer bon de livraison" fonctionne
- [ ] Modification du statut fonctionne

---

## 🧾 PHASE 7 : GESTION FACTURES

### 7.1 Liste factures (factures.html)
- [ ] Liste des factures affichée (grille de cartes)
- [ ] Statistiques affichées (total, en attente, payées, montant)
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent (type, statut, client)
- [ ] Tri fonctionne
- [ ] Responsive (1 colonne mobile, 2-3 tablette, 3-4 desktop)

### 7.2 Détails facture (factures-detail.html)
- [ ] Tous les détails affichés
- [ ] Type de facture visible (PROFORMA ou FACTURE)
- [ ] Lignes de facture affichées
- [ ] Totaux corrects (HT, TVA, TTC)
- [ ] Reste à payer affiché (si applicable)
- [ ] Bouton "Générer PDF" fonctionne
- [ ] Bouton "Marquer comme payée" fonctionne
- [ ] Ajout de paiement fonctionne

---

## 🏢 PHASE 8 : GESTION ENTREPRISES

### 8.1 Liste entreprises (entreprises.html)
- [ ] Liste des entreprises affichée
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent (type, statut)
- [ ] Tri fonctionne
- [ ] Bouton "Nouvelle entreprise" fonctionne

### 8.2 Création/Modification entreprise
- [ ] Formulaire complet affiché
- [ ] Champs RCCM, NIF, capital social présents
- [ ] Géolocalisation automatique fonctionne
- [ ] Validation des champs fonctionne
- [ ] Sauvegarde réussie

### 8.3 Détails entreprise (entreprises-detail.html)
- [ ] Tous les détails affichés
- [ ] Adresses affichées
- [ ] Coordonnées bancaires affichées
- [ ] Bouton "Modifier" fonctionne
- [ ] Bouton "Désactiver" fonctionne

---

## 📦 PHASE 9 : GESTION PRODUITS

### 9.1 Liste produits (produits.html)
- [ ] Liste des produits affichée
- [ ] Recherche fonctionne
- [ ] Filtres par catégorie fonctionnent
- [ ] Tri fonctionne
- [ ] Bouton "Nouveau produit" fonctionne

### 9.2 Création/Modification produit
- [ ] Formulaire complet affiché
- [ ] Catégories disponibles
- [ ] Prix en GNF
- [ ] Gestion du stock
- [ ] Validation fonctionne
- [ ] Sauvegarde réussie

---

## 🗺️ PHASE 10 : GÉOLOCALISATION (carte.html)

### 10.1 Affichage carte
- [ ] Carte Leaflet se charge
- [ ] Marqueurs des entreprises affichés
- [ ] Marqueurs colorés par type d'entreprise
- [ ] Légende affichée

### 10.2 Fonctionnalités
- [ ] Filtres par type d'entreprise fonctionnent
- [ ] Clic sur marqueur affiche les détails
- [ ] Géocodage automatique fonctionne
- [ ] Itinéraire vers Google Maps fonctionne
- [ ] Responsive (panneau latéral devient modal sur mobile)

---

## 📄 PHASE 11 : GÉNÉRATION PDF

### 11.1 PDF RFQ
- [ ] PDF généré avec succès
- [ ] Logo et en-tête présents
- [ ] Numéro et date RFQ présents
- [ ] Informations client présentes
- [ ] Toutes les lignes de produits présentes
- [ ] Totaux corrects
- [ ] Format A4 respecté
- [ ] Téléchargement fonctionne

### 11.2 PDF Devis
- [ ] PDF généré avec succès
- [ ] Tous les éléments présents (logo, numéro, date, validité)
- [ ] Informations fournisseur présentes
- [ ] Lignes avec prix unitaire, quantités, totaux
- [ ] Totaux HT, TVA, TTC corrects
- [ ] Conditions de paiement présentes

### 11.3 PDF Commande
- [ ] PDF généré avec succès
- [ ] Tous les éléments présents
- [ ] Informations fournisseur présentes
- [ ] Lignes de commande présentes
- [ ] Totaux corrects

### 11.4 PDF Facture
- [ ] PDF Proforma généré avec succès
- [ ] PDF Facture définitive généré avec succès
- [ ] Type de facture visible (PROFORMA/FACTURE)
- [ ] Informations client présentes
- [ ] Lignes avec descriptions, quantités, prix
- [ ] Totaux corrects
- [ ] Reste à payer affiché (si applicable)
- [ ] **Prix d'achat et marges NON visibles** (confidentialité)

### 11.5 PDF Bon de Livraison
- [ ] PDF généré avec succès
- [ ] Tous les éléments présents
- [ ] Lignes de livraison présentes

---

## 🔍 PHASE 12 : RECHERCHE ET FILTRES

### 12.1 Recherche
- [ ] Recherche en temps réel fonctionne sur toutes les pages
- [ ] Recherche par plusieurs critères fonctionne
- [ ] Résultats se mettent à jour correctement
- [ ] Performance acceptable avec beaucoup de données

### 12.2 Filtres
- [ ] Filtres multiples combinés fonctionnent
- [ ] Réinitialisation des filtres fonctionne
- [ ] Filtres persistants (si applicable)

---

## 📱 PHASE 13 : RESPONSIVE DESIGN

### 13.1 Mobile (< 640px)
- [ ] Menu hamburger fonctionne sur toutes les pages
- [ ] Tableaux deviennent scrollables ou en cartes
- [ ] Formulaires s'empilent verticalement
- [ ] Boutons ont taille minimale tactile (44x44px)
- [ ] Textes restent lisibles
- [ ] Pas de scroll horizontal indésirable

### 13.2 Tablette (640-1024px)
- [ ] Layout adapté
- [ ] Grilles s'adaptent (2-3 colonnes)
- [ ] Menu fonctionne

### 13.3 Desktop (> 1024px)
- [ ] Layout optimal
- [ ] Tous les éléments visibles
- [ ] Grilles complètes (3-4 colonnes)

---

## 🔒 PHASE 14 : SÉCURITÉ

### 14.1 Authentification
- [ ] Routes protégées inaccessibles sans token
- [ ] Token expiré redirige vers connexion
- [ ] Déconnexion supprime le token

### 14.2 Permissions
- [ ] Utilisateurs non-admin ne peuvent pas accéder aux pages admin
- [ ] Restrictions d'accès respectées

### 14.3 Données sensibles
- [ ] Prix d'achat non visibles dans PDF factures clients
- [ ] Marges non exposées
- [ ] Confidentialité entre clients respectée

---

## ⚡ PHASE 15 : PERFORMANCE

### 15.1 Temps de chargement
- [ ] Pages se chargent en < 3 secondes
- [ ] Listes se chargent en < 2 secondes
- [ ] PDF se génèrent en < 5 secondes

### 15.2 Performance avec beaucoup de données
- [ ] 100+ RFQ : performance acceptable
- [ ] 100+ factures : performance acceptable
- [ ] Utilisation mémoire raisonnable

---

## 🐛 PHASE 16 : GESTION D'ERREURS

### 16.1 Validation
- [ ] Messages d'erreur clairs pour champs invalides
- [ ] Validation côté client fonctionne
- [ ] Validation côté serveur fonctionne

### 16.2 Erreurs API
- [ ] Erreur 404 : message clair
- [ ] Erreur 401 : redirection vers connexion
- [ ] Erreur 500 : message d'erreur générique
- [ ] Erreur réseau : message clair

---

## ✅ PHASE 17 : WORKFLOW COMPLET

Tester un workflow complet de bout en bout :

1. [ ] Créer une demande de devis depuis home.html
2. [ ] Vérifier l'apparition dans demandes-devis.html
3. [ ] Créer une RFQ depuis la demande
4. [ ] Vérifier l'apparition dans rfq.html
5. [ ] Générer le PDF de la RFQ
6. [ ] Créer un devis depuis la RFQ
7. [ ] Comparer plusieurs devis
8. [ ] Accepter un devis et créer une commande
9. [ ] Vérifier l'apparition dans commandes.html
10. [ ] Générer le PDF de la commande
11. [ ] Créer un bon de livraison
12. [ ] Créer une facture depuis la commande
13. [ ] Générer le PDF de la facture
14. [ ] Marquer la facture comme payée

---

## 📊 RÉSULTATS FINAUX

### Statistiques
- **Total de tests**: _____
- **Tests réussis**: _____
- **Tests échoués**: _____
- **Taux de réussite**: _____%

### Bugs critiques identifiés
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Bugs non-critiques identifiés
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Recommandations
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## ✅ VALIDATION FINALE

- [ ] Tous les tests critiques sont passés
- [ ] Aucun bug bloquant identifié
- [ ] Performance acceptable
- [ ] Responsive design fonctionne
- [ ] Sécurité respectée
- [ ] Documentation à jour

**Signature du testeur**: _________________  
**Date**: _________________

---

**Note**: Cette checklist doit être complétée de manière exhaustive avant toute mise en production.

