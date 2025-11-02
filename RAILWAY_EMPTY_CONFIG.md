# Railway - Configuration Manuelle avec "Empty Configuration"

## ✅ Solution : Utiliser "Empty Configuration"

Quand Railway propose seulement "Database", choisissez **"Empty configuration"** et configurez manuellement.

## 📝 Étapes Détaillées

### 1. Sélectionner "Empty Configuration"

Quand Railway affiche :
- 🏖️ Empty configuration
- 🏖️ Database

**Choisissez "Empty Configuration"** ✅

### 2. Configurer le Service

Une fois le service créé :

#### A. Lier le Repository GitHub

1. Cliquez sur votre service "Empty Service"
2. Allez dans **"Settings"**
3. Section **"Source"** ou **"Connect GitHub"**
4. Sélectionnez votre repository `csv-dan-import`

#### B. Configurer les Commandes de Build

1. Toujours dans **"Settings"**
2. Section **"Build & Deploy"** ou **"Deploy"**
3. Configurez :
   - **Build Command :** `npm install && npm run build`
   - **Start Command :** `npm run setup && npm run start`

#### C. Configurer l'Environnement Node.js

1. Dans **"Settings"**
2. Section **"Environment"** ou **"Runtime"**
3. Assurez-vous que **Node.js** est sélectionné (Railway devrait le détecter automatiquement depuis package.json)

### 3. Connecter PostgreSQL

1. Dans votre service d'application, onglet **"Variables"**
2. Cliquez sur **"Add Reference"** ou **"Connect Database"**
3. Sélectionnez votre service PostgreSQL
4. Cela ajoute automatiquement `DATABASE_URL`

### 4. Ajouter les Variables d'Environnement

Dans l'onglet **"Variables"**, ajoutez :

```env
NODE_ENV=production
SHOPIFY_API_KEY=f5b71ce5fe1d1ff776938d5e7206523f
SHOPIFY_API_SECRET=<votre_secret_shopify>
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
```

### 5. Générer un Domaine

1. **Settings** → **"Domains"** ou **"Network"**
2. Cliquez sur **"Generate Domain"**
3. Copiez l'URL générée (ex: `https://csv-dan-import-production-XXXX.up.railway.app`)

### 6. Ajouter SHOPIFY_APP_URL

Dans les variables, ajoutez :
```env
SHOPIFY_APP_URL=https://votre-url-railway.up.railway.app
```

### 7. Déclencher le Déploiement

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur **"Redeploy"** ou **"Deploy"**
3. Railway va maintenant :
   - Cloner votre repo GitHub
   - Installer les dépendances (`npm install`)
   - Builder l'application (`npm run build`)
   - Démarrer le serveur (`npm run setup && npm run start`)

## 🔍 Vérification

Une fois déployé, vous devriez voir :
- ✅ Status : "Deployed" ou "Active"
- ✅ Des logs de build et de démarrage
- ✅ Une URL publique dans "Domains"

## ❓ Si ça ne fonctionne pas

Vérifiez les logs :
1. Onglet **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Regardez les logs pour voir les erreurs

Les erreurs communes :
- Problème de build → vérifiez `package.json` et les commandes de build
- Erreur de connexion DB → vérifiez que `DATABASE_URL` est bien configurée
- Port incorrect → Railway utilise automatiquement le PORT de l'environnement

