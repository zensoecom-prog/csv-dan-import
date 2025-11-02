# Utiliser ngrok pour le Développement Local

## 🔍 ngrok pour Tester Localement

ngrok est parfait pour tester votre app Shopify en local, mais **pas pour la production**.

## 📝 Configuration ngrok

### 1. Installer ngrok

```bash
# Via Homebrew (macOS)
brew install ngrok

# Ou télécharger depuis https://ngrok.com
```

### 2. Démarrer votre App en Local

```bash
cd /Users/support/csv-dan-import
npm run dev
```

Votre app démarre sur `http://localhost:3000`

### 3. Créer un Tunnel ngrok

Dans un nouveau terminal :

```bash
ngrok http 3000
```

ngrok vous donne une URL temporaire comme :
```
https://abc123.ngrok-free.app
```

### 4. Utiliser l'URL ngrok pour Shopify

Dans `shopify.app.toml`, utilisez temporairement :
```toml
application_url = "https://abc123.ngrok-free.app"
```

⚠️ **ATTENTION** : Cette URL change à chaque fois que vous redémarrez ngrok !

### 5. Limites de ngrok

- ❌ URL change à chaque redémarrage
- ❌ Tunnel temporaire (se ferme si vous fermez ngrok)
- ❌ Pas adapté pour la production
- ✅ Parfait pour tester en développement

## 🎯 Recommandation

1. **Développement** : Utilisez ngrok pour tester
2. **Production** : Utilisez Render.com ou Railway (une fois le problème résolu)

Render.com est plus simple que Railway si vous continuez à avoir des problèmes.

