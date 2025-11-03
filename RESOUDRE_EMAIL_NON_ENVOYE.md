# Résoudre : Email non envoyé

## Problème
L'application indique "Email queued for sending" mais l'email n'arrive pas.

## Cause principale : Gmail bloque les connexions depuis Render

Gmail a des restrictions de sécurité qui bloquent souvent les connexions SMTP depuis des serveurs cloud comme Render, surtout pour les nouvelles connexions.

## ✅ Solution 1 : Utiliser SendGrid (RECOMMANDÉ)

SendGrid est spécialement conçu pour les applications cloud et ne bloque pas les connexions.

### Étapes :

1. **Créer un compte SendGrid** (gratuit jusqu'à 100 emails/jour)
   - Allez sur https://sendgrid.com
   - Créez un compte gratuit
   
2. **Générer une API Key**
   - Dans SendGrid → Settings → API Keys
   - Créez une nouvelle clé avec permissions "Mail Send"
   - **COPIEZ la clé** (elle ne sera affichée qu'une seule fois)

3. **Configurer sur Render**
   - Render → Web Service → Environment
   - Ajoutez :
     ```
     SENDGRID_API_KEY=votre_api_key_sendgrid
     ```
   - **Supprimez ou commentez** :
     - `GMAIL_USER`
     - `GMAIL_APP_PASSWORD`

4. **Redéployer**
   - Les changements seront appliqués automatiquement
   - Le code détectera `SENDGRID_API_KEY` et utilisera SendGrid au lieu de Gmail

## ✅ Solution 2 : Vérifier les logs Render

Les logs Render vont maintenant afficher exactement pourquoi l'email échoue :

1. Allez dans Render → Web Service → Logs
2. Cherchez les lignes avec :
   - `❌ ERREUR EMAIL`
   - `💡 SUGGESTION`
3. Cela vous dira exactement quel est le problème

## ✅ Solution 3 : Vérifier la configuration Gmail

Si vous voulez quand même utiliser Gmail :

1. **Vérifier l'App Password**
   - Gmail → Compte → Sécurité
   - Vérifiez que l'App Password est correcte (pas le mot de passe du compte)
   
2. **Autoriser les applications moins sécurisées** (déconseillé)
   - Gmail peut bloquer les connexions même avec App Password depuis certains serveurs

## 📋 Checklist de diagnostic

- [ ] Vérifier les logs Render pour voir l'erreur exacte
- [ ] Vérifier que `GMAIL_USER` et `GMAIL_APP_PASSWORD` sont corrects dans Render
- [ ] Ou migrer vers SendGrid (plus fiable)

## 🔍 Logs à chercher

Dans les logs Render, vous devriez voir :
- `📧 Initiation envoi email en arrière-plan...`
- `📧 Destinataire: ...`
- Soit `✅ Email envoyé avec succès`
- Soit `❌ ERREUR EMAIL` avec les détails

