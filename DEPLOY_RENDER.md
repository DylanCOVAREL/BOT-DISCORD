# 🚀 Hébergement Gratuit pour Bot Discord

## ⚠️ Render.com n'est PLUS gratuit ($7/mois)

Voici les **vraies** alternatives **100% gratuites** :

---

# 🥇 Option 1 : Glitch.com (RECOMMANDÉ)

## ✅ Avantages
- 100% gratuit
- Facile à configurer
- Pas de carte bancaire requise
- 1000h/mois (largement suffisant)

## 📋 Étapes

### 1. Créer un compte
1. Allez sur https://glitch.com
2. Cliquez sur **"Sign Up"**
3. Connectez-vous avec **GitHub**

### 2. Importer votre projet
1. Cliquez sur **"New Project"** → **"Import from GitHub"**
2. Collez l'URL de votre repo : `https://github.com/DylanCOVAREL/BOT-DISCORD`
3. Attendez l'import

### 3. Configuration
1. Cliquez sur **".env"** dans la barre latérale
2. Ajoutez vos variables d'environnement :

```
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_client_id
FINNHUB_API_KEY=votre_clé_finnhub
GEMINI_API_KEY=votre_clé_gemini
ALERT_CHANNEL_ID=votre_channel_id
LOG_CHANNEL_ID=votre_log_channel_id
ADMIN_USER_ID=votre_user_id
```

### 4. Modifier package.json
Cliquez sur `package.json` et changez le script start :

```json
"scripts": {
  "start": "node bot.js",
  "dev": "nodemon bot.js"
}
```

### 5. Lancer le bot
Le bot démarre automatiquement ! Cliquez sur **"Logs"** pour voir l'activité.

### ⚠️ Keep-Alive pour Glitch
Glitch met en veille après 5 min d'inactivité. Ajoutez ce code au début de `bot.js` :

```javascript
// Keep-Alive pour Glitch
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(3000);
```

---

# 🥈 Option 2 : Railway.app

## ✅ Avantages
- $5 de crédit gratuit/mois (largement suffisant pour 1 bot)
- Pas de mise en veille
- Deploy automatique depuis GitHub

## 📋 Étapes

### 1. Créer un compte
1. Allez sur https://railway.app
2. Cliquez sur **"Login"** → **"Login with GitHub"**

### 2. Nouveau projet
1. Cliquez sur **"New Project"**
2. Sélectionnez **"Deploy from GitHub repo"**
3. Choisissez **"BOT-DISCORD"**

### 3. Variables d'environnement
1. Allez dans l'onglet **"Variables"**
2. Ajoutez les 7 variables d'environnement (comme pour Glitch)

### 4. Deploy
Railway va automatiquement :
- Installer les dépendances
- Lancer le bot
- Le garder en ligne 24/7

---

# 🥉 Option 3 : Heroku (avec carte bancaire)

## ⚠️ Nécessite une carte bancaire (mais gratuit)

1. Allez sur https://heroku.com
2. Créez un compte avec votre carte bancaire (pas de frais)
3. Installez Heroku CLI :

```powershell
winget install Heroku.HerokuCLI
```

4. Connectez-vous :
```powershell
heroku login
```

5. Créez l'app :
```powershell
cd C:\Users\dylan\OneDrive\Documents\PERSO\Trading\BOT_DISCORD
heroku create votre-nom-bot
```

6. Ajoutez les variables :
```powershell
heroku config:set DISCORD_TOKEN=votre_token
heroku config:set CLIENT_ID=votre_client_id
heroku config:set FINNHUB_API_KEY=votre_clé
heroku config:set GEMINI_API_KEY=votre_clé
heroku config:set ALERT_CHANNEL_ID=votre_id
heroku config:set LOG_CHANNEL_ID=votre_id
heroku config:set ADMIN_USER_ID=votre_id
```

7. Déployez :
```powershell
git push heroku master
```

---

# 🏆 Recommandation

**Je recommande Glitch.com** car :
- ✅ 100% gratuit sans carte bancaire
- ✅ Interface simple
- ✅ Import direct depuis GitHub
- ✅ Logs en temps réel

**Railway.app** est aussi excellent si vous préférez quelque chose de plus pro.

---

## 🆘 Besoin d'aide ?

Dites-moi quelle option vous choisissez et je vous guide étape par étape ! 🚀
