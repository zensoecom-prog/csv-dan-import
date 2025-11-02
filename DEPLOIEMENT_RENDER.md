# Déploiement sur Render.com - Plus Simple que Railway

## 🎯 Pourquoi Render ?

- ✅ Plus simple que Railway
- ✅ Interface plus claire
- ✅ Déploiement direct depuis GitHub
- ✅ Gratuit pour commencer

## 📝 Étapes de Déploiement

### 1. Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started for Free"**
3. Connectez-vous avec GitHub

### 2. Créer un Web Service

1. Dans le dashboard Render, cliquez sur **"+ New"**
2. Sélectionnez **"Web Service"**
3. Cliquez sur **"Connect account"** si ce n'est pas fait
4. Sélectionnez votre repository : `zensoecom-prog/csv-dan-import`

### 3. Configurer le Service

Render détecte automatiquement Node.js, mais configurez :

- **Name** : `csv-dan-import` (ou ce que vous voulez)
- **Region** : Choisissez le plus proche (Europe, US, etc.)
- **Branch** : `main`
- **Root Directory** : (laissez vide, c'est la racine)
- **Runtime** : `Node`
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm run setup && npm run start`

### 4. Ajouter PostgreSQL

1. Dans Render, cliquez sur **"+ New"**
2. Sélectionnez **"PostgreSQL"**
3. Nom : `csv-dan-import-db`
4. Région : Même que votre service web
5. Plan : **Free** (limité mais suffisant pour commencer)
6. Cliquez sur **"Create Database"**

### 5. Connecter PostgreSQL au Service Web

1. Allez dans votre **Web Service**
2. Onglet **"Environment"**
3. Cliquez sur **"Add Environment Variable"**
4. Cherchez dans la liste **"DATABASE_URL"** (Render le propose automatiquement)
5. Sélectionnez votre base PostgreSQL
6. Render ajoute automatiquement `DATABASE_URL`

### 6. Ajouter les Autres Variables

Dans l'onglet **"Environment"** de votre Web Service, ajoutez :

```
NODE_ENV=production
SHOPIFY_API_KEY=f5b71ce5fe1d1ff776938d5e7206523f
SHOPIFY_API_SECRET=<votre_secret_shopify>
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
```

### 7. Récupérer l'URL

1. Une fois le service créé, Render génère automatiquement une URL
2. Format : `https://csv-dan-import.onrender.com`
3. **Copiez cette URL**

### 8. Ajouter SHOPIFY_APP_URL

Dans les variables d'environnement, ajoutez :

```
SHOPIFY_APP_URL=https://csv-dan-import.onrender.com
```

### 9. Déployer

1. Cliquez sur **"Create Web Service"**
2. Render va :
   - Cloner votre repo GitHub
   - Installer les dépendances
   - Builder l'application
   - Démarrer le serveur
3. Attendez 2-5 minutes pour le premier déploiement

### 10. Mettre à jour shopify.app.toml

Une fois l'URL obtenue :

```toml
application_url = "https://csv-dan-import.onrender.com"
```

## ⚠️ Note sur le Plan Gratuit

- L'app se met en veille après 15 minutes d'inactivité
- Le premier appel après veille prend 30-60 secondes
- Pour la production, envisagez le plan payant ($7/mois)

## ✅ Avantages de Render vs Railway

- ✅ Interface plus intuitive
- ✅ Pas de confusion avec "Database" vs "Service"
- ✅ Déploiement direct depuis GitHub
- ✅ Configuration plus simple

