# Fix : Erreur Table Session n'existe pas sur Render

## ❌ Erreur

```
The table `main.Session` does not exist in the current database.
Error: Prisma session table does not exist
```

## ✅ Solutions

### 1. Modifier le Start Command sur Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur votre service `csv-dan-import`
3. Allez dans **"Settings"**
4. Section **"Build & Deploy"**
5. **Start Command** : Changez pour :
   ```
   npm run setup && npm run start
   ```
   
   Au lieu de simplement `npm run start`

Cela exécutera :
- `prisma generate` (génère le client Prisma)
- `prisma migrate deploy` (crée les tables dans PostgreSQL)
- Puis démarre l'application

### 2. Vérifier que PostgreSQL est connecté

1. Dans votre service Render, onglet **"Environment"**
2. Vérifiez que `DATABASE_URL` existe
3. Elle devrait avoir été ajoutée automatiquement quand vous avez connecté PostgreSQL
4. Si elle n'existe pas, ajoutez-la manuellement depuis les informations de votre base PostgreSQL

### 3. Schema Prisma mis à jour

Le fichier `prisma/schema.prisma` a été mis à jour pour utiliser PostgreSQL au lieu de SQLite.

Si Render redéploie automatiquement, les migrations seront exécutées.

Sinon :
1. Allez dans votre service Render
2. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**
3. Les migrations seront exécutées automatiquement

## 📋 Checklist

- [ ] Start Command = `npm run setup && npm run start`
- [ ] Variable `DATABASE_URL` présente dans Environment
- [ ] `prisma/schema.prisma` utilise PostgreSQL (fait automatiquement)
- [ ] Redéployer sur Render pour appliquer les changements

## 🔄 Redéployer

Une fois les changements faits :
1. **Manuel** : "Manual Deploy" → "Deploy latest commit"
2. **Automatique** : Attendre le prochain push sur GitHub

Les migrations seront exécutées et la table Session sera créée !

