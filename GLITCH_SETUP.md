# 🚀 Déploiement sur Glitch.com

## ✅ Keep-Alive ajouté !
Le code a été modifié pour empêcher Glitch de mettre le bot en veille.

---

## 📋 Étapes de déploiement

### 1️⃣ Pousser le code sur GitHub

```powershell
git add .
git commit -m "Ajout Keep-Alive pour Glitch"
git push origin master
```

### 2️⃣ Créer un compte Glitch

1. Allez sur https://glitch.com
2. Cliquez sur **"Sign Up"** (en haut à droite)
3. Choisissez **"Sign in with GitHub"**
4. Autorisez Glitch à accéder à votre GitHub

### 3️⃣ Importer votre projet

1. Une fois connecté, cliquez sur **"New Project"** (en haut à droite)
2. Sélectionnez **"Import from GitHub"**
3. Collez l'URL de votre repo : `https://github.com/DylanCOVAREL/BOT-DISCORD`
4. Attendez l'import (peut prendre 1-2 minutes)

### 4️⃣ Configurer les variables d'environnement

1. Dans votre projet Glitch, cliquez sur **".env"** dans la barre latérale gauche
2. Ajoutez ces 7 variables (copiez les valeurs depuis votre fichier local `.env`) :

```env
DISCORD_TOKEN=votre_token_discord_ici
CLIENT_ID=votre_client_id_ici
FINNHUB_API_KEY=votre_clé_finnhub_ici
GEMINI_API_KEY=votre_clé_gemini_ici
ALERT_CHANNEL_ID=votre_channel_id_ici
LOG_CHANNEL_ID=votre_log_channel_id_ici
ADMIN_USER_ID=votre_user_id_ici
```

⚠️ **Important** : Copiez les valeurs EXACTES depuis votre `.env` local !

### 5️⃣ Vérifier package.json

1. Cliquez sur `package.json` dans la barre latérale
2. Vérifiez que le script `"start"` existe :

```json
"scripts": {
  "start": "node bot.js",
  "dev": "nodemon bot.js"
}
```

### 6️⃣ Lancer le bot

1. Le bot démarre automatiquement après l'import !
2. Cliquez sur **"Logs"** (en bas) pour voir l'activité
3. Vous devriez voir :
   - `🌐 Serveur HTTP actif sur le port 3000 (Keep-Alive Glitch)`
   - `✅ Bot connecté en tant que [nom du bot]`
   - `🔍 Analyse automatique démarrée (intervalle: 30 minutes)`

### 7️⃣ Vérifier que le bot est en ligne

1. Allez sur Discord
2. Votre bot devrait être **en ligne** (point vert) 🟢
3. Attendez 30 minutes ou utilisez `/test` pour déclencher une analyse

---

## 🌐 Keep-Alive expliqué

Le serveur HTTP sur le port 3000 empêche Glitch de mettre votre bot en veille après 5 minutes d'inactivité. Glitch détecte l'activité HTTP et garde le bot actif 24/7.

---

## 🔄 Mises à jour futures

Pour mettre à jour le bot après des modifications :

1. Modifiez votre code localement
2. Poussez sur GitHub :
```powershell
git add .
git commit -m "Votre message"
git push origin master
```
3. Dans Glitch, cliquez sur **"Tools"** → **"Import from GitHub"**
4. Le bot redémarrera automatiquement avec les nouveaux changements

---

## 📊 Limites Glitch gratuit

- ✅ **1000 heures/mois** (largement suffisant pour 1 bot)
- ✅ **Pas de carte bancaire requise**
- ✅ **Redémarrage automatique** en cas d'erreur
- ⚠️ Si vous dépassez 1000h, le bot s'arrêtera jusqu'au mois prochain

---

## 🆘 Problèmes courants

### Le bot ne démarre pas
1. Vérifiez les **Logs** dans Glitch
2. Assurez-vous que toutes les variables d'environnement sont bien remplies
3. Vérifiez que votre `DISCORD_TOKEN` est valide

### Le bot est hors ligne sur Discord
1. Vérifiez que les **Intents Discord** sont activés (Privileged Gateway Intents)
2. Allez sur https://discord.com/developers/applications
3. Sélectionnez votre application → **Bot** → Activez tous les **Privileged Gateway Intents**

### Le bot se met en veille
- Le Keep-Alive devrait empêcher ça ! Si ça arrive quand même, vérifiez que le serveur HTTP fonctionne dans les logs.

---

## ✅ C'est fait !

Votre bot Discord tourne maintenant **24/7 gratuitement** sur Glitch ! 🎉

**Pour vérifier** : Tapez `/test` sur Discord pour forcer une analyse immédiate.
