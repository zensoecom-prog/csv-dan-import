# Résoudre : Table Session n'existe toujours pas

## ❌ Problème persistant

Les migrations Prisma ne s'exécutent pas correctement. Voici comment forcer l'exécution.

## ✅ Solution 1 : Vérifier le Start Command (CRITIQUE)

1. Sur Render, allez dans votre **Web Service**
2. **Settings** → **"Build & Deploy"**
3. **Start Command** doit être EXACTEMENT :
   ```
   npm run setup && npm run start
   ```
   
   **VÉRIFIEZ** qu'il n'y a pas d'espace supplémentaire ou de caractères étranges.

## ✅ Solution 2 : Exécuter les migrations manuellement

Si le Start Command est correct mais ça ne fonctionne toujours pas :

### Via les logs Render

1. Allez dans votre service Render
2. Onglet **"Logs"**
3. Cherchez les lignes avec `prisma migrate deploy`
4. Si vous voyez des erreurs, notez-les

### Alternative : Créer un script de migration

Nous pouvons créer un script qui s'exécute au démarrage pour forcer les migrations.

## ✅ Solution 3 : Vérifier que DATABASE_URL est accessible

Les migrations ne peuvent pas s'exécuter si `DATABASE_URL` n'est pas accessible.

1. Dans Render → Web Service → Environment
2. Vérifiez que `DATABASE_URL` existe et est correcte
3. Format : `postgresql://user:password@host:5432/database`

## ✅ Solution 4 : Redéployer avec vérification

1. Sur Render → Web Service
2. **Manual Deploy** → **"Clear build cache & deploy"**
3. Regardez les logs pendant le déploiement
4. Cherchez les lignes :
   - `Running prisma generate`
   - `Running prisma migrate deploy`
   - Si vous ne voyez pas ces lignes, les migrations ne s'exécutent pas

## ✅ Solution 5 : Exécuter les migrations dans le build

Modifions le Build Command pour inclure les migrations :

**Build Command** :
```
npm install && npm run build && npm run setup
```

**Start Command** :
```
npm run start
```

Cela exécutera les migrations pendant le build, pas au démarrage.

## 🔍 Comment vérifier que ça fonctionne

Après redéploiement, dans les logs Render, vous devriez voir :
```
✔ Prisma schema loaded
✔ Running migrations...
✔ Applied migration 20240530213853_create_session_table
✔ Generated Prisma Client
```

## ⚠️ Si rien ne fonctionne

Essayez de vous connecter directement à PostgreSQL et exécuter la migration manuellement, ou utilisez un service de gestion de base de données.

