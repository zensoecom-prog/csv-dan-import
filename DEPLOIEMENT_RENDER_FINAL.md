# Déploiement Render - Configuration FINALE

## ⚠️ Configuration Critique pour que ça fonctionne

### 1. Build Command sur Render

Dans **Settings** → **"Build & Deploy"** :

**Build Command** :
```
npm install && npm run build
```

### 2. Start Command sur Render (CRITIQUE !)

**Start Command** :
```
npm run setup && npm run start
```

**OU** (si ça ne fonctionne toujours pas) :

**Build Command** :
```
npm install && npm run build && npx prisma generate
```

**Start Command** :
```
npx prisma migrate deploy && npm run start
```

### 3. Variables d'Environnement

Dans **Environment**, assurez-vous d'avoir :

```env
NODE_ENV=production
SHOPIFY_API_KEY=f5b71ce5fe1d1ff776938d5e7206523f
SHOPIFY_API_SECRET=votre_secret
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
SHOPIFY_APP_URL=https://csv-dan-import.onrender.com
DATABASE_URL=postgresql://csv_dan_user:r6rwVtR0iQ1FtaUD3vjGPe9l0Us7KXSX@dpg-d449nsidbo4c73bk9310-a.oregon-postgres.render.com:5432/csv_dan
```

## 🔍 Vérification des Logs

Après redéploiement, dans les **Logs** de Render, cherchez :

✅ **Si vous voyez ça, c'est bon** :
```
✔ Generated Prisma Client
✔ Applied migration 20240530213853_create_session_table
```

❌ **Si vous voyez ça, il y a un problème** :
```
Error: Environment variable not found: DATABASE_URL
Error: Prisma session table does not exist
```

## 🔄 Solution Alternative : Build Command avec migrations

Si le Start Command ne fonctionne pas, essayez :

**Build Command** :
```
npm install && npm run build && npm run setup
```

**Start Command** :
```
npm run start
```

Cela exécutera les migrations pendant le build au lieu du démarrage.

## ✅ Checklist Finale

- [ ] Build Command = `npm install && npm run build`
- [ ] Start Command = `npm run setup && npm run start` (OU l'alternative ci-dessus)
- [ ] DATABASE_URL complète et correcte dans Environment
- [ ] SHOPIFY_APP_URL dans Environment
- [ ] Toutes les autres variables d'environnement
- [ ] Redéploiement effectué
- [ ] Logs vérifiés pour confirmer l'exécution des migrations

