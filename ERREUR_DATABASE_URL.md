# Erreur : DATBASE_URL au lieu de DATABASE_URL

## ❌ Erreur trouvée

Vous avez écrit : `DATBASE_URL`  
Il faut écrire : `DATABASE_URL` (avec un "A")

## ✅ Correction sur Render

1. Allez dans votre Web Service sur Render
2. Onglet **"Environment"**
3. Cherchez la variable `DATBASE_URL` (avec la faute)
4. **Supprimez-la**
5. Ajoutez une nouvelle variable avec le bon nom :
   - **Name** : `DATABASE_URL` (avec le "A" !)
   - **Value** : `postgresql://csv_dan_user:r6rwVtR0iQ1FtaUD3vjGPe9l0Us7KXSX@dpg-d449nsidbo4c73bk9310-a.oregon-postgres.render.com:5432/csv_dan`

## 📝 Liste corrigée des variables

Voici toutes vos variables avec le bon nom :

```
DATABASE_URL=postgresql://user:password@host:5432/database
EMAIL_FROM=CSV Dan Import <votre-email@gmail.com>
GMAIL_APP_PASSWORD=votre_app_password
GMAIL_USER=votre-email@gmail.com
NODE_ENV=production
SCOPES=read_products,read_inventory,write_inventory,read_locations,read_markets_home
SHOPIFY_API_KEY=votre_api_key
SHOPIFY_API_SECRET=votre_secret
SHOPIFY_APP_URL=https://csv-dan-import.onrender.com
```

Note : J'ai aussi retiré les guillemets autour de `EMAIL_FROM` car les variables d'environnement n'en ont généralement pas besoin.

## 🔄 Après correction

1. Supprimez `DATBASE_URL` (avec la faute)
2. Ajoutez `DATABASE_URL` (sans faute)
3. Redéployez votre service sur Render
4. Les migrations devraient maintenant fonctionner !

