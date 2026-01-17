# PROMPT DE TEST COMPLET - SilyProcure

## 🎯 Objectif
Tester exhaustivement l'application SilyProcure pour s'assurer que toutes les fonctionnalités, la responsivité, les générations de PDF et tous les formulaires fonctionnent correctement, et apporter les correctifs nécessaires.

---

## 📋 PHASE 1 : TEST D'AUTHENTIFICATION ET ACCÈS

### 1.1 Connexion/Déconnexion
- [ ] Tester la connexion avec un compte utilisateur valide
- [ ] Tester la connexion avec des identifiants invalides (email incorrect, mot de passe incorrect)
- [ ] Vérifier la gestion des sessions (expiration, token)
- [ ] Tester la déconnexion depuis toutes les pages
- [ ] Vérifier la redirection après déconnexion
- [ ] Tester l'accès aux pages protégées sans authentification (doit rediriger vers index.html)

### 1.2 Gestion des utilisateurs (Admin)
- [ ] Créer un nouvel utilisateur
- [ ] Modifier les informations d'un utilisateur existant
- [ ] Désactiver/Activer un utilisateur
- [ ] Changer le mot de passe d'un utilisateur
- [ ] Supprimer un utilisateur
- [ ] Vérifier les permissions (admin vs utilisateur standard)

---

## 📋 PHASE 2 : TEST DES PAGES PRINCIPALES ET NAVIGATION

### 2.1 Page d'accueil (home.html)
- [ ] Vérifier l'affichage de tous les éléments (hero, avantages, processus)
- [ ] Tester le formulaire de demande de devis (modal)
- [ ] Tester le formulaire de suivi de commande
- [ ] Vérifier le chargement des logos clients (API `/api/public/entreprises`)
- [ ] Tester le menu mobile (hamburger)
- [ ] Vérifier les liens de navigation
- [ ] Tester la responsivité (mobile, tablette, desktop)

### 2.2 Dashboard (dashboard.html)
- [ ] Vérifier le chargement des statistiques (KPI cards)
- [ ] Tester l'affichage des graphiques (Chart.js)
  - [ ] Graphique d'évolution des achats (6 derniers mois)
  - [ ] Graphique en donut des statuts RFQ
  - [ ] Graphique en barres des catégories
  - [ ] Graphique polar area des secteurs
- [ ] Vérifier le chargement des commandes récentes
- [ ] Vérifier le chargement des messages récents
- [ ] Tester le bouton d'actualisation
- [ ] Vérifier les liens vers les autres pages depuis les cartes KPI
- [ ] Tester la responsivité

### 2.3 Navigation et Menu
- [ ] Tester le menu moderne (hamburger) sur toutes les pages
- [ ] Vérifier que la page active est correctement identifiée dans le menu
- [ ] Tester l'ouverture/fermeture du menu mobile
- [ ] Vérifier tous les liens du menu sur chaque page
- [ ] Tester la navbar sur desktop et mobile
- [ ] Vérifier la recherche globale (si présente)
- [ ] Tester les notifications (badge, dropdown)

---

## 📋 PHASE 3 : TEST DES FORMULAIRES

### 3.1 Formulaire de création RFQ (rfq-create.html)
- [ ] Remplir tous les champs obligatoires
- [ ] Ajouter plusieurs lignes de produits
- [ ] Supprimer une ligne de produit
- [ ] Tester la validation des champs (champs requis, formats)
- [ ] Tester la soumission du formulaire
- [ ] Vérifier les messages d'erreur
- [ ] Vérifier les messages de succès
- [ ] Tester la responsivité du formulaire

### 3.2 Formulaire de création Devis (devis-create.html)
- [ ] Sélectionner une RFQ
- [ ] Ajouter des lignes de devis
- [ ] Modifier les quantités et prix
- [ ] Tester la validation
- [ ] Vérifier le calcul automatique des totaux
- [ ] Tester la soumission

### 3.3 Formulaire de création Commande (commandes.html)
- [ ] Créer une commande depuis un devis
- [ ] Modifier les quantités
- [ ] Ajouter des notes
- [ ] Tester la validation
- [ ] Vérifier la soumission

### 3.4 Formulaire de gestion Entreprises (entreprises.html)
- [ ] Créer une nouvelle entreprise (client ou fournisseur)
- [ ] Remplir tous les champs (RCCM, NIF, capital social, adresse)
- [ ] Tester la validation des champs
- [ ] Modifier une entreprise existante
- [ ] Tester la recherche et les filtres
- [ ] Vérifier l'affichage de la liste

### 3.5 Formulaire de gestion Produits (produits.html)
- [ ] Créer un nouveau produit
- [ ] Associer un produit à un fournisseur
- [ ] Modifier un produit
- [ ] Tester la recherche de produits
- [ ] Vérifier les filtres par catégorie

### 3.6 Formulaire de demande de devis (home.html - modal)
- [ ] Remplir le formulaire avec nom, entreprise, email, téléphone
- [ ] Ajouter plusieurs articles avec quantités
- [ ] Tester la soumission
- [ ] Vérifier la création de la demande dans la base

### 3.7 Formulaire de contact/messages
- [ ] Envoyer un message depuis le formulaire de contact
- [ ] Vérifier l'affichage dans la liste des messages
- [ ] Marquer un message comme lu
- [ ] Tester la recherche de messages

---

## 📋 PHASE 4 : TEST DES PAGES DE LISTE ET DÉTAIL

### 4.1 RFQ (rfq.html)
- [ ] Vérifier l'affichage de la liste des RFQ
- [ ] Tester les filtres (statut, date, entreprise)
- [ ] Tester la recherche
- [ ] Vérifier le tri (par date, statut)
- [ ] Cliquer sur une RFQ pour voir les détails
- [ ] Tester la création d'une nouvelle RFQ depuis la page
- [ ] Vérifier la responsivité

### 4.2 RFQ Détail (rfq-detail.html)
- [ ] Vérifier l'affichage de tous les détails
- [ ] Tester les actions (modifier, supprimer, créer devis)
- [ ] Vérifier l'affichage des lignes de produits
- [ ] Tester le téléchargement du PDF RFQ
- [ ] Vérifier la responsivité

### 4.3 Devis (devis.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester les filtres et la recherche
- [ ] Tester la comparaison de devis (devis-compare.html)
- [ ] Vérifier le tri
- [ ] Tester la création d'un devis

### 4.4 Devis Détail (devis-detail.html)
- [ ] Vérifier tous les détails
- [ ] Tester les actions (accepter, refuser, créer commande)
- [ ] Tester le téléchargement du PDF devis
- [ ] Vérifier les calculs (totaux HT, TVA, TTC)

### 4.5 Commandes (commandes.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester les filtres (statut, fournisseur, date)
- [ ] Tester la recherche
- [ ] Vérifier le tri
- [ ] Tester la création d'une commande

### 4.6 Commande Détail (commandes-detail.html)
- [ ] Vérifier tous les détails
- [ ] Tester les actions (modifier statut, créer bon de livraison)
- [ ] Tester le téléchargement du PDF commande
- [ ] Vérifier l'affichage des lignes

### 4.7 Factures (factures.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester les filtres (type, statut)
- [ ] Tester la recherche
- [ ] Vérifier les statistiques (total, en attente, payées, montant)
- [ ] Tester la responsivité

### 4.8 Facture Détail (factures-detail.html)
- [ ] Vérifier tous les détails
- [ ] Tester le téléchargement du PDF facture
- [ ] Vérifier l'affichage des lignes
- [ ] Tester les actions (marquer comme payée, ajouter paiement)

### 4.9 Entreprises (entreprises.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester les filtres (type, statut)
- [ ] Tester la recherche
- [ ] Vérifier le tri
- [ ] Tester la création d'une entreprise

### 4.10 Entreprise Détail (entreprises-detail.html)
- [ ] Vérifier tous les détails
- [ ] Tester la modification
- [ ] Vérifier l'affichage des adresses
- [ ] Tester les actions (désactiver, modifier)

### 4.11 Produits (produits.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester la recherche
- [ ] Tester les filtres par catégorie
- [ ] Vérifier le tri

### 4.12 Catalogue Fournisseur (catalogue-fournisseur.html)
- [ ] Vérifier l'affichage du catalogue
- [ ] Tester la recherche de produits
- [ ] Tester les filtres par fournisseur
- [ ] Vérifier l'ajout de produits au panier (si applicable)

### 4.13 Demandes Devis (demandes-devis.html)
- [ ] Vérifier l'affichage des demandes
- [ ] Tester les filtres
- [ ] Tester la création d'une RFQ depuis une demande
- [ ] Vérifier le statut des demandes

### 4.14 Clients (clients.html)
- [ ] Vérifier l'affichage de la liste
- [ ] Tester la recherche
- [ ] Vérifier les filtres

### 4.15 Carte (carte.html)
- [ ] Vérifier le chargement de la carte
- [ ] Tester l'affichage des marqueurs (entreprises, commandes)
- [ ] Tester le filtrage par type d'entreprise
- [ ] Tester le clic sur un marqueur (affichage des détails)
- [ ] Vérifier le géocodage automatique
- [ ] Tester la responsivité (mobile, tablette)

### 4.16 Notifications (notifications.html)
- [ ] Vérifier l'affichage des notifications
- [ ] Tester le marquage comme lu
- [ ] Tester la suppression
- [ ] Vérifier les filtres

### 4.17 Utilisateurs (utilisateurs.html) - Admin
- [ ] Vérifier l'affichage de la liste
- [ ] Tester la création d'un utilisateur
- [ ] Tester la modification
- [ ] Tester la désactivation
- [ ] Vérifier les permissions

### 4.18 Paramètres MessagePro (parametres-messagepro.html) - Admin
- [ ] Vérifier l'affichage des paramètres
- [ ] Tester la modification des paramètres
- [ ] Vérifier la sauvegarde

---

## 📋 PHASE 5 : TEST DES GÉNÉRATIONS DE PDF

### 5.1 PDF RFQ
- [ ] Générer le PDF d'une RFQ depuis rfq-detail.html
- [ ] Vérifier que le PDF contient :
  - [ ] Logo et en-tête SilyProcure
  - [ ] Numéro et date de la RFQ
  - [ ] Informations du client
  - [ ] Toutes les lignes de produits avec quantités
  - [ ] Totaux (HT, TVA, TTC)
  - [ ] Conditions et garanties
  - [ ] Pied de page
- [ ] Vérifier le format (A4)
- [ ] Vérifier que le téléchargement fonctionne
- [ ] Tester avec différentes tailles de RFQ (peu de lignes, beaucoup de lignes)

### 5.2 PDF Devis
- [ ] Générer le PDF d'un devis depuis devis-detail.html
- [ ] Vérifier que le PDF contient :
  - [ ] Logo et en-tête
  - [ ] Numéro et date du devis
  - [ ] Date de validité
  - [ ] Informations du fournisseur
  - [ ] Toutes les lignes avec prix unitaire, quantités, totaux
  - [ ] Totaux (HT, TVA, TTC)
  - [ ] Conditions de paiement
  - [ ] Délai de livraison
  - [ ] Garanties
- [ ] Vérifier le format
- [ ] Tester avec différents types de devis

### 5.3 PDF Commande
- [ ] Générer le PDF d'une commande depuis commandes-detail.html
- [ ] Vérifier que le PDF contient :
  - [ ] Logo et en-tête
  - [ ] Numéro et date de commande
  - [ ] Date de livraison souhaitée
  - [ ] Informations du fournisseur
  - [ ] Toutes les lignes de commande
  - [ ] Totaux
  - [ ] Conditions
- [ ] Vérifier le format
- [ ] Tester le téléchargement

### 5.4 PDF Facture (Proforma et Définitive)
- [ ] Générer le PDF d'une facture proforma depuis factures-detail.html
- [ ] Générer le PDF d'une facture définitive
- [ ] Vérifier que le PDF contient :
  - [ ] Logo et en-tête
  - [ ] Type de facture (PROFORMA ou FACTURE)
  - [ ] Numéro et date d'émission
  - [ ] Date d'échéance
  - [ ] Informations du client
  - [ ] Toutes les lignes avec descriptions, quantités, prix
  - [ ] Totaux (HT, TVA, TTC)
  - [ ] Reste à payer (si applicable)
  - [ ] Conditions de paiement
- [ ] Vérifier que les prix d'achat et marges ne sont PAS affichés (confidentialité)
- [ ] Vérifier le format
- [ ] Tester avec différents statuts de facture

### 5.5 PDF Bon de Livraison (bons-livraison-detail.html)
- [ ] Générer le PDF d'un bon de livraison
- [ ] Vérifier que le PDF contient :
  - [ ] Logo et en-tête
  - [ ] Numéro et date
  - [ ] Informations du client
  - [ ] Lignes de livraison
  - [ ] Totaux
- [ ] Vérifier le format

### 5.6 Tests généraux PDF
- [ ] Vérifier que tous les PDF s'ouvrent correctement dans un lecteur PDF
- [ ] Vérifier que les caractères spéciaux (accents, symboles) s'affichent correctement
- [ ] Vérifier que les montants en GNF sont correctement formatés
- [ ] Tester la génération avec des données manquantes (gestion d'erreurs)
- [ ] Vérifier les performances (temps de génération)

---

## 📋 PHASE 6 : TEST DE RESPONSIVITÉ

### 6.1 Breakpoints à tester
- [ ] Mobile (< 640px) : iPhone SE, iPhone 12/13, Android
- [ ] Tablette (640px - 1024px) : iPad, iPad Pro
- [ ] Desktop (> 1024px) : 1280px, 1920px, 2560px

### 6.2 Pages à tester en responsive
Pour chaque page, vérifier :
- [ ] **home.html**
  - [ ] Menu mobile fonctionne
  - [ ] Hero section s'adapte
  - [ ] Bento grid se réorganise
  - [ ] Formulaire modal responsive
  - [ ] Tracking widget responsive

- [ ] **dashboard.html**
  - [ ] KPI cards s'empilent sur mobile
  - [ ] Graphiques s'adaptent (Chart.js responsive)
  - [ ] Tableaux deviennent scrollables horizontalement
  - [ ] Menu mobile fonctionne

- [ ] **rfq.html, devis.html, commandes.html, factures.html**
  - [ ] Tableaux deviennent scrollables ou en cartes sur mobile
  - [ ] Filtres s'empilent verticalement
  - [ ] Boutons d'action restent accessibles
  - [ ] Formulaire de recherche responsive

- [ ] **factures.html**
  - [ ] Grille de cartes s'adapte (1 colonne mobile, 2-3 tablette, 3-4 desktop)
  - [ ] Stats cards s'empilent
  - [ ] Filtres responsive

- [ ] **carte.html**
  - [ ] Carte s'adapte à la taille d'écran
  - [ ] Panneau latéral devient modal sur mobile
  - [ ] Contrôles de zoom accessibles

- [ ] **Toutes les pages de formulaire**
  - [ ] Champs s'empilent verticalement sur mobile
  - [ ] Labels restent lisibles
  - [ ] Boutons de soumission accessibles
  - [ ] Messages d'erreur visibles

### 6.3 Éléments spécifiques à vérifier
- [ ] Menu hamburger s'affiche/masque correctement
- [ ] Tous les boutons ont une taille minimale tactile (44x44px)
- [ ] Textes restent lisibles (pas trop petits)
- [ ] Images/logos s'adaptent sans déformation
- [ ] Modals s'adaptent à la taille d'écran
- [ ] Pas de scroll horizontal non désiré
- [ ] Espacements cohérents sur tous les breakpoints

---

## 📋 PHASE 7 : TEST DES FONCTIONNALITÉS AVANCÉES

### 7.1 Recherche et Filtres
Pour chaque page avec recherche/filtres :
- [ ] Tester la recherche en temps réel
- [ ] Tester les filtres multiples combinés
- [ ] Vérifier que les résultats se mettent à jour correctement
- [ ] Tester la réinitialisation des filtres
- [ ] Vérifier la performance avec beaucoup de données

### 7.2 Calculs automatiques
- [ ] Vérifier le calcul des totaux HT dans les formulaires
- [ ] Vérifier le calcul de la TVA
- [ ] Vérifier le calcul du TTC
- [ ] Vérifier le calcul des remises
- [ ] Vérifier le calcul du reste à payer (factures)

### 7.3 Workflow complet
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

### 7.4 Notifications
- [ ] Vérifier l'affichage des notifications en temps réel
- [ ] Tester le marquage comme lu
- [ ] Vérifier les notifications pour nouveaux messages
- [ ] Vérifier les notifications pour changements de statut

### 7.5 Géolocalisation
- [ ] Vérifier le géocodage automatique des adresses
- [ ] Tester l'affichage sur la carte
- [ ] Vérifier les filtres de la carte
- [ ] Tester le clic sur les marqueurs

---

## 📋 PHASE 8 : TEST DE PERFORMANCE ET ERREURS

### 8.1 Performance
- [ ] Temps de chargement des pages (< 3 secondes)
- [ ] Temps de chargement des listes (< 2 secondes)
- [ ] Temps de génération des PDF (< 5 secondes)
- [ ] Performance avec beaucoup de données (100+ RFQ, 100+ factures)
- [ ] Vérifier l'utilisation mémoire

### 8.2 Gestion d'erreurs
- [ ] Tester avec des données invalides
- [ ] Tester avec des champs manquants
- [ ] Vérifier les messages d'erreur utilisateur
- [ ] Vérifier la gestion des erreurs API (500, 404, 401)
- [ ] Tester la déconnexion automatique en cas d'expiration de session
- [ ] Vérifier les messages d'erreur réseau

### 8.3 Validation des données
- [ ] Tester la validation côté client (HTML5, JavaScript)
- [ ] Tester la validation côté serveur (si accessible)
- [ ] Vérifier les formats (email, téléphone, montants)
- [ ] Vérifier les champs obligatoires

---

## 📋 PHASE 9 : TEST DE SÉCURITÉ ET PERMISSIONS

### 9.1 Authentification
- [ ] Vérifier que les tokens sont correctement stockés
- [ ] Vérifier que les tokens expirent correctement
- [ ] Tester l'accès aux routes protégées sans token
- [ ] Vérifier la déconnexion supprime le token

### 9.2 Permissions
- [ ] Vérifier que les utilisateurs non-admin ne peuvent pas accéder aux pages admin
- [ ] Vérifier que les utilisateurs ne peuvent modifier que leurs propres données (si applicable)
- [ ] Tester les restrictions d'accès aux données

### 9.3 Données sensibles
- [ ] Vérifier que les prix d'achat ne sont pas visibles dans les PDF factures clients
- [ ] Vérifier que les marges ne sont pas exposées
- [ ] Tester la confidentialité des données entre clients

---

## 📋 PHASE 10 : TEST DE COMPATIBILITÉ NAVIGATEURS

### 10.1 Navigateurs à tester
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Edge (dernière version)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 10.2 Éléments à vérifier par navigateur
- [ ] Affichage correct de tous les styles
- [ ] Fonctionnement de JavaScript
- [ ] Génération des PDF
- [ ] Affichage des graphiques (Chart.js)
- [ ] Fonctionnement des modals
- [ ] Responsivité

---

## 📋 PHASE 11 : TEST D'ACCESSIBILITÉ

### 11.1 Éléments de base
- [ ] Tous les boutons ont des labels accessibles (aria-label)
- [ ] Les images ont des alt text
- [ ] Les formulaires ont des labels associés
- [ ] Navigation au clavier fonctionne
- [ ] Contraste des couleurs suffisant (WCAG AA minimum)

### 11.2 ARIA
- [ ] Vérifier les attributs ARIA sur les éléments interactifs
- [ ] Vérifier les rôles ARIA
- [ ] Vérifier les états ARIA (aria-expanded, aria-hidden)

---

## 📋 PHASE 12 : RAPPORT ET CORRECTIFS

### 12.1 Documentation des bugs
Pour chaque bug trouvé, documenter :
- [ ] Page concernée
- [ ] Navigateur/OS
- [ ] Taille d'écran
- [ ] Étapes pour reproduire
- [ ] Comportement attendu
- [ ] Comportement observé
- [ ] Capture d'écran (si possible)
- [ ] Priorité (Critique, Haute, Moyenne, Basse)

### 12.2 Correctifs à apporter
- [ ] Corriger tous les bugs critiques en priorité
- [ ] Corriger les bugs de haute priorité
- [ ] Améliorer les bugs de moyenne/basse priorité si temps disponible
- [ ] Vérifier que les correctifs ne cassent pas d'autres fonctionnalités
- [ ] Re-tester après chaque correctif

### 12.3 Checklist finale
- [ ] Tous les formulaires fonctionnent
- [ ] Toutes les générations de PDF fonctionnent
- [ ] La responsivité est correcte sur tous les breakpoints
- [ ] Toutes les pages sont accessibles
- [ ] La navigation fonctionne partout
- [ ] Les calculs sont corrects
- [ ] Les validations fonctionnent
- [ ] Les messages d'erreur sont clairs
- [ ] Les performances sont acceptables
- [ ] La sécurité est respectée

---

## 🎯 INSTRUCTIONS POUR L'EXÉCUTION

1. **Préparer l'environnement**
   - S'assurer que le backend est démarré
   - S'assurer que la base de données est accessible
   - Avoir des données de test (utilisateurs, entreprises, RFQ, devis, commandes, factures)

2. **Exécuter les tests par phase**
   - Commencer par la Phase 1 (Authentification)
   - Continuer séquentiellement
   - Cocher chaque case au fur et à mesure

3. **Documenter les problèmes**
   - Noter immédiatement chaque bug trouvé
   - Prendre des captures d'écran
   - Noter les étapes de reproduction

4. **Apporter les correctifs**
   - Corriger les bugs au fur et à mesure ou à la fin
   - Re-tester après chaque correctif
   - Mettre à jour la documentation

5. **Validation finale**
   - Re-exécuter les tests critiques après tous les correctifs
   - S'assurer qu'aucune régression n'a été introduite

---

## 📝 NOTES IMPORTANTES

- **Priorité des tests** : Commencer par les fonctionnalités critiques (authentification, création RFQ/devis/commandes, génération PDF)
- **Données de test** : S'assurer d'avoir des données variées (factures payées/non payées, commandes livrées/en cours, etc.)
- **Environnements** : Tester sur différents environnements si possible (local, staging, production)
- **Documentation** : Maintenir un journal de test avec dates et résultats

---

**Date de création** : 2026-01-16  
**Version** : 1.0  
**Application** : SilyProcure

