# Résoudre l'erreur Cloudflare Tunnel

## ❌ Problème
`acdbentity-journals-meaning-sponsor.trycloudflare.com n'autorise pas la connexion`

## ✅ Solutions

### Solution 1 : Redémarrer `shopify app dev`

Le tunnel Cloudflare a probablement expiré ou changé. Redémarrez l'application :

1. **Arrêtez** le processus actuel (`Ctrl+C` dans le terminal où tourne `shopify app dev`)

2. **Redémarrez** :
```bash
cd /Users/support/csv-dan-import
shopify app dev
```

3. Shopify CLI va générer une **nouvelle URL Cloudflare Tunnel**

4. **Copiez la nouvelle URL** qui apparaîtra dans le terminal (format : `https://xxxxx.trycloudflare.com`)

5. **Mettez à jour** `shopify.app.toml` avec la nouvelle URL :
```toml
application_url = "https://nouvelle-url.trycloudflare.com"
```

### Solution 2 : Utiliser ngrok (Alternative)

Si Cloudflare continue à poser problème, utilisez ngrok :

1. **Démarrer l'app localement** (dans un terminal) :
```bash
npm run dev
```

2. **Lancer ngrok** (dans un autre terminal) :
```bash
ngrok http 3000
```

3. **Copier l'URL ngrok** (ex: `https://abc123.ngrok-free.app`)

4. **Mettre à jour** `shopify.app.toml` :
```toml
application_url = "https://abc123.ngrok-free.app"
```

### Solution 3 : Utiliser localhost (Pour développement uniquement)

Si vous testez seulement en local :

1. Dans `shopify.app.toml`, vous pouvez temporairement utiliser :
```toml
application_url = "https://example.com"
```

2. Utilisez l'option de développement localhost :
```bash
shopify app dev --reset
```

## 🔍 Vérifier l'État Actuel

Votre `shopify.app.toml` contient actuellement :
```toml
application_url = "https://arline-superheroic-dooly.ngrok-free.dev"
```

Cette URL ngrok a probablement expiré aussi.

## ⚡ Action Immédiate

1. **Redémarrez** `shopify app dev` pour obtenir une nouvelle URL
2. **Ou** utilisez ngrok comme alternative
3. **Mettez à jour** `shopify.app.toml` avec la nouvelle URL

Les tunnels Cloudflare et ngrok sont temporaires et changent à chaque redémarrage !



