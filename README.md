# 🤖 Bot Discord Trading avec IA

Bot Discord intelligent qui analyse automatiquement 6 actions toutes les heures et fournit des recommandations d'investissement personnalisées grâce à l'IA **Groq (Llama 3.1 70B)**.

## 🎯 Fonctionnalités

- 📊 **Analyse automatique** de 6 actions toutes les heures (7h-23h)
- 🤖 **IA Groq (Llama 3.1 70B)** pour des recommandations intelligentes en 1 phrase
- 🏆 **Prix maximum historique** sur 5 ans pour chaque action
- 📈 **Signaux de tendance** : Très Haussier, Haussier, Stable, Baissier, etc.
- 🌙 **Mode nuit** : Pas d'alertes entre 23h et 7h (sauf commande manuelle)
- 📝 **Logs Discord** avec mention automatique en cas d'erreur
- ⚡ **Commande /test** pour déclencher une analyse immédiate
- 🔄 **Retry automatique** : 3 tentatives si l'IA échoue
- 📉 **Analyse de fallback** basique si l'IA est indisponible

## 📋 Actions surveillées

1. **URTH** - iShares MSCI World ETF
2. **MCD** - McDonald's
3. **TTWO** - Take-Two Interactive
4. **NVDA** - NVIDIA
5. **TSLA** - Tesla

## 🛠️ Technologies utilisées

- **Node.js** v20.10.0
- **Discord.js** v14.14.1 - Framework bot Discord
- **Groq SDK** - IA Llama 3.1 70B (100% gratuit)
- **Finnhub API** - Données boursières en temps réel
- **Axios** - Requêtes HTTP
- **Dotenv** - Gestion des variables d'environnement

## 📦 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/DylanCOVAREL/BOT-DISCORD.git
cd BOT-DISCORD
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Bot Discord
DISCORD_TOKEN=votre_token_discord
CLIENT_ID=votre_client_id

# API Finnhub (données boursières)
FINNHUB_API_KEY=votre_clé_finnhub

# Groq AI (Llama 3.1 70B - 100% GRATUIT)
GEMINI_API_KEY=votre_clé_groq

# Canaux Discord
ALERT_CHANNEL_ID=id_canal_alertes
LOG_CHANNEL_ID=id_canal_logs

# Admin
ADMIN_USER_ID=votre_id_discord
```

### 4. Obtenir les clés API

#### Discord Bot
1. Allez sur https://discord.com/developers/applications
2. Créez une application
3. Dans **Bot**, copiez le **Token**
4. Dans **OAuth2 > General**, copiez le **Client ID**
5. Activez **Privileged Gateway Intents** (Server Members, Message Content)

#### Finnhub API
1. Allez sur https://finnhub.io/register
2. Créez un compte gratuit
3. Copiez votre **API Key**

#### Groq AI (Recommandé)
1. Allez sur https://console.groq.com
2. Créez un compte gratuit (pas de CB requise)
3. Dans **API Keys**, créez une clé
4. Copiez la clé (format : `gsk_...`)

📖 **Guide détaillé** : Voir `SETUP_GROQ.md`

### 5. Lancer le bot

```bash
node bot.js
```

Ou en mode développement avec redémarrage automatique :

```bash
npm start
```

## 🚀 Déploiement (24/7 gratuit)

Le bot peut être hébergé gratuitement sur **Railway.app** :

1. **Créez un compte** sur https://railway.app
2. **Connectez votre repo GitHub**
3. **Ajoutez les variables d'environnement**
4. **Déployez** !

📖 **Guide détaillé** : Voir `DEPLOY_RENDER.md`

## 🎮 Commandes Discord

- `/test` - Lance immédiatement un cycle d'analyse (bypass le mode nuit)

## 📊 Format des alertes

Chaque action affiche :

```
📈 NVIDIA (NVDA)
Analyse automatique • NVIDIA Corporation

💰 Prix Actuel: $875.32
📊 Variation 24h: +2.45%
🎯 Signal: 📈 Haussier
🏆 Plus Haut (5 ans): $950.12 (-7.87%)
🤖 Recommandation IA: **ACHETER** - Forte tendance haussière sur l'IA

🤖 Analyse IA Groq • Gratuit
```

## 🌙 Mode Nuit

- **Actif** : 23h → 7h (heure locale du serveur)
- **Désactivé** : Automatiquement de 7h → 23h
- **Bypass** : La commande `/test` fonctionne toujours

## 📈 Signaux de tendance

| Signal | Variation | Signification |
|--------|-----------|---------------|
| 🚀 Très Haussier | +5% et plus | Forte hausse confirmée |
| 📈 Haussier | +2% à +5% | Tendance positive |
| ➕ Légèrement Positif | +0.5% à +2% | Petite hausse |
| ⚪ Stable | -0.5% à +0.5% | Pas de mouvement |
| ➖ Légèrement Négatif | -0.5% à -2% | Petite baisse |
| 📉 Baissier | -2% à -5% | Tendance négative |
| 💥 Très Baissier | -5% et moins | Forte chute |

## 🤖 Système d'IA

### Groq (Llama 3.1 70B)
- ✅ **Ultra rapide** : <1 seconde par analyse
- ✅ **100% gratuit** : 14 400 requêtes/jour
- ✅ **Très stable** : 99.9% uptime
- ✅ **Intelligent** : Meilleur modèle open-source

### Fallback automatique
Si l'IA échoue après 3 tentatives, analyse basique :
- **+3%** → ACHETER
- **+1%** → CONSERVER (positif)
- **-1%** → SURVEILLER
- **-3%** → VENDRE

## 🔧 Structure du projet

```
BOT_DISCORD/
├── bot.js              # Fichier principal du bot
├── aiAnalysis.js       # Intégration Groq AI
├── package.json        # Dépendances Node.js
├── .env                # Variables d'environnement (à créer)
├── .env.example        # Template pour .env
├── .gitignore          # Fichiers ignorés par Git
├── Procfile            # Configuration déploiement
├── README.md           # Ce fichier
├── SETUP_GROQ.md       # Guide configuration Groq
├── DEPLOY_RENDER.md    # Guide déploiement gratuit
└── GLITCH_SETUP.md     # Alternative hébergement
```

## 📝 Logs Discord

Le bot envoie des logs détaillés dans un canal dédié :

- ℹ️ **Info** : Démarrage, cycles d'analyse
- ✅ **Succès** : Connexion, commandes enregistrées
- ⚠️ **Avertissement** : Mode nuit actif
- ❌ **Erreur** : Problèmes API, erreurs critiques (mentionne l'admin)

## 🔒 Sécurité

- ✅ Toutes les clés API sont dans `.env` (pas versionné)
- ✅ `.gitignore` configuré pour protéger les secrets
- ✅ Pas de clés hardcodées dans le code
- ✅ Template `.env.example` fourni

## 🆘 Dépannage

### Le bot ne démarre pas
- Vérifiez que toutes les variables dans `.env` sont renseignées
- Vérifiez que Node.js v18+ est installé : `node --version`
- Réinstallez les dépendances : `npm install`

### L'IA ne fonctionne pas
- Vérifiez votre clé Groq (doit commencer par `gsk_`)
- Consultez le guide `SETUP_GROQ.md`
- Vérifiez les logs dans le canal Discord

### Le bot est hors ligne sur Discord
- Activez **Privileged Gateway Intents** dans Discord Developer Portal
- Vérifiez que le `DISCORD_TOKEN` est correct
- Redémarrez le bot

### Erreurs "404 NotFound"
- Ancienne erreur Gemini, maintenant résolue avec Groq
- Assurez-vous d'avoir installé `groq-sdk` : `npm install`

## 📚 Documentation complémentaire

- [Configuration Groq AI](SETUP_GROQ.md)
- [Déploiement gratuit](DEPLOY_RENDER.md)
- [Alternative Glitch](GLITCH_SETUP.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des nouvelles fonctionnalités
- Soumettre des Pull Requests

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 👨‍💻 Auteur

Créé pour automatiser l'analyse d'actions sur Trade Republic avec l'aide de l'IA.

---

**⚡ Propulsé par Groq (Llama 3.1 70B) - L'IA la plus rapide du marché !**
