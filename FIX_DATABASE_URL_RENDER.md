# Fix : DATABASE_URL non trouvée sur Render

## ❌ Erreur

```
Error: Environment variable not found: DATABASE_URL
```

## ✅ Solution : Configurer DATABASE_URL sur Render

### Étape 1 : Vérifier que PostgreSQL est créé

1. Allez sur [render.com](https://render.com)
2. Dans votre dashboard, vérifiez que vous avez un service **PostgreSQL**
3. Si ce n'est pas le cas :
   - Cliquez sur **"+ New"** → **"PostgreSQL"**
   - Créez une base de données

### Étape 2 : Connecter PostgreSQL au Web Service

1. Allez dans votre **Web Service** `csv-dan-import`
2. Onglet **"Environment"**
3. Cliquez sur **"Add Environment Variable"**
4. Dans le menu déroulant, cherchez **"DATABASE_URL"**
5. **IMPORTANT** : Render devrait proposer automatiquement votre base PostgreSQL
6. Sélectionnez-la dans la liste déroulante
7. Render ajoutera automatiquement la variable avec la bonne valeur

### Étape 3 : Vérifier que DATABASE_URL est présente

Dans l'onglet **"Environment"**, vous devriez voir :
```
DATABASE_URL = postgresql://user:password@host:port/database
```

Si vous ne voyez pas cette variable, ajoutez-la manuellement :
1. Cliquez sur **"Add Environment Variable"**
2. **Name** : `DATABASE_URL`
3. **Value** : Copiez depuis votre service PostgreSQL :
   - Allez dans votre service PostgreSQL
   - Onglet **"Info"** ou **"Connections"**
   - Copiez la **"Internal Database URL"** ou **"Connection String"**

### Étape 4 : Vérifier le Start Command

Dans **Settings** → **"Build & Deploy"**, assurez-vous que :

**Start Command** = `npm run setup && npm run start`

### Étape 5 : Redéployer

1. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**
2. Regardez les logs pour voir si `DATABASE_URL` est maintenant trouvée
3. Les migrations devraient s'exécuter automatiquement

## 🔍 Si DATABASE_URL n'apparaît pas dans la liste

Cela signifie que Render n'a pas détecté votre PostgreSQL. Dans ce cas :

1. **Obtenez manuellement la DATABASE_URL** :
   - Allez dans votre service PostgreSQL
   - Onglet **"Info"** ou **"Connections"**
   - Cherchez **"Internal Database URL"**
   - Format : `postgresql://user:password@host:port/database`

2. **Ajoutez-la manuellement** :
   - Web Service → Environment
   - Add Environment Variable
   - Name : `DATABASE_URL`
   - Value : Collez la connection string complète

## ⚠️ Important

- Utilisez **"Internal Database URL"** (pas External) si vous êtes dans la même région
- La DATABASE_URL doit être visible dans les variables d'environnement du Web Service
- Sans DATABASE_URL, Prisma ne peut pas se connecter à la base de données

