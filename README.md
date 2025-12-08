# 🤖 Bot Discord Trading IA

Bot Discord intelligent qui fournit des **prédictions de trading** basées sur l'analyse technique et l'IA pour vous aider à prendre des décisions d'investissement sur **Trade Republic**.

## 🎯 Fonctionnalités

- 📊 **Analyse technique complète** (RSI, MACD, Moyennes Mobiles)
- 🔮 **Prédictions IA** sur les tendances futures
- 💼 **Analyse de portefeuille** Trade Republic
- 🏆 **Top 5 opportunités** du jour par secteur
- 📈 **Watchlist personnalisée** avec alertes automatiques
- ⏰ **Surveillance 24/7** des marchés

## ⚙️ Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- Un compte Discord avec les permissions de créer un bot
- Une clé API Finnhub (gratuite)

### Étape 1 : Créer le Bot Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur **"New Application"**
3. Donnez un nom à votre bot (ex: "Trading AI Bot")
4. Allez dans l'onglet **"Bot"**
5. Cliquez sur **"Add Bot"**
6. **Activez** les options suivantes dans "Privileged Gateway Intents":
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
7. Copiez le **TOKEN** (gardez-le secret!)
8. Allez dans l'onglet **"OAuth2" > "General"**
9. Copiez votre **CLIENT ID**

### Étape 2 : Inviter le Bot sur votre Serveur

1. Allez dans **"OAuth2" > "URL Generator"**
2. Sélectionnez les **scopes**:
   - ✅ bot
   - ✅ applications.commands
3. Sélectionnez les **permissions**:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copiez l'URL générée et ouvrez-la dans votre navigateur
5. Sélectionnez votre serveur et autorisez le bot

### Étape 3 : Obtenir la Clé API Finnhub

1. Inscrivez-vous sur [Finnhub.io](https://finnhub.io/register) (gratuit)
2. Confirmez votre email
3. Copiez votre **clé API** depuis le dashboard

### Étape 4 : Configuration

1. **Clonez ou téléchargez ce projet**

2. **Installez les dépendances:**
   ```powershell
   cd BOT_DISCORD
   npm install
   ```

3. **Créez un fichier `.env`** à partir de `.env.example`:
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Éditez le fichier `.env`** avec vos informations:
   ```env
   DISCORD_TOKEN=votre_token_discord
   CLIENT_ID=votre_client_id
   FINNHUB_API_KEY=votre_cle_finnhub
   ALERT_CHANNEL_ID=id_du_canal_alertes
   ```

   Pour obtenir l'ID d'un canal Discord:
   - Activez le "Mode Développeur" dans Discord (Paramètres > Avancés > Mode développeur)
   - Clic droit sur un canal > Copier l'identifiant du salon

### Étape 5 : Lancement

```powershell
npm start
```

Vous devriez voir: `✅ Bot connecté en tant que [NomDuBot]#1234`

## 📖 Commandes

### `/analyze [symbol]`
Analyse technique complète d'une action

**Exemple:**
```
/analyze AAPL
/analyze TSLA
/analyze NVDA
```

**Informations fournies:**
- Prix actuel et variation
- Plus haut/bas du jour
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Recommandation d'achat/vente

---

### `/predict [symbol]`
Prédiction IA sur l'évolution future d'une action

**Exemple:**
```
/predict AAPL
```

**Informations fournies:**
- Prédiction à 7 jours
- Prédiction à 30 jours
- Niveau de confiance
- Volatilité
- Conseils d'investissement
- Points d'entrée recommandés

---

### `/portfolio [actions]`
Analyse complète de votre portefeuille Trade Republic

**Exemple:**
```
/portfolio AAPL,TSLA,NVDA,MSFT
```

**Informations fournies:**
- Analyse de chaque action
- Recommandations personnalisées
- Vue d'ensemble du portefeuille

---

### `/watchlist [symbol]`
Ajoute une action à votre watchlist personnelle

**Exemple:**
```
/watchlist AAPL
```

Le bot surveillera cette action et vous enverra des alertes automatiques.

---

### `/top [market]`
Top 5 des meilleures opportunités du jour

**Marchés disponibles:**
- `tech` - Technologie
- `energy` - Énergie
- `finance` - Finance
- `all` - Tous les secteurs (par défaut)

**Exemple:**
```
/top tech
/top
```

## 🎓 Comprendre les Indicateurs

### RSI (Relative Strength Index)
- **< 30** : Action survendue → Opportunité d'achat
- **30-70** : Zone neutre
- **> 70** : Action surachetée → Prudence

### MACD
- **Positif** : Momentum haussier
- **Négatif** : Momentum baissier
- **Croisement** : Signal d'achat/vente

### Moyennes Mobiles
- **Prix > SMA20 > SMA50** : Tendance haussière forte
- **Prix < SMA20 < SMA50** : Tendance baissière

## 🚨 Alertes Automatiques

Le bot surveille automatiquement vos actions en watchlist toutes les heures et vous alerte en cas de:
- 📈 Signal d'achat fort
- 📉 Signal de vente
- ⚠️ Volatilité inhabituelle
- 🎯 Prix cible atteint

## ⚠️ Avertissements Importants

> **Ce bot ne fournit PAS de conseils financiers professionnels.**
> 
> Les prédictions sont basées sur l'analyse technique et des algorithmes, mais le marché reste imprévisible.
> 
> **Recommandations:**
> - ✅ Faites vos propres recherches (DYOR)
> - ✅ Ne jamais investir plus que ce que vous pouvez perdre
> - ✅ Diversifiez votre portefeuille
> - ✅ Consultez un conseiller financier pour des décisions importantes
> - ❌ N'investissez jamais basé uniquement sur les prédictions d'un bot

## 🛠️ Développement

### Mode Développement

```powershell
npm run dev
```

Utilise `nodemon` pour redémarrer automatiquement à chaque modification.

### Structure du Projet

```
BOT_DISCORD/
├── bot.js              # Fichier principal du bot
├── analysis.js         # Module d'analyse technique et IA
├── package.json        # Dépendances
├── .env               # Configuration (ne pas partager!)
├── .env.example       # Exemple de configuration
└── README.md          # Documentation
```

## 📊 APIs Utilisées

- **Discord.js v14** - Framework bot Discord
- **Finnhub API** - Données de marché en temps réel (gratuit)

### Limites API Finnhub (plan gratuit)
- 60 requêtes/minute
- Données retardées de ~15 minutes pour certaines actions

Pour des données plus précises, considérez un upgrade vers Finnhub Premium.

## 🐛 Résolution de Problèmes

### Le bot ne se connecte pas
- Vérifiez que le `DISCORD_TOKEN` est correct
- Assurez-vous que les "Privileged Gateway Intents" sont activés

### Commandes slash non visibles
- Attendez quelques minutes (peut prendre jusqu'à 1h)
- Vérifiez que le `CLIENT_ID` est correct
- Réinvitez le bot avec les bonnes permissions

### Erreurs API Finnhub
- Vérifiez votre clé API
- Assurez-vous de ne pas dépasser les limites de requêtes
- Certains symboles peuvent ne pas être disponibles

### Symboles d'actions

Utilisez toujours les symboles **US** (ex: AAPL, TSLA). Pour les actions européennes disponibles sur Trade Republic:
- **SAP** → `SAP` (Frankfurt) ou `SAP.DE`
- **BMW** → `BMW.DE`
- **Siemens** → `SIE.DE`

Consultez [Finnhub Stocks](https://finnhub.io/docs/api/stock-symbols) pour la liste complète.

## 📝 TODO / Améliorations Futures

- [ ] Intégration API Trade Republic (si disponible)
- [ ] Support des cryptomonnaies
- [ ] Backtesting des prédictions
- [ ] Dashboard web pour visualisation
- [ ] Alertes par DM personnalisées
- [ ] Support multi-langues
- [ ] Machine Learning avancé pour prédictions

## 📄 Licence

MIT - Libre d'utilisation et de modification

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou un pull request.

---

**Bon trading! 📈💰**

*N'oubliez pas: Le meilleur investissement est celui que vous comprenez.*
