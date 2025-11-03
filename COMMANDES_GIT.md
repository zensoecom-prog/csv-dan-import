# Commandes Git - Guide Rapide

## 🔄 Commandes pour Mettre à Jour le Code sur GitHub

### 1. Vérifier l'état des fichiers modifiés
```bash
git status
```

### 2. Ajouter tous les fichiers modifiés
```bash
git add .
```

### 3. Créer un commit avec un message
```bash
git commit -m "Description de vos changements"
```

### 4. Envoyer les changements sur GitHub
```bash
git push origin main
```

## 📝 Workflow Complet (Résumé)

Quand vous modifiez du code et voulez le mettre à jour sur GitHub :

```bash
cd /Users/support/csv-dan-import
git add .
git commit -m "Description de vos modifications"
git push origin main
```

## 📋 Exemples de Messages de Commit

- `git commit -m "Ajout de la fonctionnalité email avec CC"`
- `git commit -m "Correction du bug dans l'upload"`
- `git commit -m "Mise à jour de la configuration"`
- `git commit -m "Ajout des guides de déploiement"`

## 🔍 Autres Commandes Utiles

### Voir l'historique des commits
```bash
git log --oneline
```

### Voir les différences avant de commit
```bash
git diff
```

### Annuler des changements non commités
```bash
git restore <nom-du-fichier>
```

### Récupérer les dernières modifications depuis GitHub
```bash
git pull origin main
```

