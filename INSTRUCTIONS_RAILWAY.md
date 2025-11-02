# Instructions Railway - URL de l'Application

## ❌ Erreur détectée

Vous avez mis l'URL de la base de données PostgreSQL dans `application_url`. C'est incorrect !

- ❌ **URL de la base de données** (ne pas utiliser) : `postgresql://postgres:...@postgres.railway.internal:5432/railway`
- ✅ **URL de l'application** (à utiliser) : `https://votre-app-production-XXXX.up.railway.app`

## 📍 Où trouver l'URL de votre application Railway

### Méthode 1 : Via Settings
1. Dans Railway, cliquez sur votre **service** (pas PostgreSQL)
2. Onglet **"Settings"**
3. Section **"Domains"** ou **"Generate Domain"**
4. Vous verrez une URL comme : `https://csv-dan-import-production-XXXX.up.railway.app`

### Méthode 2 : Via Deployments
1. Dans Railway, cliquez sur votre service
2. Onglet **"Deployments"**
3. Cliquez sur le dernier déploiement réussi
4. L'URL est affichée dans les détails

### Méthode 3 : Via le dashboard
L'URL peut aussi apparaître directement dans le dashboard principal du service.

## ✅ Une fois que vous avez l'URL

Envoyez-moi cette URL et je mettrai à jour le fichier `shopify.app.toml` correctement.

L'URL doit :
- Commencer par `https://`
- Se terminer par `.up.railway.app` ou `.railway.app`
- Être l'URL publique de votre application, pas la base de données

