# 🚀 Déploiement sur Render.com

## Étape 1 : Pousser le code sur GitHub

```powershell
git add .
git commit -m "Préparation pour déploiement Render"
git push origin main
```

## Étape 2 : Créer un compte Render

1. Allez sur https://render.com
2. Cliquez sur **"Get Started"**
3. Connectez-vous avec votre compte **GitHub**

## Étape 3 : Créer un nouveau service

1. Dans le dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Background Worker"** (pas Web Service, car c'est un bot)
3. Connectez votre repository GitHub **"BOT-DISCORD"**
4. Cliquez sur **"Connect"**

## Étape 4 : Configuration du service

Remplissez les informations :

- **Name** : `trading-bot-discord` (ou ce que vous voulez)
- **Environment** : `Node`
- **Region** : `Frankfurt (Europe Central)` (le plus proche)
- **Branch** : `main`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

## Étape 5 : Ajouter les variables d'environnement

Cliquez sur **"Advanced"** puis **"Add Environment Variable"**

Ajoutez ces 6 variables (valeurs depuis votre fichier `.env`) :

| Key | Value |
|-----|-------|
| `DISCORD_TOKEN` | Votre token Discord |
| `CLIENT_ID` | Votre client ID |
| `FINNHUB_API_KEY` | Votre clé Finnhub |
| `GEMINI_API_KEY` | Votre clé Gemini |
| `ALERT_CHANNEL_ID` | ID du canal alertes |
| `LOG_CHANNEL_ID` | ID du canal logs |
| `ADMIN_USER_ID` | Votre ID utilisateur |

## Étape 6 : Déployer

1. Cliquez sur **"Create Background Worker"**
2. Render va automatiquement :
   - Cloner votre repo
   - Installer les dépendances (`npm install`)
   - Lancer le bot (`npm start`)

## ✅ Vérification

Une fois déployé, vous verrez :
- ✅ Status : **"Live"** en vert
- 📊 Logs en temps réel dans l'onglet **"Logs"**
- 🤖 Votre bot Discord sera **en ligne 24/7** !

## 🔄 Mises à jour automatiques

Chaque fois que vous faites un `git push` sur GitHub, Render redéploiera automatiquement ! 🚀

## ⚠️ Important

- Le plan gratuit a **750h/mois** (largement suffisant pour 1 bot)
- Render peut mettre en veille après 15 min d'inactivité, mais le bot Discord garde la connexion active donc pas de problème
- Si le bot plante, Render le redémarre automatiquement

## 🆘 En cas de problème

Consultez les logs dans Render pour voir les erreurs. Vous pouvez aussi vérifier :
- Que toutes les variables d'environnement sont bien configurées
- Que le bot est bien invité sur votre serveur Discord
- Que les Intents Discord sont activés

---

**Votre bot tournera maintenant 24/7 gratuitement !** 🎉
