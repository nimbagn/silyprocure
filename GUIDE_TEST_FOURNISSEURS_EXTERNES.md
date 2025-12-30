# 🧪 Guide de test : Fournisseurs externes

## ✅ Vérifications préalables

Toutes les vérifications de base sont passées :
- ✅ Colonne `externe` dans la table `entreprises`
- ✅ Rôle `superviseur` dans la table `utilisateurs`
- ✅ Table `liens_externes` créée
- ✅ Routes API créées
- ✅ Formulaire public créé
- ✅ Interface superviseur/admin ajoutée

## 🚀 Tests à effectuer

### 1. Test de génération de lien externe

**Étapes :**
1. Connectez-vous en tant qu'**admin** ou **superviseur**
2. Allez sur une page RFQ détail : `http://localhost:3000/rfq-detail.html?id=7`
3. Dans la section "Gestion fournisseur externe", cliquez sur **"Générer un lien de remplissage"**
4. Entrez un email (optionnel) et une durée de validité
5. Cliquez sur "Générer"

**Résultat attendu :**
- Un lien unique est généré
- Le lien s'affiche avec un bouton "Copier"
- La date d'expiration est affichée

**Vérification :**
- Copiez le lien et ouvrez-le dans un nouvel onglet (ou mode navigation privée)
- Le formulaire public doit s'afficher avec les détails de la RFQ

---

### 2. Test du formulaire public

**Étapes :**
1. Utilisez le lien généré précédemment
2. Le formulaire doit afficher :
   - Les informations de la RFQ
   - Les lignes de produits/services
3. Remplissez le formulaire :
   - Numéro de devis
   - Prix unitaire HT pour chaque ligne
   - Remises et TVA (optionnels)
   - Conditions de paiement, garanties, etc.
4. Cliquez sur "Envoyer le devis"

**Résultat attendu :**
- Message de succès : "Devis soumis avec succès !"
- Le devis est créé dans la plateforme
- Le statut de la RFQ passe à "en_cours"

**Vérification :**
- Retournez sur la page RFQ détail
- Le devis doit apparaître dans la liste "Devis reçus"

---

### 3. Test d'export Excel

**Étapes :**
1. Sur la page RFQ détail
2. Cliquez sur **"Exporter en Excel"**
3. Le fichier Excel doit se télécharger

**Résultat attendu :**
- Fichier Excel téléchargé avec 2 feuilles :
  - Feuille 1 : Informations générales de la RFQ
  - Feuille 2 : Lignes de devis à remplir

**Vérification :**
- Ouvrez le fichier Excel
- Vérifiez que toutes les colonnes sont présentes
- Vérifiez que les lignes de la RFQ sont présentes

---

### 4. Test d'import Excel

**Étapes :**
1. Sur la page RFQ détail
2. Cliquez sur **"Importer un devis depuis Excel"**
3. Remplissez le formulaire :
   - Sélectionnez le fichier Excel (celui exporté précédemment, rempli)
   - Numéro de devis
   - Date d'émission
   - Autres informations optionnelles
4. Cliquez sur "Importer"

**Résultat attendu :**
- Message de succès avec le nombre de lignes importées
- Le devis est créé dans la plateforme
- Le devis apparaît dans la liste "Devis reçus"

**Vérification :**
- Vérifiez que les totaux sont corrects
- Vérifiez que toutes les lignes sont présentes

---

### 5. Test de suivi des liens

**Étapes :**
1. Sur la page RFQ détail
2. Dans la section "Gestion fournisseur externe"
3. Vérifiez la section "Liens générés"

**Résultat attendu :**
- Liste des liens générés pour cette RFQ
- Statut de chaque lien (Utilisé / En attente)
- Date d'utilisation si le lien a été utilisé
- Email envoyé si renseigné

---

## 🔍 Tests techniques (via console)

### Test de l'API de génération de lien

```bash
# Générer un token JWT (remplacez USER_ID et JWT_SECRET)
TOKEN=$(node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:1,role:'admin'},'your-secret-key',{expiresIn:'1h'}))")

# Générer un lien
curl -X POST http://localhost:3000/api/liens-externes/rfq/7/generate-link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fournisseur_id":46,"email_envoye":"test@example.com","date_expiration_jours":30}'
```

### Test de récupération RFQ par token

```bash
# Utilisez le token retourné par la commande précédente
curl http://localhost:3000/api/liens-externes/rfq-by-token/VOTRE_TOKEN
```

### Test d'export Excel

```bash
curl -X GET http://localhost:3000/api/excel/rfq/7 \
  -H "Authorization: Bearer $TOKEN" \
  -o test-rfq.xlsx
```

---

## 📊 Données de test disponibles

D'après les tests automatiques :
- **RFQ disponibles** :
  - RFQ-2024-0001 (ID: 7, Statut: en_cours)
  - RFQ-2024-0002 (ID: 8, Statut: en_cours)
  - RFQ-2024-0003 (ID: 9, Statut: envoye)

- **Fournisseurs disponibles** :
  - TechGuinée SARL (ID: 46)
  - BureauPro Conakry (ID: 47)
  - Industrie Guinée (ID: 48)
  - Services Pro (ID: 49)
  - MatConakry (ID: 50)

---

## ⚠️ Problèmes courants

### Le serveur ne répond pas
```bash
# Vérifier que le serveur est démarré
ps aux | grep "node.*server.js"

# Redémarrer si nécessaire
npm start
```

### Erreur 401 (Non autorisé)
- Vérifiez que vous êtes connecté
- Vérifiez que votre rôle est `admin` ou `superviseur`
- Reconnectez-vous si nécessaire

### Erreur 404 (Route non trouvée)
- Vérifiez que le serveur a été redémarré après les modifications
- Vérifiez les logs du serveur pour les erreurs

### Le formulaire public ne charge pas
- Vérifiez que le token dans l'URL est valide
- Vérifiez que le lien n'a pas expiré
- Vérifiez que le lien n'a pas déjà été utilisé

---

## ✅ Checklist de test complète

- [ ] Génération de lien externe fonctionne
- [ ] Formulaire public s'affiche correctement
- [ ] Soumission de devis depuis le formulaire fonctionne
- [ ] Export Excel fonctionne
- [ ] Import Excel fonctionne
- [ ] Suivi des liens fonctionne
- [ ] Les devis créés apparaissent dans la liste
- [ ] Les totaux sont calculés correctement
- [ ] Les statuts sont mis à jour correctement

---

**Date de création** : 2024  
**Version** : 1.0

