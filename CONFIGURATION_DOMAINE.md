# 🌐 Configuration du Domaine Personnalisé - silyprocure.com

## 📋 Vue d'ensemble

Ce guide vous accompagne pour configurer votre domaine `silyprocure.com` sur Render et le rendre accessible publiquement.

## ✅ Prérequis

1. **Domaine enregistré** : Vous devez posséder le domaine `silyprocure.com`
2. **Accès au registrar DNS** : Accès au panneau de gestion DNS de votre domaine
3. **Service Render actif** : Votre service web doit être déployé sur Render

## 🚀 Étapes de Configuration

### Étape 1 : Configurer le domaine sur Render

1. **Connectez-vous** sur [dashboard.render.com](https://dashboard.render.com)
2. **Allez dans votre service web** `silyprocure`
3. **Cliquez sur "Settings"** dans le menu de gauche
4. **Scrollez jusqu'à "Custom Domains"**
5. **Cliquez sur "Add Custom Domain"**
6. **Entrez votre domaine** : `silyprocure.com`
7. **Cliquez sur "Add"**

Render vous donnera :
- **Hostname** : `silyprocure.com`
- **Type** : `A` ou `CNAME` (selon votre configuration)
- **Value** : Une adresse IP ou un hostname Render

### Étape 2 : Configurer les enregistrements DNS

Allez dans le panneau de gestion DNS de votre registrar (ex: GoDaddy, Namecheap, OVH, etc.)

#### Option A : Utiliser un enregistrement CNAME (Recommandé)

Si Render vous donne un hostname CNAME :

1. **Créez un enregistrement CNAME** :
   - **Type** : `CNAME`
   - **Name/Host** : `@` ou `silyprocure.com` (selon votre registrar)
   - **Value/Target** : `<hostname-render>.onrender.com` (ex: `silyprocure.onrender.com`)
   - **TTL** : `3600` (ou valeur par défaut)

2. **Pour le sous-domaine www** (optionnel mais recommandé) :
   - **Type** : `CNAME`
   - **Name/Host** : `www`
   - **Value/Target** : `silyprocure.onrender.com`
   - **TTL** : `3600`

#### Option B : Utiliser un enregistrement A

Si Render vous donne une adresse IP :

1. **Créez un enregistrement A** :
   - **Type** : `A`
   - **Name/Host** : `@` ou `silyprocure.com`
   - **Value** : `<adresse-ip-render>`
   - **TTL** : `3600`

2. **Pour le sous-domaine www** :
   - **Type** : `CNAME`
   - **Name/Host** : `www`
   - **Value/Target** : `silyprocure.com`
   - **TTL** : `3600`

### Étape 3 : Attendre la propagation DNS

1. **La propagation DNS** prend généralement **15 minutes à 48 heures**
2. **Vérifiez la propagation** avec :
   - [whatsmydns.net](https://www.whatsmydns.net/#A/silyprocure.com)
   - [dnschecker.org](https://dnschecker.org/#A/silyprocure.com)

### Étape 4 : Vérifier sur Render

1. **Retournez sur Render** → Votre service → Settings → Custom Domains
2. **Le statut devrait passer** de "Pending" à "Active" une fois le DNS propagé
3. **Render configurera automatiquement SSL/HTTPS** (certificat Let's Encrypt gratuit)

## 🔧 Configuration Avancée

### Redirection www vers domaine principal

Si vous avez configuré `www.silyprocure.com`, vous pouvez rediriger vers `silyprocure.com` :

1. **Dans Render**, ajoutez aussi `www.silyprocure.com` comme domaine personnalisé
2. **Render redirigera automatiquement** `www` vers le domaine principal

### Configuration dans le code (optionnel)

Si vous voulez forcer HTTPS ou rediriger www, ajoutez dans `backend/server.js` :

```javascript
// Redirection HTTP vers HTTPS (si nécessaire)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Redirection www vers domaine principal (optionnel)
app.use((req, res, next) => {
    if (req.hostname === 'www.silyprocure.com') {
        return res.redirect(301, `https://silyprocure.com${req.url}`);
    }
    next();
});
```

## 📝 Fichiers SEO (Recommandé)

### Créer robots.txt

Créez `frontend/robots.txt` :

```
User-agent: *
Allow: /

Sitemap: https://silyprocure.com/sitemap.xml
```

### Créer sitemap.xml (optionnel)

Créez `frontend/sitemap.xml` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://silyprocure.com/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://silyprocure.com/suivi</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://silyprocure.com/index.html</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

## 🔍 Vérification

### 1. Vérifier l'accès

Une fois la propagation DNS terminée :

```bash
# Vérifier que le domaine répond
curl -I https://silyprocure.com

# Devrait retourner :
# HTTP/2 200
```

### 2. Vérifier le certificat SSL

- Ouvrez `https://silyprocure.com` dans votre navigateur
- Vérifiez que le cadenas 🔒 est présent
- Le certificat devrait être émis par "Let's Encrypt"

### 3. Tester les redirections

- `http://silyprocure.com` → devrait rediriger vers `https://silyprocure.com`
- `www.silyprocure.com` → devrait rediriger vers `silyprocure.com` (si configuré)

## 🐛 Dépannage

### Le domaine ne fonctionne pas

1. **Vérifiez les enregistrements DNS** :
   ```bash
   # Vérifier les enregistrements A
   dig silyprocure.com A
   
   # Vérifier les enregistrements CNAME
   dig silyprocure.com CNAME
   ```

2. **Vérifiez sur Render** :
   - Le domaine est-il "Active" ?
   - Y a-t-il des erreurs dans les logs ?

3. **Vérifiez la propagation DNS** :
   - Utilisez [whatsmydns.net](https://www.whatsmydns.net)
   - Attendez 24-48h si nécessaire

### Erreur SSL

- Render configure automatiquement SSL
- Si le certificat n'apparaît pas, attendez 5-10 minutes après l'activation du domaine
- Vérifiez que le DNS pointe bien vers Render

### Le site ne se charge pas

1. **Vérifiez que le service Render est actif**
2. **Vérifiez les logs** dans le dashboard Render
3. **Vérifiez que le port est correct** (10000 pour Render)

## 📊 Exemples de Configuration DNS

### GoDaddy

```
Type    Name            Value                           TTL
CNAME   @               silyprocure.onrender.com       1 Hour
CNAME   www             silyprocure.onrender.com       1 Hour
```

### Namecheap

```
Type    Host            Value                           TTL
CNAME   @               silyprocure.onrender.com        Automatic
CNAME   www             silyprocure.onrender.com        Automatic
```

### OVH

```
Type    Sous-domaine    Destination                     TTL
CNAME   @               silyprocure.onrender.com       3600
CNAME   www             silyprocure.onrender.com       3600
```

## ✅ Checklist

- [ ] Domaine ajouté sur Render
- [ ] Enregistrements DNS configurés
- [ ] Propagation DNS vérifiée
- [ ] Domaine "Active" sur Render
- [ ] SSL/HTTPS fonctionnel
- [ ] Site accessible via silyprocure.com
- [ ] Redirection www configurée (optionnel)
- [ ] robots.txt créé
- [ ] sitemap.xml créé (optionnel)

## 🎯 Prochaines Étapes

1. **Soumettre à Google Search Console** :
   - Allez sur [Google Search Console](https://search.google.com/search-console)
   - Ajoutez votre propriété `silyprocure.com`
   - Vérifiez la propriété (via DNS ou fichier HTML)

2. **Soumettre le sitemap** :
   - Dans Google Search Console → Sitemaps
   - Ajoutez `https://silyprocure.com/sitemap.xml`

3. **Optimiser le SEO** :
   - Ajoutez des meta tags dans `frontend/home.html`
   - Optimisez les titres et descriptions
   - Ajoutez des balises Open Graph

---

**Guide créé le** : 2025-01-01  
**Plateforme** : Render.com  
**Domaine** : silyprocure.com

