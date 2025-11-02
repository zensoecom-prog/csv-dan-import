# Guide de Déploiement Gratuit - CSV Dan Import

Ce guide vous montre comment héberger votre application Shopify **gratuitement** sur différentes plateformes.

## 🏆 Meilleures Options Gratuites

### 1. Railway.app ⭐ (Recommandé)

**Avantages :**
- ✅ $5 de crédit gratuit par mois (suffisant pour commencer)
- ✅ PostgreSQL gratuit inclus
- ✅ Déploiement automatique depuis GitHub
- ✅ Très simple à configurer
- ✅ URL HTTPS automatique

**Inconvénients :**
- Limite après épuisement des crédits ($5/mois)

**Lien :** [railway.app](https://railway.app)

---

### 2. Render.com

**Avantages :**
- ✅ Plan gratuit avec limitations
- ✅ PostgreSQL gratuit (limité)
- ✅ SSL automatique
- ✅ Déploiement depuis GitHub

**Inconvénients :**
- ❌ L'app se met en veille après 15 minutes d'inactivité (peut prendre 30-60s à redémarrer)
- ❌ PostgreSQL gratuit limité à 90 jours (ensuite payant)

**Lien :** [render.com](https://render.com)

---

### 3. Fly.io

**Avantages :**
- ✅ Plan gratuit généreux
- ✅ Bon pour les apps avec beaucoup de trafic
- ✅ Déploiement global

**Inconvénients :**
- ⚠️ Configuration plus complexe
- ⚠️ PostgreSQL séparé (gratuit sur Supabase par exemple)

**Lien :** [fly.io](https://fly.io)

---

### 4. Cyclic.sh

**Avantages :**
- ✅ Entièrement gratuit pour commencer
- ✅ Déploiement automatique depuis GitHub
- ✅ PostgreSQL gratuit inclus

**Inconvénients :**
- ⚠️ Moins connu, moins de documentation

**Lien :** [cyclic.sh](https://cyclic.sh)

---

## 🚀 Guide Pas-à-Pas : Railway (Recommandé)

### Étape 1 : Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "Start a New Project"
3. Connectez-vous avec GitHub

### Étape 2 : Créer un nouveau projet

1. Cliquez sur "+ New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez votre repository `csv-dan-import`
   - Si vous n'avez pas de repo, créez-en un sur GitHub d'abord

### Étape 3 : Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur "+ New"
2. Sélectionnez "Database" → "PostgreSQL"
3. Railway créera automatiquement une base de données
4. Copiez la `DATABASE_URL` (elle apparaît dans les variables d'environnement)

### Étape 4 : Configurer les Variables d'Environnement

Dans votre service Railway, allez dans l'onglet "Variables" et ajoutez :

```env
NODE_ENV=production
SHOPIFY_API_KEY=f5b71ce5fe1d1ff776938d5e7206523f
SHOPIFY_API_SECRET=<votre_secret_key>
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
DATABASE_URL=<copiez depuis la base PostgreSQL Railway>
SHOPIFY_APP_URL=<sera mis à jour après déploiement>

# Configuration email (optionnel)
GMAIL_USER=<votre-email@gmail.com>
GMAIL_APP_PASSWORD=<votre-app-password>
EMAIL_FROM=CSV Dan Import <votre-email@gmail.com>
```

### Étape 5 : Configurer les Commandes de Build

Dans les "Settings" de votre service Railway :

- **Build Command :** `npm install && npm run build`
- **Start Command :** `npm run setup && npm run start`

### Étape 6 : Récupérer l'URL de Production

1. Une fois déployé, Railway génère une URL : `https://csv-dan-import-production-XXXX.up.railway.app`
2. **Copiez cette URL**

### Étape 7 : Mettre à jour shopify.app.toml

Remplacez la ligne dans `shopify.app.toml` :

```toml
application_url = "https://csv-dan-import-production-XXXX.up.railway.app"
```

### Étape 8 : Mettre à jour SHOPIFY_APP_URL dans Railway

Dans les variables d'environnement Railway, mettez à jour :
```env
SHOPIFY_APP_URL=https://csv-dan-import-production-XXXX.up.railway.app
```

### Étape 9 : Redéployer et Configurer Shopify

```bash
# Redéployer la config Shopify
shopify app deploy --force
```

---

## 🔄 Alternative : Render.com

### Étapes Rapides Render :

1. Créer un compte sur [render.com](https://render.com)
2. "New" → "Web Service"
3. Connecter votre repository GitHub
4. Configurer :
   - **Build Command :** `npm install && npm run build`
   - **Start Command :** `npm run setup && npm run start`
   - **Environment :** Node
5. Ajouter PostgreSQL : "New +" → "PostgreSQL"
6. Ajouter les variables d'environnement (mêmes que Railway)
7. URL générée : `https://csv-dan-import.onrender.com`
8. Mettre à jour `shopify.app.toml` avec cette URL

**Note :** Sur le plan gratuit, Render met l'app en veille après 15 minutes d'inactivité. Le premier appel peut prendre 30-60 secondes à démarrer.

---

## 📝 Mise à jour de Prisma pour Production

Si vous utilisez PostgreSQL (recommandé), modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Ensuite, Railway exécutera automatiquement `npm run setup` qui fait :
- `prisma generate` (génère le client)
- `prisma migrate deploy` (applique les migrations)

---

## ✅ Checklist de Déploiement

- [ ] Application déployée sur Railway/Render
- [ ] PostgreSQL configuré et connecté
- [ ] Variables d'environnement configurées
- [ ] `application_url` mise à jour dans `shopify.app.toml`
- [ ] `SHOPIFY_APP_URL` configuré dans les variables d'environnement
- [ ] `shopify app deploy --force` exécuté
- [ ] Test de l'application dans une boutique Shopify de test

---

## 💡 Conseils

1. **Utilisez Railway** pour commencer (plus simple et plus stable)
2. **Gardez votre code sur GitHub** pour faciliter le déploiement
3. **Testez d'abord** sur une boutique Shopify de développement
4. **Surveillez les logs** Railway/Render pour détecter les erreurs

---

## 🔗 Liens Utiles

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Shopify App Deployment Guide](https://shopify.dev/docs/apps/deployment/web)

