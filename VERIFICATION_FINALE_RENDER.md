# Vérification Finale - Configuration Render

## ✅ Vérifications Critiques sur Render

### 1. Start Command (LE PLUS IMPORTANT !)

Dans votre Web Service sur Render :
- **Settings** → **"Build & Deploy"**
- **Start Command** doit être EXACTEMENT :
  ```
  npm run setup && npm run start
  ```

Le script `setup` va maintenant :
- Générer le client Prisma
- Appliquer les migrations (avec gestion de l'erreur P3009)
- Vérifier que tout est prêt

### 2. Variables d'Environnement

Dans **Environment**, vérifiez que vous avez TOUTES ces variables :

```
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production
SHOPIFY_API_KEY=votre_api_key
SHOPIFY_API_SECRET=votre_secret
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
SHOPIFY_APP_URL=https://csv-dan-import.onrender.com
EMAIL_FROM=CSV Dan Import <votre-email@gmail.com>
GMAIL_APP_PASSWORD=votre_app_password
GMAIL_USER=votre-email@gmail.com
```

**IMPORTANT** : 
- ✅ `DATABASE_URL` (pas `DATBASE_URL` - avec le "A" !)
- ✅ Toutes les variables présentes et sans espaces supplémentaires

### 3. Build Command

**Build Command** doit être :
```
npm install && npm run build
```

## 🔍 Vérifier les Logs Render

Après redéploiement, dans les **Logs** de Render, cherchez :

✅ **Si vous voyez ça, c'est BON** :
```
🔄 Vérification et application des migrations Prisma...
📦 Génération du client Prisma...
🚀 Application des migrations...
✅ Applied migration 20240530213853_create_session_table
✅ Migrations appliquées avec succès
```

❌ **Si vous voyez ça, il y a un problème** :
```
Error: Environment variable not found: DATABASE_URL
Error: Prisma session table does not exist
```

## 🔄 Solution de Secours : Nettoyer la Base

Si rien ne fonctionne, nettoyez complètement la base PostgreSQL :

1. Connectez-vous à PostgreSQL (via client ou Render Shell)
2. Exécutez :
```sql
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
```
3. Redéployez sur Render
4. Les migrations s'exécuteront proprement

## 📋 Checklist Finale

- [ ] Start Command = `npm run setup && npm run start`
- [ ] Build Command = `npm install && npm run build`
- [ ] DATABASE_URL correctement configurée (pas DATBASE_URL !)
- [ ] Toutes les variables d'environnement présentes
- [ ] Redéploiement effectué après modifications
- [ ] Logs vérifiés pour confirmation

## ⚠️ Si ça ne fonctionne toujours pas

Le script `ensure-migrations.js` devrait gérer automatiquement :
- La génération du client Prisma
- L'application des migrations
- La résolution de l'erreur P3009 si elle apparaît

Si le problème persiste, les logs Render nous diront exactement où ça bloque.

